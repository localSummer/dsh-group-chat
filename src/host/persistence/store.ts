/**
 * 持久化（PERSISTENCE.md v2.1：会话级文件隔离）。
 *
 * 目录布局（每群组一目录，一会话一文件）：
 *   <dir>/ledger.json                              群组/会话清单（schema 3，纯清单，pretty；群组含 permissionTier）
 *   <dir>/<group-id>/workspaceDir                  工作区目录设置（纯文本一行）
 *   <dir>/<group-id>/roles.json                    群组角色（schema 1，紧凑）
 *   <dir>/<group-id>/sessions/session-<uuid>.json   会话（schema 1，自包含，紧凑）
 *
 * 原子写 tmp+fsync+rename（每目录一次 fsync）；单实例 .lock；损坏隔离重建；
 * 写失败保留脏标记；v1 自动迁移。
 * @module dsh-group-chat/host/persistence/store
 */

import { homedir } from 'node:os'
import { basename, dirname, isAbsolute, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { chmodSync, closeSync, existsSync, fsyncSync, mkdirSync, openSync, readdirSync, readFileSync, renameSync, rmSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { messageJson, roleJson } from '../../core/json.ts'
import type { GroupRecord } from '../../core/types.ts'

/** DSH 主目录；DSH_GROUP_CHAT_STORE 供测试覆盖存储位置。 */
export const DSH_HOME = process.env.DSH_HOME || join(homedir(), '.dsh')

/** 存储根目录。 */
export const STORE_DIR = process.env.DSH_GROUP_CHAT_STORE || join(DSH_HOME, 'storages', 'group-chat')

const processIsAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0)
    return true
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === 'EPERM'
  }
}

const SESSION_FILE_RE = /^session-(.+)\.json$/

/** 会话文件名 → 会话 id。 */
export function sessionFileMatch(name: string): string | null {
  const m = SESSION_FILE_RE.exec(name)
  return m ? m[1] : null
}

/** 群组目录下的 v1 遗留会话清单形态（迁移用）。 */
interface V1Ledger {
  schema?: number
  groups?: { id: string, name?: string, workspaceDir?: string }[]
  roles?: { id: string, groupId: string }[]
  sessions?: { id: string, groupId: string, name?: string, topic?: string, createdAt?: number }[]
}

export class Store {
  readonly dir: string
  readonly ledgerFile: string
  private readonly lockFile: string
  private lockFd: number | undefined

  constructor(dir: string) {
    this.dir = dir
    this.ledgerFile = join(dir, 'ledger.json')
    this.lockFile = join(dir, '.lock')
    mkdirSync(dir, { recursive: true })
    this.lockFd = this.acquireLock()
  }

  groupDir(groupId: string): string { return join(this.dir, groupId) }
  sessionsDir(groupId: string): string { return join(this.groupDir(groupId), 'sessions') }
  sessionFile(groupId: string, sessionId: string): string { return join(this.sessionsDir(groupId), 'session-' + sessionId + '.json') }
  rolesFile(groupId: string): string { return join(this.groupDir(groupId), 'roles.json') }
  workspaceFile(groupId: string): string { return join(this.groupDir(groupId), 'workspaceDir') }

  private acquireLock(): number {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const fd = openSync(this.lockFile, 'wx', 0o600)
        writeFileSync(fd, JSON.stringify({ pid: process.pid, token: randomUUID(), at: Date.now() }), 'utf8')
        try {
          fsyncSync(fd)
        } catch {}
        try {
          chmodSync(this.lockFile, 0o600)
        } catch {}
        return fd
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e
        let pid: number | undefined
        try {
          pid = JSON.parse(readFileSync(this.lockFile, 'utf8')).pid
        } catch {
          throw new Error(`持久化锁不可读，如确认无其他 dsh web 在运行可手动删除 ${this.lockFile}`)
        }
        if (typeof pid === 'number' && processIsAlive(pid)) {
          throw new Error(`持久化锁被进程 ${pid} 持有`)
        }
        try {
          unlinkSync(this.lockFile)
        } catch (ue) {
          if ((ue as NodeJS.ErrnoException).code !== 'ENOENT') throw ue
        }
      }
    }
    throw new Error('持久化锁获取失败')
  }

  release(): void {
    if (this.lockFd !== undefined) {
      try {
        closeSync(this.lockFd)
      } catch {}
      try {
        unlinkSync(this.lockFile)
      } catch {}
      this.lockFd = undefined
    }
  }

  fsyncDir(dir: string): void {
    try {
      const fd = openSync(dir, 'r')
      try {
        fsyncSync(fd)
      } finally {
        closeSync(fd)
      }
    } catch {}
  }

  /** 原子写：tmp+fsync+rename；目录 fsync 由调用方按 flush 批量执行（每目录一次）。 */
  atomicWrite(file: string, text: string): void {
    mkdirSync(dirname(file), { recursive: true })
    const tmp = `${file}.tmp-${process.pid}`
    let fd: number | undefined
    try {
      fd = openSync(tmp, 'w', 0o600)
      writeFileSync(fd, text, 'utf8')
      fsyncSync(fd)
      closeSync(fd)
      fd = undefined
      try {
        chmodSync(tmp, 0o600)
      } catch {}
      renameSync(tmp, file)
    } catch (e) {
      if (fd !== undefined) {
        try {
          closeSync(fd)
        } catch {}
      }
      try {
        unlinkSync(tmp)
      } catch {}
      throw e
    }
  }

  quarantine(file: string): void {
    try {
      renameSync(file, `${file}.corrupt-${Date.now()}-${process.pid}`)
    } catch {}
  }

  /** 读 JSON；缺失返回 null；损坏则隔离后返回 null。 */
  loadJson(file: string): unknown {
    let raw: string
    try {
      raw = readFileSync(file, 'utf8')
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null
      throw e
    }
    try {
      return JSON.parse(raw)
    } catch (e) {
      console.error(`[dsh-group-chat] ${basename(file)} 解析失败，已隔离并以空数据启动：`, e)
      this.quarantine(file)
      return null
    }
  }

  readWorkspace(groupId: string): string {
    try {
      return readFileSync(this.workspaceFile(groupId), 'utf8').trim()
    } catch {
      return ''
    }
  }

  /** hydrate 残留清理：.tmp-* 删除；同前缀 .corrupt-* 只保留最近 1 份。 */
  cleanup(): void {
    const sweep = (dir: string) => {
      let entries: import('node:fs').Dirent[]
      try {
        entries = readdirSync(dir, { withFileTypes: true })
      } catch {
        return
      }
      const corrupt = new Map<string, { name: string, mtime: number }[]>()
      for (const e of entries) {
        if (!e.isFile()) continue
        if (/\.tmp-\d+$/.test(e.name)) {
          try {
            unlinkSync(join(dir, e.name))
          } catch {}
          continue
        }
        const m = /^(.+)\.corrupt-\d+-\d+$/.exec(e.name)
        if (m) {
          let mtime = 0
          try {
            mtime = statSync(join(dir, e.name)).mtimeMs
          } catch {}
          if (!corrupt.has(m[1])) corrupt.set(m[1], [])
          corrupt.get(m[1])!.push({ name: e.name, mtime })
        }
      }
      for (const list of corrupt.values()) {
        list.sort((a, b) => b.mtime - a.mtime)
        for (const item of list.slice(1)) {
          try {
            unlinkSync(join(dir, item.name))
          } catch {}
        }
      }
    }
    sweep(this.dir)
    let entries: import('node:fs').Dirent[]
    try {
      entries = readdirSync(this.dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      if (!e.isDirectory()) continue
      const gdir = join(this.dir, e.name)
      sweep(gdir)
      sweep(join(gdir, 'sessions'))
    }
  }

  /** v1（ledger+messages 双文件）→ v2 一次性迁移；幂等，messages.json 只归档从不删除。 */
  migrateV1(): void {
    const v1MessagesFile = join(this.dir, 'messages.json')
    if (!existsSync(v1MessagesFile)) return
    const v1Ledger = this.loadJson(this.ledgerFile) as V1Ledger | null
    const archive = () => {
      try {
        renameSync(v1MessagesFile, `${v1MessagesFile}.migrated-${Date.now()}`)
      } catch {}
      this.fsyncDir(this.dir)
    }
    // schema 2 = 上次迁移已完成、仅剩归档 rename 未做；无有效 v1 清单 = 消息不可归属：均只归档兜底
    if (!v1Ledger || v1Ledger.schema === 2 || !Array.isArray(v1Ledger.groups)) {
      archive()
      return
    }
    // 1. 清上次迁移半成品（v1 清单仍是事实源，安全幂等）
    let dirs: import('node:fs').Dirent[]
    try {
      dirs = readdirSync(this.dir, { withFileTypes: true })
    } catch {
      dirs = []
    }
    for (const e of dirs) {
      if (!e.isDirectory()) continue
      const gdir = join(this.dir, e.name)
      try {
        rmSync(join(gdir, 'sessions'), { recursive: true, force: true })
      } catch {}
      for (const name of ['roles.json', 'workspaceDir']) {
        try {
          unlinkSync(join(gdir, name))
        } catch {}
      }
    }
    // 2. v1 数据整备
    const groupsById = new Map<string, NonNullable<V1Ledger['groups']>[number]>()
    for (const g of v1Ledger.groups) {
      if (g && typeof g.id === 'string') groupsById.set(g.id, g)
    }
    const rolesByGroup = new Map<string, { id: string, groupId: string }[]>()
    for (const r of (Array.isArray(v1Ledger.roles) ? v1Ledger.roles : [])) {
      if (r && typeof r.id === 'string' && groupsById.has(r.groupId)) {
        if (!rolesByGroup.has(r.groupId)) rolesByGroup.set(r.groupId, [])
        rolesByGroup.get(r.groupId)!.push(r)
      }
    }
    const v1Sessions = (Array.isArray(v1Ledger.sessions) ? v1Ledger.sessions : []).filter((s) => s && typeof s.id === 'string' && groupsById.has(s.groupId))
    const sessionIds = new Set(v1Sessions.map((s) => s.id))
    const messagesDoc = this.loadJson(v1MessagesFile) as { messages?: { id: string, sessionId: string }[] } | null
    const messagesBySession = new Map<string, { id: string, sessionId: string }[]>()
    for (const m of (messagesDoc && Array.isArray(messagesDoc.messages) ? messagesDoc.messages : [])) {
      if (m && typeof m.id === 'string' && sessionIds.has(m.sessionId)) {
        if (!messagesBySession.has(m.sessionId)) messagesBySession.set(m.sessionId, [])
        messagesBySession.get(m.sessionId)!.push(m)
      }
    }
    // 3. 每会话新 uuid，写会话文件（紧凑）
    const fsyncDirs = new Set<string>()
    const uuidById = new Map<string, string>()
    for (const s of v1Sessions) {
      const uuid = randomUUID()
      uuidById.set(s.id, uuid)
      const doc = {
        schema: 1,
        savedAt: Date.now(),
        id: uuid,
        groupId: s.groupId,
        name: String(s.name || '会话'),
        topic: String(s.topic || ''),
        createdAt: typeof s.createdAt === 'number' ? s.createdAt : Date.now(),
        messages: (messagesBySession.get(s.id) || []).map((m) => messageJson(m)).filter(Boolean),
      }
      this.atomicWrite(this.sessionFile(s.groupId, uuid), JSON.stringify(doc))
      fsyncDirs.add(this.sessionsDir(s.groupId))
    }
    // 4/5. 每群 roles.json + workspaceDir
    for (const g of groupsById.values()) {
      this.atomicWrite(this.rolesFile(g.id), JSON.stringify({ schema: 1, savedAt: Date.now(), roles: (rolesByGroup.get(g.id) || []).map((r) => roleJson(r)) }))
      this.atomicWrite(this.workspaceFile(g.id), String(g.workspaceDir || '').trim() + '\n')
      fsyncDirs.add(this.groupDir(g.id))
    }
    // 6. 新 ledger（纯清单，pretty）
    this.atomicWrite(this.ledgerFile, JSON.stringify({
      schema: 2,
      savedAt: Date.now(),
      groups: [...groupsById.values()].map((g) => ({ id: g.id, name: String(g.name || '群组') })),
      sessions: v1Sessions.map((s) => ({ id: uuidById.get(s.id), groupId: s.groupId })),
    }, null, 2))
    fsyncDirs.add(this.dir)
    for (const d of fsyncDirs) this.fsyncDir(d)
    // 7. 归档旧 messages.json（最后一步）
    archive()
  }
}

/** ledger 清单的读取形态（hydrate 用；allowCommands 为 v2 遗留字段，读取时经 migrateTier 迁移）。 */
export interface LedgerDocument {
  schema?: number
  groups?: { id: string, name?: string, permissionTier?: string, allowCommands?: boolean }[]
  sessions?: { id: string, groupId: string }[]
}

/** 从磁盘目录回收群组 id 列表（ledger 缺失/损坏时的兜底路径）。 */
export function scanGroupIds(dir: string): string[] {
  let entries: import('node:fs').Dirent[]
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return []
  }
  return entries.filter((e) => e.isDirectory()).map((e) => e.name)
}

/** 扫描群组目录下的会话文件（ledger 缺失/损坏时的兜底路径）。 */
export function scanSessionIds(store: Store, groupId: string): string[] {
  let entries: import('node:fs').Dirent[]
  try {
    entries = readdirSync(store.sessionsDir(groupId), { withFileTypes: true })
  } catch {
    return []
  }
  const ids: string[] = []
  for (const se of entries) {
    if (!se.isFile()) continue
    const m = sessionFileMatch(se.name)
    if (m) ids.push(m)
  }
  return ids
}

/** 空群组记录构造（hydrate 兜底路径用）。 */
export function emptyGroup(id: string, name: string): GroupRecord {
  return { id, name, workspaceDir: '', permissionTier: 'view_only', roleIds: [], sessionIds: [] }
}
