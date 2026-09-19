/**
 * 会话内折叠：高度 0fr→1fr + 溢出滚动遮罩。思考 / 工具 / 失败原文 / 结论备忘共用。
 * @module dsh-group-chat/client/components
 */

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

interface FoldProps {
  open: boolean
  children: ReactNode
  className?: string
}

export function Fold(props: FoldProps): ReactNode {
  const { open, children, className } = props
  return (
    <div className={'dsgc-fold' + (open ? ' open' : '') + (className ? ' ' + className : '')}>
      <div className="dsgc-fold-inner">{children}</div>
    </div>
  )
}

interface ClipWellProps {
  children: ReactNode
  maxHeight: number
  className?: string
  watch?: unknown
}

export function ClipWell(props: ClipWellProps): ReactNode {
  const { children, maxHeight, className, watch } = props
  const [clip, setClip] = useState({ up: false, down: false })
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = (): void => {
      if (el.clientHeight < 2) {
        setClip((cur) => cur.up || cur.down ? { up: false, down: false } : cur)
        return
      }
      const max = el.scrollHeight - el.clientHeight
      const up = el.scrollTop > 1
      const down = max > 1 && el.scrollTop < max - 1
      setClip((cur) => cur.up === up && cur.down === down ? cur : { up, down })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    for (const child of el.children) ro.observe(child)
    el.addEventListener('scroll', measure, { passive: true })
    el.addEventListener('transitionend', measure)
    return () => {
      ro.disconnect()
      el.removeEventListener('scroll', measure)
      el.removeEventListener('transitionend', measure)
    }
  }, [watch])

  return (
    <div className={'dsgc-clip' + (clip.up ? ' can-up' : '') + (clip.down ? ' can-down' : '')}>
      <div
        className={'dsgc-clip-scroll' + (className ? ' ' + className : '')}
        ref={ref}
        style={{ maxHeight } as CSSProperties}
      >
        {children}
      </div>
    </div>
  )
}
