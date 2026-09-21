/**
 * SSE 广播（节流）+ touch + 全量快照：变更经 touch()（revision++ + 节流广播）
 * 通知 /api/group-chat/events 订阅者；快照读容器当前状态。
 * @module dsh-group-chat/host/broadcast
 */

import type { HostState } from './state.ts'
import type { Snapshot } from '../core/types.ts'

/** SSE 推送节流。 */
const PUSH_THROTTLE_MS = 120

/** 广播面。 */
export interface Broadcast {
  /** revision++ 并节流广播。 */
  touch: () => void
  /** 全量快照（客户端唯一读取面）。 */
  snapshot: () => Snapshot
  /** 订阅推送；返回退订函数。 */
  subscribePush: (push: () => void) => () => void
  /** dispose：清掉挂起的节流定时器。 */
  dispose: () => void
}

/** 创建广播面。 */
export function createBroadcast(core: HostState): Broadcast {
  const subscribers = new Set<() => void>()
  let pushTimer: ReturnType<typeof setTimeout> | null = null
  const broadcast = (): void => {
    if (pushTimer !== null) return
    pushTimer = setTimeout(() => {
      pushTimer = null
      for (const push of subscribers) push()
    }, PUSH_THROTTLE_MS)
  }

  const touch = (): void => {
    core.revision++
    broadcast()
  }

  const snapshot = (): Snapshot => ({
    revision: core.revision,
    run: { running: core.run.running, sessionId: core.run.sessionId, currentRoleId: core.run.currentRoleId, partial: core.run.partial, partialReasoning: core.run.partialReasoning, queue: core.run.queue.slice(), queueIndex: core.run.queueIndex, turnStartedAt: core.run.turnStartedAt, pendingConfirm: core.run.pendingConfirm, finished: core.run.finished, replaceMessageId: core.run.replaceMessageId },
    lastCreated: core.lastCreated,
    groups: [...core.groups.values()].map((g) => ({ id: g.id, name: g.name, workspaceDir: g.workspaceDir, permissionTier: g.permissionTier, roleIds: g.roleIds.slice(), sessionIds: g.sessionIds.slice() })),
    sessions: [...core.sessions.values()].map((s) => ({ id: s.id, groupId: s.groupId, name: s.name, topic: s.topic, ...(s.constraints && s.constraints.length ? { constraints: s.constraints } : {}), messageIds: s.messageIds.slice(), createdAt: s.createdAt })),
    roles: [...core.roles.values()].map((r) => ({ id: r.id, groupId: r.groupId, name: r.name, color: r.color, persona: r.persona, provider: r.provider, model: r.model, temperature: r.temperature, reasoningEffort: r.reasoningEffort, enabled: r.enabled, thinking: r.thinking === true })),
    messages: [...core.messages.values()].map((m) => ({ id: m.id, sessionId: m.sessionId, seq: m.seq, speaker: m.speaker, text: m.text, reasoning: m.reasoning, model: m.model, error: m.error, failedRoleId: m.failedRoleId, toolCalls: m.toolCalls, reactions: m.reactions, durationMs: m.durationMs, ts: m.ts })),
  })

  return {
    touch,
    snapshot,
    subscribePush(push: () => void): () => void {
      subscribers.add(push)
      return () => {
        subscribers.delete(push)
      }
    },
    dispose(): void {
      if (pushTimer !== null) clearTimeout(pushTimer)
    },
  }
}
