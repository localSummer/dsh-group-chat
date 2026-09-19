/**
 * 对齐宿主 Tooltip 的 hover 气泡：portal 到 document.body，躲开
 * `.dsgc-root` 的 container-type 把 position:fixed 按容器定位。
 * @module dsh-group-chat/client/components
 */
import { type ReactNode } from 'react';
export type HoverTipSide = 'top' | 'right';
interface HoverTipProps {
    label: string;
    side?: HoverTipSide;
    delayMs?: number;
    maxWidth?: number;
    className?: string;
    children: ReactNode;
}
/**
 * @param props.label 气泡正文（pre-line）
 * @param props.side 默认 right（对齐侧栏会话行）；composer 轮数用 top
 * @param props.delayMs hover 延迟，默认 500；键盘 focus 立即出
 */
export declare function HoverTip(props: HoverTipProps): ReactNode;
export {};
