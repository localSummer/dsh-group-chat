/**
 * 对齐宿主 Tooltip 的 hover 气泡：portal 到 document.body，躲开
 * `.dsgc-root` 的 container-type 把 position:fixed 按容器定位。
 * @module dsh-group-chat/client/components
 */

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export type HoverTipSide = 'top' | 'right'

interface HoverTipProps {
  label: string
  side?: HoverTipSide
  delayMs?: number
  maxWidth?: number
  className?: string
  children: ReactNode
}

interface AnchorBox {
  x: number
  top: number
  bottom: number
}

/**
 * @param props.label 气泡正文（pre-line）
 * @param props.side 默认 right（对齐侧栏会话行）；composer 轮数用 top
 * @param props.delayMs hover 延迟，默认 500；键盘 focus 立即出
 */
export function HoverTip(props: HoverTipProps): ReactNode {
  const { label, side = 'right', delayMs = 500, maxWidth, className, children } = props
  const anchorRef = useRef<HTMLDivElement>(null)
  const bubbleRef = useRef<HTMLSpanElement>(null)
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hover = useRef(false)
  const [pos, setPos] = useState<AnchorBox | null>(null)
  const [placement, setPlacement] = useState<'top' | 'bottom' | 'right'>(side)

  const cancel = (): void => {
    if (showTimer.current === null) return
    clearTimeout(showTimer.current)
    showTimer.current = null
  }
  const show = (): void => {
    const el = anchorRef.current
    if (!el || !label) return
    const r = el.getBoundingClientRect()
    setPlacement(side)
    setPos({
      x: side === 'right' ? r.right + 10 : r.left + r.width / 2,
      top: r.top,
      bottom: r.bottom,
    })
  }
  const hideIfIdle = (): void => {
    if (!hover.current && !(anchorRef.current && anchorRef.current.contains(document.activeElement))) setPos(null)
  }

  useEffect(() => cancel, [])
  useLayoutEffect(() => {
    if (!pos) return
    const fit = (): void => {
      const el = bubbleRef.current
      if (!el) return
      el.style.left = pos.x + 'px'
      const r = el.getBoundingClientRect()
      let dx = 0
      if (r.right > window.innerWidth - 12) dx = window.innerWidth - 12 - r.right
      if (r.left + dx < 12) dx = 12 - r.left
      el.style.left = pos.x + dx + 'px'
      if (side === 'right') return
      const fitsBelow = pos.bottom + 8 + r.height <= window.innerHeight - 12
      const fitsAbove = pos.top - 8 - r.height >= 12
      if (placement === 'bottom' && !fitsBelow && fitsAbove) setPlacement('top')
      if (placement === 'top' && !fitsAbove && fitsBelow) setPlacement('bottom')
    }
    fit()
    window.addEventListener('resize', fit)
    return () => { window.removeEventListener('resize', fit) }
  }, [pos, placement, label, side])

  const y = pos === null
    ? 0
    : placement === 'right'
      ? pos.top + (pos.bottom - pos.top) / 2
      : placement === 'top'
        ? pos.top - 8
        : pos.bottom + 8

  return (
    <>
      <div
        ref={anchorRef}
        className={className}
        onMouseEnter={() => {
          hover.current = true
          cancel()
          if (delayMs <= 0) { show(); return }
          showTimer.current = setTimeout(() => { showTimer.current = null; show() }, delayMs)
        }}
        onMouseLeave={() => {
          hover.current = false
          cancel()
          hideIfIdle()
        }}
        onFocus={() => { cancel(); show() }}
        onBlur={(e) => {
          const next = e.relatedTarget as Node | null
          if (next && anchorRef.current && anchorRef.current.contains(next)) return
          cancel()
          hideIfIdle()
        }}
      >
        {children}
      </div>
      {pos
        ? createPortal(
          <span
            ref={bubbleRef}
            className="dsgc-hovertip"
            data-side={placement}
            role="tooltip"
            style={{ left: pos.x, top: y, ...(maxWidth ? { maxWidth } : {}) }}
          >
            {label}
          </span>,
          document.body,
        )
        : null}
    </>
  )
}
