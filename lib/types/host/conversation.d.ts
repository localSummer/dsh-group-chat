/**
 * 对话引擎：消息追加、群聊记录转写、角色发言（speak：prompt 构建 + 流式
 * 轮次 + 工具回注循环）、多轮 runLoop，以及会话标题/主题自动整理（retitle）。
 * @module dsh-group-chat/host/conversation
 */
import type { MessageRecord, SessionRecord } from '../core/types.ts';
import type { HostState } from './state.ts';
import type { Materials } from './materials.ts';
import type { Tools } from './tools.ts';
/** 对话引擎面。 */
export interface Conversation {
    /** 追加一条消息到会话（touch + 落盘调度）。 */
    appendMessage: (sess: SessionRecord, speaker: string, text: string, extra?: Partial<MessageRecord>) => MessageRecord;
    /** 多轮 round-robin 主循环（send 触发；finally 复位 run）。 */
    runLoop: (sess: SessionRecord) => Promise<void>;
}
/** 创建对话引擎。 */
export declare function createConversation(core: HostState, deps: {
    touch: () => void;
    schedulePersist: (targets?: {
        session?: string | null;
    }) => void;
    materials: Materials;
    tools: Tools;
}): Conversation;
