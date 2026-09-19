/**
 * 消息输入相关 hooks
 * @module dsh-group-chat/client/hooks
 */

import { useCallback, useEffect, useLayoutEffect, useRef, type ClipboardEvent as ReactClipboardEvent, type DragEvent as ReactDragEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { execCommand, queryAtCaret, serializeInput, chipHtml, fileChipHtml } from '../utils/utils.ts'
import { readComposerDraft, writeComposerDraft } from '../lib/composer-draft.ts'
import type { AtToken } from '../../shared/file-mention-grammar.ts'
import type { SnapshotRole } from '../lib/model.ts'

export function useComposerEffects(
  inputRef: React.RefObject<HTMLDivElement>,
  scrollRef: React.RefObject<HTMLDivElement>,
  input: string,
  atBottom: boolean,
  snap: unknown,
) {
  // 贴底时新内容自动跟随滚动
  const onMsgsScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60
    return isAtBottom
  }, [scrollRef])

  useEffect(() => {
    const el = scrollRef.current
    if (el && atBottom) el.scrollTop = el.scrollHeight
  }, [snap, atBottom, scrollRef])

  // composer 输入框随内容自适应高度
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(180, Math.max(36, el.scrollHeight)) + 'px'
  }, [input, inputRef])

  return { onMsgsScroll }
}

export function useComposerInput(
  inputRef: React.RefObject<HTMLDivElement>,
  setInput: (val: string) => void,
  setMention: (val: AtToken | null) => void,
  setMentionIdx: (val: number) => void,
  sessionId?: string | null,
) {
  const sessionIdRef = useRef(sessionId)
  sessionIdRef.current = sessionId

  /** 从 DOM 同步 input 状态（序列化），并写入当前会话草稿槽。 */
  const syncFromDOM = useCallback((): void => {
    const el = inputRef.current
    if (!el) return
    const text = serializeInput(el)
    setInput(text)
    writeComposerDraft(sessionIdRef.current, el.innerHTML, text)
  }, [inputRef, setInput])

  const onInputCE = useCallback((): void => {
    syncFromDOM()
    setMention(queryAtCaret())
    setMentionIdx(0)
  }, [syncFromDOM, setMention, setMentionIdx])

  /** 粘贴/拖放强制纯文本 */
  const onPasteCE = useCallback((e: ReactClipboardEvent<HTMLDivElement>): void => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    if (text) execCommand('insertText', text)
  }, [])

  const onDragOverCE = useCallback((e: ReactDragEvent<HTMLDivElement>): void => {
    e.preventDefault()
  }, [])

  const onDropCE = useCallback((e: ReactDragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    const text = e.dataTransfer.getData('text/plain')
    if (text) execCommand('insertText', text)
  }, [])

  return {
    syncFromDOM,
    onInputCE,
    onPasteCE,
    onDragOverCE,
    onDropCE,
  }
}

/**
 * 按会话恢复草稿：切会话时先把当前 HTML 写入旧槽，再灌入新槽；
 * 面板重挂载（主会话⇄群聊）时 editor 是新节点，从模块缓存灌回。
 */
export function useComposerDraft(
  sessionId: string | null | undefined,
  inputRef: React.RefObject<HTMLDivElement>,
  setInput: (val: string) => void,
  setMention: (val: AtToken | null) => void,
): void {
  const prevIdRef = useRef<string | null>(null)
  useLayoutEffect(() => {
    const el = inputRef.current
    const prev = prevIdRef.current
    const next = sessionId || null
    if (el && prev && prev !== next) writeComposerDraft(prev, el.innerHTML, serializeInput(el))
    prevIdRef.current = next
    if (!next) return
    const draft = readComposerDraft(next)
    if (el) el.innerHTML = draft.html
    setInput(draft.text)
    setMention(null)
    return () => {
      const node = inputRef.current
      const id = prevIdRef.current
      if (node && id) writeComposerDraft(id, node.innerHTML, serializeInput(node))
    }
  }, [sessionId, inputRef, setInput, setMention])
}

export function useMentionChip(
  inputRef: React.RefObject<HTMLDivElement>,
  setMention: (val: AtToken | null) => void,
  setMentionIdx: (val: number) => void,
  syncFromDOM: () => void,
) {
  /** 弹层候选 → 删掉光标前的 @词、插入原子芯片 + 尾随空格 */
  const insertChip = useCallback((role: SnapshotRole): void => {
    const el = inputRef.current
    const sel = window.getSelection()
    if (!el || !sel) return
    if (!sel.anchorNode || !el.contains(sel.anchorNode)) return
    el.focus({ preventScroll: true })
    
    // 1. 删除光标前的 @token（包括引号）
    const node = sel.anchorNode
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue || ''
      const off = sel.anchorOffset
      const before = text.slice(0, off)
      // 匹配 @词 或 @"词
      const m = /(?:^|\s)@("?)([^"\s@]*)$/.exec(before)
      if (m) {
        const prefixLen = m[1] ? 2 : 1  // @" 或 @
        const queryLen = m[2].length
        const start = off - prefixLen - queryLen
        if (start >= 0) {
          const range = document.createRange()
          range.setStart(node, start)
          range.setEnd(node, off)
          sel.removeAllRanges()
          sel.addRange(range)
          execCommand('delete')
        }
      }
    }
    
    // 2. 插入芯片
    execCommand('insertHTML', chipHtml(role).replace('class="dsgc-chipin"', 'class="dsgc-chipin" data-new=""'))
    const chip = el.querySelector<HTMLElement>('.dsgc-chipin[data-new]')
    if (!chip) return
    
    // 3. 选区显式钉到芯片之后，再补尾随空格
    const after = document.createRange()
    after.setStartAfter(chip)
    after.collapse(true)
    sel.removeAllRanges()
    sel.addRange(after)
    execCommand('insertText', ' ')
    chip.removeAttribute('data-new')
    setMention(null)
    setMentionIdx(0)
    syncFromDOM()
  }, [inputRef, setMention, setMentionIdx, syncFromDOM])

  const insertFileChip = useCallback((path: string, kind: 'file' | 'directory'): void => {
    const el = inputRef.current
    const sel = window.getSelection()
    if (!el || !sel) return
    if (!sel.anchorNode || !el.contains(sel.anchorNode)) return
    el.focus({ preventScroll: true })
    
    // 1. 删除光标前的 @token（包括引号）
    const node = sel.anchorNode
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue || ''
      const off = sel.anchorOffset
      const before = text.slice(0, off)
      // 匹配 @词 或 @"词
      const m = /(?:^|\s)@("?)([^"\s@]*)$/.exec(before)
      if (m) {
        const prefixLen = m[1] ? 2 : 1  // @" 或 @
        const queryLen = m[2].length
        const start = off - prefixLen - queryLen
        if (start >= 0) {
          const range = document.createRange()
          range.setStart(node, start)
          range.setEnd(node, off)
          sel.removeAllRanges()
          sel.addRange(range)
          execCommand('delete')
        }
      }
    }
    
    // 2. 插入文件芯片
    execCommand('insertHTML', fileChipHtml(path, kind).replace('class="dsgc-chipin dsgc-chipin-file"', 'class="dsgc-chipin dsgc-chipin-file" data-new=""'))
    const chip = el.querySelector<HTMLElement>('.dsgc-chipin[data-new]')
    if (!chip) return
    
    // 3. 选区显式钉到芯片之后，再补尾随空格
    const after = document.createRange()
    after.setStartAfter(chip)
    after.collapse(true)
    sel.removeAllRanges()
    sel.addRange(after)
    execCommand('insertText', ' ')
    chip.removeAttribute('data-new')
    setMention(null)
    setMentionIdx(0)
    syncFromDOM()
  }, [inputRef, setMention, setMentionIdx, syncFromDOM])

  return { insertChip, insertFileChip }
}

export function useInputKeyboard(
  mention: AtToken | null,
  mentionCandidates: SnapshotRole[],
  mentionIdxC: number,
  setMentionIdx: (val: number | ((prev: number) => number)) => void,
  insertChip: (role: SnapshotRole) => void,
  insertFileChip: (path: string, kind: 'file' | 'directory') => void,
  fileCandidates: Array<{ path: string; isDir: boolean }>,
  setMention: (val: AtToken | null) => void,
  sendMsg: () => Promise<void>,
) {
  const onInputKeyDown = useCallback((e: ReactKeyboardEvent<HTMLDivElement>): void => {
    // IME 组合中的按键不参与任何快捷逻辑
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    
    // 角色模式（裸 @）：Enter/Tab 插入角色芯片
    if (mention !== null && mention.query === '' && mentionCandidates.length) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionIdx((mentionIdxC + 1) % mentionCandidates.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionIdx((mentionIdxC - 1 + mentionCandidates.length) % mentionCandidates.length)
        return
      }
      if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Tab') {
        e.preventDefault()
        insertChip(mentionCandidates[mentionIdxC])
        return
      }
    }
    
    // 文件模式（@ + query）：Enter 插入文件/Tab 钻入目录/Esc 关闭
    if (mention !== null && mention.query !== '' && fileCandidates.length) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionIdx((mentionIdxC + 1) % fileCandidates.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionIdx((mentionIdxC - 1 + fileCandidates.length) % fileCandidates.length)
        return
      }
      const selectedItem = fileCandidates[mentionIdxC]
      if (selectedItem) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          insertFileChip(selectedItem.path, selectedItem.isDir ? 'directory' : 'file')
          return
        }
        if (e.key === 'Tab' && selectedItem.isDir) {
          e.preventDefault()
          insertFileChip(selectedItem.path, 'directory')
          return
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setMention(null)
        return
      }
    }
    
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      execCommand('insertLineBreak')
      return
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMsg()
    }
  }, [mention, mentionCandidates, mentionIdxC, fileCandidates, setMentionIdx, insertChip, insertFileChip, setMention, sendMsg])

  return { onInputKeyDown }
}
