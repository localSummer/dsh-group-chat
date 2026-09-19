/**
 * 消息输入相关 hooks
 * @module dsh-group-chat/client/hooks
 */
import { type ClipboardEvent as ReactClipboardEvent, type DragEvent as ReactDragEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { AtToken } from '../../shared/file-mention-grammar.ts';
import type { SnapshotRole } from '../lib/model.ts';
export declare function useComposerEffects(inputRef: React.RefObject<HTMLDivElement>, scrollRef: React.RefObject<HTMLDivElement>, input: string, atBottom: boolean, snap: unknown): {
    onMsgsScroll: () => boolean | undefined;
};
export declare function useComposerInput(inputRef: React.RefObject<HTMLDivElement>, setInput: (val: string) => void, setMention: (val: AtToken | null) => void, setMentionIdx: (val: number) => void): {
    syncFromDOM: () => void;
    onInputCE: () => void;
    onPasteCE: (e: ReactClipboardEvent<HTMLDivElement>) => void;
    onDragOverCE: (e: ReactDragEvent<HTMLDivElement>) => void;
    onDropCE: (e: ReactDragEvent<HTMLDivElement>) => void;
};
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
