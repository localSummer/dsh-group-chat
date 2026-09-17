/**
 * 群聊数据模型（core 层，无 cordis 依赖）。
 * 数据模型：Group 1..N Session，消息挂在会话上；角色与工作区目录挂在群组上。
 * @module dsh-group-chat/core/types
 */
/** 群组：角色与工作区目录的宿主。 */
export interface GroupRecord {
    id: string;
    name: string;
    workspaceDir: string;
    allowCommands?: boolean;
    roleIds: string[];
    sessionIds: string[];
}
/** 会话：消息挂在会话上。 */
export interface SessionRecord {
    id: string;
    groupId: string;
    name: string;
    topic: string;
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
    };
    lastCreated: LastCreated | null;
    groups: {
        id: string;
        name: string;
        workspaceDir: string;
        allowCommands: boolean;
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
    allowed?: boolean;
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
