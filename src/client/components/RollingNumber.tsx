/**
 * 数字滚轮（RareUI Animated counter 的插件习语重写）：每位数字一列，
 * 列内 0-9 纵向数字条 translateY 滚到目标位（.15s 到达曲线）。
 * 位数增减不做专门动画（宽度由容器决定）；非法值（负/小数/NaN）纯文本兜底。
 * reduced-motion 由全局规则停用 transition（直接跳变）。
 * @module dsh-group-chat/client/RollingNumber
 */

import type { ReactNode } from 'react'

export interface RollingNumberProps {
  value: number
  className?: string
  /** 前导零补位到固定位数（对齐 RareUI padStart）：如 pad=2 时 7 → "07"。 */
  pad?: number
}

const DIGIT_STRIP: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

export function RollingNumber(props: RollingNumberProps): ReactNode {
  const { value, className, pad } = props
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    return <span className={className}>{String(value)}</span>
  }
  const chars = (pad && pad > 1 ? String(value).padStart(pad, '0') : String(value)).split('')
  return (
    <span
      className={'dsgc-roll' + (className ? ' ' + className : '')}
      role="group"
      aria-label={String(value)}
    >
      {chars.map((ch, i) => (
        <span key={chars.length - i} className="dsgc-roll-col" aria-hidden="true">
          <span className="dsgc-roll-strip" style={{ transform: 'translateY(' + (-Number(ch)) + 'em)' }}>
            {DIGIT_STRIP.map((n) => <span key={n} className="dsgc-roll-d">{n}</span>)}
          </span>
        </span>
      ))}
    </span>
  )
}
