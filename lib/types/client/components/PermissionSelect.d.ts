/**
 * 群组权限档位选择器（对齐主会话 composer 左下角的 /permission 选择器）：
 * 触发芯片（盾形图标 + 档位名 + chevron）+ Menu 上弹三档 + 完全权限风险
 * 确认弹窗（与主会话同款 RiskConfirmation 原语与文案）。
 * @module dsh-group-chat/client/permission-select
 */
import { type ReactNode } from 'react';
import type { PermissionTier } from '../../core/types.ts';
export interface PermissionSelectProps {
    tier: PermissionTier;
    onSelect: (tier: PermissionTier) => void;
}
export declare function PermissionSelect(props: PermissionSelectProps): ReactNode;
