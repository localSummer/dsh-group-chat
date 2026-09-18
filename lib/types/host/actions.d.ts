/**
 * 动作分发（handleAction，POST /api/group-chat/action 的载荷）：
 * mutate（12 种 CRUD/配置操作）| send | stop | confirmCommand | models | efforts。
 * @module dsh-group-chat/host/actions
 */
import type { BrowseResult, Snapshot } from '../core/types.ts';
import type { HostState } from './state.ts';
/** 动作面。 */
export interface Actions {
    handleAction: (body: Record<string, unknown>) => Promise<unknown>;
}
/** 创建动作分发面。 */
export declare function createActions(core: HostState, deps: {
    touch: () => void;
    snapshot: () => Snapshot;
    schedulePersist: (targets?: {
        ledger?: boolean;
        session?: string | null;
        roles?: string | null;
        workspace?: string | null;
    }) => void;
    dropDirty: (targets: {
        session?: string | null;
        roles?: string | null;
        workspace?: string | null;
    }) => void;
    appendMessage: import('./conversation.ts').Conversation['appendMessage'];
    runLoop: import('./conversation.ts').Conversation['runLoop'];
    wakeConfirm: () => void;
    killChild: () => void;
    browse: (args: {
        path?: string;
    } | undefined) => Promise<BrowseResult>;
}): Actions;
