/**
 * 数字滚轮（RareUI Animated counter 的插件习语重写）：每位数字一列，
 * 列内 0-9 纵向数字条 translateY 滚到目标位（.15s 到达曲线）。
 * 位数增减不做专门动画（宽度由容器决定）；非法值（负/小数/NaN）纯文本兜底。
 * reduced-motion 由全局规则停用 transition（直接跳变）。
 * @module dsh-group-chat/client/RollingNumber
 */
import type { ReactNode } from 'react';
export interface RollingNumberProps {
    value: number;
    className?: string;
}
export declare function RollingNumber(props: RollingNumberProps): ReactNode;
