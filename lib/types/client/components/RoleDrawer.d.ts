/**
 * 角色编辑抽屉（右侧滑出，不遮挡会话流阅读）。
 * @module dsh-group-chat/client/drawer
 */
import { type ReactNode } from 'react';
import { type ModelsResponse, type RoleDraft } from '../lib/model.ts';
export interface RoleDrawerProps {
    draft: RoleDraft;
    set: (draft: RoleDraft) => void;
    /** 保存目标群组（upsertRole 落库）。 */
    groupId: string;
    models: ModelsResponse | null;
    modelsError: string | null;
    onRetryModels: () => void;
    mutate: (args: Record<string, unknown>) => Promise<unknown>;
    onCancel: () => void;
}
export declare function RoleDrawer(props: RoleDrawerProps): ReactNode;
