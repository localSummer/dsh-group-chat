/**
 * dsh-group-chat — DSH 模型群聊（host 平面组合插件，host + client 双半）。
 *
 * Host 半职责：
 *  - 群组 / 会话 / 角色 / 消息的状态机，会话级文件持久化于
 *    ~/.dsh/storages/group-chat/（PERSISTENCE.md v2.1：每群组一目录，
 *    sessions/session-<uuid>.json 一会话一文件；roles.json 与 workspaceDir
 *    随群组目录；ledger.json 纯清单；原子写 tmp+fsync+rename（每目录一次
 *    fsync）；单实例 .lock；损坏隔离重建；写失败保留脏标记；v1 自动迁移）
 *    数据模型：Group 1..N Session，消息挂在会话上；角色与工作区目录挂在群组上
 *  - 群组与会话的增删改；群组/会话检索由客户端在快照上过滤
 *  - 角色发言经 `llm` 服务流式生成，按角色绑定的 provider/model 路由
 *  - 群组工作区目录经 `fs` 服务读取（目录内文本文件），注入每个角色的共享上下文
 *  - 经 `webServer` 暴露 HTTP API：
 *      GET  /api/group-chat/state   全量快照
 *      POST /api/group-chat/action   { kind: mutate|send|stop|models|preview, ... }
 *      GET  /api/group-chat/events   SSE，状态变化时推送节流后的全量快照
 *
 * 设置命名空间 `group-chat`（settings.yaml 持久化）：`enabled` 控制浏览器半
 * 的侧边栏入口与主面板挂载；关闭时会中止正在进行的群聊。
 *
 * @module dsh-group-chat
 */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import type { SettingsNamespace } from '@deepseek-ai/dsh-settings'
// 类型合并：ctx.settings（宿主面）
import type {} from '@deepseek-ai/dsh-settings'
import z from 'schemastery'
import { mountOnce } from './mount-once.ts'
import { createGroupChatService } from './host/service.ts'
import { makeGroupChatRoutes } from './host/routes.ts'

export const name = 'group-chat'

export const inject = ['llm', 'fs', 'webServer', 'workspaceRegistry']

/** 设置命名空间；浏览器半拼写同一值，两边不共享代码。 */
export const SETTINGS_NAMESPACE = 'group-chat' as SettingsNamespace

export interface Config {
  enabled?: boolean
}

/** 设置 schema：目前只有启停一个开关。 */
export const Config: z<Config> = z.object({
  enabled: z.boolean().default(true),
})

/**
 * Host 半插件体：状态机服务 + HTTP 路由 + 设置接入。
 * mountOnce 保证同名包每进程至多挂载一次（bundle 聚合与独立安装并存场景）。
 */
export const apply = mountOnce('dsh-group-chat', (ctx: Context, config?: Config): void => {
  const service = createGroupChatService(ctx)

  // ---------- HTTP 路由 ----------
  ctx.effect(() => {
    const disposers = makeGroupChatRoutes(service).map((route) => ctx.webServer.register(route))
    return () => {
      for (const dispose of disposers) dispose()
    }
  }, 'group-chat: host API routes')

  // 插件卸载/热重载：唤醒确认等待 + kill 子进程 → 同步最终 flush → 释放锁
  ctx.effect(() => () => {
    service.dispose()
  })

  // ---------- 设置（enabled 持久化于 settings.yaml） ----------

  let current = (): Config => config ?? {}
  const sync = (): void => {
    const enabled = current().enabled ?? true
    if (!enabled) service.stopAll()
  }
  ctx.inject(['settings'], (settingsCtx) => {
    try {
      if (typeof settingsCtx.settings?.installSection === 'function') {
        settingsCtx.settings.installSection(ctx, SETTINGS_NAMESPACE, Config, config ?? {}, {
          setSource: (source: () => Config) => {
            current = source
          },
          onChange: sync,
        })
      } else if (typeof settingsCtx.settings?.register === 'function') {
        const scope = settingsCtx.settings.register(SETTINGS_NAMESPACE, Config, { base: config ?? {} })
        current = () => scope?.get?.() ?? (config ?? {})
        scope?.watch?.(() => {
          sync()
        })
      }
    } catch {
      /* 设置面不可用时插件照常工作，始终视为启用 */
    }
  })
  sync()
})
