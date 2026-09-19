/**
 * 窗口外结论/约束备忘：整次 runLoop 结束后后台折叠（仿 retitle）。
 * 立刻 idle；未折完用水位 + 临时原文表达。v1 复用 purpose session-title 关思考。
 * @module dsh-group-chat/host/engine/fold
 */
import type { SessionRecord } from '../../core/types.ts';
import type { HostState } from '../state.ts';
/**
 * 每轮 send 结束后折叠窗口外约束：fire-and-forget、不产生消息、静默失败。
 * 同会话去重；会话已清空则 abort。内存 {constraints, constraintsUpToSeq} 一次挂上。
 */
export declare function createFold(core: HostState, deps: {
    touch: () => void;
    schedulePersist: (targets?: {
        session?: string | null;
    }) => void;
}): (sess: SessionRecord) => Promise<void>;
