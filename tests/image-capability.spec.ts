/**
 * 图片能力判定：客户端据此决定上传按钮可用性。
 * 语义与 harness 对齐——inputModalities 缺省是「未知」而非「不支持」，
 * 只有显式声明了模态且不含 image 才判为不支持（避免误禁用上传）。
 */
import { describe, expect, it } from 'vitest'
import { rolesAcceptImages, type ModelsResponse } from '../src/client/lib/model.ts'

const catalog = (mods: string[] | undefined): ModelsResponse => ({
  ok: true,
  providers: [{ id: 'p' }],
  modelsByProvider: { p: [{ id: 'm', ...(mods ? { inputModalities: mods } : {}) }] },
})

describe('rolesAcceptImages', () => {
  it('显式声明含 image → 支持', () => {
    expect(rolesAcceptImages([{ provider: 'p', model: 'm' }], catalog(['text', 'image']))).toBe(true)
  })

  it('显式声明不含 image → 不支持', () => {
    expect(rolesAcceptImages([{ provider: 'p', model: 'm' }], catalog(['text']))).toBe(false)
  })

  it('未声明 inputModalities → 不判为不支持（未知不等于负面能力）', () => {
    expect(rolesAcceptImages([{ provider: 'p', model: 'm' }], catalog(undefined))).toBe(true)
  })

  it('模型目录未加载 → 不判为不支持', () => {
    expect(rolesAcceptImages([{ provider: 'p', model: 'm' }], null)).toBe(true)
  })

  it('模型不在目录中 → 不判为不支持', () => {
    expect(rolesAcceptImages([{ provider: 'p', model: 'unknown' }], catalog(['text']))).toBe(true)
  })

  it('多个角色：任一不支持即整体不支持', () => {
    const models: ModelsResponse = {
      ok: true,
      providers: [{ id: 'p' }],
      modelsByProvider: {
        p: [
          { id: 'ok', inputModalities: ['text', 'image'] },
          { id: 'no', inputModalities: ['text'] },
        ],
      },
    }
    expect(rolesAcceptImages([{ provider: 'p', model: 'ok' }], models)).toBe(true)
    expect(rolesAcceptImages([{ provider: 'p', model: 'ok' }, { provider: 'p', model: 'no' }], models)).toBe(false)
  })
})

/**
 * 发送按钮的启用条件（P1 回归）：纯图片消息（有图无文）必须可发送。
 * 与 GroupChatPanel.sendMsg 的守卫 `!input.trim() && images.length === 0` 对齐。
 */
describe('发送按钮启用条件', () => {
  const canSend = (o: { text: string, images: number, uploading: boolean, roles: number, sess: boolean }): boolean =>
    !((!o.text.trim() && o.images === 0) || o.uploading || (o.roles === 0) || !o.sess)

  it('有文字无图 → 可发', () => {
    expect(canSend({ text: 'hi', images: 0, uploading: false, roles: 1, sess: true })).toBe(true)
  })

  it('有图无文字 → 可发（纯图片消息）', () => {
    expect(canSend({ text: '', images: 1, uploading: false, roles: 1, sess: true })).toBe(true)
  })

  it('无文字无图 → 不可发', () => {
    expect(canSend({ text: '   ', images: 0, uploading: false, roles: 1, sess: true })).toBe(false)
  })

  it('上传中 → 不可发（即使已有图）', () => {
    expect(canSend({ text: '', images: 1, uploading: true, roles: 1, sess: true })).toBe(false)
  })

  it('无参与角色 → 不可发', () => {
    expect(canSend({ text: 'hi', images: 1, uploading: false, roles: 0, sess: true })).toBe(false)
  })
})
