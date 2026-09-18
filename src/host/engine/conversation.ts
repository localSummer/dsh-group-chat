/**
 * 对话引擎：消息追加、群聊记录转写、角色发言（speak：prompt 构建 + 流式
 * 轮次 + 工具回注循环）、多轮 runLoop（每轮结束触发 retitle 标题整理）。
 * @module dsh-group-chat/host/engine/conversation
 */

import { realpathSync } from 'node:fs'
import type { GenerateOptions, Message } from '@deepseek-ai/dsh-llm'
import { TOOL_FLOOR_COST_CHARS, TOOL_REPEAT_LIMIT, TOOL_RESULTS_TOTAL_MAX, TRANSCRIPT_TOOL_SUMMARY } from '../../core/tools.ts'
import type { GroupRecord, MessageRecord, RoleRecord, SessionRecord, SpeakResult, ToolCallRecord } from '../../core/types.ts'
import { asEffort } from '../../core/types.ts'
import type { HostState } from '../state.ts'
import { createRetitle } from './retitle.ts'
import type { Materials } from '../materials/index.ts'
import type { Tools } from '../tools/index.ts'

/** llm wire 的工具调用 id（branded）。 */
type WireToolCallId = Extract<Message['content'][number], { type: 'tool-call' }>['id']

/** llm.stream 的单轮流式产物。 */
interface StreamRound {
  acc: string
  rAcc: string
  errorFinish: { kind: string, failure?: { message?: string } } | null
  maxTokens: boolean
  tcs: { id: string, name: string, args: string }[]
}

/** 对话引擎面。 */
export interface Conversation {
  /** 追加一条消息到会话（touch + 落盘调度）。 */
  appendMessage: (sess: SessionRecord, speaker: string, text: string, extra?: Partial<MessageRecord>) => MessageRecord
  /** 多轮 round-robin 主循环（send 触发；finally 复位 run）。 */
  runLoop: (sess: SessionRecord) => Promise<void>
}

/** 创建对话引擎。 */
export function createConversation(core: HostState, deps: { touch: () => void, schedulePersist: (targets?: { session?: string | null }) => void, materials: Materials, tools: Tools }): Conversation {
  const { llm, groups, roles, messages, run } = core
  const { touch, schedulePersist, materials, tools } = deps
  // 标题/主题自动整理（独立关注点，见 retitle.ts；runLoop 每轮结束触发）
  const retitle = createRetitle(core, { touch, schedulePersist })

  const appendMessage = (sess: SessionRecord, speaker: string, text: string, extra?: Partial<MessageRecord>): MessageRecord => {
    const msg: MessageRecord = { id: core.nid('msg'), sessionId: sess.id, seq: sess.messageIds.length + 1, speaker, text, reasoning: undefined, model: undefined, error: undefined, ts: Date.now() }
    if (extra) {
      if (extra.reasoning !== undefined) msg.reasoning = extra.reasoning
      if (extra.reasoningFull !== undefined) msg.reasoningFull = extra.reasoningFull
      if (extra.thinkingSummary !== undefined) msg.thinkingSummary = extra.thinkingSummary
      if (extra.model !== undefined) msg.model = extra.model
      if (extra.error !== undefined) msg.error = extra.error
      if (Array.isArray(extra.toolCalls) && extra.toolCalls.length > 0) msg.toolCalls = extra.toolCalls
    }
    messages.set(msg.id, msg)
    sess.messageIds.push(msg.id)
    touch()
    schedulePersist({ session: sess.id })
    return msg
  }

  /** 群聊记录 → 角色上下文块（最近 40 条、逐条 8k 截断、工具行压缩）。 */
  const transcriptBlock = (sess: SessionRecord): string => {
    const out: string[] = []
    for (const mid of sess.messageIds) {
      const m = messages.get(mid)
      if (!m) continue
      const name = m.speaker === 'user' ? '用户' : m.speaker === 'system' ? '系统' : (roles.get(m.speaker) || { name: undefined }).name || '成员'
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
      out.push(line)
    }
    return out.slice(-40).join('\n\n')
  }

  const speak = async (g: GroupRecord, sess: SessionRecord, role: RoleRecord): Promise<SpeakResult> => {
    const ws = await materials.loadWorkspaceFiles(g)
    const parts = ws.parts
    const sys = [
      '你正在参与一个多角色群聊。你在群中的身份如下，请始终以该身份发言。',
      '',
      '# 你的角色',
      '- 名称：' + role.name,
      '- 人设：' + (role.persona ? role.persona : '（未填写，请以积极协作者的身份参与讨论）'),
      sess.topic ? '\n# 本会话主题\n' + sess.topic : '',
      materials.materialBlock(parts, ws.dir),
      ws.dir
        ? '\n# 可用工具\n你可以调用工具在群组工作区目录（' + ws.dir + '）内查看文件与目录' +
          (g.permissionTier === 'workspace_write'
            ? '、执行 shell 命令（命令需用户逐条确认，请优先用于运行测试）'
            : g.permissionTier === 'full_access'
              ? '、执行 shell 命令（命令将直接执行、无需确认，请谨慎并优先用于运行测试）'
              : '') +
          '。需要事实依据时优先用工具查看，不要凭空猜测。'
        : '',
      '\n# 发言要求',
      '- 直接输出「' + role.name + '」本轮的发言内容本身：不要输出名字前缀、引号、动作旁白或代码围栏',
      '- 回应群内最新讨论（消息中「@你的名字」表示用户点名要求你回应，被点名时请优先回应）；与其他成员自然对话；有不同观点可以提出并说明理由',
      '- 保持简洁，通常不超过 300 字',
    ].filter((s) => s !== '').join('\n')

    const history = transcriptBlock(sess)
    const intro = history
      ? '以下是本会话的群聊记录（从旧到新）：\n\n' + history
      : '本会话刚刚开始，请围绕主题做简短开场发言。'

    // 工具沙箱根：工作区目录的 realpath（loadWorkspaceFiles 成功即目录存在）
    let wsRoot: string | null = null
    if (ws.dir) {
      try {
        wsRoot = realpathSync(ws.dir)
      } catch {
        wsRoot = null
      }
    }
    const toolSchemas = wsRoot !== null ? tools.buildToolSchemas(g) : []

    const baseOpts: { provider: string, model: string, system: string, temperature?: number, reasoningEffort?: GenerateOptions['reasoningEffort'] } = { provider: role.provider, model: role.model, system: sys }
    if (typeof role.temperature === 'number' && !Number.isNaN(role.temperature)) baseOpts.temperature = role.temperature
    // 深度思考：角色级开关 + 推理级别（取自 DSH 模型设置的 effort 选项）；
    // 未配置或 'default' = 不传 reasoningEffort（用 provider 默认）；
    // 模型不支持 reasoning effort 时本地解析失败，catch 后删参降级重发
    if (role.thinking === true) {
      const effort = asEffort(role.reasoningEffort) as GenerateOptions['reasoningEffort'] | undefined
      if (effort !== undefined) baseOpts.reasoningEffort = effort
    }

    const msgs: Message[] = [{ id: ('g' + core.revision + '-m0') as Message['id'], role: 'user', content: [{ type: 'text', text: intro }], source: { kind: 'user' } }]
    const toolCalls: ToolCallRecord[] = []
    const texts: string[] = []
    const reasonings: string[] = []
    let budgetUsed = 0
    let streak = 0
    let lastSig: string | null = null
    let toolsOff = false // 降级（不支持 tools）或强制收尾后不再带 tools

    // 一轮流式生成：收集 text/reasoning/tool-call（delta 累积 + block-end 闭合；post-block-end delta 忽略）
    const streamRound = async (): Promise<StreamRound> => {
      let acc = ''
      let rAcc = ''
      let errorFinish: StreamRound['errorFinish'] = null
      let maxTokens = false
      const byIndex = new Map<number, { id: string, name: string, args: string, closed: boolean }>()
      const roundTools = toolSchemas.length === 0 || toolsOff ? undefined : toolSchemas
      for await (const chunk of llm.stream({ ...baseOpts, tools: roundTools, messages: msgs })) {
        if (run.stopping) break
        if (chunk.type === 'text-delta') {
          acc += chunk.text
          run.partial = acc
          touch()
        } else if (chunk.type === 'reasoning-delta') {
          rAcc += chunk.text
          run.partialReasoning = rAcc
          touch()
        } else if (chunk.type === 'tool-call-delta') {
          const cur = byIndex.get(chunk.index)
          if (cur && cur.closed) continue
          const entry = cur || { id: 'call-' + chunk.index, name: '', args: '', closed: false }
          if (chunk.id !== undefined) entry.id = chunk.id
          if (chunk.name !== undefined) entry.name = chunk.name
          entry.args += chunk.argumentsDelta
          byIndex.set(chunk.index, entry)
        } else if (chunk.type === 'block-end' && chunk.block && chunk.block.type === 'tool-call') {
          const entry = byIndex.get(chunk.index) || { id: 'call-' + chunk.index, name: '', args: '', closed: false }
          entry.id = chunk.block.id
          entry.name = chunk.block.name
          entry.args = chunk.block.arguments
          entry.closed = true
          byIndex.set(chunk.index, entry)
        } else if (chunk.type === 'finish') {
          const reason = chunk.reason || {}
          if (reason.kind === 'error' || reason.kind === 'aborted') errorFinish = reason
          else if (reason.kind === 'max-tokens') maxTokens = true
        }
      }
      const tcs = [...byIndex.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => ({ id: v.id, name: v.name, args: v.args }))
      return { acc, rAcc, errorFinish, maxTokens, tcs }
    }

    // 强制收尾：工具历史折叠为纯文本摘要（不带 tools、不带工具块），规避无 tools 参数携带工具历史被拒
    const wrapUp = (note: string): void => {
      const lines = toolCalls.map((c) => {
        let brief = ''
        try {
          brief = JSON.stringify(c.args) || ''
        } catch {
          brief = ''
        }
        if (brief.length > 80) brief = brief.slice(0, 80) + '…'
        const ob = String(c.output || '')
        return '[工具] ' + c.tool + ' ' + brief + ' → ' + c.status + (ob ? '：' + (ob.length > TRANSCRIPT_TOOL_SUMMARY ? ob.slice(0, TRANSCRIPT_TOOL_SUMMARY) + '…' : ob) : '')
      })
      msgs.length = 1
      msgs.push({
        id: ('g' + core.revision + '-w' + msgs.length) as Message['id'],
        role: 'user',
        content: [{ type: 'text', text: (texts.length ? '你此前的发言草稿：\n' + texts.join('\n\n') + '\n\n' : '') + '你的工具执行记录（摘要）：\n' + lines.join('\n') + '\n\n' + note + '，请基于以上记录输出最终发言。' }],
        source: { kind: 'user' },
      })
      toolsOff = true
    }

    for (;;) {
      if (run.stopping) break
      let round: StreamRound
      try {
        round = await streamRound()
      } catch (e) {
        const m = String((e && (e as Error).message) || e)
        if (baseOpts.reasoningEffort !== undefined && m.includes('UNSUPPORTED_REASONING_EFFORT')) {
          delete baseOpts.reasoningEffort
          continue
        }
        throw e
      }
      if (round.errorFinish) {
        const f = round.errorFinish.failure || {}
        const failureText = String(f.message || round.errorFinish.kind)
        // 降级（B2）：「不支持 tools」以 error finish 到达；保留 failure 全文判定，去 tools 重试一次
        if (!toolsOff && toolSchemas.length > 0 && /tool/i.test(failureText)) {
          toolsOff = true
          continue
        }
        throw new Error('模型输出异常终止: ' + failureText)
      }
      if (round.acc.trim()) texts.push(round.acc.trim())
      if (round.rAcc.trim()) reasonings.push(round.rAcc.trim())
      // max-tokens：丢弃全部工具块（截断的工具调用不可安全执行），以已有文本收尾
      if (round.maxTokens) break
      if (run.stopping) break
      // 中断（stop break）时半成品工具调用随循环退出整体丢弃
      if (round.tcs.length === 0) break
      // 回注契约（TOOLS.md §3.3）：assistant 消息（text + tool-call 块）在前，每工具一条 user-role 结果消息在后
      const assistantContent: Message['content'] = []
      if (round.acc.trim()) assistantContent.push({ type: 'text', text: round.acc })
      for (const tc of round.tcs) assistantContent.push({ type: 'tool-call', id: tc.id as WireToolCallId, name: tc.name, arguments: tc.args })
      msgs.push({ id: ('g' + core.revision + '-a' + msgs.length) as Message['id'], role: 'assistant', content: assistantContent, source: { kind: 'model', provider: role.provider, model: role.model } })
      for (const tc of round.tcs) {
        if (run.stopping) break
        const res = await tools.executeTool(g, wsRoot!, tc)
        const output = String(res.output || '')
        toolCalls.push({ tool: tc.name, args: res.args, status: res.status, output, durationMs: res.durationMs })
        budgetUsed += Math.max(output.length, TOOL_FLOOR_COST_CHARS)
        msgs.push({
          id: ('g' + core.revision + '-t' + msgs.length) as Message['id'],
          role: 'user',
          content: [{ type: 'tool-result', toolCallId: tc.id as WireToolCallId, content: [{ type: 'text', text: output || '（无输出）' }], isError: res.status === 'error' }],
          source: { kind: 'tool', callId: tc.id as WireToolCallId },
        })
        // 死循环检测（B1）：连续空输出或与上一次完全相同的调用
        const sig = tc.name + '|' + tc.args + '|' + output
        const isRepeat = output === '' || (lastSig !== null && sig === lastSig)
        streak = isRepeat ? streak + 1 : 1
        lastSig = sig
      }
      if (budgetUsed >= TOOL_RESULTS_TOTAL_MAX) {
        wrapUp('已达工具结果累计上限')
        continue
      }
      if (streak >= TOOL_REPEAT_LIMIT) {
        wrapUp('检测到重复或空输出的工具调用')
        continue
      }
    }
    return { text: texts.join('\n\n').trim(), reasoning: reasonings.join('\n\n').trim() || undefined, toolCalls }
  }

  const runLoop = async (sess: SessionRecord): Promise<void> => {
    const g = groups.get(sess.groupId)
    const startCount = sess.messageIds.length
    try {
      while (run.queue.length > 0 && !run.stopping) {
        const roleId = run.queue.shift()!
        const role = roles.get(roleId)
        run.currentRoleId = roleId
        run.partial = ''
        run.partialReasoning = ''
        touch()
        if (!role) continue
        try {
          const out = await speak(g!, sess, role)
          // 停止后不落部分消息（已有「已停止本次对话」系统消息承接）
          if (!run.stopping && (out.text || (Array.isArray(out.toolCalls) && out.toolCalls.length > 0))) {
            appendMessage(sess, role.id, out.text, { model: role.provider + ' / ' + role.model, reasoning: out.reasoning, toolCalls: out.toolCalls })
          }
        } catch (e) {
          appendMessage(sess, 'system', '角色「' + role.name + '」发言失败：' + String((e && (e as Error).message) || e), { error: true })
          break
        }
      }
      if (run.stopping) appendMessage(sess, 'system', '已停止本次对话', {})
    } finally {
      run.running = false
      run.sessionId = null
      run.currentRoleId = null
      run.partial = ''
      run.partialReasoning = ''
      run.queue = []
      run.pendingConfirm = null
      run.confirmSignal = null
      run.childProc = null
      run.stopping = false
      touch()
    }
    // 本轮有新消息落盘 → 后台整理标题/主题（fire-and-forget，不产生消息、静默失败）
    if (sess.messageIds.length > startCount) void retitle(sess)
  }

  return { appendMessage, runLoop }
}
