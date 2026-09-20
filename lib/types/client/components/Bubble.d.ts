/**
 * 聊天消息气泡（user / system / 角色发言）。
 *
 * 帧稳定 memo：SSE 全量快照（~65KB × 7fps）每帧重建全部消息对象 identity，
 * 但已完成消息在 host 侧 append 后不可变——按渲染相关字段做值比较，流式
 * 期间跳过已完成消息的重渲（每帧仅 live 行与派生列表变化），避免全量
 * MarkdownText 重新解析打满主线程导致「卡死后一次性蹦出」。
 * @module dsh-group-chat/client/Bubble
 */
import { type ReactNode } from 'react';
import { type SnapshotRole } from '../lib/model.ts';
import type { SnapshotMessage } from '../lib/model.ts';
export interface BubbleProps {
    m: SnapshotMessage;
    /** 父级解析好的发言角色（user/system 消息为 null）——避免 Bubble 依赖 snap identity。 */
    role: SnapshotRole | null;
    busy?: boolean;
    onRetry?: (messageId: string) => void;
    /** 表情回应（用户标注）经稳定回调下传；失败卡与系统通知不提供。 */
    onToggleReaction?: (messageId: string, emoji: string) => void;
}
declare function BubbleInner({ m, role, busy, onRetry, onToggleReaction }: BubbleProps): ReactNode;
export declare const Bubble: import("react").MemoExoticComponent<typeof BubbleInner>;
export {};
