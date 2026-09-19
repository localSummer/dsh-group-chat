/**
 * 未发送草稿：按会话 id 分槽，模块级跨挂载存活。
 * 主会话⇄群聊会整页卸载 composer，contentEditable 的 HTML 必须自行记住。
 * @module dsh-group-chat/client/composer-draft
 */
export interface ComposerDraft {
    html: string;
    text: string;
}
/** 读指定会话草稿；命中则提到 LRU 最近端。 */
export declare function readComposerDraft(sessionId: string | null | undefined): ComposerDraft;
/** 写入；空草稿删槽。超出上限淘汰最旧槽。 */
export declare function writeComposerDraft(sessionId: string | null | undefined, html: string, text: string): void;
/** 发送成功或明确丢弃时摘槽。 */
export declare function clearComposerDraft(sessionId: string | null | undefined): void;
/** 测试用：清空全部槽位。 */
export declare function resetComposerDrafts(): void;
