/**
 * 群聊面板核心状态管理 hook
 * @module dsh-group-chat/client/hooks
 */
import type { ClientSnapshot, ModelsResponse, RoleDraft } from '../lib/model.ts';
export interface MutateResponse {
    ok: boolean;
    snapshot?: ClientSnapshot;
    lastCreated?: ClientSnapshot['lastCreated'];
    error?: string;
}
export interface ActionOk {
    ok: boolean;
    error?: string;
}
export declare function useGroupChatState(): {
    snap: ClientSnapshot | null;
    setSnap: (s: ClientSnapshot) => void;
    gid: string | null;
    setGid: (v: string) => void;
    sid: string | null;
    setSid: (v: string) => void;
    search: string;
    setSearch: import("react").Dispatch<import("react").SetStateAction<string>>;
    collapsedGroups: Set<string>;
    setCollapsedGroups: import("react").Dispatch<import("react").SetStateAction<Set<string>>>;
    renameDraft: {
        kind: "group" | "session";
        id: string;
        value: string;
    } | null;
    setRenameDraft: import("react").Dispatch<import("react").SetStateAction<{
        kind: "group" | "session";
        id: string;
        value: string;
    } | null>>;
    confirmDel: {
        kind: "group" | "session";
        id: string;
    } | null;
    setConfirmDel: import("react").Dispatch<import("react").SetStateAction<{
        kind: "group" | "session";
        id: string;
    } | null>>;
    confirmClear: boolean;
    setConfirmClear: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    roleDraft: RoleDraft | null;
    setRoleDraft: import("react").Dispatch<import("react").SetStateAction<RoleDraft | null>>;
    roleFormError: string;
    setRoleFormError: import("react").Dispatch<import("react").SetStateAction<string>>;
    models: ModelsResponse | null;
    setModels: import("react").Dispatch<import("react").SetStateAction<ModelsResponse | null>>;
    modelsError: string | null;
    setModelsError: import("react").Dispatch<import("react").SetStateAction<string | null>>;
    fileBrowser: {
        open: boolean;
        loading: boolean;
        list: import("../../core/types.ts").BrowseResult | null;
        error: string;
    } | null;
    setFileBrowser: import("react").Dispatch<import("react").SetStateAction<{
        open: boolean;
        loading: boolean;
        list: import("../../core/types.ts").BrowseResult | null;
        error: string;
    } | null>>;
    wsDraft: string | null;
    setWsDraft: import("react").Dispatch<import("react").SetStateAction<string | null>>;
    partsSel: string[] | null;
    setPartsSel: import("react").Dispatch<import("react").SetStateAction<string[] | null>>;
    rounds: number;
    setRounds: import("react").Dispatch<import("react").SetStateAction<number>>;
    input: string;
    setInput: import("react").Dispatch<import("react").SetStateAction<string>>;
    err: string;
    setErr: import("react").Dispatch<import("react").SetStateAction<string>>;
    topicDraft: string | null;
    setTopicDraft: import("react").Dispatch<import("react").SetStateAction<string | null>>;
    mention: string | null;
    setMention: import("react").Dispatch<import("react").SetStateAction<string | null>>;
    mentionIdx: number;
    setMentionIdx: import("react").Dispatch<import("react").SetStateAction<number>>;
    asideOpen: boolean;
    setAsideOpen: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    navOpen: boolean;
    setNavOpen: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    atBottom: boolean;
    setAtBottom: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    inputRef: import("react").MutableRefObject<HTMLDivElement | null>;
    sendingRef: import("react").MutableRefObject<boolean>;
    scrollRef: import("react").MutableRefObject<HTMLDivElement | null>;
    action: (payload: Record<string, unknown>) => Promise<unknown>;
    mutate: (args: Record<string, unknown>) => Promise<MutateResponse | null>;
};
