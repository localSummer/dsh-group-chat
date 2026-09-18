/**
 * 主面板：三区工作台——左导航栏（搜索 + 群组→会话目录树）、中央会话流
 * （@成员 点名 + markdown 渲染 + 思考折叠）、右上下文栏（群成员角色卡 +
 * 工作区目录），右栏可收起，角色编辑走右侧滑出抽屉。
 *
 * 面板数据走 /api/group-chat/*（fetch + SSE），Host 半持有全部状态。
 * @module dsh-group-chat/client/panel
 */

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import { Icon, P } from './ui.ts'
import { api } from './api.ts'
import { Bubble } from './Bubble.tsx'
import { ThinkRow } from './ThinkRow.tsx'
import { RoleDrawer } from './RoleDrawer.tsx'
import { PermissionSelect } from './PermissionSelect.tsx'
import { draftFromRole, blankDraft, escapeRegExp, groupById, roleById, sessById, type ClientSnapshot, type ModelsResponse, type RoleDraft, type SnapshotRole } from './model.ts'
import { MD_LABELS } from './model.ts'

interface MutateResponse {
  ok: boolean
  snapshot?: ClientSnapshot
  lastCreated?: ClientSnapshot['lastCreated']
  error?: string
}

interface ActionOk {
  ok: boolean
  error?: string
}

/** 群组目录树节点的收合状态存取（hook 局部）。 */
function useToggle() {
  return useState<Set<string>>(() => new Set())
}

export function GroupChatPanel(): ReactNode {
  const [snap, setSnap] = useState<ClientSnapshot | null>(null)
  const [gid, setGid] = useState<string | null>(null)
  const [sid, setSid] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [collapsedGroups, setCollapsedGroups] = useToggle()
  const [renameDraft, setRenameDraft] = useState<{ kind: 'group' | 'session', id: string, value: string } | null>(null)
  const [confirmDel, setConfirmDel] = useState<{ kind: 'group' | 'session', id: string } | null>(null)
  const [roleDraft, setRoleDraft] = useState<RoleDraft | null>(null)
  const [roleFormError, setRoleFormError] = useState('')
  const [models, setModels] = useState<ModelsResponse | null>(null)
  const [modelsError, setModelsError] = useState<string | null>(null)
  const [fileBrowser, setFileBrowser] = useState<{ open: boolean, loading: boolean, list: import('../core/types.ts').BrowseResult | null, error: string } | null>(null)
  const [wsDraft, setWsDraft] = useState<string | null>(null)
  const [partsSel, setPartsSel] = useState<string[] | null>(null)
  const [rounds, setRounds] = useState(1)
  const [input, setInput] = useState('')
  const [err, setErr] = useState('')
  const [topicDraft, setTopicDraft] = useState<string | null>(null)
  const [mention, setMention] = useState<{ query: string, caret: number } | null>(null)
  const [mentionIdx, setMentionIdx] = useState(0)
  const [asideOpen, setAsideOpen] = useState(true)
  const [navOpen, setNavOpen] = useState(true)
  const [atBottom, setAtBottom] = useState(true)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // 初始加载 + SSE 订阅；Host 新建群组/会话后自动选中新项
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

  // 贴底时新内容自动跟随滚动
  const onMsgsScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 60)
  }, [])
  useEffect(() => {
    const el = scrollRef.current
    if (el && atBottom) el.scrollTop = el.scrollHeight
  }, [snap])
  // composer 输入框随内容自适应高度
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(180, Math.max(36, el.scrollHeight)) + 'px'
  }, [input])

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

  if (!snap) {
    return (
      <div className="dsgc-root">
        <div className="dsgc-loading">{Icon(P.IconLoadingOutline16, 16)}加载中…</div>
      </div>
    )
  }

  // ---- 选中群组/会话解析 ----
  let group = gid ? groupById(snap, gid) : null
  if (!group && snap.groups.length) group = snap.groups[0]
  if (!group) {
    return (
      <div className="dsgc-root">
        <div className="dsgc-loading">暂无群组</div>
      </div>
    )
  }
  let sess = sid ? sessById(snap, sid) : null
  if (!sess || sess.groupId !== group.id) sess = group.sessionIds.length ? sessById(snap, group.sessionIds[group.sessionIds.length - 1]) : null

  const msgById: Record<string, ClientSnapshot['messages'][number]> = {}
  for (const m of snap.messages) msgById[m.id] = m

  const enabledRoles = group.roleIds.map((id) => roleById(snap, id)).filter((r): r is SnapshotRole => !!r && r.enabled)
  const participants = partsSel || enabledRoles.map((r) => r.id)
  // run 挂在会话上：仅当前会话处于对话中时显示流式与停止按钮
  const busyNow = !!(sess && snap.run.running && snap.run.sessionId === sess.id)

  const togglePart = (rid: string): void => {
    const has = participants.includes(rid)
    setPartsSel(has ? participants.filter((x) => x !== rid) : participants.concat([rid]))
  }

  // ---- @成员：候选与插入 ----
  const mentionCandidates = mention
    ? enabledRoles.filter((r) => r.name.toLowerCase().includes((mention.query || '').toLowerCase()))
    : []
  const onInputChange = (e: { target: { value: string }, selectionStart?: number | null }): void => {
    const v = e.target.value
    const caret = e.selectionStart == null ? v.length : e.selectionStart
    setInput(v)
    const before = v.slice(0, caret)
    const m = /(?:^|\s)@([^\s@]*)$/.exec(before)
    setMention(m ? { query: m[1], caret } : null)
    setMentionIdx(0)
  }
  const applyMention = (role: SnapshotRole): void => {
    if (!mention || !role) return
    const v = input
    const before = v.slice(0, mention.caret)
    const after = v.slice(mention.caret)
    const replaced = before.replace(/@([^\s@]*)$/, '@' + role.name + ' ')
    const next = replaced + after
    const caretPos = replaced.length
    setInput(next)
    setMention(null)
    setMentionIdx(0)
    const el = inputRef.current
    if (el) {
      el.focus()
      el.setSelectionRange(caretPos, caretPos)
    }
  }
  const mentionedRoles = enabledRoles.filter((r) => new RegExp('(^|\\s)@' + escapeRegExp(r.name) + '(?=\\s|$)').test(input))

  const sendMsg = async (): Promise<void> => {
    if (busyNow) return
    // 被 @ 的成员优先作为本轮参与角色
    const parts = mentionedRoles.length ? mentionedRoles.map((r) => r.id) : participants
    if (!parts.length) {
      setErr(mentionedRoles.length ? '' : '请至少选择一个参与角色（或在消息中 @成员）')
      if (!mentionedRoles.length) return
    }
    const res = await action({ kind: 'send', sessionId: sess!.id, text: input, participantRoleIds: parts, rounds }) as ActionOk | null
    if (res && !res.ok && res.error) setErr(res.error)
    else if (res && res.ok) {
      setInput('')
      setMention(null)
      setErr('')
      setAtBottom(true)
    }
  }
  const onInputKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>): void => {
    if (mention && mentionCandidates.length) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionIdx((mentionIdx + 1) % mentionCandidates.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionIdx((mentionIdx - 1 + mentionCandidates.length) % mentionCandidates.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        applyMention(mentionCandidates[mentionIdx])
        return
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMsg()
    }
  }

  // ---- 动作 ----
  const fetchModels = async (): Promise<void> => {
    try {
      const m = await api.action({ kind: 'models' }) as ModelsResponse
      if (m && m.ok && Array.isArray(m.providers)) {
        setModels(m)
        setModelsError(null)
        return
      }
      setModelsError(m && m.error ? String(m.error) : '响应异常')
    } catch (e) {
      setModelsError(String((e && (e as Error).message) || e))
    }
  }
  const openRoleEditor = async (role: SnapshotRole | null): Promise<void> => {
    setErr('')
    setRoleFormError('')
    if (!models || modelsError) await fetchModels()
    setRoleDraft(role ? draftFromRole(role) : blankDraft())
  }
  const saveRole = async (): Promise<void> => {
    if (!roleDraft) return
    if (!roleDraft.name.trim()) {
      setRoleFormError('角色名称不能为空')
      return
    }
    if (!roleDraft.provider || !roleDraft.model) {
      setRoleFormError('请选择角色绑定的模型')
      return
    }
    const res = await mutate({ op: 'upsertRole', groupId: group!.id, role: roleDraft })
    if (res && res.ok && res.snapshot && !res.snapshot.error) {
      setRoleDraft(null)
      setRoleFormError('')
    }
  }

  const stopRun = async (): Promise<void> => {
    await action({ kind: 'stop', sessionId: sess!.id })
  }

  const commitRename = async (): Promise<void> => {
    if (!renameDraft) return
    const d = renameDraft
    setRenameDraft(null)
    const value = String(d.value || '').trim()
    if (!value) return
    if (d.kind === 'group') await mutate({ op: 'renameGroup', groupId: d.id, name: value })
    else await mutate({ op: 'renameSession', sessionId: d.id, name: value })
  }
  const renameKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      void commitRename()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setRenameDraft(null)
    }
  }
  const doDelete = async (): Promise<void> => {
    if (!confirmDel) return
    const d = confirmDel
    setConfirmDel(null)
    if (d.kind === 'group') await mutate({ op: 'deleteGroup', groupId: d.id })
    else await mutate({ op: 'deleteSession', sessionId: d.id })
  }

  const commitWsDir = (): void => {
    if (wsDraft !== null && group && wsDraft !== (group.workspaceDir || '')) {
      void mutate({ op: 'setWorkspaceDir', groupId: group.id, path: wsDraft })
    }
    setWsDraft(null)
  }
  const openBrowser = async (path: string | undefined): Promise<void> => {
    setFileBrowser({ open: true, loading: true, list: null, error: '' })
    try {
      const res = await api.action({ kind: 'browse', path: path || '' }) as import('../core/types.ts').BrowseResult
      if (res && res.ok) setFileBrowser({ open: true, loading: false, list: res, error: '' })
      else setFileBrowser({ open: true, loading: false, list: null, error: (res && res.error) || '浏览失败' })
    } catch (e) {
      setFileBrowser({ open: true, loading: false, list: null, error: String((e && (e as Error).message) || e) })
    }
  }
  const selectCurrentDir = (): void => {
    if (!fileBrowser || !fileBrowser.list || !group) return
    const path = fileBrowser.list.path!
    void mutate({ op: 'setWorkspaceDir', groupId: group.id, path })
    setWsDraft(null)
    setFileBrowser(null)
  }

  const commitTopic = (): void => {
    if (topicDraft !== null && sess && topicDraft !== sess.topic) void mutate({ op: 'setTopic', sessionId: sess.id, topic: topicDraft })
    setTopicDraft(null)
  }

  // ---- 消息流（当前会话 + 流式尾巴） ----
  const bubbles: ReactNode[] = []
  if (sess) {
    for (const mid of sess.messageIds) {
      const m = msgById[mid]
      if (m) bubbles.push(<Bubble key={m.id} snap={snap} m={m} />)
    }
  }
  if (busyNow && snap.run.currentRoleId) {
    const lr = roleById(snap, snap.run.currentRoleId)
    if (lr) {
      bubbles.push(
        <div key="__live" className="dsgc-msg live">
          <div
            className="dsgc-avatar"
            style={{ border: '2px solid ' + (lr.color || '#888'), '--role-color': lr.color || '#888' } as CSSProperties}
          >
            {lr.name.slice(0, 1)}
          </div>
          <div className="dsgc-msgbody">
            <div className="dsgc-msghead">
              <span className="dsgc-msgname">{lr.name}</span>
              <span className="dsgc-msgmodel">{lr.provider} / {lr.model}</span>
              <span className="dsgc-msgtime">正在输入…</span>
            </div>
            <div className="dsgc-msgtext live">
              {snap.run.partialReasoning ? <ThinkRow text={snap.run.partialReasoning} running /> : null}
              {snap.run.partial ? <P.MarkdownText text={snap.run.partial} streaming labels={MD_LABELS} /> : null}
            </div>
          </div>
        </div>,
      )
    }
  }
  // 命令确认卡片：完整显示命令全文（禁止截断——防尾部注入借确认疲劳过关）
  const pc = busyNow && snap.run.pendingConfirm && sess && snap.run.sessionId === sess.id ? snap.run.pendingConfirm : null
  if (pc) {
    const lr = roleById(snap, snap.run.currentRoleId)
    bubbles.push(
      <div key="__confirm" className="dsgc-confirm">
        <div className="dsgc-confirmtitle">
          {Icon(P.IconWarningOutline16, 14)}
          {(lr ? lr.name : '角色') + ' 请求执行命令（工作区内）'}
        </div>
        <div className="dsgc-confirmcmd">{String((pc.args && pc.args.command) || '')}</div>
        <div className="dsgc-hint">允许后将在工作区目录执行；拒绝后角色将继续纯文本讨论</div>
        <div className="dsgc-confirmops">
          <P.Button variant="primary" size="sm" onClick={() => { void action({ kind: 'confirmCommand', toolCallId: pc.toolCallId, allow: true }) }}>允许</P.Button>
          <P.Button variant="outline" size="sm" onClick={() => { void action({ kind: 'confirmCommand', toolCallId: pc.toolCallId, allow: false }) }}>拒绝</P.Button>
        </div>
      </div>,
    )
  }

  // ---- 左栏：搜索 + 群组/会话目录树 ----
  const q = search.trim().toLowerCase()
  const groupMatches = (g: ClientSnapshot['groups'][number]): { show: boolean, filterSessions: boolean } => {
    if (!q) return { show: true, filterSessions: false }
    if (g.name.toLowerCase().includes(q)) return { show: true, filterSessions: false }
    const hitSessions = g.sessionIds.map((id) => sessById(snap, id)).filter((s) => s && s.name.toLowerCase().includes(q))
    return { show: hitSessions.length > 0, filterSessions: true }
  }
  const treeNodes: ReactNode[] = []
  for (const g of snap.groups) {
    const match = groupMatches(g)
    if (!match.show) continue
    const expanded = q ? true : !collapsedGroups.has(g.id)
    const isRenameGroup = renameDraft && renameDraft.kind === 'group' && renameDraft.id === g.id
    const isConfirmGroup = confirmDel && confirmDel.kind === 'group' && confirmDel.id === g.id
    const groupChildren: ReactNode[] = []
    if (expanded) {
      for (const sessionId of g.sessionIds) {
        const s = sessById(snap, sessionId)
        if (!s) continue
        if (match.filterSessions && !s.name.toLowerCase().includes(q)) continue
        const isActive = sess && s.id === sess.id && g.id === group!.id
        const isRenameSess = renameDraft && renameDraft.kind === 'session' && renameDraft.id === s.id
        const isConfirm = confirmDel && confirmDel.kind === 'session' && confirmDel.id === s.id
        groupChildren.push(
          <div
            key={s.id}
            className={'dsgc-sess-row' + (isActive ? ' on' : '')}
            role="button"
            tabIndex={0}
            onClick={() => { setGid(g.id); setSid(s.id); setPartsSel(null); setConfirmDel(null); setRenameDraft(null) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setGid(g.id); setSid(s.id); setPartsSel(null); setConfirmDel(null); setRenameDraft(null)
              }
            }}
          >
            <span className="dsgc-sess-dot" />
            {isRenameSess
              ? (
                <input
                  className="dsgc-rename"
                  value={renameDraft!.value}
                  autoFocus
                  onChange={(e) => { setRenameDraft({ kind: 'session', id: s.id, value: e.target.value }) }}
                  onBlur={() => { void commitRename() }}
                  onKeyDown={renameKeyDown}
                  onClick={(e) => { e.stopPropagation() }}
                />
                )
              : <span className="dsgc-sess-name">{s.name}</span>}
            <span className="dsgc-nodeops">
              <button
                className="dsgc-opbtn"
                title="重命名会话"
                aria-label="重命名会话"
                onClick={(e) => { e.stopPropagation(); setRenameDraft({ kind: 'session', id: s.id, value: s.name }) }}
              >
                {Icon(P.IconEditOutline16, 14)}
              </button>
              <button
                className={'dsgc-opbtn' + (isConfirm ? ' danger' : '')}
                title={isConfirm ? '再次点击确认删除' : '删除会话'}
                aria-label="删除会话"
                onClick={(e) => {
                  e.stopPropagation()
                  if (isConfirm) void doDelete()
                  else setConfirmDel({ kind: 'session', id: s.id })
                }}
              >
                {Icon(P.IconTrashOutline16, 14)}
              </button>
            </span>
          </div>,
        )
      }
      groupChildren.push(
        <button key="__add" className="dsgc-addsess" onClick={() => { void mutate({ op: 'createSession', groupId: g.id }) }}>
          {Icon(P.IconPlusOutline16, 14)}新会话
        </button>,
      )
    }
    treeNodes.push(
      <div key={g.id} className="dsgc-gnode">
        <div
          className={'dsgc-grow-row' + (g.id === group!.id ? ' on' : '')}
          role="button"
          tabIndex={0}
          onClick={() => { setGid(g.id); setPartsSel(null); setConfirmDel(null); setRenameDraft(null) }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setGid(g.id); setPartsSel(null); setConfirmDel(null); setRenameDraft(null)
            }
          }}
        >
          <button
            className={'dsgc-twist' + (expanded ? '' : ' closed')}
            title={expanded ? '收起' : '展开'}
            aria-label={expanded ? '收起' : '展开'}
            onClick={(e) => {
              e.stopPropagation()
              setCollapsedGroups((prev) => {
                const next = new Set(prev)
                if (next.has(g.id)) next.delete(g.id)
                else next.add(g.id)
                return next
              })
            }}
          >
            {Icon(P.IconChevronDownOutline14, 14)}
          </button>
          {isRenameGroup
            ? (
              <input
                className="dsgc-rename"
                value={renameDraft!.value}
                autoFocus
                onChange={(e) => { setRenameDraft({ kind: 'group', id: g.id, value: e.target.value }) }}
                onBlur={() => { void commitRename() }}
                onKeyDown={renameKeyDown}
                onClick={(e) => { e.stopPropagation() }}
              />
              )
            : <span className="dsgc-gname">{g.name}</span>}
          <span className="dsgc-nodeops">
            <button
              className="dsgc-opbtn"
              title="重命名群组"
              aria-label="重命名群组"
              onClick={(e) => { e.stopPropagation(); setRenameDraft({ kind: 'group', id: g.id, value: g.name }) }}
            >
              {Icon(P.IconEditOutline16, 14)}
            </button>
            <button
              className={'dsgc-opbtn' + (isConfirmGroup ? ' danger' : '')}
              title={isConfirmGroup ? '再次点击确认删除' : '删除群组'}
              aria-label="删除群组"
              onClick={(e) => {
                e.stopPropagation()
                if (isConfirmGroup) void doDelete()
                else setConfirmDel({ kind: 'group', id: g.id })
              }}
            >
              {Icon(P.IconTrashOutline16, 14)}
            </button>
          </span>
        </div>
        {expanded ? <div className="dsgc-sess-list">{groupChildren}</div> : null}
      </div>,
    )
  }

  const navPanel = (
    <div className={'dsgc-nav' + (navOpen ? '' : ' closed')} aria-hidden={navOpen ? undefined : 'true'}>
      <P.Input
        icon={Icon(P.IconSearchOutline16, 16)}
        className="dsgc-search"
        placeholder="搜索群组与会话…"
        value={search}
        onChange={(e: { target: { value: string } }) => setSearch(e.target.value)}
      />
      {treeNodes.length
        ? <div className="dsgc-tree">{treeNodes}</div>
        : <div className="dsgc-hint">{q ? '没有匹配「' + search.trim() + '」的群组或会话' : '暂无群组'}</div>}
      <P.Button variant="outline" onClick={() => { void mutate({ op: 'createGroup' }) }}>
        {Icon(P.IconPlusOutline16, 16)}新建群组
      </P.Button>
    </div>
  )

  // ---- 右栏：成员角色卡 + 工作区目录 ----
  const asidePanel = (
    <div className={'dsgc-aside' + (asideOpen ? '' : ' closed')} aria-hidden={asideOpen ? undefined : 'true'}>
      <div className="dsgc-sec">
        <div className="dsgc-sechead">
          群成员
          <span className="dsgc-secspacer" />
          <span className="dsgc-seccount">{group!.roleIds.length ? group!.roleIds.length + ' 个' : ''}</span>
          <P.Button variant="ghost" size="sm" onClick={() => { void openRoleEditor(null) }} aria-label="添加角色">
            {Icon(P.IconPlusOutline16, 14)}添加
          </P.Button>
        </div>
        {group!.roleIds.length
          ? (
            <div className="dsgc-roles">
              {group!.roleIds.map((rid) => {
                const r = roleById(snap, rid)
                if (!r) return null
                return (
                  <div
                    key={r.id}
                    className={'dsgc-role' + (r.enabled ? '' : ' off')}
                    role="button"
                    tabIndex={0}
                    onClick={() => { void openRoleEditor(r) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void openRoleEditor(r) } }}
                    title="点击编辑角色"
                  >
                    <div className="dsgc-rolehead">
                      <span className="dsgc-roledot" style={{ background: r.color || '#888' }} />
                      <span className="dsgc-rolename">{r.name}</span>
                      <P.Tooltip label={r.enabled ? '停用该角色' : '启用该角色'} side="top" delayMs={300}>
                        <span
                          onClick={(e) => { e.stopPropagation() }}
                          onKeyDown={(e) => { e.stopPropagation() }}
                          style={{ display: 'inline-flex', flex: 'none' }}
                        >
                          <P.Switch
                            checked={r.enabled}
                            onChange={() => { void mutate({ op: 'setRoleEnabled', roleId: r.id, enabled: !r.enabled }) }}
                            label={r.enabled ? '停用该角色' : '启用该角色'}
                            aria-label={(r.enabled ? '停用' : '启用') + '角色 ' + r.name}
                          />
                        </span>
                      </P.Tooltip>
                    </div>
                    {r.persona ? <div className="dsgc-rolepersona" title={r.persona}>{r.persona}</div> : null}
                    <div className="dsgc-rolemenu">
                      <span
                        className="dsgc-rolemodel"
                        title={r.provider + ' / ' + r.model + (r.thinking ? ' · 深度思考' + (r.reasoningEffort && r.reasoningEffort !== 'default' ? '（' + r.reasoningEffort + '）' : '') : '')}
                      >
                        {r.provider} / {r.model}
                      </span>
                      {r.thinking
                        ? <span title="深度思考" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--dsw-alias-label-tertiary,inherit)' }}>{Icon(P.IconThinkOutline14, 14)}</span>
                        : null}
                      <span className="dsgc-roleops">
                        <button
                          className="dsgc-opbtn"
                          title="编辑角色"
                          aria-label="编辑角色"
                          onClick={(e) => { e.stopPropagation(); void openRoleEditor(r) }}
                        >
                          {Icon(P.IconEditOutline16, 14)}
                        </button>
                        <button
                          className="dsgc-opbtn danger"
                          title="移除角色"
                          aria-label="移除角色"
                          onClick={(e) => { e.stopPropagation(); void mutate({ op: 'deleteRole', roleId: r.id }) }}
                        >
                          {Icon(P.IconTrashOutline16, 14)}
                        </button>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            )
          : <div className="dsgc-hint">还没有角色。每个角色可绑定不同的 provider/model，在群内以独立身份发言。</div>}
      </div>
      <div className="dsgc-sec">
        <div className="dsgc-sechead">工作区目录</div>
        <div className="dsgc-field">
          <div className="dsgc-wsrow">
            <input
              className="dsgc-input"
              value={wsDraft === null ? (group!.workspaceDir || '') : wsDraft}
              placeholder="~/docs 或 /abs/dir"
              onChange={(e) => { setWsDraft(e.target.value) }}
              onBlur={commitWsDir}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
            />
            <P.Button variant="outline" size="sm" onClick={() => { void openBrowser(wsDraft === null ? group!.workspaceDir : wsDraft) }}>
              {Icon(P.IconFolderOpenOutline16, 14)}浏览
            </P.Button>
          </div>
          <div className="dsgc-hint">发送时读取目录内文本文件，注入本群全体角色上下文；角色也可用工具主动查看</div>
          {group!.workspaceDir === '~' || group!.workspaceDir === '/'
            ? <div className="dsgc-err">工作区指向整个主目录/根目录：角色的只读工具将可读取该范围下的所有文件，请谨慎</div>
            : null}
        </div>
        {fileBrowser && fileBrowser.open
          ? (
            <div className="dsgc-fb">
              <div className="dsgc-fbhead">
                <span className="dsgc-fbpath" title={fileBrowser.list ? fileBrowser.list.path : ''}>
                  {fileBrowser.loading ? '读取中…' : (fileBrowser.list ? fileBrowser.list.path : '')}
                </span>
                <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <P.Button variant="primary" size="sm" disabled={!fileBrowser.list} onClick={selectCurrentDir}>选定此目录</P.Button>
                  {fileBrowser.list
                    ? <P.Button variant="outline" size="sm" title="上一级" aria-label="上一级" onClick={() => { void openBrowser(fileBrowser.list!.parent) }}>{Icon(P.IconChevronUpOutline14, 14)}</P.Button>
                    : null}
                  {fileBrowser.list
                    ? <P.Button variant="outline" size="sm" title="主目录" aria-label="主目录" onClick={() => { void openBrowser(fileBrowser.list!.home) }}>{Icon(P.IconFolderClose16, 14)}</P.Button>
                    : null}
                  <P.Button variant="ghost" size="sm" onClick={() => { setFileBrowser(null) }} aria-label="关闭浏览器">{Icon(P.IconCloseOutline16, 14)}</P.Button>
                </span>
              </div>
              {fileBrowser.error ? <div className="dsgc-err">{fileBrowser.error}</div> : null}
              {fileBrowser.list
                ? (
                  <div className="dsgc-fblist">
                    {(fileBrowser.list.entries || []).length
                      ? (fileBrowser.list.entries || []).map((e) => e.type === 'directory'
                        ? (
                          <button
                            key={e.path}
                            type="button"
                            className={'dsgc-fbrow' + (e.hidden ? ' dim' : '') + ' dir'}
                            onClick={() => { void openBrowser(e.path) }}
                          >
                            {Icon(e.hidden ? P.IconFolderClose16 : P.IconFolderOpenOutline16, 14)}
                            <span className="dsgc-fbname">{e.name}/</span>
                          </button>
                          )
                        : (
                          <div key={e.path} className="dsgc-fbrow dim file">
                            <span className="dsgc-fbname">{e.name}</span>
                            {e.size !== undefined ? <span className="dsgc-fbsize">{(P as unknown as { fileSizeText: (n: number) => string }).fileSizeText(e.size)}</span> : null}
                          </div>
                          ))
                      : <div className="dsgc-hint">空目录</div>}
                  </div>
                  )
                : null}
            </div>
            )
          : null}
      </div>
    </div>
  )

  // ---- 中栏：当前会话 ----
  const chatPanel = (
    <section className="dsgc-chat">
      {/* 接缝收合钮：钉在会话区两缘、各控其侧；面板收展时随接缝滑行 */}
      <button
        type="button"
        className={'dsgc-seambtn left' + (navOpen ? '' : ' closed')}
        aria-label={navOpen ? '收起群组导航栏' : '展开群组导航栏'}
        title={navOpen ? '收起群组导航栏' : '展开群组导航栏'}
        aria-expanded={navOpen}
        onClick={() => { setNavOpen(!navOpen) }}
      >
        {Icon(P.IconChevronLeftOutline14, 16)}
      </button>
      <button
        type="button"
        className={'dsgc-seambtn right' + (asideOpen ? '' : ' closed')}
        aria-label={asideOpen ? '收起成员与工作区栏' : '展开成员与工作区栏'}
        title={asideOpen ? '收起成员与工作区栏' : '展开成员与工作区栏'}
        aria-expanded={asideOpen}
        onClick={() => { setAsideOpen(!asideOpen) }}
      >
        {Icon(P.IconChevronRightOutline14, 16)}
      </button>
      <div className="dsgc-chathead">
        {sess ? <span className="dsgc-sess-title" title={'当前会话：' + sess.name}>{sess.name}</span> : null}
        <input
          className="dsgc-topic"
          value={topicDraft === null ? (sess ? sess.topic : '') : topicDraft}
          placeholder="设置本会话主题（可选）…"
          onChange={(e) => { setTopicDraft(e.target.value) }}
          onBlur={commitTopic}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
        />
        <P.Button variant="ghost" size="sm" title="清空当前会话的消息记录" onClick={() => { if (sess) void mutate({ op: 'clearMessages', sessionId: sess.id }) }}>
          清空
        </P.Button>
      </div>
      <div className="dsgc-msgs" ref={scrollRef} onScroll={onMsgsScroll}>
        {bubbles.length
          ? bubbles
          : (
            <div className="dsgc-empty">
              {Icon(P.IconSparkle16, 20)}
              <div className="dsgc-emptytitle">{sess && sess.topic ? '「' + sess.topic + '」' : '会话已就绪'}</div>
              <div className="dsgc-hint">
                {enabledRoles.length
                  ? '发送消息开始讨论；@成员 点名让其优先回应；留空直接发送可让角色自由讨论——每轮全体参与角色按顺序各发言一次，可用右下角轮数控制（1–10 轮）'
                  : '先在右侧添加角色（每个角色可绑定不同模型），再回到这里发起讨论。'}
              </div>
            </div>
            )}
      </div>
      <div className="dsgc-composer">
        {!atBottom && bubbles.length
          ? (
            <div className="dsgc-tobottom">
              <button
                type="button"
                className="dsgc-tobtn"
                onClick={() => { const el = scrollRef.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }) }}
              >
                {Icon(P.IconChevronDownOutline14, 14)}回到底部
              </button>
            </div>
            )
          : null}
        {err ? <div className="dsgc-err">{err}</div> : null}
        <div className="dsgc-parts">
          <span className="dsgc-partslabel">参与角色</span>
          {mentionedRoles.length
            ? <span className="dsgc-partslabel">已 @ {mentionedRoles.map((r) => r.name).join('、')}（本轮仅被点名成员发言）</span>
            : enabledRoles.length
              ? enabledRoles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={'dsgc-partchip' + (participants.includes(r.id) ? ' on' : '')}
                  onClick={() => togglePart(r.id)}
                  disabled={busyNow}
                  title={busyNow ? '对话进行中，暂停调整' : '点击切换本轮是否参与'}
                >
                  <span className="dsgc-chipdot" style={{ background: r.color || '#888' }} />
                  {r.name}
                </button>
                ))
              : <span className="dsgc-hint">还没有启用的角色，请在右侧添加</span>}
        </div>
        <div className="dsgc-card">
          <div className="dsgc-mentionwrap">
            {mention && mentionCandidates.length > 0
              ? (
                <div className="dsgc-mention" role="listbox">
                  {mentionCandidates.map((r, i) => (
                    <button
                      key={r.id}
                      type="button"
                      className={'dsgc-mentionitem' + (i === mentionIdx ? ' on' : '')}
                      role="option"
                      aria-selected={i === mentionIdx ? 'true' : 'false'}
                      onClick={() => applyMention(r)}
                      onMouseEnter={() => setMentionIdx(i)}
                    >
                      <span className="dsgc-chipdot" style={{ background: r.color || '#888' }} />
                      <span className="dsgc-mentionname">{r.name}</span>
                      <span className="dsgc-mentionmodel">{r.provider} / {r.model}</span>
                    </button>
                  ))}
                  <span className="dsgc-mentionhint">↑↓ 选择 · Enter/Tab 插入</span>
                </div>
                )
              : null}
            <textarea
              className="dsgc-textarea"
              ref={inputRef}
              rows={1}
              placeholder="发消息给全群，@成员 点名让其回应（留空则让角色自由讨论）…"
              value={input}
              onChange={onInputChange}
              onKeyDown={onInputKeyDown}
              style={{ resize: 'none', minHeight: '36px', maxHeight: '180px', boxSizing: 'border-box' }}
            />
          </div>
          <div className="dsgc-sendrow">
            <PermissionSelect
              tier={group!.permissionTier}
              onSelect={(tier) => { void mutate({ op: 'setPermissionTier', groupId: group!.id, tier }) }}
            />
            <span style={{ flex: 1 }} />
            <div className="dsgc-rounds" title="自由讨论的轮数（1–10）：一轮 = 全体参与角色按顺序各发言一次">
              <button type="button" className="dsgc-roundbtn" aria-label="减少轮数" disabled={rounds <= 1} onClick={() => { setRounds(Math.max(1, rounds - 1)) }}>
                {Icon(P.IconChevronLeftOutline14, 12)}
              </button>
              <span className="dsgc-roundnum" title="轮数">{rounds}</span>
              <button type="button" className="dsgc-roundbtn" aria-label="增加轮数" disabled={rounds >= 10} onClick={() => { setRounds(Math.min(10, rounds + 1)) }}>
                {Icon(P.IconChevronRightOutline14, 12)}
              </button>
              <span style={{ padding: '0 6px 0 2px' }}>轮</span>
            </div>
            {busyNow
              ? (
                <P.Button variant="outline" className="dsgc-stopbtn" onClick={() => { void stopRun() }}>
                  {Icon(P.IconStopFill16, 16)}停止
                </P.Button>
                )
              : (
                <P.Button variant="primary" onClick={() => { void sendMsg() }} disabled={(!participants.length && !mentionedRoles.length) || !sess}>
                  {Icon(P.IconSendOutline16, 16)}发送
                </P.Button>
                )}
          </div>
        </div>
      </div>
    </section>
  )

  return (
    <div className="dsgc-root">
      {navPanel}
      {chatPanel}
      {asidePanel}
      {roleDraft
        ? (
          <RoleDrawer
            draft={roleDraft}
            set={setRoleDraft}
            models={models}
            modelsError={modelsError}
            onRetryModels={() => { void fetchModels() }}
            onSave={() => { void saveRole() }}
            onCancel={() => { setRoleDraft(null); setRoleFormError('') }}
            formError={roleFormError}
          />
          )
        : null}
    </div>
  )
}
