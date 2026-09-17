/**
 * 会话流内容组件：思考折叠行、工具调用折叠行、聊天气泡。
 * 对标宿主同源渲染（MarkdownText 正文 + 思考折叠行 + CodeBlock 代码块）。
 * @module dsh-group-chat/client/components
 */

import { useState, type ReactNode } from 'react'
import { h, Icon, P } from './ui.ts'
import { firstLine, fmtTime, latestLine, MD_LABELS, roleById, type ClientSnapshot, type ToolCallView } from './model.ts'

/** 思考折叠行（对标宿主 ReasoningRow：折叠摘要 / 展开全文）。 */
export function ThinkRow(props: { text: string, running?: boolean }): ReactNode {
  const text = props.text || ''
  const running = !!props.running
  const [expanded, setExpanded] = useState(false)
  const plain = (line: string): string => line.replace(/^(\s*#{1,6}\s+|\s*[-*+]\s+|\s*>\s*)+/, '').replace(/[*`_~]/g, '').replace(/\s+/g, ' ').trim()
  const summary = plain(running ? latestLine(text) : firstLine(text))
  return h('div', { className: 'dsgc-think' },
    h(P.DisclosureRow, {
      rowClassName: 'dsgc-thinkrow',
      icon: h(P.IconThinkOutline14, { size: 14 }),
      title: '思考',
      open: expanded,
      expandable: true,
      expandOnRowClick: true,
      onToggle: () => { setExpanded((v) => !v) },
      collapsedContent: text ? h('span', { className: 'dsgc-thinksummary' }, summary) : null,
    }, h('div', { className: 'dsgc-thinkbody' }, text)))
}

/** 工具调用折叠行（对标思考折叠：摘要行 / 展开输出）。 */
const TOOL_ICONS: Record<string, string> = { read_file: 'IconBrowseOutline16', list_dir: 'IconFolderOpenOutline16', run_command: 'IconCodeOutline16' }

export function ToolRow(props: { c: ToolCallView }): ReactNode {
  const c = props.c
  const [expanded, setExpanded] = useState(false)
  let brief = ''
  try {
    brief = JSON.stringify(c.args) || ''
  } catch {
    brief = ''
  }
  if (brief.length > 40) brief = brief.slice(0, 40) + '…'
  const iconComp = (TOOL_ICONS[c.tool] || 'IconCodeOutline16') as unknown as Parameters<typeof h>[0]
  const statusText = c.status === 'ok' ? '成功' : c.status === 'denied' ? '用户拒绝' : '失败'
  const statusIcon = c.status === 'ok' ? P.IconCheckOutline14 : c.status === 'denied' ? P.IconCloseOutline16 : P.IconWarningOutline16
  const dur = c.durationMs ? (c.durationMs >= 1000 ? (c.durationMs / 1000).toFixed(1) + 's' : c.durationMs + 'ms') : ''
  return h('div', { className: 'dsgc-tool' },
    h(P.DisclosureRow, {
      rowClassName: 'dsgc-toolrow',
      icon: h(iconComp, { size: 14 }),
      title: c.tool + (brief ? ' ' + brief : ''),
      open: expanded,
      expandable: true,
      expandOnRowClick: true,
      onToggle: () => { setExpanded((v) => !v) },
      collapsedContent: h('span', { className: 'dsgc-toolsummary' },
        h(statusIcon, { size: 12, style: { verticalAlign: '-2px', marginRight: 4, color: c.status === 'ok' ? 'var(--dsw-alias-label-tertiary,inherit)' : 'var(--dsw-alias-state-error-primary,#e5484d)' } }),
        statusText + (dur ? ' · ' + dur : '')),
    }, h('div', { className: 'dsgc-toolbody' }, c.output || '（无输出）')))
}

/** 聊天消息（user / system / 角色发言）。 */
export function Bubble(props: { snap: ClientSnapshot, m: ClientSnapshot['messages'][number] }): ReactNode {
  const snap = props.snap
  const m = props.m
  const isUser = m.speaker === 'user'
  const isSys = m.speaker === 'system'
  const role = !isUser && !isSys ? roleById(snap, m.speaker) : null
  const name = isUser ? '我' : isSys ? '系统' : role ? role.name : '成员'
  if (isSys) return h('div', { className: 'dsgc-sysmsg' + (m.error ? ' err' : '') }, m.text)
  const body = isUser
    ? h('div', { className: 'dsgc-msgtext' }, m.text)
    : h('div', { className: 'dsgc-msgtext' },
        m.reasoning ? h(ThinkRow, { text: m.reasoning }) : null,
        (Array.isArray(m.toolCalls) ? m.toolCalls : []).map((c, i) => h(ToolRow, { key: 'tc' + i, c })),
        h(P.MarkdownText, { text: m.text || '（无内容）', labels: MD_LABELS }))
  return h('div', { className: 'dsgc-msg' + (isUser ? ' mine' : '') },
    h('div', { className: 'dsgc-avatar' + (isUser ? ' mine' : ''), style: isUser || !role ? undefined : { border: '2px solid ' + (role.color || '#888') } }, name.slice(0, 1)),
    h('div', { className: 'dsgc-msgbody' },
      h('div', { className: 'dsgc-msghead' },
        h('span', { className: 'dsgc-msgname' }, name),
        m.model ? h('span', { className: 'dsgc-msgmodel', title: m.model }, m.model) : null,
        m.ts ? h('span', { className: 'dsgc-msgtime' }, fmtTime(m.ts)) : null),
      body))
}

export { Icon }
