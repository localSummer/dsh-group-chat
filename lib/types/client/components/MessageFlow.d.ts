/**
 * 消息流显示组件
 * @module dsh-group-chat/client/components
 */
import type { ReactNode } from 'react';
import { type ClientSnapshot } from '../lib/model.ts';
interface MessageFlowProps {
    snap: ClientSnapshot;
    sess: ClientSnapshot['sessions'][number] | null;
    busyNow: boolean;
    msgById: Record<string, ClientSnapshot['messages'][number]>;
    action: (payload: Record<string, unknown>) => Promise<unknown>;
    onRetrySpeak: (messageId: string) => void;
    /** 表情回应（用户标注）：经 Bubble/MsgActions 触发 toggle。 */
    onToggleReaction: (messageId: string, emoji: string) => void;
}
export declare function MessageFlow(props: MessageFlowProps): ReactNode;
export {};
