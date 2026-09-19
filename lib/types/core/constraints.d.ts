/**
 * 会话约束备忘纯逻辑：滑动 40 条窗口、挤出集、压行、临时原文、解析与截断。
 * @module dsh-group-chat/core/constraints
 */
import { type MessageRecord, type SessionConstraint, type SessionRecord } from './types.ts';
/** 当场原文窗口（含系统行）。 */
export declare const WINDOW_SIZE = 40;
/** 折叠失败时临时原文条数上限。 */
export declare const TEMP_MAX_MESSAGES = 20;
/** 折叠失败时临时原文总长上限。 */
export declare const TEMP_MAX_CHARS = 16000;
/** 单轮折叠最多消耗的挤出条数（含系统行；超出留待下一轮）。 */
export declare const FOLD_MAX_MESSAGES = 40;
/** 单轮折叠输入总长上限（格式化后）。 */
export declare const FOLD_MAX_CHARS = 16000;
/** 备忘条数上限。 */
export declare const CONSTRAINT_MAX_ITEMS = 12;
/** 备忘总长上限（条目前缀+正文）。 */
export declare const CONSTRAINT_MAX_CHARS = 1200;
/** 单条备忘正文上限。 */
export declare const CONSTRAINT_ITEM_MAX_CHARS = 160;
export declare const KIND_LABEL: Record<SessionConstraint['kind'], string>;
/** 已折入水位（缺省 0）。 */
export declare function constraintsWatermark(sess: SessionRecord): number;
/** 重试：只取失败卡之前的时间线；untilId 不在列表则原样。 */
export declare function prefixIds(ids: string[], untilId?: string): string[];
/**
 * 新挤出：seq > 水位 且不在最近 40 条。只扫窗口外前缀（旧→新）。
 * untilId：重试时把窗口截到该消息之前，不带上后面已经发生的发言。
 */
export declare function squeezedMessages(messages: Map<string, MessageRecord>, sess: SessionRecord, untilId?: string): MessageRecord[];
/** 说话人展示名（折叠输入 / transcript 共用）。 */
export declare function speakerLabel(speaker: string, roleName?: string): string;
/** 单条消息压成 transcript 行（正文 8k + 工具一行摘要）。 */
export declare function formatTranscriptLine(m: MessageRecord, name: string): string;
/**
 * 单轮折叠消耗前缀：从最旧挤出起，最多 40 条 / 16k；系统行与失败卡计入消耗但不进模型。
 * 水位只能推到 consumed 的 max seq，剩余留待下一轮。
 */
export declare function takeFoldBatch(squeezed: MessageRecord[], nameOf: (m: MessageRecord) => string): {
    consumed: MessageRecord[];
    lines: string[];
    hasUser: boolean;
    allSystem: boolean;
};
/**
 * 未折入的挤出原文（失败缓冲）：只格式化最近 20 条，再按 16k 从最旧往下丢。
 */
export declare function tempTranscript(squeezed: MessageRecord[], nameOf: (m: MessageRecord) => string): string;
/** 水位 = 本批挤出的 max(seq)；空批为 0。 */
export declare function squeezedMaxSeq(squeezed: MessageRecord[]): number;
/** hydrate / 模型输出：非法 kind 丢条目；空 text 丢；条数与总长截断。 */
export declare function sanitizeConstraints(raw: unknown): SessionConstraint[];
/**
 * 解析折叠模型输出。null = 解析失败（水位不推）；[] = 无新结论（水位推、备忘不动）。
 */
export declare function parseConstraints(raw: string): SessionConstraint[] | null;
/** 本批无用户消息时，新的已定/否决降为未决。 */
export declare function downgradeWithoutUser(list: SessionConstraint[], hasUser: boolean): SessionConstraint[];
/** system 提示词「已确认约束」块；空则空串。 */
export declare function constraintBlock(list: SessionConstraint[] | undefined): string;
