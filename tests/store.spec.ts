/**
 * Store 持久化契约冒烟测试：目录布局、原子写、单实例锁、损坏隔离、v1 迁移、残留清理。
 */
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { Store, scanGroupIds, scanSessionIds } from '../src/host/store.ts'

const dirs: string[] = []

function freshDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-group-chat-test-'))
  dirs.push(dir)
  return dir
}

afterEach(() => {
  // 临时目录由 vitest 进程退出后的 /tmp 清理策略兜底；此处仅解除 .lock（进程内）
})

describe('Store 目录布局与原子写', () => {
  it('会话/角色/工作区文件路径按 v2.1 布局落位', () => {
    const dir = freshDir()
    const store = new Store(dir)
    expect(store.sessionFile('g1', 's1')).toBe(join(dir, 'g1', 'sessions', 'session-s1.json'))
    expect(store.rolesFile('g1')).toBe(join(dir, 'g1', 'roles.json'))
    expect(store.workspaceFile('g1')).toBe(join(dir, 'g1', 'workspaceDir'))
    store.atomicWrite(store.sessionFile('g1', 's1'), '{"schema":1}')
    expect(readFileSync(store.sessionFile('g1', 's1'), 'utf8')).toBe('{"schema":1}')
    // 不残留 tmp 文件
    expect(readdirSync(join(dir, 'g1', 'sessions')).filter((n) => n.includes('.tmp-'))).toEqual([])
    store.release()
  })

  it('readWorkspace：缺失返回空串', () => {
    const dir = freshDir()
    const store = new Store(dir)
    expect(store.readWorkspace('g1')).toBe('')
    store.atomicWrite(store.workspaceFile('g1'), '/tmp/ws\n')
    expect(store.readWorkspace('g1')).toBe('/tmp/ws')
    store.release()
  })
})

describe('单实例锁', () => {
  it('同目录第二个 Store 实例被锁拒绝；release 后可重新获取', () => {
    const dir = freshDir()
    const store = new Store(dir)
    expect(() => new Store(dir)).toThrow(/持久化锁/)
    store.release()
    const store2 = new Store(dir)
    store2.release()
  })
})

describe('损坏隔离', () => {
  it('坏 JSON 文件被隔离为 .corrupt-* 并返回 null', () => {
    const dir = freshDir()
    const store = new Store(dir)
    const file = store.sessionFile('g1', 's1')
    store.atomicWrite(file, '{not-json')
    expect(store.loadJson(file)).toBeNull()
    const siblings = readdirSync(join(dir, 'g1', 'sessions')).filter((n) => n.startsWith('session-s1.json.corrupt-'))
    expect(siblings).toHaveLength(1)
    // 清理后同前缀只保留最近 1 份
    store.atomicWrite(file, '{again-bad')
    expect(store.loadJson(file)).toBeNull()
    store.cleanup()
    const remaining = readdirSync(join(dir, 'g1', 'sessions')).filter((n) => n.startsWith('session-s1.json.corrupt-'))
    expect(remaining).toHaveLength(1)
    store.release()
  })

  it('ENOENT 返回 null 且不产生隔离文件', () => {
    const dir = freshDir()
    const store = new Store(dir)
    expect(store.loadJson(join(dir, 'nope.json'))).toBeNull()
    expect(existsSync(join(dir, 'nope.json'))).toBe(false)
    store.release()
  })
})

describe('v1 → v2 迁移', () => {
  it('v1 双文件布局迁移为会话级文件布局，messages.json 归档', () => {
    const dir = freshDir()
    // v1：ledger schema 1 + messages.json 双文件
    writeFileSync(join(dir, 'ledger.json'), JSON.stringify({
      schema: 1,
      groups: [{ id: 'g1', name: '群组A', workspaceDir: '/tmp/ws' }],
      roles: [{ id: 'r1', groupId: 'g1', name: 'R1', persona: '', provider: 'p', model: 'm' }],
      sessions: [{ id: 's-old', groupId: 'g1', name: '旧会话', topic: 't', createdAt: 123 }],
    }))
    writeFileSync(join(dir, 'messages.json'), JSON.stringify({
      messages: [
        { id: 'm1', sessionId: 's-old', speaker: 'user', text: 'hello', ts: 1, seq: 1 },
        { id: 'm2', sessionId: 's-old', speaker: 'r1', text: 'world', ts: 2, seq: 2 },
        { id: 'm-x', sessionId: 'ghost', text: '孤儿消息应被丢弃' },
      ],
    }))
    const store = new Store(dir)
    store.migrateV1()
    // 新 ledger schema 2，纯清单
    const ledger = JSON.parse(readFileSync(join(dir, 'ledger.json'), 'utf8'))
    expect(ledger.schema).toBe(2)
    expect(ledger.groups).toEqual([{ id: 'g1', name: '群组A' }])
    expect(ledger.sessions).toHaveLength(1)
    const newSid = ledger.sessions[0].id
    // 会话文件：新 uuid、自包含消息（孤儿消息丢弃）
    const sess = JSON.parse(readFileSync(join(dir, 'g1', 'sessions', `session-${newSid}.json`), 'utf8'))
    expect(sess.schema).toBe(1)
    expect(sess.name).toBe('旧会话')
    expect(sess.messages.map((m: { id: string }) => m.id)).toEqual(['m1', 'm2'])
    // roles.json + workspaceDir
    const roles = JSON.parse(readFileSync(join(dir, 'g1', 'roles.json'), 'utf8'))
    expect(roles.roles.map((r: { id: string }) => r.id)).toEqual(['r1'])
    expect(readFileSync(join(dir, 'g1', 'workspaceDir'), 'utf8').trim()).toBe('/tmp/ws')
    // 旧 messages.json 已归档（.migrated-*），从不删除
    const archived = readdirSync(dir).filter((n) => n.startsWith('messages.json.migrated-'))
    expect(archived).toHaveLength(1)
    // 幂等：再跑一次不报错、不再改会话
    store.migrateV1()
    const sess2 = JSON.parse(readFileSync(join(dir, 'g1', 'sessions', `session-${newSid}.json`), 'utf8'))
    expect(sess2.messages).toHaveLength(2)
    store.release()
  })
})

describe('目录扫描兜底', () => {
  it('scanGroupIds / scanSessionIds 从磁盘目录回收群组与会话', () => {
    const dir = freshDir()
    const store = new Store(dir)
    store.atomicWrite(store.sessionFile('gx', 's1'), '{}')
    store.atomicWrite(store.sessionFile('gx', 's2'), '{}')
    expect(scanGroupIds(dir)).toContain('gx')
    expect(scanSessionIds(store, 'gx').sort()).toEqual(['s1', 's2'])
    store.release()
  })
})

describe('hydrate 空目录引导', () => {
  it('空目录 + 缺失 ledger：默认群组补建（通过 service 间接覆盖，此处验证 Store 原语）', () => {
    const dir = freshDir()
    mkdirSync(join(dir, 'g-orphan', 'sessions'), { recursive: true })
    const store = new Store(dir)
    store.atomicWrite(store.sessionFile('g-orphan', 's9'), JSON.stringify({ schema: 1, name: '回收会话', messages: [{ id: 'm1', speaker: 'user', text: 'x', ts: 1, seq: 1 }] }))
    // ledger 缺失时 loadJson 返回 null（调用方走目录扫描兜底）
    expect(store.loadJson(store.ledgerFile)).toBeNull()
    store.release()
  })
})
