/**
 * 侧边栏入口图标。
 *
 * 整行命中层携带 “newSession” 类名：任务看板等 DOM 注入式面板用
 * [class*="newSession"] 识别“侧边栏导航点击”并自动收起自己，与点击
 * “新建会话”行为一致——类名不可哈希化。
 * @module dsh-group-chat/client/glyph
 */

import type { ReactNode } from 'react'

export function Glyph(props: { size?: number }): ReactNode {
  const size = (props && props.size) || 18
  return (
    <span className="dsgc-entryOverlay newSession">
      <span className="dsgc-entryIcon">
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx={9} cy={7} r={4} />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </span>
    </span>
  )
}
