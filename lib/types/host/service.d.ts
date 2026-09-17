/**
 * 群聊宿主服务：状态机 + 持久化调度 + 对话引擎（llm 流式 + 工具执行）。
 *
 * 状态机：groups / sessions / roles / messages 四张表 + run（对话进行时
 * 状态）；变更后 touch()（revision++ + 节流广播）。持久化走脏标记合并
 * 落盘（PERSISTENCE.md v2.1，见 host/store.ts）。
 *
 * 动作分发（handleAction，POST /api/group-chat/action 的载荷）：
 *   mutate | send | stop | confirmCommand | models | efforts | browse
 * @module dsh-group-chat/host/service
 */
import type { Context } from '@deepseek-ai/cordis';
import type { Snapshot } from '../core/types.ts';
/** 服务对路由/入口暴露的面。 */
export interface GroupChatService {
    snapshot(): Snapshot;
    handleAction(body: unknown): Promise<unknown>;
    subscribePush(push: () => void): () => void;
    /** 设置停用时中止正在进行的群聊。 */
    stopAll(): void;
    /** 卸载/热重载：唤醒确认等待 + kill 子进程 → 同步最终 flush → 释放锁。 */
    dispose(): void;
}
/**
 * 创建群聊宿主服务。锁失败/写失败时降级为内存态运行（console 告警）。
 */
export declare function createGroupChatService(ctx: Context): GroupChatService;
