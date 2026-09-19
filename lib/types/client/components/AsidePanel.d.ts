/**
 * 右侧成员与工作区栏组件。工作区目录编辑态（草稿、文件浏览器）为栏内自有状态。
 * @module dsh-group-chat/client/components
 */
import { type ReactNode } from 'react';
import { type ClientSnapshot, type SnapshotRole } from '../lib/model.ts';
interface AsidePanelProps {
    snap: ClientSnapshot;
    group: ClientSnapshot['groups'][number];
    asideOpen: boolean;
    mutate: (args: Record<string, unknown>) => Promise<unknown>;
    openRoleEditor: (role: SnapshotRole | null) => void;
}
export declare function AsidePanel(props: AsidePanelProps): ReactNode;
export {};
