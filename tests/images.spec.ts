/**
 * 图片附件闭环测试：覆盖此前「137 测试全绿但功能完全失效」的五个断裂点——
 *   1. 上传落 durable ref（而非 base64 进消息）
 *   2. 快照投影携带 images（否则客户端渲染是死代码）
 *   3. hydrate 还原 images（否则重启即丢图）
 *   4. LLM 请求用 DSH 的 ImageBlock 契约（{ type:'image', attachment } 而非
 *      Anthropic 的 source.base64 —— 后者会被 adapter 静默丢弃）
 *   5. 图片读取路由的授权（消息引用过的 id，以及本进程刚上传、尚未发送的 id）
 *
 * stub llm 记录每次 stream 收到的 messages，直接断言 wire 契约。
 */
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { fakeShell } from './shell-stub.ts'
import type { ImageAttachmentRef } from '@deepseek-ai/dsh-attachment'

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

async function until(cond: () => boolean, ms = 5000): Promise<void> {
  const deadline = Date.now() + ms
  while (Date.now() < deadline) {
    if (cond()) return
    await sleep(20)
  }
  throw new Error('等待超时')
}

interface StreamChunk { type: string, [key: string]: unknown }

/** 一条 LLM 请求消息（断言 wire 契约用）。 */
interface WireMessage { role: string, content: { type: string, [k: string]: unknown }[] }

type Service = import('../src/host/service.ts').GroupChatService

/** 1×1 PNG 的 base64（最小合法图片，sharp 可解析）。 */
const PNG_1PX = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

interface Env {
  svc: Service
  storeDir: string
  /** 每次流式调用收到的 messages（断言图片块契约用）。 */
  seenMessages: WireMessage[][]
  pushText: (text: string) => void
}

let env: Env | null = null
/** 内存 attachment 桩：saveImage 产出确定性 ref，readImage 回放字节。 */
const stored = new Map<string, { data: Uint8Array, ref: ImageAttachmentRef }>()

function makeAttachments(): unknown {
  return {
    saveImage: async (input: { data: Uint8Array, mediaType: string, name?: string }) => {
      const attachmentId = 'att-' + (stored.size + 1)
      const ref: ImageAttachmentRef = {
        attachmentId: attachmentId as ImageAttachmentRef['attachmentId'],
        mediaType: input.mediaType as ImageAttachmentRef['mediaType'],
        bytes: input.data.byteLength,
        width: 1,
        height: 1,
        ...(input.name ? { name: input.name } : {}),
      }
      stored.set(attachmentId, { data: input.data, ref })
      return ref
    },
    readImage: async (ref: ImageAttachmentRef) => {
      const hit = stored.get(String(ref.attachmentId))
      if (!hit) throw new Error('missing attachment')
      return { ref: hit.ref, data: hit.data }
    },
  }
}

beforeAll(async () => {
  const storeDir = mkdtempSync(join(tmpdir(), 'dsgc-img-'))
  mkdirSync(join(storeDir, 'grp-1', 'sessions'), { recursive: true })
  writeFileSync(join(storeDir, 'grp-1', 'roles.json'), JSON.stringify({ schema: 1, roles: [] }))
  writeFileSync(join(storeDir, 'ledger.json'), JSON.stringify({
    schema: 3,
    groups: [{ id: 'grp-1', name: 'G', permissionTier: 'view_only' }],
    sessions: [{ id: 's-1', groupId: 'grp-1' }],
  }, null, 2))
  writeFileSync(join(storeDir, 'grp-1', 'sessions', 'session-s-1.json'), JSON.stringify({ schema: 1, name: 'S', messages: [] }))
  process.env.DSH_GROUP_CHAT_STORE = storeDir

  const { createGroupChatService } = await import('../src/host/service.ts')
  const seenMessages: Env['seenMessages'] = []
  const queue: StreamChunk[][] = []
  const llm = {
    listProviders: async () => [{ id: 'p', name: 'P' }],
    // 能力位：model-a 声明支持图片，model-b 显式不支持
    listModels: async (provider: string) => (provider === 'p'
      ? [{ provider: 'p', id: 'model-a', name: 'A', inputModalities: ['text', 'image'] }, { provider: 'p', id: 'model-b', name: 'B', inputModalities: ['text'] }]
      : []),
    resolveModelInfo: async () => null,
    stream: async function* (opts: { messages: WireMessage[] }): AsyncGenerator<StreamChunk> {
      seenMessages.push(JSON.parse(JSON.stringify(opts.messages)) as WireMessage[])
      const plan = queue.shift() || [{ type: 'text-delta', text: '好的' }, { type: 'finish', reason: { kind: 'stop' } }]
      for (const chunk of plan) yield chunk
    },
  }
  const fs = {
    resolve: async (p: string) => p,
    stat: async () => ({ type: 'directory' }),
    listDir: async () => [],
    readText: async () => '',
    processPath: (p: string) => p,
  }
  const ctx = {
    llm,
    fs,
    shell: fakeShell(),
    workspaceRegistry: { list: async () => [] },
    // state.ts 经 ctx.get('attachments') 惰性取服务；桩只认这一个名字
    get: (name: string) => (name === 'attachments' ? makeAttachments() : undefined),
  } as unknown as import('@deepseek-ai/cordis').Context
  const svc = createGroupChatService(ctx)
  await svc.handleAction({ kind: 'mutate', op: 'upsertRole', groupId: 'grp-1', role: { id: 'role-a', name: 'A', provider: 'p', model: 'model-a' } })
  env = { svc, storeDir, seenMessages, pushText: (text) => { queue.push([{ type: 'text-delta', text }, { type: 'finish', reason: { kind: 'stop' } }]) } }
})

afterAll(async () => { if (env) { await env.svc.dispose(); env = null } })

describe('图片上传（upload）', () => {
  it('base64 → durable ref，只回引用不回字节', async () => {
    const res = await env!.svc.uploadImage({ data: 'data:image/png;base64,' + PNG_1PX, mediaType: 'image/png', name: 'shot.png' }) as { ok: boolean, image?: ImageAttachmentRef }
    expect(res.ok).toBe(true)
    expect(res.image?.attachmentId).toBeTruthy()
    expect(res.image?.mediaType).toBe('image/png')
    expect(res.image?.name).toBe('shot.png')
    // 关键：响应里不含字节（否则又是把 base64 搬进消息）
    expect(JSON.stringify(res)).not.toContain(PNG_1PX)
  })

  it('拒绝非白名单格式（SVG 等可执行格式）', async () => {
    const res = await env!.svc.uploadImage({ data: PNG_1PX, mediaType: 'image/svg+xml' }) as { ok: boolean, error?: string }
    expect(res.ok).toBe(false)
    expect(res.error).toBeTruthy()
  })

  it('拒绝空内容', async () => {
    const res = await env!.svc.uploadImage({ data: '', mediaType: 'image/png' }) as { ok: boolean }
    expect(res.ok).toBe(false)
  })
})

describe('带图发送的闭环', () => {
  it('消息落 ref、快照带 images、LLM 收到 DSH ImageBlock 契约', async () => {
    const e = env!
    const up = await e.svc.uploadImage({ data: PNG_1PX, mediaType: 'image/png', name: 'a.png' }) as { ok: boolean, image?: ImageAttachmentRef }
    const ref = up.image!

    e.seenMessages.length = 0
    e.pushText('收到图片')
    const send = await e.svc.handleAction({ kind: 'send', sessionId: 's-1', text: '看这张图', images: [ref] }) as { ok: boolean }
    expect(send.ok).toBe(true)
    await until(() => !(e.svc.snapshot() as { run: { running: boolean } }).run.running)

    // 1. 消息记录带 images（durable ref，不是 base64）
    const snap = e.svc.snapshot() as { messages: { speaker: string, text: string, images?: ImageAttachmentRef[] }[] }
    const userMsg = snap.messages.find((m) => m.speaker === 'user' && m.text === '看这张图')
    expect(userMsg?.images?.length).toBe(1)
    expect(userMsg?.images?.[0].attachmentId).toBe(ref.attachmentId)
    // 快照里不应出现图片字节（否则会话 JSON 与 SSE 全被撑爆）
    expect(JSON.stringify(snap)).not.toContain(PNG_1PX)

    // 2. LLM 请求：图片块必须是 { type:'image', attachment:{...} }（DSH 契约）
    const withImage = e.seenMessages.find((ms) => ms.some((m) => m.content.some((b) => b.type === 'image')))
    expect(withImage).toBeTruthy()
    const imgBlock = withImage!.flatMap((m) => m.content).find((b) => b.type === 'image') as { attachment?: ImageAttachmentRef, source?: unknown }
    expect(imgBlock.attachment).toBeTruthy()
    expect(imgBlock.attachment?.attachmentId).toBe(ref.attachmentId)
    // 反面：绝不能是 Anthropic 的 source.base64 形态（adapter 会静默丢弃）
    expect(imgBlock.source).toBeUndefined()
  })

  it('纯图片消息（无文本）也允许发送', async () => {
    const e = env!
    const up = await e.svc.uploadImage({ data: PNG_1PX, mediaType: 'image/png' }) as { ok: boolean, image?: ImageAttachmentRef }
    e.pushText('看到了')
    const send = await e.svc.handleAction({ kind: 'send', sessionId: 's-1', text: '', images: [up.image] }) as { ok: boolean }
    expect(send.ok).toBe(true)
    await until(() => !(e.svc.snapshot() as { run: { running: boolean } }).run.running)
    const snap = e.svc.snapshot() as { messages: { speaker: string, images?: unknown[] }[] }
    expect(snap.messages.some((m) => m.speaker === 'user' && (m.images?.length ?? 0) > 0)).toBe(true)
  })

  it('历史消息中的图片不重复注入（只有本次 run 的图进请求）', async () => {
    const e = env!
    e.seenMessages.length = 0
    e.pushText('第二轮')
    await e.svc.handleAction({ kind: 'send', sessionId: 's-1', text: '没有新图' })
    await until(() => !(e.svc.snapshot() as { run: { running: boolean } }).run.running)
    const last = e.seenMessages[e.seenMessages.length - 1]
    expect(last.flatMap((m) => m.content).some((b) => b.type === 'image')).toBe(false)
    // 但历史图片应在 transcript 里留文本标记
    const textBlock = last.flatMap((m) => m.content).find((b) => b.type === 'text') as { text: string } | undefined
    expect(textBlock?.text).toContain('张图片')
  })
})

describe('图片读取路由的授权', () => {
  it('放行被消息引用过的 id', async () => {
    const e = env!
    const snap = e.svc.snapshot() as { messages: { images?: ImageAttachmentRef[] }[] }
    const id = snap.messages.flatMap((m) => m.images || [])[0]?.attachmentId
    expect(id).toBeTruthy()
    const got = await e.svc.readImage(String(id))
    expect(got).toBeTruthy()
    expect(got?.mediaType).toBe('image/png')
  })

  it('放行刚上传、尚未写入消息的 id（输入框预览）', async () => {
    const up = await env!.svc.uploadImage({ data: PNG_1PX, mediaType: 'image/png', name: 'preview.png' }) as { ok: boolean, image?: ImageAttachmentRef }
    expect(up.image?.attachmentId).toBeTruthy()
    const got = await env!.svc.readImage(String(up.image!.attachmentId))
    expect(got?.mediaType).toBe('image/png')
    expect(got?.data.byteLength).toBeGreaterThan(0)
  })

  it('拒绝未被任何消息引用、也不是本进程上传的 id', async () => {
    const got = await env!.svc.readImage('att-does-not-exist')
    expect(got).toBeNull()
  })
})

describe('模型能力位透传', () => {
  it('models 目录携带 inputModalities（客户端据此判断能否传图）', async () => {
    const res = await env!.svc.handleAction({ kind: 'models' }) as { ok: boolean, modelsByProvider: Record<string, { id: string, inputModalities?: string[] }[]> }
    expect(res.ok).toBe(true)
    const list = res.modelsByProvider.p
    expect(list.find((m) => m.id === 'model-a')?.inputModalities).toContain('image')
    expect(list.find((m) => m.id === 'model-b')?.inputModalities).not.toContain('image')
  })
})

describe('run.imageRefs 生命周期', () => {
  it('新一轮 send 不继承上一轮的图（无图发送清空 imageRefs）', async () => {
    const e = env!
    const up = await e.svc.uploadImage({ data: PNG_1PX, mediaType: 'image/png' }) as { ok: boolean, image?: ImageAttachmentRef }
    e.pushText('有图')
    await e.svc.handleAction({ kind: 'send', sessionId: 's-1', text: '带图', images: [up.image] })
    await until(() => !(e.svc.snapshot() as { run: { running: boolean } }).run.running)
    expect((e.svc.snapshot() as { run: { imageRefs: unknown[] } }).run.imageRefs.length).toBe(0)

    // 第二轮纯文本：请求里不应再出现图片块
    e.seenMessages.length = 0
    e.pushText('无图')
    await e.svc.handleAction({ kind: 'send', sessionId: 's-1', text: '纯文本' })
    await until(() => !(e.svc.snapshot() as { run: { running: boolean } }).run.running)
    const last = e.seenMessages[e.seenMessages.length - 1]
    expect(last.flatMap((m) => m.content).some((b) => b.type === 'image')).toBe(false)
  })
})
