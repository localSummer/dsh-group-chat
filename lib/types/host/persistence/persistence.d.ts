/**
 * 持久化（PERSISTENCE.md v2.1）：事件驱动脏标记合并落盘 + 启动恢复。
 * 锁失败/写失败时降级为内存态运行（console 告警）。
 * @module dsh-group-chat/host/persistence
 */
import type { HostState } from '../state.ts';
/** 持久化面。 */
export interface Persistence {
    /** 事件驱动落盘；同一 tick 内多次变更合并为一次写。 */
    schedulePersist: (targets?: {
        ledger?: boolean;
        session?: string | null;
        roles?: string | null;
        workspace?: string | null;
    }) => void;
    /** 同步 flush：写全部脏文件（dispose 最终落盘用）。 */
    flushNow: () => void;
    /** 删除群组/会话后摘除脏标记（对应文件已删/将删，flush 跳过）。 */
    dropDirty: (targets: {
        session?: string | null;
        roles?: string | null;
        workspace?: string | null;
    }) => void;
    /** dispose：同步最终 flush → 释放锁 → 摘除句柄。 */
    release: () => void;
}
/**
 * 创建持久化面：构造即完成 store 初始化 + hydrate（v1 迁移 → 残留清理 →
 * 清单 → 群组数据 → 会话文件；缺文件空重建；补建默认会话/群组立即落盘）。
 */
export declare function createPersistence(core: HostState): Persistence;
