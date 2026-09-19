/**
 * 通用工具函数
 * @module dsh-group-chat/client/utils
 */
import { type AtToken } from '../../shared/file-mention-grammar.ts';
/** HTML 转义（芯片以 execCommand('insertHTML') 注入，角色名需转义）。 */
export declare function escapeHtml(v: string): string;
export declare function execCommand(commandId: 'delete' | 'insertHTML' | 'insertText' | 'insertLineBreak', value?: string): boolean;
/**
 * contenteditable 输入区 → 纯文本序列化（发送/参与判定的唯一事实源）：
 * 文本节点原样；<br> → 换行；角色芯片（.dsgc-chipin[data-role-id]）展开回「@名字␠」；
 * 文件芯片（.dsgc-chipin[data-kind=file]）展开回「@path」或「@"path with spaces"」；
 * DIV/P 块前补换行（防粘贴残留的块级包裹）。
 */
export declare function serializeInput(root: HTMLElement): string;
/** @角色芯片的 HTML（原子元素：contenteditable=false + draggable，退格整删；fresh=插入后需营救选区，加 data-new 标记）。 */
export declare function chipHtml(role: {
    id: string;
    name: string;
    color?: string;
}, fresh?: boolean): string;
/** @文件芯片的 HTML（原子元素：contenteditable=false + draggable，退格整删；fresh 同 chipHtml）。 */
export declare function fileChipHtml(path: string, kind: 'file' | 'directory', fresh?: boolean): string;
/**
 * 光标前的活跃 @token（角色或文件弹层触发判定）。
 *
 * @returns AtToken 对象，包含 prefix/query/quoted；无返回 null
 */
export declare function queryAtCaret(): AtToken | null;
