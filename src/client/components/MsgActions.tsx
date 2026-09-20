/**
 * 消息操作条：贴在气泡外下方。用户/角色消息悬停出「复制」与「回应」；
 * 失败卡常驻「复制 / 重试」。回应 = RareUI Emoji reaction 的插件习语重写：
 * 触发钮弹出 ReactionPicker，选中后 5 份 emoji 副本从触发钮上浮飘散
 * （reduced-motion 直接跳过）；已回应以胶囊常驻展示，点击胶囊取消。
 * @module dsh-group-chat/client/MsgActions
 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Icon, P } from '../lib/ui.ts'
import { ReactionPicker } from './ReactionPicker.tsx'

export interface MsgActionsProps {
  copyText: string
  onRetry?: () => void
  retryDisabled?: boolean
  retryTitle?: string
  /** 失败卡：不依赖悬停，始终可见。 */
  always?: boolean
  /** 消息已有的表情回应集合（用户标注）。 */
  reactions?: string[]
  /** 提供时渲染回应触发钮与胶囊（失败卡与系统通知不提供）。 */
  onToggleReaction?: (emoji: string) => void
}

/** 微笑触发图标（描边风格对齐宿主 Icon*Outline；原语无表情类图标的内联回退）。 */
function SmileGlyph(): ReactNode {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="5.7" cy="6.6" r="0.85" fill="currentColor" />
      <circle cx="10.3" cy="6.6" r="0.85" fill="currentColor" />
      <path d="M5.2 9.6C5.8 10.7 6.8 11.3 8 11.3C9.2 11.3 10.2 10.7 10.8 9.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

interface Fly {
  key: number
  emoji: string
  dx: number
  fly: number
  dur: number
  delay: number
}

let flySeq = 0

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch { /* fall through */ }
  try {
    const el = document.createElement('textarea')
    el.value = text
    el.setAttribute('readonly', '')
    el.style.position = 'fixed'
    el.style.left = '-9999px'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  } catch {
    return false
  }
}

export function MsgActions(props: MsgActionsProps): ReactNode {
  const { copyText, onRetry, retryDisabled, retryTitle, always, reactions, onToggleReaction } = props
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (copiedTimer.current) clearTimeout(copiedTimer.current) }, [])
  const [pickerOpen, setPickerOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [flies, setFlies] = useState<Fly[]>([])

  const copy = async (): Promise<void> => {
    if (!copyText) return
    const ok = await writeClipboard(copyText)
    if (!ok) return
    setCopied(true)
    if (copiedTimer.current) clearTimeout(copiedTimer.current)
    copiedTimer.current = setTimeout(() => { setCopied(false) }, 1400)
  }

  // 新增回应时触发漂浮副本（取消回应不飘）；reduced-motion 直接跳过
  const spawnFlies = (emoji: string): void => {
    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const batch: Fly[] = []
    for (let i = 0; i < 5; i++) {
      batch.push({
        key: ++flySeq,
        emoji,
        dx: Math.round((Math.random() - 0.5) * 36),
        fly: -(44 + Math.round(Math.random() * 24)),
        dur: 0.5 + Math.random() * 0.2,
        delay: i * 40,
      })
    }
    setFlies((f) => f.concat(batch))
  }
  const flyDone = (key: number): void => { setFlies((f) => f.filter((x) => x.key !== key)) }

  const pick = (emoji: string): void => {
    setPickerOpen(false)
    if (!onToggleReaction) return
    if (!(reactions || []).includes(emoji)) spawnFlies(emoji)
    onToggleReaction(emoji)
  }

  return (
    <div className={'dsgc-msgops' + (always ? ' always' : '')} role="group" aria-label="消息操作">
      {/* 已回应胶囊：常驻展示，点击取消 */}
      {onToggleReaction
        ? (reactions || []).map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="dsgc-repill"
            title="点击取消回应"
            aria-label={'取消回应 ' + emoji}
            onClick={(e) => { e.stopPropagation(); onToggleReaction(emoji) }}
          >
            {emoji}
          </button>
        ))
        : null}
      {onToggleReaction
        ? (
          <span className="dsgc-rewrap">
            <button
              ref={triggerRef}
              type="button"
              className="dsgc-msgop react"
              title="添加表情回应"
              aria-label="添加表情回应"
              aria-haspopup="listbox"
              aria-expanded={pickerOpen}
              onClick={(e) => { e.stopPropagation(); setPickerOpen((v) => !v) }}
            >
              <SmileGlyph />
            </button>
            {flies.map((f) => (
              <span
                key={f.key}
                className="dsgc-refly"
                style={{ '--dx': f.dx + 'px', '--fly': f.fly + 'px', '--dur': f.dur + 's', animationDelay: f.delay + 'ms' } as CSSProperties}
                onAnimationEnd={() => { flyDone(f.key) }}
              >
                {f.emoji}
              </span>
            ))}
            {pickerOpen && triggerRef.current
              ? (
                <ReactionPicker
                  anchor={triggerRef.current}
                  reactions={reactions || []}
                  onPick={pick}
                  onClose={() => { setPickerOpen(false) }}
                />
              )
              : null}
          </span>
          )
        : null}
      <button
        type="button"
        className={'dsgc-msgop' + (copied ? ' done' : '')}
        title={copied ? '已复制' : '复制'}
        aria-label={copied ? '已复制' : '复制'}
        onClick={(e) => { e.stopPropagation(); void copy() }}
      >
        {Icon(copied ? P.IconCheckOutline14 : P.IconCopyOutline16, 14)}
        <span>{copied ? '已复制' : '复制'}</span>
      </button>
      {onRetry
        ? (
          <button
            type="button"
            className="dsgc-msgop retry"
            title={retryTitle || '重试'}
            aria-label={retryTitle || '重试'}
            disabled={retryDisabled}
            onClick={(e) => { e.stopPropagation(); if (!retryDisabled) onRetry() }}
          >
            {Icon(P.IconRefreshOutline14, 14)}
            <span>重试</span>
          </button>
          )
        : null}
    </div>
  )
}
