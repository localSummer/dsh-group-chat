/**
 * 右侧成员与工作区栏组件
 * @module dsh-group-chat/client/components
 */

import type { ReactNode } from 'react'
import { Icon, P } from '../lib/ui.ts'
import { roleById, type ClientSnapshot, type ModelsResponse, type RoleDraft, type SnapshotRole } from '../lib/model.ts'

interface AsidePanelProps {
  snap: ClientSnapshot
  group: ClientSnapshot['groups'][number]
  asideOpen: boolean
  wsDraft: string | null
  setWsDraft: (val: string | null) => void
  fileBrowser: { open: boolean, loading: boolean, list: import('../../core/types.ts').BrowseResult | null, error: string } | null
  setFileBrowser: (val: { open: boolean, loading: boolean, list: import('../../core/types.ts').BrowseResult | null, error: string } | null) => void
  mutate: (args: Record<string, unknown>) => Promise<unknown>
  openRoleEditor: (role: SnapshotRole | null) => Promise<void>
  openBrowser: (path: string | undefined) => Promise<void>
  selectCurrentDir: () => void
}

export function AsidePanel(props: AsidePanelProps): ReactNode {
  const { snap, group, asideOpen, wsDraft, setWsDraft, fileBrowser, setFileBrowser, mutate, openRoleEditor, openBrowser, selectCurrentDir } = props

  const commitWsDir = (): void => {
    if (wsDraft !== null && group && wsDraft !== (group.workspaceDir || '')) {
      void mutate({ op: 'setWorkspaceDir', groupId: group.id, path: wsDraft })
    }
    setWsDraft(null)
  }

  return (
    <div className={'dsgc-aside' + (asideOpen ? '' : ' closed')} aria-hidden={asideOpen ? undefined : 'true'}>
      <div className="dsgc-sec">
        <div className="dsgc-sechead">
          群成员
          <span className="dsgc-secspacer" />
          <span className="dsgc-seccount">{group.roleIds.length ? group.roleIds.length + ' 个' : ''}</span>
          <P.Button variant="ghost" size="sm" onClick={() => { void openRoleEditor(null) }} aria-label="添加角色">
            {Icon(P.IconPlusOutline16, 14)}添加
          </P.Button>
        </div>
        {group.roleIds.length
          ? (
            <div className="dsgc-roles">
              {group.roleIds.map((rid) => {
                const r = roleById(snap, rid)
                if (!r) return null
                return (
                  <div
                    key={r.id}
                    className={'dsgc-role' + (r.enabled ? '' : ' off')}
                    role="button"
                    tabIndex={0}
                    onClick={() => { void openRoleEditor(r) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void openRoleEditor(r) } }}
                    title="点击编辑角色"
                  >
                    <div className="dsgc-rolehead">
                      <span className="dsgc-roledot" style={{ background: r.color || '#888' }} />
                      <span className="dsgc-rolename">{r.name}</span>
                      <P.Tooltip label={r.enabled ? '停用该角色' : '启用该角色'} side="top" delayMs={300}>
                        <span
                          onClick={(e) => { e.stopPropagation() }}
                          onKeyDown={(e) => { e.stopPropagation() }}
                          style={{ display: 'inline-flex', flex: 'none' }}
                        >
                          <P.Switch
                            checked={r.enabled}
                            onChange={() => { void mutate({ op: 'setRoleEnabled', roleId: r.id, enabled: !r.enabled }) }}
                            label={r.enabled ? '停用该角色' : '启用该角色'}
                            aria-label={(r.enabled ? '停用' : '启用') + '角色 ' + r.name}
                          />
                        </span>
                      </P.Tooltip>
                    </div>
                    {r.persona ? <div className="dsgc-rolepersona" title={r.persona}>{r.persona}</div> : null}
                    <div className="dsgc-rolemenu">
                      <span className="dsgc-rolemeta">
                        <span
                          className="dsgc-rolemodel"
                          title={r.provider + ' / ' + r.model + (r.thinking ? ' · 深度思考' + (r.reasoningEffort && r.reasoningEffort !== 'default' ? '（' + r.reasoningEffort + '）' : '') : '')}
                        >
                          {r.provider} / {r.model}
                        </span>
                        {r.thinking
                          ? <span className="dsgc-rolethink" title="深度思考">{Icon(P.IconThinkOutline14, 14)}</span>
                          : null}
                      </span>
                      <span className="dsgc-roleops">
                        <button
                          className="dsgc-opbtn"
                          title="编辑角色"
                          aria-label="编辑角色"
                          onClick={(e) => { e.stopPropagation(); void openRoleEditor(r) }}
                        >
                          {Icon(P.IconEditOutline16, 14)}
                        </button>
                        <button
                          className="dsgc-opbtn danger"
                          title="移除角色"
                          aria-label="移除角色"
                          onClick={(e) => { e.stopPropagation(); void mutate({ op: 'deleteRole', roleId: r.id }) }}
                        >
                          {Icon(P.IconTrashOutline16, 14)}
                        </button>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            )
          : <div className="dsgc-hint">还没有角色。每个角色可绑定不同的 provider/model，在群内以独立身份发言。</div>}
      </div>
      <div className="dsgc-sec">
        <div className="dsgc-sechead">工作区目录</div>
        <div className="dsgc-field">
          <div className="dsgc-wsrow">
            <input
              className="dsgc-input"
              value={wsDraft === null ? (group.workspaceDir || '') : wsDraft}
              placeholder="~/docs 或 /abs/dir"
              onChange={(e) => { setWsDraft(e.target.value) }}
              onBlur={commitWsDir}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
            />
            <P.Button variant="outline" size="sm" onClick={() => { void openBrowser(wsDraft === null ? group.workspaceDir : wsDraft) }}>
              {Icon(P.IconFolderOpenOutline16, 14)}浏览
            </P.Button>
          </div>
          <div className="dsgc-hint">发送时读取目录内文本文件，注入本群全体角色上下文；角色也可用工具主动查看</div>
          {group.workspaceDir === '~' || group.workspaceDir === '/'
            ? <div className="dsgc-err">工作区指向整个主目录/根目录：角色的只读工具将可读取该范围下的所有文件，请谨慎</div>
            : null}
        </div>
        {fileBrowser && fileBrowser.open
          ? (
            <div className="dsgc-fb">
              <div className="dsgc-fbhead">
                <span className="dsgc-fbpath" title={fileBrowser.list ? fileBrowser.list.path : ''}>
                  {fileBrowser.loading ? '读取中…' : (fileBrowser.list ? fileBrowser.list.path : '')}
                </span>
                <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <P.Button variant="primary" size="sm" disabled={!fileBrowser.list} onClick={selectCurrentDir}>选定此目录</P.Button>
                  {fileBrowser.list
                    ? <P.Button variant="outline" size="sm" title="上一级" aria-label="上一级" onClick={() => { void openBrowser(fileBrowser.list!.parent) }}>{Icon(P.IconChevronUpOutline14, 14)}</P.Button>
                    : null}
                  {fileBrowser.list
                    ? <P.Button variant="outline" size="sm" title="主目录" aria-label="主目录" onClick={() => { void openBrowser(fileBrowser.list!.home) }}>{Icon(P.IconFolderClose16, 14)}</P.Button>
                    : null}
                  <P.Button variant="ghost" size="sm" onClick={() => { setFileBrowser(null) }} aria-label="关闭浏览器">{Icon(P.IconCloseOutline16, 14)}</P.Button>
                </span>
              </div>
              {fileBrowser.error ? <div className="dsgc-err">{fileBrowser.error}</div> : null}
              {fileBrowser.list
                ? (
                  <div className="dsgc-fblist">
                    {(fileBrowser.list.entries || []).length
                      ? (fileBrowser.list.entries || []).map((e) => e.type === 'directory'
                        ? (
                          <button
                            key={e.path}
                            type="button"
                            className={'dsgc-fbrow' + (e.hidden ? ' dim' : '') + ' dir'}
                            onClick={() => { void openBrowser(e.path) }}
                          >
                            {Icon(e.hidden ? P.IconFolderClose16 : P.IconFolderOpenOutline16, 14)}
                            <span className="dsgc-fbname">{e.name}/</span>
                          </button>
                          )
                        : (
                          <div key={e.path} className="dsgc-fbrow dim file">
                            <span className="dsgc-fbname">{e.name}</span>
                            {e.size !== undefined ? <span className="dsgc-fbsize">{(P as unknown as { fileSizeText: (n: number) => string }).fileSizeText(e.size)}</span> : null}
                          </div>
                          ))
                      : <div className="dsgc-hint">空目录</div>}
                  </div>
                  )
                : null}
            </div>
            )
          : null}
      </div>
    </div>
  )
}
