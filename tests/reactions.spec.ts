/**
 * 消息表情回应（用户标注，PRODUCT 语义：仅展示不注入角色上下文）冒烟：
 * sanitizeReactions 白名单清洗、messageJson 序列化省略、reactMessage
 * toggle 语义与错误护栏、dispose 落盘、hydrate 安全化。
 */
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { sanitizeReactions } from '../src/core/types.ts'
import { messageJson } from '../src/core/json.ts'

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

let storeDir = ''
let svc: Service | null = null
let targetId = ''

/** 组装 stub ctx 并创建 service（同目录重建复用：hydrate 场景）。 */
async function makeService(): Promise<Service> {
  const { createGroupChatService } = await import('../src/host/service.ts')
  const llm = {
    listProviders: async () => [],
    listModels: async () => [],
    resolveModelInfo: async () => null,
    stream: async function* (): AsyncGenerator<{ type: string, [key: string]: unknown }> {
      yield { type: 'text-delta', text: '好的' }
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
  return createGroupChatService(ctx)
}

beforeAll(async () => {
  storeDir = mkdtempSync(join(tmpdir(), 'dsgc-react-'))
  mkdirSync(join(storeDir, 'grp-a', 'sessions'), { recursive: true })
  writeFileSync(join(storeDir, 'grp-a', 'roles.json'), JSON.stringify({ schema: 1, roles: [] }))
  writeFileSync(join(storeDir, 'ledger.json'), JSON.stringify({
    schema: 3,
    groups: [{ id: 'grp-a', name: 'A', permissionTier: 'view_only' }],
    sessions: [{ id: 's-a', groupId: 'grp-a' }],
  }, null, 2))
  writeFileSync(join(storeDir, 'grp-a', 'sessions', 'session-s-a.json'), JSON.stringify({ schema: 1, name: 'SA', messages: [] }))
  process.env.DSH_GROUP_CHAT_STORE = storeDir
  svc = await makeService()
  await svc.handleAction({ kind: 'mutate', op: 'upsertRole', groupId: 'grp-a', role: { name: '工程师', provider: 'p', model: 'm' } })
  await svc.handleAction({ kind: 'send', sessionId: 's-a', text: '回应测试' })
  await until(() => !svc!.snapshot().run.running)
  const msgs = svc.snapshot().messages
  targetId = (msgs[msgs.length - 1] || {}).id || ''
  expect(targetId).toBeTruthy()
})

afterAll(async () => {
  if (svc) await svc.dispose()
  rmSync(storeDir, { recursive: true, force: true })
})

describe('sanitizeReactions（纯函数）', () => {
  it('非数组与空数组 → undefined', () => {
    expect(sanitizeReactions(undefined)).toBeUndefined()
    expect(sanitizeReactions('👍')).toBeUndefined()
    expect(sanitizeReactions([])).toBeUndefined()
  })

  it('白名单过滤 + 去重 + 按白名单顺序排列', () => {
    expect(sanitizeReactions(['🎉', '👍', '😈', '👍'])).toEqual(['👍', '🎉'])
    expect(sanitizeReactions(['👍', 42, null])).toEqual(['👍'])
  })

  it('全非法条目 → undefined', () => {
    expect(sanitizeReactions(['😈', 'x'])).toBeUndefined()
  })
})

describe('messageJson（序列化）', () => {
  it('非空集合序列化；空/缺省省略字段', () => {
    expect(messageJson({ id: 'm1', reactions: ['👍'] })!.reactions).toEqual(['👍'])
    expect('reactions' in messageJson({ id: 'm1', reactions: [] })!).toBe(false)
    expect('reactions' in messageJson({ id: 'm1' })!).toBe(false)
  })

  it('durationMs：正数序列化；0/负数/缺省省略', () => {
    expect(messageJson({ id: 'm1', durationMs: 2500 })!.durationMs).toBe(2500)
    expect('durationMs' in messageJson({ id: 'm1', durationMs: 0 })!).toBe(false)
    expect('durationMs' in messageJson({ id: 'm1' })!).toBe(false)
  })
})

describe('reactMessage（服务）', () => {
  it('toggle：加入 → 白名单顺序并入；移除 → 收缩；清空即省略', async () => {
    const react = async (emoji: string): Promise<void> => {
      await svc!.handleAction({ kind: 'mutate', op: 'reactMessage', messageId: targetId, emoji })
    }
    await react('🎉')
    expect(svc!.snapshot().messages.find((m) => m.id === targetId)!.reactions).toEqual(['🎉'])
    await react('👍')
    expect(svc!.snapshot().messages.find((m) => m.id === targetId)!.reactions).toEqual(['👍', '🎉'])
    await react('👍')
    expect(svc!.snapshot().messages.find((m) => m.id === targetId)!.reactions).toEqual(['🎉'])
    await react('🎉')
    expect(svc!.snapshot().messages.find((m) => m.id === targetId)!.reactions).toBeUndefined()
  })

  it('护栏：非法 emoji / 消息不存在 → error，不改状态', async () => {
    const bad = await svc!.handleAction({ kind: 'mutate', op: 'reactMessage', messageId: targetId, emoji: '😈' }) as { snapshot?: { error?: string } }
    expect(bad.snapshot!.error).toBe('未知的回应表情')
    const missing = await svc!.handleAction({ kind: 'mutate', op: 'reactMessage', messageId: 'nope', emoji: '👍' }) as { snapshot?: { error?: string } }
    expect(missing.snapshot!.error).toBe('消息不存在')
    expect(svc!.snapshot().messages.find((m) => m.id === targetId)!.reactions).toBeUndefined()
  })

  it('dispose 落盘：session 文件含 reactions 字段', async () => {
    await svc!.handleAction({ kind: 'mutate', op: 'reactMessage', messageId: targetId, emoji: '❤️' })
    await svc!.dispose()
    svc = null
    const doc = JSON.parse(readFileSync(join(storeDir, 'grp-a', 'sessions', 'session-s-a.json'), 'utf8')) as { messages: { id: string, reactions?: string[], durationMs?: number }[] }
    expect(doc.messages.find((m) => m.id === targetId)!.reactions).toEqual(['❤️'])
    // 发言总耗时随会话文件落盘（stub 流式极快，存在性即可）
    expect('durationMs' in doc.messages.find((m) => m.id === targetId)!).toBe(true)
  })

  it('hydrate 安全化：磁盘上的非法/重复条目被清洗', async () => {
    // 在落盘文件基础上注入非法与重复条目后重建（锁已随 dispose 释放）
    const file = join(storeDir, 'grp-a', 'sessions', 'session-s-a.json')
    const doc = JSON.parse(readFileSync(file, 'utf8')) as { messages: { id: string, reactions?: string[], durationMs?: number }[] }
    doc.messages.find((m) => m.id === targetId)!.reactions = ['👍', '😈', '👍', '❤️']
    // durationMs 负数 → 清洗为省略
    doc.messages.find((m) => m.id === targetId)!.durationMs = -5
    writeFileSync(file, JSON.stringify(doc))
    svc = await makeService()
    expect(svc.snapshot().messages.find((m) => m.id === targetId)!.reactions).toEqual(['👍', '❤️'])
    // 负数 durationMs 被 hydrate 清洗为省略
    expect(svc.snapshot().messages.find((m) => m.id === targetId)!.durationMs).toBeUndefined()
  })
})
