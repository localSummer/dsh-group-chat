/**
 * dsh-group-chat — 浏览器半（web 客户端模块）。
 *
 * 经 window.__ModuleLoader__.load 注册（由 tsdown 预设的 banner/footer 闭包
 * 工厂外壳生成）；factory 返回 Cordis 客户端插件：
 *  - 「模型群聊」设置页（settings.section）：启停开关，写 host 的 group-chat
 *    设置命名空间（settings.yaml 持久化）
 *  - 启用时挂载：侧边栏「群聊」入口（sidebar.panellist）+ 中央主面板（main）
 *  - 面板数据走 /api/group-chat/*（fetch + SSE），Host 半持有全部状态
 *  - DSW 原语（@deepseek-ai/dsh-client-ui-primitives，shell 静态种子模块）
 *    提供按钮/输入/开关/菜单/图标与 MarkdownText 渲染器
 *
 * 设计契约（impeccable direction contract；seed key 76db9e37，surface roll
 * 第 4/6/1 手中用户锁定 C「三区工作台」，代码先行）：
 * THESIS 三区工作台；FIRST VIEWPORT 左 232px 导航 + 中央会话流 + 右 304px
 * 上下文栏（窄容器覆盖式、可收起）。完整契约见 docs/DESIGN.md。
 *
 * @module dsh-group-chat/client
 */

import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only：拉入浏览器面的 Context 合并（ctx.settingsScope）。
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only：拉入 ctx.slots 合并（renderer 自 0.1.2 起拥有槽位注册表）。
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import { createElement as h } from 'react'
import { injectStyles } from './styles.ts'
import { GroupChatPanel } from './panel.ts'
import { GroupChatSettingsSection } from './settings.ts'
import { Glyph } from './glyph.ts'

/** Host 侧注册的设置命名空间 shape 与命名名（与宿主半拼写同一值，两边不共享代码）。 */
interface GroupChatSettings {
  enabled?: boolean
}
const SETTINGS_NAMESPACE = 'group-chat'

/** Required services. */
export const inject = ['slots', 'settingsScope']

/**
 * Shell 布局槽位的类型声明镜像（运行时由外壳的 layout/sidebar 包声明）：
 * 中央主面板为 keyed 槽（按 key 挂载），侧边栏面板列表为 list 槽
 * （id + order + label）。参照 dsh-web 家族外部包的自声明模式。
 */
declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    /** 中央主面板：按 key 挂载一个面板组件。 */
    'main': { kind: 'keyed', scope: 'root', owner: Record<string, never> }
    /** 侧边栏面板列表行：图标 + 标签入口。 */
    'sidebar.panellist': { kind: 'list', scope: 'root', owner: { size?: number } }
  }
}

/**
 * 客户端插件体：设置页常驻注册 + 启用门控挂载侧边栏入口与主面板。
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  injectStyles()

  const scope: SettingsScope<GroupChatSettings> = ctx.settingsScope.bind({ namespace: SETTINGS_NAMESPACE })

  // 设置页常驻注册（禁用时也保留入口，便于重新启用）
  ctx.slots.inject('settings.section', () =>
    ctx.slots.register(
      {
        name: 'settings.section',
        id: 'dsh-group-chat',
        order: 60,
        label: () => '模型群聊',
        inject: () => ({ settingsScope: scope }),
      },
      (props: { settingsScope: SettingsScope<GroupChatSettings> }) => h(GroupChatSettingsSection, props),
    ),
  )

  // 启用门控：enabled 为 false 时卸载侧边栏入口与主面板
  let uiDisposer: (() => void) | undefined
  const mountUi = (): void => {
    if (uiDisposer !== undefined) return
    const disposers: (() => void)[] = []
    try {
      disposers.push(ctx.slots.inject('main', () =>
        ctx.slots.register({ name: 'main', key: 'group-chat' }, () => h(GroupChatPanel, null))))
      disposers.push(ctx.slots.inject('sidebar.panellist', () =>
        ctx.slots.register({ name: 'sidebar.panellist', id: 'group-chat', order: 50, label: '群聊' }, (props: { size?: number }) => h(Glyph, props))))
    } catch (e) {
      console.error('[dsh-group-chat] mount failed:', e)
    }
    uiDisposer = () => {
      uiDisposer = undefined
      for (const dispose of disposers.splice(0)) dispose()
    }
  }
  const syncEnabled = (): void => {
    const snapshot = scope.getSnapshot()
    const on = snapshot.status === 'ready'
      ? (snapshot.value && snapshot.value.enabled) !== false
      : snapshot.status === 'unavailable'
    if (on) mountUi()
    else if (uiDisposer !== undefined) uiDisposer()
  }
  scope.subscribe(syncEnabled)
  syncEnabled()
}
