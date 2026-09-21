/**
 * 中央会话面板组件
 * @module dsh-group-chat/client/components
 */

import type { ReactNode } from 'react'
import { Icon, P } from '../lib/ui.ts'
import { MessageFlow } from './MessageFlow.tsx'
import { Composer } from './Composer.tsx'
import { RoundTrack } from './RoundTrack.tsx'
import type { ClientSnapshot, SnapshotRole } from '../lib/model.ts'
import type { AtToken } from '../../shared/file-mention-grammar.ts'

interface ChatPanelProps {
  snap: ClientSnapshot
  sess: ClientSnapshot['sessions'][number] | null
  group: ClientSnapshot['groups'][number]
  enabledRoles: SnapshotRole[]
  participants: string[]
  mentionedRoles: SnapshotRole[]
  busyNow: boolean
  input: string
  mention: AtToken | null
  mentionCandidates: SnapshotRole[]
  mentionIdxC: number
  fileCandidates: Array<{ path: string, isDir: boolean }>
  fileSearchError: string | null
  fileSearchLoading: boolean
  rounds: number
  err: string
  atBottom: boolean
  topicDraft: string | null
  msgById: Record<string, ClientSnapshot['messages'][number]>
  navOpen: boolean
  asideOpen: boolean
  inputRef: React.RefObject<HTMLDivElement>
  scrollRef: React.RefObject<HTMLDivElement>
  setTopicDraft: (val: string | null) => void
  setConfirmClear: (val: boolean) => void
  setMentionIdx: (val: number) => void
  setRounds: (val: number) => void
  setNavOpen: (val: boolean) => void
  setAsideOpen: (val: boolean) => void
  togglePart: (rid: string) => void
  onMsgsScroll: () => void
  onInputCE: () => void
  onInputKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void
  onPasteCE: (e: React.ClipboardEvent<HTMLDivElement>) => void
  onDropCE: (e: React.DragEvent<HTMLDivElement>) => void
  onDragOverCE: (e: React.DragEvent<HTMLDivElement>) => void
  insertChip: (role: SnapshotRole) => void
  insertFileChip: (path: string, kind: 'file' | 'directory') => void
  sendMsg: () => Promise<void>
  stopRun: () => Promise<void>
  action: (payload: Record<string, unknown>) => Promise<unknown>
  mutate: (args: Record<string, unknown>) => Promise<unknown>
  setMention: (val: AtToken | null) => void
  onRetrySpeak: (messageId: string) => void
  onToggleReaction: (messageId: string, emoji: string) => void
}

export function ChatPanel(props: ChatPanelProps): ReactNode {
  const {
    snap,
    sess,
    group,
    enabledRoles,
    participants,
    mentionedRoles,
    busyNow,
    input,
    mention,
    mentionCandidates,
    mentionIdxC,
    fileCandidates,
    fileSearchError,
    fileSearchLoading,
    rounds,
    err,
    atBottom,
    topicDraft,
    msgById,
    navOpen,
    asideOpen,
    inputRef,
    scrollRef,
    setTopicDraft,
    setConfirmClear,
    setMentionIdx,
    setRounds,
    setNavOpen,
    setAsideOpen,
    togglePart,
    onMsgsScroll,
    onInputCE,
    onInputKeyDown,
    onPasteCE,
    onDropCE,
    onDragOverCE,
    insertChip,
    insertFileChip,
    sendMsg,
    stopRun,
    action,
    mutate,
    setMention,
    onRetrySpeak,
    onToggleReaction,
  } = props

  const commitTopic = (): void => {
    if (topicDraft !== null && sess && topicDraft !== sess.topic) mutate({ op: 'setTopic', sessionId: sess.id, topic: topicDraft })
    setTopicDraft(null)
  }

  const bubbles = (
    <MessageFlow
      snap={snap}
      sess={sess}
      busyNow={busyNow}
      msgById={msgById}
      action={action}
      onRetrySpeak={onRetrySpeak}
      onToggleReaction={onToggleReaction}
    />
  )

  return (
    <section className="dsgc-chat">
      {/* 接缝收合钮 */}
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
        <div className="dsgc-chathead-row">
          {sess ? <span className="dsgc-sess-title" title={'当前会话：' + sess.name}>{sess.name}</span> : null}
          <input
            className="dsgc-topic"
            value={topicDraft === null ? (sess ? sess.topic : '') : topicDraft}
            placeholder="设置本会话主题（可选）…"
            onChange={(e) => { setTopicDraft(e.target.value) }}
            onBlur={commitTopic}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
          />
          <P.Button variant="ghost" size="sm" className="dsgc-clearbtn" title="清空当前会话的消息记录" onClick={() => { if (sess) setConfirmClear(true) }}>
            清空
          </P.Button>
        </div>
      </div>
      
      <div className="dsgc-msgs" ref={scrollRef} onScroll={onMsgsScroll}>
        {sess && sess.messageIds.length > 0
          ? bubbles
          : (
            <div className="dsgc-empty">
              {Icon(P.IconSparkle16, 20)}
              <div className="dsgc-emptytitle">{sess && sess.topic ? '「' + sess.topic + '」' : '会话已就绪'}</div>
              <div className="dsgc-hint">
                {enabledRoles.length
                  ? '发送消息开始讨论；@成员 点名让其优先回应——每轮全体参与角色按顺序各发言一次，可用右下角轮数控制（1–10 轮）'
                  : '先在右侧添加角色（每个角色可绑定不同模型），再回到这里发起讨论。'}
              </div>
            </div>
            )}
      </div>
      
      {/* 多轮进度轨道：run 进行时常驻的一行临时态（步点 = 发言计划） */}
      {busyNow && snap.run.queue.length ? <RoundTrack snap={snap} /> : null}

      <Composer
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
        bubblesLength={sess?.messageIds.length || 0}
        inputRef={inputRef}
        scrollRef={scrollRef}
        setMentionIdx={setMentionIdx}
        setRounds={setRounds}
        togglePart={togglePart}
        onInputCE={onInputCE}
        onInputKeyDown={onInputKeyDown}
        onPasteCE={onPasteCE}
        onDropCE={onDropCE}
        onDragOverCE={onDragOverCE}
        insertChip={insertChip}
        insertFileChip={insertFileChip}
        sendMsg={sendMsg}
        stopRun={stopRun}
        mutate={mutate}
        setMention={setMention}
      />
    </section>
  )
}
