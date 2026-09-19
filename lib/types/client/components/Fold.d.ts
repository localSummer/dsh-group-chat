/**
 * 会话内折叠：高度 0fr→1fr + 溢出滚动遮罩。思考 / 工具 / 失败原文 / 结论备忘共用。
 * @module dsh-group-chat/client/components
 */
import { type ReactNode } from 'react';
interface FoldProps {
    open: boolean;
    children: ReactNode;
    className?: string;
}
export declare function Fold(props: FoldProps): ReactNode;
interface ClipWellProps {
    children: ReactNode;
    maxHeight: number;
    className?: string;
    watch?: unknown;
}
export declare function ClipWell(props: ClipWellProps): ReactNode;
export {};
