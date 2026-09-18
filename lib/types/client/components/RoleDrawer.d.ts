/**
 * 角色编辑抽屉（右侧滑出，不遮挡会话流阅读）。
 * @module dsh-group-chat/client/drawer
 */
import { type ReactNode } from 'react';
import { type ModelsResponse, type RoleDraft } from '../lib/model.ts';
export interface RoleDrawerProps {
    draft: RoleDraft;
    set: (draft: RoleDraft) => void;
    models: ModelsResponse | null;
    modelsError: string | null;
    onRetryModels: () => void;
    onSave: () => void;
    onCancel: () => void;
    formError: string;
}
export declare function RoleDrawer(props: RoleDrawerProps): ReactNode;
