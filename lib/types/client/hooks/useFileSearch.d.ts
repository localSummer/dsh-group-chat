/**
 * 文件搜索 hook：防抖 + 取消过期请求 + 短缓存。
 * @module dsh-group-chat/client/hooks
 */
import type { AtToken } from '../../shared/file-mention-grammar.ts';
export interface FileCandidate {
    path: string;
    isDir: boolean;
}
export interface FileSearchResult {
    fileCandidates: FileCandidate[];
    fileSearchError: string | null;
    fileSearchLoading: boolean;
}
/**
 * 文件搜索：query 变化 180ms 内合并；过期 fetch 真正 abort；
 * 命中短缓存立刻出结果。离开文件模式才清空列表，避免每个按键闪「检索中」。
 */
export declare function useFileSearch(mention: AtToken | null, groupId: string | undefined): FileSearchResult;
