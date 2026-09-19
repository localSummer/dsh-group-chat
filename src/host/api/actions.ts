/**
 * 动作分发（handleAction，POST /api/group-chat/action 的载荷）：
 * mutate（12 种 CRUD/配置操作）| send | stop | confirmCommand | models | efforts。
 * @module dsh-group-chat/host/api/actions
 */

import { rmSync, unlinkSync } from 'node:fs'
import type { BrowseResult, EffortOptions, GroupRecord, ModelCatalog, MutateArgs, RoleRecord, SendArgs, Snapshot } from '../../core/types.ts'
import { asEffort, asNumber, asPermissionTier } from '../../core/types.ts'
import { PALETTE } from '../state.ts'
import type { HostState } from '../state.ts'
import type { Conversation } from '../engine/index.ts'
import type { Materials } from '../materials/index.ts'

/** 动作面。 */
export interface Actions {
  handleAction: (body: Record<string, unknown>) => Promise<unknown>
}

/** 创建动作分发面。 */
export function createActions(core: HostState, deps: {
  touch: () => void
  snapshot: () => Snapshot
  schedulePersist: (targets?: { ledger?: boolean, session?: string | null, roles?: string | null, workspace?: string | null }) => void
  dropDirty: (targets: { session?: string | null, roles?: string | null, workspace?: string | null }) => void
  appendMessage: Conversation['appendMessage']
  runLoop: Conversation['runLoop']
  wakeConfirm: () => void
  killChild: () => void
  browse: Materials['browse']
  fileSearch: Materials['fileSearch']
  disposeFileSearch: Materials['disposeFileSearch']
}): Actions {
  const { llm, groups, sessions, roles, messages, run } = core
  const { touch, snapshot, schedulePersist, dropDirty, appendMessage, runLoop, wakeConfirm, killChild, browse, fileSearch, disposeFileSearch } = deps

  const mutate = (args: MutateArgs): Snapshot => {
    const op = args && args.op
    if (op === 'createGroup') {
      const g: GroupRecord = { id: core.nid('grp'), name: String(args.name || '').trim() || '群组 ' + (groups.size + 1), workspaceDir: '', permissionTier: 'view_only', roleIds: [], sessionIds: [] }
      groups.set(g.id, g)
      const sess = core.newSession(g.id)
      g.sessionIds.push(sess.id)
      core.lastCreated = { kind: 'group', groupId: g.id, sessionId: sess.id }
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
        dropDirty({ session: sid })
      }
      for (const rid of g.roleIds) roles.delete(rid)
      groups.delete(g.id)
      disposeFileSearch(g.id)
      dropDirty({ roles: g.id, workspace: g.id })
      if (core.store !== null) {
        try {
          rmSync(core.store.groupDir(g.id), { recursive: true, force: true })
        } catch (e) {
          console.error('[dsh-group-chat] 群组目录清理失败：', e)
        }
      }
      schedulePersist({ ledger: true })
      touch()
    } else if (op === 'createSession') {
      const g = groups.get(args.groupId!)
      if (!g) return { ...snapshot(), error: '群组不存在' }
      const sess = core.newSession(g.id, String(args.name || '').trim() || undefined)
      g.sessionIds.push(sess.id)
      core.lastCreated = { kind: 'session', groupId: g.id, sessionId: sess.id }
      schedulePersist({ ledger: true, session: sess.id })
      touch()
    } else if (op === 'renameSession') {
      const sess = sessions.get(args.sessionId!)
      if (sess && String(args.name || '').trim()) {
        sess.name = String(args.name).trim()
        sess.namePinned = true // 手动编辑 = 隐式固定：自动命名此后跳过名称
        schedulePersist({ session: sess.id })
        touch()
      }
    } else if (op === 'deleteSession') {
      const sess = sessions.get(args.sessionId!)
      if (!sess) return { ...snapshot(), error: '会话不存在' }
      const g = groups.get(sess.groupId)
      if (g && g.sessionIds.length <= 1) return { ...snapshot(), error: '每个群组至少保留一个会话' }
      if (run.running && run.sessionId === sess.id) return { ...snapshot(), error: '对话进行中，无法删除会话' }
      // 「输出完毕」标记随会话一并清理（悬空指向已删除会话无消费方）
      if (run.finished && run.finished.sessionId === sess.id) run.finished = null
      for (const mid of sess.messageIds) messages.delete(mid)
      sessions.delete(sess.id)
      dropDirty({ session: sess.id })
      if (g) g.sessionIds = g.sessionIds.filter((x) => x !== sess.id)
      if (core.store !== null) {
        try {
          unlinkSync(core.store.sessionFile(sess.groupId, sess.id))
        } catch {}
      }
      schedulePersist({ ledger: true })
      touch()
    } else if (op === 'setTopic') {
      const sess = sessions.get(args.sessionId!)
      if (sess) {
        sess.topic = String(args.topic || '')
        sess.topicPinned = true // 手动编辑 = 隐式固定：自动整理此后跳过主题
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
          id: core.nid('role'),
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
    } else if (op === 'setPermissionTier') {
      const tier = asPermissionTier(args.tier)
      if (!tier) return { ...snapshot(), error: '未知权限档位' }
      const g = groups.get(args.groupId!)
      if (g) {
        g.permissionTier = tier
        // 降到仅可查看时若该群挂着待确认命令，自动拒绝（安全侧倾斜）；
        // 升档不自动放行已排队的待确认命令，仍需用户手动确认
        if (tier === 'view_only' && run.pendingConfirm) {
          const runSession = run.sessionId ? sessions.get(run.sessionId) : null
          if (runSession && runSession.groupId === g.id) wakeConfirm()
        }
        schedulePersist({ ledger: true })
        touch()
      }
    } else if (op === 'ackFinish') {
      // 查看即清：客户端选中 lastFinished 会话时确认已读（幂等；无标记不广播）
      if (run.finished) {
        run.finished = null
        touch()
      }
    } else if (op === 'clearMessages') {
      const sess = sessions.get(args.sessionId!)
      if (sess) {
        if (run.running && run.sessionId === sess.id) return { ...snapshot(), error: '对话进行中，无法清空' }
        for (const mid of sess.messageIds) messages.delete(mid)
        sess.messageIds = []
        sess.constraints = undefined
        sess.constraintsUpToSeq = undefined
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
    run.finished = null // 新 run 覆盖旧的「输出完毕」未读标记
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

  let modelCache: ModelCatalog | null = null
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
    if (kind === 'mutate') return { ok: true, snapshot: mutate(body as unknown as MutateArgs), lastCreated: core.lastCreated }
    if (kind === 'send') return send(body as unknown as SendArgs)
    if (kind === 'stop') return stop(body as { sessionId?: string })
    if (kind === 'confirmCommand') return confirmCommand(body as { toolCallId?: string, allow?: boolean })
    if (kind === 'models') return { ok: true, ...(await models()) }
    if (kind === 'efforts') return efforts(body as { provider?: string, model?: string })
    if (kind === 'browse') return browse(body as { path?: string })
    if (kind === 'fileSearch') return fileSearch(body as { groupId?: string, query?: string })
    return { ok: false, error: 'unknown-action' }
  }

  return { handleAction }
}
