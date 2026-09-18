/**
 * HTTP 路由（经 webServer 暴露）：
 *   GET  /api/group-chat/state   全量快照
 *   POST /api/group-chat/action   { kind: mutate|send|stop|models|preview, ... }
 *   GET  /api/group-chat/events   SSE，状态变化时推送节流后的全量快照
 * @module dsh-group-chat/host/api/routes
 */

import type { WebRoute } from '@deepseek-ai/dsh-host-webserver'
import { isTrustedRequest, readBody, writeJson } from './http.ts'
import type { GroupChatService } from '../service.ts'

const API_PREFIX = '/api/group-chat'

/** SSE 心跳周期。 */
const HEARTBEAT_MS = 15e3

/** 逐路由的信任栏 + 403。 */
function guard(req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse): boolean {
  if (isTrustedRequest(req)) return true
  writeJson(res, 403, { ok: false, error: 'forbidden' }, { 'cache-control': 'no-store' })
  return false
}

/** 构建群聊的三条 HTTP 路由。 */
export function makeGroupChatRoutes(service: GroupChatService): WebRoute[] {
  return [
    {
      kind: 'exact',
      path: API_PREFIX + '/state',
      handler: (req, res) => {
        if (req.method !== 'GET') return writeJson(res, 405, { ok: false, error: 'method-not-allowed' })
        if (!guard(req, res)) return
        writeJson(res, 200, { ok: true, ...service.snapshot() }, { 'cache-control': 'no-store' })
      },
    },
    {
      kind: 'exact',
      path: API_PREFIX + '/action',
      handler: async (req, res) => {
        if (req.method !== 'POST') return writeJson(res, 405, { ok: false, error: 'method-not-allowed' })
        if (!guard(req, res)) return
        if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
          return writeJson(res, 415, { ok: false, error: 'json-required' })
        }
        try {
          const body = await readBody(req)
          writeJson(res, 200, await service.handleAction(body), { 'cache-control': 'no-store' })
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e)
          writeJson(res, message === 'body-too-large' ? 413 : 400, { ok: false, error: message })
        }
      },
    },
    {
      kind: 'exact',
      path: API_PREFIX + '/events',
      handler: (req, res) => {
        if (req.method !== 'GET') {
          res.writeHead(405)
          res.end()
          return
        }
        if (!guard(req, res)) return
        res.writeHead(200, {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-cache',
          connection: 'keep-alive',
        })
        const push = () => {
          try {
            res.write('data: ' + JSON.stringify({ ok: true, ...service.snapshot() }) + '\n\n')
          } catch {
            /* connection gone; close handler cleans up */
          }
        }
        const unsubscribe = service.subscribePush(push)
        const heartbeat = setInterval(() => {
          try {
            res.write(': ping\n\n')
          } catch {
            /* ignore */
          }
        }, HEARTBEAT_MS)
        const close = () => {
          clearInterval(heartbeat)
          unsubscribe()
        }
        req.once('close', close)
        res.once('close', close)
        push()
      },
    },
  ]
}
