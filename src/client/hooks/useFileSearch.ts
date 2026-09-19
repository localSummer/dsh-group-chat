/**
 * 文件搜索 hook：封装文件检索的状态管理、API 调用和过期响应丢弃。
 * @module dsh-group-chat/client/hooks
 */

import { useEffect, useRef, useState } from 'react'
import type { AtToken } from '../../shared/file-mention-grammar.ts'

export interface FileCandidate {
  path: string
  isDir: boolean
}

export interface FileSearchResult {
  fileCandidates: FileCandidate[]
  fileSearchError: string | null
  fileSearchLoading: boolean
}

/**
 * 文件搜索 hook。
 * 仅依赖 query/groupId，不把 action 身份放进 effect——SSE 重渲染会换掉 action，
 * 旧实现据此 abort 后又不把 loading 置回 false，弹层会一直停在「检索中」。
 */
export function useFileSearch(
  mention: AtToken | null,
  groupId: string | undefined,
  action: (args: Record<string, unknown>) => Promise<unknown>,
): FileSearchResult {
  const [fileCandidates, setFileCandidates] = useState<FileCandidate[]>([])
  const [fileSearchError, setFileSearchError] = useState<string | null>(null)
  const [fileSearchLoading, setFileSearchLoading] = useState(false)
  const actionRef = useRef(action)
  actionRef.current = action

  const query = mention && mention.query !== '' ? mention.query : null

  useEffect(() => {
    if (query === null || !groupId) {
      setFileCandidates([])
      setFileSearchError(null)
      setFileSearchLoading(false)
      return
    }

    let cancelled = false
    setFileSearchLoading(true)

    void (async () => {
      try {
        const res = await actionRef.current({
          kind: 'fileSearch',
          groupId,
          query,
        }) as { ok: true, candidates?: FileCandidate[] } | { ok: false, error?: string } | null

        if (cancelled) return
        if (res && res.ok) {
          setFileCandidates(res.candidates || [])
          setFileSearchError(null)
        } else {
          setFileCandidates([])
          setFileSearchError((res && res.error) || '文件检索失败')
        }
      } catch (err) {
        if (cancelled) return
        setFileCandidates([])
        setFileSearchError(String(err))
      } finally {
        if (!cancelled) setFileSearchLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [query, groupId])

  return { fileCandidates, fileSearchError, fileSearchLoading }
}
