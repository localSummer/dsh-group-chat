/**
 * 输入草稿按会话 id 分槽：读写隔离、空槽删除、LRU 上限。
 */
import { afterEach, describe, expect, it } from 'vitest'
import {
  clearComposerDraft,
  readComposerDraft,
  resetComposerDrafts,
  writeComposerDraft,
} from '../src/client/lib/composer-draft.ts'

afterEach(() => { resetComposerDrafts() })

describe('composer-draft', () => {
  it('按 sessionId 分槽，互不覆盖', () => {
    writeComposerDraft('s-a', '<b>A</b>', 'A')
    writeComposerDraft('s-b', '<i>B</i>', 'B')
    expect(readComposerDraft('s-a')).toEqual({ html: '<b>A</b>', text: 'A' })
    expect(readComposerDraft('s-b')).toEqual({ html: '<i>B</i>', text: 'B' })
  })

  it('空 html+text 删除该槽；缺 id 不写入', () => {
    writeComposerDraft('s-a', '<p>x</p>', 'x')
    writeComposerDraft('s-a', '', '')
    expect(readComposerDraft('s-a')).toEqual({ html: '', text: '' })
    writeComposerDraft(null, '<p>x</p>', 'x')
    writeComposerDraft(undefined, '<p>x</p>', 'x')
    expect(readComposerDraft(null)).toEqual({ html: '', text: '' })
  })

  it('clear 只删指定槽', () => {
    writeComposerDraft('s-a', 'a', 'a')
    writeComposerDraft('s-b', 'b', 'b')
    clearComposerDraft('s-a')
    expect(readComposerDraft('s-a')).toEqual({ html: '', text: '' })
    expect(readComposerDraft('s-b')).toEqual({ html: 'b', text: 'b' })
  })

  it('超过 32 槽淘汰最旧', () => {
    for (let i = 0; i < 33; i++) writeComposerDraft('s-' + i, 'h' + i, 't' + i)
    expect(readComposerDraft('s-0')).toEqual({ html: '', text: '' })
    expect(readComposerDraft('s-1')).toEqual({ html: 'h1', text: 't1' })
    expect(readComposerDraft('s-32')).toEqual({ html: 'h32', text: 't32' })
  })
})
