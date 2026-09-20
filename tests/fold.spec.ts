/**
 * 窗口外约束折叠冒烟：整次 runLoop 后后台折叠、立刻 idle、失败不推水位、
 * 清空双清、快照不推水位。独立 store 目录，避免与 retitle.spec 抢锁。
 */
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

async function until(cond: () => boolean, ms = 8000): Promise<void> {
  const deadline = Date.now() + ms
  while (Date.now() < deadline) {
    if (cond()) return
    await sleep(20)
  }
  throw new Error('等待超时')
}

/** 轮询读取 JSON 文件直到断言通过（flush 异步化后 sleep+直读有竞态）。 */
async function untilDoc<T>(file: string, pred: (doc: T) => boolean, ms = 8000): Promise<T> {
  const deadline = Date.now() + ms
  for (;;) {
    const doc = JSON.parse(readFileSync(file, 'utf8')) as T
    if (pred(doc)) return doc
    if (Date.now() > deadline) throw new Error('等待落盘超时：' + file)
    await sleep(20)
  }
}

interface StreamChunk { type: string, [key: string]: unknown }

type Service = import('../src/host/service.ts').GroupChatService

interface SnapSess {
  id: string
  constraints?: { kind: string, text: string }[]
  constraintsUpToSeq?: number
  messageIds: string[]
}

interface Env {
  svc: Service
  storeDir: string
  calls: number
  lastPurpose: string | undefined
  setDefaultModel: (sel: { provider: string, model: string } | null) => void
  pushPlan: (rounds: StreamChunk[]) => void
}

let env: Env | null = null

beforeAll(async () => {
  const storeDir = mkdtempSync(join(tmpdir(), 'dsgc-fold-'))
  mkdirSync(join(storeDir, 'grp-a', 'sessions'), { recursive: true })
  writeFileSync(join(storeDir, 'grp-a', 'roles.json'), JSON.stringify({ schema: 1, roles: [] }))
  writeFileSync(join(storeDir, 'ledger.json'), JSON.stringify({
    schema: 3,
    groups: [{ id: 'grp-a', name: 'A', permissionTier: 'view_only' }],
    sessions: [{ id: 's-a', groupId: 'grp-a' }],
  }))
  const seed = Array.from({ length: 40 }, (_, i) => ({
    id: 'old-' + (i + 1),
    speaker: i % 2 === 0 ? 'user' : 'role-seed',
    text: i % 2 === 0 ? '用户意见 ' + (i + 1) : '角色看法 ' + (i + 1),
    seq: i + 1,
    ts: i + 1,
  }))
  writeFileSync(join(storeDir, 'grp-a', 'sessions', 'session-s-a.json'), JSON.stringify({
    schema: 1,
    name: 'SA',
    topic: '',
    messages: seed,
  }))
  process.env.DSH_GROUP_CHAT_STORE = storeDir
  const { createGroupChatService } = await import('../src/host/service.ts')
  const queue: StreamChunk[][] = []
  let defaultModel: { provider: string, model: string } | null = null
  let calls = 0
  let lastPurpose: string | undefined
  const llm = {
    listProviders: async () => [],
    listModels: async () => [],
    resolveModelInfo: async () => null,
    stream: async function* (opts?: { purpose?: string }): AsyncGenerator<StreamChunk> {
      calls++
      lastPurpose = opts?.purpose
      const plan = queue.shift() || [{ type: 'text-delta', text: '好的' }, { type: 'finish', reason: { kind: 'stop' } }]
      for (const chunk of plan) yield chunk
    },
  }
  const fs = {
    resolve: async (p: string) => p,
    stat: async () => ({ type: 'directory' }),
    listDir: async () => [],
    readText: async () => '',
    processPath: (p: string) => p,
  }
  const ctx = new Proxy({
    llm,
    fs,
    workspaceRegistry: { list: async () => [] },
    reflect: {
      get: (name: string): unknown =>
        name === 'agentDefaultModel'
          ? (defaultModel ? { currentSelection: () => defaultModel } : undefined)
          : undefined,
    },
  }, {
    get(t, prop) {
      if (prop === 'agentDefaultModel') throw new Error('cannot get property "agentDefaultModel" without inject')
      const v = Reflect.get(t, prop)
      return typeof v === 'function' ? v.bind(t) : v
    },
  }) as unknown as import('@deepseek-ai/cordis').Context
  const svc = createGroupChatService(ctx)
  await svc.handleAction({ kind: 'mutate', op: 'upsertRole', groupId: 'grp-a', role: { name: '工程师', provider: 'p', model: 'm' } })
  // 钉死名称/主题，避免 retitle 与 fold 争抢同一条 llm 计划
  await svc.handleAction({ kind: 'mutate', op: 'renameSession', sessionId: 's-a', name: '固定名' })
  await svc.handleAction({ kind: 'mutate', op: 'setTopic', sessionId: 's-a', topic: '固定主题' })
  env = {
    svc,
    storeDir,
    get calls() { return calls },
    get lastPurpose() { return lastPurpose },
    setDefaultModel: (sel) => { defaultModel = sel },
    pushPlan: (rounds) => { queue.push(rounds) },
  }
})

afterAll(async () => { if (env) { await env.svc.dispose(); env = null } })

const foldRound = (items: { kind: string, text: string }[]): StreamChunk[] => [
  { type: 'text-delta', text: '```json\n{"constraints":' + JSON.stringify(items) + '}\n```' },
  { type: 'finish', reason: { kind: 'stop' } },
]

const sessionOf = (e: Env): SnapSess => {
  const snap = e.svc.snapshot() as unknown as { sessions: SnapSess[] }
  return snap.sessions.find((s) => s.id === 's-a')!
}

describe('窗口外约束折叠', () => {
  it('run 立刻 idle；折叠成功后快照有 constraints、无水位；purpose 为 session-title', async () => {
    const e = env!
    e.setDefaultModel({ provider: 'dp', model: 'dm' })
    const before = e.calls
    e.pushPlan([{ type: 'text-delta', text: '同意用 Redis。' }, { type: 'finish', reason: { kind: 'stop' } }])
    e.pushPlan(foldRound([{ kind: 'decided', text: '采用 Redis' }]))
    const send = await e.svc.handleAction({ kind: 'send', sessionId: 's-a', text: '就用 Redis' }) as { ok: boolean }
    expect(send.ok).toBe(true)
    await until(() => e.svc.snapshot().run.running === false)
    await until(() => (sessionOf(e).constraints || []).some((c) => c.text === '采用 Redis'))
    expect(e.calls).toBeGreaterThanOrEqual(before + 2)
    expect(e.lastPurpose).toBe('session-title')
    const live = sessionOf(e)
    expect(live.constraintsUpToSeq).toBeUndefined()
    const doc = await untilDoc<{
      constraints?: { kind: string, text: string }[]
      constraintsUpToSeq?: number
    }>(join(e.storeDir, 'grp-a', 'sessions', 'session-s-a.json'), (d) => Array.isArray(d.constraints) && d.constraints.some((c) => c.text === '采用 Redis') && typeof d.constraintsUpToSeq === 'number' && d.constraintsUpToSeq > 0)
    expect(doc.constraints).toEqual([{ kind: 'decided', text: '采用 Redis' }])
    expect(doc.constraintsUpToSeq).toBeGreaterThan(0)
  })

  it('解析失败不推水位：同批挤出仍会再折一次', async () => {
    const e = env!
    const before = e.calls
    e.pushPlan([{ type: 'text-delta', text: '继续。' }, { type: 'finish', reason: { kind: 'stop' } }])
    e.pushPlan([{ type: 'text-delta', text: '这不是 JSON' }, { type: 'finish', reason: { kind: 'stop' } }])
    const send = await e.svc.handleAction({ kind: 'send', sessionId: 's-a', text: '再补一句' }) as { ok: boolean }
    expect(send.ok).toBe(true)
    await until(() => e.svc.snapshot().run.running === false)
    await until(() => e.calls >= before + 2)
    await sleep(80)
    expect(sessionOf(e).constraints).toEqual([{ kind: 'decided', text: '采用 Redis' }])
    e.pushPlan([{ type: 'text-delta', text: '好。' }, { type: 'finish', reason: { kind: 'stop' } }])
    e.pushPlan(foldRound([{ kind: 'decided', text: '采用 Redis' }, { kind: 'open', text: '本地 KV 未比完' }]))
    const send2 = await e.svc.handleAction({ kind: 'send', sessionId: 's-a', text: '再折' }) as { ok: boolean }
    expect(send2.ok).toBe(true)
    await until(() => (sessionOf(e).constraints || []).length === 2)
  })

  it('清空消息同时清备忘与水位', async () => {
    const e = env!
    await e.svc.handleAction({ kind: 'mutate', op: 'clearMessages', sessionId: 's-a' })
    const live = sessionOf(e)
    expect(live.messageIds).toEqual([])
    expect(live.constraints).toBeUndefined()
    const doc = await untilDoc<{
      constraints?: unknown
      constraintsUpToSeq?: unknown
      messages: unknown[]
    }>(join(e.storeDir, 'grp-a', 'sessions', 'session-s-a.json'), (d) => Array.isArray(d.messages) && d.messages.length === 0 && d.constraints === undefined && d.constraintsUpToSeq === undefined)
    expect(doc.messages).toEqual([])
    expect(doc.constraints).toBeUndefined()
    expect(doc.constraintsUpToSeq).toBeUndefined()
  })
})
