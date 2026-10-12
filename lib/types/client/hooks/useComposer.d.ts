/**
 * 消息输入相关 hooks
 * @module dsh-group-chat/client/hooks
 */
import { type ClipboardEvent as ReactClipboardEvent, type DragEvent as ReactDragEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { ImageAttachmentRef } from '@deepseek-ai/dsh-attachment';
import type { AtToken } from '../../shared/file-mention-grammar.ts';
import type { SnapshotRole } from '../lib/model.ts';
export declare function useComposerEffects(inputRef: React.RefObject<HTMLDivElement>, scrollRef: React.RefObject<HTMLDivElement>, input: string, atBottom: boolean, snap: unknown): {
    onMsgsScroll: () => boolean | undefined;
};
export declare function useComposerInput(inputRef: React.RefObject<HTMLDivElement>, setInput: (val: string) => void, setMention: (val: AtToken | null) => void, setMentionIdx: (val: number) => void, sessionId?: string | null, 
/** 粘贴/拖入图片文件时的回调（由面板负责上传；本 hook 不碰网络）。 */
onImageFiles?: (files: File[]) => void, 
/** 待发图片。打字写草稿时一并落槽，避免只改文字把图片草稿冲掉。 */
imagesRef?: {
    current: ImageAttachmentRef[];
}): {
    syncFromDOM: () => void;
    onInputCE: () => void;
    onPasteCE: (e: ReactClipboardEvent<HTMLDivElement>) => void;
    onDragOverCE: (e: ReactDragEvent<HTMLDivElement>) => void;
    onDropCE: (e: ReactDragEvent<HTMLDivElement>) => void;
};
/**
 * 按会话恢复草稿：切会话时先把当前 HTML 写入旧槽，再灌入新槽；
 * 面板重挂载（主会话⇄群聊）时 editor 是新节点，从模块缓存灌回。
 */
export declare function useComposerDraft(sessionId: string | null | undefined, inputRef: React.RefObject<HTMLDivElement>, setInput: (val: string) => void, setMention: (val: AtToken | null) => void, 
/** 待发图片。切会话时随草稿保存并恢复。 */
imagesRef: {
    current: ImageAttachmentRef[];
}, setImages: (images: ImageAttachmentRef[]) => void): void;
export declare function useMentionChip(inputRef: React.RefObject<HTMLDivElement>, setMention: (val: AtToken | null) => void, setMentionIdx: (val: number) => void, syncFromDOM: () => void): {
    insertChip: (role: SnapshotRole) => void;
    insertFileChip: (path: string, kind: "file" | "directory") => void;
};
export declare function useInputKeyboard(mention: AtToken | null, mentionCandidates: SnapshotRole[], mentionIdxC: number, setMentionIdx: (val: number | ((prev: number) => number)) => void, insertChip: (role: SnapshotRole) => void, insertFileChip: (path: string, kind: 'file' | 'directory') => void, fileCandidates: Array<{
    path: string;
    isDir: boolean;
}>, setMention: (val: AtToken | null) => void, sendMsg: () => Promise<void>): {
    onInputKeyDown: (e: ReactKeyboardEvent<HTMLDivElement>) => void;
};
