/**
 * 文件搜索 hook：封装文件检索的状态管理、API 调用和过期响应丢弃。
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
 * 文件搜索 hook。
 * 仅依赖 query/groupId，不把 action 身份放进 effect——SSE 重渲染会换掉 action，
 * 旧实现据此 abort 后又不把 loading 置回 false，弹层会一直停在「检索中」。
 */
export declare function useFileSearch(mention: AtToken | null, groupId: string | undefined, action: (args: Record<string, unknown>) => Promise<unknown>): FileSearchResult;
