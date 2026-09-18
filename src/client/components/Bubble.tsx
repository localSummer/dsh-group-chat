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
import { fmtTime, MD_LABELS, type ClientSnapshot, type SnapshotRole } from '../lib/model.ts'
import { ThinkRow } from './ThinkRow.tsx'
import { ToolRow } from './ToolRow.tsx'

export interface BubbleProps {
  m: ClientSnapshot['messages'][number]
  /** 父级解析好的发言角色（user/system 消息为 null）——避免 Bubble 依赖 snap identity。 */
  role: SnapshotRole | null
}

function BubbleInner({ m, role }: BubbleProps): ReactNode {
  const isUser = m.speaker === 'user'
  const isSys = m.speaker === 'system'
  const name = isUser ? '我' : isSys ? '系统' : role ? role.name : '成员'
  if (isSys) return <div className={'dsgc-sysmsg' + (m.error ? ' err' : '')}>{m.text}</div>
  return (
    <div className={'dsgc-msg' + (isUser ? ' mine' : '')}>
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
          {m.ts ? <span className="dsgc-msgtime">{fmtTime(m.ts)}</span> : null}
        </div>
        {isUser
          ? <div className="dsgc-msgtext">{m.text}</div>
          : (
            <div className="dsgc-msgtext">
              {m.reasoning ? <ThinkRow text={m.reasoning} /> : null}
              {(Array.isArray(m.toolCalls) ? m.toolCalls : []).map((c, i) => <ToolRow key={'tc' + i} c={c} />)}
              <P.MarkdownText text={m.text || '（无内容）'} labels={MD_LABELS} />
            </div>
            )}
      </div>
    </div>
  )
}

/** 渲染相关字段的值比较（消息不可变；角色仅名/色参与渲染）。 */
function bubblePropsEqual(a: BubbleProps, b: BubbleProps): boolean {
  const x = a.m
  const y = b.m
  if (x !== y) {
    if (x.id !== y.id || x.speaker !== y.speaker || x.text !== y.text || x.reasoning !== y.reasoning || x.model !== y.model || x.error !== y.error || x.ts !== y.ts) return false
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
  return (ra ? ra.name + '\u0000' + (ra.color || '') : '') === (rb ? rb.name + '\u0000' + (rb.color || '') : '')
}

export const Bubble = memo(BubbleInner, bubblePropsEqual)
