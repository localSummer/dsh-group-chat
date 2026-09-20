/**
 * 表情回应选择浮层（RareUI Emoji reaction 的插件习语重写）：portal 到
 * document.body（躲开 `.dsgc-root` 的 container-type 把 position:fixed 按容器
 * 定位），按触发钮 rect 固定定位、向上弹出（空间不足向下翻转）。
 * 6 个 Unicode emoji 候选（文本渲染，不引入图片资产）；键盘 ←→ 移动、
 * Enter/空格 选、Esc 关；已回应的候选高亮、再点为取消。出现 .16s + 4px 位移。
 * @module dsh-group-chat/client/ReactionPicker
 */
import { type ReactNode } from 'react';
export interface ReactionPickerProps {
    /** 触发钮（锚定元素）。 */
    anchor: HTMLElement;
    /** 该消息已有的回应集合（高亮 + 再点取消）。 */
    reactions: string[];
    /** 选中候选（重复点击同 emoji = 取消）。 */
    onPick: (emoji: string) => void;
    onClose: () => void;
}
export declare function ReactionPicker(props: ReactionPickerProps): ReactNode;
