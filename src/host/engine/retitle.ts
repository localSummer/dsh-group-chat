/**
 * 会话标题/主题自动整理（参照 oil-codex-title）：每轮结束后用 DSH 默认模型
 * 后台生成「类别 emoji + 对象｜目标」名称与演进式主题；手动编辑过的字段
 * 永久跳过（隐式固定）。
 * @module dsh-group-chat/host/engine/retitle
 */

import type { GenerateOptions, Message } from '@deepseek-ai/dsh-llm'
import type { SessionRecord } from '../../core/types.ts'
import type { HostState } from '../state.ts'

/** DSH 默认模型（agentDefaultModel 服务缺位或未配置时返回 null，调用方静默跳过）。 */
const defaultModel = (core: HostState): { provider: string, model: string } | null => {
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

/** 命名输入：最近 40 条非系统消息的紧凑转写（每条 500 字符封顶，命名不需要全文）。 */
const titleTranscript = (core: HostState, sess: SessionRecord): string => {
  const out: string[] = []
  for (const mid of sess.messageIds.slice(-40)) {
    const m = core.messages.get(mid)
    if (!m || m.speaker === 'system' || !m.text) continue
    const name = m.speaker === 'user' ? '用户' : (core.roles.get(m.speaker) || { name: undefined }).name || '成员'
    out.push('【' + name + '】' + m.text.replace(/\s+/g, ' ').slice(0, 500))
  }
  return out.join('\n')
}

/** 宽容解析模型输出：剥代码围栏 → 取首个 { 至末个 } 的 JSON → 校验并封顶字段。 */
const parseRetitle = (raw: string): { name?: string, topic?: string } => {
  const body = raw.replace(/```(?:json)?/g, '')
  const l = body.indexOf('{')
  const r = body.lastIndexOf('}')
  if (l < 0 || r <= l) return {}
  try {
    const o = JSON.parse(body.slice(l, r + 1)) as { name?: unknown, topic?: unknown }
    const name = typeof o.name === 'string' ? o.name.trim() : ''
    const topic = typeof o.topic === 'string' ? o.topic.trim() : ''
    return { name: name ? name.slice(0, 24) : undefined, topic: topic ? topic.slice(0, 120) : undefined }
  } catch {
    return {}
  }
}

/**
 * 每轮结束后根据聊天内容整理会话名称与主题：后台 fire-and-forget、不产生
 * 消息、静默失败。名称 =「类别 emoji + 对象｜目标」（类别固定、对象稳定、
 * 目标实质变化才改）；主题 = 演进式一句话摘要（对象+目标+当前焦点），注入
 * 后续轮次的角色上下文。手动编辑过的字段永久跳过（隐式固定，apply 时复查）。
 */
export function createRetitle(core: HostState, deps: { touch: () => void, schedulePersist: (targets?: { session?: string | null }) => void }): (sess: SessionRecord) => Promise<void> {
  const { llm } = core
  const { touch, schedulePersist } = deps

  /** 进行中的命名会话集合（同会话并发去重）。 */
  const retitling = new Set<string>()

  return async (sess: SessionRecord): Promise<void> => {
    if (retitling.has(sess.id)) return
    const dm = defaultModel(core)
    if (!dm || (sess.namePinned && sess.topicPinned)) return
    const transcript = titleTranscript(core, sess)
    if (!transcript) return
    retitling.add(sess.id)
    try {
      const sys = [
        '你是群聊会话的命名助手。根据群聊记录为这个会话生成名称与主题。',
        '',
        '# 名称规则',
        '- 格式：「类别 emoji + 对象｜目标」，例如「🔎 缓存选型｜Redis 与本地 KV 对比」',
        '- 类别固定六选一：🔎 调研对比（多方案/多观点比较）、💡 头脑风暴（创意发散）、⚖️ 方案评审（评审已有方案或产物）、🛠️ 排查修复（定位与解决问题）、📝 方法整理（总结沉淀方法与知识）、🗣️ 通用讨论（其余兜底）',
        '- 对象在前且稳定：把辨识度最高的讨论对象放最前；省略群组名（外层已展示）；除非讨论对象实质变化，沿用当前名称里的对象名；「继续」「追问」等不改变主线',
        '- 目标 = 当前正在做的事，动宾短语，保持简洁',
        '- 名称总长不超过 16 个字',
        '',
        '# 主题规则',
        '- 一句话演进式摘要：讨论对象 + 当前目标 + 当前焦点/分歧点',
        '- 不超过 60 个字；供后续讨论作为上下文锚，跟随最新进展更新',
        '',
        '# 其他',
        '- 语言跟随用户消息的主要语言；保留产品名与技术名词',
        '- 只输出一行 JSON：{"name": "…", "topic": "…"}，不要输出其他内容',
        '',
        '当前名称：' + (sess.namePinned ? '（已手动固定，本次不要输出 name 字段）' : sess.name),
        '当前主题：' + (sess.topicPinned ? '（已手动固定，本次不要输出 topic 字段）' : (sess.topic || '（空）')),
      ].join('\n')
      let acc = ''
      for await (const chunk of llm.stream({
        provider: dm.provider,
        model: dm.model,
        system: sys,
        // 不设 maxTokens：思考模型的 reasoning 与正文共享输出预算，任何小上限
        // 都可能被思考耗尽（finish=max-tokens、正文空、静默无变更）；跟随
        // provider 默认输出上限（与角色发言 speak 同一先例），正文侧由
        // acc 2000 字符截断兜底
        messages: [{ id: ('g' + core.revision + '-t0') as Message['id'], role: 'user', content: [{ type: 'text', text: '群聊记录（从旧到新）：\n\n' + transcript }], source: { kind: 'user' } }],
      } as GenerateOptions)) {
        if (chunk.type === 'text-delta') {
          acc += chunk.text
          if (acc.length > 2000) break
        } else if (chunk.type === 'finish') {
          break
        }
      }
      const parsed = parseRetitle(acc)
      let changed = false
      if (parsed.name && !sess.namePinned) { sess.name = parsed.name; changed = true }
      if (parsed.topic && !sess.topicPinned) { sess.topic = parsed.topic; changed = true }
      if (changed) {
        schedulePersist({ session: sess.id })
        touch()
      }
    } catch (e) {
      console.error('[dsh-group-chat] 会话标题整理失败（跳过，不影响对话）：', e)
    } finally {
      retitling.delete(sess.id)
    }
  }
}
