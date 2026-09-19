/**
 * 引擎共享小件：DSH 默认模型读取 + 发言人展示名（retitle / fold / conversation 共用）。
 * @module dsh-group-chat/host/engine/defaults
 */

import { speakerLabel } from '../../core/constraints.ts'
import type { RoleRecord } from '../../core/types.ts'
import type { HostState } from '../state.ts'

/** DSH 默认模型（agentDefaultModel 服务缺位或未配置时返回 null，调用方静默跳过）。 */
export const defaultModel = (core: HostState): { provider: string, model: string } | null => {
  try {
    // cordis 语义：未 inject 的 ctx 属性访问会抛错（"cannot get property without
    // inject"），`?.` 接不住——可选消费必须走 reflect.get（读全局注册表，缺位返回
    // undefined）。直接属性访问曾致 retitle 被静默跳过（标题/主题从不生成）。
    const svc = core.ctx.reflect.get('agentDefaultModel')
    const sel = svc ? svc.currentSelection() : null
    return sel && typeof sel.provider === 'string' && typeof sel.model === 'string' && sel.provider && sel.model
      ? { provider: sel.provider, model: sel.model }
      : null
  } catch {
    return null
  }
}

/** 发言人展示名（roles 表内查角色名；user/system 固定文案，见 speakerLabel）。 */
export const speakerNameOf = (roles: Map<string, RoleRecord>, speaker: string): string =>
  speakerLabel(speaker, roles.get(speaker)?.name)
