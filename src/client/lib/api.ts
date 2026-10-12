/**
 * 浏览器半 transport：/api/group-chat/* 同源 JSON 端点。
 * @module dsh-group-chat/client/api
 */

import { API_PREFIX } from './model.ts'

async function readJson<T>(fetchPromise: Promise<Response>): Promise<T> {
  const response = await fetchPromise
  const body = await response.json() as { error?: string }
  if (!response.ok) throw new Error(body && body.error ? body.error : '请求失败（HTTP ' + response.status + '），请稍后重试')
  return body as unknown as T
}

export const api = {
  state: (): Promise<unknown> => readJson(fetch(API_PREFIX + '/state', { cache: 'no-store' })),
  action: (payload: Record<string, unknown>, signal?: AbortSignal): Promise<unknown> => readJson(fetch(API_PREFIX + '/action', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })),
  /** 图片上传：base64 → durable 引用（独立端点，避开 action 的请求体上限）。 */
  upload: (payload: { data: string, mediaType: string, name?: string }): Promise<unknown> => readJson(fetch(API_PREFIX + '/upload', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })),
  /** 图片字节 URL（durable 引用 → <img src>）。 */
  imageUrl: (attachmentId: string): string => API_PREFIX + '/image/' + encodeURIComponent(attachmentId),
}
