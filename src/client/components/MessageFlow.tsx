/**
 * 消息流显示组件
 * @module dsh-group-chat/client/components
 */

import type { ReactNode, CSSProperties } from 'react'
import { WINDOW_SIZE } from '../../core/constraints.ts'
import { Icon, P } from '../lib/ui.ts'
import { Bubble } from './Bubble.tsx'
import { ConstraintList } from './ConstraintList.tsx'
import { SpeakerOrb, type SpeakerOrbState } from './SpeakerOrb.tsx'
import { ThinkRow } from './ThinkRow.tsx'
import { resolveFailedRole } from '../../core/errors.ts'
import { roleById, type ClientSnapshot } from '../lib/model.ts'
import { MD_LABELS } from '../lib/model.ts'

interface MessageFlowProps {
  snap: ClientSnapshot
  sess: ClientSnapshot['sessions'][number] | null
  busyNow: boolean
  msgById: Record<string, ClientSnapshot['messages'][number]>
  action: (payload: Record<string, unknown>) => Promise<unknown>
  onRetrySpeak: (messageId: string) => void
  /** 表情回应（用户标注）：经 Bubble/MsgActions 触发 toggle。 */
  onToggleReaction: (messageId: string, emoji: string) => void
}

export function MessageFlow(props: MessageFlowProps): ReactNode {
  const { snap, sess, busyNow, msgById, action, onRetrySpeak, onToggleReaction } = props

  const bubbles: ReactNode[] = []
  const replaceId = busyNow ? snap.run.replaceMessageId : null
  const replaceMsg = replaceId ? msgById[replaceId] : null
  const liveRoleId = snap.run.currentRoleId || (replaceMsg && (replaceMsg.failedRoleId || replaceMsg.speaker)) || null
  const lr = busyNow && liveRoleId ? roleById(snap, liveRoleId) : null
  const liveColor = lr ? (lr.color || '#888') : '#888'
  // 执行阶段映射：正文流出 → listening 涟漪；等待首字节/推理中 → thinking 热斑游走
  const orbState: SpeakerOrbState = snap.run.partial ? 'listening' : 'thinking'

  const live = lr
    ? (
      <div key="__live" className="dsgc-msg live">
        <div
          className="dsgc-avatar"
          style={{ border: '2px solid ' + liveColor, '--role-color': liveColor } as CSSProperties}
        >
          <SpeakerOrb state={orbState} color={liveColor} />
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
      </div>
      )
    : null

  const pc = busyNow && snap.run.pendingConfirm && sess && snap.run.sessionId === sess.id ? snap.run.pendingConfirm : null
  const confirm = pc
    ? (
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
      </div>
      )
    : null

  let livePlaced = false

  if (sess) {
    // 循环不变量：本群角色表只过滤一次（流式期间每帧执行的热路径）
    const groupRoles = snap.roles.filter((r) => r.groupId === sess.groupId)
    const ids = sess.messageIds
    const memo = sess.constraints && sess.constraints.length
      ? <ConstraintList key={sess.id + '-constraints'} items={sess.constraints} />
      : null
    // 折点 = 最近 WINDOW_SIZE 条之前。消息都还在窗口内时卡放流顶。
    const foldAt = memo && ids.length > WINDOW_SIZE ? ids.length - WINDOW_SIZE : 0
    if (memo && foldAt === 0) bubbles.push(memo)
    for (let i = 0; i < ids.length; i++) {
      if (memo && foldAt > 0 && i === foldAt) bubbles.push(memo)
      const m = msgById[ids[i]]
      if (!m) continue
      // 角色在父级解析：Bubble 按值 memo（不依赖 snap identity），流式帧
      // 不再触发已完成消息的全量重渲（每帧仅 live 行与派生列表变化）
      const role = resolveFailedRole(m, groupRoles) || (m.speaker !== 'user' && m.speaker !== 'system' ? roleById(snap, m.speaker) : null)
      // 原地重试：该槽位换成 live（确认卡紧随其后），不要钉在列表末尾
      if (replaceId && m.id === replaceId) {
        if (live) bubbles.push(live)
        if (confirm) bubbles.push(confirm)
        livePlaced = true
        continue
      }
      bubbles.push(<Bubble key={m.id} m={m} role={role} busy={!!snap.run.running} onRetry={onRetrySpeak} onToggleReaction={onToggleReaction} />)
    }
  }

  if (live && !livePlaced) bubbles.push(live)
  if (confirm && !livePlaced) bubbles.push(confirm)

  return <>{bubbles}</>
}
