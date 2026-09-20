/**
 * 原地确认删除按钮（RareUI Delete button 的插件习语重写）：点击垃圾桶掀盖，
 * 侧滑出「✓ 确认 / ✗ 取消」微面板；✓ 才执行删除，✗ / Esc / 点击外部收起。
 * 入场 .16s 到达曲线、退场 .12s ease-in（max-width + opacity 纯 CSS 双向动画，
 * 收起后经 visibility 延迟切断键盘焦点）；reduced-motion 由全局规则停用。
 * @module dsh-group-chat/client/ConfirmDelete
 */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon, P } from '../lib/ui.ts'

export interface ConfirmDeleteProps {
  /** 基础态 aria/title 文案（如「删除会话」）。 */
  label: string
  /** 确认态 ✓ 的 aria/title 文案。 */
  confirmLabel?: string
  onConfirm: () => void
}

/** 自绘垃圾桶（盖子独立分组，armed 态掀盖旋转；描边风格对齐宿主 Icon*Outline）。 */
function TrashGlyph(): ReactNode {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <g className="dsgc-cdel-lid">
        <path d="M2.4 4.4H13.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M6.4 4.4V3.1C6.4 2.77 6.67 2.5 7 2.5H9C9.33 2.5 9.6 2.77 9.6 3.1V4.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </g>
      <path d="M4 4.4V13C4 13.33 4.27 13.6 4.6 13.6H11.4C11.73 13.6 12 13.33 12 13V4.4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M6.6 7V11M9.4 7V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function ConfirmDelete(props: ConfirmDeleteProps): ReactNode {
  const { label, confirmLabel = '确认删除', onConfirm } = props
  const [armed, setArmed] = useState(false)
  const rootRef = useRef<HTMLSpanElement>(null)

  // armed 态才挂全局监听：Esc 收起；点击外部收起（pointerdown 先于行点击触发，
  // 兜住「确认开着又点了另一行」的竞态）
  useEffect(() => {
    if (!armed) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setArmed(false)
    }
    const onPointer = (e: PointerEvent): void => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setArmed(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [armed])

  return (
    <span ref={rootRef} className={'dsgc-cdel' + (armed ? ' armed' : '')}>
      <span className="dsgc-cdel-panel">
        <button
          type="button"
          className="dsgc-cdel-yes"
          title={confirmLabel}
          aria-label={confirmLabel}
          onClick={(e) => { e.stopPropagation(); setArmed(false); onConfirm() }}
        >
          {Icon(P.IconCheckOutline14, 14)}
        </button>
        <button
          type="button"
          className="dsgc-cdel-no"
          title="取消删除"
          aria-label="取消删除"
          onClick={(e) => { e.stopPropagation(); setArmed(false) }}
        >
          {Icon(P.IconCloseOutline16, 14)}
        </button>
      </span>
      <button
        type="button"
        className="dsgc-cdel-bin"
        title={label}
        aria-label={label}
        aria-expanded={armed}
        onClick={(e) => { e.stopPropagation(); setArmed(!armed) }}
      >
        <TrashGlyph />
      </button>
    </span>
  )
}
