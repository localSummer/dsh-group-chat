/**
 * Host HTTP 工具：回环信任栏（对齐 dsh-web shared/host/loopback.ts 语义 +
 * 浏览器同源标记栏）、有界 JSON 请求体读取、JSON 响应写出。
 * @module dsh-group-chat/host/http
 */

import type { IncomingMessage, ServerResponse } from 'node:http'

/** 请求体上限 1MB。 */
const BODY_LIMIT = 1024 * 1024

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' }

/** IPv4 127/8 谓词（四段十进制，首段 == 127）。 */
function isIPv4Loopback(v4: string): boolean {
  const parts = v4.split('.')
  return parts.length === 4 && parts[0] === '127' && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
}

/** socket 远端地址是否落在回环段（127/8、::1、IPv4-mapped）。 */
function isLoopbackAddress(address: string | undefined): boolean {
  if (address === undefined) return false
  const normalized = address.toLowerCase()
  if (normalized === '::1') return true
  if (normalized.startsWith('::ffff:')) return isIPv4Loopback(normalized.slice(7))
  return isIPv4Loopback(normalized)
}

/** 归一化 URL 主机名是否为回环权威（localhost、[::1]、127/8）。 */
function isLoopbackHostname(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '[::1]') return true
  return isIPv4Loopback(hostname)
}

/**
 * 请求级信任栏：浏览器同源标记（sec-fetch-site / Origin）必须存在且回环
 * socket + 回环 Host 全过；X-Forwarded-For 一律不信任。无任何同源标记的
 * 非浏览器请求（如裸 curl）一律拒绝。
 */
export function isTrustedRequest(req: IncomingMessage): boolean {
  if (!(req.headers['sec-fetch-site'] === 'same-origin' || typeof req.headers.origin === 'string')) return false
  if (!isLoopbackAddress(req.socket.remoteAddress)) return false
  const host = req.headers.host
  if (typeof host !== 'string') return false
  let hostUrl: URL
  try {
    hostUrl = new URL('http://' + host)
  } catch {
    return false
  }
  if (!isLoopbackHostname(hostUrl.hostname)) return false
  if (req.headers['sec-fetch-site'] === 'cross-site') return false
  const origin = req.headers.origin
  if (origin === undefined) return true
  try {
    return new URL(origin).host === hostUrl.host
  } catch {
    return false
  }
}

/** 读有界 JSON 请求体；超限抛 'body-too-large'（路由映射 413）。 */
export async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    const buffer = chunk as Buffer
    size += buffer.length
    if (size > BODY_LIMIT) throw new Error('body-too-large')
    chunks.push(buffer)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

/** 写 JSON 响应；调用方可追加/覆盖默认头。 */
export function writeJson(res: ServerResponse, status: number, body: unknown, headers: Record<string, string | number> = {}): void {
  const payload = JSON.stringify(body)
  res.writeHead(status, { ...JSON_HEADERS, ...headers })
  res.end(payload)
}
