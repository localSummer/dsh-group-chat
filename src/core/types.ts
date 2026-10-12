/**
 * 群聊数据模型（core 层，无 cordis 依赖）。
 * 数据模型：Group 1..N Session，消息挂在会话上；角色与工作区目录挂在群组上。
 * @module dsh-group-chat/core/types
 */

import type { ImageAttachmentRef, ImageMediaType } from '@deepseek-ai/dsh-attachment'

/**
 * 群组权限档位（对齐主会话 /permission 三档）：
 * - view_only 仅可查看：只保留 read_file/list_dir，run_command 从 schema 剔除
 * - workspace_write 工作区内修改：run_command 可用，每条命令逐条确认
 * - full_access 完全权限：run_command 免确认直接执行
 */
export type PermissionTier = 'view_only' | 'workspace_write' | 'full_access'

/** 全部合法档位（展示顺序）。 */
export const PERMISSION_TIERS: readonly PermissionTier[] = ['view_only', 'workspace_write', 'full_access']

/** 档位安全化：合法字符串原样，其余 undefined。 */
export function asPermissionTier(value: unknown): PermissionTier | undefined {
  return typeof value === 'string' && (PERMISSION_TIERS as readonly string[]).includes(value) ? value as PermissionTier : undefined
}

/**
 * ledger 行档位归一（v2→v3 兼容）：显式 permissionTier 优先；
 * 缺失时按旧布尔迁移——allowCommands=true → workspace_write（今日语义即
 * 「可执行命令但逐条确认」），false/无字段 → view_only。
 */
export function migrateTier(permissionTier: unknown, allowCommands: unknown): PermissionTier {
  const tier = asPermissionTier(permissionTier)
  if (tier !== undefined) return tier
  return allowCommands === true ? 'workspace_write' : 'view_only'
}

/** 群组：角色与工作区目录的宿主。 */
export interface GroupRecord {
  id: string
  name: string
  workspaceDir: string
  permissionTier: PermissionTier
  roleIds: string[]
  sessionIds: string[]
}

/** 会话约束条目类型（窗口外结论/约束备忘）。 */
export type ConstraintKind = 'decided' | 'rejected' | 'open'

/** 全部合法约束类型。 */
export const CONSTRAINT_KINDS: readonly ConstraintKind[] = ['decided', 'rejected', 'open']

/** 合法 kind 原样，其余 undefined。 */
export function asConstraintKind(value: unknown): ConstraintKind | undefined {
  return typeof value === 'string' && (CONSTRAINT_KINDS as readonly string[]).includes(value) ? value as ConstraintKind : undefined
}

/** 一条无主结论/约束（已定 / 否决 / 未决）。 */
export interface SessionConstraint {
  kind: ConstraintKind
  text: string
}

/** 会话：消息挂在会话上。 */
export interface SessionRecord {
  id: string
  groupId: string
  name: string
  topic: string
  /** 名称已被手动编辑：自动命名永久跳过（隐式固定）。 */
  namePinned?: boolean
  /** 主题已被手动编辑：自动整理永久跳过（隐式固定）。 */
  topicPinned?: boolean
  /** 窗口外结论/约束备忘；空则省略。 */
  constraints?: SessionConstraint[]
  /** 已折入备忘的最大消息 seq；0/缺省 = 尚未折过。 */
  constraintsUpToSeq?: number
  messageIds: string[]
  createdAt: number
}

/** 角色：绑定 provider/model 的群成员身份。 */
export interface RoleRecord {
  id: string
  groupId: string
  name: string
  color?: string
  persona: string
  provider: string
  model: string
  temperature?: number
  reasoningEffort?: string
  enabled: boolean
  thinking: boolean
}

/** 一次工具调用的落盘/快照形态（TOOLS.md §3.3 回注契约的展示面）。 */
export interface ToolCallRecord {
  tool: string
  args: unknown
  status: string
  output: string
  durationMs?: number
}

/** 消息表情回应白名单（用户标注用；单用户无计数，顺序即展示顺序）。 */
export const REACTION_EMOJIS: readonly string[] = ['👍', '👎', '❤️', '😂', '🤔', '🎉']

/** 回应集合安全化：仅保留白名单内条目、去重并按白名单顺序排列；空则 undefined。 */
export function sanitizeReactions(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const set = new Set<string>()
  for (const e of value) {
    if (typeof e === 'string' && REACTION_EMOJIS.includes(e)) set.add(e)
  }
  if (!set.size) return undefined
  return REACTION_EMOJIS.filter((e) => set.has(e))
}

/** 单条 durable 图片引用安全化：字段齐全且 mediaType 在合法集内才保留。 */
function sanitizeImageRef(value: unknown): ImageAttachmentRef | undefined {
  if (!value || typeof value !== 'object') return undefined
  const r = value as Partial<ImageAttachmentRef>
  const mediaType = asImageMediaType(r.mediaType)
  if (typeof r.attachmentId !== 'string' || !r.attachmentId || mediaType === undefined) return undefined
  if (typeof r.bytes !== 'number' || typeof r.width !== 'number' || typeof r.height !== 'number') return undefined
  return {
    attachmentId: r.attachmentId as ImageAttachmentRef['attachmentId'],
    mediaType,
    bytes: r.bytes,
    width: r.width,
    height: r.height,
    ...(typeof r.name === 'string' && r.name ? { name: r.name } : {}),
    ...(r.originalDimensions ? { originalDimensions: r.originalDimensions } : {}),
  }
}

/** 图片引用集合安全化（hydrate 用）：丢弃残缺条目；空则 undefined。 */
export function sanitizeImages(value: unknown): ImageAttachmentRef[] | undefined {
  if (!Array.isArray(value)) return undefined
  const out: ImageAttachmentRef[] = []
  for (const item of value) {
    const ref = sanitizeImageRef(item)
    if (ref) out.push(ref)
  }
  return out.length ? out : undefined
}

/** 消息（user / system / 角色发言共用一条记录）。 */
export interface MessageRecord {
  id: string
  sessionId: string
  seq: number
  speaker: string
  text: string
  reasoning?: string
  reasoningFull?: string
  thinkingSummary?: string
  model?: string
  error?: boolean
  /** 发言失败时的角色 id；刷新后仍可对该条点重试。角色消息 speaker 即角色 id，此字段冗余兼容旧系统错误行。 */
  failedRoleId?: string
  toolCalls?: ToolCallRecord[]
  /** 用户表情回应集合（仅标注展示，不注入角色上下文）。 */
  reactions?: string[]
  /** 该次发言的生成总耗时（回话开始 turnStartedAt → 落卡时刻），毫秒；用户/系统消息无。 */
  durationMs?: number
  /**
   * 图片附件：durable 引用（字节由 harness attachment 服务持有，本插件只存 ref）。
   * 仅用户消息携带；注入角色上下文时按 provider 能力翻译或降级为文本占位。
   */
  images?: ImageAttachmentRef[]
  ts: number
}

/** run_command 确认闸门的待确认载荷。 */
export interface PendingConfirm {
  toolCallId: string
  tool: string
  args: { command?: string } & Record<string, unknown>
}

/** 最近一次创建的群组/会话，供客户端定位选中项。 */
export interface LastCreated {
  kind: 'group' | 'session'
  groupId: string
  sessionId: string
}

/** run 结束后的「输出完毕」标记（内存态不持久化，重启即清；reason 取 ok/error）。 */
export interface RunFinished {
  sessionId: string
  reason: 'ok' | 'error'
}

/** 对话进行时状态（run）。 */
export interface RunState {
  running: boolean
  sessionId: string | null
  currentRoleId: string | null
  partial: string
  partialReasoning: string
  stopping: boolean
  /** 本次 run 的完整发言计划（轮次 × 参与角色，顺序展开）；run 结束清空。 */
  queue: string[]
  /** 发言游标：下一个待发言位置的索引（queueIndex - 1 = 正在/最近发言的步）。 */
  queueIndex: number
  /** 当前发言人回合的开始时刻（进度轨道运行计时锚点，对齐主会话 TurnStatus 的 turn.start.time）；run 结束清 null。 */
  turnStartedAt: number | null
  pendingConfirm: PendingConfirm | null
  confirmSignal: { resolve: (allowed: boolean) => void } | null
  /** 正在执行的 run_command 的中止句柄（stop/dispose 时 abort，执行器 kill 进程）。 */
  commandAbort: AbortController | null
  /** 最近一次 run 的结束标记：会话列表「已完成/已出错」状态的数据源。 */
  finished: RunFinished | null
  /** 原地重试时被覆盖的失败消息 id；普通 send 为 null。 */
  replaceMessageId: string | null
  /**
   * 本次 run 携带的图片引用（来自触发 run 的那条用户消息）。挂在 run 上而非
   * 「最后一条消息」：多角色轮次里第二个发言人之前最后一条已是角色消息，
   * 按最后一条取会丢图。run 结束清空。
   */
  imageRefs: ImageAttachmentRef[]
}

/** 角色发言的引擎产物。 */
export interface SpeakResult {
  text: string
  reasoning: string | undefined
  toolCalls: ToolCallRecord[]
}

/** 工具执行结果（host 内部约定）。 */
export interface ToolExecution {
  status: 'ok' | 'error' | 'denied'
  output: string
  args: Record<string, unknown>
  durationMs: number
}

/** 模型目录（models action 的缓存载荷）。 */
export interface ModelCatalog {
  at: number
  providers: { id: string; name: string }[]
  /**
   * 各 provider 下的模型。`inputModalities` 由 harness 原样透传（来自 provider
   * 配置的 `input: [text, image]`），是「该模型能否看图」的权威能力位；
   * 缺省表示未知（不当作不支持）。
   */
  modelsByProvider: Record<string, { id: string; name?: string; inputModalities?: readonly string[] }[]>
}

/** 推理级别选项（efforts action 的载荷）。 */
export interface EffortOptions {
  efforts: { id: string, name: string, description?: string }[]
  defaultEffort: string | undefined
  error?: string
}

/** 目录浏览结果（browse action 的载荷）。 */
export interface BrowseResult {
  ok: boolean
  path?: string
  home?: string
  parent?: string
  entries?: { name: string, type: string, path: string, size?: number, hidden: boolean }[]
  error?: string
}

/** 群工作区 @ 文件检索结果（fileSearch action 的载荷）。 */
export interface FileSearchResult {
  ok: boolean
  candidates?: { path: string, isDir: boolean }[]
  error?: string
}

/** 快照内的会话行（wire 形态：不含 hydrate 用的固定标记与折入水位）。 */
export type SnapshotSession = Omit<SessionRecord, 'namePinned' | 'topicPinned' | 'constraintsUpToSeq'>
/** 快照内的消息行（wire 形态：思考全文与摘要不外发）。 */
export type SnapshotMessage = Omit<MessageRecord, 'reasoningFull' | 'thinkingSummary'>

/** 发到客户端的全量快照（wire 形态；各表行由领域记录派生，字段增删由编译器同步）。 */
export interface Snapshot {
  revision: number
  /** run 的 wire 形态：暴露完整 queue + queueIndex 供进度轨道渲染。 */
  run: Omit<RunState, 'stopping' | 'confirmSignal' | 'commandAbort'>
  lastCreated: LastCreated | null
  groups: GroupRecord[]
  sessions: SnapshotSession[]
  roles: RoleRecord[]
  messages: SnapshotMessage[]
  error?: string
}

/** mutate 动作的参数形态（判别联合：按 op 收窄各分支字段；wire 上字段可缺，消费方各自守卫）。 */
export type MutateArgs =
  | { op: 'createGroup', name?: string }
  | { op: 'renameGroup', groupId: string, name?: string }
  | { op: 'deleteGroup', groupId: string }
  | { op: 'createSession', groupId: string, name?: string }
  | { op: 'renameSession', sessionId: string, name?: string }
  | { op: 'deleteSession', sessionId: string }
  | { op: 'setTopic', sessionId: string, topic?: string }
  | { op: 'upsertRole', groupId: string, role?: Partial<RoleRecord> }
  | { op: 'deleteRole', roleId: string }
  | { op: 'setRoleEnabled', roleId: string, enabled?: boolean }
  | { op: 'setWorkspaceDir', groupId: string, path?: string }
  | { op: 'setPermissionTier', groupId: string, tier?: string }
  | { op: 'ackFinish' }
  | { op: 'clearMessages', sessionId: string }
  | { op: 'reactMessage', messageId: string, emoji?: string }

/** send 动作的参数形态。 */
export interface SendArgs {
  sessionId: string
  text?: string
  /** 已上传的图片引用（先经 upload 动作落 durable ref，再随 send 提交）。 */
  images?: ImageAttachmentRef[]
  participantRoleIds?: string[]
  rounds?: number
}

/** upload 动作的响应：落盘后的 durable 引用。 */
export interface UploadResult {
  ok: boolean
  image?: ImageAttachmentRef
  error?: string
}

/** 图片上传的合法 mediaType 白名单（与 harness ImageMediaType 一致，挡 SVG 等可执行格式）。 */
export const IMAGE_MEDIA_TYPES: readonly ImageMediaType[] = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

/** mediaType 安全化：白名单内原样，其余 undefined。 */
export function asImageMediaType(value: unknown): ImageMediaType | undefined {
  return typeof value === 'string' && (IMAGE_MEDIA_TYPES as readonly string[]).includes(value) ? value as ImageMediaType : undefined
}

/** 可选数值参数安全化：数字则原样，否则 undefined。 */
export function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && !Number.isNaN(value) ? value : undefined
}

/** 可选字符串参数安全化：非 default 的非空字符串则原样，否则 undefined。 */
export function asEffort(value: unknown): string | undefined {
  return typeof value === 'string' && value && value !== 'default' ? value : undefined
}
