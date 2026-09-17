/**
 * 持久化（PERSISTENCE.md v2.1：会话级文件隔离）。
 *
 * 目录布局（每群组一目录，一会话一文件）：
 *   <dir>/ledger.json                              群组/会话清单（schema 2，纯清单，pretty）
 *   <dir>/<group-id>/workspaceDir                  工作区目录设置（纯文本一行）
 *   <dir>/<group-id>/roles.json                    群组角色（schema 1，紧凑）
 *   <dir>/<group-id>/sessions/session-<uuid>.json   会话（schema 1，自包含，紧凑）
 *
 * 原子写 tmp+fsync+rename（每目录一次 fsync）；单实例 .lock；损坏隔离重建；
 * 写失败保留脏标记；v1 自动迁移。
 * @module dsh-group-chat/host/store
 */
import type { GroupRecord } from '../core/types.ts';
/** DSH 主目录；DSH_GROUP_CHAT_STORE 供测试覆盖存储位置。 */
export declare const DSH_HOME: string;
/** 存储根目录。 */
export declare const STORE_DIR: string;
/** 会话文件名 → 会话 id。 */
export declare function sessionFileMatch(name: string): string | null;
export declare class Store {
    readonly dir: string;
    readonly ledgerFile: string;
    private readonly lockFile;
    private lockFd;
    constructor(dir: string);
    groupDir(groupId: string): string;
    sessionsDir(groupId: string): string;
    sessionFile(groupId: string, sessionId: string): string;
    rolesFile(groupId: string): string;
    workspaceFile(groupId: string): string;
    private acquireLock;
    release(): void;
    fsyncDir(dir: string): void;
    /** 原子写：tmp+fsync+rename；目录 fsync 由调用方按 flush 批量执行（每目录一次）。 */
    atomicWrite(file: string, text: string): void;
    quarantine(file: string): void;
    /** 读 JSON；缺失返回 null；损坏则隔离后返回 null。 */
    loadJson(file: string): unknown;
    readWorkspace(groupId: string): string;
    /** hydrate 残留清理：.tmp-* 删除；同前缀 .corrupt-* 只保留最近 1 份。 */
    cleanup(): void;
    /** v1（ledger+messages 双文件）→ v2 一次性迁移；幂等，messages.json 只归档从不删除。 */
    migrateV1(): void;
}
/** ledger 清单的读取形态（hydrate 用）。 */
export interface LedgerDocument {
    schema?: number;
    groups?: {
        id: string;
        name?: string;
        allowCommands?: boolean;
    }[];
    sessions?: {
        id: string;
        groupId: string;
    }[];
}
/** 从磁盘目录回收群组 id 列表（ledger 缺失/损坏时的兜底路径）。 */
export declare function scanGroupIds(dir: string): string[];
/** 扫描群组目录下的会话文件（ledger 缺失/损坏时的兜底路径）。 */
export declare function scanSessionIds(store: Store, groupId: string): string[];
/** 空群组记录构造（hydrate 兜底路径用）。 */
export declare function emptyGroup(id: string, name: string): GroupRecord;
