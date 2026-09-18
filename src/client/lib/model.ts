/**
 * 浏览器半共享常量与小工具（纯函数，无 React 依赖）。
 * @module dsh-group-chat/client/model
 */

import type { RoleRecord, Snapshot, ToolCallRecord } from '../../core/types.ts'

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

export function fmtTime(ts: number): string {
  const delta = Math.max(0, Date.now() - ts)
  if (delta < 60000) return '刚刚'
  if (delta < 3600000) return Math.floor(delta / 60000) + ' 分钟前'
  if (delta < 86400000) return Math.floor(delta / 3600000) + ' 小时前'
  const d = new Date(ts)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  const pad = (n: number): string => (n < 10 ? '0' + n : '' + n)
  return sameYear ? (d.getMonth() + 1) + '月' + d.getDate() + '日' : d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate()
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

/** 工具调用行的展示参数。 */
export type ToolCallView = ToolCallRecord

/** 草稿是否可作为角色落库（宿主侧再校验一次）。 */
export function draftMissing(draft: RoleDraft): string {
  if (!draft.name.trim()) return '角色名称不能为空'
  if (!draft.provider || !draft.model) return '请选择角色绑定的模型'
  return ''
}

/** RoleRecord 兼容视图（快照角色行即其展示子集）。 */
export type RoleView = RoleRecord
