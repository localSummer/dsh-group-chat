/**
 * Host 半权限档位冒烟测试：v2 ledger 迁移（allowCommands → permissionTier）、
 * 三档工具 schema/执行闸门、降档拒待确认、ledger schema 3 落盘。
 * stub llm（可控 tool-call chunk 发射器）+ stub fs。
 *
 * STORE_DIR 在模块首次 import 时固化（单实例锁亦按目录），故整个文件共用
 * 一个 service + 一个临时目录，测试按声明顺序组成一个状态递进的场景链；
 * 各场景用唯一命令标记区分消息，避免历史消息污染断言。
 */
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { fakeShell } from './shell-stub.ts'

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

interface Env {
  svc: Service
  wsDir: string
  storeDir: string
  /** 每次流式调用收到的 tools 列表（按调用顺序）。 */
  calls: { tools: { name: string }[] }[]
  /** 压入一轮 chunk 计划；llm stub 按队列消费，空则回退纯文本收尾。 */
  pushPlan: (rounds: StreamChunk[]) => void
}

let env: Env | null = null

beforeAll(async () => {
  const storeDir = mkdtempSync(join(tmpdir(), 'dsgc-svc-'))
  const wsDir = join(storeDir, 'ws')
  mkdirSync(wsDir, { recursive: true })
  // v2 存量：grp-a allowCommands=true，grp-b 无字段；各带一个空会话
  for (const gid of ['grp-a', 'grp-b']) {
    mkdirSync(join(storeDir, gid, 'sessions'), { recursive: true })
    writeFileSync(join(storeDir, gid, 'roles.json'), JSON.stringify({ schema: 1, roles: [] }))
  }
  writeFileSync(join(storeDir, 'ledger.json'), JSON.stringify({
    schema: 2,
    groups: [
      { id: 'grp-a', name: 'A', allowCommands: true },
      { id: 'grp-b', name: 'B' },
    ],
    sessions: [{ id: 's-a', groupId: 'grp-a' }, { id: 's-b', groupId: 'grp-b' }],
  }, null, 2))
  writeFileSync(join(storeDir, 'grp-a', 'sessions', 'session-s-a.json'), JSON.stringify({ schema: 1, name: 'SA', messages: [] }))
  writeFileSync(join(storeDir, 'grp-b', 'sessions', 'session-s-b.json'), JSON.stringify({ schema: 1, name: 'SB', messages: [] }))
  process.env.DSH_GROUP_CHAT_STORE = storeDir
  const { createGroupChatService } = await import('../src/host/service.ts')
  const calls: { tools: { name: string }[] }[] = []
  const queue: StreamChunk[][] = []
  const llm = {
    listProviders: async () => [],
    listModels: async () => [],
    resolveModelInfo: async () => null,
    stream: async function* (opts: { tools?: unknown[] }): AsyncGenerator<StreamChunk> {
      calls.push({ tools: (opts.tools || []) as { name: string }[] })
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
  const ctx = { llm, fs, shell: fakeShell(), workspaceRegistry: { list: async () => [] } } as unknown as import('@deepseek-ai/cordis').Context
  const svc = createGroupChatService(ctx)
  await svc.handleAction({ kind: 'mutate', op: 'setWorkspaceDir', groupId: 'grp-a', path: wsDir })
  await svc.handleAction({ kind: 'mutate', op: 'upsertRole', groupId: 'grp-a', role: { name: '工程师', provider: 'p', model: 'm' } })
  env = { svc, wsDir, storeDir, calls, pushPlan: (rounds) => { queue.push(rounds) } }
})

afterAll(async () => { if (env) { await env.svc.dispose(); env = null } })

/** 一次 run_command 工具调用的 chunk 计划。 */
const cmdRound = (command: string): StreamChunk[] => [
  { type: 'tool-call-delta', index: 0, id: 'c1', name: 'run_command', argumentsDelta: JSON.stringify({ command }) },
  { type: 'block-end', index: 0, block: { type: 'tool-call', id: 'c1', name: 'run_command', arguments: JSON.stringify({ command }) } },
  { type: 'finish', reason: { kind: 'stop' } },
]

/** 一轮纯文本收尾的 chunk 计划。 */
const textRound = (text: string): StreamChunk[] => [
  { type: 'text-delta', text },
  { type: 'finish', reason: { kind: 'stop' } },
]

/** 等一轮 send 跑完并返回含指定命令标记的角色消息的 toolCalls。 */
async function runScenario(command: string): Promise<{ status: string, output: string }> {
  const e = env!
  e.pushPlan(cmdRound(command))
  e.pushPlan(textRound('收尾'))
  const send = await e.svc.handleAction({ kind: 'send', sessionId: 's-a', text: '请跑 ' + command }) as { ok: boolean }
  expect(send.ok).toBe(true)
  await until(() => !(e.svc.snapshot() as { run: { running: boolean } }).run.running)
  const snap = e.svc.snapshot() as { messages: { speaker: string, toolCalls?: { tool: string, args: { command?: string }, status: string, output: string }[] }[] }
  for (let i = snap.messages.length - 1; i >= 0; i--) {
    const tc = snap.messages[i].toolCalls?.find((c) => c.tool === 'run_command' && c.args && c.args.command === command)
    if (tc) return { status: tc.status, output: tc.output }
  }
  throw new Error('未找到命令 ' + command + ' 的工具调用记录')
}

describe('权限档位（host 冒烟，顺序场景）', () => {
  it('v2 ledger 迁移：allowCommands=true → workspace_write，无字段 → view_only', () => {
    const snap = env!.svc.snapshot() as { groups: { id: string, permissionTier: string }[] }
    const byId = Object.fromEntries(snap.groups.map((g) => [g.id, g.permissionTier]))
    expect(byId['grp-a']).toBe('workspace_write')
    expect(byId['grp-b']).toBe('view_only')
  })

  it('setPermissionTier：非法档位报错，合法档位写入快照', async () => {
    const bad = await env!.svc.handleAction({ kind: 'mutate', op: 'setPermissionTier', groupId: 'grp-a', tier: 'bogus' }) as { ok: boolean, snapshot?: { error?: string } }
    expect(bad.ok).toBe(true)
    expect(bad.snapshot!.error).toBe('未知权限档位')
    const ok = await env!.svc.handleAction({ kind: 'mutate', op: 'setPermissionTier', groupId: 'grp-a', tier: 'view_only' }) as { snapshot?: { error?: string, groups: { id: string, permissionTier: string }[] } }
    expect(ok.snapshot!.error).toBeUndefined()
    expect(ok.snapshot!.groups.find((g) => g.id === 'grp-a')!.permissionTier).toBe('view_only')
  })

  it('view_only：run_command 从 tools 剔除；角色硬调即报错不执行', async () => {
    const res = await runScenario('echo t-view')
    expect(env!.calls.at(-2)!.tools.map((t) => t.name)).not.toContain('run_command')
    expect(res.status).toBe('error')
    expect(res.output).toContain('仅可查看')
  })

  it('full_access：run_command 在 tools 中且免确认直接执行', async () => {
    await env!.svc.handleAction({ kind: 'mutate', op: 'setPermissionTier', groupId: 'grp-a', tier: 'full_access' })
    const res = await runScenario('echo t-full-ok')
    expect(env!.calls.at(-2)!.tools.map((t) => t.name)).toContain('run_command')
    expect(res.status).toBe('ok')
    expect(res.output).toContain('t-full-ok')
  })

  it('workspace_write：命令挂起待确认；降到 view_only 自动拒绝', async () => {
    await env!.svc.handleAction({ kind: 'mutate', op: 'setPermissionTier', groupId: 'grp-a', tier: 'workspace_write' })
    const e = env!
    e.pushPlan(cmdRound('echo t-mid'))
    e.pushPlan(textRound('知道了'))
    const send = await e.svc.handleAction({ kind: 'send', sessionId: 's-a', text: '请跑 echo t-mid' }) as { ok: boolean }
    expect(send.ok).toBe(true)
    // 命令挂起等待确认
    await until(() => (e.svc.snapshot() as { run: { pendingConfirm: unknown } }).run.pendingConfirm !== null)
    // 降到 view_only → 待确认命令自动拒绝，角色收到 denied 继续收尾
    await e.svc.handleAction({ kind: 'mutate', op: 'setPermissionTier', groupId: 'grp-a', tier: 'view_only' })
    await until(() => !(e.svc.snapshot() as { run: { running: boolean } }).run.running)
    const snap = e.svc.snapshot() as { messages: { toolCalls?: { tool: string, args: { command?: string }, status: string, output: string }[] }[] }
    const tc = snap.messages.flatMap((m) => m.toolCalls || []).find((c) => c.args && c.args.command === 'echo t-mid')!
    expect(tc.status).toBe('denied')
    expect(tc.output).toContain('用户拒绝了这次命令执行')
  })

  it('dispose 后 ledger 落盘 schema 3 + permissionTier（最后场景：dispose 即终结）', async () => {
    const e = env!
    await e.svc.handleAction({ kind: 'mutate', op: 'setPermissionTier', groupId: 'grp-b', tier: 'full_access' })
    await e.svc.dispose()
    const ledger = JSON.parse(readFileSync(join(e.storeDir, 'ledger.json'), 'utf8')) as { schema: number, groups: { id: string, permissionTier?: string, allowCommands?: boolean }[] }
    expect(ledger.schema).toBe(3)
    const a = ledger.groups.find((g) => g.id === 'grp-a')!
    const b = ledger.groups.find((g) => g.id === 'grp-b')!
    expect(a.permissionTier).toBe('view_only')
    expect(b.permissionTier).toBe('full_access')
    expect('allowCommands' in a).toBe(false)
    expect('allowCommands' in b).toBe(false)
    env = null
  })
})
