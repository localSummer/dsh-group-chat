/**
 * 设置页：启停开关（settings.section 插槽）。写 host 的 group-chat 设置
 * 命名空间（settings.yaml 持久化）。
 * @module dsh-group-chat/client/settings
 */
import { type ReactNode } from 'react';
import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client';
/** Host 侧注册的设置命名空间 shape。 */
interface GroupChatSettings {
    enabled?: boolean;
}
export declare function GroupChatSettingsSection(props: {
    settingsScope: SettingsScope<GroupChatSettings>;
}): ReactNode;
export {};
