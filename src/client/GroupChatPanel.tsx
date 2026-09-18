/**
 * 主面板：三区工作台——左导航栏（搜索 + 群组→会话目录树）、中央会话流
 * （@成员 点名 + markdown 渲染 + 思考折叠）、右上下文栏（群成员角色卡 +
 * 工作区目录），右栏可收起，角色编辑走右侧滑出抽屉。
 *
 * 面板数据走 /api/group-chat/*（fetch + SSE），Host 半持有全部状态。
 * @module dsh-group-chat/client/panel
 */

import { useCallback, useEffect, useRef, useState, type ClipboardEvent as ReactClipboardEvent, type CSSProperties, type DragEvent as ReactDragEvent, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
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

/** HTML 转义（芯片以 execCommand('insertHTML') 注入，角色名需转义）。 */
function escapeHtml(v: string): string {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * execCommand 集中封装。它已被 Web 平台标记 @deprecated（ts 6387 编辑器提示），
 * 但仍是唯一能让 contenteditable 的 DOM 编辑进入浏览器原生 undo 栈的同步 API
 * （自研 undo 栈或引入 Lexical/ProseMirror 类框架代价更大；取舍见 DESIGN.md
 * Composer 契约）。经中间别名擦除废弃标记，全部调用走本封装，不在调用处散布提示。
 */
type ExecCommandFn = (commandId: string, showUI?: boolean, value?: string) => boolean
let execCommandFn: ExecCommandFn | undefined
function execCommand(commandId: 'delete' | 'insertHTML' | 'insertText' | 'insertLineBreak', value?: string): boolean {
  execCommandFn ??= (document as unknown as { execCommand: ExecCommandFn }).execCommand
  return execCommandFn.call(document, commandId, false, value)
}

/**
 * contenteditable 输入区 → 纯文本序列化（发送/参与判定的唯一事实源）：
 * 文本节点原样；<br> → 换行；@提及芯片（.dsgc-chipin）展开回「@名字␠」；
 * DIV/P 块前补换行（防粘贴残留的块级包裹）。手打纯文本 @名字 与芯片展开
 * 结果同形——语义统一由 mentionedRoles 正则承载（芯片=糖，正则=真）。
 */
function serializeInput(root: HTMLElement): string {
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || ''
    if (node.nodeType !== Node.ELEMENT_NODE) return ''
    const el = node as HTMLElement
    if (el.tagName === 'BR') return '\n'
    if (el.classList.contains('dsgc-chipin')) return '@' + (el.dataset.name || '') + ' '
    const sep = /^(DIV|P)$/.test(el.tagName) ? '\n' : ''
    return sep + Array.from(el.childNodes).map(walk).join('')
  }
  return Array.from(root.childNodes).map(walk).join('')
}

/** @提及芯片的 HTML（原子元素：contenteditable=false + draggable，退格整删）。 */
function chipHtml(role: { id: string, name: string, color?: string }): string {
  const c = escapeHtml(role.color || '#888')
  return '<span class="dsgc-chipin" data-role-id="' + escapeHtml(role.id) + '" data-name="' + escapeHtml(role.name) + '" style="--role-color:' + c + '" contenteditable="false" draggable="true">' +
    '<span class="dsgc-chipdot" style="background:' + c + '"></span>' + escapeHtml(role.name) + '</span>'
}

export function GroupChatPanel(): ReactNode {
  const [snap, setSnap] = useState<ClientSnapshot | null>(null)
  const [gid, setGid] = useState<string | null>(null)
  const [sid, setSid] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [collapsedGroups, setCollapsedGroups] = useToggle()
  const [renameDraft, setRenameDraft] = useState<{ kind: 'group' | 'session', id: string, value: string } | null>(null)
  const [confirmDel, setConfirmDel] = useState<{ kind: 'group' | 'session', id: string } | null>(null)
  /** 清空当前会话的确认弹窗（破坏性且不可恢复，需说明范围与后果） */
  const [confirmClear, setConfirmClear] = useState(false)
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
  /** @ 弹层的当前查询串（光标前未闭合的 @词）；null = 弹层关闭 */
  const [mention, setMention] = useState<string | null>(null)
  const [mentionIdx, setMentionIdx] = useState(0)
  const [asideOpen, setAsideOpen] = useState(true)
  const [navOpen, setNavOpen] = useState(true)
  const [atBottom, setAtBottom] = useState(true)
  const inputRef = useRef<HTMLDivElement | null>(null)
  /** 发送在途锁：防快速连按 Enter 时，SSE busyNow 未及更新导致的第二次发送
   *  触发服务端拒绝并弹出误导性错误横幅（服务端本就有 run.running 兜底） */
  const sendingRef = useRef(false)
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

  /** 从 DOM 同步 input 状态（序列化）；占位符类由 input 状态派生（React 渲染），不走命令式 toggle。
   *  钩子必须在早退（if (!snap)）之前声明，否则首帧与数据帧 hook 数不一致 → React #310 */
  const syncFromDOM = useCallback((): void => {
    const el = inputRef.current
    if (!el) return
    setInput(serializeInput(el))
  }, [])

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

  // ---- @成员：候选与插入（contenteditable 芯片） ----
  // 注意 query 为空串（刚敲 @）时也必须出全部候选：判 null 不判真值
  const mentionCandidates = mention !== null
    ? enabledRoles.filter((r) => r.name.toLowerCase().includes(mention.toLowerCase()))
    : []
  /** 钳制后的候选索引：候选由 enabledRoles 实时派生，SSE 快照 / 右栏启停开关都会
   *  在无 input 事件的情况下收缩它——裸 mentionIdx 会越界，Enter 时
   *  mentionCandidates[mentionIdx] = undefined → insertChip 崩溃且 @词已被删丢失 */
  const mentionIdxC = mentionCandidates.length ? Math.min(mentionIdx, mentionCandidates.length - 1) : 0

  /** 光标前未闭合的 @词（弹层触发判定）；无返回 null */
  const queryAtCaret = (): string | null => {
    const sel = window.getSelection()
    if (!sel || !sel.isCollapsed || sel.rangeCount === 0) return null
    const node = sel.anchorNode
    if (!node || node.nodeType !== Node.TEXT_NODE) return null
    const before = (node.nodeValue || '').slice(0, sel.anchorOffset)
    const m = /(?:^|\s)@([^\s@]*)$/.exec(before)
    return m ? m[1] : null
  }

  const onInputCE = (): void => {
    syncFromDOM()
    setMention(queryAtCaret())
    setMentionIdx(0)
  }

  /** 弹层候选 → 删掉光标前的 @词、插入原子芯片 + 尾随空格，并把光标钉在空格后。
   *  入区守卫：选区必须落在输入区内——失焦后 stale 弹层 + 点击候选的组合会用
   *  消息区的选区插芯片，把节点插进 React 管理的气泡 DOM，必须拒之门外。
   *  全程走 execCommand（delete/insertHTML/insertText）保 undo 栈；insertHTML
   *  插入 contenteditable=false 节点后部分浏览器把选区落进芯片内部（不可编辑处，
   *  曾致 insertText 失灵、空格丢失、光标不可见）——用临时 data-new 标记找到
   *  刚插的芯片、显式把选区钉到其后，再 insertText 补空格。
   *  尾随空格必须是 U+0020（序列化与正则边界依赖它）。 */
  const insertChip = (role: SnapshotRole): void => {
    const el = inputRef.current
    const sel = window.getSelection()
    if (!el || !sel) return
    if (!sel.anchorNode || !el.contains(sel.anchorNode)) return
    el.focus({ preventScroll: true })
    // 1. 删除光标前的 @词（在锚文本节点内按区间删）
    const node = sel.anchorNode
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue || ''
      const off = sel.anchorOffset
      const m = /(?:^|\s)@([^\s@]*)$/.exec(text.slice(0, off))
      if (m) {
        const start = off - m[1].length - 1
        if (start >= 0) {
          const range = document.createRange()
          range.setStart(node, start)
          range.setEnd(node, off)
          sel.removeAllRanges()
          sel.addRange(range)
          execCommand('delete')
        }
      }
    }
    // 2. 插入芯片（带临时 data-new 标记，供下一步定位刚插入的节点）
    execCommand('insertHTML', chipHtml(role).replace('class="dsgc-chipin"', 'class="dsgc-chipin" data-new=""'))
    const chip = el.querySelector<HTMLElement>('.dsgc-chipin[data-new]')
    if (!chip) return
    // 3. 选区显式钉到芯片之后，再补尾随空格（insertText 后光标自然落在空格后）
    const after = document.createRange()
    after.setStartAfter(chip)
    after.collapse(true)
    sel.removeAllRanges()
    sel.addRange(after)
    execCommand('insertText', ' ')
    chip.removeAttribute('data-new')
    setMention(null)
    setMentionIdx(0)
    syncFromDOM()
  }

  /** 粘贴/拖放强制纯文本：取 text/plain 经 insertText 注入，杜绝富文本/HTML 进
   *  输入区——拖放是粘贴之外的第二个入口，同样要堵（不堵则拖入 <img> 等可见
   *  但序列化为空，所见非所发） */
  const onPasteCE = (e: ReactClipboardEvent<HTMLDivElement>): void => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    if (text) execCommand('insertText', text)
  }
  const onDragOverCE = (e: ReactDragEvent<HTMLDivElement>): void => {
    e.preventDefault() // 允许 drop 落点，实际插入交给 onDropCE 纯文本化
  }
  const onDropCE = (e: ReactDragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    const text = e.dataTransfer.getData('text/plain')
    if (text) execCommand('insertText', text)
  }

  const mentionedRoles = enabledRoles.filter((r) => new RegExp('(^|\\s)@' + escapeRegExp(r.name) + '(?=\\s|$)').test(input))

  const sendMsg = async (): Promise<void> => {
    if (busyNow || !sess || sendingRef.current) return
    sendingRef.current = true
    try {
      // 被 @ 的成员优先作为本轮参与角色
      const parts = mentionedRoles.length ? mentionedRoles.map((r) => r.id) : participants
      if (!parts.length) {
        setErr(mentionedRoles.length ? '' : '请至少选择一个参与角色（或在消息中 @成员）')
        if (!mentionedRoles.length) return
      }
      const res = await action({ kind: 'send', sessionId: sess.id, text: input, participantRoleIds: parts, rounds }) as ActionOk | null
      if (res && !res.ok && res.error) setErr(res.error)
      else if (res && res.ok) {
        const el = inputRef.current
        if (el) el.innerHTML = ''
        setInput('')
        setMention(null)
        setErr('')
        setAtBottom(true)
        syncFromDOM()
      }
    } finally {
      sendingRef.current = false
    }
  }

  /** 确认弹窗后的清空执行；成功（无 snapshot.error）才关弹窗，失败走 err 横幅 */
  const doClear = async (): Promise<void> => {
    if (!sess) return
    const res = await mutate({ op: 'clearMessages', sessionId: sess.id })
    if (res && res.ok && res.snapshot && !res.snapshot.error) setConfirmClear(false)
  }
  const onInputKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>): void => {
    // IME 组合中的按键（含 Enter 选词）不参与任何快捷逻辑；
    // keyCode 229 兜底 Safari 提交组合时 isComposing 为假的历史坑
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (mention !== null && mentionCandidates.length) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionIdx((mentionIdxC + 1) % mentionCandidates.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionIdx((mentionIdxC - 1 + mentionCandidates.length) % mentionCandidates.length)
        return
      }
      // Enter 插芯片仅限无 Shift——Shift+Enter 在弹层开时仍是换行（用户明确要换行），
      // 换行后的 input 事件会经 queryAtCaret 自然关掉弹层
      if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Tab') {
        e.preventDefault()
        insertChip(mentionCandidates[mentionIdxC])
        return
      }
    }
    if (e.key === 'Enter' && e.shiftKey) {
      // 换行统一走 insertLineBreak（<br>），防浏览器默认插 DIV 块
      e.preventDefault()
      execCommand('insertLineBreak')
      return
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
        <P.Button variant="ghost" size="sm" title="清空当前会话的消息记录" onClick={() => { if (sess) setConfirmClear(true) }}>
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
            {mention !== null && mentionCandidates.length > 0
              ? (
                <div className="dsgc-mention" role="listbox">
                  {mentionCandidates.map((r, i) => (
                    <button
                      key={r.id}
                      type="button"
                      className={'dsgc-mentionitem' + (i === mentionIdxC ? ' on' : '')}
                      role="option"
                      aria-selected={i === mentionIdxC ? 'true' : 'false'}
                      // 阻止 mousedown 抢走输入区焦点/选区——点击候选时插入芯片依赖原光标
                      onMouseDown={(e) => { e.preventDefault() }}
                      onClick={() => { insertChip(r) }}
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
            {/* 非受控 contenteditable（React 不管理其子节点）：
                @成员插入为原子芯片（.dsgc-chipin），序列化展开回纯文本 @名字␠；
                IME 组合期只读不写 DOM */}
            {/* 占位符 = 独立覆盖层（对齐主会话）：::before 生成内容会把聚焦光标
                顶到占位文字之后，覆盖层不参与光标布局。
                判空用 trim：全删后浏览器会残留一个占位 <br>（序列化出 '\n'），
                严格 === '' 会让占位符不再出现 */}
            {!input.trim()
              ? <div className="dsgc-ph" aria-hidden="true">发消息给全群，@成员 点名让其回应（留空则让角色自由讨论）…</div>
              : null}
            <div
              className="dsgc-edit"
              ref={inputRef}
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-multiline="true"
              aria-label="群聊消息输入框"
              onInput={onInputCE}
              onKeyDown={onInputKeyDown}
              onPaste={onPasteCE}
              onDrop={onDropCE}
              onDragOver={onDragOverCE}
              // 失焦即关弹层：mention 只随 input 事件更新，click 移光标/点外部
              // 都不触发 input，不关会留下 stale 弹层（Enter 在错误位置插芯片）
              onBlur={() => { setMention(null) }}
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
      {sess && confirmClear
        ? (
          <P.Modal
            open
            onClose={() => { setConfirmClear(false) }}
            title="清空本会话的消息记录？"
            closeLabel="关闭"
            description={'会话「' + sess.name + '」的全部 ' + sess.messageIds.length + ' 条消息将被永久删除'}
            footer={(
              <>
                <P.Button variant="outline" size="sm" onClick={() => { setConfirmClear(false) }}>取消</P.Button>
                <P.Button variant="outline" size="sm" className="dsgc-stopbtn" disabled={busyNow} onClick={() => { void doClear() }}>清空</P.Button>
              </>
            )}
          >
            <ul className="dsgc-clearnotes">
              <li>删除内容：本会话的用户消息与角色发言（含思考、工具调用记录），确认后立即落盘</li>
              <li>不可恢复：此操作没有回收站，也没有撤销</li>
              <li>不受影响：会话本身与主题、群成员角色、工作区目录、权限档位</li>
              {busyNow ? <li className="dsgc-err">对话进行中，需先停止才能清空</li> : null}
            </ul>
          </P.Modal>
        )
        : null}
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
