/**
 * 浏览器半共享常量与小工具（纯函数，无 React 依赖）。
 * @module dsh-group-chat/client/model
 */
import type { Snapshot } from '../../core/types.ts';
/** 会话列表状态派生与文案（core 纯函数，供 NavPanel 渲染）。 */
export { sessStatus, SESS_STATUS_LABEL, type SessStatus } from '../../core/status.ts';
/** 角色标识色调色板（与宿主半一致）。 */
export declare const PALETTE: string[];
/** Host HTTP API 前缀。 */
export declare const API_PREFIX = "/api/group-chat";
/** MarkdownText 渲染文案。 */
export declare const MD_LABELS: Readonly<{
    code: {
        copyLabel: string;
        copiedLabel: string;
    };
    footnotes: "脚注";
}>;
/** 快照的 wire 形态（响应里带 ok 标记）。 */
export type ClientSnapshot = Snapshot & {
    ok: boolean;
};
/** models action 的响应形态。 */
export interface ModelsResponse {
    ok: boolean;
    providers?: {
        id: string;
        name?: string;
    }[];
    modelsByProvider?: Record<string, {
        id: string;
        name?: string;
    }[]>;
    error?: string;
}
/** efforts action 的响应形态。 */
export interface EffortsResponse {
    ok: boolean;
    efforts?: {
        id: string;
        name: string;
        description?: string;
    }[];
    defaultEffort?: string;
    error?: string;
}
/** 快照内的角色/会话/群组视图行。 */
export type SnapshotRole = Snapshot['roles'][number];
export type SnapshotSession = Snapshot['sessions'][number];
export type SnapshotGroup = Snapshot['groups'][number];
export type SnapshotMessage = Snapshot['messages'][number];
export declare function roleById(s: ClientSnapshot, id: string | null): SnapshotRole | null;
export declare function sessById(s: ClientSnapshot, id: string): SnapshotSession | null;
export declare function groupById(s: ClientSnapshot, id: string): SnapshotGroup | null;
export declare function escapeRegExp(v: string): string;
export declare function firstLine(text: string): string;
export declare function latestLine(text: string): string;
/** 消息绝对时钟（对齐主会话 formatMessageClock / clock.md / clock.ymd zh 模板）：
 * 同日 → HH:mm；同年更早 → M月D日 HH:mm；跨年 → Y年M月D日 HH:mm。
 * 绝对时钟不随时间推移失真——Bubble 值比较 memo 冻结首渲字符串无害。 */
export declare function fmtClock(ts: number): string;
/** 发言生成总耗时（对齐插件内 ToolRow 耗时语汇 + 轨道计时的分钟段）：
 * <1s → `800ms`；<60s → `3.2s`（一位小数）；≥60s → `1分58秒`（秒补零 2 位）。 */
export declare function fmtSpeakDuration(ms: number): string;
/** 角色编辑抽屉的草稿形态（编辑与新建共用）。 */
export interface RoleDraft {
    id?: string;
    name: string;
    color: string | null;
    persona: string;
    provider: string;
    model: string;
    temperature?: number;
    reasoningEffort: string;
    enabled?: boolean;
    thinking: boolean;
}
export declare function draftFromRole(role: SnapshotRole): RoleDraft;
export declare function blankDraft(): RoleDraft;
