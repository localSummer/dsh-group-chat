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
  action: (payload: Record<string, unknown>): Promise<unknown> => readJson(fetch(API_PREFIX + '/action', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })),
}
