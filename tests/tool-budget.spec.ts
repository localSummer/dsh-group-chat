/**
 * 按需读取打满 32k 后的收尾：最终请求不带工具块，保留已回注片段，
 * 提示不出现额度字样。
 */
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { fakeShell } from './shell-stub.ts'

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

interface Call {
  tools: { name: string }[] | undefined
  messages: unknown
}

let svc: Service | null = null
let storeDir = ''
const calls: Call[] = []
const queue: StreamChunk[][] = []

beforeAll(async () => {
  storeDir = mkdtempSync(join(tmpdir(), 'dsgc-budget-'))
  const wsDir = join(storeDir, 'ws')
  mkdirSync(join(storeDir, 'grp-a', 'sessions'), { recursive: true })
  mkdirSync(wsDir)
  const lines = Array.from({ length: 1200 }, (_, i) => {
    const n = i + 1
    return n === 6 ? 'WINDOW_MARKER_PAST_200' : 'p'.repeat(48)
  })
  writeFileSync(join(wsDir, 'wide.txt'), lines.join('\n'))
  writeFileSync(join(storeDir, 'grp-a', 'roles.json'), JSON.stringify({ schema: 1, roles: [] }))
  writeFileSync(join(storeDir, 'ledger.json'), JSON.stringify({
    schema: 3,
    groups: [{ id: 'grp-a', name: 'A', permissionTier: 'view_only' }],
    sessions: [{ id: 's-a', groupId: 'grp-a' }],
  }, null, 2))
  writeFileSync(join(storeDir, 'grp-a', 'sessions', 'session-s-a.json'), JSON.stringify({ schema: 1, name: 'SA', messages: [] }))
  process.env.DSH_GROUP_CHAT_STORE = storeDir
  const { createGroupChatService } = await import('../src/host/service.ts')
  const llm = {
    listProviders: async () => [],
    listModels: async () => [],
    resolveModelInfo: async () => null,
    stream: async function* (opts: { tools?: { name: string }[], messages?: unknown }): AsyncGenerator<StreamChunk> {
      calls.push({ tools: opts.tools, messages: opts.messages })
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
  svc = createGroupChatService(ctx)
  await svc.handleAction({ kind: 'mutate', op: 'setWorkspaceDir', groupId: 'grp-a', path: wsDir })
  await svc.handleAction({ kind: 'mutate', op: 'upsertRole', groupId: 'grp-a', role: { name: '工程师', provider: 'p', model: 'm' } })
})

afterAll(async () => {
  if (svc) await svc.dispose()
  svc = null
  if (storeDir) rmSync(storeDir, { recursive: true, force: true })
})

describe('工具预算收尾', () => {
  it('多段读取超过 32k 后，收尾保留片段且不提额度', async () => {
    const chunks: StreamChunk[] = []
    for (let i = 0; i < 5; i++) {
      const args = JSON.stringify({ path: 'wide.txt', offset: 1 + i * 200, limit: 200 })
      chunks.push({ type: 'tool-call-delta', index: i, id: 'c' + i, name: 'read_file', argumentsDelta: args })
      chunks.push({ type: 'block-end', index: i, block: { type: 'tool-call', id: 'c' + i, name: 'read_file', arguments: args } })
    }
    chunks.push({ type: 'finish', reason: { kind: 'stop' } })
    queue.push(chunks)
    queue.push([{ type: 'text-delta', text: '看过了' }, { type: 'finish', reason: { kind: 'stop' } }])
    const send = await svc!.handleAction({ kind: 'send', sessionId: 's-a', text: '看一下 wide.txt' }) as { ok: boolean }
    expect(send.ok).toBe(true)
    await until(() => !svc!.snapshot().run.running)
    expect(calls.length).toBeGreaterThanOrEqual(2)
    const wrap = calls[1]
    expect(wrap.tools).toBeUndefined()
    const text = JSON.stringify(wrap.messages)
    expect(text).not.toContain('"role":"tool"')
    expect(text).not.toContain('tool-call')
    expect(text).toContain('WINDOW_MARKER_PAST_200')
    expect(text).not.toContain('累计上限')
    expect(text).not.toContain('额度')
  })
})
