/**
 * 群聊宿主服务：状态机 + 持久化调度 + 对话引擎（llm 流式 + 工具执行）。
 *
 * 状态机：groups / sessions / roles / messages 四张表 + run（对话进行时
 * 状态）；变更后 touch()（revision++ + 节流广播）。持久化走脏标记合并
 * 落盘（PERSISTENCE.md v2.1，见 host/store.ts）。
 *
 * 动作分发（handleAction，POST /api/group-chat/action 的载荷）：
 *   mutate | send | stop | confirmCommand | models | efforts | browse
 * @module dsh-group-chat/host/service
 */

import { homedir } from 'node:os'
import { dirname, isAbsolute, join, sep } from 'node:path'
import { randomUUID } from 'node:crypto'
import { spawn, type ChildProcess } from 'node:child_process'
import { closeSync, existsSync, openSync, readSync, readdirSync, realpathSync, rmSync, statSync, unlinkSync } from 'node:fs'
import type { Context } from '@deepseek-ai/cordis'
// 类型合并：ctx.llm / ctx.fs / ctx.workspaceRegistry（宿主面）
import type {} from '@deepseek-ai/dsh-llm'
import type {} from '@deepseek-ai/dsh-fs'
import type {} from '@deepseek-ai/dsh-workspace'
import type { GenerateOptions, Message } from '@deepseek-ai/dsh-llm'
import { messageJson, roleJson } from '../core/json.ts'
import { CMD_CAPTURE_MAX_BYTES, CMD_OUTPUT_MAX_CHARS, READ_FILE_MAX_BYTES, RUN_CMD_TIMEOUT_MS, TOOL_FLOOR_COST_CHARS, TOOL_REPEAT_LIMIT, TOOL_RESULTS_TOTAL_MAX, TOOL_SCHEMAS, TRANSCRIPT_TOOL_SUMMARY } from '../core/tools.ts'
import type { BrowseResult, EffortOptions, GroupRecord, LastCreated, MessageRecord, ModelCatalog, MutateArgs, RoleRecord, RunState, SendArgs, SessionRecord, Snapshot, SpeakResult, ToolCallRecord, ToolExecution } from '../core/types.ts'
import { asEffort, asNumber } from '../core/types.ts'
import { emptyGroup, LedgerDocument, scanGroupIds, scanSessionIds, STORE_DIR, Store } from './store.ts'

/** llm wire 的工具调用 id（branded）。 */
type WireToolCallId = Extract<Message['content'][number], { type: 'tool-call' }>['id']

/** SSE 推送节流。 */
const PUSH_THROTTLE_MS = 120

const PALETTE = ['#5b8def', '#22a06b', '#e8912d', '#c678dd', '#e05661', '#56b6c2', '#98c379', '#d19a66']

/** 服务对路由/入口暴露的面。 */
export interface GroupChatService {
  snapshot(): Snapshot
  handleAction(body: unknown): Promise<unknown>
  subscribePush(push: () => void): () => void
  /** 设置停用时中止正在进行的群聊。 */
  stopAll(): void
  /** 卸载/热重载：唤醒确认等待 + kill 子进程 → 同步最终 flush → 释放锁。 */
  dispose(): void
}

/** llm.stream 的单轮流式产物。 */
interface StreamRound {
  acc: string
  rAcc: string
  errorFinish: { kind: string, failure?: { message?: string } } | null
  maxTokens: boolean
  tcs: { id: string, name: string, args: string }[]
}

/** 会话文件形态（hydrate 用）。 */
interface SessionDocument {
  name?: string
  topic?: string
  createdAt?: number
  messages?: Partial<MessageRecord>[]
}

/** 群组角色文件形态（hydrate 用）。 */
interface RolesDocument {
  roles?: Partial<RoleRecord>[]
}

/**
 * 创建群聊宿主服务。锁失败/写失败时降级为内存态运行（console 告警）。
 */
export function createGroupChatService(ctx: Context): GroupChatService {
  const llm = ctx.llm
  const fs = ctx.fs

  // ---------- 状态机 ----------
  let revision = 1
  let idSeq = 1
  const nid = (p: string): string => p + '-' + (idSeq++)

  const groups = new Map<string, GroupRecord>()
  const sessions = new Map<string, SessionRecord>()
  const roles = new Map<string, RoleRecord>()
  const messages = new Map<string, MessageRecord>()
  const run: RunState = { running: false, sessionId: null, currentRoleId: null, partial: '', partialReasoning: '', stopping: false, queue: [], pendingConfirm: null, confirmSignal: null, childProc: null }
  let modelCache: ModelCatalog | null = null
  /** 最近一次创建的群组/会话，供客户端定位选中项。 */
  let lastCreated: LastCreated | null = null

  const groupSessionCount = (groupId: string): number => {
    let n = 0
    for (const s of sessions.values()) if (s.groupId === groupId) n++
    return n
  }

  const newSession = (groupId: string, name?: string): SessionRecord => {
    const s: SessionRecord = {
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
  let store: Store | null
  try {
    store = new Store(STORE_DIR)
  } catch (e) {
    console.error('[dsh-group-chat] 持久化不可用，本实例以内存态运行（重启后数据不保留）：', e)
    store = null
  }

  // 脏标记按文件记；flush 失败者保留脏标记，下次触发自动重试
  const dirtySessions = new Set<string>()
  const dirtyRoles = new Set<string>()
  const dirtyWorkspace = new Set<string>()
  let ledgerDirty = false
  let flushScheduled = false

  const ledgerDocument = (): LedgerDocument & { savedAt: number } => ({
    schema: 2,
    savedAt: Date.now(),
    groups: [...groups.values()].map((g) => {
      const item: { id: string, name: string, allowCommands?: boolean } = { id: g.id, name: g.name }
      if (g.allowCommands === true) item.allowCommands = true
      return item
    }),
    sessions: [...groups.values()].flatMap((g) => g.sessionIds.map((sid) => ({ id: sid, groupId: g.id }))),
  })
  const sessionDocument = (s: SessionRecord) => ({
    schema: 1,
    savedAt: Date.now(),
    id: s.id,
    name: s.name,
    groupId: s.groupId,
    topic: s.topic,
    createdAt: s.createdAt,
    messages: s.messageIds.map((mid) => messages.get(mid)).filter(Boolean).map((m) => messageJson(m)).filter(Boolean),
  })
  const rolesDocument = (g: GroupRecord) => ({ schema: 1, savedAt: Date.now(), roles: g.roleIds.map((rid) => roles.get(rid)).filter((r): r is RoleRecord => Boolean(r)).map((r) => roleJson(r)) })

  /** 同步 flush：写全部脏文件；成功才清脏标记；每个实际发生 rename 的目录一次 fsync。 */
  const flushNow = (): void => {
    if (store === null) return
    const fsyncDirs = new Set<string>()
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
  const schedulePersist = ({ ledger = false, session = null, roles: roleGroup = null, workspace = null }: { ledger?: boolean, session?: string | null, roles?: string | null, workspace?: string | null } = {}): void => {
    if (store === null) return
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

  // ---- 启动恢复：v1 迁移 → 残留清理 → 清单 → 群组数据 → 会话文件；缺文件空重建 ----

  const loadSession = (groupId: string, sid: string, noteMissing: boolean): void => {
    if (sessions.has(sid)) return
    const g = groups.get(groupId)
    if (!g) return
    const sess: SessionRecord = { id: sid, groupId, name: '会话', topic: '', messageIds: [], createdAt: Date.now() }
    let doc: SessionDocument | null = null
    if (store) {
      const file = store.sessionFile(groupId, sid)
      if (noteMissing && !existsSync(file)) console.error(`[dsh-group-chat] 会话 ${sid} 文件缺失，按空消息重建`)
      doc = store.loadJson(file) as SessionDocument | null
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
    sessions.set(sid, sess)
    g.sessionIds.push(sid)
  }

  const loadGroupData = (g: GroupRecord): void => {
    if (!store) return
    g.workspaceDir = store.readWorkspace(g.id)
    const doc = store.loadJson(store.rolesFile(g.id)) as RolesDocument | null
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
    const ledger = store ? (store.loadJson(store.ledgerFile) as LedgerDocument | null) : null
    if (ledger && Array.isArray(ledger.groups)) {
      for (const g of ledger.groups) {
        if (g && typeof g.id === 'string' && !groups.has(g.id)) {
          groups.set(g.id, { id: g.id, name: String(g.name || '群组'), workspaceDir: '', allowCommands: g.allowCommands === true, roleIds: [], sessionIds: [] })
        }
      }
      for (const g of groups.values()) loadGroupData(g)
      for (const item of (Array.isArray(ledger.sessions) ? ledger.sessions : [])) {
        if (item && typeof item.id === 'string' && groups.has(item.groupId)) loadSession(item.groupId, item.id, true)
      }
    } else if (store) {
      // ledger 缺失/损坏：扫描群组目录回收（群组名丢失，角色/工作区/会话从文件恢复）
      for (const gid of scanGroupIds(STORE_DIR)) {
        const g = emptyGroup(gid, '群组')
        groups.set(g.id, g)
        loadGroupData(g)
        for (const sid of scanSessionIds(store, gid)) loadSession(gid, sid, false)
      }
    }
    const autoSessions: string[] = []
    for (const g of groups.values()) {
      if (g.sessionIds.length === 0) {
        const s = newSession(g.id)
        sessions.set(s.id, s)
        g.sessionIds.push(s.id)
        autoSessions.push(s.id)
      }
    }
    if (groups.size === 0) {
      const g: GroupRecord = { id: nid('grp'), name: '默认群组', workspaceDir: '', roleIds: [], sessionIds: [] }
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
  const subscribers = new Set<() => void>()
  let pushTimer: ReturnType<typeof setTimeout> | null = null
  const broadcast = (): void => {
    if (pushTimer !== null) return
    pushTimer = setTimeout(() => {
      pushTimer = null
      for (const push of subscribers) push()
    }, PUSH_THROTTLE_MS)
  }

  const touch = (): void => {
    revision++
    broadcast()
  }

  const snapshot = (): Snapshot => ({
    revision,
    run: { running: run.running, sessionId: run.sessionId, currentRoleId: run.currentRoleId, partial: run.partial, partialReasoning: run.partialReasoning, pendingConfirm: run.pendingConfirm },
    lastCreated,
    groups: [...groups.values()].map((g) => ({ id: g.id, name: g.name, workspaceDir: g.workspaceDir, allowCommands: g.allowCommands === true, roleIds: g.roleIds.slice(), sessionIds: g.sessionIds.slice() })),
    sessions: [...sessions.values()].map((s) => ({ id: s.id, groupId: s.groupId, name: s.name, topic: s.topic, messageIds: s.messageIds.slice(), createdAt: s.createdAt })),
    roles: [...roles.values()].map((r) => ({ id: r.id, groupId: r.groupId, name: r.name, color: r.color, persona: r.persona, provider: r.provider, model: r.model, temperature: r.temperature, reasoningEffort: r.reasoningEffort, enabled: r.enabled, thinking: r.thinking === true })),
    messages: [...messages.values()].map((m) => ({ id: m.id, sessionId: m.sessionId, seq: m.seq, speaker: m.speaker, text: m.text, reasoning: m.reasoning, model: m.model, error: m.error, toolCalls: m.toolCalls, ts: m.ts })),
  })

  const appendMessage = (sess: SessionRecord, speaker: string, text: string, extra?: Partial<MessageRecord>): MessageRecord => {
    const msg: MessageRecord = { id: nid('msg'), sessionId: sess.id, seq: sess.messageIds.length + 1, speaker, text, reasoning: undefined, model: undefined, error: undefined, ts: Date.now() }
    if (extra) {
      if (extra.reasoning !== undefined) msg.reasoning = extra.reasoning
      if (extra.reasoningFull !== undefined) msg.reasoningFull = extra.reasoningFull
      if (extra.thinkingSummary !== undefined) msg.thinkingSummary = extra.thinkingSummary
      if (extra.model !== undefined) msg.model = extra.model
      if (extra.error !== undefined) msg.error = extra.error
      if (Array.isArray(extra.toolCalls) && extra.toolCalls.length > 0) msg.toolCalls = extra.toolCalls
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
  let workspacePathsCache = { at: 0, paths: [] as string[] }
  const workspacePaths = async (): Promise<string[]> => {
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

  const candidatePaths = async (raw: unknown): Promise<string[]> => {
    const p = String(raw || '').trim()
    if (p === '' || p === '~') return [HOME]
    if (p.startsWith('~/')) return [join(HOME, p.slice(2))]
    if (isAbsolute(p)) return [p]
    const roots = [...(await workspacePaths()), process.cwd()]
    return roots.map((root) => join(root, p))
  }

  /** 逐候选 stat，返回第一个存在的目标；都不存在时返回首候选与全部尝试。 */
  const resolveMaterialTarget = async (raw: unknown) => {
    const candidates = await candidatePaths(raw)
    let first: { target: import('@deepseek-ai/dsh-fs').FsTarget, path: string } | undefined
    for (const c of candidates) {
      const target = await fs.resolve(c)
      if (first === undefined) first = { target, path: c }
      const info = await fs.stat(target)
      if (info !== undefined) return { target, path: c, info, tried: candidates }
    }
    return { target: first!.target, path: first!.path, info: undefined, tried: candidates }
  }

  // 群组工作区目录 → 注入文件清单：目录内文本文件（白名单扩展名、跳过隐藏项，
  // 最多 20 个），单文件 16k、总量 48k 截断由 materialBlock 执行。
  const TEXT_EXTS = new Set(['.md', '.markdown', '.txt', '.json', '.yml', '.yaml', '.csv', '.tsv', '.toml', '.ini', '.conf', '.env', '.properties', '.log', '.xml', '.html', '.css', '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.c', '.h', '.cpp', '.sql', '.sh'])
  const MAX_WS_FILES = 20

  const loadWorkspaceFiles = async (g: GroupRecord) => {
    if (!g.workspaceDir) return { dir: '', parts: [] as { name: string, content: string, error?: string }[] }
    const res = await resolveMaterialTarget(g.workspaceDir)
    if (res.info === undefined) throw new Error('工作区目录不存在（尝试过：' + res.tried.join('；') + '）')
    if (res.info.type !== 'directory') throw new Error('工作区目录不是目录：' + res.path)
    const entries = await fs.listDir(res.target)
    const parts: { name: string, content: string, error?: string }[] = []
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
        parts.push({ name: e.name, content: '', error: String((err && (err as Error).message) || err) })
      }
    }
    return { dir: res.path, parts }
  }

  /** 目录浏览：返回文件+目录条目（绝对路径由 Host 解析，客户端不拼路径）。 */
  const browse = async (args: { path?: string } | undefined): Promise<BrowseResult> => {
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
      return { ok: false, error: String((e && (e as Error).message) || e) }
    }
  }

  const materialBlock = (parts: { name: string, content: string, error?: string }[], dir: string): string => {
    if (!parts.length) return ''
    let total = 0
    const lines: string[] = []
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

  const transcriptBlock = (sess: SessionRecord): string => {
    const out: string[] = []
    for (const mid of sess.messageIds) {
      const m = messages.get(mid)
      if (!m) continue
      const name = m.speaker === 'user' ? '用户' : m.speaker === 'system' ? '系统' : (roles.get(m.speaker) || { name: undefined }).name || '成员'
      let text = m.text || ''
      if (text.length > 8000) text = text.slice(0, 8000) + '…(已截断)'
      let line = '【' + name + '】' + text
      if (Array.isArray(m.toolCalls)) {
        for (const c of m.toolCalls) {
          if (!c || typeof c.tool !== 'string') continue
          let brief = ''
          try {
            brief = JSON.stringify(c.args) || ''
          } catch {
            brief = ''
          }
          if (brief.length > 60) brief = brief.slice(0, 60) + '…'
          const st = c.status === 'ok' ? '成功' : c.status === 'denied' ? '用户拒绝' : '失败'
          let ob = String(c.output || '')
          if (ob.length > TRANSCRIPT_TOOL_SUMMARY) ob = ob.slice(0, TRANSCRIPT_TOOL_SUMMARY) + '…'
          line += '\n  [工具] ' + c.tool + ' ' + brief + ' → ' + st + (ob ? '（' + ob.replace(/\s+/g, ' ') + '）' : '')
        }
      }
      out.push(line)
    }
    return out.slice(-40).join('\n\n')
  }

  // ---------- 工具执行（TOOLS.md §2：沙箱 / §3：确认闸门） ----------

  /** realpath 硬边界：目标必须在群组工作区内（带分隔符比较，防 /ws/foo 放行 /ws/foobar）。 */
  const resolveInWorkspace = (root: string, rawPath: unknown): { ok: true, target: string } | { ok: false, error: string } => {
    const p = rawPath === undefined || rawPath === null || String(rawPath).trim() === '' ? '.' : String(rawPath)
    let target: string
    try {
      target = realpathSync(isAbsolute(p) ? p : join(root, p))
    } catch {
      return { ok: false, error: '路径不存在：' + p }
    }
    if (target !== root && !target.startsWith(root + sep)) {
      return { ok: false, error: '路径超出群组工作区范围：' + p }
    }
    return { ok: true, target }
  }

  const toolReadFile = (root: string, args: Record<string, unknown>): { status: 'ok' | 'error', output: string } => {
    const r = resolveInWorkspace(root, args.path)
    if (!r.ok) return { status: 'error', output: r.error }
    let fd: number | undefined
    try {
      const st = statSync(r.target)
      if (!st.isFile()) return { status: 'error', output: '不是文件：' + String(args.path) }
      fd = openSync(r.target, 'r')
      const buf = Buffer.alloc(READ_FILE_MAX_BYTES + 1)
      const n = readSync(fd, buf, 0, buf.length, 0)
      let text = buf.subarray(0, Math.min(n, READ_FILE_MAX_BYTES)).toString('utf8')
      if (n > READ_FILE_MAX_BYTES) text += '\n…(文件超过 100KB，已截断)'
      return { status: 'ok', output: text || '（空文件）' }
    } catch (e) {
      return { status: 'error', output: '读取失败：' + String((e && (e as Error).message) || e) }
    } finally {
      if (fd !== undefined) {
        try {
          closeSync(fd)
        } catch {}
      }
    }
  }

  const toolListDir = (root: string, args: Record<string, unknown>): { status: 'ok' | 'error', output: string } => {
    const r = resolveInWorkspace(root, args.path)
    if (!r.ok) return { status: 'error', output: r.error }
    try {
      const st = statSync(r.target)
      if (!st.isDirectory()) return { status: 'error', output: '不是目录：' + String(args.path) }
      const entries = readdirSync(r.target, { withFileTypes: true }).sort((a, b) => (a.isDirectory() ? 0 : 1) - (b.isDirectory() ? 0 : 1) || a.name.localeCompare(b.name))
      const lines = entries.slice(0, 500).map((e) => {
        if (e.isDirectory()) return e.name + '/'
        try {
          return e.name + ' (' + statSync(join(r.target, e.name)).size + ' B)'
        } catch {
          return e.name
        }
      })
      if (entries.length > 500) lines.push('…(共 ' + entries.length + ' 项，仅显示前 500)')
      const out = lines.join('\n') || '（空目录）'
      return { status: 'ok', output: out.length > CMD_OUTPUT_MAX_CHARS ? out.slice(0, CMD_OUTPUT_MAX_CHARS) + '\n…(已截断)' : out }
    } catch (e) {
      return { status: 'error', output: '列出失败：' + String((e && (e as Error).message) || e) }
    }
  }

  const runCommandTool = (root: string, command: string): Promise<{ status: 'ok' | 'error', output: string }> => new Promise((resolve) => {
    let child: ChildProcess
    try {
      child = spawn('bash', ['-c', command], { cwd: root })
    } catch (e) {
      resolve({ status: 'error', output: '无法启动命令：' + String((e && (e as Error).message) || e) })
      return
    }
    run.childProc = child
    let out = ''
    let dropped = 0
    let timedOut = false
    const onChunk = (chunk: Buffer) => {
      if (out.length < CMD_CAPTURE_MAX_BYTES) out += chunk.toString('utf8')
      else dropped += chunk.length
    }
    child.stdout?.on('data', onChunk)
    child.stderr?.on('data', onChunk)
    const timer = setTimeout(() => {
      timedOut = true
      try {
        child.kill('SIGKILL')
      } catch {}
    }, RUN_CMD_TIMEOUT_MS)
    const finish = (result: { status: 'ok' | 'error', output: string }) => {
      clearTimeout(timer)
      if (run.childProc === child) run.childProc = null
      resolve(result)
    }
    child.on('error', (e) => finish({ status: 'error', output: '执行失败：' + String((e && e.message) || e) }))
    child.on('close', (code) => {
      let text = out.length > CMD_CAPTURE_MAX_BYTES ? out.slice(0, CMD_CAPTURE_MAX_BYTES) : out
      if (dropped > 0) text += '\n[输出采集超限，已丢弃 ' + dropped + ' 字节]'
      if (timedOut) text += '\n[执行超时（' + Math.round(RUN_CMD_TIMEOUT_MS / 1000) + 's），已强制终止]'
      if (code !== 0 && code !== null && !timedOut) text += '\n[退出码 ' + code + ']'
      if (text.length > CMD_OUTPUT_MAX_CHARS) text = text.slice(0, CMD_OUTPUT_MAX_CHARS) + '\n…(输出超长，已截断)'
      finish({ status: code === 0 ? 'ok' : 'error', output: text || '（无输出）' })
    })
  })

  /** run_command 确认闸门：置 pendingConfirm 后无限等待，confirmCommand/stop/dispose 唤醒。 */
  const requestConfirmation = (toolCallId: string, args: Record<string, unknown>): Promise<boolean> => new Promise((resolve) => {
    run.pendingConfirm = { toolCallId, tool: 'run_command', args: args as RunState['pendingConfirm'] extends null ? never : NonNullable<RunState['pendingConfirm']>['args'] }
    run.confirmSignal = { resolve }
    touch()
  })

  const wakeConfirm = (): void => {
    const signal = run.confirmSignal
    run.pendingConfirm = null
    run.confirmSignal = null
    if (signal) {
      try {
        signal.resolve(false)
      } catch {}
    }
  }

  const killChild = (): void => {
    if (run.childProc) {
      try {
        run.childProc.kill('SIGKILL')
      } catch {}
    }
  }

  const executeTool = async (g: GroupRecord, root: string, tc: { id: string, name: string, args: string }): Promise<ToolExecution> => {
    let args: Record<string, unknown> = {}
    try {
      const parsed = JSON.parse(tc.args)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) args = parsed as Record<string, unknown>
    } catch {}
    const started = Date.now()
    let res: { status: 'ok' | 'error' | 'denied', output: string }
    if (tc.name === 'read_file') res = toolReadFile(root, args)
    else if (tc.name === 'list_dir') res = toolListDir(root, args)
    else if (tc.name === 'run_command') {
      if (g.allowCommands !== true) {
        res = { status: 'error', output: '群组未开启命令执行，该命令未被运行' }
      } else {
        const allowed = await requestConfirmation(tc.id, args)
        if (run.stopping) res = { status: 'error', output: '对话已被用户停止，命令未执行' }
        else if (!allowed) res = { status: 'denied', output: '用户拒绝了这次命令执行' }
        else res = await runCommandTool(root, String(args.command || ''))
      }
    } else {
      res = { status: 'error', output: '未知工具：' + tc.name }
    }
    return { status: res.status, output: res.output, args, durationMs: Date.now() - started }
  }

  const buildToolSchemas = (g: GroupRecord) => {
    if (!g.workspaceDir) return []
    return TOOL_SCHEMAS.filter((t) => t.name !== 'run_command' || g.allowCommands === true)
  }

  const speak = async (g: GroupRecord, sess: SessionRecord, role: RoleRecord): Promise<SpeakResult> => {
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
      ws.dir
        ? '\n# 可用工具\n你可以调用工具在群组工作区目录（' + ws.dir + '）内查看文件与目录' +
          (g.allowCommands === true ? '、执行 shell 命令（命令需用户逐条确认，请优先用于运行测试）' : '') +
          '。需要事实依据时优先用工具查看，不要凭空猜测。'
        : '',
      '\n# 发言要求',
      '- 直接输出「' + role.name + '」本轮的发言内容本身：不要输出名字前缀、引号、动作旁白或代码围栏',
      '- 回应群内最新讨论（消息中「@你的名字」表示用户点名要求你回应，被点名时请优先回应）；与其他成员自然对话；有不同观点可以提出并说明理由',
      '- 保持简洁，通常不超过 300 字',
    ].filter((s) => s !== '').join('\n')

    const history = transcriptBlock(sess)
    const intro = history
      ? '以下是本会话的群聊记录（从旧到新）：\n\n' + history
      : '本会话刚刚开始，请围绕主题做简短开场发言。'

    // 工具沙箱根：工作区目录的 realpath（loadWorkspaceFiles 成功即目录存在）
    let wsRoot: string | null = null
    if (ws.dir) {
      try {
        wsRoot = realpathSync(ws.dir)
      } catch {
        wsRoot = null
      }
    }
    const tools = wsRoot !== null ? buildToolSchemas(g) : []

    const baseOpts: { provider: string, model: string, system: string, temperature?: number, reasoningEffort?: GenerateOptions['reasoningEffort'] } = { provider: role.provider, model: role.model, system: sys }
    if (typeof role.temperature === 'number' && !Number.isNaN(role.temperature)) baseOpts.temperature = role.temperature
    // 深度思考：角色级开关 + 推理级别（取自 DSH 模型设置的 effort 选项）；
    // 未配置或 'default' = 不传 reasoningEffort（用 provider 默认）；
    // 模型不支持 reasoning effort 时本地解析失败，catch 后删参降级重发
    if (role.thinking === true) {
      const effort = asEffort(role.reasoningEffort) as GenerateOptions['reasoningEffort'] | undefined
      if (effort !== undefined) baseOpts.reasoningEffort = effort
    }

    const msgs: Message[] = [{ id: ('g' + revision + '-m0') as Message['id'], role: 'user', content: [{ type: 'text', text: intro }], source: { kind: 'user' } }]
    const toolCalls: ToolCallRecord[] = []
    const texts: string[] = []
    const reasonings: string[] = []
    let budgetUsed = 0
    let streak = 0
    let lastSig: string | null = null
    let toolsOff = false // 降级（不支持 tools）或强制收尾后不再带 tools

    // 一轮流式生成：收集 text/reasoning/tool-call（delta 累积 + block-end 闭合；post-block-end delta 忽略）
    const streamRound = async (): Promise<StreamRound> => {
      let acc = ''
      let rAcc = ''
      let errorFinish: StreamRound['errorFinish'] = null
      let maxTokens = false
      const byIndex = new Map<number, { id: string, name: string, args: string, closed: boolean }>()
      const roundTools = tools.length === 0 || toolsOff ? undefined : tools
      for await (const chunk of llm.stream({ ...baseOpts, tools: roundTools, messages: msgs })) {
        if (run.stopping) break
        if (chunk.type === 'text-delta') {
          acc += chunk.text
          run.partial = acc
          touch()
        } else if (chunk.type === 'reasoning-delta') {
          rAcc += chunk.text
          run.partialReasoning = rAcc
          touch()
        } else if (chunk.type === 'tool-call-delta') {
          const cur = byIndex.get(chunk.index)
          if (cur && cur.closed) continue
          const entry = cur || { id: 'call-' + chunk.index, name: '', args: '', closed: false }
          if (chunk.id !== undefined) entry.id = chunk.id
          if (chunk.name !== undefined) entry.name = chunk.name
          entry.args += chunk.argumentsDelta
          byIndex.set(chunk.index, entry)
        } else if (chunk.type === 'block-end' && chunk.block && chunk.block.type === 'tool-call') {
          const entry = byIndex.get(chunk.index) || { id: 'call-' + chunk.index, name: '', args: '', closed: false }
          entry.id = chunk.block.id
          entry.name = chunk.block.name
          entry.args = chunk.block.arguments
          entry.closed = true
          byIndex.set(chunk.index, entry)
        } else if (chunk.type === 'finish') {
          const reason = chunk.reason || {}
          if (reason.kind === 'error' || reason.kind === 'aborted') errorFinish = reason
          else if (reason.kind === 'max-tokens') maxTokens = true
        }
      }
      const tcs = [...byIndex.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => ({ id: v.id, name: v.name, args: v.args }))
      return { acc, rAcc, errorFinish, maxTokens, tcs }
    }

    // 强制收尾：工具历史折叠为纯文本摘要（不带 tools、不带工具块），规避无 tools 参数携带工具历史被拒
    const wrapUp = (note: string): void => {
      const lines = toolCalls.map((c) => {
        let brief = ''
        try {
          brief = JSON.stringify(c.args) || ''
        } catch {
          brief = ''
        }
        if (brief.length > 80) brief = brief.slice(0, 80) + '…'
        const ob = String(c.output || '')
        return '[工具] ' + c.tool + ' ' + brief + ' → ' + c.status + (ob ? '：' + (ob.length > TRANSCRIPT_TOOL_SUMMARY ? ob.slice(0, TRANSCRIPT_TOOL_SUMMARY) + '…' : ob) : '')
      })
      msgs.length = 1
      msgs.push({
        id: ('g' + revision + '-w' + msgs.length) as Message['id'],
        role: 'user',
        content: [{ type: 'text', text: (texts.length ? '你此前的发言草稿：\n' + texts.join('\n\n') + '\n\n' : '') + '你的工具执行记录（摘要）：\n' + lines.join('\n') + '\n\n' + note + '，请基于以上记录输出最终发言。' }],
        source: { kind: 'user' },
      })
      toolsOff = true
    }

    for (;;) {
      if (run.stopping) break
      let round: StreamRound
      try {
        round = await streamRound()
      } catch (e) {
        const m = String((e && (e as Error).message) || e)
        if (baseOpts.reasoningEffort !== undefined && m.includes('UNSUPPORTED_REASONING_EFFORT')) {
          delete baseOpts.reasoningEffort
          continue
        }
        throw e
      }
      if (round.errorFinish) {
        const f = round.errorFinish.failure || {}
        const failureText = String(f.message || round.errorFinish.kind)
        // 降级（B2）：「不支持 tools」以 error finish 到达；保留 failure 全文判定，去 tools 重试一次
        if (!toolsOff && tools.length > 0 && /tool/i.test(failureText)) {
          toolsOff = true
          continue
        }
        throw new Error('模型输出异常终止: ' + failureText)
      }
      if (round.acc.trim()) texts.push(round.acc.trim())
      if (round.rAcc.trim()) reasonings.push(round.rAcc.trim())
      // max-tokens：丢弃全部工具块（截断的工具调用不可安全执行），以已有文本收尾
      if (round.maxTokens) break
      if (run.stopping) break
      // 中断（stop break）时半成品工具调用随循环退出整体丢弃
      if (round.tcs.length === 0) break
      // 回注契约（TOOLS.md §3.3）：assistant 消息（text + tool-call 块）在前，每工具一条 user-role 结果消息在后
      const assistantContent: Message['content'] = []
      if (round.acc.trim()) assistantContent.push({ type: 'text', text: round.acc })
      for (const tc of round.tcs) assistantContent.push({ type: 'tool-call', id: tc.id as WireToolCallId, name: tc.name, arguments: tc.args })
      msgs.push({ id: ('g' + revision + '-a' + msgs.length) as Message['id'], role: 'assistant', content: assistantContent, source: { kind: 'model', provider: role.provider, model: role.model } })
      for (const tc of round.tcs) {
        if (run.stopping) break
        const res = await executeTool(g, wsRoot!, tc)
        const output = String(res.output || '')
        toolCalls.push({ tool: tc.name, args: res.args, status: res.status, output, durationMs: res.durationMs })
        budgetUsed += Math.max(output.length, TOOL_FLOOR_COST_CHARS)
        msgs.push({
          id: ('g' + revision + '-t' + msgs.length) as Message['id'],
          role: 'user',
          content: [{ type: 'tool-result', toolCallId: tc.id as WireToolCallId, content: [{ type: 'text', text: output || '（无输出）' }], isError: res.status === 'error' }],
          source: { kind: 'tool', callId: tc.id as WireToolCallId },
        })
        // 死循环检测（B1）：连续空输出或与上一次完全相同的调用
        const sig = tc.name + '|' + tc.args + '|' + output
        const isRepeat = output === '' || (lastSig !== null && sig === lastSig)
        streak = isRepeat ? streak + 1 : 1
        lastSig = sig
      }
      if (budgetUsed >= TOOL_RESULTS_TOTAL_MAX) {
        wrapUp('已达工具结果累计上限')
        continue
      }
      if (streak >= TOOL_REPEAT_LIMIT) {
        wrapUp('检测到重复或空输出的工具调用')
        continue
      }
    }
    return { text: texts.join('\n\n').trim(), reasoning: reasonings.join('\n\n').trim() || undefined, toolCalls }
  }

  const runLoop = async (sess: SessionRecord): Promise<void> => {
    const g = groups.get(sess.groupId)
    try {
      while (run.queue.length > 0 && !run.stopping) {
        const roleId = run.queue.shift()!
        const role = roles.get(roleId)
        run.currentRoleId = roleId
        run.partial = ''
        run.partialReasoning = ''
        touch()
        if (!role) continue
        try {
          const out = await speak(g!, sess, role)
          // 停止后不落部分消息（已有「已停止本次对话」系统消息承接）
          if (!run.stopping && (out.text || (Array.isArray(out.toolCalls) && out.toolCalls.length > 0))) {
            appendMessage(sess, role.id, out.text, { model: role.provider + ' / ' + role.model, reasoning: out.reasoning, toolCalls: out.toolCalls })
          }
        } catch (e) {
          appendMessage(sess, 'system', '角色「' + role.name + '」发言失败：' + String((e && (e as Error).message) || e), { error: true })
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
      run.pendingConfirm = null
      run.confirmSignal = null
      run.childProc = null
      run.stopping = false
      touch()
    }
  }

  // ---------- 动作 ----------

  const mutate = (args: MutateArgs): Snapshot => {
    const op = args && args.op
    if (op === 'createGroup') {
      const g: GroupRecord = { id: nid('grp'), name: String(args.name || '').trim() || '群组 ' + (groups.size + 1), workspaceDir: '', roleIds: [], sessionIds: [] }
      groups.set(g.id, g)
      const sess = newSession(g.id)
      g.sessionIds.push(sess.id)
      lastCreated = { kind: 'group', groupId: g.id, sessionId: sess.id }
      schedulePersist({ ledger: true, session: sess.id })
      touch()
    } else if (op === 'renameGroup') {
      const g = groups.get(args.groupId!)
      if (g && String(args.name || '').trim()) {
        g.name = String(args.name).trim()
        schedulePersist({ ledger: true })
        touch()
      }
    } else if (op === 'deleteGroup') {
      const g = groups.get(args.groupId!)
      if (!g) return { ...snapshot(), error: '群组不存在' }
      if (groups.size <= 1) return { ...snapshot(), error: '至少保留一个群组' }
      if (run.running) {
        const runSession = sessions.get(run.sessionId!)
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
      const g = groups.get(args.groupId!)
      if (!g) return { ...snapshot(), error: '群组不存在' }
      const sess = newSession(g.id, String(args.name || '').trim() || undefined)
      g.sessionIds.push(sess.id)
      lastCreated = { kind: 'session', groupId: g.id, sessionId: sess.id }
      schedulePersist({ ledger: true, session: sess.id })
      touch()
    } else if (op === 'renameSession') {
      const sess = sessions.get(args.sessionId!)
      if (sess && String(args.name || '').trim()) {
        sess.name = String(args.name).trim()
        schedulePersist({ session: sess.id })
        touch()
      }
    } else if (op === 'deleteSession') {
      const sess = sessions.get(args.sessionId!)
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
      const sess = sessions.get(args.sessionId!)
      if (sess) {
        sess.topic = String(args.topic || '')
        schedulePersist({ session: sess.id })
        touch()
      }
    } else if (op === 'upsertRole') {
      const g = groups.get(args.groupId!)
      const r = args.role || {}
      if (!g) return { ...snapshot(), error: '群组不存在' }
      if (!r.name || !String(r.name).trim()) return { ...snapshot(), error: '角色名称不能为空' }
      if (!r.provider || !r.model) return { ...snapshot(), error: '请选择角色绑定的模型' }
      if (r.id && roles.get(r.id)) {
        const ex = roles.get(r.id)!
        ex.name = String(r.name).trim()
        ex.color = r.color || ex.color
        ex.persona = r.persona || ''
        ex.provider = r.provider
        ex.model = r.model
        ex.temperature = asNumber(r.temperature)
        ex.reasoningEffort = asEffort(r.reasoningEffort)
        ex.enabled = r.enabled !== false
        ex.thinking = r.thinking === true
        schedulePersist({ roles: g.id })
        touch()
      } else {
        const nr: RoleRecord = {
          id: nid('role'),
          groupId: g.id,
          name: String(r.name).trim(),
          color: r.color || PALETTE[g.roleIds.length % PALETTE.length],
          persona: r.persona || '',
          provider: r.provider,
          model: r.model,
          temperature: asNumber(r.temperature),
          reasoningEffort: asEffort(r.reasoningEffort),
          enabled: true,
          thinking: r.thinking === true,
        }
        roles.set(nr.id, nr)
        g.roleIds.push(nr.id)
        schedulePersist({ roles: g.id })
        touch()
      }
    } else if (op === 'deleteRole') {
      const r = roles.get(args.roleId!)
      if (r) {
        const gid = r.groupId
        const g = groups.get(gid)
        if (g) g.roleIds = g.roleIds.filter((x) => x !== r.id)
        roles.delete(r.id)
        schedulePersist({ roles: gid })
        touch()
      }
    } else if (op === 'setRoleEnabled') {
      const r = roles.get(args.roleId!)
      if (r) {
        r.enabled = !!args.enabled
        schedulePersist({ roles: r.groupId })
        touch()
      }
    } else if (op === 'setWorkspaceDir') {
      const g = groups.get(args.groupId!)
      if (g) {
        g.workspaceDir = String(args.path || '').trim()
        schedulePersist({ workspace: g.id })
        touch()
      }
    } else if (op === 'setAllowCommands') {
      const g = groups.get(args.groupId!)
      if (g) {
        g.allowCommands = args.allowed === true
        schedulePersist({ ledger: true })
        touch()
      }
    } else if (op === 'clearMessages') {
      const sess = sessions.get(args.sessionId!)
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

  const send = (args: SendArgs): { ok: boolean, error?: string } => {
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
    const queue: string[] = []
    for (let i = 0; i < rounds; i++) for (const rid of parts) queue.push(rid)
    run.running = true
    run.sessionId = sess.id
    run.queue = queue
    run.stopping = false
    touch()
    void runLoop(sess).catch((e) => console.error('group-chat run failed', e))
    return { ok: true }
  }

  const stop = (args: { sessionId?: string }): { ok: boolean } => {
    if (run.running && (!args || !args.sessionId || run.sessionId === args.sessionId)) {
      run.stopping = true
      if (run.pendingConfirm) wakeConfirm()
      killChild()
      touch()
    }
    return { ok: true }
  }

  /** run_command 确认（TOOLS.md §4）：同步三查全过才置空放行，杜绝并发/伪造/stale 确认。 */
  const confirmCommand = (args: { toolCallId?: string, allow?: boolean }): { ok: boolean, error?: string } => {
    if (!run.running || !run.pendingConfirm || run.pendingConfirm.toolCallId !== (args && args.toolCallId)) {
      return { ok: false, error: '确认请求不存在或已处理' }
    }
    const signal = run.confirmSignal
    run.pendingConfirm = null
    run.confirmSignal = null
    touch()
    if (signal) {
      try {
        signal.resolve(!!(args && args.allow))
      } catch {}
    }
    return { ok: true }
  }

  const models = async (): Promise<ModelCatalog> => {
    const now = Date.now()
    if (modelCache && now - modelCache.at < 60000) return modelCache
    const providers = await llm.listProviders()
    const modelsByProvider: ModelCatalog['modelsByProvider'] = {}
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

  // 推理级别选项：取自 DSH 模型设置（llm.resolveModelInfo 的 reasoning.efforts），
  // 60s 缓存；模型未暴露或查询失败返回空列表（客户端只显示「默认」）
  const effortCache = new Map<string, { at: number, data: EffortOptions }>()
  const efforts = async (args: { provider?: string, model?: string }): Promise<{ ok: boolean } & EffortOptions> => {
    const provider = String((args && args.provider) || '')
    const model = String((args && args.model) || '')
    if (!provider || !model) return { ok: false, efforts: [], defaultEffort: undefined, error: '缺少 provider 或 model' }
    const key = provider + '|' + model
    const hit = effortCache.get(key)
    if (hit && Date.now() - hit.at < 60000) return { ok: true, ...hit.data }
    let data: EffortOptions
    try {
      const info = await llm.resolveModelInfo(provider, model)
      const reasoning = info && info.reasoning
      const list = reasoning && Array.isArray(reasoning.efforts) ? reasoning.efforts : []
      data = {
        efforts: list.map((e) => ({ id: e.id, name: e.name || e.id, description: e.description })),
        defaultEffort: reasoning && typeof reasoning.defaultEffort === 'string' ? reasoning.defaultEffort : undefined,
      }
    } catch (e) {
      data = { efforts: [], defaultEffort: undefined, error: String((e && (e as Error).message) || e) }
    }
    effortCache.set(key, { at: Date.now(), data })
    return { ok: true, ...data }
  }

  const handleAction = async (body: Record<string, unknown>): Promise<unknown> => {
    const kind = body && body.kind
    if (kind === 'mutate') return { ok: true, snapshot: mutate(body as unknown as MutateArgs), lastCreated }
    if (kind === 'send') return send(body as unknown as SendArgs)
    if (kind === 'stop') return stop(body as { sessionId?: string })
    if (kind === 'confirmCommand') return confirmCommand(body as { toolCallId?: string, allow?: boolean })
    if (kind === 'models') return { ok: true, ...(await models()) }
    if (kind === 'efforts') return efforts(body as { provider?: string, model?: string })
    if (kind === 'browse') return browse(body as { path?: string })
    return { ok: false, error: 'unknown-action' }
  }

  return {
    snapshot,
    handleAction,
    subscribePush(push: () => void): () => void {
      subscribers.add(push)
      return () => {
        subscribers.delete(push)
      }
    },
    stopAll(): void {
      if (run.running) {
        run.stopping = true
        touch()
      }
    },
    dispose(): void {
      run.stopping = true
      if (run.pendingConfirm) wakeConfirm()
      killChild()
      if (pushTimer !== null) clearTimeout(pushTimer)
      if (store !== null) {
        try {
          flushNow()
        } catch {}
        try {
          store.release()
        } catch {}
        store = null
      }
    },
  }
}
