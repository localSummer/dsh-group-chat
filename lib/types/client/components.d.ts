/**
 * 会话流内容组件：思考折叠行、工具调用折叠行、聊天气泡。
 * 对标宿主同源渲染（MarkdownText 正文 + 思考折叠行 + CodeBlock 代码块）。
 * @module dsh-group-chat/client/components
 */
import { type ReactNode } from 'react';
import { Icon } from './ui.ts';
import { type ClientSnapshot, type ToolCallView } from './model.ts';
/** 思考折叠行（对标宿主 ReasoningRow：折叠摘要 / 展开全文）。 */
export declare function ThinkRow(props: {
    text: string;
    running?: boolean;
}): ReactNode;
export declare function ToolRow(props: {
    c: ToolCallView;
}): ReactNode;
/** 聊天消息（user / system / 角色发言）。 */
export declare function Bubble(props: {
    snap: ClientSnapshot;
    m: ClientSnapshot['messages'][number];
}): ReactNode;
export { Icon };
