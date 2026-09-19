/**
 * 群聊面板核心状态管理 hook
 * @module dsh-group-chat/client/hooks
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../lib/api.ts'
import { readComposerDraft } from '../lib/composer-draft.ts'
import type { ClientSnapshot, ModelsResponse, RoleDraft } from '../lib/model.ts'
import type { AtToken } from '../../shared/file-mention-grammar.ts'

export interface MutateResponse {
  ok: boolean
  snapshot?: ClientSnapshot
  lastCreated?: ClientSnapshot['lastCreated']
  error?: string
}

export interface ActionOk {
  ok: boolean
  error?: string
}

/**
 * 面板切换缓存（模块级，跨挂载存活）：main 为 keyed 槽，主会话⇄群聊切换会
 * 整体卸载重挂面板组件；缓存最近快照、选中项与按会话分槽的未发送草稿，
 * 让重挂载瞬时恢复上次视图。挂载后的 state 拉取 / SSE 首帧再行校正。
 */
let cachedSnap: ClientSnapshot | null = null
let cachedGid: string | null = null
let cachedSid: string | null = null

export function useGroupChatState() {
  // 核心数据快照（重挂载时从缓存瞬时恢复，消除切换闪现的加载态）
  const [snap, setSnap] = useState<ClientSnapshot | null>(() => cachedSnap)

  // 选中状态
  const [gid, setGid] = useState<string | null>(() => cachedGid)
  const [sid, setSid] = useState<string | null>(() => cachedSid)

  /** 已应用过的 lastCreated 会话标记：只在标记变化（真正的新建）时跟随选中，
      而不是每帧都把视图拽回「最近创建的会话」（流式期间每 120ms 一帧）。 */
  const appliedCreatedRef = useRef<string | null>(cachedSnap?.lastCreated?.sessionId ?? null)

  /** 快照落地统一口：写状态 + 写切换缓存。 */
  const applySnap = useCallback((s: ClientSnapshot): void => {
    cachedSnap = s
    setSnap(s)
  }, [])

  /** 选中项统一口：写状态 + 写切换缓存（重挂载恢复到用户离开时的位置）。 */
  const selectGroup = useCallback((v: string): void => {
    cachedGid = v
    setGid(v)
  }, [])
  const selectSession = useCallback((v: string): void => {
    cachedSid = v
    setSid(v)
  }, [])
  
  // UI 状态
  const [search, setSearch] = useState('')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => new Set())
  const [asideOpen, setAsideOpen] = useState(true)
  const [navOpen, setNavOpen] = useState(true)
  const [atBottom, setAtBottom] = useState(true)
  
  // 编辑态
  const [renameDraft, setRenameDraft] = useState<{ kind: 'group' | 'session', id: string, value: string } | null>(null)
  const [confirmDel, setConfirmDel] = useState<{ kind: 'group' | 'session', id: string } | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [topicDraft, setTopicDraft] = useState<string | null>(null)

  // 角色编辑（models 目录与保存/校验态在 RoleDrawer 内自理）
  const [roleDraft, setRoleDraft] = useState<RoleDraft | null>(null)
  const [models, setModels] = useState<ModelsResponse | null>(null)
  const [modelsError, setModelsError] = useState<string | null>(null)
  
  // 参与角色选择
  const [partsSel, setPartsSel] = useState<string[] | null>(null)
  const [rounds, setRounds] = useState(1)
  
  // 输入与 @提及（文本初值取当前选中会话草稿，HTML 由 useComposerDraft 灌回）
  const [input, setInput] = useState(() => readComposerDraft(cachedSid).text)
  const [mention, setMention] = useState<AtToken | null>(null)
  const [mentionIdx, setMentionIdx] = useState(0)
  
  // 错误提示
  const [err, setErr] = useState('')
  
  // Refs
  const inputRef = useRef<HTMLDivElement | null>(null)
  const sendingRef = useRef(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // 初始加载 + SSE 订阅
  useEffect(() => {
    let live = true
    api.state().then((s) => {
      if (live && s && (s as ClientSnapshot).ok) applySnap(s as ClientSnapshot)
    }).catch(() => { /* SSE 会重试 */ })
    const events = new EventSource('/api/group-chat/events')
    events.onmessage = (message) => {
      try {
        const s = JSON.parse(message.data) as ClientSnapshot
        if (!live || !s || !s.ok) return
        // lastCreated 仅在变化时跟随选中（新建群组/会话的定位信号）；
        // 帧里重复携带的旧标记不再反复重置视图
        if (s.lastCreated && s.lastCreated.sessionId && s.lastCreated.sessionId !== appliedCreatedRef.current) {
          appliedCreatedRef.current = s.lastCreated.sessionId
          selectGroup(s.lastCreated.groupId)
          selectSession(s.lastCreated.sessionId)
          setPartsSel(null)
        }
        applySnap(s)
      } catch { /* ignore malformed frame */ }
    }
    return () => {
      live = false
      events.close()
    }
  }, [applySnap, selectGroup, selectSession])

  // API 操作封装
  const action = useCallback(async (payload: Record<string, unknown>): Promise<unknown> => {
    try {
      return await api.action(payload)
    } catch (e) {
      setErr(String((e && (e as Error).message) || e))
      return null
    }
  }, [])

  const mutate = async (args: Record<string, unknown>): Promise<MutateResponse | null> => {
    setErr('')
    const res = await action(Object.assign({ kind: 'mutate' }, args)) as MutateResponse | null
    if (res && res.ok && res.snapshot) {
      // 响应里的 lastCreated 是服务端当前值（未必由本次调用产生）——同样只在
      // 变化时跟随选中，避免改名/改配置等普通 mutate 把视图拽走
      if (res.lastCreated && res.lastCreated.sessionId && res.lastCreated.sessionId !== appliedCreatedRef.current) {
        appliedCreatedRef.current = res.lastCreated.sessionId
        selectGroup(res.lastCreated.groupId)
        selectSession(res.lastCreated.sessionId)
        setPartsSel(null)
      }
      applySnap(res.snapshot)
      if (res.snapshot.error) setErr(res.snapshot.error)
    }
    return res
  }

  return {
    // 状态
    snap,
    setSnap: applySnap,
    gid,
    setGid: selectGroup,
    sid,
    setSid: selectSession,
    search,
    setSearch,
    collapsedGroups,
    setCollapsedGroups,
    renameDraft,
    setRenameDraft,
    confirmDel,
    setConfirmDel,
    confirmClear,
    setConfirmClear,
    roleDraft,
    setRoleDraft,
    models,
    setModels,
    modelsError,
    setModelsError,
    partsSel,
    setPartsSel,
    rounds,
    setRounds,
    input,
    setInput,
    err,
    setErr,
    topicDraft,
    setTopicDraft,
    mention,
    setMention,
    mentionIdx,
    setMentionIdx,
    asideOpen,
    setAsideOpen,
    navOpen,
    setNavOpen,
    atBottom,
    setAtBottom,
    // Refs
    inputRef,
    sendingRef,
    scrollRef,
    // 方法
    action,
    mutate,
  }
}
