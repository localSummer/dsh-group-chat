/**
 * 窗口外结论/约束备忘：整次 runLoop 结束后后台折叠（仿 retitle）。
 * 立刻 idle；未折完用水位 + 临时原文表达。v1 复用 purpose session-title 关思考。
 * @module dsh-group-chat/host/engine/fold
 */

import type { GenerateOptions, Message } from '@deepseek-ai/dsh-llm'
import {
  CONSTRAINT_MAX_CHARS,
  CONSTRAINT_MAX_ITEMS,
  KIND_LABEL,
  downgradeWithoutUser,
  parseConstraints,
  squeezedMaxSeq,
  squeezedMessages,
  speakerLabel,
  takeFoldBatch,
} from '../../core/constraints.ts'
import type { SessionRecord } from '../../core/types.ts'
import type { HostState } from '../state.ts'

/** DSH 默认模型（与 retitle 同一读取面；缺位返回 null）。 */
const defaultModel = (core: HostState): { provider: string, model: string } | null => {
  try {
    const svc = core.ctx.reflect.get('agentDefaultModel')
    const sel = svc ? svc.currentSelection() : null
    return sel && typeof sel.provider === 'string' && typeof sel.model === 'string' && sel.provider && sel.model
      ? { provider: sel.provider, model: sel.model }
      : null
  } catch {
    return null
  }
}

/**
 * 每轮 send 结束后折叠窗口外约束：fire-and-forget、不产生消息、静默失败。
 * 同会话去重；会话已清空则 abort。内存 {constraints, constraintsUpToSeq} 一次挂上。
 */
export function createFold(core: HostState, deps: { touch: () => void, schedulePersist: (targets?: { session?: string | null }) => void }): (sess: SessionRecord) => Promise<void> {
  const { llm, messages, roles } = core
  const { touch, schedulePersist } = deps
  const folding = new Set<string>()

  const nameOf = (speaker: string): string => speakerLabel(speaker, (roles.get(speaker) || { name: undefined }).name)

  return async (sess: SessionRecord): Promise<void> => {
    if (folding.has(sess.id)) return
    const squeezed = squeezedMessages(messages, sess)
    if (!squeezed.length) return
    const input = takeFoldBatch(squeezed, (m) => nameOf(m.speaker))
    const watermark = squeezedMaxSeq(input.consumed)
    if (watermark <= 0) return

    const commit = (next: SessionRecord['constraints'] | undefined): void => {
      const live = core.sessions.get(sess.id)
      if (!live || live.messageIds.length === 0) return
      if (next && next.length) live.constraints = next
      live.constraintsUpToSeq = watermark
      schedulePersist({ session: live.id })
      touch()
    }

    if (input.allSystem) {
      commit(undefined)
      return
    }

    const dm = defaultModel(core)
    if (!dm) return

    folding.add(sess.id)
    try {
      const existing = (sess.constraints || []).map((c) => '- ' + KIND_LABEL[c.kind] + '：' + c.text)
      const sys = [
        '你是群聊会话的约束整理助手。把已经离开最近对话窗口的旧消息压成无主结论/约束备忘。',
        '',
        '# 规则',
        '- 只输出一行 JSON：{"constraints":[{"kind":"decided|rejected|open","text":"…"}, ...]}',
        '- kind 只能是 decided（已定）/ rejected（否决）/ open（未决）',
        '- 无主：条目不写说话人。8–12 条、合计不超过 ' + CONSTRAINT_MAX_CHARS + ' 字，最多 ' + CONSTRAINT_MAX_ITEMS + ' 条',
        '- 已定/否决只能依据【用户】原文；角色对打一律标 open（未决）',
        '- 同主题：新已定覆盖旧未决；旧已定不能因角色反对改写，除非【用户】改口',
        '- 没有新结论时输出 {"constraints":[]}（保留旧备忘）',
        '- 超预算时按 已定 > 未决 > 过程叙述 取舍；语言跟随记录',
        '',
        '当前备忘：',
        existing.length ? existing.join('\n') : '（空）',
      ].join('\n')
      const user = '旧消息（从旧到新，含工具一行摘要）：\n\n' + input.lines.join('\n\n')
      let acc = ''
      for await (const chunk of llm.stream({
        provider: dm.provider,
        model: dm.model,
        system: sys,
        purpose: 'session-title',
        messages: [{ id: ('g' + core.revision + '-c0') as Message['id'], role: 'user', content: [{ type: 'text', text: user }], source: { kind: 'user' } }],
      } as GenerateOptions)) {
        if (chunk.type === 'text-delta') {
          acc += chunk.text
          if (acc.length > 4000) break
        } else if (chunk.type === 'finish') {
          break
        }
      }
      const parsed = parseConstraints(acc)
      if (parsed === null) return
      commit(parsed.length ? downgradeWithoutUser(parsed, input.hasUser) : undefined)
    } catch (e) {
      console.error('[dsh-group-chat] 会话约束折叠失败（跳过，不影响对话）：', e)
    } finally {
      folding.delete(sess.id)
    }
  }
}
