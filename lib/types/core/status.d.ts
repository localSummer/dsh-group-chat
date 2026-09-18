/**
 * 会话状态派生（纯函数）：从快照 run 派生单个会话的列表状态，
 * 语义对齐 DSH 主会话列表（StateDot 五态取四）。
 *
 * 优先级：等待确认 > 进行中 > 已完成/已出错 > 默认（无点）。
 * - ongoing：run 进行中（含用户已点停止但未停完的 stopping 窗口）
 * - warning：run_command 确认闸门挂起（仅工作区内修改档）
 * - done/error：run 结束后的「输出完毕」标记（正常/停止 → done，发言失败 → error）
 * - idle：无任何活动（不渲染状态点，对齐主 GUI idle 隐藏）
 * @module dsh-group-chat/core/status
 */
import type { Snapshot } from './types.ts';
/** 会话列表状态（取值即 StateDotState 的渲染态）。 */
export type SessStatus = 'idle' | 'ongoing' | 'warning' | 'done' | 'error';
/** 状态点悬停/读屏文案（idle 不渲染点，无文案）。 */
export declare const SESS_STATUS_LABEL: Record<SessStatus, string>;
/** 派生单个会话的列表状态（run 为快照的 run 视图）。 */
export declare function sessStatus(run: Snapshot['run'], sessionId: string): SessStatus;
