/**
 * 会话标题/主题自动整理（参照 oil-codex-title）：每轮结束后用 DSH 默认模型
 * 后台生成。名称只在仍为默认占位时写一次；主题每轮演进。手动编辑过的字段
 * 永久跳过（隐式固定）。
 * @module dsh-group-chat/host/engine/retitle
 */
import type { SessionRecord } from '../../core/types.ts';
import { type HostState } from '../state.ts';
/**
 * 每轮结束后根据聊天内容整理会话名称与主题：后台 fire-and-forget、不产生
 * 消息、静默失败。名称只在仍为默认占位时生成一次（「类别 emoji + 对象｜目标」）；
 * 主题 = 演进式一句话摘要（对象+目标+当前焦点），每轮更新，注入后续角色上下文。
 * 手动编辑过的字段永久跳过（隐式固定，apply 时复查）。
 */
export declare function createRetitle(core: HostState, deps: {
    touch: () => void;
    schedulePersist: (targets?: {
        session?: string | null;
    }) => void;
}): (sess: SessionRecord) => Promise<void>;
