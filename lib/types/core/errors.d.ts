/**
 * 角色发言失败：供应商原文 → 人话标题/原因（core 纯函数，无 React）。
 * 原始 JSON 仍落盘在消息 text 里，UI 默认只展示短因，展开才看原文。
 * @module dsh-group-chat/core/errors
 */
export interface SpeakFailureView {
    /** 一行标题，例如「额度已用尽」。 */
    title: string;
    /** 可选短因：重置时间、HTTP 状态等。 */
    detail?: string;
    /** 复制/排障用的供应商原文（已剥「模型输出异常终止: 」前缀）。 */
    raw: string;
}
/** 剥旧系统胶囊与引擎包装前缀，保留供应商原文。 */
export declare function unwrapSpeakFailure(raw: string): string;
/** 旧系统胶囊文案：角色「名」发言失败：原文。对不上则 null。 */
export declare function parseLegacyRoleFailure(text: string): {
    roleName: string;
    rest: string;
} | null;
export interface RoleRef {
    id: string;
    name: string;
    provider?: string;
    model?: string;
}
export interface FailedMessageRef {
    speaker: string;
    text: string;
    error?: boolean;
    failedRoleId?: string;
}
/** 发言失败卡：error 标记，或旧系统胶囊文案。 */
export declare function isSpeakFailure(m: FailedMessageRef): boolean;
/** 失败回合对应角色：failedRoleId / speaker / 旧文案里的角色名（恰好一名才命中）。 */
export declare function resolveFailedRole<T extends RoleRef>(m: FailedMessageRef, roles: T[]): T | null;
/**
 * 把旧系统失败行挂到对应角色（恰好一名命中才迁）。
 * 返回是否改写了记录。
 */
export declare function repairFailedMessage(m: {
    speaker: string;
    text: string;
    error?: boolean;
    failedRoleId?: string;
    model?: string;
}, roles: RoleRef[]): boolean;
/**
 * 把供应商错误压成可扫描的标题 + 短因。
 * 未知形态回退为「发言失败」，原文仍可展开。
 */
export declare function classifySpeakFailure(raw: string): SpeakFailureView;
/** 失败卡默认复制内容：标题 + 短因 + 原文。 */
export declare function formatSpeakFailureCopy(view: SpeakFailureView): string;
