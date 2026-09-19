/**
 * 提及状态 hook：封装角色/文件提及相关的派生状态计算
 * @module dsh-group-chat/client/hooks
 */

import { useMemo } from 'react'
import { escapeRegExp, type SnapshotRole } from '../lib/model.ts'
import type { AtToken } from '../../shared/file-mention-grammar.ts'

/**
 * 计算角色提及候选列表
 * @param mention - 当前 @ token 状态
 * @param enabledRoles - 启用的角色列表
 * @returns 角色候选列表（仅在角色模式且 query 为空时返回）
 */
export function useMentionCandidates(
  mention: AtToken | null,
  enabledRoles: SnapshotRole[],
): SnapshotRole[] {
  return useMemo(() => {
    // 角色模式：仅当 mention 存在且 query 为空时显示全部启用角色
    return mention !== null && mention.query === '' ? enabledRoles : []
  }, [mention, enabledRoles])
}

/**
 * 检测输入文本中被 @ 的角色
 * @param input - 输入文本
 * @param enabledRoles - 启用的角色列表
 * @returns 被提及的角色列表
 */
export function useMentionedRoles(
  input: string,
  enabledRoles: SnapshotRole[],
): SnapshotRole[] {
  return useMemo(() => {
    return enabledRoles.filter((r) =>
      new RegExp('(^|\\s)@' + escapeRegExp(r.name) + '(?=\\s|$)').test(input)
    )
  }, [input, enabledRoles])
}

/**
 * 计算安全的候选索引（确保不越界）
 * @param candidatesLength - 候选列表长度
 * @param currentIndex - 当前索引
 * @returns 安全的索引值
 */
export function useSafeMentionIndex(
  candidatesLength: number,
  currentIndex: number,
): number {
  return useMemo(() => {
    return candidatesLength ? Math.min(currentIndex, candidatesLength - 1) : 0
  }, [candidatesLength, currentIndex])
}
