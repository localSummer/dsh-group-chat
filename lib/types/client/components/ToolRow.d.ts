/**
 * 工具调用折叠行（对标思考折叠：摘要行 / 展开输出）。
 * @module dsh-group-chat/client/ToolRow
 */
import { type ReactNode } from 'react';
import type { ToolCallRecord } from '../../core/types.ts';
export declare function ToolRow(props: {
    c: ToolCallRecord;
}): ReactNode;
