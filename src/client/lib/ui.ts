/**
 * 浏览器半 UI 基座：DSW 原语（shell 静态种子模块，loader 模块表 external）
 * 与动态图标 / 命令式 createElement 辅助。组件主体已 JSX 化（.tsx）；此处
 * 仅保留 slot 注册回调与动态图标表需要的少量命令式辅助。
 * @module dsh-group-chat/client/ui
 */

import { createElement, type ReactNode } from 'react'
import * as P from '@deepseek-ai/dsh-client-ui-primitives'

export { P }

/** 命令式 createElement（仅 slot 注册回调用）。 */
export const h = createElement as unknown as (type: unknown, props?: Record<string, unknown> | null, ...children: unknown[]) => ReactNode

/** 图标组件的调用形态。 */
export type IconComponent = (props: Record<string, unknown>) => ReactNode

/** 按名取 DSW 原语（图标表驱动）。 */
export function pickPrimitive(name: string): IconComponent {
  return (P as unknown as Record<string, IconComponent>)[name]
}

/** 以统一 size 包装图标组件调用（放在 JSX 子元素位）。 */
export function Icon(comp: unknown, size: number, extra?: Record<string, unknown>): ReactNode {
  return h(comp as never, Object.assign({ size }, extra || {}))
}
