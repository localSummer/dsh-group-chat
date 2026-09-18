/**
 * 消息流显示组件
 * @module dsh-group-chat/client/components
 */

import type { ReactNode, CSSProperties } from 'react'
import { Icon, P } from '../lib/ui.ts'
import { Bubble } from './Bubble.tsx'
import { ThinkRow } from './ThinkRow.tsx'
import { roleById, type ClientSnapshot } from '../lib/model.ts'
import { MD_LABELS } from '../lib/model.ts'

interface MessageFlowProps {
  snap: ClientSnapshot
  sess: ClientSnapshot['sessions'][number] | null
  busyNow: boolean
  msgById: Record<string, ClientSnapshot['messages'][number]>
  action: (payload: Record<string, unknown>) => Promise<unknown>
}

export function MessageFlow(props: MessageFlowProps): ReactNode {
  const { snap, sess, busyNow, msgById, action } = props

  const bubbles: ReactNode[] = []
  
  if (sess) {
    for (const mid of sess.messageIds) {
      const m = msgById[mid]
      if (!m) continue
      // 角色在父级解析：Bubble 按值 memo（不依赖 snap identity），流式帧
      // 不再触发已完成消息的全量重渲（每帧仅 live 行与派生列表变化）
      const role = m.speaker !== 'user' && m.speaker !== 'system' ? roleById(snap, m.speaker) : null
      bubbles.push(<Bubble key={m.id} m={m} role={role} />)
    }
  }
  
  // 流式尾巴
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
              <span className="dsgc-msgtime dsgc-typing">深度求索...</span>
            </div>
            <div className="dsgc-msgtext live">
              {snap.run.partialReasoning ? <ThinkRow text={snap.run.partialReasoning} running /> : null}
              {snap.run.partial ? <P.MarkdownText text={snap.run.partial} streaming labels={MD_LABELS} /> : null}
              {/* 首 delta 前的「思考中」占位（深度思考模型首字节可能等数秒到数十秒，
                  空白气泡会被感知为卡死）；delta 到达后被真实思考行/正文自然替换 */}
              {!snap.run.partial && !snap.run.partialReasoning
                ? (
                  <div className="dsgc-pending">
                    {Icon(P.IconThinkOutline14, 14)}
                    <span>思考中</span>
                    <span className="dsgc-pendingdots" aria-hidden="true"><i /><i /><i /></span>
                  </div>
                )
                : null}
            </div>
          </div>
        </div>,
      )
    }
  }
  
  // 命令确认卡片
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

  return <>{bubbles}</>
}
