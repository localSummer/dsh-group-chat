/**
 * SSE 广播（节流）+ touch + 全量快照：变更经 touch()（revision++ + 节流广播）
 * 通知 /api/group-chat/events 订阅者；快照读容器当前状态。
 * @module dsh-group-chat/host/broadcast
 */
import type { HostState } from './state.ts';
import type { Snapshot } from '../core/types.ts';
/** 广播面。 */
export interface Broadcast {
    /** revision++ 并节流广播。 */
    touch: () => void;
    /** 全量快照（客户端唯一读取面）。 */
    snapshot: () => Snapshot;
    /** 订阅推送；返回退订函数。 */
    subscribePush: (push: () => void) => () => void;
    /** dispose：清掉挂起的节流定时器。 */
    dispose: () => void;
}
/** 创建广播面。 */
export declare function createBroadcast(core: HostState): Broadcast;
