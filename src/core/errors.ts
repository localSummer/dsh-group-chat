/**
 * 角色发言失败：供应商原文 → 人话标题/原因（core 纯函数，无 React）。
 * 原始 JSON 仍落盘在消息 text 里，UI 默认只展示短因，展开才看原文。
 * @module dsh-group-chat/core/errors
 */

export interface SpeakFailureView {
  /** 一行标题，例如「额度已用尽」。 */
  title: string
  /** 可选短因：重置时间、HTTP 状态等。 */
  detail?: string
  /** 复制/排障用的供应商原文（已剥「模型输出异常终止: 」前缀）。 */
  raw: string
}

const PREFIX = '模型输出异常终止: '
const LEGACY_ROLE = /^角色「([^」]+)」发言失败[:：]\s*/

/** 剥旧系统胶囊与引擎包装前缀，保留供应商原文。 */
export function unwrapSpeakFailure(raw: string): string {
  const text = String(raw || '').trim()
  const legacy = parseLegacyRoleFailure(text)
  const body = legacy ? legacy.rest : text
  return body.startsWith(PREFIX) ? body.slice(PREFIX.length).trim() : body
}

/** 旧系统胶囊文案：角色「名」发言失败：原文。对不上则 null。 */
export function parseLegacyRoleFailure(text: string): { roleName: string, rest: string } | null {
  const m = LEGACY_ROLE.exec(String(text || ''))
  if (!m) return null
  return { roleName: m[1], rest: String(text).slice(m[0].length) }
}

export interface RoleRef {
  id: string
  name: string
  provider?: string
  model?: string
}

export interface FailedMessageRef {
  speaker: string
  text: string
  error?: boolean
  failedRoleId?: string
}

/** 发言失败卡：error 标记，或旧系统胶囊文案。 */
export function isSpeakFailure(m: FailedMessageRef): boolean {
  return !!m.error || !!parseLegacyRoleFailure(m.text)
}

/** 失败回合对应角色：failedRoleId / speaker / 旧文案里的角色名（恰好一名才命中）。 */
export function resolveFailedRole<T extends RoleRef>(m: FailedMessageRef, roles: T[]): T | null {
  const byId = (id: string | undefined): T | null => {
    if (!id) return null
    for (const r of roles) if (r.id === id) return r
    return null
  }
  const direct = byId(m.failedRoleId) || (m.speaker !== 'user' && m.speaker !== 'system' ? byId(m.speaker) : null)
  if (direct) return direct
  const parsed = parseLegacyRoleFailure(m.text)
  if (!parsed) return null
  const hits = roles.filter((r) => r.name === parsed.roleName)
  return hits.length === 1 ? hits[0] : null
}

/**
 * 把旧系统失败行挂到对应角色（恰好一名命中才迁）。
 * 返回是否改写了记录。
 */
export function repairFailedMessage(
  m: { speaker: string, text: string, error?: boolean, failedRoleId?: string, model?: string },
  roles: RoleRef[],
): boolean {
  if (!isSpeakFailure(m)) return false
  let changed = false
  if (!m.error) {
    m.error = true
    changed = true
  }
  if (!m.failedRoleId && m.speaker !== 'user' && m.speaker !== 'system') {
    m.failedRoleId = m.speaker
    changed = true
  }
  if (!m.failedRoleId && m.speaker === 'system') {
    const parsed = parseLegacyRoleFailure(m.text)
    if (parsed) {
      const hits = roles.filter((r) => r.name === parsed.roleName)
      if (hits.length === 1) {
        const role = hits[0]
        m.speaker = role.id
        m.failedRoleId = role.id
        m.text = unwrapSpeakFailure(parsed.rest)
        if (!m.model && (role.provider || role.model)) m.model = (role.provider || '') + ' / ' + (role.model || '')
        changed = true
      }
    }
  } else if (m.failedRoleId && m.speaker === 'system') {
    m.speaker = m.failedRoleId
    changed = true
  }
  // 对不上角色时保留「角色「名」发言失败」原文，客户端才能再解析。
  if (m.failedRoleId || (m.speaker !== 'user' && m.speaker !== 'system')) {
    const unwrapped = unwrapSpeakFailure(m.text)
    if (unwrapped !== m.text) {
      m.text = unwrapped
      changed = true
    }
  }
  return changed
}

import { looseJson } from './json.ts'

function httpStatus(text: string): number | null {
  const m = text.match(/\b([1-5]\d{2})\b/)
  if (!m) return null
  const n = Number(m[1])
  return n >= 100 && n <= 599 ? n : null
}

function resetHint(message: string): string | undefined {
  const m = message.match(/reset at ([^.]+\S)/i) || message.match(/将在\s*([^\s。]+)\s*重置/)
  return m ? '将在 ' + m[1] + ' 重置' : undefined
}

/**
 * 把供应商错误压成可扫描的标题 + 短因。
 * 未知形态回退为「发言失败」，原文仍可展开。
 */
export function classifySpeakFailure(raw: string): SpeakFailureView {
  const source = unwrapSpeakFailure(raw)
  const blob = looseJson(source)
  const code = blob && typeof blob.code === 'string' ? blob.code : ''
  const type = blob && typeof blob.type === 'string' ? blob.type : ''
  const message = blob && typeof blob.message === 'string' ? blob.message : source
  const status = httpStatus(source)
  const joined = (code + ' ' + type + ' ' + message + ' ' + source).toLowerCase()

  if (/quota|accountquotaexceeded|exceeded the .*quota|额度|配额/.test(joined) || code === 'AccountQuotaExceeded') {
    return { title: '额度已用尽', detail: resetHint(message), raw: source }
  }
  if (status === 429 || /too.?many.?requests|rate.?limit|限流/.test(joined) || type === 'TooManyRequests') {
    return { title: '请求过于频繁', detail: '稍后再试，或降低并发', raw: source }
  }
  if (status === 401 || status === 403 || /unauthorized|forbidden|invalid.?api.?key|鉴权|未授权/.test(joined)) {
    return { title: '模型鉴权失败', detail: '检查该角色绑定的提供方密钥', raw: source }
  }
  if (status === 404 || /model.?not.?found|unknown.?model|模型不存在/.test(joined)) {
    return { title: '模型不可用', detail: '该角色绑定的模型可能已下线', raw: source }
  }
  if (/timeout|timed out|etimedout|超时/.test(joined)) {
    return { title: '模型响应超时', raw: source }
  }
  if (/network|econnreset|econnrefused|enotfound|fetch failed|网络/.test(joined)) {
    return { title: '网络异常', detail: '检查网络后重试', raw: source }
  }
  if (status !== null && status >= 500) {
    return { title: '模型服务暂时不可用', detail: 'HTTP ' + status, raw: source }
  }
  if (status !== null) {
    return { title: '发言失败', detail: 'HTTP ' + status, raw: source }
  }
  return { title: '发言失败', raw: source }
}

/** 失败卡默认复制内容：标题 + 短因 + 原文。 */
export function formatSpeakFailureCopy(view: SpeakFailureView): string {
  const lines = [view.title]
  if (view.detail) lines.push(view.detail)
  if (view.raw && view.raw !== view.title) lines.push(view.raw)
  return lines.join('\n')
}
