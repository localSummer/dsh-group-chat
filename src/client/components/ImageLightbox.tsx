/**
 * 面板内看图：盖住群聊三区，不新开标签，也不用确认弹窗。
 * @module dsh-group-chat/client/components
 */

import { useEffect, type ReactNode } from 'react'
import { Icon, P } from '../lib/ui.ts'

export function ImageLightbox(props: { src: string, name: string, onClose: () => void }): ReactNode {
  const { src, name, onClose } = props
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey) }
  }, [onClose])

  return (
    <div className="dsgc-lightbox" role="dialog" aria-modal="true" aria-label={name} onClick={onClose}>
      <button type="button" className="dsgc-lightbox-x" aria-label="关闭" onClick={(e) => { e.stopPropagation(); onClose() }}>
        {Icon(P.IconCloseOutlineMedium, 16)}
      </button>
      <img src={src} alt={name} onClick={(e) => { e.stopPropagation() }} />
    </div>
  )
}
