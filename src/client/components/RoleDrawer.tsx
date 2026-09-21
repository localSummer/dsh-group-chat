/**
 * 角色编辑抽屉（右侧滑出，不遮挡会话流阅读）。
 * @module dsh-group-chat/client/drawer
 */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon, P } from '../lib/ui.ts'
import { api } from '../lib/api.ts'
import { PALETTE, type EffortsResponse, type ModelsResponse, type RoleDraft } from '../lib/model.ts'
import type { MutateResponse } from '../hooks/useGroupChatState.ts'

export interface RoleDrawerProps {
  draft: RoleDraft
  set: (draft: RoleDraft) => void
  /** 保存目标群组（upsertRole 落库）。 */
  groupId: string
  models: ModelsResponse | null
  modelsError: string | null
  onRetryModels: () => void
  mutate: (args: Record<string, unknown>) => Promise<unknown>
  onCancel: () => void
}

export function RoleDrawer(props: RoleDrawerProps): ReactNode {
  const { draft, set, groupId } = props
  const models = props.models
  const providers = (models && models.providers) || []
  const modelsOf = (models && models.modelsByProvider && models.modelsByProvider[draft.provider]) || []
  const [closing, setClosing] = useState(false)
  // Esc 监听挂在空依赖上，闭包看的是首帧 closing（恒 false）——用 ref 挡住
  // 退场动画窗口内的重复触发
  const closingRef = useRef(false)
  const [formError, setFormError] = useState('')
  const [effortsInfo, setEffortsInfo] = useState<EffortsResponse | null>(null)
  const close = (): void => {
    if (closingRef.current) return
    closingRef.current = true
    setClosing(true)
    window.setTimeout(() => props.onCancel(), 140)
  }
  const onProvider = (e: { target: { value: string } }): void => {
    const p = e.target.value
    const list = (models && models.modelsByProvider && models.modelsByProvider[p]) || []
    // 换模型路线后旧推理级别失效，重置为默认
    set(Object.assign({}, draft, { provider: p, model: list.length ? list[0].id : '', reasoningEffort: 'default' }))
  }
  /** 保存（校验在本地，落库经 mutate；失败文案与原实现逐字一致）。 */
  const save = async (): Promise<void> => {
    if (!draft.name.trim()) {
      setFormError('角色名称不能为空')
      return
    }
    if (!draft.provider || !draft.model) {
      setFormError('请选择角色绑定的模型')
      return
    }
    const res = await props.mutate({ op: 'upsertRole', groupId, role: draft }) as MutateResponse | null
    if (res && res.ok && res.snapshot && !res.snapshot.error) {
      props.onCancel()
    }
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
  return (
    <div className={'dsgc-drawer' + (closing ? ' closing' : '')} role="dialog" aria-modal="false" aria-label={draft.id ? '编辑角色' : '添加角色'}>
      <div className="dsgc-drawerhead">
        {Icon(P.IconUserOutline16, 16)}
        <span className="dsgc-drawertitle">{draft.id ? '编辑角色' : '添加角色'}</span>
        <P.Button variant="ghost" size="sm" onClick={close} aria-label="关闭">{Icon(P.IconCloseOutline16, 16)}</P.Button>
      </div>
      <div className="dsgc-drawerbody">
        <div className="dsgc-form">
          <div className="dsgc-field">
            <label>名称</label>
            <input
              className="dsgc-input"
              value={draft.name}
              autoFocus={!draft.id}
              onChange={(e) => { set(Object.assign({}, draft, { name: e.target.value })) }}
              placeholder="例如：产品经理"
            />
          </div>
          <div className="dsgc-field">
            <label>标识色</label>
            <div className="dsgc-palette">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={'dsgc-dot' + (draft.color === c ? ' on' : '')}
                  style={{ background: c }}
                  onClick={() => { set(Object.assign({}, draft, { color: c })) }}
                  aria-label={'选择标识色 ' + c}
                />
              ))}
            </div>
          </div>
          <div className="dsgc-field">
            <label>人设 / 角色设定</label>
            <textarea
              className="dsgc-textarea"
              rows={4}
              value={draft.persona}
              onChange={(e) => { set(Object.assign({}, draft, { persona: e.target.value })) }}
              placeholder="性格、立场、说话风格、专业背景……"
            />
          </div>
          <div className="dsgc-field">
            <label>模型提供方</label>
            {providers.length
              ? (
                <select className="dsgc-select" value={draft.provider} onChange={onProvider}>
                  <option value="">选择提供方…</option>
                  {providers.map((p) => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
                </select>
                )
              : (
                <div className="dsgc-selhint">
                  {(props.modelsError ? '模型目录加载失败：' + props.modelsError : '暂无可用 provider') + ' '}
                  <P.Button variant="outline" size="sm" onClick={props.onRetryModels}>重试</P.Button>
                </div>
                )}
          </div>
          <div className="dsgc-field">
            <label>模型</label>
            {modelsOf.length
              ? (
                <select
                  className="dsgc-select"
                  value={draft.model}
                  onChange={(e) => { set(Object.assign({}, draft, { model: e.target.value, reasoningEffort: 'default' })) }}
                >
                  {modelsOf.map((m) => <option key={m.id} value={m.id}>{m.name || m.id}</option>)}
                </select>
                )
              : <div className="dsgc-selhint">请先选择有可用模型的提供方</div>}
          </div>
          <div className="dsgc-field">
            <label>温度（可选）</label>
            <input
              className="dsgc-input"
              type="number"
              step="0.1"
              min="0"
              max="2"
              value={draft.temperature == null ? '' : String(draft.temperature)}
              onChange={(e) => { set(Object.assign({}, draft, { temperature: e.target.value === '' ? undefined : Number(e.target.value) })) }}
            />
          </div>
          <div className="dsgc-field">
            <label>深度思考</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <P.Switch checked={draft.thinking === true} onChange={(v: boolean) => { set(Object.assign({}, draft, { thinking: v })) }} label="深度思考" />
              <span className="dsgc-hint">开启后角色发言前先思考（支持思考的模型）</span>
            </div>
          </div>
          {draft.thinking === true
            ? (
              <div className="dsgc-field">
                <label>推理级别</label>
                {effortsInfo === null
                  ? <div className="dsgc-selhint">查询推理级别…</div>
                  : !effortsInfo.ok
                    ? <div className="dsgc-selhint">推理级别查询失败：{effortsInfo.error}（若刚更新插件，请重启 dsh web 使 host 半生效）</div>
                    : (effortsInfo.efforts || []).length
                      ? (
                        <select
                          className="dsgc-select"
                          value={draft.reasoningEffort && draft.reasoningEffort !== 'default' ? draft.reasoningEffort : 'default'}
                          onChange={(e) => { set(Object.assign({}, draft, { reasoningEffort: e.target.value })) }}
                          title="取自当前模型设置中的推理选项；默认 = 使用该模型的默认推理级别"
                        >
                          <option value="default">
                            默认{effortsInfo.defaultEffort ? '（当前默认：' + ((effortsInfo.efforts || []).find((x) => x.id === effortsInfo.defaultEffort) || { name: '' }).name + '）' : ''}
                          </option>
                          {(effortsInfo.efforts || []).map((e) => <option key={e.id} value={e.id} title={e.description || ''}>{e.name || e.id}</option>)}
                        </select>
                        )
                      : <div className="dsgc-selhint">当前模型未提供推理等级，将使用默认</div>}
              </div>
              )
            : null}
          {formError ? <div className="dsgc-formerr">{formError}</div> : null}
        </div>
      </div>
      <div className="dsgc-drawerfoot">
        <P.Button variant="outline" onClick={close}>取消</P.Button>
        <P.Button variant="primary" onClick={() => { save() }}>{draft.id ? '保存' : '添加'}</P.Button>
      </div>
    </div>
  )
}
