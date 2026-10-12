/**
 * 未发送草稿：按会话 id 分槽，模块级跨挂载存活。
 * 主会话⇄群聊会整页卸载 composer，contentEditable 的 HTML 与待发图片必须自行记住。
 * @module dsh-group-chat/client/composer-draft
 */
import type { ImageAttachmentRef } from '@deepseek-ai/dsh-attachment';
export interface ComposerDraft {
    html: string;
    text: string;
    /** 待发图片。不进文本区 HTML。 */
    images: ImageAttachmentRef[];
}
/** 读指定会话草稿；命中则提到 LRU 最近端。 */
export declare function readComposerDraft(sessionId: string | null | undefined): ComposerDraft;
/** 写入；文字和图片都空则删槽。超出上限淘汰最旧槽。 */
export declare function writeComposerDraft(sessionId: string | null | undefined, html: string, text: string, images?: ImageAttachmentRef[]): void;
/** 发送成功或明确丢弃时摘槽。 */
export declare function clearComposerDraft(sessionId: string | null | undefined): void;
/** 测试用：清空全部槽位。 */
export declare function resetComposerDrafts(): void;
/**
 * 从草稿 HTML 抽出曾经嵌在文本区里的图片芯片，并把芯片从 HTML 里剥掉。
 * 新预览不进文本区；这只处理还留在内存草稿里的旧芯片。
 */
export declare function detachImageChips(html: string): {
    html: string;
    images: ImageAttachmentRef[];
};
