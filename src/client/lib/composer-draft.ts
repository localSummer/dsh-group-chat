/**
 * 未发送草稿：按会话 id 分槽，模块级跨挂载存活。
 * 主会话⇄群聊会整页卸载 composer，contentEditable 的 HTML 与待发图片必须自行记住。
 * @module dsh-group-chat/client/composer-draft
 */

import type { ImageAttachmentRef } from '@deepseek-ai/dsh-attachment'

export interface ComposerDraft {
  html: string
  text: string
  /** 待发图片。不进文本区 HTML。 */
  images: ImageAttachmentRef[]
}

const LIMIT = 32
const drafts = new Map<string, ComposerDraft>()

const empty = (): ComposerDraft => ({ html: '', text: '', images: [] })

/** 读指定会话草稿；命中则提到 LRU 最近端。 */
export function readComposerDraft(sessionId: string | null | undefined): ComposerDraft {
  if (!sessionId) return empty()
  const hit = drafts.get(sessionId)
  if (!hit) return empty()
  drafts.delete(sessionId)
  drafts.set(sessionId, hit)
  return { html: hit.html, text: hit.text, images: Array.isArray(hit.images) ? hit.images : [] }
}

/** 写入；文字和图片都空则删槽。超出上限淘汰最旧槽。 */
export function writeComposerDraft(sessionId: string | null | undefined, html: string, text: string, images: ImageAttachmentRef[] = []): void {
  if (!sessionId) return
  drafts.delete(sessionId)
  if (!html && !text && images.length === 0) return
  drafts.set(sessionId, { html, text, images })
  if (drafts.size > LIMIT) {
    const oldest = drafts.keys().next().value
    if (oldest !== undefined) drafts.delete(oldest)
  }
}

/** 发送成功或明确丢弃时摘槽。 */
export function clearComposerDraft(sessionId: string | null | undefined): void {
  if (sessionId) drafts.delete(sessionId)
}

/** 测试用：清空全部槽位。 */
export function resetComposerDrafts(): void {
  drafts.clear()
}

function attr(tag: string, name: string): string {
  const matched = new RegExp('\\s' + name + '="([^"]*)"').exec(tag)
  if (!matched) return ''
  return matched[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
}

/**
 * 从草稿 HTML 抽出曾经嵌在文本区里的图片芯片，并把芯片从 HTML 里剥掉。
 * 新预览不进文本区；这只处理还留在内存草稿里的旧芯片。
 */
export function detachImageChips(html: string): { html: string, images: ImageAttachmentRef[] } {
  if (!html || !html.includes('dsgc-chipin-image')) return { html, images: [] }
  const images: ImageAttachmentRef[] = []
  const next = html.replace(/<span\b[^>]*\bdsgc-chipin-image\b[^>]*>[\s\S]*?<\/span>/g, (span) => {
    const id = attr(span, 'data-attachment-id')
    const mediaType = attr(span, 'data-media-type')
    if (id && mediaType) {
      const name = attr(span, 'data-name')
      images.push({
        attachmentId: id as ImageAttachmentRef['attachmentId'],
        mediaType: mediaType as ImageAttachmentRef['mediaType'],
        bytes: Number(attr(span, 'data-bytes')) || 0,
        width: Number(attr(span, 'data-width')) || 0,
        height: Number(attr(span, 'data-height')) || 0,
        ...(name ? { name } : {}),
      })
    }
    return ''
  })
  return { html: next, images }
}
