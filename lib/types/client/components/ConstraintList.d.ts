/**
 * 会话头第二行：只读约束备忘（超过 4 条默认露 3 条）。
 * @module dsh-group-chat/client/components
 */
import { type ReactNode } from 'react';
import type { SessionConstraint } from '../../core/types.ts';
interface ConstraintListProps {
    items: SessionConstraint[];
}
export declare function ConstraintList(props: ConstraintListProps): ReactNode;
export {};
