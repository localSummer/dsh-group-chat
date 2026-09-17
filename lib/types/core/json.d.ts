/**
 * 记录 → 落盘 JSON 的纯序列化（core 层；可选字段无则省略）。
 * @module dsh-group-chat/core/json
 */
import type { MessageRecord, RoleRecord } from './types.ts';
/** 消息 → 落盘 JSON（可选字段无则省略；兼容保留 error）。 */
export declare function messageJson(m: Partial<MessageRecord> | undefined): Record<string, unknown> | null;
/** 角色 → 落盘 JSON（groupId 由目录归属，不再写入）。 */
export declare function roleJson(r: Partial<RoleRecord>): Record<string, unknown>;
