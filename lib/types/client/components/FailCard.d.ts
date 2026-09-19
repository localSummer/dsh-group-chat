/**
 * 角色发言失败卡：人话标题 + 可展开原文。操作条由 Bubble 放在气泡外下方。
 * @module dsh-group-chat/client/FailCard
 */
import { type ReactNode } from 'react';
export interface FailCardProps {
    raw: string;
}
export declare function FailCard(props: FailCardProps): ReactNode;
