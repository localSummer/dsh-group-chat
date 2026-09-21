/**
 * 消息操作条：贴在气泡外下方。用户/角色消息悬停出「复制」与「回应」；
 * 失败卡常驻「复制 / 重试」。回应 = RareUI Emoji reaction 的插件习语重写：
 * 触发钮弹出 ReactionPicker，选中后 5 份 emoji 副本从触发钮上浮飘散
 * （reduced-motion 直接跳过）；已回应以胶囊常驻展示，点击胶囊取消。
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
    /** 消息已有的表情回应集合（用户标注）。 */
    reactions?: string[];
    /** 提供时渲染回应触发钮与胶囊（失败卡与系统通知不提供）。 */
    onToggleReaction?: (emoji: string) => void;
    /** 该次发言的生成总耗时（仅角色消息）；展示在操作组末尾。 */
    durationMs?: number;
}
export declare function MsgActions(props: MsgActionsProps): ReactNode;
