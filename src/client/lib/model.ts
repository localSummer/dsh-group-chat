/**
 * 浏览器半共享常量与小工具（纯函数，无 React 依赖）。
 * @module dsh-group-chat/client/model
 */

import type { Snapshot } from '../../core/types.ts'

/** 会话列表状态派生与文案（core 纯函数，供 NavPanel 渲染）。 */
export { sessStatus, SESS_STATUS_LABEL, type SessStatus } from '../../core/status.ts'

/** 角色标识色调色板（与宿主半一致）。 */
export const PALETTE = ['#5b8def', '#22a06b', '#e8912d', '#c678dd', '#e05661', '#56b6c2', '#98c379', '#d19a66']

/** Host HTTP API 前缀。 */
export const API_PREFIX = '/api/group-chat'

/** MarkdownText 渲染文案。 */
export const MD_LABELS = Object.freeze({ code: { copyLabel: '复制', copiedLabel: '已复制' }, footnotes: '脚注' })

/** 快照的 wire 形态（响应里带 ok 标记）。 */
export type ClientSnapshot = Snapshot & { ok: boolean }

/** models action 的响应形态。 */
export interface ModelsResponse {
  ok: boolean
  providers?: { id: string, name?: string }[]
  modelsByProvider?: Record<string, { id: string, name?: string }[]>
  error?: string
}

/** efforts action 的响应形态。 */
export interface EffortsResponse {
  ok: boolean
  efforts?: { id: string, name: string, description?: string }[]
  defaultEffort?: string
  error?: string
}

/** 快照内的角色/会话/群组视图行。 */
export type SnapshotRole = Snapshot['roles'][number]
export type SnapshotSession = Snapshot['sessions'][number]
export type SnapshotGroup = Snapshot['groups'][number]
export type SnapshotMessage = Snapshot['messages'][number]

export function roleById(s: ClientSnapshot, id: string | null): SnapshotRole | null {
  for (const r of s.roles) if (r.id === id) return r
  return null
}

export function sessById(s: ClientSnapshot, id: string): SnapshotSession | null {
  for (const x of s.sessions) if (x.id === id) return x
  return null
}

export function groupById(s: ClientSnapshot, id: string): SnapshotGroup | null {
  for (const g of s.groups) if (g.id === id) return g
  return null
}

export function escapeRegExp(v: string): string {
  return String(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function firstLine(text: string): string {
  const i = text.indexOf('\n')
  return i === -1 ? text : text.slice(0, i)
}

export function latestLine(text: string): string {
  const visible = text.trimEnd()
  const i = visible.lastIndexOf('\n')
  return i === -1 ? visible : visible.slice(i + 1)
}

/** 消息绝对时钟（对齐主会话 formatMessageClock / clock.md / clock.ymd zh 模板）：
 * 同日 → HH:mm；同年更早 → M月D日 HH:mm；跨年 → Y年M月D日 HH:mm。
 * 绝对时钟不随时间推移失真——Bubble 值比较 memo 冻结首渲字符串无害。 */
export function fmtClock(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number): string => (n < 10 ? '0' + n : '' + n)
  const clock = pad(d.getHours()) + ':' + pad(d.getMinutes())
  const now = new Date()
  const sameYear = d.getFullYear() === now.getFullYear()
  if (sameYear && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()) return clock
  const md = (d.getMonth() + 1) + '月' + d.getDate() + '日'
  return sameYear ? md + ' ' + clock : d.getFullYear() + '年' + md + ' ' + clock
}

/** 发言生成总耗时（对齐插件内 ToolRow 耗时语汇 + 轨道计时的分钟段）：
 * <1s → `800ms`；<60s → `3.2s`（一位小数）；≥60s → `1分58秒`（秒补零 2 位）。 */
export function fmtSpeakDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return ''
  if (ms < 1000) return Math.round(ms) + 'ms'
  if (ms < 60000) return (ms / 1000).toFixed(1) + 's'
  const total = Math.floor(ms / 1000)
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  const pad = (n: number): string => (n < 10 ? '0' + n : '' + n)
  return minutes + '分' + pad(seconds) + '秒'
}

/** 角色编辑抽屉的草稿形态（编辑与新建共用）。 */
export interface RoleDraft {
  id?: string
  name: string
  color: string | null
  persona: string
  provider: string
  model: string
  temperature?: number
  reasoningEffort: string
  enabled?: boolean
  thinking: boolean
}

export function draftFromRole(role: SnapshotRole): RoleDraft {
  return { id: role.id, name: role.name, color: role.color ?? null, persona: role.persona, provider: role.provider, model: role.model, temperature: role.temperature, reasoningEffort: role.reasoningEffort || 'default', enabled: role.enabled, thinking: role.thinking === true }
}

export function blankDraft(): RoleDraft {
  return { name: '', color: null, persona: '', provider: '', model: '', temperature: undefined, reasoningEffort: 'default', enabled: true, thinking: false }
}
