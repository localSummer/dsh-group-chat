/**
 * 主面板：三区工作台——左导航栏（搜索 + 群组→会话目录树）、中央会话流
 * （@成员 点名 + markdown 渲染 + 思考折叠）、右上下文栏（群成员角色卡 +
 * 工作区目录），右栏可收起，角色编辑走右侧滑出抽屉。
 *
 * 面板数据走 /api/group-chat/*（fetch + SSE），Host 半持有全部状态。
 * @module dsh-group-chat/client/panel
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { ImageAttachmentRef } from '@deepseek-ai/dsh-attachment'
import { Icon, P } from './lib/ui.ts'
import { api } from './lib/api.ts'
import { RoleDrawer } from './components/RoleDrawer.tsx'
import { NavPanel } from './components/NavPanel.tsx'
import { AsidePanel } from './components/AsidePanel.tsx'
import { ChatPanel } from './components/ChatPanel.tsx'
import { ImageLightbox } from './components/ImageLightbox.tsx'
import { useGroupChatState, type ActionOk } from './hooks/useGroupChatState.ts'
import { useComposerEffects, useComposerInput, useComposerDraft, useMentionChip, useInputKeyboard } from './hooks/useComposer.ts'
import { useFileSearch } from './hooks/useFileSearch.ts'
import { useMentionCandidates, useMentionedRoles, useSafeMentionIndex } from './hooks/useMentionState.ts'
import { clearComposerDraft, writeComposerDraft } from './lib/composer-draft.ts'
import { serializeInput } from './utils/utils.ts'
import { draftFromRole, blankDraft, groupById, roleById, rolesAcceptImages, sessById, type ClientSnapshot, type ModelsResponse, type SnapshotRole } from './lib/model.ts'

/** upload action 的响应形态。 */
interface UploadResponse {
  ok: boolean
  image?: ImageAttachmentRef
  error?: string
}

/** File → data URI（upload 端点的入参形态）。 */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('读取图片失败'))
    reader.readAsDataURL(file)
  })
}

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

  // 图片上传：文件 → upload 端点 → durable ref → 文本框上方的预览条。
  // 上传中计数用于禁用发送（避免上传未完成就发送、图片静默丢失）。
  const [uploading, setUploading] = useState(0)
  const [pendingImages, setPendingImages] = useState<ImageAttachmentRef[]>([])
  const [viewImage, setViewImage] = useState<ImageAttachmentRef | null>(null)
  const imagesRef = useRef<ImageAttachmentRef[]>([])
  const imagesSupportedRef = useRef(true)
  const sessIdRef = useRef<string | null>(sess ? sess.id : null)
  imagesRef.current = pendingImages
  sessIdRef.current = sess ? sess.id : null

  const commitImages = useCallback((next: ImageAttachmentRef[]): void => {
    imagesRef.current = next
    setPendingImages(next)
    const el = inputRef.current
    writeComposerDraft(sessIdRef.current, el ? el.innerHTML : '', el ? serializeInput(el) : '', next)
  }, [inputRef])

  const uploadImages = useCallback(async (files: File[]): Promise<void> => {
    if (!imagesSupportedRef.current) {
      setToast({ text: '当前参与角色不支持图片输入', seq: Date.now() })
      return
    }
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      setUploading((n) => n + 1)
      try {
        const data = await readAsDataUrl(file)
        const res = await api.upload({ data, mediaType: file.type, name: file.name }) as UploadResponse
        if (res && res.ok && res.image) commitImages(imagesRef.current.concat([res.image]))
        else setErr(res && res.error ? String(res.error) : '图片上传失败')
      } catch (e) {
        setErr(String((e && (e as Error).message) || e))
      } finally {
        setUploading((n) => n - 1)
      }
    }
  }, [setErr, commitImages, setToast])

  const { syncFromDOM, onInputCE, onPasteCE, onDragOverCE, onDropCE } = useComposerInput(
    inputRef, setInput, setMention, setMentionIdx, sess ? sess.id : null, (files) => { void uploadImages(files) }, imagesRef,
  )
  useComposerDraft(sess ? sess.id : null, inputRef, setInput, setMention, imagesRef, setPendingImages)

  const enabledRoles = group ? group.roleIds.map((id) => roleById(snap!, id)).filter((r): r is SnapshotRole => !!r && r.enabled) : []
  const participants = partsSel || enabledRoles.map((r) => r.id)
  const busyNow = !!(sess && snap && snap.run.running && snap.run.sessionId === sess.id)

  // 查看即清：当前选中会话即 run.finished 所指会话 → 发 ackFinish 确认已读
  // （host 幂等清除 + 广播；覆盖点击/键盘/重挂恢复/lastCreated 定位全部选中路径）
  const finishedRun = snap ? snap.run.finished : null
  useEffect(() => {
    if (finishedRun && sess && finishedRun.sessionId === sess.id) mutate({ op: 'ackFinish' })
  }, [finishedRun, sess])

  // 提及状态：角色候选、文件搜索、索引安全化
  const mentionCandidates = useMentionCandidates(mention, enabledRoles)
  const { fileCandidates, fileSearchError, fileSearchLoading } = useFileSearch(
    mention,
    group?.id,
  )
  const mentionIdxC = useSafeMentionIndex(
    mentionCandidates.length || fileCandidates.length,
    mentionIdx
  )
  
  const mentionedRoles = useMentionedRoles(input, enabledRoles)

  // 模型目录拉取：图片能力判定（inputModalities）与角色抽屉共用。
  // 必须是 useCallback 且声明在所有条件早退之前——下面的预载 effect 会引用它，
  // 若声明在早退之后，首帧（snap 为 null 的冷启动）effect 会踩 TDZ 抛
  // ReferenceError，而本面板无 ErrorBoundary，会整棵树白屏。
  const fetchModels = useCallback(async (): Promise<void> => {
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
  }, [setModels, setModelsError])

  // 图片可用性：本次实际发言的角色（@点名优先，否则勾选集合）是否都支持图片输入。
  // 能力来自 harness 透传的 inputModalities；模型目录未加载时不判为不支持。
  const speakingRoles = mentionedRoles.length ? mentionedRoles : enabledRoles.filter((r) => participants.includes(r.id))
  const imagesSupported = rolesAcceptImages(speakingRoles, models)
  imagesSupportedRef.current = imagesSupported

  // 模型目录后台预载：图片能力判定需要 inputModalities（此前只在打开角色抽屉时才拉）
  useEffect(() => {
    if (!models && !modelsError) void fetchModels()
  }, [fetchModels, models, modelsError])

  const { insertChip, insertFileChip } = useMentionChip(inputRef, setMention, setMentionIdx, syncFromDOM)

  const sendMsg = useCallback(async (): Promise<void> => {
    if (busyNow || !sess || sendingRef.current) return
    // 上传未完成不发：避免图片静默丢失（芯片还没插入）。按钮态已由 Composer 的
    // disabled 反映，此处兜住 Enter 路径并给出提示，避免「按了没反应」。
    if (uploading > 0) {
      setToast({ text: '图片上传中，请稍候', seq: Date.now() })
      return
    }
    const el = inputRef.current
    const images = imagesRef.current
    // 已选图片但当前发言角色有人不支持：不自动删图，拒绝发送，让用户自己移除或换角色。
    if (images.length > 0 && !imagesSupported) {
      setToast({ text: '当前参与角色不支持图片，请先移除后再发送', seq: Date.now() })
      return
    }
    // 空内容不可发送（纯图片消息允许：有图即可）
    if (!input.trim() && images.length === 0) return
    sendingRef.current = true
    try {
      if (!participants.length && !mentionedRoles.length) {
        setErr('请至少选择一个参与角色（或在消息中 @成员）')
        return
      }
      const parts = mentionedRoles.length ? mentionedRoles.map((r) => r.id) : participants
      const res = await action({
        kind: 'send',
        sessionId: sess.id,
        text: input,
        images: images.length > 0 ? images : undefined,
        participantRoleIds: parts,
        rounds,
      }) as ActionOk | null
      if (res && !res.ok && res.error) setErr(res.error)
      else if (res && res.ok) {
        imagesRef.current = []
        setPendingImages([])
        if (el) el.innerHTML = ''
        setInput('')
        setMention(null)
        setErr('')
        setAtBottom(true)
        clearComposerDraft(sess.id)
        syncFromDOM()
      }
    } finally {
      sendingRef.current = false
    }
  }, [busyNow, sess, sendingRef, uploading, imagesSupported, mentionedRoles, participants, action, rounds, input, inputRef, setInput, setMention, setErr, setAtBottom, syncFromDOM])

  const { onInputKeyDown } = useInputKeyboard(mention, mentionCandidates, mentionIdxC, setMentionIdx, insertChip, insertFileChip, fileCandidates, setMention, sendMsg)

  // ---- 条件性早期返回 ----
  if (!snap) {
    return (
      <div className="dsgc-root">
        <div className="dsgc-loading">{Icon(P.IconLoadingOutlineMedium, 16)}加载中…</div>
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

  const retrySpeak = async (messageId: string): Promise<void> => {
    if (!sess) return
    if (busyNow || (snap && snap.run.running)) {
      setToast({ text: '已有对话进行中，请先停止', seq: Date.now() })
      return
    }
    const res = await action({ kind: 'retrySpeak', sessionId: sess.id, messageId }) as ActionOk | null
    if (res && !res.ok && res.error) setToast({ text: res.error, seq: Date.now() })
  }

  // 表情回应（仅用户标注）：toggle 语义由 host 承载（普通函数即可——
  // Bubble memo 只判回调存在性，不要求稳定引用；不可用 useCallback：
  // 本处在条件早退之后，Hook 数量随快照态漂移会触发 React #310）
  const toggleReaction = (messageId: string, emoji: string): void => {
    mutate({ op: 'reactMessage', messageId, emoji })
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
  // 抽屉即时滑出；模型目录后台补载，抽屉内自带「加载中/失败重试」态，
  // 不让网络往返把入场卡成「无反馈→突然闪现」
  const openRoleEditor = (role: SnapshotRole | null): void => {
    setErr('')
    setRoleDraft(role ? draftFromRole(role) : blankDraft())
    if (!models || modelsError) void fetchModels()
  }

  const stopRun = async (): Promise<void> => {
    await action({ kind: 'stop', sessionId: sess!.id })
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
        fileCandidates={fileCandidates}
        fileSearchError={fileSearchError}
        fileSearchLoading={fileSearchLoading}
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
        insertFileChip={insertFileChip}
        onImageFiles={(files) => { void uploadImages(files) }}
        uploading={uploading > 0}
        images={pendingImages}
        onRemoveImage={(index) => { commitImages(pendingImages.filter((_, i) => i !== index)) }}
        imagesSupported={imagesSupported}
        onOpenImage={setViewImage}
        sendMsg={sendMsg}
        stopRun={stopRun}
        action={action}
        mutate={mutate}
        setMention={setMention}
        onRetrySpeak={(messageId) => { retrySpeak(messageId) }}
        onToggleReaction={toggleReaction}
      />
      <AsidePanel
        snap={snap}
        group={group}
        asideOpen={asideOpen}
        mutate={mutate}
        openRoleEditor={openRoleEditor}
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
                <P.Button variant="outline" size="sm" className="dsgc-stopbtn" onClick={() => { doClear() }}>清空</P.Button>
              </>
            )}
          >
            <ul className="dsgc-clearnotes">
              <li>删除内容：本会话的用户消息与角色发言（含思考、工具调用记录）以及本会话结论/约束备忘，确认后立即落盘</li>
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
            icon={Icon(P.IconWarningOutlineMedium, 16)}
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
            groupId={group.id}
            models={models}
            modelsError={modelsError}
            onRetryModels={() => { fetchModels() }}
            mutate={mutate}
            onCancel={() => { setRoleDraft(null) }}
          />
          )
        : null}
      {viewImage
        ? (
          <ImageLightbox
            src={api.imageUrl(String(viewImage.attachmentId))}
            name={viewImage.name || '图片'}
            onClose={() => { setViewImage(null) }}
          />
          )
        : null}
    </div>
  )
}
