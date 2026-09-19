/**
 * 记录 → 落盘 JSON 的纯序列化（core 层；可选字段无则省略）。
 * @module dsh-group-chat/core/json
 */

import type { MessageRecord, RoleRecord } from './types.ts'

/** 消息 → 落盘 JSON（可选字段无则省略；兼容保留 error）。 */
export function messageJson(m: Partial<MessageRecord> | undefined): Record<string, unknown> | null {
  if (!m || typeof m.id !== 'string') return null
  const o: Record<string, unknown> = { id: m.id, speaker: m.speaker, text: String(m.text || ''), ts: typeof m.ts === 'number' ? m.ts : Date.now(), seq: typeof m.seq === 'number' ? m.seq : 0 }
  if (m.model !== undefined) o.model = m.model
  if (m.reasoning !== undefined) o.reasoning = m.reasoning
  if (m.reasoningFull !== undefined) o.reasoningFull = m.reasoningFull
  if (m.thinkingSummary !== undefined) o.thinkingSummary = m.thinkingSummary
  if (m.error !== undefined) o.error = m.error
  if (typeof m.failedRoleId === 'string' && m.failedRoleId) o.failedRoleId = m.failedRoleId
  if (Array.isArray(m.toolCalls) && m.toolCalls.length > 0) o.toolCalls = m.toolCalls
  return o
}

/** 角色 → 落盘 JSON（groupId 由目录归属，不再写入）。 */
export function roleJson(r: Partial<RoleRecord>): Record<string, unknown> {
  const o: Record<string, unknown> = { id: r.id, name: String(r.name || '成员'), persona: String(r.persona || ''), provider: String(r.provider || ''), model: String(r.model || ''), enabled: r.enabled !== false, thinking: r.thinking === true }
  if (r.color) o.color = r.color
  if (typeof r.temperature === 'number' && !Number.isNaN(r.temperature)) o.temperature = r.temperature
  if (typeof r.reasoningEffort === 'string' && r.reasoningEffort && r.reasoningEffort !== 'default') o.reasoningEffort = r.reasoningEffort
  return o
}
