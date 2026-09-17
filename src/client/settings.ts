/**
 * 设置页：启停开关（settings.section 插槽）。写 host 的 group-chat 设置
 * 命名空间（settings.yaml 持久化）。
 * @module dsh-group-chat/client/settings
 */

import { useEffect, useState, type ReactNode } from 'react'
import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client'
import { h, P } from './ui.ts'

/** Host 侧注册的设置命名空间 shape。 */
interface GroupChatSettings {
  enabled?: boolean
}

export function GroupChatSettingsSection(props: { settingsScope: SettingsScope<GroupChatSettings> }): ReactNode {
  const scope = props.settingsScope
  const [snap, setSnap] = useState<ReturnType<SettingsScope<GroupChatSettings>['getSnapshot']> | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let live = true
    const read = (): void => {
      if (!live) return
      try {
        setSnap(scope.getSnapshot())
      } catch { /* ignore */ }
    }
    read()
    const off = scope.subscribe(read)
    return () => {
      live = false
      off()
    }
  }, [])

  const ready = snap !== null && snap.status === 'ready'
  const writable = ready ? snap.writable !== false : false
  const enabled = ready ? (snap.value && snap.value.enabled) !== false : true

  const toggle = async (): Promise<void> => {
    if (!writable || pending) return
    setPending(true)
    try {
      await scope.set('enabled', !enabled)
    } catch (e) {
      console.error('[dsh-group-chat] settings write failed', e)
    } finally {
      setPending(false)
    }
  }

  return h('div', { className: 'dgcs-page' },
    h('div', { className: 'dgcs-head' },
      h('h3', { className: 'dgcs-title' }, '模型群聊'),
      h('p', { className: 'dgcs-desc' }, '多模型角色群组对话面板：每个角色绑定不同的 provider/model；群组内多会话目录树管理，群内共享对话记录与资料空间；消息以 markdown 渲染、支持思考折叠；输入框支持 @成员 点名。数据持久化于 ~/.dsh/storages/group-chat/，重启 dsh web 后恢复。')),
    h('div', { className: 'dgcs-card' },
      h('div', { className: 'dgcs-cardtext' },
        h('div', { className: 'dgcs-cardtitle' }, enabled ? '已启用' : '已停用'),
        h('div', { className: 'dgcs-cardhint' }, writable ? (enabled ? '关闭后侧边栏将不再显示「群聊」入口，进行中的对话会被中止。' : '开启后侧边栏显示「群聊」入口。') : '当前设置不可写（可能被配置文件覆盖）。')),
      h(P.Switch, {
        checked: enabled, onChange: () => { void toggle() }, disabled: !writable || pending,
        label: '模型群聊启停', title: pending ? '正在写入…' : enabled ? '点击停用' : '点击启用',
      })))
}
