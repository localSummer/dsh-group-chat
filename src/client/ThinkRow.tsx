/**
 * 思考折叠行（对标宿主 ReasoningRow：折叠摘要 / 展开全文）。
 * @module dsh-group-chat/client/ThinkRow
 */

import { useState, type ReactNode } from 'react'
import { P } from './ui.ts'
import { firstLine, latestLine } from './model.ts'

export function ThinkRow(props: { text: string, running?: boolean }): ReactNode {
  const text = props.text || ''
  const running = !!props.running
  const [expanded, setExpanded] = useState(false)
  const plain = (line: string): string => line.replace(/^(\s*#{1,6}\s+|\s*[-*+]\s+|\s*>\s*)+/, '').replace(/[*`_~]/g, '').replace(/\s+/g, ' ').trim()
  const summary = plain(running ? latestLine(text) : firstLine(text))
  return (
    <div className="dsgc-think">
      <P.DisclosureRow
        rowClassName="dsgc-thinkrow"
        icon={<P.IconThinkOutline14 size={14} />}
        title="思考"
        open={expanded}
        expandable
        expandOnRowClick
        onToggle={() => { setExpanded((v) => !v) }}
        collapsedContent={text ? <span className="dsgc-thinksummary">{summary}</span> : null}
      >
        <div className="dsgc-thinkbody">{text}</div>
      </P.DisclosureRow>
    </div>
  )
}
