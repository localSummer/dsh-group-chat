/**
 * 输入草稿按会话 id 分槽：读写隔离、空槽删除、LRU 上限。
 */
import { afterEach, describe, expect, it } from 'vitest'
import type { ImageAttachmentRef } from '@deepseek-ai/dsh-attachment'
import {
  clearComposerDraft,
  detachImageChips,
  readComposerDraft,
  resetComposerDrafts,
  writeComposerDraft,
} from '../src/client/lib/composer-draft.ts'

afterEach(() => { resetComposerDrafts() })

describe('composer-draft', () => {
  it('按 sessionId 分槽，互不覆盖', () => {
    writeComposerDraft('s-a', '<b>A</b>', 'A')
    writeComposerDraft('s-b', '<i>B</i>', 'B')
    expect(readComposerDraft('s-a')).toEqual({ html: '<b>A</b>', text: 'A', images: [] })
    expect(readComposerDraft('s-b')).toEqual({ html: '<i>B</i>', text: 'B', images: [] })
  })

  it('空 html+text 且无图片时删除该槽；缺 id 不写入', () => {
    writeComposerDraft('s-a', '<p>x</p>', 'x')
    writeComposerDraft('s-a', '', '')
    expect(readComposerDraft('s-a')).toEqual({ html: '', text: '', images: [] })
    writeComposerDraft(null, '<p>x</p>', 'x')
    writeComposerDraft(undefined, '<p>x</p>', 'x')
    expect(readComposerDraft(null)).toEqual({ html: '', text: '', images: [] })
  })

  it('纯图片草稿留槽', () => {
    const image = { attachmentId: 'att-1' as ImageAttachmentRef['attachmentId'], mediaType: 'image/png' as const, bytes: 4, width: 8, height: 6, name: 'a.png' }
    writeComposerDraft('s-a', '', '', [image])
    expect(readComposerDraft('s-a').images).toEqual([image])
    writeComposerDraft('s-a', '', '', [])
    expect(readComposerDraft('s-a').images).toEqual([])
  })

  it('clear 只删指定槽', () => {
    writeComposerDraft('s-a', 'a', 'a')
    writeComposerDraft('s-b', 'b', 'b')
    clearComposerDraft('s-a')
    expect(readComposerDraft('s-a')).toEqual({ html: '', text: '', images: [] })
    expect(readComposerDraft('s-b')).toEqual({ html: 'b', text: 'b', images: [] })
  })

  it('超过 32 槽淘汰最旧', () => {
    for (let i = 0; i < 33; i++) writeComposerDraft('s-' + i, 'h' + i, 't' + i)
    expect(readComposerDraft('s-0')).toEqual({ html: '', text: '', images: [] })
    expect(readComposerDraft('s-1')).toEqual({ html: 'h1', text: 't1', images: [] })
    expect(readComposerDraft('s-32')).toEqual({ html: 'h32', text: 't32', images: [] })
  })

  it('从旧草稿 HTML 抽出图片芯片', () => {
    const html = '<span class="dsgc-chipin dsgc-chipin-image" data-kind="image" data-attachment-id="id1" data-media-type="image/png" data-bytes="4" data-width="8" data-height="6" data-name="a&quot;b.png"><img src="/x" alt="a" /></span> hi'
    const out = detachImageChips(html)
    expect(out.html).toBe(' hi')
    expect(out.images).toEqual([{
      attachmentId: 'id1',
      mediaType: 'image/png',
      bytes: 4,
      width: 8,
      height: 6,
      name: 'a"b.png',
    }])
    expect(detachImageChips('plain')).toEqual({ html: 'plain', images: [] })
  })
})
