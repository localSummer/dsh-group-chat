/**
 * 右侧成员与工作区栏组件
 * @module dsh-group-chat/client/components
 */
import type { ReactNode } from 'react';
import { type ClientSnapshot, type SnapshotRole } from '../lib/model.ts';
interface AsidePanelProps {
    snap: ClientSnapshot;
    group: ClientSnapshot['groups'][number];
    asideOpen: boolean;
    wsDraft: string | null;
    setWsDraft: (val: string | null) => void;
    fileBrowser: {
        open: boolean;
        loading: boolean;
        list: import('../../core/types.ts').BrowseResult | null;
        error: string;
    } | null;
    setFileBrowser: (val: {
        open: boolean;
        loading: boolean;
        list: import('../../core/types.ts').BrowseResult | null;
        error: string;
    } | null) => void;
    mutate: (args: Record<string, unknown>) => Promise<unknown>;
    openRoleEditor: (role: SnapshotRole | null) => Promise<void>;
    openBrowser: (path: string | undefined) => Promise<void>;
    selectCurrentDir: () => void;
}
export declare function AsidePanel(props: AsidePanelProps): ReactNode;
export {};
