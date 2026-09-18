/**
 * 左侧导航栏组件
 * @module dsh-group-chat/client/components
 */
import type { ReactNode } from 'react';
import { type ClientSnapshot } from '../lib/model.ts';
interface NavPanelProps {
    snap: ClientSnapshot;
    search: string;
    setSearch: (val: string) => void;
    collapsedGroups: Set<string>;
    setCollapsedGroups: (fn: (prev: Set<string>) => Set<string>) => void;
    gid: string | null;
    sid: string | null;
    setGid: (val: string) => void;
    setSid: (val: string) => void;
    setPartsSel: (val: string[] | null) => void;
    renameDraft: {
        kind: 'group' | 'session';
        id: string;
        value: string;
    } | null;
    setRenameDraft: (val: {
        kind: 'group' | 'session';
        id: string;
        value: string;
    } | null) => void;
    confirmDel: {
        kind: 'group' | 'session';
        id: string;
    } | null;
    setConfirmDel: (val: {
        kind: 'group' | 'session';
        id: string;
    } | null) => void;
    mutate: (args: Record<string, unknown>) => Promise<unknown>;
    navOpen: boolean;
}
export declare function NavPanel(props: NavPanelProps): ReactNode;
export {};
