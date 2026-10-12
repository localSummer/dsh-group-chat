/**
 * 中央会话面板组件
 * @module dsh-group-chat/client/components
 */
import type { ReactNode } from 'react';
import type { ImageAttachmentRef } from '@deepseek-ai/dsh-attachment';
import type { ClientSnapshot, SnapshotRole } from '../lib/model.ts';
import type { AtToken } from '../../shared/file-mention-grammar.ts';
interface ChatPanelProps {
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
    topicDraft: string | null;
    msgById: Record<string, ClientSnapshot['messages'][number]>;
    navOpen: boolean;
    asideOpen: boolean;
    inputRef: React.RefObject<HTMLDivElement>;
    scrollRef: React.RefObject<HTMLDivElement>;
    setTopicDraft: (val: string | null) => void;
    setConfirmClear: (val: boolean) => void;
    setMentionIdx: (val: number) => void;
    setRounds: (val: number) => void;
    setNavOpen: (val: boolean) => void;
    setAsideOpen: (val: boolean) => void;
    togglePart: (rid: string) => void;
    onMsgsScroll: () => void;
    onInputCE: () => void;
    onInputKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
    onPasteCE: (e: React.ClipboardEvent<HTMLDivElement>) => void;
    onDropCE: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragOverCE: (e: React.DragEvent<HTMLDivElement>) => void;
    insertChip: (role: SnapshotRole) => void;
    insertFileChip: (path: string, kind: 'file' | 'directory') => void;
    /** 选择/拖入图片文件（面板负责上传，Composer 只管转发 File[]）。 */
    onImageFiles: (files: File[]) => void;
    /** 有图片正在上传：禁用发送，避免图片静默丢失。 */
    uploading: boolean;
    /** 待发图片，显示在文本框上方，不进文本区。 */
    images: ImageAttachmentRef[];
    onRemoveImage: (index: number) => void;
    /** 当前参与角色是否都支持图片（决定上传按钮可用性）。 */
    imagesSupported: boolean;
    onOpenImage: (image: ImageAttachmentRef) => void;
    sendMsg: () => Promise<void>;
    stopRun: () => Promise<void>;
    action: (payload: Record<string, unknown>) => Promise<unknown>;
    mutate: (args: Record<string, unknown>) => Promise<unknown>;
    setMention: (val: AtToken | null) => void;
    onRetrySpeak: (messageId: string) => void;
    onToggleReaction: (messageId: string, emoji: string) => void;
}
export declare function ChatPanel(props: ChatPanelProps): ReactNode;
export {};
