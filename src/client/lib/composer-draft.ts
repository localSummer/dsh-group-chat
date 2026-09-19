/**
 * 未发送草稿：按会话 id 分槽，模块级跨挂载存活。
 * 主会话⇄群聊会整页卸载 composer，contentEditable 的 HTML 必须自行记住。
 * @module dsh-group-chat/client/composer-draft
 */

export interface ComposerDraft {
  html: string
  text: string
}

const LIMIT = 32
const drafts = new Map<string, ComposerDraft>()

const empty = (): ComposerDraft => ({ html: '', text: '' })

/** 读指定会话草稿；命中则提到 LRU 最近端。 */
export function readComposerDraft(sessionId: string | null | undefined): ComposerDraft {
  if (!sessionId) return empty()
  const hit = drafts.get(sessionId)
  if (!hit) return empty()
  drafts.delete(sessionId)
  drafts.set(sessionId, hit)
  return hit
}

/** 写入；空草稿删槽。超出上限淘汰最旧槽。 */
export function writeComposerDraft(sessionId: string | null | undefined, html: string, text: string): void {
  if (!sessionId) return
  drafts.delete(sessionId)
  if (!html && !text) return
  drafts.set(sessionId, { html, text })
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
