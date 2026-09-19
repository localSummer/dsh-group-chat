/**
 * 会话流折点处：只读结论备忘卡（超过 4 条默认露 3 条）。
 * @module dsh-group-chat/client/components
 */
import { type ReactNode } from 'react';
import type { SessionConstraint } from '../../core/types.ts';
interface ConstraintListProps {
    items: SessionConstraint[];
}
export declare function ConstraintList(props: ConstraintListProps): ReactNode;
export {};
