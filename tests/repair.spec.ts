/**
 * 启动 hydrate：旧系统失败胶囊按角色名迁到该角色，随后可 retrySpeak。
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

type Service = import('../src/host/service.ts').GroupChatService

const quota = '角色「产品经理」发言失败：模型输出异常终止: 429: {"code":"AccountQuotaExceeded","message":"quota","type":"TooManyRequests"}'

let svc: Service | null = null
let storeDir = ''

beforeAll(async () => {
  storeDir = mkdtempSync(join(tmpdir(), 'dsgc-repair-'))
  mkdirSync(join(storeDir, 'grp-a', 'sessions'), { recursive: true })
  writeFileSync(join(storeDir, 'grp-a', 'roles.json'), JSON.stringify({
    schema: 1,
    roles: [{ id: 'role-pm', name: '产品经理', persona: '', provider: 'p', model: 'm', enabled: true, thinking: false }],
  }))
  writeFileSync(join(storeDir, 'ledger.json'), JSON.stringify({
    schema: 3,
    groups: [{ id: 'grp-a', name: 'A', permissionTier: 'view_only' }],
    sessions: [{ id: 's-a', groupId: 'grp-a' }],
  }, null, 2))
  writeFileSync(join(storeDir, 'grp-a', 'sessions', 'session-s-a.json'), JSON.stringify({
    schema: 1,
    name: 'SA',
    messages: [{ id: 'msg-fail', speaker: 'system', text: quota, error: true, ts: 1, seq: 1 }],
  }))
  process.env.DSH_GROUP_CHAT_STORE = storeDir
  const { createGroupChatService } = await import('../src/host/service.ts')
  const llm = {
    listProviders: async () => [],
    listModels: async () => [],
    resolveModelInfo: async () => null,
    stream: async function* (): AsyncGenerator<{ type: string, [key: string]: unknown }> {
      yield { type: 'text-delta', text: '改用备选方案' }
      yield { type: 'finish', reason: { kind: 'stop' } }
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
  svc = createGroupChatService(ctx)
})

afterAll(async () => {
  if (svc) await svc.dispose()
  if (storeDir) rmSync(storeDir, { recursive: true, force: true })
})

describe('旧系统失败行 hydrate', () => {
  it('启动时迁到角色并补 failedRoleId', () => {
    const fail = svc!.snapshot().messages.find((m) => m.id === 'msg-fail')!
    expect(fail.speaker).toBe('role-pm')
    expect(fail.failedRoleId).toBe('role-pm')
    expect(fail.error).toBe(true)
    expect(fail.text.startsWith('角色「')).toBe(false)
    expect(fail.text).toContain('AccountQuotaExceeded')
  })

  it('迁过的失败卡可原地重试', async () => {
    const res = await svc!.handleAction({ kind: 'retrySpeak', sessionId: 's-a', messageId: 'msg-fail' }) as { ok: boolean, error?: string }
    expect(res.ok).toBe(true)
    await until(() => !svc!.snapshot().run.running)
    const same = svc!.snapshot().messages.find((m) => m.id === 'msg-fail')!
    expect(same.error).toBeFalsy()
    expect(same.text).toBe('改用备选方案')
    expect(same.speaker).toBe('role-pm')
  })
})
