/**
 * dsh-group-chat — DSH 模型群聊（host 平面组合插件，host + client 双半）。
 *
 * Host 半职责：
 *  - 群组 / 会话 / 角色 / 消息的状态机，会话级文件持久化于
 *    ~/.dsh/storages/group-chat/（PERSISTENCE.md v2.1：每群组一目录，
 *    sessions/session-<uuid>.json 一会话一文件；roles.json 与 workspaceDir
 *    随群组目录；ledger.json 纯清单；原子写 tmp+fsync+rename（每目录一次
 *    fsync）；单实例 .lock；损坏隔离重建；写失败保留脏标记；v1 自动迁移）
 *    数据模型：Group 1..N Session，消息挂在会话上；角色与工作区目录挂在群组上
 *  - 群组与会话的增删改；群组/会话检索由客户端在快照上过滤
 *  - 角色发言经 `llm` 服务流式生成，按角色绑定的 provider/model 路由
 *  - 群组工作区目录经 `fs` 服务读取（目录内文本文件），注入每个角色的共享上下文
 *  - 经 `webServer` 暴露 HTTP API：
 *      GET  /api/group-chat/state   全量快照
 *      POST /api/group-chat/action   { kind: mutate|send|stop|models|preview, ... }
 *      GET  /api/group-chat/events   SSE，状态变化时推送节流后的全量快照
 *
 * 设置命名空间 `group-chat`（settings.yaml 持久化）：`enabled` 控制浏览器半
 * 的侧边栏入口与主面板挂载；关闭时会中止正在进行的群聊。
 */

import z from 'schemastery'
import { homedir } from 'node:os'
import { basename, dirname, isAbsolute, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { chmodSync, closeSync, existsSync, fsyncSync, mkdirSync, openSync, readdirSync, readFileSync, renameSync, rmSync, statSync, unlinkSync, writeFileSync } from 'node:fs'

export const name = 'group-chat'

export const inject = ['llm', 'fs', 'webServer', 'workspaceRegistry']

/** 设置命名空间；浏览器半拼写同一值，两边不共享代码。 */
export const SETTINGS_NAMESPACE = 'group-chat'

const API_PREFIX = '/api/group-chat'
const HEARTBEAT_MS = 15e3
const PUSH_THROTTLE_MS = 120
const BODY_LIMIT = 1024 * 1024

/** 设置 schema：目前只有启停一个开关。 */
export const Config = z.object({
  enabled: z.boolean().default(true),
})

// ---------- HTTP 工具（参考 dsh-task-board 的回环信任栏） ----------

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' }

function writeJson(res, status, body, headers = {}) {
  const payload = JSON.stringify(body)
  res.writeHead(status, { ...JSON_HEADERS, ...headers })
  res.end(payload)
}

function isIPv4Loopback(v4) {
  const parts = v4.split('.')
  return parts.length === 4 && parts[0] === '127' && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
}

function isLoopbackAddress(address) {
  if (address === undefined) return false
  const normalized = address.toLowerCase()
  if (normalized === '::1') return true
  if (normalized.startsWith('::ffff:')) return isIPv4Loopback(normalized.slice(7))
  return isIPv4Loopback(normalized)
}

function isLoopbackHostname(hostname) {
  if (hostname === 'localhost' || hostname === '[::1]') return true
  return isIPv4Loopback(hostname)
}

/** 回环 socket + 回环 Host + 浏览器同源标记；X-Forwarded-For 一律不信任。 */
function isTrustedRequest(req) {
  if (!(req.headers['sec-fetch-site'] === 'same-origin' || typeof req.headers.origin === 'string')) return false
  if (!isLoopbackAddress(req.socket.remoteAddress)) return false
  const host = req.headers.host
  if (typeof host !== 'string') return false
  let hostUrl
  try {
    hostUrl = new URL('http://' + host)
  } catch {
    return false
  }
  if (!isLoopbackHostname(hostUrl.hostname)) return false
  if (req.headers['sec-fetch-site'] === 'cross-site') return false
  const origin = req.headers.origin
  if (origin === undefined) return true
  try {
    return new URL(origin).host === hostUrl.host
  } catch {
    return false
  }
}

async function readBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    const buffer = chunk
    size += buffer.length
    if (size > BODY_LIMIT) throw new Error('body-too-large')
    chunks.push(buffer)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}


// ---------- 持久化（PERSISTENCE.md v2.1：会话级文件隔离） ----------
/** DSH 主目录；DSH_GROUP_CHAT_STORE 供测试覆盖存储位置。 */
const DSH_HOME = process.env.DSH_HOME || join(homedir(), '.dsh')
const STORE_DIR = process.env.DSH_GROUP_CHAT_STORE || join(DSH_HOME, 'storages', 'group-chat')

const processIsAlive = (pid) => {
  try {
    process.kill(pid, 0)
    return true
  } catch (e) {
    return e.code === 'EPERM'
  }
}

const SESSION_FILE_RE = /^session-(.+)\.json$/

/** 消息 → 落盘 JSON（可选字段无则省略；兼容保留 error）。 */
const messageJson = (m) => {
  if (!m || typeof m.id !== 'string') return null
  const o = { id: m.id, speaker: m.speaker, text: String(m.text || ''), ts: typeof m.ts === 'number' ? m.ts : Date.now(), seq: typeof m.seq === 'number' ? m.seq : 0 }
  if (m.model !== undefined) o.model = m.model
  if (m.reasoning !== undefined) o.reasoning = m.reasoning
  if (m.reasoningFull !== undefined) o.reasoningFull = m.reasoningFull
  if (m.thinkingSummary !== undefined) o.thinkingSummary = m.thinkingSummary
  if (m.error !== undefined) o.error = m.error
  return o
}

/** 角色 → 落盘 JSON（groupId 由目录归属，不再写入）。 */
const roleJson = (r) => {
  const o = { id: r.id, name: String(r.name || '成员'), persona: String(r.persona || ''), provider: String(r.provider || ''), model: String(r.model || ''), enabled: r.enabled !== false, thinking: r.thinking === true }
  if (r.color) o.color = r.color
  if (typeof r.temperature === 'number' && !Number.isNaN(r.temperature)) o.temperature = r.temperature
  return o
}

/**
 * 目录布局（每群组一目录，一会话一文件）：
 *   <dir>/ledger.json                              群组/会话清单（schema 2，纯清单，pretty）
 *   <dir>/<group-id>/workspaceDir                  工作区目录设置（纯文本一行）
 *   <dir>/<group-id>/roles.json                    群组角色（schema 1，紧凑）
 *   <dir>/<group-id>/sessions/session-<uuid>.json   会话（schema 1，自包含，紧凑）
 */
class Store {
  constructor(dir) {
    this.dir = dir
    this.ledgerFile = join(dir, 'ledger.json')
    this.lockFile = join(dir, '.lock')
    mkdirSync(dir, { recursive: true })
    this.lockFd = this.acquireLock()
  }

  groupDir(groupId) { return join(this.dir, groupId) }
  sessionsDir(groupId) { return join(this.groupDir(groupId), 'sessions') }
  sessionFile(groupId, sessionId) { return join(this.sessionsDir(groupId), 'session-' + sessionId + '.json') }
  rolesFile(groupId) { return join(this.groupDir(groupId), 'roles.json') }
  workspaceFile(groupId) { return join(this.groupDir(groupId), 'workspaceDir') }

  acquireLock() {
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
        if (e.code !== 'EEXIST') throw e
        let pid
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
          if (ue.code !== 'ENOENT') throw ue
        }
      }
    }
    throw new Error('持久化锁获取失败')
  }

  release() {
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

  fsyncDir(dir) {
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
  atomicWrite(file, text) {
    mkdirSync(dirname(file), { recursive: true })
    const tmp = `${file}.tmp-${process.pid}`
    let fd
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

  quarantine(file) {
    try {
      renameSync(file, `${file}.corrupt-${Date.now()}-${process.pid}`)
    } catch {}
  }

  /** 读 JSON；缺失返回 null；损坏则隔离后返回 null。 */
  loadJson(file) {
    let raw
    try {
      raw = readFileSync(file, 'utf8')
    } catch (e) {
      if (e.code === 'ENOENT') return null
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

  readWorkspace(groupId) {
    try {
      return readFileSync(this.workspaceFile(groupId), 'utf8').trim()
    } catch {
      return ''
    }
  }

  /** hydrate 残留清理：.tmp-* 删除；同前缀 .corrupt-* 只保留最近 1 份。 */
  cleanup() {
    const sweep = (dir) => {
      let entries
      try {
        entries = readdirSync(dir, { withFileTypes: true })
      } catch {
        return
      }
      const corrupt = new Map()
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
          corrupt.get(m[1]).push({ name: e.name, mtime })
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
    let entries
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
  migrateV1() {
    const v1MessagesFile = join(this.dir, 'messages.json')
    if (!existsSync(v1MessagesFile)) return
    const v1Ledger = this.loadJson(this.ledgerFile)
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
    let dirs
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
    const groupsById = new Map()
    for (const g of v1Ledger.groups) {
      if (g && typeof g.id === 'string') groupsById.set(g.id, g)
    }
    const rolesByGroup = new Map()
    for (const r of (Array.isArray(v1Ledger.roles) ? v1Ledger.roles : [])) {
      if (r && typeof r.id === 'string' && groupsById.has(r.groupId)) {
        if (!rolesByGroup.has(r.groupId)) rolesByGroup.set(r.groupId, [])
        rolesByGroup.get(r.groupId).push(r)
      }
    }
    const v1Sessions = (Array.isArray(v1Ledger.sessions) ? v1Ledger.sessions : []).filter((s) => s && typeof s.id === 'string' && groupsById.has(s.groupId))
    const sessionIds = new Set(v1Sessions.map((s) => s.id))
    const messagesDoc = this.loadJson(v1MessagesFile)
    const messagesBySession = new Map()
    for (const m of (messagesDoc && Array.isArray(messagesDoc.messages) ? messagesDoc.messages : [])) {
      if (m && typeof m.id === 'string' && sessionIds.has(m.sessionId)) {
        if (!messagesBySession.has(m.sessionId)) messagesBySession.set(m.sessionId, [])
        messagesBySession.get(m.sessionId).push(m)
      }
    }
    // 3. 每会话新 uuid，写会话文件（紧凑）
    const fsyncDirs = new Set()
    const uuidById = new Map()
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
        messages: (messagesBySession.get(s.id) || []).map(messageJson).filter(Boolean),
      }
      this.atomicWrite(this.sessionFile(s.groupId, uuid), JSON.stringify(doc))
      fsyncDirs.add(this.sessionsDir(s.groupId))
    }
    // 4/5. 每群 roles.json + workspaceDir
    for (const g of groupsById.values()) {
      this.atomicWrite(this.rolesFile(g.id), JSON.stringify({ schema: 1, savedAt: Date.now(), roles: (rolesByGroup.get(g.id) || []).map(roleJson) }))
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

// ---------- 插件入口 ----------

export function apply(ctx, config) {
  const llm = ctx.llm
  const fs = ctx.fs

  // ---------- 状态机 ----------
  let revision = 1
  let idSeq = 1
  const nid = (p) => p + '-' + (idSeq++)
  const PALETTE = ['#5b8def', '#22a06b', '#e8912d', '#c678dd', '#e05661', '#56b6c2', '#98c379', '#d19a66']

  const groups = new Map()
  const sessions = new Map()
  const roles = new Map()
  const messages = new Map()
  const run = { running: false, sessionId: null, currentRoleId: null, partial: '', partialReasoning: '', stopping: false, queue: [] }
  let modelCache = null
  /** 最近一次创建的群组/会话，供客户端定位选中项。 */
  let lastCreated = null

  const groupSessionCount = (groupId) => {
    let n = 0
    for (const s of sessions.values()) if (s.groupId === groupId) n++
    return n
  }

  const newSession = (groupId, name) => {
    const s = {
      id: randomUUID(),
      groupId,
      name: name || '会话 ' + (groupSessionCount(groupId) + 1),
      topic: '',
      messageIds: [],
      createdAt: Date.now(),
    }
    sessions.set(s.id, s)
    return s
  }

  // ---- 持久化：锁失败/写失败时降级为内存态运行（console 告警） ----
  let store = null
  try {
    store = new Store(STORE_DIR)
  } catch (e) {
    console.error('[dsh-group-chat] 持久化不可用，本实例以内存态运行（重启后数据不保留）：', e)
  }

  // 脏标记按文件记；flush 失败者保留脏标记，下次触发自动重试
  const dirtySessions = new Set()
  const dirtyRoles = new Set()
  const dirtyWorkspace = new Set()
  let ledgerDirty = false
  let flushScheduled = false

  const ledgerDocument = () => ({
    schema: 2,
    savedAt: Date.now(),
    groups: [...groups.values()].map((g) => ({ id: g.id, name: g.name })),
    sessions: [...groups.values()].flatMap((g) => g.sessionIds.map((sid) => ({ id: sid, groupId: g.id }))),
  })
  const sessionDocument = (s) => ({
    schema: 1,
    savedAt: Date.now(),
    id: s.id,
    name: s.name,
    groupId: s.groupId,
    topic: s.topic,
    createdAt: s.createdAt,
    messages: s.messageIds.map((mid) => messages.get(mid)).filter(Boolean).map(messageJson).filter(Boolean),
  })
  const rolesDocument = (g) => ({ schema: 1, savedAt: Date.now(), roles: g.roleIds.map((rid) => roles.get(rid)).filter(Boolean).map(roleJson) })

  /** 同步 flush：写全部脏文件；成功才清脏标记；每个实际发生 rename 的目录一次 fsync。 */
  const flushNow = () => {
    if (store === null) return
    const fsyncDirs = new Set()
    for (const sid of [...dirtySessions]) {
      const s = sessions.get(sid)
      if (!s) {
        dirtySessions.delete(sid)
        continue
      }
      try {
        store.atomicWrite(store.sessionFile(s.groupId, s.id), JSON.stringify(sessionDocument(s)))
        dirtySessions.delete(sid)
        fsyncDirs.add(store.sessionsDir(s.groupId))
      } catch (e) {
        console.error(`[dsh-group-chat] 会话 ${sid} 落盘失败（保留脏标记待重试）：`, e)
      }
    }
    for (const gid of [...dirtyRoles]) {
      const g = groups.get(gid)
      if (!g) {
        dirtyRoles.delete(gid)
        continue
      }
      try {
        store.atomicWrite(store.rolesFile(gid), JSON.stringify(rolesDocument(g)))
        dirtyRoles.delete(gid)
        fsyncDirs.add(store.groupDir(gid))
      } catch (e) {
        console.error(`[dsh-group-chat] 群组 ${gid} roles.json 落盘失败（保留脏标记待重试）：`, e)
      }
    }
    for (const gid of [...dirtyWorkspace]) {
      const g = groups.get(gid)
      if (!g) {
        dirtyWorkspace.delete(gid)
        continue
      }
      try {
        store.atomicWrite(store.workspaceFile(gid), (g.workspaceDir || '') + '\n')
        dirtyWorkspace.delete(gid)
        fsyncDirs.add(store.groupDir(gid))
      } catch (e) {
        console.error(`[dsh-group-chat] 群组 ${gid} workspaceDir 落盘失败（保留脏标记待重试）：`, e)
      }
    }
    if (ledgerDirty) {
      try {
        store.atomicWrite(store.ledgerFile, JSON.stringify(ledgerDocument(), null, 2))
        ledgerDirty = false
        fsyncDirs.add(store.dir)
      } catch (e) {
        console.error('[dsh-group-chat] ledger.json 落盘失败（保留脏标记待重试）：', e)
      }
    }
    for (const d of fsyncDirs) store.fsyncDir(d)
  }

  /** 事件驱动落盘；同一 tick 内多次变更合并为一次写。 */
  const schedulePersist = ({ ledger = false, session = null, roles = null, workspace = null } = {}) => {
    if (store === null) return
    if (ledger) ledgerDirty = true
    if (session) dirtySessions.add(session)
    if (roles) dirtyRoles.add(roles)
    if (workspace) dirtyWorkspace.add(workspace)
    if (flushScheduled) return
    flushScheduled = true
    void Promise.resolve().then(() => {
      flushScheduled = false
      flushNow()
    })
  }

  // ---- 启动恢复：v1 迁移 → 残留清理 → 清单 → 群组数据 → 会话文件；缺文件空重建 ----

  const loadSession = (groupId, sid, noteMissing) => {
    if (sessions.has(sid)) return
    const g = groups.get(groupId)
    if (!g) return
    const sess = { id: sid, groupId, name: '会话', topic: '', messageIds: [], createdAt: Date.now() }
    let doc = null
    if (store) {
      const file = store.sessionFile(groupId, sid)
      if (noteMissing && !existsSync(file)) console.error(`[dsh-group-chat] 会话 ${sid} 文件缺失，按空消息重建`)
      doc = store.loadJson(file)
    }
    if (doc) {
      if (typeof doc.name === 'string' && doc.name) sess.name = doc.name
      if (typeof doc.topic === 'string') sess.topic = doc.topic
      if (typeof doc.createdAt === 'number') sess.createdAt = doc.createdAt
      let fallbackSeq = 0
      for (const m of (Array.isArray(doc.messages) ? doc.messages : [])) {
        if (!m || typeof m.id !== 'string' || messages.has(m.id)) continue
        fallbackSeq++
        messages.set(m.id, {
          id: m.id,
          sessionId: sid,
          seq: typeof m.seq === 'number' ? m.seq : fallbackSeq,
          speaker: m.speaker,
          text: String(m.text || ''),
          reasoning: m.reasoning !== undefined ? String(m.reasoning) : undefined,
          reasoningFull: m.reasoningFull !== undefined ? String(m.reasoningFull) : undefined,
          thinkingSummary: m.thinkingSummary !== undefined ? String(m.thinkingSummary) : undefined,
          model: m.model,
          error: m.error,
          ts: typeof m.ts === 'number' ? m.ts : Date.now(),
        })
        sess.messageIds.push(m.id)
      }
    }
    sessions.set(sid, sess)
    g.sessionIds.push(sid)
  }

  const loadGroupData = (g) => {
    if (!store) return
    g.workspaceDir = store.readWorkspace(g.id)
    const doc = store.loadJson(store.rolesFile(g.id))
    if (doc && Array.isArray(doc.roles)) {
      for (const r of doc.roles) {
        if (r && typeof r.id === 'string' && !roles.has(r.id)) {
          roles.set(r.id, {
            id: r.id,
            groupId: g.id,
            name: String(r.name || '成员'),
            color: r.color || undefined,
            persona: String(r.persona || ''),
            provider: String(r.provider || ''),
            model: String(r.model || ''),
            temperature: typeof r.temperature === 'number' ? r.temperature : undefined,
            enabled: r.enabled !== false,
            thinking: r.thinking === true,
          })
          g.roleIds.push(r.id)
        }
      }
    }
  }

  const hydrate = () => {
    if (store) {
      try {
        store.migrateV1()
      } catch (e) {
        console.error('[dsh-group-chat] v1 数据迁移失败，下次启动重试：', e)
      }
      try {
        store.cleanup()
      } catch {}
    }
    const ledger = store ? store.loadJson(store.ledgerFile) : null
    if (ledger && Array.isArray(ledger.groups)) {
      for (const g of ledger.groups) {
        if (g && typeof g.id === 'string' && !groups.has(g.id)) {
          groups.set(g.id, { id: g.id, name: String(g.name || '群组'), workspaceDir: '', roleIds: [], sessionIds: [] })
        }
      }
      for (const g of groups.values()) loadGroupData(g)
      for (const item of (Array.isArray(ledger.sessions) ? ledger.sessions : [])) {
        if (item && typeof item.id === 'string' && groups.has(item.groupId)) loadSession(item.groupId, item.id, true)
      }
    } else if (store) {
      // ledger 缺失/损坏：扫描群组目录回收（群组名丢失，角色/工作区/会话从文件恢复）
      let entries
      try {
        entries = readdirSync(STORE_DIR, { withFileTypes: true })
      } catch {
        entries = []
      }
      for (const e of entries) {
        if (!e.isDirectory()) continue
        const g = { id: e.name, name: '群组', workspaceDir: '', roleIds: [], sessionIds: [] }
        groups.set(g.id, g)
        loadGroupData(g)
        let sessEntries
        try {
          sessEntries = readdirSync(join(STORE_DIR, e.name, 'sessions'), { withFileTypes: true })
        } catch {
          sessEntries = []
        }
        for (const se of sessEntries) {
          if (!se.isFile()) continue
          const m = SESSION_FILE_RE.exec(se.name)
          if (m) loadSession(e.name, m[1], false)
        }
      }
    }
    const autoSessions = []
    for (const g of groups.values()) {
      if (g.sessionIds.length === 0) {
        const s = newSession(g.id)
        sessions.set(s.id, s)
        g.sessionIds.push(s.id)
        autoSessions.push(s.id)
      }
    }
    if (groups.size === 0) {
      const g = { id: nid('grp'), name: '默认群组', workspaceDir: '', roleIds: [], sessionIds: [] }
      groups.set(g.id, g)
      const s = newSession(g.id, '会话 1')
      sessions.set(s.id, s)
      g.sessionIds.push(s.id)
      autoSessions.push(s.id)
    }
    let maxSeq = 0
    for (const id of [...groups.keys(), ...roles.keys(), ...messages.keys()]) {
      const m = /-(\d+)$/.exec(id)
      if (m) maxSeq = Math.max(maxSeq, Number(m[1]))
    }
    idSeq = maxSeq + 1
    // 补建的默认会话/群组立即落盘，保证 ledger 与会话文件引用一致
    if (autoSessions.length > 0) {
      schedulePersist({ ledger: true })
      for (const sid of autoSessions) schedulePersist({ session: sid })
    }
  }
  hydrate()

  // ---------- SSE 广播（节流） ----------
  const subscribers = new Set()
  let pushTimer = null
  const broadcast = () => {
    if (pushTimer !== null) return
    pushTimer = setTimeout(() => {
      pushTimer = null
      for (const push of subscribers) push()
    }, PUSH_THROTTLE_MS)
  }

  const touch = () => {
    revision++
    broadcast()
  }

  const snapshot = () => ({
    revision,
    run: { running: run.running, sessionId: run.sessionId, currentRoleId: run.currentRoleId, partial: run.partial, partialReasoning: run.partialReasoning },
    lastCreated,
    groups: [...groups.values()].map((g) => ({ id: g.id, name: g.name, workspaceDir: g.workspaceDir, roleIds: g.roleIds.slice(), sessionIds: g.sessionIds.slice() })),
    sessions: [...sessions.values()].map((s) => ({ id: s.id, groupId: s.groupId, name: s.name, topic: s.topic, messageIds: s.messageIds.slice(), createdAt: s.createdAt })),
    roles: [...roles.values()].map((r) => ({ id: r.id, groupId: r.groupId, name: r.name, color: r.color, persona: r.persona, provider: r.provider, model: r.model, temperature: r.temperature, enabled: r.enabled, thinking: r.thinking === true })),
    messages: [...messages.values()].map((m) => ({ id: m.id, sessionId: m.sessionId, seq: m.seq, speaker: m.speaker, text: m.text, reasoning: m.reasoning, model: m.model, error: m.error, ts: m.ts })),
  })

  const appendMessage = (sess, speaker, text, extra) => {
    const msg = { id: nid('msg'), sessionId: sess.id, seq: sess.messageIds.length + 1, speaker, text, reasoning: undefined, model: undefined, error: undefined, ts: Date.now() }
    if (extra) {
      if (extra.reasoning !== undefined) msg.reasoning = extra.reasoning
      if (extra.reasoningFull !== undefined) msg.reasoningFull = extra.reasoningFull
      if (extra.thinkingSummary !== undefined) msg.thinkingSummary = extra.thinkingSummary
      if (extra.model !== undefined) msg.model = extra.model
      if (extra.error !== undefined) msg.error = extra.error
    }
    messages.set(msg.id, msg)
    sess.messageIds.push(msg.id)
    touch()
    schedulePersist({ session: sess.id })
    return msg
  }

  // ---------- 资料读取与路径解析 ----------
  // 路径解析顺序：~ 展开到 home；绝对路径直用；相对路径先试各工作区根，
  // 再试 dsh web 进程 cwd。目录浏览器与资料读取共用同一套解析。

  const HOME = homedir()
  let workspacePathsCache = { at: 0, paths: [] }
  const workspacePaths = async () => {
    const now = Date.now()
    if (now - workspacePathsCache.at < 5000) return workspacePathsCache.paths
    try {
      const list = await ctx.workspaceRegistry.list()
      workspacePathsCache = { at: now, paths: list.map((w) => w.path).filter(Boolean) }
    } catch {
      workspacePathsCache = { at: now, paths: workspacePathsCache.paths }
    }
    return workspacePathsCache.paths
  }

  const candidatePaths = async (raw) => {
    const p = String(raw || '').trim()
    if (p === '' || p === '~') return [HOME]
    if (p.startsWith('~/')) return [join(HOME, p.slice(2))]
    if (isAbsolute(p)) return [p]
    const roots = [...(await workspacePaths()), process.cwd()]
    return roots.map((root) => join(root, p))
  }

  /** 逐候选 stat，返回第一个存在的目标；都不存在时返回首候选与全部尝试。 */
  const resolveMaterialTarget = async (raw) => {
    const candidates = await candidatePaths(raw)
    let first
    for (const c of candidates) {
      const target = await fs.resolve(c)
      if (first === undefined) first = { target, path: c }
      const info = await fs.stat(target)
      if (info !== undefined) return { target, path: c, info }
    }
    return { target: first.target, path: first.path, info: undefined, tried: candidates }
  }

  // 群组工作区目录 → 注入文件清单：目录内文本文件（白名单扩展名、跳过隐藏项，
  // 最多 20 个），单文件 16k、总量 48k 截断由 materialBlock 执行。
  const TEXT_EXTS = new Set(['.md', '.markdown', '.txt', '.json', '.yml', '.yaml', '.csv', '.tsv', '.toml', '.ini', '.conf', '.env', '.properties', '.log', '.xml', '.html', '.css', '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.c', '.h', '.cpp', '.sql', '.sh'])
  const MAX_WS_FILES = 20

  const loadWorkspaceFiles = async (g) => {
    if (!g.workspaceDir) return { dir: '', parts: [] }
    const res = await resolveMaterialTarget(g.workspaceDir)
    if (res.info === undefined) throw new Error('工作区目录不存在（尝试过：' + res.tried.join('；') + '）')
    if (res.info.type !== 'directory') throw new Error('工作区目录不是目录：' + res.path)
    const entries = await fs.listDir(res.target)
    const parts = []
    for (const e of entries) {
      if (parts.length >= MAX_WS_FILES) break
      if (e.type !== 'file' || e.name.startsWith('.')) continue
      const dot = e.name.lastIndexOf('.')
      const ext = dot === -1 ? '' : e.name.slice(dot).toLowerCase()
      if (!TEXT_EXTS.has(ext)) continue
      try {
        const text = await fs.readText(e.target)
        parts.push({ name: e.name, content: text })
      } catch (err) {
        parts.push({ name: e.name, content: '', error: String((err && err.message) || err) })
      }
    }
    return { dir: res.path, parts }
  }

  /** 目录浏览：返回文件+目录条目（绝对路径由 Host 解析，客户端不拼路径）。 */
  const browse = async (args) => {
    try {
      const raw = String((args && args.path) || '').trim()
      const res = await resolveMaterialTarget(raw === '' ? HOME : raw)
      if (res.info === undefined) return { ok: false, error: '路径不存在，尝试过：' + res.tried.join('；') }
      let dirPath = res.path
      let target = res.target
      if (res.info.type !== 'directory') {
        dirPath = dirname(dirPath)
        target = await fs.resolve(dirPath)
      }
      const entries = await fs.listDir(target)
      const sorted = [...entries].sort((a, b) => (a.type === 'directory' ? 0 : 1) - (b.type === 'directory' ? 0 : 1) || a.name.localeCompare(b.name))
      return {
        ok: true,
        path: dirPath,
        home: HOME,
        parent: dirname(dirPath),
        entries: sorted.map((e) => ({ name: e.name, type: e.type, path: fs.processPath(e.target), size: e.size, hidden: e.name.startsWith('.') })),
      }
    } catch (e) {
      return { ok: false, error: String((e && e.message) || e) }
    }
  }

  const materialBlock = (parts, dir) => {
    if (!parts.length) return ''
    let total = 0
    const lines = []
    for (const p of parts) {
      if (p.error) {
        lines.push('### ' + p.name + '\n[读取失败] ' + p.error)
        continue
      }
      let c = p.content || ''
      if (c.length > 16000) c = c.slice(0, 16000) + '\n…(已截断)'
      if (total + c.length > 48000) c = c.slice(0, Math.max(0, 48000 - total)) + '\n…(总量超限截断)'
      total += c.length
      lines.push('### ' + p.name + '\n' + c)
    }
    return '\n# 共享资料（来自群组工作区目录' + (dir ? ' ' + dir : '') + '，群内所有成员可见）\n' + lines.join('\n\n')
  }

  // ---------- 对话引擎 ----------

  const transcriptBlock = (sess) => {
    const out = []
    for (const mid of sess.messageIds) {
      const m = messages.get(mid)
      if (!m) continue
      const name = m.speaker === 'user' ? '用户' : m.speaker === 'system' ? '系统' : (roles.get(m.speaker) || {}).name || '成员'
      let text = m.text || ''
      if (text.length > 8000) text = text.slice(0, 8000) + '…(已截断)'
      out.push('【' + name + '】' + text)
    }
    return out.slice(-40).join('\n\n')
  }

  const speak = async (g, sess, role) => {
    const ws = await loadWorkspaceFiles(g)
    const parts = ws.parts
    const sys = [
      '你正在参与一个多角色群聊。你在群中的身份如下，请始终以该身份发言。',
      '',
      '# 你的角色',
      '- 名称：' + role.name,
      '- 人设：' + (role.persona ? role.persona : '（未填写，请以积极协作者的身份参与讨论）'),
      sess.topic ? '\n# 本会话主题\n' + sess.topic : '',
      materialBlock(parts, ws.dir),
      '\n# 发言要求',
      '- 直接输出「' + role.name + '」本轮的发言内容本身：不要输出名字前缀、引号、动作旁白或代码围栏',
      '- 回应群内最新讨论（消息中「@你的名字」表示用户点名要求你回应，被点名时请优先回应）；与其他成员自然对话；有不同观点可以提出并说明理由',
      '- 保持简洁，通常不超过 300 字',
    ].filter((s) => s !== '').join('\n')

    const history = transcriptBlock(sess)
    const text = history
      ? '以下是本会话的群聊记录（从旧到新）：\n\n' + history
      : '本会话刚刚开始，请围绕主题做简短开场发言。'

    const opts = {
      provider: role.provider,
      model: role.model,
      system: sys,
      messages: [{ id: 'g' + revision, role: 'user', content: [{ type: 'text', text }], source: { kind: 'user' } }],
    }
    if (typeof role.temperature === 'number' && !Number.isNaN(role.temperature)) opts.temperature = role.temperature
    // 深度思考：角色级开关；模型不支持 reasoning effort 时本地解析即失败，降级重发
    const wantThinking = role.thinking === true
    if (wantThinking) opts.reasoningEffort = 'high'

    const streamOnce = async () => {
      let acc = ''
      let reasoningAcc = ''
      for await (const chunk of llm.stream(opts)) {
        if (run.stopping) break
        if (chunk.type === 'text-delta') {
          acc += chunk.text
          run.partial = acc
          touch()
        } else if (chunk.type === 'reasoning-delta') {
          reasoningAcc += chunk.text
          run.partialReasoning = reasoningAcc
          touch()
        } else if (chunk.type === 'finish' && (chunk.reason === 'error' || chunk.reason === 'aborted')) {
          throw new Error('模型输出异常终止: ' + chunk.reason)
        }
      }
      return { text: acc.trim(), reasoning: reasoningAcc.trim() || undefined }
    }
    try {
      return await streamOnce()
    } catch (e) {
      const msg = String((e && e.message) || e)
      if (wantThinking && msg.includes('UNSUPPORTED_REASONING_EFFORT')) {
        delete opts.reasoningEffort
        return await streamOnce()
      }
      throw e
    }
  }

  const runLoop = async (sess) => {
    const g = groups.get(sess.groupId)
    try {
      while (run.queue.length > 0 && !run.stopping) {
        const roleId = run.queue.shift()
        const role = roles.get(roleId)
        run.currentRoleId = roleId
        run.partial = ''
        run.partialReasoning = ''
        touch()
        if (!role) continue
        try {
          const out = await speak(g, sess, role)
          if (out.text) appendMessage(sess, role.id, out.text, { model: role.provider + ' / ' + role.model, reasoning: out.reasoning })
        } catch (e) {
          appendMessage(sess, 'system', '角色「' + role.name + '」发言失败：' + String((e && e.message) || e), { error: true })
          break
        }
      }
      if (run.stopping) appendMessage(sess, 'system', '已停止本次对话', {})
    } finally {
      run.running = false
      run.sessionId = null
      run.currentRoleId = null
      run.partial = ''
      run.partialReasoning = ''
      run.queue = []
      run.stopping = false
      touch()
    }
  }

  // ---------- 动作 ----------

  const mutate = (args) => {
    const op = args && args.op
    if (op === 'createGroup') {
      const g = { id: nid('grp'), name: String(args.name || '').trim() || '群组 ' + (groups.size + 1), workspaceDir: '', roleIds: [], sessionIds: [] }
      groups.set(g.id, g)
      const sess = newSession(g.id)
      g.sessionIds.push(sess.id)
      lastCreated = { kind: 'group', groupId: g.id, sessionId: sess.id }
      schedulePersist({ ledger: true, session: sess.id })
      touch()
    } else if (op === 'renameGroup') {
      const g = groups.get(args.groupId)
      if (g && String(args.name || '').trim()) {
        g.name = String(args.name).trim()
        schedulePersist({ ledger: true })
        touch()
      }
    } else if (op === 'deleteGroup') {
      const g = groups.get(args.groupId)
      if (!g) return { ...snapshot(), error: '群组不存在' }
      if (groups.size <= 1) return { ...snapshot(), error: '至少保留一个群组' }
      if (run.running) {
        const runSession = sessions.get(run.sessionId)
        if (runSession && runSession.groupId === g.id) return { ...snapshot(), error: '对话进行中，无法删除群组' }
      }
      for (const sid of g.sessionIds) {
        const sess = sessions.get(sid)
        if (sess) for (const mid of sess.messageIds) messages.delete(mid)
        sessions.delete(sid)
        dirtySessions.delete(sid)
      }
      for (const rid of g.roleIds) roles.delete(rid)
      groups.delete(g.id)
      dirtyRoles.delete(g.id)
      dirtyWorkspace.delete(g.id)
      if (store !== null) {
        try {
          rmSync(store.groupDir(g.id), { recursive: true, force: true })
        } catch (e) {
          console.error('[dsh-group-chat] 群组目录清理失败：', e)
        }
      }
      schedulePersist({ ledger: true })
      touch()
    } else if (op === 'createSession') {
      const g = groups.get(args.groupId)
      if (!g) return { ...snapshot(), error: '群组不存在' }
      const sess = newSession(g.id, String(args.name || '').trim() || undefined)
      g.sessionIds.push(sess.id)
      lastCreated = { kind: 'session', groupId: g.id, sessionId: sess.id }
      schedulePersist({ ledger: true, session: sess.id })
      touch()
    } else if (op === 'renameSession') {
      const sess = sessions.get(args.sessionId)
      if (sess && String(args.name || '').trim()) {
        sess.name = String(args.name).trim()
        schedulePersist({ session: sess.id })
        touch()
      }
    } else if (op === 'deleteSession') {
      const sess = sessions.get(args.sessionId)
      if (!sess) return { ...snapshot(), error: '会话不存在' }
      const g = groups.get(sess.groupId)
      if (g && g.sessionIds.length <= 1) return { ...snapshot(), error: '每个群组至少保留一个会话' }
      if (run.running && run.sessionId === sess.id) return { ...snapshot(), error: '对话进行中，无法删除会话' }
      for (const mid of sess.messageIds) messages.delete(mid)
      sessions.delete(sess.id)
      dirtySessions.delete(sess.id)
      if (g) g.sessionIds = g.sessionIds.filter((x) => x !== sess.id)
      if (store !== null) {
        try {
          unlinkSync(store.sessionFile(sess.groupId, sess.id))
        } catch {}
      }
      schedulePersist({ ledger: true })
      touch()
    } else if (op === 'setTopic') {
      const sess = sessions.get(args.sessionId)
      if (sess) {
        sess.topic = String(args.topic || '')
        schedulePersist({ session: sess.id })
        touch()
      }
    } else if (op === 'upsertRole') {
      const g = groups.get(args.groupId)
      const r = args.role || {}
      if (!g) return { ...snapshot(), error: '群组不存在' }
      if (!r.name || !String(r.name).trim()) return { ...snapshot(), error: '角色名称不能为空' }
      if (!r.provider || !r.model) return { ...snapshot(), error: '请选择角色绑定的模型' }
      if (r.id && roles.get(r.id)) {
        const ex = roles.get(r.id)
        ex.name = String(r.name).trim()
        ex.color = r.color || ex.color
        ex.persona = r.persona || ''
        ex.provider = r.provider
        ex.model = r.model
        ex.temperature = typeof r.temperature === 'number' && !Number.isNaN(r.temperature) ? r.temperature : undefined
        ex.enabled = r.enabled !== false
        ex.thinking = r.thinking === true
        schedulePersist({ roles: g.id })
        touch()
      } else {
        const nr = {
          id: nid('role'),
          groupId: g.id,
          name: String(r.name).trim(),
          color: r.color || PALETTE[g.roleIds.length % PALETTE.length],
          persona: r.persona || '',
          provider: r.provider,
          model: r.model,
          temperature: typeof r.temperature === 'number' && !Number.isNaN(r.temperature) ? r.temperature : undefined,
          enabled: true,
          thinking: r.thinking === true,
        }
        roles.set(nr.id, nr)
        g.roleIds.push(nr.id)
        schedulePersist({ roles: g.id })
        touch()
      }
    } else if (op === 'deleteRole') {
      const r = roles.get(args.roleId)
      if (r) {
        const gid = r.groupId
        const g = groups.get(gid)
        if (g) g.roleIds = g.roleIds.filter((x) => x !== r.id)
        roles.delete(r.id)
        schedulePersist({ roles: gid })
        touch()
      }
    } else if (op === 'setRoleEnabled') {
      const r = roles.get(args.roleId)
      if (r) {
        r.enabled = !!args.enabled
        schedulePersist({ roles: r.groupId })
        touch()
      }
    } else if (op === 'setWorkspaceDir') {
      const g = groups.get(args.groupId)
      if (g) {
        g.workspaceDir = String(args.path || '').trim()
        schedulePersist({ workspace: g.id })
        touch()
      }
    } else if (op === 'clearMessages') {
      const sess = sessions.get(args.sessionId)
      if (sess) {
        if (run.running && run.sessionId === sess.id) return { ...snapshot(), error: '对话进行中，无法清空' }
        for (const mid of sess.messageIds) messages.delete(mid)
        sess.messageIds = []
        schedulePersist({ session: sess.id })
        touch()
      }
    }
    return snapshot()
  }

  const send = (args) => {
    const sess = sessions.get(args.sessionId)
    if (!sess) return { ok: false, error: '会话不存在' }
    const g = groups.get(sess.groupId)
    if (!g) return { ok: false, error: '群组不存在' }
    if (run.running) return { ok: false, error: '已有对话进行中，请先停止' }
    let parts = Array.isArray(args.participantRoleIds) ? args.participantRoleIds.slice() : []
    parts = parts.filter((id) => {
      const r = roles.get(id)
      return r && r.groupId === g.id && r.enabled
    })
    if (!parts.length) parts = g.roleIds.filter((id) => {
      const r = roles.get(id)
      return r && r.enabled
    })
    if (!parts.length) return { ok: false, error: '群内还没有启用的角色，请先添加角色' }
    const rounds = Math.max(1, Math.min(10, Math.floor(Number(args.rounds) || 1)))
    const text = String(args.text || '').trim().slice(0, 32000)
    if (text) appendMessage(sess, 'user', text)
    const queue = []
    for (let i = 0; i < rounds; i++) for (const rid of parts) queue.push(rid)
    run.running = true
    run.sessionId = sess.id
    run.queue = queue
    run.stopping = false
    touch()
    runLoop(sess).catch((e) => console.error('group-chat run failed', e))
    return { ok: true }
  }

  const stop = (args) => {
    if (run.running && (!args || !args.sessionId || run.sessionId === args.sessionId)) {
      run.stopping = true
      touch()
    }
    return { ok: true }
  }

  const models = async () => {
    const now = Date.now()
    if (modelCache && now - modelCache.at < 60000) return modelCache
    const providers = await llm.listProviders()
    const modelsByProvider = {}
    for (const p of providers) {
      try {
        modelsByProvider[p.id] = await llm.listModels(p.id)
      } catch {
        modelsByProvider[p.id] = []
      }
    }
    modelCache = { at: now, providers: providers.map((p) => ({ id: p.id, name: p.name || p.id })), modelsByProvider }
    return modelCache
  }

  const handleAction = async (body) => {
    const kind = body && body.kind
    if (kind === 'mutate') return { ok: true, snapshot: mutate(body), lastCreated }
    if (kind === 'send') return send(body)
    if (kind === 'stop') return stop(body)
    if (kind === 'models') return { ok: true, ...(await models()) }
    if (kind === 'browse') return browse(body)
    return { ok: false, error: 'unknown-action' }
  }

  // ---------- HTTP 路由 ----------

  const guard = (req, res) => {
    if (isTrustedRequest(req)) return true
    writeJson(res, 403, { ok: false, error: 'forbidden' }, { 'cache-control': 'no-store' })
    return false
  }

  const routes = [
    {
      kind: 'exact',
      path: API_PREFIX + '/state',
      handler: (req, res) => {
        if (req.method !== 'GET') return writeJson(res, 405, { ok: false, error: 'method-not-allowed' })
        if (!guard(req, res)) return
        writeJson(res, 200, { ok: true, ...snapshot() }, { 'cache-control': 'no-store' })
      },
    },
    {
      kind: 'exact',
      path: API_PREFIX + '/action',
      handler: async (req, res) => {
        if (req.method !== 'POST') return writeJson(res, 405, { ok: false, error: 'method-not-allowed' })
        if (!guard(req, res)) return
        if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
          return writeJson(res, 415, { ok: false, error: 'json-required' })
        }
        try {
          const body = await readBody(req)
          writeJson(res, 200, await handleAction(body), { 'cache-control': 'no-store' })
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e)
          writeJson(res, message === 'body-too-large' ? 413 : 400, { ok: false, error: message })
        }
      },
    },
    {
      kind: 'exact',
      path: API_PREFIX + '/events',
      handler: (req, res) => {
        if (req.method !== 'GET') {
          res.writeHead(405)
          res.end()
          return
        }
        if (!guard(req, res)) return
        res.writeHead(200, {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-cache',
          connection: 'keep-alive',
        })
        const push = () => {
          try {
            res.write('data: ' + JSON.stringify({ ok: true, ...snapshot() }) + '\n\n')
          } catch {
            /* connection gone; close handler cleans up */
          }
        }
        subscribers.add(push)
        const heartbeat = setInterval(() => {
          try {
            res.write(': ping\n\n')
          } catch {
            /* ignore */
          }
        }, HEARTBEAT_MS)
        const close = () => {
          clearInterval(heartbeat)
          subscribers.delete(push)
        }
        req.once('close', close)
        res.once('close', close)
        push()
      },
    },
  ]

  ctx.effect(() => {
    const disposers = routes.map((route) => ctx.webServer.register(route))
    return () => {
      for (const dispose of disposers) dispose()
    }
  }, 'group-chat: host API routes')

  // 插件卸载/热重载：同步最终 flush → 释放锁 → 置空 store（消除在途 flush 交错窗口）
  ctx.effect(() => () => {
    run.stopping = true
    if (store !== null) {
      try {
        flushNow()
      } catch {}
      try {
        store.release()
      } catch {}
      store = null
    }
  })

  // ---------- 设置（enabled 持久化于 settings.yaml） ----------

  let current = () => config ?? {}
  const sync = () => {
    const enabled = current().enabled ?? true
    if (!enabled && run.running) {
      run.stopping = true
      touch()
    }
  }
  ctx.inject(['settings'], (settingsCtx) => {
    try {
      if (typeof settingsCtx.settings?.installSection === 'function') {
        settingsCtx.settings.installSection(ctx, SETTINGS_NAMESPACE, Config, config ?? {}, {
          setSource: (source) => {
            current = source
          },
          onChange: sync,
        })
      } else if (typeof settingsCtx.settings?.register === 'function') {
        const scope = settingsCtx.settings.register(SETTINGS_NAMESPACE, Config, { base: config ?? {} })
        current = () => scope?.get?.() ?? config ?? {}
        scope?.watch?.(() => {
          sync()
        })
      }
    } catch {
      /* 设置面不可用时插件照常工作，始终视为启用 */
    }
  })
  sync()
}
