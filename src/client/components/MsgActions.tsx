/**
 * 消息操作条：贴在气泡外下方。用户/角色消息悬停出「复制」；失败卡常驻「复制 / 重试」。
 * @module dsh-group-chat/client/MsgActions
 */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon, P } from '../lib/ui.ts'

export interface MsgActionsProps {
  copyText: string
  onRetry?: () => void
  retryDisabled?: boolean
  retryTitle?: string
  /** 失败卡：不依赖悬停，始终可见。 */
  always?: boolean
}

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
  const { copyText, onRetry, retryDisabled, retryTitle, always } = props
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (copiedTimer.current) clearTimeout(copiedTimer.current) }, [])

  const copy = async (): Promise<void> => {
    if (!copyText) return
    const ok = await writeClipboard(copyText)
    if (!ok) return
    setCopied(true)
    if (copiedTimer.current) clearTimeout(copiedTimer.current)
    copiedTimer.current = setTimeout(() => { setCopied(false) }, 1400)
  }

  return (
    <div className={'dsgc-msgops' + (always ? ' always' : '')} role="group" aria-label="消息操作">
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
