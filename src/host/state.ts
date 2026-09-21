/**
 * 群聊宿主服务共享状态容器：四张表 + run（对话进行时状态）+ 可变槽位
 * （store / revision / idSeq / lastCreated）。各功能模块（persistence /
 * broadcast / materials / tools / conversation / actions）以工厂装配到同一
 * 容器上，模块间只经显式依赖传递；容器本身只含数据与稳定引用，不含行为。
 * @module dsh-group-chat/host/state
 */

import { randomUUID } from 'node:crypto'
import type { Context } from '@deepseek-ai/cordis'
// 类型合并：ctx.llm / ctx.fs / ctx.shell / ctx.workspaceRegistry（宿主面）
import type {} from '@deepseek-ai/dsh-llm'
import type {} from '@deepseek-ai/dsh-fs'
import type {} from '@deepseek-ai/dsh-shell'
import type {} from '@deepseek-ai/dsh-workspace'
import type { Store } from './persistence/store.ts'
import type { GroupRecord, LastCreated, MessageRecord, RoleRecord, RunState, SessionRecord } from '../core/types.ts'

// 可选类型镜像：DSH 默认模型选择服务（宿主 agent 栈提供）。不硬依赖该包、
// 不加入 inject（服务缺位时插件照常加载），运行时缺位则自动命名静默跳过。
// 消费必须经 ctx.reflect.get（见 engine/retitle.ts）：cordis 对未 inject 的
// 属性访问直接抛错（"cannot get property without inject"），`?.` 接不住。
declare module '@deepseek-ai/cordis' {
  interface Context {
    agentDefaultModel?: { currentSelection(): { provider: string, model: string } }
  }
}

/** 角色标识色板（新增角色依序取色）。 */
export const PALETTE = ['#5b8def', '#22a06b', '#e8912d', '#c678dd', '#e05661', '#56b6c2', '#98c379', '#d19a66']

/** 新建会话默认名称（自动标题只在仍为此占位名时生成一次）。 */
export const DEFAULT_SESSION_NAME = '新会话'

/** 宿主服务共享状态容器（见模块注释；可变原始值一律经 core.* 访问）。 */
export interface HostState {
  ctx: Context
  llm: Context['llm']
  fs: Context['fs']
  shell: Context['shell']
  groups: Map<string, GroupRecord>
  sessions: Map<string, SessionRecord>
  roles: Map<string, RoleRecord>
  messages: Map<string, MessageRecord>
  run: RunState
  /** 持久化句柄；锁失败降级内存态为 null，dispose 后置 null。 */
  store: Store | null
  /** 快照版本号：touch() 递增。 */
  revision: number
  /** id 序号（hydrate 后推进到历史最大值 + 1）。 */
  idSeq: number
  nid: (p: string) => string
  /** 最近一次创建的群组/会话，供客户端定位选中项。 */
  lastCreated: LastCreated | null
  newSession: (groupId: string, name?: string) => SessionRecord
}

/** 创建共享状态容器（仅数据与稳定引用，不含行为）。 */
export function createHostState(ctx: Context): HostState {
  const core: HostState = {
    ctx,
    llm: ctx.llm,
    fs: ctx.fs,
    shell: ctx.shell,
    groups: new Map(),
    sessions: new Map(),
    roles: new Map(),
    messages: new Map(),
    run: { running: false, sessionId: null, currentRoleId: null, partial: '', partialReasoning: '', stopping: false, queue: [], queueIndex: 0, turnStartedAt: null, pendingConfirm: null, confirmSignal: null, commandAbort: null, finished: null, replaceMessageId: null },
    store: null,
    revision: 1,
    idSeq: 1,
    nid: (p: string): string => p + '-' + (core.idSeq++),
    lastCreated: null,
    newSession: (groupId: string, name?: string): SessionRecord => {
      const s: SessionRecord = {
        id: randomUUID(),
        groupId,
        name: name || DEFAULT_SESSION_NAME,
        topic: '',
        messageIds: [],
        createdAt: Date.now(),
      }
      core.sessions.set(s.id, s)
      return s
    },
  }
  return core
}
