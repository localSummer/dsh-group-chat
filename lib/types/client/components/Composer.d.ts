/**
 * 消息输入编辑器组件
 * @module dsh-group-chat/client/components
 */
import { type ReactNode, type KeyboardEvent as ReactKeyboardEvent, type ClipboardEvent as ReactClipboardEvent, type DragEvent as ReactDragEvent } from 'react';
import type { ImageAttachmentRef } from '@deepseek-ai/dsh-attachment';
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
    /** 选择/拖入图片文件（面板负责上传，Composer 只管转发 File[]）。 */
    onImageFiles: (files: File[]) => void;
    /** 有图片正在上传：禁用发送，避免图片静默丢失。 */
    uploading: boolean;
    /** 待发图片，显示在文本框上方。 */
    images: ImageAttachmentRef[];
    /** 按预览条上的下标移除。同一张图多次上传时 attachmentId 相同，不能按 id 删。 */
    onRemoveImage: (index: number) => void;
    /** 当前参与角色是否都支持图片（决定上传按钮可用性）。 */
    imagesSupported: boolean;
    sendMsg: () => Promise<void>;
    stopRun: () => Promise<void>;
    mutate: (args: Record<string, unknown>) => Promise<unknown>;
    setMention: (val: AtToken | null) => void;
}
export declare function Composer(props: ComposerProps): ReactNode;
export {};
