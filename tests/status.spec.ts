/**
 * 会话状态标识（host 冒烟）：run 结束置位 finished（ok/error）、ackFinish
 * 查看即清、新 run 启动覆盖、删除会话清理悬空标记。
 * stub llm（可控 chunk 发射器）+ stub fs；独立 store 目录（与 service.spec 隔离）。
 */
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/** 轮询直到条件满足或超时（默认 5s）。 */
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
type Snap = ReturnType<Service['snapshot']>

interface Env {
  svc: Service
  storeDir: string
  /** 压入一轮 chunk 计划；llm stub 按队列消费，空则回退纯文本收尾。 */
  pushPlan: (rounds: StreamChunk[]) => void
}

let env: Env | null = null

beforeAll(async () => {
  const storeDir = mkdtempSync(join(tmpdir(), 'dsgc-status-'))
  mkdirSync(join(storeDir, 'grp-a', 'sessions'), { recursive: true })
  writeFileSync(join(storeDir, 'grp-a', 'roles.json'), JSON.stringify({ schema: 1, roles: [] }))
  writeFileSync(join(storeDir, 'ledger.json'), JSON.stringify({
    schema: 3,
    groups: [{ id: 'grp-a', name: 'A', permissionTier: 'view_only' }],
    sessions: [{ id: 's-a', groupId: 'grp-a' }, { id: 's-b', groupId: 'grp-a' }],
  }, null, 2))
  for (const sid of ['s-a', 's-b']) {
    writeFileSync(join(storeDir, 'grp-a', 'sessions', 'session-' + sid + '.json'), JSON.stringify({ schema: 1, name: sid.toUpperCase(), messages: [] }))
  }
  process.env.DSH_GROUP_CHAT_STORE = storeDir
  const { createGroupChatService } = await import('../src/host/service.ts')
  const queue: StreamChunk[][] = []
  const llm = {
    listProviders: async () => [],
    listModels: async () => [],
    resolveModelInfo: async () => null,
    stream: async function* (): AsyncGenerator<StreamChunk> {
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
  await svc.handleAction({ kind: 'mutate', op: 'upsertRole', groupId: 'grp-a', role: { name: '工程师', provider: 'p', model: 'm' } })
  env = { svc, storeDir, pushPlan: (rounds) => { queue.push(rounds) } }
})

afterAll(() => {
  if (env) {
    env.svc.dispose()
    rmSync(env.storeDir, { recursive: true, force: true }) // 清理本文件的临时 store 目录
    env = null
  }
})

/** 等一轮 send 在指定会话跑完。 */
async function runOn(sessionId: string, text: string): Promise<void> {
  const send = await env!.svc.handleAction({ kind: 'send', sessionId, text }) as { ok: boolean }
  expect(send.ok).toBe(true)
  await until(() => !env!.svc.snapshot().run.running)
}

describe('会话状态标识（host 冒烟，顺序场景）', () => {
  it('初始无 finished 标记', () => {
    expect(env!.svc.snapshot().run.finished).toBeNull()
  })

  it('run 正常结束 → finished 置位（sessionId + reason ok）', async () => {
    await runOn('s-a', '第一轮')
    const run = env!.svc.snapshot().run
    expect(run.running).toBe(false)
    expect(run.finished).toEqual({ sessionId: 's-a', reason: 'ok' })
  })

  it('发言失败（error finish）→ finished.reason 为 error', async () => {
    env!.pushPlan([{ type: 'finish', reason: { kind: 'error' } }])
    await runOn('s-b', '会失败的一轮')
    expect(env!.svc.snapshot().run.finished).toEqual({ sessionId: 's-b', reason: 'error' })
  })

  it('ackFinish 查看即清；无标记时幂等无变化', async () => {
    await env!.svc.handleAction({ kind: 'mutate', op: 'ackFinish' })
    expect(env!.svc.snapshot().run.finished).toBeNull()
    // 幂等：再次 ack 不报错、不产生新状态
    const res = await env!.svc.handleAction({ kind: 'mutate', op: 'ackFinish' }) as { snapshot: Snap }
    expect(res.snapshot.run.finished).toBeNull()
  })

  it('新 run 启动即清除旧 finished；结束后重新置位', async () => {
    await runOn('s-a', '第二轮') // 结束后 finished → s-a
    expect(env!.svc.snapshot().run.finished!.sessionId).toBe('s-a')
    env!.pushPlan([{ type: 'text-delta', text: 'ok' }, { type: 'finish', reason: { kind: 'stop' } }])
    const send = await env!.svc.handleAction({ kind: 'send', sessionId: 's-b', text: '第三轮' }) as { ok: boolean }
    expect(send.ok).toBe(true)
    // send 同步清除旧标记（新输出覆盖旧未读）
    expect(env!.svc.snapshot().run.finished).toBeNull()
    await until(() => !env!.svc.snapshot().run.running)
    expect(env!.svc.snapshot().run.finished).toEqual({ sessionId: 's-b', reason: 'ok' })
  })

  it('删除会话时清理指向它的 finished 标记', async () => {
    // 当前 finished → s-b；删除 s-b（grp-a 还剩 s-a，满足至少一个）
    await env!.svc.handleAction({ kind: 'mutate', op: 'deleteSession', sessionId: 's-b' })
    expect(env!.svc.snapshot().run.finished).toBeNull()
  })
})
