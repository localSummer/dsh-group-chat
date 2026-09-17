/**
 * 侧边栏入口图标。
 *
 * 整行命中层携带 “newSession” 类名：任务看板等 DOM 注入式面板用
 * [class*="newSession"] 识别“侧边栏导航点击”并自动收起自己，与点击
 * “新建会话”行为一致——类名不可哈希化。
 * @module dsh-group-chat/client/glyph
 */
import { createElement as h } from 'react';
export declare function Glyph(props: {
    size?: number;
}): ReturnType<typeof h>;
