/**
 * 聊天消息气泡（user / system / 角色发言）。
 *
 * 帧稳定 memo：SSE 全量快照（~65KB × 7fps）每帧重建全部消息对象 identity，
 * 但已完成消息在 host 侧 append 后不可变——按渲染相关字段做值比较，流式
 * 期间跳过已完成消息的重渲（每帧仅 live 行与派生列表变化），避免全量
 * MarkdownText 重新解析打满主线程导致「卡死后一次性蹦出」。
 * @module dsh-group-chat/client/Bubble
 */

import { memo, type ReactNode } from 'react'
import { P } from '../lib/ui.ts'
import { classifySpeakFailure, formatSpeakFailureCopy, isSpeakFailure } from '../../core/errors.ts'
import { fmtClock, MD_LABELS, type SnapshotRole } from '../lib/model.ts'
import type { SnapshotMessage } from '../lib/model.ts'
import { ThinkRow } from './ThinkRow.tsx'
import { ToolRow } from './ToolRow.tsx'
import { FailCard } from './FailCard.tsx'
import { MsgActions } from './MsgActions.tsx'

export interface BubbleProps {
  m: SnapshotMessage
  /** 父级解析好的发言角色（user/system 消息为 null）——避免 Bubble 依赖 snap identity。 */
  role: SnapshotRole | null
  busy?: boolean
  onRetry?: (messageId: string) => void
  /** 表情回应（用户标注）经稳定回调下传；失败卡与系统通知不提供。 */
  onToggleReaction?: (messageId: string, emoji: string) => void
}

function BubbleInner({ m, role, busy, onRetry, onToggleReaction }: BubbleProps): ReactNode {
  const isUser = m.speaker === 'user'
  const isFail = isSpeakFailure(m)
  const isSys = m.speaker === 'system' && !isFail && !role
  const name = isUser ? '我' : role ? role.name : isSys ? '系统' : '成员'
  if (isSys) return <div className="dsgc-sysmsg">{m.text}</div>

  const retryTitle = !role
    ? '失败角色已不存在，无法重试'
    : !role.enabled
      ? '该角色已停用，无法重试'
      : busy
        ? '已有对话进行中，请先停止'
        : '重试该角色发言'
  const copyText = isFail ? formatSpeakFailureCopy(classifySpeakFailure(m.text)) : (m.text || '')

  return (
    <div className={'dsgc-msg' + (isUser ? ' mine' : '') + (isFail ? ' fail' : '')}>
      <div
        className={'dsgc-avatar' + (isUser ? ' mine' : '')}
        style={isUser || !role ? undefined : { border: '2px solid ' + (role.color || '#888') }}
      >
        {name.slice(0, 1)}
      </div>
      <div className="dsgc-msgbody">
        <div className="dsgc-msghead">
          <span className="dsgc-msgname">{name}</span>
          {m.model ? <span className="dsgc-msgmodel" title={m.model}>{m.model}</span> : null}
          {m.ts ? <span className="dsgc-msgtime">{fmtClock(m.ts)}</span> : null}
        </div>
        {isFail
          ? <FailCard raw={m.text} />
          : isUser
            ? <div className="dsgc-msgtext">{m.text}</div>
            : (
              <div className="dsgc-msgtext">
                {m.reasoning ? <ThinkRow text={m.reasoning} /> : null}
                {(Array.isArray(m.toolCalls) ? m.toolCalls : []).map((c, i) => <ToolRow key={'tc' + i} c={c} />)}
                <P.MarkdownText text={m.text || '（无内容）'} labels={MD_LABELS} />
              </div>
              )}
        <MsgActions
          copyText={copyText}
          always={isFail}
          onRetry={isFail && onRetry ? () => { onRetry(m.id) } : undefined}
          retryDisabled={busy || !role || !role.enabled}
          retryTitle={retryTitle}
          reactions={m.reactions}
          onToggleReaction={!isFail && onToggleReaction ? (emoji) => { onToggleReaction(m.id, emoji) } : undefined}
          durationMs={!isUser ? m.durationMs : undefined}
        />
      </div>
    </div>
  )
}

/** 渲染相关字段的值比较（消息不可变；角色仅名/色参与渲染）。 */
function bubblePropsEqual(a: BubbleProps, b: BubbleProps): boolean {
  if (a.busy !== b.busy || (a.onRetry == null) !== (b.onRetry == null) || (a.onToggleReaction == null) !== (b.onToggleReaction == null)) return false
  const x = a.m
  const y = b.m
  if (x !== y) {
    if (x.id !== y.id || x.speaker !== y.speaker || x.text !== y.text || x.reasoning !== y.reasoning || x.model !== y.model || x.error !== y.error || x.failedRoleId !== y.failedRoleId || x.ts !== y.ts || x.durationMs !== y.durationMs) return false
    const ra = Array.isArray(x.reactions) ? x.reactions.join('') : ''
    const rb = Array.isArray(y.reactions) ? y.reactions.join('') : ''
    if (ra !== rb) return false
    const ta = Array.isArray(x.toolCalls) ? x.toolCalls : []
    const tb = Array.isArray(y.toolCalls) ? y.toolCalls : []
    if (ta.length !== tb.length) return false
    for (let i = 0; i < ta.length; i++) {
      const ca = ta[i]
      const cb = tb[i]
      if (ca !== cb && (ca.tool !== cb.tool || ca.status !== cb.status || ca.output !== cb.output || ca.durationMs !== cb.durationMs || JSON.stringify(ca.args) !== JSON.stringify(cb.args))) return false
    }
  }
  const ra = a.role
  const rb = b.role
  return (ra ? ra.id + '\u0000' + ra.name + '\u0000' + (ra.color || '') + '\u0000' + (ra.enabled ? '1' : '0') : '') === (rb ? rb.id + '\u0000' + rb.name + '\u0000' + (rb.color || '') + '\u0000' + (rb.enabled ? '1' : '0') : '')
}

export const Bubble = memo(BubbleInner, bubblePropsEqual)
