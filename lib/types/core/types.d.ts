/**
 * 群聊数据模型（core 层，无 cordis 依赖）。
 * 数据模型：Group 1..N Session，消息挂在会话上；角色与工作区目录挂在群组上。
 * @module dsh-group-chat/core/types
 */
/**
 * 群组权限档位（对齐主会话 /permission 三档）：
 * - view_only 仅可查看：只保留 read_file/list_dir，run_command 从 schema 剔除
 * - workspace_write 工作区内修改：run_command 可用，每条命令逐条确认
 * - full_access 完全权限：run_command 免确认直接执行
 */
export type PermissionTier = 'view_only' | 'workspace_write' | 'full_access';
/** 全部合法档位（展示顺序）。 */
export declare const PERMISSION_TIERS: readonly PermissionTier[];
/** 档位安全化：合法字符串原样，其余 undefined。 */
export declare function asPermissionTier(value: unknown): PermissionTier | undefined;
/**
 * ledger 行档位归一（v2→v3 兼容）：显式 permissionTier 优先；
 * 缺失时按旧布尔迁移——allowCommands=true → workspace_write（今日语义即
 * 「可执行命令但逐条确认」），false/无字段 → view_only。
 */
export declare function migrateTier(permissionTier: unknown, allowCommands: unknown): PermissionTier;
/** 群组：角色与工作区目录的宿主。 */
export interface GroupRecord {
    id: string;
    name: string;
    workspaceDir: string;
    permissionTier: PermissionTier;
    roleIds: string[];
    sessionIds: string[];
}
/** 会话约束条目类型（窗口外结论/约束备忘）。 */
export type ConstraintKind = 'decided' | 'rejected' | 'open';
/** 全部合法约束类型。 */
export declare const CONSTRAINT_KINDS: readonly ConstraintKind[];
/** 合法 kind 原样，其余 undefined。 */
export declare function asConstraintKind(value: unknown): ConstraintKind | undefined;
/** 一条无主结论/约束（已定 / 否决 / 未决）。 */
export interface SessionConstraint {
    kind: ConstraintKind;
    text: string;
}
/** 会话：消息挂在会话上。 */
export interface SessionRecord {
    id: string;
    groupId: string;
    name: string;
    topic: string;
    /** 名称已被手动编辑：自动命名永久跳过（隐式固定）。 */
    namePinned?: boolean;
    /** 主题已被手动编辑：自动整理永久跳过（隐式固定）。 */
    topicPinned?: boolean;
    /** 窗口外结论/约束备忘；空则省略。 */
    constraints?: SessionConstraint[];
    /** 已折入备忘的最大消息 seq；0/缺省 = 尚未折过。 */
    constraintsUpToSeq?: number;
    messageIds: string[];
    createdAt: number;
}
/** 角色：绑定 provider/model 的群成员身份。 */
export interface RoleRecord {
    id: string;
    groupId: string;
    name: string;
    color?: string;
    persona: string;
    provider: string;
    model: string;
    temperature?: number;
    reasoningEffort?: string;
    enabled: boolean;
    thinking: boolean;
}
/** 一次工具调用的落盘/快照形态（TOOLS.md §3.3 回注契约的展示面）。 */
export interface ToolCallRecord {
    tool: string;
    args: unknown;
    status: string;
    output: string;
    durationMs?: number;
}
/** 消息（user / system / 角色发言共用一条记录）。 */
export interface MessageRecord {
    id: string;
    sessionId: string;
    seq: number;
    speaker: string;
    text: string;
    reasoning?: string;
    reasoningFull?: string;
    thinkingSummary?: string;
    model?: string;
    error?: boolean;
    /** 发言失败时的角色 id；刷新后仍可对该条点重试。角色消息 speaker 即角色 id，此字段冗余兼容旧系统错误行。 */
    failedRoleId?: string;
    toolCalls?: ToolCallRecord[];
    ts: number;
}
/** run_command 确认闸门的待确认载荷。 */
export interface PendingConfirm {
    toolCallId: string;
    tool: string;
    args: {
        command?: string;
    } & Record<string, unknown>;
}
/** 最近一次创建的群组/会话，供客户端定位选中项。 */
export interface LastCreated {
    kind: 'group' | 'session';
    groupId: string;
    sessionId: string;
}
/** run 结束后的「输出完毕」标记（内存态不持久化，重启即清；reason 取 ok/error）。 */
export interface RunFinished {
    sessionId: string;
    reason: 'ok' | 'error';
}
/** 对话进行时状态（run）。 */
export interface RunState {
    running: boolean;
    sessionId: string | null;
    currentRoleId: string | null;
    partial: string;
    partialReasoning: string;
    stopping: boolean;
    queue: string[];
    pendingConfirm: PendingConfirm | null;
    confirmSignal: {
        resolve: (allowed: boolean) => void;
    } | null;
    /** 正在执行的 run_command 的中止句柄（stop/dispose 时 abort，执行器 kill 进程）。 */
    commandAbort: AbortController | null;
    /** 最近一次 run 的结束标记：会话列表「已完成/已出错」状态的数据源。 */
    finished: RunFinished | null;
    /** 原地重试时被覆盖的失败消息 id；普通 send 为 null。 */
    replaceMessageId: string | null;
}
/** 角色发言的引擎产物。 */
export interface SpeakResult {
    text: string;
    reasoning: string | undefined;
    toolCalls: ToolCallRecord[];
}
/** 工具执行结果（host 内部约定）。 */
export interface ToolExecution {
    status: 'ok' | 'error' | 'denied';
    output: string;
    args: Record<string, unknown>;
    durationMs: number;
}
/** 模型目录（models action 的缓存载荷）。 */
export interface ModelCatalog {
    at: number;
    providers: {
        id: string;
        name: string;
    }[];
    modelsByProvider: Record<string, {
        id: string;
        name?: string;
    }[]>;
}
/** 推理级别选项（efforts action 的载荷）。 */
export interface EffortOptions {
    efforts: {
        id: string;
        name: string;
        description?: string;
    }[];
    defaultEffort: string | undefined;
    error?: string;
}
/** 目录浏览结果（browse action 的载荷）。 */
export interface BrowseResult {
    ok: boolean;
    path?: string;
    home?: string;
    parent?: string;
    entries?: {
        name: string;
        type: string;
        path: string;
        size?: number;
        hidden: boolean;
    }[];
    error?: string;
}
/** 群工作区 @ 文件检索结果（fileSearch action 的载荷）。 */
export interface FileSearchResult {
    ok: boolean;
    candidates?: {
        path: string;
        isDir: boolean;
    }[];
    error?: string;
}
/** 快照内的会话行（wire 形态：不含 hydrate 用的固定标记与折入水位）。 */
export type SnapshotSession = Omit<SessionRecord, 'namePinned' | 'topicPinned' | 'constraintsUpToSeq'>;
/** 快照内的消息行（wire 形态：思考全文与摘要不外发）。 */
export type SnapshotMessage = Omit<MessageRecord, 'reasoningFull' | 'thinkingSummary'>;
/** 发到客户端的全量快照（wire 形态；各表行由领域记录派生，字段增删由编译器同步）。 */
export interface Snapshot {
    revision: number;
    run: Omit<RunState, 'stopping' | 'queue' | 'confirmSignal' | 'commandAbort'>;
    lastCreated: LastCreated | null;
    groups: GroupRecord[];
    sessions: SnapshotSession[];
    roles: RoleRecord[];
    messages: SnapshotMessage[];
    error?: string;
}
/** mutate 动作的参数形态（判别联合：按 op 收窄各分支字段；wire 上字段可缺，消费方各自守卫）。 */
export type MutateArgs = {
    op: 'createGroup';
    name?: string;
} | {
    op: 'renameGroup';
    groupId: string;
    name?: string;
} | {
    op: 'deleteGroup';
    groupId: string;
} | {
    op: 'createSession';
    groupId: string;
    name?: string;
} | {
    op: 'renameSession';
    sessionId: string;
    name?: string;
} | {
    op: 'deleteSession';
    sessionId: string;
} | {
    op: 'setTopic';
    sessionId: string;
    topic?: string;
} | {
    op: 'upsertRole';
    groupId: string;
    role?: Partial<RoleRecord>;
} | {
    op: 'deleteRole';
    roleId: string;
} | {
    op: 'setRoleEnabled';
    roleId: string;
    enabled?: boolean;
} | {
    op: 'setWorkspaceDir';
    groupId: string;
    path?: string;
} | {
    op: 'setPermissionTier';
    groupId: string;
    tier?: string;
} | {
    op: 'ackFinish';
} | {
    op: 'clearMessages';
    sessionId: string;
};
/** send 动作的参数形态。 */
export interface SendArgs {
    sessionId: string;
    text?: string;
    participantRoleIds?: string[];
    rounds?: number;
}
/** 可选数值参数安全化：数字则原样，否则 undefined。 */
export declare function asNumber(value: unknown): number | undefined;
/** 可选字符串参数安全化：非 default 的非空字符串则原样，否则 undefined。 */
export declare function asEffort(value: unknown): string | undefined;
