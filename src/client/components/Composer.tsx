/**
 * 消息输入编辑器组件
 * @module dsh-group-chat/client/components
 */

import type { ReactNode, KeyboardEvent as ReactKeyboardEvent, ClipboardEvent as ReactClipboardEvent, DragEvent as ReactDragEvent } from 'react'
import { Icon, P } from '../lib/ui.ts'
import { PermissionSelect } from './PermissionSelect.tsx'
import { HoverTip } from './HoverTip.tsx'
import { RollingNumber } from './RollingNumber.tsx'
import { escapeRegExp, type ClientSnapshot, type SnapshotRole } from '../lib/model.ts'
import type { AtToken } from '../../shared/file-mention-grammar.ts'

/** 轮数控件 hover：宿主 Tooltip 三行说明（pre-line）。 */
const ROUNDS_HINT = '一轮 = 参与角色各说一次。\n要他们自己互相反驳、你不插话时再加轮。\n要边看边插话，就留 1，再点发送。'

interface ComposerProps {
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
  bubblesLength: number
  inputRef: React.RefObject<HTMLDivElement>
  scrollRef: React.RefObject<HTMLDivElement>
  setMentionIdx: (val: number) => void
  setRounds: (val: number) => void
  togglePart: (rid: string) => void
  onInputCE: () => void
  onInputKeyDown: (e: ReactKeyboardEvent<HTMLDivElement>) => void
  onPasteCE: (e: ReactClipboardEvent<HTMLDivElement>) => void
  onDropCE: (e: ReactDragEvent<HTMLDivElement>) => void
  onDragOverCE: (e: ReactDragEvent<HTMLDivElement>) => void
  insertChip: (role: SnapshotRole) => void
  insertFileChip: (path: string, kind: 'file' | 'directory') => void
  sendMsg: () => Promise<void>
  stopRun: () => Promise<void>
  mutate: (args: Record<string, unknown>) => Promise<unknown>
  setMention: (val: AtToken | null) => void
}

export function Composer(props: ComposerProps): ReactNode {
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
    bubblesLength,
    inputRef,
    scrollRef,
    setMentionIdx,
    setRounds,
    togglePart,
    onInputCE,
    onInputKeyDown,
    onPasteCE,
    onDropCE,
    onDragOverCE,
    insertChip,
    insertFileChip,
    sendMsg,
    stopRun,
    mutate,
    setMention,
  } = props

  return (
    <div className="dsgc-composer">
      {!atBottom && bubblesLength
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
        <div className="dsgc-partlist">
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
      </div>
      <div className="dsgc-card">
        <div className="dsgc-mentionwrap">
          {mention !== null && mention.query === '' && mentionCandidates.length > 0
            ? (
              <div className="dsgc-mention" role="listbox">
                {mentionCandidates.map((r, i) => (
                  <button
                    key={r.id}
                    type="button"
                    className={'dsgc-mentionitem' + (i === mentionIdxC ? ' on' : '')}
                    role="option"
                    aria-selected={i === mentionIdxC ? 'true' : 'false'}
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
            : mention !== null && mention.query !== ''
              ? (
                <div className="dsgc-mention dsgc-mention-file" role="listbox">
                  {fileCandidates.length
                    ? fileCandidates.map((item, i) => (
                      <button
                        key={item.path}
                        type="button"
                        className={'dsgc-mentionitem' + (i === mentionIdxC ? ' on' : '')}
                        role="option"
                        aria-selected={i === mentionIdxC ? 'true' : 'false'}
                        onMouseDown={(e) => { e.preventDefault() }}
                        onClick={() => {
                          insertFileChip(item.path, item.isDir ? 'directory' : 'file')
                        }}
                        onMouseEnter={() => setMentionIdx(i)}
                      >
                        <span className={'dsgc-fileglyph' + (item.isDir ? ' dir' : ' file')} aria-hidden="true">
                          {item.isDir
                            ? <P.FileTypeIcon kind="folder" size={16} />
                            : <P.FileTypeIcon path={item.path} size={16} />}
                        </span>
                        <span className="dsgc-mentionname">{item.path}</span>
                        {item.isDir ? <span className="dsgc-filedrill">{Icon(P.IconChevronRightOutline14, 12)}</span> : null}
                      </button>
                    ))
                    : fileSearchLoading
                      ? <div className="dsgc-mentionitem dsgc-hint">检索中…</div>
                      : fileSearchError
                        ? <div className="dsgc-mentionitem dsgc-hint">{fileSearchError}</div>
                        : <div className="dsgc-mentionitem dsgc-hint">无匹配文件</div>}
                  <span className="dsgc-mentionhint">
                    {fileSearchLoading && fileCandidates.length
                      ? '检索中…'
                      : fileCandidates.some((f) => f.isDir)
                        ? '↑↓ 选择 · Enter 插入 · Tab 进入目录 · Esc 关闭'
                        : '↑↓ 选择 · Enter 插入 · Esc 关闭'}
                  </span>
                </div>
                )
              : null}
          {!input.trim()
            ? <div className="dsgc-ph" aria-hidden="true">发消息给全群，@成员 点名让其回应…</div>
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
            onBlur={() => { setMention(null) }}
          />
        </div>
        <div className="dsgc-sendrow">
          <PermissionSelect
            tier={group.permissionTier}
            onSelect={(tier) => { mutate({ op: 'setPermissionTier', groupId: group.id, tier }) }}
          />
          <span style={{ flex: 1 }} />
          <HoverTip label={ROUNDS_HINT} side="top" delayMs={500} maxWidth={280} className="dsgc-rounds">
            <button type="button" className="dsgc-roundbtn" aria-label="减少轮数" disabled={rounds <= 1} onClick={() => { setRounds(Math.max(1, rounds - 1)) }}>
              {Icon(P.IconChevronLeftOutline14, 12)}
            </button>
            <span className="dsgc-roundnum"><RollingNumber value={rounds} /></span>
            <button type="button" className="dsgc-roundbtn" aria-label="增加轮数" disabled={rounds >= 10} onClick={() => { setRounds(Math.min(10, rounds + 1)) }}>
              {Icon(P.IconChevronRightOutline14, 12)}
            </button>
            <span style={{ padding: '0 6px 0 2px' }}>轮</span>
          </HoverTip>
          {busyNow
            ? (
              <P.Button variant="outline" className="dsgc-stopbtn" onClick={() => { stopRun() }}>
                {Icon(P.IconStopFill16, 16)}停止
              </P.Button>
              )
            : (
              <P.Button variant="primary" onClick={() => { sendMsg() }} disabled={!input.trim() || (!participants.length && !mentionedRoles.length) || !sess}>
                {Icon(P.IconSendOutline16, 16)}发送
              </P.Button>
              )}
        </div>
      </div>
    </div>
  )
}
