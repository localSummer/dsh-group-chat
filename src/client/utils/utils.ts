/**
 * 通用工具函数
 * @module dsh-group-chat/client/utils
 */

import { activeAtToken, formatFileMention, type AtToken, type FileCandidate } from '../../shared/file-mention-grammar.ts'

/** HTML 转义（芯片以 execCommand('insertHTML') 注入，角色名需转义）。 */
export function escapeHtml(v: string): string {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * execCommand 集中封装。它已被 Web 平台标记 @deprecated（ts 6387 编辑器提示），
 * 但仍是唯一能让 contenteditable 的 DOM 编辑进入浏览器原生 undo 栈的同步 API
 * （自研 undo 栈或引入 Lexical/ProseMirror 类框架代价更大；取舍见 DESIGN.md
 * Composer 契约）。经中间别名擦除废弃标记，全部调用走本封装，不在调用处散布提示。
 */
type ExecCommandFn = (commandId: string, showUI?: boolean, value?: string) => boolean
let execCommandFn: ExecCommandFn | undefined
export function execCommand(commandId: 'delete' | 'insertHTML' | 'insertText' | 'insertLineBreak', value?: string): boolean {
  execCommandFn ??= (document as unknown as { execCommand: ExecCommandFn }).execCommand
  return execCommandFn.call(document, commandId, false, value)
}

/**
 * contenteditable 输入区 → 纯文本序列化（发送/参与判定的唯一事实源）：
 * 文本节点原样；<br> → 换行；角色芯片（.dsgc-chipin[data-role-id]）展开回「@名字␠」；
 * 文件芯片（.dsgc-chipin[data-kind=file]）展开回「@path」或「@"path with spaces"」；
 * DIV/P 块前补换行（防粘贴残留的块级包裹）。
 */
export function serializeInput(root: HTMLElement): string {
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || ''
    if (node.nodeType !== Node.ELEMENT_NODE) return ''
    const el = node as HTMLElement
    if (el.tagName === 'BR') return '\n'
    if (el.classList.contains('dsgc-chipin')) {
      // 角色芯片
      if (el.dataset.roleId) {
        return '@' + (el.dataset.name || '') + ' '
      }
      // 文件芯片
      if (el.dataset.kind === 'file') {
        const path = el.dataset.path || ''
        const needsQuote = /\s/.test(path)
        return needsQuote ? `@"${path}"` : `@${path}`
      }
    }
    const sep = /^(DIV|P)$/.test(el.tagName) ? '\n' : ''
    return sep + Array.from(el.childNodes).map(walk).join('')
  }
  return Array.from(root.childNodes).map(walk).join('')
}

/** @角色芯片的 HTML（原子元素：contenteditable=false + draggable，退格整删）。 */
export function chipHtml(role: { id: string, name: string, color?: string }): string {
  const c = escapeHtml(role.color || '#888')
  return '<span class="dsgc-chipin" data-role-id="' + escapeHtml(role.id) + '" data-name="' + escapeHtml(role.name) + '" style="--role-color:' + c + '" contenteditable="false" draggable="true">' +
    '<span class="dsgc-chipdot" style="background:' + c + '"></span>' + escapeHtml(role.name) + '</span>'
}

/** @文件芯片的 HTML（原子元素：contenteditable=false + draggable，退格整删）。 */
export function fileChipHtml(path: string, kind: 'file' | 'directory'): string {
  const icon = kind === 'directory' ? '📁' : '📄'
  const basename = path.split('/').pop() || path
  return '<span class="dsgc-chipin dsgc-chipin-file" data-kind="file" data-path="' + escapeHtml(path) + '" contenteditable="false" draggable="true">' +
    icon + ' ' + escapeHtml(basename) + '</span>'
}

/**
 * 光标前的活跃 @token（角色或文件弹层触发判定）。
 * 
 * @returns AtToken 对象，包含 prefix/query/quoted；无返回 null
 */
export function queryAtCaret(): AtToken | null {
  const sel = window.getSelection()
  if (!sel || !sel.isCollapsed || sel.rangeCount === 0) return null
  const node = sel.anchorNode
  if (!node || node.nodeType !== Node.TEXT_NODE) return null
  const before = (node.nodeValue || '').slice(0, sel.anchorOffset)
  return activeAtToken(before, before.length) || null
}
