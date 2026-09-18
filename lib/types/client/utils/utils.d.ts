/**
 * 通用工具函数
 * @module dsh-group-chat/client/utils
 */
/** HTML 转义（芯片以 execCommand('insertHTML') 注入，角色名需转义）。 */
export declare function escapeHtml(v: string): string;
export declare function execCommand(commandId: 'delete' | 'insertHTML' | 'insertText' | 'insertLineBreak', value?: string): boolean;
/**
 * contenteditable 输入区 → 纯文本序列化（发送/参与判定的唯一事实源）：
 * 文本节点原样；<br> → 换行；@提及芯片（.dsgc-chipin）展开回「@名字␠」；
 * DIV/P 块前补换行（防粘贴残留的块级包裹）。手打纯文本 @名字 与芯片展开
 * 结果同形——语义统一由 mentionedRoles 正则承载（芯片=糖，正则=真）。
 */
export declare function serializeInput(root: HTMLElement): string;
/** @提及芯片的 HTML（原子元素：contenteditable=false + draggable，退格整删）。 */
export declare function chipHtml(role: {
    id: string;
    name: string;
    color?: string;
}): string;
/** 光标前未闭合的 @词（弹层触发判定）；无返回 null */
export declare function queryAtCaret(): string | null;
