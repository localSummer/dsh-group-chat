/**
 * 表情回应选择浮层（RareUI Emoji reaction 的插件习语重写）：portal 到
 * document.body（躲开 `.dsgc-root` 的 container-type 把 position:fixed 按容器
 * 定位），按触发钮 rect 固定定位、向上弹出（空间不足向下翻转）。
 * 6 个 Unicode emoji 候选（文本渲染，不引入图片资产）；键盘 ←→ 移动、
 * Enter/空格 选、Esc 关；已回应的候选高亮、再点为取消。出现 .16s + 4px 位移。
 * @module dsh-group-chat/client/ReactionPicker
 */

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { REACTION_EMOJIS } from '../../core/types.ts'

export interface ReactionPickerProps {
  /** 触发钮（锚定元素）。 */
  anchor: HTMLElement
  /** 该消息已有的回应集合（高亮 + 再点取消）。 */
  reactions: string[]
  /** 选中候选（重复点击同 emoji = 取消）。 */
  onPick: (emoji: string) => void
  onClose: () => void
}

export function ReactionPicker(props: ReactionPickerProps): ReactNode {
  const { anchor, reactions, onPick, onClose } = props
  const layerRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<{ left: number, top: number } | null>(null)
  const [idx, setIdx] = useState(0)

  // 定位：锚上方 6px，视口放不下翻到下方；左对齐后做视口水平夹取
  useLayoutEffect(() => {
    const r = anchor.getBoundingClientRect()
    const fit = (): void => {
      const el = layerRef.current
      if (!el) return
      const h = el.offsetHeight
      const w = el.offsetWidth
      const top = r.top - 6 - h >= 8 ? r.top - 6 - h : r.bottom + 6
      let left = r.left
      if (left + w > window.innerWidth - 8) left = window.innerWidth - 8 - w
      if (left < 8) left = 8
      setBox({ left, top })
    }
    fit()
  }, [anchor])

  // 挂载即聚焦（键盘可达；同时避免 Enter 落回触发钮自身）
  useEffect(() => { layerRef.current?.focus() }, [])

  // 键盘与外点：Esc 关、←→ 移动、Enter/空格 选；点击浮层与锚之外关闭
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
        const d = e.key === 'ArrowLeft' ? -1 : 1
        setIdx((i) => (i + d + REACTION_EMOJIS.length) % REACTION_EMOJIS.length)
        return
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onPick(REACTION_EMOJIS[idx])
      }
    }
    const onPointer = (e: PointerEvent): void => {
      if (layerRef.current && !layerRef.current.contains(e.target as Node) && !anchor.contains(e.target as Node)) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [anchor, idx, onClose, onPick])

  return createPortal(
    <div
      ref={layerRef}
      className="dsgc-repick"
      role="listbox"
      aria-label="选择回应表情"
      tabIndex={-1}
      style={{ left: box ? box.left : -9999, top: box ? box.top : -9999 }}
    >
      {REACTION_EMOJIS.map((emoji, i) => (
        <button
          key={emoji}
          type="button"
          className={'dsgc-repickitem' + (i === idx ? ' on' : '') + (reactions.includes(emoji) ? ' has' : '')}
          role="option"
          aria-selected={i === idx ? 'true' : 'false'}
          title={reactions.includes(emoji) ? '取消回应 ' + emoji : '回应 ' + emoji}
          onMouseEnter={() => { setIdx(i) }}
          onClick={(e) => { e.stopPropagation(); onPick(emoji) }}
        >
          {emoji}
        </button>
      ))}
    </div>,
    document.body,
  )
}
