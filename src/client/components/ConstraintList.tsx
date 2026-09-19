/**
 * 会话头第二行：只读约束备忘（超过 4 条默认露 3 条）。
 * @module dsh-group-chat/client/components
 */

import { useState, type ReactNode } from 'react'
import type { SessionConstraint } from '../../core/types.ts'

const KIND_LABEL: Record<SessionConstraint['kind'], string> = {
  decided: '已定',
  rejected: '否决',
  open: '未决',
}

interface ConstraintListProps {
  items: SessionConstraint[]
}

export function ConstraintList(props: ConstraintListProps): ReactNode {
  const { items } = props
  const [open, setOpen] = useState(false)
  if (!items.length) return null
  const overflow = items.length > 4
  const shown = overflow && !open ? items.slice(0, 3) : items
  const rest = items.length - 3
  return (
    <div className="dsgc-constraints" aria-label="本会话已确认约束">
      {shown.map((c, i) => (
        <div key={i} className="dsgc-constraint">
          <span className={'dsgc-ckind ' + c.kind}>{KIND_LABEL[c.kind]}</span>
          <span className="dsgc-ctext">{c.text}</span>
        </div>
      ))}
      {overflow
        ? (
          <button
            type="button"
            className="dsgc-cmore"
            onClick={() => { setOpen(!open) }}
            aria-expanded={open}
          >
            {open ? '收起' : '还有 ' + rest + ' 条约束'}
          </button>
          )
        : null}
    </div>
  )
}
