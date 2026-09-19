/**
 * 会话约束备忘纯逻辑：滑动 40 条窗口、挤出集、压行、临时原文、解析与截断。
 * @module dsh-group-chat/core/constraints
 */

import { looseJson } from './json.ts'
import { TRANSCRIPT_TOOL_SUMMARY } from './tools.ts'
import { asConstraintKind, type MessageRecord, type SessionConstraint, type SessionRecord } from './types.ts'

/** 当场原文窗口（含系统行）。 */
export const WINDOW_SIZE = 40
/** 折叠失败时临时原文条数上限。 */
export const TEMP_MAX_MESSAGES = 20
/** 折叠失败时临时原文总长上限。 */
export const TEMP_MAX_CHARS = 16000
/** 单轮折叠最多消耗的挤出条数（含系统行；超出留待下一轮）。 */
export const FOLD_MAX_MESSAGES = 40
/** 单轮折叠输入总长上限（格式化后）。 */
export const FOLD_MAX_CHARS = 16000
/** 备忘条数上限。 */
export const CONSTRAINT_MAX_ITEMS = 12
/** 备忘总长上限（条目前缀+正文）。 */
export const CONSTRAINT_MAX_CHARS = 1200
/** 单条备忘正文上限。 */
export const CONSTRAINT_ITEM_MAX_CHARS = 160

export const KIND_LABEL: Record<SessionConstraint['kind'], string> = {
  decided: '已定',
  rejected: '否决',
  open: '未决',
}

/** 已折入水位（缺省 0）。 */
export function constraintsWatermark(sess: SessionRecord): number {
  return typeof sess.constraintsUpToSeq === 'number' && sess.constraintsUpToSeq > 0 ? sess.constraintsUpToSeq : 0
}

/** 重试：只取失败卡之前的时间线；untilId 不在列表则原样。 */
export function prefixIds(ids: string[], untilId?: string): string[] {
  if (!untilId) return ids
  const i = ids.indexOf(untilId)
  return i >= 0 ? ids.slice(0, i) : ids
}

/**
 * 新挤出：seq > 水位 且不在最近 40 条。只扫窗口外前缀（旧→新）。
 * untilId：重试时把窗口截到该消息之前，不带上后面已经发生的发言。
 */
export function squeezedMessages(
  messages: Map<string, MessageRecord>,
  sess: SessionRecord,
  untilId?: string,
): MessageRecord[] {
  const ids = prefixIds(sess.messageIds, untilId)
  if (ids.length <= WINDOW_SIZE) return []
  const end = ids.length - WINDOW_SIZE
  const upTo = constraintsWatermark(sess)
  const last = messages.get(ids[end - 1])
  if (last && last.seq <= upTo) return []
  const out: MessageRecord[] = []
  for (let i = 0; i < end; i++) {
    const m = messages.get(ids[i])
    if (!m || m.seq <= upTo) continue
    out.push(m)
  }
  return out
}

/** 说话人展示名（折叠输入 / transcript 共用）。 */
export function speakerLabel(speaker: string, roleName?: string): string {
  if (speaker === 'user') return '用户'
  if (speaker === 'system') return '系统'
  return roleName || '成员'
}

/** 单条消息压成 transcript 行（正文 8k + 工具一行摘要）。 */
export function formatTranscriptLine(m: MessageRecord, name: string): string {
  let text = m.text || ''
  if (text.length > 8000) text = text.slice(0, 8000) + '…(已截断)'
  let line = '【' + name + '】' + text
  if (Array.isArray(m.toolCalls)) {
    for (const c of m.toolCalls) {
      if (!c || typeof c.tool !== 'string') continue
      let brief = ''
      try {
        brief = JSON.stringify(c.args) || ''
      } catch {
        brief = ''
      }
      if (brief.length > 60) brief = brief.slice(0, 60) + '…'
      const st = c.status === 'ok' ? '成功' : c.status === 'denied' ? '用户拒绝' : '失败'
      let ob = String(c.output || '')
      if (ob.length > TRANSCRIPT_TOOL_SUMMARY) ob = ob.slice(0, TRANSCRIPT_TOOL_SUMMARY) + '…'
      line += '\n  [工具] ' + c.tool + ' ' + brief + ' → ' + st + (ob ? '（' + ob.replace(/\s+/g, ' ') + '）' : '')
    }
  }
  return line
}

/**
 * 单轮折叠消耗前缀：从最旧挤出起，最多 40 条 / 16k；系统行与失败卡计入消耗但不进模型。
 * 水位只能推到 consumed 的 max seq，剩余留待下一轮。
 */
export function takeFoldBatch(squeezed: MessageRecord[], nameOf: (m: MessageRecord) => string): {
  consumed: MessageRecord[]
  lines: string[]
  hasUser: boolean
  allSystem: boolean
} {
  const consumed: MessageRecord[] = []
  const lines: string[] = []
  let hasUser = false
  let chars = 0
  for (const m of squeezed) {
    if (m.speaker === 'system' || m.error) {
      consumed.push(m)
      if (consumed.length >= FOLD_MAX_MESSAGES) break
      continue
    }
    const line = formatTranscriptLine(m, nameOf(m))
    const extra = line.length + (lines.length ? 2 : 0)
    if (lines.length > 0 && chars + extra > FOLD_MAX_CHARS) break
    if (m.speaker === 'user') hasUser = true
    lines.push(line)
    chars += extra
    consumed.push(m)
    if (consumed.length >= FOLD_MAX_MESSAGES) break
  }
  return { consumed, lines, hasUser, allSystem: lines.length === 0 }
}

/**
 * 未折入的挤出原文（失败缓冲）：只格式化最近 20 条，再按 16k 从最旧往下丢。
 */
export function tempTranscript(squeezed: MessageRecord[], nameOf: (m: MessageRecord) => string): string {
  if (!squeezed.length) return ''
  const usable = squeezed.filter((m) => m.speaker !== 'system' && !m.error)
  if (!usable.length) return ''
  const batch = usable.length > TEMP_MAX_MESSAGES ? usable.slice(-TEMP_MAX_MESSAGES) : usable
  const lines = batch.map((m) => formatTranscriptLine(m, nameOf(m)))
  let start = 0
  let total = lines[0] ? lines[0].length : 0
  for (let i = 1; i < lines.length; i++) {
    total += 2 + lines[i].length
  }
  while (start < lines.length - 1 && total > TEMP_MAX_CHARS) {
    total -= lines[start].length + 2
    start++
  }
  let block = lines.slice(start).join('\n\n')
  if (block.length > TEMP_MAX_CHARS) block = block.slice(0, TEMP_MAX_CHARS) + '…(已截断)'
  return block
}

/** 水位 = 本批挤出的 max(seq)；空批为 0。 */
export function squeezedMaxSeq(squeezed: MessageRecord[]): number {
  let max = 0
  for (const m of squeezed) if (m.seq > max) max = m.seq
  return max
}

/** hydrate / 模型输出：非法 kind 丢条目；空 text 丢；条数与总长截断。 */
export function sanitizeConstraints(raw: unknown): SessionConstraint[] {
  if (!Array.isArray(raw)) return []
  const out: SessionConstraint[] = []
  let total = 0
  for (const item of raw) {
    if (out.length >= CONSTRAINT_MAX_ITEMS) break
    if (!item || typeof item !== 'object') continue
    const kind = asConstraintKind((item as { kind?: unknown }).kind)
    const text = typeof (item as { text?: unknown }).text === 'string' ? (item as { text: string }).text.trim() : ''
    if (!kind || !text) continue
    const clipped = text.length > CONSTRAINT_ITEM_MAX_CHARS ? text.slice(0, CONSTRAINT_ITEM_MAX_CHARS) + '…' : text
    const cost = KIND_LABEL[kind].length + clipped.length
    if (total + cost > CONSTRAINT_MAX_CHARS) break
    out.push({ kind, text: clipped })
    total += cost
  }
  return out
}

/**
 * 解析折叠模型输出。null = 解析失败（水位不推）；[] = 无新结论（水位推、备忘不动）。
 */
export function parseConstraints(raw: string): SessionConstraint[] | null {
  const o = looseJson(raw.replace(/```(?:json)?/g, ''))
  if (o === null) return null
  if (!Object.prototype.hasOwnProperty.call(o, 'constraints')) return null
  if (!Array.isArray(o.constraints)) return null
  return sanitizeConstraints(o.constraints)
}

/** 本批无用户消息时，新的已定/否决降为未决。 */
export function downgradeWithoutUser(list: SessionConstraint[], hasUser: boolean): SessionConstraint[] {
  if (hasUser) return list
  return list.map((c) => c.kind === 'open' ? c : { kind: 'open', text: c.text })
}

/** system 提示词「已确认约束」块；空则空串。 */
export function constraintBlock(list: SessionConstraint[] | undefined): string {
  if (!list || !list.length) return ''
  const lines = list.map((c) => '- ' + KIND_LABEL[c.kind] + '：' + c.text)
  return '\n# 已确认约束\n' + lines.join('\n')
}
