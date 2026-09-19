/**
 * 消息操作条：贴在气泡外下方。用户/角色消息悬停出「复制」；失败卡常驻「复制 / 重试」。
 * @module dsh-group-chat/client/MsgActions
 */
import { type ReactNode } from 'react';
export interface MsgActionsProps {
    copyText: string;
    onRetry?: () => void;
    retryDisabled?: boolean;
    retryTitle?: string;
    /** 失败卡：不依赖悬停，始终可见。 */
    always?: boolean;
}
export declare function MsgActions(props: MsgActionsProps): ReactNode;
