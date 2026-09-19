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
export declare function fmtTime(ts: number): string;
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
