/**
 * 会话流折点处：只读结论备忘卡（超过 4 条默认露 3 条）。
 * @module dsh-group-chat/client/components
 */

import { useState, type ReactNode } from 'react'
import type { SessionConstraint } from '../../core/types.ts'
import { KIND_LABEL } from '../../core/constraints.ts'
import { ClipWell, Fold } from './Fold.tsx'
import { RollingNumber } from './RollingNumber.tsx'

interface ConstraintListProps {
  items: SessionConstraint[]
}

function ConstraintRow(props: { item: SessionConstraint }): ReactNode {
  const { item } = props
  return (
    <div className="dsgc-constraint">
      <span className={'dsgc-ckind ' + item.kind}>{KIND_LABEL[item.kind]}</span>
      <span className="dsgc-ctext">{item.text}</span>
    </div>
  )
}

export function ConstraintList(props: ConstraintListProps): ReactNode {
  const { items } = props
  const [open, setOpen] = useState(false)
  if (!items.length) return null
  const overflow = items.length > 4
  const head = overflow ? items.slice(0, 3) : items
  const extra = overflow ? items.slice(3) : []
  const rest = items.length - 3

  return (
    <section className="dsgc-constraints" aria-labelledby="dsgc-constraints-title">
      <div className="dsgc-chead">
        <h2 id="dsgc-constraints-title" className="dsgc-ctitle">结论备忘</h2>
        <p className="dsgc-cdesc">窗口外消息折成的已定 / 否决 / 未决，供后续角色接着用。</p>
      </div>
      <ClipWell maxHeight={160} className="dsgc-clist" watch={open}>
        {head.map((c, i) => <ConstraintRow key={i} item={c} />)}
        {overflow
          ? (
            <Fold open={open}>
              {extra.map((c, i) => <ConstraintRow key={i + 3} item={c} />)}
            </Fold>
            )
          : null}
      </ClipWell>
      {overflow
        ? (
          <button
            type="button"
            className="dsgc-cmore"
            onClick={() => { setOpen(!open) }}
            aria-expanded={open}
          >
            {open ? '收起' : <>还有 <RollingNumber value={rest} /> 条约束</>}
          </button>
          )
        : null}
    </section>
  )
}
