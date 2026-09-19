/**
 * 左侧导航栏组件（群组 → 会话目录树；群组行与会话行共用重命名/删除三件套）。
 * @module dsh-group-chat/client/components
 */
import type { ReactNode } from 'react';
import { type ClientSnapshot } from '../lib/model.ts';
/** 目录树节点编辑态形状（群组/会话共用）。 */
type NodeEdit = {
    kind: 'group' | 'session';
    id: string;
    value: string;
};
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
    renameDraft: NodeEdit | null;
    setRenameDraft: (val: NodeEdit | null) => void;
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
