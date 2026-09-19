/**
 * 工具调用折叠行（对标思考折叠：摘要行 / 展开输出）。
 * @module dsh-group-chat/client/ToolRow
 */

import { useState, type ReactNode } from 'react'
import { Icon, P, pickPrimitive } from '../lib/ui.ts'
import type { ToolCallView } from '../lib/model.ts'
import { ClipWell, Fold } from './Fold.tsx'

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
  const IconOf = pickPrimitive(TOOL_ICONS[c.tool] || 'IconCodeOutline16')
  const statusText = c.status === 'ok' ? '成功' : c.status === 'denied' ? '用户拒绝' : '失败'
  const StatusIcon = c.status === 'ok' ? P.IconCheckOutline14 : c.status === 'denied' ? P.IconCloseOutline16 : P.IconWarningOutline16
  const dur = c.durationMs ? (c.durationMs >= 1000 ? (c.durationMs / 1000).toFixed(1) + 's' : c.durationMs + 'ms') : ''
  return (
    <div className="dsgc-tool">
      <P.DisclosureRow
        rowClassName="dsgc-toolrow"
        icon={<IconOf size={14} />}
        title={c.tool + (brief ? ' ' + brief : '')}
        open={expanded}
        expandable
        expandOnRowClick
        onToggle={() => { setExpanded((v) => !v) }}
        collapsedContent={
          <span className="dsgc-toolsummary">
            {Icon(StatusIcon, 12, {
              verticalAlign: '-2px',
              marginRight: 4,
              color: c.status === 'ok' ? 'var(--dsw-alias-label-tertiary,inherit)' : 'var(--dsw-alias-state-error-primary,#e5484d)',
            })}
            {statusText + (dur ? ' · ' + dur : '')}
          </span>
        }
      />
      <Fold open={expanded}>
        <ClipWell maxHeight={260} watch={c.output}>
          <div className="dsgc-toolbody">{c.output || '（无输出）'}</div>
        </ClipWell>
      </Fold>
    </div>
  )
}
