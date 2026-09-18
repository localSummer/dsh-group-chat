/**
 * 聊天消息气泡（user / system / 角色发言）。
 * @module dsh-group-chat/client/Bubble
 */

import type { ReactNode } from 'react'
import { P } from '../lib/ui.ts'
import { fmtTime, MD_LABELS, roleById, type ClientSnapshot } from '../lib/model.ts'
import { ThinkRow } from './ThinkRow.tsx'
import { ToolRow } from './ToolRow.tsx'

export function Bubble(props: { snap: ClientSnapshot, m: ClientSnapshot['messages'][number] }): ReactNode {
  const { snap, m } = props
  const isUser = m.speaker === 'user'
  const isSys = m.speaker === 'system'
  const role = !isUser && !isSys ? roleById(snap, m.speaker) : null
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
