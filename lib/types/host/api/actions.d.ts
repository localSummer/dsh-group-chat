/**
 * 动作分发（handleAction，POST /api/group-chat/action 的载荷）：
 * mutate（13 种 CRUD/配置/回应操作）| send | retrySpeak | stop | confirmCommand | models | efforts。
 * 图片上传走独立路由 POST /api/group-chat/upload（action 路由的 1MB 请求体上限
 * 装不下图片字节），上传落 durable ref 后由 send 引用。
 * @module dsh-group-chat/host/api/actions
 */
import type { Snapshot, UploadResult } from '../../core/types.ts';
import type { HostState } from '../state.ts';
import type { Conversation } from '../engine/index.ts';
import type { Materials } from '../materials/index.ts';
/** 动作面。 */
export interface Actions {
    handleAction: (body: Record<string, unknown>) => Promise<unknown>;
    /** 图片上传：base64 → durable ref（独立路由用，绕过 action 的 1MB 请求体上限）。 */
    uploadImage: (body: Record<string, unknown>) => Promise<UploadResult>;
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
    appendMessage: Conversation['appendMessage'];
    runLoop: Conversation['runLoop'];
    wakeConfirm: () => void;
    killChild: () => void;
    browse: Materials['browse'];
    fileSearch: Materials['fileSearch'];
    disposeFileSearch: Materials['disposeFileSearch'];
}): Actions;
