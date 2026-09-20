/**
 * 角色发言失败卡 + 原地重试（host 冒烟）：失败回合挂在角色消息上，
 * retrySpeak 覆盖同一条；对话进行中拒绝；角色删除后不可重试。
 */
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

async function until(cond: () => boolean, ms = 5000): Promise<void> {
  const deadline = Date.now() + ms
  while (Date.now() < deadline) {
    if (cond()) return
    await sleep(20)
  }
  throw new Error('等待超时')
}

interface StreamChunk { type: string, [key: string]: unknown }

type Service = import('../src/host/service.ts').GroupChatService

interface Env {
  svc: Service
  storeDir: string
  pushPlan: (rounds: StreamChunk[]) => void
  hang: () => () => void
  lastPrompt: () => string
}

let env: Env | null = null

beforeAll(async () => {
  const storeDir = mkdtempSync(join(tmpdir(), 'dsgc-retry-'))
  mkdirSync(join(storeDir, 'grp-a', 'sessions'), { recursive: true })
  writeFileSync(join(storeDir, 'grp-a', 'roles.json'), JSON.stringify({ schema: 1, roles: [] }))
  writeFileSync(join(storeDir, 'ledger.json'), JSON.stringify({
    schema: 3,
    groups: [{ id: 'grp-a', name: 'A', permissionTier: 'view_only' }],
    sessions: [{ id: 's-a', groupId: 'grp-a' }],
  }, null, 2))
  writeFileSync(join(storeDir, 'grp-a', 'sessions', 'session-s-a.json'), JSON.stringify({ schema: 1, name: 'SA', messages: [] }))
  process.env.DSH_GROUP_CHAT_STORE = storeDir
  const { createGroupChatService } = await import('../src/host/service.ts')
  const queue: StreamChunk[][] = []
  let gate: Promise<void> = Promise.resolve()
  let lastPrompt = ''
  const llm = {
    listProviders: async () => [],
    listModels: async () => [],
    resolveModelInfo: async () => null,
    stream: async function* (opts: { messages?: unknown }): AsyncGenerator<StreamChunk> {
      lastPrompt = JSON.stringify(opts && opts.messages || [])
      await gate
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
  const ctx = { llm, fs, workspaceRegistry: { list: async () => [] } } as unknown as import('@deepseek-ai/cordis').Context
  const svc = createGroupChatService(ctx)
  await svc.handleAction({ kind: 'mutate', op: 'upsertRole', groupId: 'grp-a', role: { name: '产品经理', provider: 'p', model: 'm' } })
  env = {
    svc,
    storeDir,
    pushPlan: (rounds) => { queue.push(rounds) },
    hang: () => {
      let release: () => void = () => {}
      gate = new Promise<void>((resolve) => { release = resolve })
      return () => {
        release()
        gate = Promise.resolve()
      }
    },
    lastPrompt: () => lastPrompt,
  }
})

afterAll(async () => {
  if (env) {
    await env.svc.dispose()
    rmSync(env.storeDir, { recursive: true, force: true })
    env = null
  }
})

describe('发言失败卡与原地重试', () => {
  it('error finish → 角色消息 error+failedRoleId，不是系统胶囊', async () => {
    env!.pushPlan([{ type: 'finish', reason: { kind: 'error', failure: { message: '429: {"code":"AccountQuotaExceeded","message":"quota","type":"TooManyRequests"}' } } }])
    const send = await env!.svc.handleAction({ kind: 'send', sessionId: 's-a', text: '开始' }) as { ok: boolean }
    expect(send.ok).toBe(true)
    await until(() => !env!.svc.snapshot().run.running)
    const snap = env!.svc.snapshot()
    const fail = snap.messages.filter((m) => m.error)
    expect(fail).toHaveLength(1)
    expect(fail[0].speaker).not.toBe('system')
    expect(fail[0].speaker).toBe(fail[0].failedRoleId)
    expect(fail[0].text).toContain('AccountQuotaExceeded')
    expect(fail[0].text.startsWith('角色「')).toBe(false)
    expect(snap.run.finished).toEqual({ sessionId: 's-a', reason: 'error' })
  })

  it('retrySpeak 成功 → 同一条消息被覆盖成正常发言', async () => {
    const before = env!.svc.snapshot()
    const fail = before.messages.find((m) => m.error)!
    const count = before.messages.length
    env!.pushPlan([{ type: 'text-delta', text: '改用备选方案' }, { type: 'finish', reason: { kind: 'stop' } }])
    const res = await env!.svc.handleAction({ kind: 'retrySpeak', sessionId: 's-a', messageId: fail.id }) as { ok: boolean }
    expect(res.ok).toBe(true)
    await until(() => !env!.svc.snapshot().run.running)
    const snap = env!.svc.snapshot()
    expect(snap.messages).toHaveLength(count)
    const same = snap.messages.find((m) => m.id === fail.id)!
    expect(same.error).toBeFalsy()
    expect(same.failedRoleId).toBeFalsy()
    expect(same.text).toBe('改用备选方案')
    expect(same.speaker).toBe(fail.speaker)
  })

  it('重试只注入失败卡之前的记录，不含后续消息', async () => {
    env!.pushPlan([{ type: 'finish', reason: { kind: 'error', failure: { message: 'mid-fail' } } }])
    await env!.svc.handleAction({ kind: 'send', sessionId: 's-a', text: '先失败' })
    await until(() => !env!.svc.snapshot().run.running)
    const fail = env!.svc.snapshot().messages.find((m) => m.error)!
    expect(fail).toBeTruthy()
    env!.pushPlan([{ type: 'text-delta', text: '后续发言UNIQUE' }, { type: 'finish', reason: { kind: 'stop' } }])
    await env!.svc.handleAction({ kind: 'send', sessionId: 's-a', text: '后面发生的事UNIQUE' })
    await until(() => !env!.svc.snapshot().run.running)
    env!.pushPlan([{ type: 'text-delta', text: '补上这一轮' }, { type: 'finish', reason: { kind: 'stop' } }])
    const res = await env!.svc.handleAction({ kind: 'retrySpeak', sessionId: 's-a', messageId: fail.id }) as { ok: boolean }
    expect(res.ok).toBe(true)
    await until(() => !env!.svc.snapshot().run.running)
    const prompt = env!.lastPrompt()
    expect(prompt).toContain('先失败')
    expect(prompt).not.toContain('后面发生的事UNIQUE')
    expect(prompt).not.toContain('后续发言UNIQUE')
    const same = env!.svc.snapshot().messages.find((m) => m.id === fail.id)!
    expect(same.text).toBe('补上这一轮')
    expect(same.error).toBeFalsy()
  })

  it('对话进行中拒绝重试', async () => {
    env!.pushPlan([{ type: 'finish', reason: { kind: 'error', failure: { message: 'boom' } } }])
    await env!.svc.handleAction({ kind: 'send', sessionId: 's-a', text: '再来一轮' })
    await until(() => !env!.svc.snapshot().run.running)
    const fail = env!.svc.snapshot().messages.find((m) => m.error)!
    const release = env!.hang()
    void env!.svc.handleAction({ kind: 'send', sessionId: 's-a', text: '并行' })
    await until(() => env!.svc.snapshot().run.running)
    const busy = await env!.svc.handleAction({ kind: 'retrySpeak', sessionId: 's-a', messageId: fail.id }) as { ok: boolean, error?: string }
    expect(busy.ok).toBe(false)
    expect(busy.error).toContain('进行中')
    release()
    await until(() => !env!.svc.snapshot().run.running)
  })

  it('角色删除后不可重试', async () => {
    let fail = env!.svc.snapshot().messages.find((m) => m.error)
    if (!fail) {
      env!.pushPlan([{ type: 'finish', reason: { kind: 'error', failure: { message: 'gone' } } }])
      await env!.svc.handleAction({ kind: 'send', sessionId: 's-a', text: '再失败一次' })
      await until(() => !env!.svc.snapshot().run.running)
      fail = env!.svc.snapshot().messages.find((m) => m.error)
    }
    expect(fail).toBeTruthy()
    const roleId = fail!.failedRoleId || fail!.speaker
    await env!.svc.handleAction({ kind: 'mutate', op: 'deleteRole', roleId })
    const res = await env!.svc.handleAction({ kind: 'retrySpeak', sessionId: 's-a', messageId: fail!.id }) as { ok: boolean, error?: string }
    expect(res.ok).toBe(false)
    expect(res.error).toContain('不存在')
  })
})
