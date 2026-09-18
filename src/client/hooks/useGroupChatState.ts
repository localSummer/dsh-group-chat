/**
 * 群聊面板核心状态管理 hook
 * @module dsh-group-chat/client/hooks
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../lib/api.ts'
import type { ClientSnapshot, ModelsResponse, RoleDraft } from '../lib/model.ts'

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

export function useGroupChatState() {
  // 核心数据快照
  const [snap, setSnap] = useState<ClientSnapshot | null>(null)
  
  // 选中状态
  const [gid, setGid] = useState<string | null>(null)
  const [sid, setSid] = useState<string | null>(null)
  
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
  const [wsDraft, setWsDraft] = useState<string | null>(null)
  
  // 角色编辑
  const [roleDraft, setRoleDraft] = useState<RoleDraft | null>(null)
  const [roleFormError, setRoleFormError] = useState('')
  const [models, setModels] = useState<ModelsResponse | null>(null)
  const [modelsError, setModelsError] = useState<string | null>(null)
  
  // 文件浏览器
  const [fileBrowser, setFileBrowser] = useState<{ open: boolean, loading: boolean, list: import('../../core/types.ts').BrowseResult | null, error: string } | null>(null)
  
  // 参与角色选择
  const [partsSel, setPartsSel] = useState<string[] | null>(null)
  const [rounds, setRounds] = useState(1)
  
  // 输入与 @提及
  const [input, setInput] = useState('')
  const [mention, setMention] = useState<string | null>(null)
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
      if (live && s && (s as ClientSnapshot).ok) setSnap(s as ClientSnapshot)
    }).catch(() => { /* SSE 会重试 */ })
    const events = new EventSource('/api/group-chat/events')
    events.onmessage = (message) => {
      try {
        const s = JSON.parse(message.data) as ClientSnapshot
        if (!live || !s || !s.ok) return
        const created = s.lastCreated
        if (created && created.sessionId) {
          setGid(created.groupId)
          setSid(created.sessionId)
          setPartsSel(null)
        }
        setSnap(s)
      } catch { /* ignore malformed frame */ }
    }
    return () => {
      live = false
      events.close()
    }
  }, [])

  // API 操作封装
  const action = async (payload: Record<string, unknown>): Promise<unknown> => {
    try {
      return await api.action(payload)
    } catch (e) {
      setErr(String((e && (e as Error).message) || e))
      return null
    }
  }

  const mutate = async (args: Record<string, unknown>): Promise<MutateResponse | null> => {
    setErr('')
    const res = await action(Object.assign({ kind: 'mutate' }, args)) as MutateResponse | null
    if (res && res.ok && res.snapshot) {
      if (res.lastCreated && res.lastCreated.sessionId) {
        setGid(res.lastCreated.groupId)
        setSid(res.lastCreated.sessionId)
        setPartsSel(null)
      }
      setSnap(res.snapshot)
      if (res.snapshot.error) setErr(res.snapshot.error)
    }
    return res
  }

  return {
    // 状态
    snap,
    setSnap,
    gid,
    setGid,
    sid,
    setSid,
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
    roleFormError,
    setRoleFormError,
    models,
    setModels,
    modelsError,
    setModelsError,
    fileBrowser,
    setFileBrowser,
    wsDraft,
    setWsDraft,
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
