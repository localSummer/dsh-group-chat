/**
 * 回环信任栏（isTrustedRequest）单元测试：浏览器同源标记 + 回环 socket +
 * 回环 Host 三查全过才信任；X-Forwarded-For 一律不参与判定。
 */
import type { IncomingMessage } from 'node:http'
import { describe, expect, it } from 'vitest'
import { isTrustedRequest } from '../src/host/api/http.ts'

function req(headers: Record<string, string>, remoteAddress?: string): IncomingMessage {
  return { headers, socket: { remoteAddress } } as unknown as IncomingMessage
}

describe('isTrustedRequest 回环信任栏', () => {
  it('回环 socket + same-origin 标记 + 回环 Host → 信任', () => {
    expect(isTrustedRequest(req({ 'sec-fetch-site': 'same-origin', host: '127.0.0.1:3080' }, '127.0.0.1'))).toBe(true)
    expect(isTrustedRequest(req({ 'sec-fetch-site': 'same-origin', host: '[::1]:3080' }, '::1'))).toBe(true)
    expect(isTrustedRequest(req({ 'sec-fetch-site': 'same-origin', host: 'localhost:3080' }, '::ffff:127.0.0.1'))).toBe(true)
    // 127/8 全段回环
    expect(isTrustedRequest(req({ 'sec-fetch-site': 'same-origin', host: '127.8.8.8:3080' }, '127.0.0.1'))).toBe(true)
  })

  it('Origin 头同样可作为同源标记，且必须与 Host 一致', () => {
    expect(isTrustedRequest(req({ origin: 'http://127.0.0.1:3080', host: '127.0.0.1:3080' }, '127.0.0.1'))).toBe(true)
    expect(isTrustedRequest(req({ origin: 'http://evil.example', host: '127.0.0.1:3080' }, '127.0.0.1'))).toBe(false)
  })

  it('无任何浏览器同源标记（裸 curl）→ 拒绝', () => {
    expect(isTrustedRequest(req({ host: '127.0.0.1:3080' }, '127.0.0.1'))).toBe(false)
  })

  it('sec-fetch-site: cross-site → 拒绝', () => {
    expect(isTrustedRequest(req({ 'sec-fetch-site': 'cross-site', host: '127.0.0.1:3080' }, '127.0.0.1'))).toBe(false)
  })

  it('非回环 socket → 拒绝（含缺失）', () => {
    expect(isTrustedRequest(req({ 'sec-fetch-site': 'same-origin', host: '127.0.0.1:3080' }, '192.168.1.5'))).toBe(false)
    expect(isTrustedRequest(req({ 'sec-fetch-site': 'same-origin', host: '127.0.0.1:3080' }, '8.8.8.8'))).toBe(false)
    expect(isTrustedRequest(req({ 'sec-fetch-site': 'same-origin', host: '127.0.0.1:3080' }, undefined))).toBe(false)
  })

  it('Host 指向非回环权威 → 拒绝；伪造 X-Forwarded-For 不放行', () => {
    expect(isTrustedRequest(req({ 'sec-fetch-site': 'same-origin', host: 'example.com:3080' }, '127.0.0.1'))).toBe(false)
    expect(isTrustedRequest(req({ 'sec-fetch-site': 'same-origin', host: '192.168.1.10:3080', 'x-forwarded-for': '127.0.0.1' }, '127.0.0.1'))).toBe(false)
  })

  it('Host 缺失 → 拒绝', () => {
    expect(isTrustedRequest(req({ 'sec-fetch-site': 'same-origin' }, '127.0.0.1'))).toBe(false)
  })
})
