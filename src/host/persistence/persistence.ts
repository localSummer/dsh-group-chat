/**
 * 持久化（PERSISTENCE.md v2.1）：事件驱动脏标记合并落盘 + 启动恢复。
 * 锁失败/写失败时降级为内存态运行（console 告警）。
 * @module dsh-group-chat/host/persistence
 */

import { existsSync } from 'node:fs'
import { messageJson, roleJson } from '../../core/json.ts'
import { asNumber, migrateTier } from '../../core/types.ts'
import type { GroupRecord, MessageRecord, RoleRecord, SessionRecord } from '../../core/types.ts'
import { emptyGroup, LedgerDocument, scanGroupIds, scanSessionIds, STORE_DIR, Store } from './store.ts'
import type { HostState } from '../state.ts'

/** 会话文件形态（hydrate 用）。 */
interface SessionDocument {
  name?: string
  topic?: string
  namePinned?: boolean
  topicPinned?: boolean
  createdAt?: number
  messages?: Partial<MessageRecord>[]
}

/** 群组角色文件形态（hydrate 用）。 */
interface RolesDocument {
  roles?: Partial<RoleRecord>[]
}

/** 持久化面。 */
export interface Persistence {
  /** 事件驱动落盘；同一 tick 内多次变更合并为一次写。 */
  schedulePersist: (targets?: { ledger?: boolean, session?: string | null, roles?: string | null, workspace?: string | null }) => void
  /** 同步 flush：写全部脏文件（dispose 最终落盘用）。 */
  flushNow: () => void
  /** 删除群组/会话后摘除脏标记（对应文件已删/将删，flush 跳过）。 */
  dropDirty: (targets: { session?: string | null, roles?: string | null, workspace?: string | null }) => void
  /** dispose：同步最终 flush → 释放锁 → 摘除句柄。 */
  release: () => void
}

/**
 * 创建持久化面：构造即完成 store 初始化 + hydrate（v1 迁移 → 残留清理 →
 * 清单 → 群组数据 → 会话文件；缺文件空重建；补建默认会话/群组立即落盘）。
 */
export function createPersistence(core: HostState): Persistence {
  // ---- 持久化：锁失败/写失败时降级为内存态运行（console 告警） ----
  try {
    core.store = new Store(STORE_DIR)
  } catch (e) {
    console.error('[dsh-group-chat] 持久化不可用，本实例以内存态运行（重启后数据不保留）：', e)
    core.store = null
  }
  const store = (): Store | null => core.store

  // 脏标记按文件记；flush 失败者保留脏标记，下次触发自动重试
  const dirtySessions = new Set<string>()
  const dirtyRoles = new Set<string>()
  const dirtyWorkspace = new Set<string>()
  let ledgerDirty = false
  let flushScheduled = false

  const ledgerDocument = (): LedgerDocument & { savedAt: number } => ({
    schema: 3,
    savedAt: Date.now(),
    groups: [...core.groups.values()].map((g) => ({ id: g.id, name: g.name, permissionTier: g.permissionTier })),
    sessions: [...core.groups.values()].flatMap((g) => g.sessionIds.map((sid) => ({ id: sid, groupId: g.id }))),
  })
  const sessionDocument = (s: SessionRecord) => ({
    schema: 1,
    savedAt: Date.now(),
    id: s.id,
    name: s.name,
    groupId: s.groupId,
    topic: s.topic,
    ...(s.namePinned ? { namePinned: true } : {}),
    ...(s.topicPinned ? { topicPinned: true } : {}),
    createdAt: s.createdAt,
    messages: s.messageIds.map((mid) => core.messages.get(mid)).filter(Boolean).map((m) => messageJson(m)).filter(Boolean),
  })
  const rolesDocument = (g: GroupRecord) => ({ schema: 1, savedAt: Date.now(), roles: g.roleIds.map((rid) => core.roles.get(rid)).filter((r): r is RoleRecord => Boolean(r)).map((r) => roleJson(r)) })

  /** 同步 flush：写全部脏文件；成功才清脏标记；每个实际发生 rename 的目录一次 fsync。 */
  const flushNow = (): void => {
    const s = store()
    if (s === null) return
    const fsyncDirs = new Set<string>()
    for (const sid of [...dirtySessions]) {
      const sess = core.sessions.get(sid)
      if (!sess) {
        dirtySessions.delete(sid)
        continue
      }
      try {
        s.atomicWrite(s.sessionFile(sess.groupId, sess.id), JSON.stringify(sessionDocument(sess)))
        dirtySessions.delete(sid)
        fsyncDirs.add(s.sessionsDir(sess.groupId))
      } catch (e) {
        console.error(`[dsh-group-chat] 会话 ${sid} 落盘失败（保留脏标记待重试）：`, e)
      }
    }
    for (const gid of [...dirtyRoles]) {
      const g = core.groups.get(gid)
      if (!g) {
        dirtyRoles.delete(gid)
        continue
      }
      try {
        s.atomicWrite(s.rolesFile(gid), JSON.stringify(rolesDocument(g)))
        dirtyRoles.delete(gid)
        fsyncDirs.add(s.groupDir(gid))
      } catch (e) {
        console.error(`[dsh-group-chat] 群组 ${gid} roles.json 落盘失败（保留脏标记待重试）：`, e)
      }
    }
    for (const gid of [...dirtyWorkspace]) {
      const g = core.groups.get(gid)
      if (!g) {
        dirtyWorkspace.delete(gid)
        continue
      }
      try {
        s.atomicWrite(s.workspaceFile(gid), (g.workspaceDir || '') + '\n')
        dirtyWorkspace.delete(gid)
        fsyncDirs.add(s.groupDir(gid))
      } catch (e) {
        console.error(`[dsh-group-chat] 群组 ${gid} workspaceDir 落盘失败（保留脏标记待重试）：`, e)
      }
    }
    if (ledgerDirty) {
      try {
        s.atomicWrite(s.ledgerFile, JSON.stringify(ledgerDocument(), null, 2))
        ledgerDirty = false
        fsyncDirs.add(s.dir)
      } catch (e) {
        console.error('[dsh-group-chat] ledger.json 落盘失败（保留脏标记待重试）：', e)
      }
    }
    for (const d of fsyncDirs) s.fsyncDir(d)
  }

  /** 事件驱动落盘；同一 tick 内多次变更合并为一次写。 */
  const schedulePersist = ({ ledger = false, session = null, roles: roleGroup = null, workspace = null }: { ledger?: boolean, session?: string | null, roles?: string | null, workspace?: string | null } = {}): void => {
    if (store() === null) return
    if (ledger) ledgerDirty = true
    if (session) dirtySessions.add(session)
    if (roleGroup) dirtyRoles.add(roleGroup)
    if (workspace) dirtyWorkspace.add(workspace)
    if (flushScheduled) return
    flushScheduled = true
    void Promise.resolve().then(() => {
      flushScheduled = false
      flushNow()
    })
  }

  const dropDirty = ({ session = null, roles: roleGroup = null, workspace = null }: { session?: string | null, roles?: string | null, workspace?: string | null }): void => {
    if (session) dirtySessions.delete(session)
    if (roleGroup) dirtyRoles.delete(roleGroup)
    if (workspace) dirtyWorkspace.delete(workspace)
  }

  // ---- 启动恢复：v1 迁移 → 残留清理 → 清单 → 群组数据 → 会话文件；缺文件空重建 ----

  const loadSession = (groupId: string, sid: string, noteMissing: boolean): void => {
    if (core.sessions.has(sid)) return
    const g = core.groups.get(groupId)
    if (!g) return
    const sess: SessionRecord = { id: sid, groupId, name: '会话', topic: '', messageIds: [], createdAt: Date.now() }
    let doc: SessionDocument | null = null
    const s = store()
    if (s) {
      const file = s.sessionFile(groupId, sid)
      if (noteMissing && !existsSync(file)) console.error(`[dsh-group-chat] 会话 ${sid} 文件缺失，按空消息重建`)
      doc = s.loadJson(file) as SessionDocument | null
    }
    if (doc) {
      if (typeof doc.name === 'string' && doc.name) sess.name = doc.name
      if (typeof doc.topic === 'string') sess.topic = doc.topic
      if (doc.namePinned === true) sess.namePinned = true
      if (doc.topicPinned === true) sess.topicPinned = true
      if (typeof doc.createdAt === 'number') sess.createdAt = doc.createdAt
      let fallbackSeq = 0
      for (const m of (Array.isArray(doc.messages) ? doc.messages : [])) {
        if (!m || typeof m.id !== 'string' || core.messages.has(m.id)) continue
        fallbackSeq++
        core.messages.set(m.id, {
          id: m.id,
          sessionId: sid,
          seq: typeof m.seq === 'number' ? m.seq : fallbackSeq,
          speaker: m.speaker ?? '',
          text: String(m.text || ''),
          reasoning: m.reasoning !== undefined ? String(m.reasoning) : undefined,
          reasoningFull: m.reasoningFull !== undefined ? String(m.reasoningFull) : undefined,
          thinkingSummary: m.thinkingSummary !== undefined ? String(m.thinkingSummary) : undefined,
          model: m.model,
          error: m.error,
          toolCalls: Array.isArray(m.toolCalls) ? m.toolCalls : undefined,
          ts: typeof m.ts === 'number' ? m.ts : Date.now(),
        })
        sess.messageIds.push(m.id)
      }
    }
    core.sessions.set(sid, sess)
    g.sessionIds.push(sid)
  }

  const loadGroupData = (g: GroupRecord): void => {
    const s = store()
    if (!s) return
    g.workspaceDir = s.readWorkspace(g.id)
    const doc = s.loadJson(s.rolesFile(g.id)) as RolesDocument | null
    if (doc && Array.isArray(doc.roles)) {
      for (const r of doc.roles) {
        if (r && typeof r.id === 'string' && !core.roles.has(r.id)) {
          core.roles.set(r.id, {
            id: r.id,
            groupId: g.id,
            name: String(r.name || '成员'),
            color: r.color || undefined,
            persona: String(r.persona || ''),
            provider: String(r.provider || ''),
            model: String(r.model || ''),
            temperature: asNumber(r.temperature),
            reasoningEffort: typeof r.reasoningEffort === 'string' && r.reasoningEffort ? r.reasoningEffort : undefined,
            enabled: r.enabled !== false,
            thinking: r.thinking === true,
          })
          g.roleIds.push(r.id)
        }
      }
    }
  }

  const hydrate = (): void => {
    const s = store()
    if (s) {
      try {
        s.migrateV1()
      } catch (e) {
        console.error('[dsh-group-chat] v1 数据迁移失败，下次启动重试：', e)
      }
      try {
        s.cleanup()
      } catch {}
    }
    const ledger = s ? (s.loadJson(s.ledgerFile) as LedgerDocument | null) : null
    if (ledger && Array.isArray(ledger.groups)) {
      for (const g of ledger.groups) {
        if (g && typeof g.id === 'string' && !core.groups.has(g.id)) {
          core.groups.set(g.id, { id: g.id, name: String(g.name || '群组'), workspaceDir: '', permissionTier: migrateTier(g.permissionTier, g.allowCommands), roleIds: [], sessionIds: [] })
        }
      }
      for (const g of core.groups.values()) loadGroupData(g)
      for (const item of (Array.isArray(ledger.sessions) ? ledger.sessions : [])) {
        if (item && typeof item.id === 'string' && core.groups.has(item.groupId)) loadSession(item.groupId, item.id, true)
      }
    } else if (s) {
      // ledger 缺失/损坏：扫描群组目录回收（群组名丢失，角色/工作区/会话从文件恢复）
      for (const gid of scanGroupIds(STORE_DIR)) {
        const g = emptyGroup(gid, '群组')
        core.groups.set(g.id, g)
        loadGroupData(g)
        for (const sid of scanSessionIds(s, gid)) loadSession(gid, sid, false)
      }
    }
    const autoSessions: string[] = []
    for (const g of core.groups.values()) {
      if (g.sessionIds.length === 0) {
        const sess = core.newSession(g.id)
        g.sessionIds.push(sess.id)
        autoSessions.push(sess.id)
      }
    }
    if (core.groups.size === 0) {
      const g: GroupRecord = { id: core.nid('grp'), name: '默认群组', workspaceDir: '', permissionTier: 'view_only', roleIds: [], sessionIds: [] }
      core.groups.set(g.id, g)
      const sess = core.newSession(g.id, '会话 1')
      g.sessionIds.push(sess.id)
      autoSessions.push(sess.id)
    }
    let maxSeq = 0
    for (const id of [...core.groups.keys(), ...core.roles.keys(), ...core.messages.keys()]) {
      const m = /-(\d+)$/.exec(id)
      if (m) maxSeq = Math.max(maxSeq, Number(m[1]))
    }
    core.idSeq = maxSeq + 1
    // 补建的默认会话/群组立即落盘，保证 ledger 与会话文件引用一致
    if (autoSessions.length > 0) {
      schedulePersist({ ledger: true })
      for (const sid of autoSessions) schedulePersist({ session: sid })
    }
  }
  hydrate()

  return {
    schedulePersist,
    flushNow,
    dropDirty,
    release(): void {
      const s = store()
      if (s === null) return
      try {
        flushNow()
      } catch {}
      try {
        s.release()
      } catch {}
      core.store = null
    },
  }
}
