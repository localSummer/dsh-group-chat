/**
 * 文件搜索 hook：防抖 + 取消过期请求 + 短缓存。
 * @module dsh-group-chat/client/hooks
 */

import { useEffect, useState } from 'react'
import { api } from '../lib/api.ts'
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

const DEBOUNCE_MS = 180
const CACHE_LIMIT = 20
const cache = new Map<string, FileCandidate[]>()

function cacheGet(key: string): FileCandidate[] | undefined {
  const hit = cache.get(key)
  if (!hit) return undefined
  cache.delete(key)
  cache.set(key, hit)
  return hit
}

function cacheSet(key: string, value: FileCandidate[]): void {
  cache.delete(key)
  cache.set(key, value)
  if (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
}

function isAbort(err: unknown): boolean {
  return !!err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'AbortError'
}

/**
 * 文件搜索：query 变化 180ms 内合并；过期 fetch 真正 abort；
 * 命中短缓存立刻出结果。离开文件模式才清空列表，避免每个按键闪「检索中」。
 */
export function useFileSearch(
  mention: AtToken | null,
  groupId: string | undefined,
): FileSearchResult {
  const [fileCandidates, setFileCandidates] = useState<FileCandidate[]>([])
  const [fileSearchError, setFileSearchError] = useState<string | null>(null)
  const [fileSearchLoading, setFileSearchLoading] = useState(false)

  const query = mention && mention.query !== '' ? mention.query : null

  useEffect(() => {
    if (query === null || !groupId) {
      setFileCandidates([])
      setFileSearchError(null)
      setFileSearchLoading(false)
      return
    }

    const key = groupId + '\0' + query
    const hit = cacheGet(key)
    if (hit) {
      setFileCandidates(hit)
      setFileSearchError(null)
      setFileSearchLoading(false)
      return
    }

    const controller = new AbortController()
    setFileSearchLoading(true)
    const timer = window.setTimeout(() => {
      const run = async () => {
        try {
          const res = await api.action({
            kind: 'fileSearch',
            groupId,
            query,
          }, controller.signal) as { ok: true, candidates?: FileCandidate[] } | { ok: false, error?: string }

          if (controller.signal.aborted) return
          if (res.ok) {
            const next = res.candidates || []
            cacheSet(key, next)
            setFileCandidates(next)
            setFileSearchError(null)
          } else {
            setFileCandidates([])
            setFileSearchError(res.error || '文件检索失败')
          }
        } catch (err) {
          if (controller.signal.aborted || isAbort(err)) return
          setFileCandidates([])
          setFileSearchError(String(err))
        } finally {
          if (!controller.signal.aborted) setFileSearchLoading(false)
        }
      }
      run()
    }, DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query, groupId])

  return { fileCandidates, fileSearchError, fileSearchLoading }
}
