/**
 * 消息输入编辑器组件
 * @module dsh-group-chat/client/components
 */
import type { ReactNode, KeyboardEvent as ReactKeyboardEvent, ClipboardEvent as ReactClipboardEvent, DragEvent as ReactDragEvent } from 'react';
import { type ClientSnapshot, type SnapshotRole } from '../lib/model.ts';
import type { AtToken } from '../../shared/file-mention-grammar.ts';
interface ComposerProps {
    snap: ClientSnapshot;
    sess: ClientSnapshot['sessions'][number] | null;
    group: ClientSnapshot['groups'][number];
    enabledRoles: SnapshotRole[];
    participants: string[];
    mentionedRoles: SnapshotRole[];
    busyNow: boolean;
    input: string;
    mention: AtToken | null;
    mentionCandidates: SnapshotRole[];
    mentionIdxC: number;
    fileCandidates: Array<{
        path: string;
        isDir: boolean;
    }>;
    fileSearchError: string | null;
    fileSearchLoading: boolean;
    rounds: number;
    err: string;
    atBottom: boolean;
    bubblesLength: number;
    inputRef: React.RefObject<HTMLDivElement>;
    scrollRef: React.RefObject<HTMLDivElement>;
    setMentionIdx: (val: number) => void;
    setRounds: (val: number) => void;
    togglePart: (rid: string) => void;
    onInputCE: () => void;
    onInputKeyDown: (e: ReactKeyboardEvent<HTMLDivElement>) => void;
    onPasteCE: (e: ReactClipboardEvent<HTMLDivElement>) => void;
    onDropCE: (e: ReactDragEvent<HTMLDivElement>) => void;
    onDragOverCE: (e: ReactDragEvent<HTMLDivElement>) => void;
    insertChip: (role: SnapshotRole) => void;
    insertFileChip: (path: string, kind: 'file' | 'directory') => void;
    sendMsg: () => Promise<void>;
    stopRun: () => Promise<void>;
    mutate: (args: Record<string, unknown>) => Promise<unknown>;
    setMention: (val: AtToken | null) => void;
}
export declare function Composer(props: ComposerProps): ReactNode;
export {};
