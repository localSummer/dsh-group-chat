/**
 * 原地确认删除按钮（RareUI Delete button 的插件习语重写）：点击垃圾桶掀盖，
 * 侧滑出「✓ 确认 / ✗ 取消」微面板；✓ 才执行删除，✗ / Esc / 点击外部收起。
 * 入场 .16s 到达曲线、退场 .12s ease-in（max-width + opacity 纯 CSS 双向动画，
 * 收起后经 visibility 延迟切断键盘焦点）；reduced-motion 由全局规则停用。
 * @module dsh-group-chat/client/ConfirmDelete
 */
import { type ReactNode } from 'react';
export interface ConfirmDeleteProps {
    /** 基础态 aria/title 文案（如「删除会话」）。 */
    label: string;
    /** 确认态 ✓ 的 aria/title 文案。 */
    confirmLabel?: string;
    onConfirm: () => void;
}
export declare function ConfirmDelete(props: ConfirmDeleteProps): ReactNode;
