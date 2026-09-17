/**
 * 角色编辑抽屉（右侧滑出，不遮挡会话流阅读）。
 * @module dsh-group-chat/client/drawer
 */

import { useEffect, useState, type ReactNode } from 'react'
import { h, Icon, P } from './ui.ts'
import { api } from './api.ts'
import { PALETTE, type EffortsResponse, type ModelsResponse, type RoleDraft } from './model.ts'

export interface RoleDrawerProps {
  draft: RoleDraft
  set: (draft: RoleDraft) => void
  models: ModelsResponse | null
  modelsError: string | null
  onRetryModels: () => void
  onSave: () => void
  onCancel: () => void
  formError: string
}

export function RoleDrawer(props: RoleDrawerProps): ReactNode {
  const draft = props.draft
  const set = props.set
  const models = props.models
  const providers = (models && models.providers) || []
  const modelsOf = (models && models.modelsByProvider && models.modelsByProvider[draft.provider]) || []
  const [closing, setClosing] = useState(false)
  const [effortsInfo, setEffortsInfo] = useState<EffortsResponse | null>(null)
  const close = (): void => {
    if (closing) return
    setClosing(true)
    window.setTimeout(() => props.onCancel(), 140)
  }
  const onProvider = (e: { target: { value: string } }): void => {
    const p = e.target.value
    const list = (models && models.modelsByProvider && models.modelsByProvider[p]) || []
    // 换模型路线后旧推理级别失效，重置为默认
    set(Object.assign({}, draft, { provider: p, model: list.length ? list[0].id : '', reasoningEffort: 'default' }))
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
  // 推理级别选项：跟随抽屉内 provider/model 变化重新查询（Host 60s 缓存）
  useEffect(() => {
    let live = true
    setEffortsInfo(null)
    if (!draft.provider || !draft.model) return
    api.action({ kind: 'efforts', provider: draft.provider, model: draft.model }).then((res) => {
      if (!live) return
      const r = res as EffortsResponse
      if (r && r.ok) setEffortsInfo({ ok: true, efforts: r.efforts || [], defaultEffort: r.defaultEffort })
      else setEffortsInfo({ ok: false, efforts: [], defaultEffort: undefined, error: (r && r.error) || '查询失败' })
    }).catch((e: unknown) => { if (live) setEffortsInfo({ ok: false, efforts: [], defaultEffort: undefined, error: String((e && (e as Error).message) || e) }) })
    return () => { live = false }
  }, [draft.provider, draft.model])
  return h('div', { className: 'dsgc-drawer' + (closing ? ' closing' : ''), role: 'dialog', 'aria-modal': 'false', 'aria-label': draft.id ? '编辑角色' : '添加角色' },
    h('div', { className: 'dsgc-drawerhead' },
      Icon(P.IconUserOutline16, 16),
      h('span', { className: 'dsgc-drawertitle' }, draft.id ? '编辑角色' : '添加角色'),
      h(P.Button, { variant: 'ghost', size: 'sm', onClick: close, 'aria-label': '关闭' }, Icon(P.IconCloseOutline16, 16))),
    h('div', { className: 'dsgc-drawerbody' },
      h('div', { className: 'dsgc-form' },
        h('div', { className: 'dsgc-field' },
          h('label', null, '名称'),
          h('input', { className: 'dsgc-input', value: draft.name, autoFocus: !draft.id, onChange: (e: { target: { value: string } }) => set(Object.assign({}, draft, { name: e.target.value })), placeholder: '例如：产品经理' })),
        h('div', { className: 'dsgc-field' },
          h('label', null, '标识色'),
          h('div', { className: 'dsgc-palette' }, PALETTE.map((c) => h('button', {
            key: c, type: 'button', className: 'dsgc-dot' + (draft.color === c ? ' on' : ''),
            style: { background: c }, onClick: () => { set(Object.assign({}, draft, { color: c })) },
            'aria-label': '选择标识色 ' + c,
          })))),
        h('div', { className: 'dsgc-field' },
          h('label', null, '人设 / 角色设定'),
          h('textarea', { className: 'dsgc-textarea', rows: 4, value: draft.persona, onChange: (e: { target: { value: string } }) => set(Object.assign({}, draft, { persona: e.target.value })), placeholder: '性格、立场、说话风格、专业背景……' })),
        h('div', { className: 'dsgc-field' },
          h('label', null, '模型提供方'),
          providers.length
            ? h('select', { className: 'dsgc-select', value: draft.provider, onChange: onProvider },
                h('option', { value: '' }, '选择提供方…'),
                providers.map((p) => h('option', { key: p.id, value: p.id }, p.name || p.id)))
            : h('div', { className: 'dsgc-selhint' },
                (props.modelsError ? '模型目录加载失败：' + props.modelsError : '暂无可用 provider') + ' ',
                h(P.Button, { variant: 'outline', size: 'sm', onClick: props.onRetryModels }, '重试'))),
        h('div', { className: 'dsgc-field' },
          h('label', null, '模型'),
          modelsOf.length
            ? h('select', { className: 'dsgc-select', value: draft.model, onChange: (e: { target: { value: string } }) => set(Object.assign({}, draft, { model: e.target.value, reasoningEffort: 'default' })) },
                modelsOf.map((m) => h('option', { key: m.id, value: m.id }, m.name || m.id)))
            : h('div', { className: 'dsgc-selhint' }, '请先选择有可用模型的提供方')),
        h('div', { className: 'dsgc-field' },
          h('label', null, '温度（可选）'),
          h('input', { className: 'dsgc-input', type: 'number', step: '0.1', min: '0', max: '2', value: draft.temperature == null ? '' : String(draft.temperature), onChange: (e: { target: { value: string } }) => set(Object.assign({}, draft, { temperature: e.target.value === '' ? undefined : Number(e.target.value) })) })),
        h('div', { className: 'dsgc-field' },
          h('label', null, '深度思考'),
          h('div', { style: { display: 'flex', gap: 10, alignItems: 'center' } },
            h(P.Switch, { checked: draft.thinking === true, onChange: (v: boolean) => set(Object.assign({}, draft, { thinking: v })), label: '深度思考' }),
            h('span', { className: 'dsgc-hint' }, '开启后角色发言前先思考（支持思考的模型）'))),
        draft.thinking === true
          ? h('div', { className: 'dsgc-field' },
              h('label', null, '推理级别'),
              effortsInfo === null
                ? h('div', { className: 'dsgc-selhint' }, '查询推理级别…')
                : !effortsInfo.ok
                  ? h('div', { className: 'dsgc-selhint' }, '推理级别查询失败：' + effortsInfo.error + '（若刚更新插件，请重启 dsh web 使 host 半生效）')
                  : (effortsInfo.efforts || []).length
                    ? h('select', {
                        className: 'dsgc-select',
                        value: draft.reasoningEffort && draft.reasoningEffort !== 'default' ? draft.reasoningEffort : 'default',
                        onChange: (e: { target: { value: string } }) => set(Object.assign({}, draft, { reasoningEffort: e.target.value })),
                        title: '取自当前模型设置中的推理选项；默认 = 使用该模型的默认推理级别',
                      },
                        h('option', { value: 'default' }, '默认' + (effortsInfo.defaultEffort ? '（当前默认：' + ((effortsInfo.efforts || []).find((x) => x.id === effortsInfo.defaultEffort) || { name: '' }).name + '）' : '')),
                        (effortsInfo.efforts || []).map((e) => h('option', { key: e.id, value: e.id, title: e.description || '' }, e.name || e.id)))
                    : h('div', { className: 'dsgc-selhint' }, '当前模型未提供推理等级，将使用默认'))
          : null,
        props.formError ? h('div', { className: 'dsgc-formerr' }, props.formError) : null)),
    h('div', { className: 'dsgc-drawerfoot' },
      h(P.Button, { variant: 'outline', onClick: close }, '取消'),
      h(P.Button, { variant: 'primary', onClick: props.onSave }, draft.id ? '保存' : '添加')))
}
