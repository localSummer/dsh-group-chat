/**
 * 群聊宿主服务（组合根）：装配各层模块并暴露对路由/入口的面。
 * 目录分层（对齐 src/client 的分层模式：每层一目录 + index.ts barrel）：
 *   state.ts       共享状态容器（四张表 + run + 可变槽位；kernel，根级）
 *   broadcast.ts   SSE 广播（节流）+ touch + 全量快照（kernel 读模型，根级）
 *   persistence/   持久化（store 文件原语 + 脏标记合并落盘 + 启动恢复）
 *   materials/     资料读取与路径解析 + 目录浏览器
 *   tools/         工具执行（沙箱 + 确认闸门）
 *   engine/        对话引擎（conversation：speak/runLoop；retitle：标题整理；fold：窗口外约束）
 *   api/           HTTP 传输（http 护栏 + routes 路由）与动作分发（actions）
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
    /** 卸载/热重载：唤醒确认等待 + kill 子进程 → 异步最终 flush → 释放锁（cordis 会 await）。 */
    dispose(): Promise<void>;
}
/**
 * 创建群聊宿主服务（装配各模块；持久化锁失败时降级内存态运行）。
 */
export declare function createGroupChatService(ctx: Context): GroupChatService;
