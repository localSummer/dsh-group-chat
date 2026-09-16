/**
 * dsh-group-chat — DSH 模型群聊（host 平面组合插件，host + client 双半）。
 *
 * Host 半职责：
 *  - 群组 / 角色 / 资料 / 消息的内存状态机（进程内存态，重启后清空）
 *  - 角色发言经 `llm` 服务流式生成，按角色绑定的 provider/model 路由
 *  - 资料文件经 `fs` 服务读取，注入每个角色的共享上下文
 *  - 经 `webServer` 暴露 HTTP API：
 *      GET  /api/group-chat/state   全量快照
 *      POST /api/group-chat/action   { kind: mutate|send|stop|models|preview, ... }
 *      GET  /api/group-chat/events   SSE，状态变化时推送节流后的全量快照
 *
 * 设置命名空间 `group-chat`（settings.yaml 持久化）：`enabled` 控制浏览器半
 * 的侧边栏入口与主面板挂载；关闭时会中止正在进行的群聊。
 */

import z from 'schemastery'

export const name = 'group-chat'

export const inject = ['llm', 'fs', 'webServer']

/** 设置命名空间；浏览器半拼写同一值，两边不共享代码。 */
export const SETTINGS_NAMESPACE = 'group-chat'

const API_PREFIX = '/api/group-chat'
const HEARTBEAT_MS = 15e3
const PUSH_THROTTLE_MS = 120
const BODY_LIMIT = 1024 * 1024

/** 设置 schema：目前只有启停一个开关。 */
export const Config = z.object({
  enabled: z.boolean().default(true),
})

// ---------- HTTP 工具（参考 dsh-task-board 的回环信任栏） ----------

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' }

function writeJson(res, status, body, headers = {}) {
  const payload = JSON.stringify(body)
  res.writeHead(status, { ...JSON_HEADERS, ...headers })
  res.end(payload)
}

function isIPv4Loopback(v4) {
  const parts = v4.split('.')
  return parts.length === 4 && parts[0] === '127' && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
}

function isLoopbackAddress(address) {
  if (address === undefined) return false
  const normalized = address.toLowerCase()
  if (normalized === '::1') return true
  if (normalized.startsWith('::ffff:')) return isIPv4Loopback(normalized.slice(7))
  return isIPv4Loopback(normalized)
}

function isLoopbackHostname(hostname) {
  if (hostname === 'localhost' || hostname === '[::1]') return true
  return isIPv4Loopback(hostname)
}

/** 回环 socket + 回环 Host + 浏览器同源标记；X-Forwarded-For 一律不信任。 */
function isTrustedRequest(req) {
  if (!(req.headers['sec-fetch-site'] === 'same-origin' || typeof req.headers.origin === 'string')) return false
  if (!isLoopbackAddress(req.socket.remoteAddress)) return false
  const host = req.headers.host
  if (typeof host !== 'string') return false
  let hostUrl
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

async function readBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    const buffer = chunk
    size += buffer.length
    if (size > BODY_LIMIT) throw new Error('body-too-large')
    chunks.push(buffer)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

// ---------- 插件入口 ----------

export function apply(ctx, config) {
  const llm = ctx.llm
  const fs = ctx.fs

  // ---------- 状态机 ----------
  let revision = 1
  let idSeq = 1
  const nid = (p) => p + '-' + (idSeq++)
  const PALETTE = ['#5b8def', '#22a06b', '#e8912d', '#c678dd', '#e05661', '#56b6c2', '#98c379', '#d19a66']

  const groups = new Map()
  const roles = new Map()
  const materials = new Map()
  const messages = new Map()
  const run = { running: false, groupId: null, currentRoleId: null, queue: [], partial: '', stopping: false }
  let modelCache = null

  const first = { id: nid('grp'), name: '默认群组', topic: '', roleIds: [], materialIds: [], messageIds: [] }
  groups.set(first.id, first)

  // ---------- SSE 广播（节流） ----------
  const subscribers = new Set()
  let pushTimer = null
  const broadcast = () => {
    if (pushTimer !== null) return
    pushTimer = setTimeout(() => {
      pushTimer = null
      for (const push of subscribers) push()
    }, PUSH_THROTTLE_MS)
  }

  const touch = () => {
    revision++
    broadcast()
  }

  const snapshot = () => ({
    revision,
    run: { running: run.running, groupId: run.groupId, currentRoleId: run.currentRoleId, partial: run.partial },
    groups: [...groups.values()].map((g) => ({ id: g.id, name: g.name, topic: g.topic, roleIds: g.roleIds.slice(), materialIds: g.materialIds.slice(), messageIds: g.messageIds.slice() })),
    roles: [...roles.values()].map((r) => ({ id: r.id, groupId: r.groupId, name: r.name, color: r.color, persona: r.persona, provider: r.provider, model: r.model, temperature: r.temperature, enabled: r.enabled })),
    materials: [...materials.values()].map((m) => ({ id: m.id, groupId: m.groupId, kind: m.kind, name: m.name, content: m.content, path: m.path })),
    messages: [...messages.values()].map((m) => ({ id: m.id, groupId: m.groupId, seq: m.seq, speaker: m.speaker, text: m.text, model: m.model, error: m.error, ts: m.ts })),
  })

  const appendMessage = (g, speaker, text, extra) => {
    const msg = { id: nid('msg'), groupId: g.id, seq: g.messageIds.length + 1, speaker, text, model: undefined, error: undefined, ts: Date.now() }
    if (extra) {
      if (extra.model !== undefined) msg.model = extra.model
      if (extra.error !== undefined) msg.error = extra.error
    }
    messages.set(msg.id, msg)
    g.messageIds.push(msg.id)
    touch()
    return msg
  }

  // ---------- 资料读取 ----------

  const loadMaterials = async (g) => {
    const parts = []
    for (const mid of g.materialIds) {
      const m = materials.get(mid)
      if (!m) continue
      if (m.kind === 'text') {
        parts.push({ name: m.name, content: m.content || '' })
      } else {
        try {
          const target = await fs.resolve(m.path)
          const text = await fs.readText(target)
          parts.push({ name: m.name, content: text })
        } catch (e) {
          parts.push({ name: m.name, content: '', error: String((e && e.message) || e) })
        }
      }
    }
    return parts
  }

  const materialBlock = (parts) => {
    if (!parts.length) return ''
    let total = 0
    const lines = []
    for (const p of parts) {
      if (p.error) {
        lines.push('### ' + p.name + '\n[读取失败] ' + p.error)
        continue
      }
      let c = p.content || ''
      if (c.length > 16000) c = c.slice(0, 16000) + '\n…(已截断)'
      if (total + c.length > 48000) c = c.slice(0, Math.max(0, 48000 - total)) + '\n…(总量超限截断)'
      total += c.length
      lines.push('### ' + p.name + '\n' + c)
    }
    return '\n# 共享资料（群内所有成员可见）\n' + lines.join('\n\n')
  }

  // ---------- 对话引擎 ----------

  const transcriptBlock = (g) => {
    const out = []
    for (const mid of g.messageIds) {
      const m = messages.get(mid)
      if (!m) continue
      const name = m.speaker === 'user' ? '用户' : m.speaker === 'system' ? '系统' : (roles.get(m.speaker) || {}).name || '成员'
      let text = m.text || ''
      if (text.length > 8000) text = text.slice(0, 8000) + '…(已截断)'
      out.push('【' + name + '】' + text)
    }
    return out.slice(-40).join('\n\n')
  }

  const speak = async (g, role) => {
    const parts = await loadMaterials(g)
    const sys = [
      '你正在参与一个多角色群聊。你在群中的身份如下，请始终以该身份发言。',
      '',
      '# 你的角色',
      '- 名称：' + role.name,
      '- 人设：' + (role.persona ? role.persona : '（未填写，请以积极协作者的身份参与讨论）'),
      g.topic ? '\n# 群主题\n' + g.topic : '',
      materialBlock(parts),
      '\n# 发言要求',
      '- 直接输出「' + role.name + '」本轮的发言内容本身：不要输出名字前缀、引号、动作旁白或代码围栏',
      '- 回应群内最新讨论，与其他成员自然对话；有不同观点可以提出并说明理由',
      '- 保持简洁，通常不超过 300 字',
    ].filter((s) => s !== '').join('\n')

    const history = transcriptBlock(g)
    const text = history
      ? '以下是群聊记录（从旧到新）：\n\n' + history
      : '群聊刚刚开始，请围绕主题做简短开场发言。'

    const opts = {
      provider: role.provider,
      model: role.model,
      system: sys,
      messages: [{ id: 'g' + revision, role: 'user', content: [{ type: 'text', text }], source: { kind: 'user' } }],
    }
    if (typeof role.temperature === 'number' && !Number.isNaN(role.temperature)) opts.temperature = role.temperature

    let acc = ''
    for await (const chunk of llm.stream(opts)) {
      if (run.stopping) break
      if (chunk.type === 'text-delta') {
        acc += chunk.text
        run.partial = acc
        touch()
      } else if (chunk.type === 'finish' && (chunk.reason === 'error' || chunk.reason === 'aborted')) {
        throw new Error('模型输出异常终止: ' + chunk.reason)
      }
    }
    return acc.trim()
  }

  const runLoop = async (g) => {
    try {
      while (run.queue.length > 0 && !run.stopping) {
        const roleId = run.queue.shift()
        const role = roles.get(roleId)
        run.currentRoleId = roleId
        run.partial = ''
        touch()
        if (!role) continue
        try {
          const text = await speak(g, role)
          if (text) appendMessage(g, role.id, text, { model: role.provider + ' / ' + role.model })
        } catch (e) {
          appendMessage(g, 'system', '角色「' + role.name + '」发言失败：' + String((e && e.message) || e), { error: true })
          break
        }
      }
      if (run.stopping) appendMessage(g, 'system', '已停止本次对话', {})
    } finally {
      run.running = false
      run.groupId = null
      run.currentRoleId = null
      run.partial = ''
      run.queue = []
      run.stopping = false
      touch()
    }
  }

  // ---------- 动作 ----------

  const mutate = (args) => {
    const op = args && args.op
    if (op === 'createGroup') {
      const g = { id: nid('grp'), name: String(args.name || '').trim() || '群组 ' + (groups.size + 1), topic: '', roleIds: [], materialIds: [], messageIds: [] }
      groups.set(g.id, g)
      touch()
    } else if (op === 'renameGroup') {
      const g = groups.get(args.groupId)
      if (g && String(args.name || '').trim()) {
        g.name = String(args.name).trim()
        touch()
      }
    } else if (op === 'deleteGroup') {
      const g = groups.get(args.groupId)
      if (!g) return { ...snapshot(), error: '群组不存在' }
      if (groups.size <= 1) return { ...snapshot(), error: '至少保留一个群组' }
      if (run.running && run.groupId === g.id) return { ...snapshot(), error: '对话进行中，无法删除群组' }
      for (const rid of g.roleIds) roles.delete(rid)
      for (const mid of g.materialIds) materials.delete(mid)
      for (const mid of g.messageIds) messages.delete(mid)
      groups.delete(g.id)
      touch()
    } else if (op === 'setTopic') {
      const g = groups.get(args.groupId)
      if (g) {
        g.topic = String(args.topic || '')
        touch()
      }
    } else if (op === 'upsertRole') {
      const g = groups.get(args.groupId)
      const r = args.role || {}
      if (!g) return { ...snapshot(), error: '群组不存在' }
      if (!r.name || !String(r.name).trim()) return { ...snapshot(), error: '角色名称不能为空' }
      if (!r.provider || !r.model) return { ...snapshot(), error: '请选择角色绑定的模型' }
      if (r.id && roles.get(r.id)) {
        const ex = roles.get(r.id)
        ex.name = String(r.name).trim()
        ex.color = r.color || ex.color
        ex.persona = r.persona || ''
        ex.provider = r.provider
        ex.model = r.model
        ex.temperature = typeof r.temperature === 'number' && !Number.isNaN(r.temperature) ? r.temperature : undefined
        ex.enabled = r.enabled !== false
        touch()
      } else {
        const nr = {
          id: nid('role'),
          groupId: g.id,
          name: String(r.name).trim(),
          color: r.color || PALETTE[g.roleIds.length % PALETTE.length],
          persona: r.persona || '',
          provider: r.provider,
          model: r.model,
          temperature: typeof r.temperature === 'number' && !Number.isNaN(r.temperature) ? r.temperature : undefined,
          enabled: true,
        }
        roles.set(nr.id, nr)
        g.roleIds.push(nr.id)
        touch()
      }
    } else if (op === 'deleteRole') {
      const r = roles.get(args.roleId)
      if (r) {
        const g = groups.get(r.groupId)
        if (g) g.roleIds = g.roleIds.filter((x) => x !== r.id)
        roles.delete(r.id)
        touch()
      }
    } else if (op === 'setRoleEnabled') {
      const r = roles.get(args.roleId)
      if (r) {
        r.enabled = !!args.enabled
        touch()
      }
    } else if (op === 'upsertMaterial') {
      const g = groups.get(args.groupId)
      const m = args.material || {}
      if (!g) return { ...snapshot(), error: '群组不存在' }
      if (!m.name || !String(m.name).trim()) return { ...snapshot(), error: '资料名称不能为空' }
      if (m.kind === 'file' && !String(m.path || '').trim()) return { ...snapshot(), error: '请填写文件路径' }
      if (m.kind === 'text' && !String(m.content || '').trim()) return { ...snapshot(), error: '资料内容不能为空' }
      if (m.id && materials.get(m.id)) {
        const ex = materials.get(m.id)
        ex.name = String(m.name).trim()
        ex.kind = m.kind
        ex.content = m.kind === 'text' ? m.content : undefined
        ex.path = m.kind === 'file' ? String(m.path).trim() : undefined
        touch()
      } else {
        const nm = {
          id: nid('mat'),
          groupId: g.id,
          kind: m.kind,
          name: String(m.name).trim(),
          content: m.kind === 'text' ? m.content : undefined,
          path: m.kind === 'file' ? String(m.path).trim() : undefined,
        }
        materials.set(nm.id, nm)
        g.materialIds.push(nm.id)
        touch()
      }
    } else if (op === 'deleteMaterial') {
      const m = materials.get(args.materialId)
      if (m) {
        const g = groups.get(m.groupId)
        if (g) g.materialIds = g.materialIds.filter((x) => x !== m.id)
        materials.delete(m.id)
        touch()
      }
    } else if (op === 'clearMessages') {
      const g = groups.get(args.groupId)
      if (g) {
        if (run.running && run.groupId === g.id) return { ...snapshot(), error: '对话进行中，无法清空' }
        for (const mid of g.messageIds) messages.delete(mid)
        g.messageIds = []
        touch()
      }
    }
    return snapshot()
  }

  const send = (args) => {
    const g = groups.get(args.groupId)
    if (!g) return { ok: false, error: '群组不存在' }
    if (run.running) return { ok: false, error: '已有对话进行中，请先停止' }
    let parts = Array.isArray(args.participantRoleIds) ? args.participantRoleIds.slice() : []
    parts = parts.filter((id) => {
      const r = roles.get(id)
      return r && r.groupId === g.id && r.enabled
    })
    if (!parts.length) parts = g.roleIds.filter((id) => {
      const r = roles.get(id)
      return r && r.enabled
    })
    if (!parts.length) return { ok: false, error: '群内还没有启用的角色，请先添加角色' }
    const rounds = Math.max(1, Math.min(10, Math.floor(Number(args.rounds) || 1)))
    const text = String(args.text || '').trim().slice(0, 32000)
    if (text) appendMessage(g, 'user', text)
    const queue = []
    for (let i = 0; i < rounds; i++) for (const rid of parts) queue.push(rid)
    run.running = true
    run.groupId = g.id
    run.queue = queue
    run.stopping = false
    touch()
    runLoop(g).catch((e) => console.error('group-chat run failed', e))
    return { ok: true }
  }

  const stop = (args) => {
    if (run.running && (!args || !args.groupId || run.groupId === args.groupId)) {
      run.stopping = true
      touch()
    }
    return { ok: true }
  }

  const models = async () => {
    const now = Date.now()
    if (modelCache && now - modelCache.at < 60000) return modelCache
    const providers = await llm.listProviders()
    const modelsByProvider = {}
    for (const p of providers) {
      try {
        modelsByProvider[p.id] = await llm.listModels(p.id)
      } catch {
        modelsByProvider[p.id] = []
      }
    }
    modelCache = { at: now, providers: providers.map((p) => ({ id: p.id, name: p.name || p.id })), modelsByProvider }
    return modelCache
  }

  const previewMaterial = async (args) => {
    try {
      const target = await fs.resolve(String(args.path || ''))
      const text = await fs.readText(target)
      return { ok: true, preview: text.slice(0, 2000), size: text.length }
    } catch (e) {
      return { ok: false, error: String((e && e.message) || e) }
    }
  }

  const handleAction = async (body) => {
    const kind = body && body.kind
    if (kind === 'mutate') return { ok: true, snapshot: mutate(body) }
    if (kind === 'send') return send(body)
    if (kind === 'stop') return stop(body)
    if (kind === 'models') return { ok: true, ...(await models()) }
    if (kind === 'preview') return previewMaterial(body)
    return { ok: false, error: 'unknown-action' }
  }

  // ---------- HTTP 路由 ----------

  const guard = (req, res) => {
    if (isTrustedRequest(req)) return true
    writeJson(res, 403, { ok: false, error: 'forbidden' }, { 'cache-control': 'no-store' })
    return false
  }

  const routes = [
    {
      kind: 'exact',
      path: API_PREFIX + '/state',
      handler: (req, res) => {
        if (req.method !== 'GET') return writeJson(res, 405, { ok: false, error: 'method-not-allowed' })
        if (!guard(req, res)) return
        writeJson(res, 200, { ok: true, ...snapshot() }, { 'cache-control': 'no-store' })
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
          writeJson(res, 200, await handleAction(body), { 'cache-control': 'no-store' })
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
            res.write('data: ' + JSON.stringify({ ok: true, ...snapshot() }) + '\n\n')
          } catch {
            /* connection gone; close handler cleans up */
          }
        }
        subscribers.add(push)
        const heartbeat = setInterval(() => {
          try {
            res.write(': ping\n\n')
          } catch {
            /* ignore */
          }
        }, HEARTBEAT_MS)
        const close = () => {
          clearInterval(heartbeat)
          subscribers.delete(push)
        }
        req.once('close', close)
        res.once('close', close)
        push()
      },
    },
  ]

  ctx.effect(() => {
    const disposers = routes.map((route) => ctx.webServer.register(route))
    return () => {
      for (const dispose of disposers) dispose()
    }
  }, 'group-chat: host API routes')

  // 插件卸载/热重载时中止进行中的群聊
  ctx.effect(() => () => {
    run.stopping = true
  })

  // ---------- 设置（enabled 持久化于 settings.yaml） ----------

  let current = () => config ?? {}
  const sync = () => {
    const enabled = current().enabled ?? true
    if (!enabled && run.running) {
      run.stopping = true
      touch()
    }
  }
  ctx.inject(['settings'], (settingsCtx) => {
    try {
      if (typeof settingsCtx.settings?.installSection === 'function') {
        settingsCtx.settings.installSection(ctx, SETTINGS_NAMESPACE, Config, config ?? {}, {
          setSource: (source) => {
            current = source
          },
          onChange: sync,
        })
      } else if (typeof settingsCtx.settings?.register === 'function') {
        const scope = settingsCtx.settings.register(SETTINGS_NAMESPACE, Config, { base: config ?? {} })
        current = () => scope?.get?.() ?? config ?? {}
        scope?.watch?.(() => {
          sync()
        })
      }
    } catch {
      /* 设置面不可用时插件照常工作，始终视为启用 */
    }
  })
  sync()
}
