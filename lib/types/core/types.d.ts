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
    childProc: import('node:child_process').ChildProcess | null;
    /** 最近一次 run 的结束标记：会话列表「已完成/已出错」状态的数据源。 */
    finished: RunFinished | null;
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
/** 发到客户端的全量快照（wire 形态）。 */
export interface Snapshot {
    revision: number;
    run: {
        running: boolean;
        sessionId: string | null;
        currentRoleId: string | null;
        partial: string;
        partialReasoning: string;
        pendingConfirm: PendingConfirm | null;
        finished: RunFinished | null;
    };
    lastCreated: LastCreated | null;
    groups: {
        id: string;
        name: string;
        workspaceDir: string;
        permissionTier: PermissionTier;
        roleIds: string[];
        sessionIds: string[];
    }[];
    sessions: {
        id: string;
        groupId: string;
        name: string;
        topic: string;
        messageIds: string[];
        createdAt: number;
    }[];
    roles: {
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
    }[];
    messages: {
        id: string;
        sessionId: string;
        seq: number;
        speaker: string;
        text: string;
        reasoning?: string;
        model?: string;
        error?: boolean;
        toolCalls?: ToolCallRecord[];
        ts: number;
    }[];
    error?: string;
}
/** mutate 动作的参数形态（op 分发见 host/service）。 */
export interface MutateArgs {
    op: string;
    groupId?: string;
    sessionId?: string;
    roleId?: string;
    role?: Partial<RoleRecord>;
    name?: string;
    topic?: string;
    path?: string;
    tier?: string;
    enabled?: boolean;
}
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
