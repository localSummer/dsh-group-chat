/**
 * 主面板：三区工作台——左导航栏（搜索 + 群组→会话目录树）、中央会话流
 * （@成员 点名 + markdown 渲染 + 思考折叠）、右上下文栏（群成员角色卡 +
 * 工作区目录），右栏可收起，角色编辑走右侧滑出抽屉。
 *
 * 面板数据走 /api/group-chat/*（fetch + SSE），Host 半持有全部状态。
 * @module dsh-group-chat/client/panel
 */

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Icon, P } from './lib/ui.ts'
import { api } from './lib/api.ts'
import { RoleDrawer } from './components/RoleDrawer.tsx'
import { NavPanel } from './components/NavPanel.tsx'
import { AsidePanel } from './components/AsidePanel.tsx'
import { ChatPanel } from './components/ChatPanel.tsx'
import { useGroupChatState, type ActionOk } from './hooks/useGroupChatState.ts'
import { useComposerEffects, useComposerInput, useMentionChip, useInputKeyboard } from './hooks/useComposer.ts'
import { draftFromRole, blankDraft, escapeRegExp, groupById, roleById, sessById, type ClientSnapshot, type ModelsResponse, type SnapshotRole } from './lib/model.ts'

export function GroupChatPanel(): ReactNode {
  const state = useGroupChatState()
  const {
    snap,
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
    inputRef,
    sendingRef,
    scrollRef,
    action,
    mutate,
  } = state

  // 瞬时通知（toast）：key 为展示序号，同文案重复触发也会重启动画
  const [toast, setToast] = useState<{ text: string, seq: number } | null>(null)

  // ---- 所有 Hooks 必须在条件返回之前调用 ----
  // Composer effects
  const { onMsgsScroll } = useComposerEffects(inputRef, scrollRef, input, atBottom, snap)
  const { syncFromDOM, onInputCE, onPasteCE, onDragOverCE, onDropCE } = useComposerInput(inputRef, setInput, setMention, setMentionIdx)

  // 选中群组/会话解析（用于 hooks 依赖）
  let group = snap && gid ? groupById(snap, gid) : null
  if (!group && snap && snap.groups.length) group = snap.groups[0]
  let sess = snap && sid ? sessById(snap, sid) : null
  // 有效会话统一兜底（与渲染体一致）：sid 未建立/未命中/跨群不匹配时取当前群组
  // 最后一个会话——必须在 busyNow 等 run 派生值之前完成，否则流式行/停止按钮
  // 在兜底视图（典型：host 重启后 lastCreated 为空、选中态从未建立）下永远失活
  if ((!sess || sess.groupId !== group?.id) && group && snap) {
    sess = group.sessionIds.length ? sessById(snap, group.sessionIds[group.sessionIds.length - 1]) : null
  }

  const enabledRoles = group ? group.roleIds.map((id) => roleById(snap!, id)).filter((r): r is SnapshotRole => !!r && r.enabled) : []
  const participants = partsSel || enabledRoles.map((r) => r.id)
  const busyNow = !!(sess && snap && snap.run.running && snap.run.sessionId === sess.id)

  // 查看即清：当前选中会话即 run.finished 所指会话 → 发 ackFinish 确认已读
  // （host 幂等清除 + 广播；覆盖点击/键盘/重挂恢复/lastCreated 定位全部选中路径）
  const finishedRun = snap ? snap.run.finished : null
  useEffect(() => {
    if (finishedRun && sess && finishedRun.sessionId === sess.id) void mutate({ op: 'ackFinish' })
  }, [finishedRun, sess])

  // @成员：候选与插入
  const mentionCandidates = mention !== null
    ? enabledRoles.filter((r) => r.name.toLowerCase().includes(mention.toLowerCase()))
    : []
  const mentionIdxC = mentionCandidates.length ? Math.min(mentionIdx, mentionCandidates.length - 1) : 0

  const { insertChip } = useMentionChip(inputRef, setMention, setMentionIdx, syncFromDOM)

  const mentionedRoles = enabledRoles.filter((r) => new RegExp('(^|\\s)@' + escapeRegExp(r.name) + '(?=\\s|$)').test(input))

  const sendMsg = useCallback(async (): Promise<void> => {
    if (busyNow || !sess || sendingRef.current) return
    sendingRef.current = true
    try {
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
  }, [busyNow, sess, sendingRef, mentionedRoles, participants, action, rounds, input, inputRef, setInput, setMention, setErr, setAtBottom, syncFromDOM])

  const { onInputKeyDown } = useInputKeyboard(mention, mentionCandidates, mentionIdxC, setMentionIdx, insertChip, sendMsg)

  // ---- 条件性早期返回 ----
  if (!snap) {
    return (
      <div className="dsgc-root">
        <div className="dsgc-loading">{Icon(P.IconLoadingOutline16, 16)}加载中…</div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="dsgc-root">
        <div className="dsgc-loading">暂无群组</div>
      </div>
    )
  }

  const msgById: Record<string, ClientSnapshot['messages'][number]> = {}
  for (const m of snap.messages) msgById[m.id] = m

  const togglePart = (rid: string): void => {
    const has = participants.includes(rid)
    setPartsSel(has ? participants.filter((x) => x !== rid) : participants.concat([rid]))
  }

  // 清空确认：不可清空（对话进行中）走 toast 提示，不再落到输入框上方的红字
  const doClear = async (): Promise<void> => {
    if (!sess) return
    if (busyNow) {
      setToast({ text: '对话进行中，需先停止才能清空', seq: Date.now() })
      return
    }
    const res = await mutate({ op: 'clearMessages', sessionId: sess.id })
    if (res && res.ok && res.snapshot && !res.snapshot.error) setConfirmClear(false)
    else if (res && res.snapshot && res.snapshot.error) {
      setErr('')
      setToast({ text: res.snapshot.error, seq: Date.now() })
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
    const res = await mutate({ op: 'upsertRole', groupId: group.id, role: roleDraft })
    if (res && res.ok && res.snapshot && !res.snapshot.error) {
      setRoleDraft(null)
      setRoleFormError('')
    }
  }

  const stopRun = async (): Promise<void> => {
    await action({ kind: 'stop', sessionId: sess!.id })
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

  return (
    <div className="dsgc-root">
      <NavPanel
        snap={snap}
        search={search}
        setSearch={setSearch}
        collapsedGroups={collapsedGroups}
        setCollapsedGroups={setCollapsedGroups}
        gid={group.id}
        sid={sess ? sess.id : sid}
        setGid={setGid}
        setSid={setSid}
        setPartsSel={setPartsSel}
        renameDraft={renameDraft}
        setRenameDraft={setRenameDraft}
        confirmDel={confirmDel}
        setConfirmDel={setConfirmDel}
        mutate={mutate}
        navOpen={navOpen}
      />
      <ChatPanel
        snap={snap}
        sess={sess}
        group={group}
        enabledRoles={enabledRoles}
        participants={participants}
        mentionedRoles={mentionedRoles}
        busyNow={busyNow}
        input={input}
        mention={mention}
        mentionCandidates={mentionCandidates}
        mentionIdxC={mentionIdxC}
        rounds={rounds}
        err={err}
        atBottom={atBottom}
        topicDraft={topicDraft}
        msgById={msgById}
        navOpen={navOpen}
        asideOpen={asideOpen}
        inputRef={inputRef}
        scrollRef={scrollRef}
        setTopicDraft={setTopicDraft}
        setConfirmClear={setConfirmClear}
        setMentionIdx={setMentionIdx}
        setRounds={setRounds}
        setNavOpen={setNavOpen}
        setAsideOpen={setAsideOpen}
        togglePart={togglePart}
        onMsgsScroll={() => {
          const isBottom = onMsgsScroll()
          if (isBottom !== undefined) setAtBottom(isBottom)
        }}
        onInputCE={onInputCE}
        onInputKeyDown={onInputKeyDown}
        onPasteCE={onPasteCE}
        onDropCE={onDropCE}
        onDragOverCE={onDragOverCE}
        insertChip={insertChip}
        sendMsg={sendMsg}
        stopRun={stopRun}
        action={action}
        mutate={mutate}
        setMention={setMention}
      />
      <AsidePanel
        snap={snap}
        group={group}
        asideOpen={asideOpen}
        wsDraft={wsDraft}
        setWsDraft={setWsDraft}
        fileBrowser={fileBrowser}
        setFileBrowser={setFileBrowser}
        mutate={mutate}
        openRoleEditor={openRoleEditor}
        openBrowser={openBrowser}
        selectCurrentDir={selectCurrentDir}
      />
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
                <P.Button variant="outline" size="sm" className="dsgc-stopbtn" onClick={() => { void doClear() }}>清空</P.Button>
              </>
            )}
          >
            <ul className="dsgc-clearnotes">
              <li>删除内容：本会话的用户消息与角色发言（含思考、工具调用记录），确认后立即落盘</li>
              <li>不可恢复：此操作没有回收站，也没有撤销</li>
              <li>不受影响：会话本身与主题、群成员角色、工作区目录、权限档位</li>
            </ul>
          </P.Modal>
        )
        : null}
      {toast
        ? (
          <P.Toast
            key={toast.seq}
            text={toast.text}
            icon={Icon(P.IconWarningOutline16, 16)}
            anchor={inputRef.current}
            onDone={() => { setToast(null) }}
          />
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
