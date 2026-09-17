/**
 * 浏览器半 UI 基座：DSW 原语（shell 静态种子模块，loader 模块表 external）
 * 与宽松 createElement 别名（移植期与原 JS 逐行对应）。
 * @module dsh-group-chat/client/ui
 */
import { type ReactNode } from 'react';
import * as P from '@deepseek-ai/dsh-client-ui-primitives';
export { P };
/** 宽松 createElement：组件类型由 DSW 原语包声明，移植期不做逐 props 收紧。 */
export declare const h: (type: unknown, props?: Record<string, unknown> | null, ...children: unknown[]) => ReactNode;
/** 图标组件的调用形态。 */
type IconComponent = (props: Record<string, unknown>) => unknown;
/** 按名取 DSW 原语（图标表驱动）。 */
export declare function pickPrimitive(name: string): IconComponent;
/** 以统一 size 包装图标组件调用。 */
export declare function Icon(comp: unknown, size: number, extra?: Record<string, unknown>): unknown;
