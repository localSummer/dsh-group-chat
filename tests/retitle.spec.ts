/**
 * 会话标题/主题自动整理（retitle）冒烟测试：
 *  - 每轮结束后用 DSH 默认模型后台生成「emoji 对象｜目标」名称 + 演进式主题
 *  - 手动编辑过的字段（renameSession / setTopic）永久跳过（隐式固定）
 *  - 默认模型服务缺位时静默跳过
 *  - ctx 以 Proxy 模拟 cordis 语义（未 inject 属性访问抛错），可选服务只能
 *    经 reflect.get 读取——回归「直接属性访问被吞、标题从不生成」的 bug
 * stub llm（chunk 计划队列）+ stub fs + 可开关的 agentDefaultModel。
 */
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
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
  calls: number
  /** 最近一次 llm stream 调用的 opts（maxTokens/purpose 等断言用）。 */
  lastOpts: { maxTokens?: number, provider?: string, model?: string, purpose?: string } | null
  setDefaultModel: (sel: { provider: string, model: string } | null) => void
  pushPlan: (rounds: StreamChunk[]) => void
}

let env: Env | null = null

beforeAll(async () => {
  const storeDir = mkdtempSync(join(tmpdir(), 'dsgc-retitle-'))
  mkdirSync(join(storeDir, 'grp-a', 'sessions'), { recursive: true })
  writeFileSync(join(storeDir, 'grp-a', 'roles.json'), JSON.stringify({ schema: 1, roles: [] }))
  writeFileSync(join(storeDir, 'ledger.json'), JSON.stringify({ schema: 3, groups: [{ id: 'grp-a', name: 'A', sessionIds: ['s-a'] }], sessions: [{ id: 's-a', groupId: 'grp-a' }] }))
  writeFileSync(join(storeDir, 'grp-a', 'sessions', 'session-s-a.json'), JSON.stringify({ schema: 1, name: 'SA', messages: [] }))
  process.env.DSH_GROUP_CHAT_STORE = storeDir
  const { createGroupChatService } = await import('../src/host/service.ts')
  const queue: StreamChunk[][] = []
  let defaultModel: { provider: string, model: string } | null = null
  let calls = 0
  /** 最近一次 stream 调用的 opts（命名调用断言用）。 */
  let lastOpts: { maxTokens?: number, provider?: string, model?: string, purpose?: string } | null = null
  const llm = {
    listProviders: async () => [],
    listModels: async () => [],
    resolveModelInfo: async () => null,
    stream: async function* (opts?: { maxTokens?: number, provider?: string, model?: string, purpose?: string }): AsyncGenerator<StreamChunk> {
      calls++
      lastOpts = opts || null
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
    // 可选服务经 reflect.get 读取（cordis 正规可选消费面）
    reflect: {
      get: (name: string): unknown =>
        name === 'agentDefaultModel'
          ? (defaultModel ? { currentSelection: () => defaultModel } : undefined)
          : undefined,
    },
  }, {
    // 模拟 cordis 代理语义：未 inject 的服务直接属性访问抛错（生产环境真实
    // 行为）——回归「ctx.agentDefaultModel?. 被吞、retitle 静默跳过」的 bug
    get(t, prop) {
      if (prop === 'agentDefaultModel') throw new Error('cannot get property "agentDefaultModel" without inject')
      const v = Reflect.get(t, prop)
      return typeof v === 'function' ? v.bind(t) : v
    },
  }) as unknown as import('@deepseek-ai/cordis').Context
  const svc = createGroupChatService(ctx)
  await svc.handleAction({ kind: 'mutate', op: 'upsertRole', groupId: 'grp-a', role: { name: '工程师', provider: 'p', model: 'm' } })
  env = {
    svc,
    storeDir,
    get calls() { return calls },
    /** 最近一次 llm stream 调用的 opts（maxTokens 预算等断言用）。 */
    get lastOpts() { return lastOpts },
    setDefaultModel: (sel) => { defaultModel = sel },
    pushPlan: (rounds) => { queue.push(rounds) },
  }
})

afterAll(() => { if (env) { env.svc.dispose(); env = null } })

/** 模型返回的命名 JSON chunk 计划。 */
const titleRound = (name: string, topic: string): StreamChunk[] => [
  { type: 'text-delta', text: '```json\n{"name": "' + name + '", "topic": "' + topic + '"}\n```' },
  { type: 'finish', reason: { kind: 'stop' } },
]

const sessionOf = (e: Env): { name: string, topic: string } => {
  const snap = e.svc.snapshot() as unknown as { sessions: { id: string, name: string, topic: string }[] }
  return snap.sessions.find((s) => s.id === 's-a')!
}

describe('会话标题/主题自动整理', () => {
  it('每轮结束后按默认模型输出更新名称与主题，并落盘', async () => {
    const e = env!
    e.setDefaultModel({ provider: 'dp', model: 'dm' })
    const before = e.calls
    e.pushPlan([{ type: 'text-delta', text: '我们对比下 Redis 和本地 KV 的成本。' }, { type: 'finish', reason: { kind: 'stop' } }])
    e.pushPlan(titleRound('🔎 缓存选型｜Redis 对比', '围绕缓存选型讨论，聚焦 Redis 与本地 KV 的成本对比'))
    const send = await e.svc.handleAction({ kind: 'send', sessionId: 's-a', text: '开始缓存选型讨论' }) as { ok: boolean }
    expect(send.ok).toBe(true)
    // 1 次发言 + 1 次命名
    await until(() => e.calls >= before + 2)
    await until(() => sessionOf(e).name === '🔎 缓存选型｜Redis 对比')
    expect(sessionOf(e).topic).toBe('围绕缓存选型讨论，聚焦 Redis 与本地 KV 的成本对比')
    // 命名调用不设 maxTokens：思考模型的 reasoning 与正文共享输出预算，
    // 任何小上限都可能被思考耗尽（finish=max-tokens、正文空、静默无变更）
    expect(e.lastOpts && e.lastOpts.maxTokens).toBeUndefined()
    // 命名调用携带 session-title purpose：deepseek 协议 adapter 据此关闭思考
    expect(e.lastOpts && e.lastOpts.purpose).toBe('session-title')
    expect(e.lastOpts && e.lastOpts.provider).toBe('dp')
    expect(e.lastOpts && e.lastOpts.model).toBe('dm')
    // 落盘（schedulePersist 微任务 flush）
    await sleep(60)
    const doc = JSON.parse(readFileSync(join(e.storeDir, 'grp-a', 'sessions', 'session-s-a.json'), 'utf8')) as { name: string, topic: string }
    expect(doc.name).toBe('🔎 缓存选型｜Redis 对比')
    expect(doc.topic).toBe('围绕缓存选型讨论，聚焦 Redis 与本地 KV 的成本对比')
  })

  it('手动编辑过的字段永久跳过（隐式固定），未固定字段仍演进', async () => {
    const e = env!
    await e.svc.handleAction({ kind: 'mutate', op: 'renameSession', sessionId: 's-a', name: '我的手动会话名' })
    e.pushPlan([{ type: 'text-delta', text: '继续讨论持久化方案。' }, { type: 'finish', reason: { kind: 'stop' } }])
    e.pushPlan(titleRound('🛠️ 持久化｜修复', '持久化方案讨论，聚焦刷盘时机'))
    const send = await e.svc.handleAction({ kind: 'send', sessionId: 's-a', text: '继续' }) as { ok: boolean }
    expect(send.ok).toBe(true)
    await until(() => sessionOf(e).topic === '持久化方案讨论，聚焦刷盘时机')
    expect(sessionOf(e).name).toBe('我的手动会话名')
    await sleep(60)
    const doc = JSON.parse(readFileSync(join(e.storeDir, 'grp-a', 'sessions', 'session-s-a.json'), 'utf8')) as { name: string, namePinned?: boolean, topicPinned?: boolean }
    expect(doc.name).toBe('我的手动会话名')
    expect(doc.namePinned).toBe(true)
    expect(doc.topicPinned).toBeUndefined()
  })

  it('默认模型服务缺位时静默跳过（不额外调用模型）', async () => {
    const e = env!
    e.setDefaultModel(null)
    const before = e.calls
    e.pushPlan([{ type: 'text-delta', text: '随便聊聊。' }, { type: 'finish', reason: { kind: 'stop' } }])
    const send = await e.svc.handleAction({ kind: 'send', sessionId: 's-a', text: '再聊一轮' }) as { ok: boolean }
    expect(send.ok).toBe(true)
    await until(() => e.calls >= before + 1)
    await sleep(120)
    expect(e.calls).toBe(before + 1) // 只有发言，无命名调用
  })
})
