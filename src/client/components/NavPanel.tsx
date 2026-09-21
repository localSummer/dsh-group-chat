/**
 * 左侧导航栏组件（群组 → 会话目录树；群组行与会话行共用重命名/删除三件套）。
 * @module dsh-group-chat/client/components
 */

import type { ReactNode, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Icon, P } from '../lib/ui.ts'
import { ConfirmDelete } from './ConfirmDelete.tsx'
import { HoverTip } from './HoverTip.tsx'
import { groupById, sessById, sessStatus, SESS_STATUS_LABEL, type ClientSnapshot } from '../lib/model.ts'

/** 目录树节点编辑态形状（群组/会话共用）。 */
type NodeEdit = { kind: 'group' | 'session', id: string, value: string }

interface NavPanelProps {
  snap: ClientSnapshot
  search: string
  setSearch: (val: string) => void
  collapsedGroups: Set<string>
  setCollapsedGroups: (fn: (prev: Set<string>) => Set<string>) => void
  gid: string | null
  sid: string | null
  setGid: (val: string) => void
  setSid: (val: string) => void
  setPartsSel: (val: string[] | null) => void
  renameDraft: NodeEdit | null
  setRenameDraft: (val: NodeEdit | null) => void
  mutate: (args: Record<string, unknown>) => Promise<unknown>
  navOpen: boolean
}

/** 内联重命名输入（群组行/会话行同款）。 */
function RenameField(props: { draft: NodeEdit, set: (d: NodeEdit | null) => void, commit: () => void, keyDown: (e: ReactKeyboardEvent<HTMLInputElement>) => void }): ReactNode {
  const { draft, set, commit, keyDown } = props
  return (
    <input
      className="dsgc-rename"
      value={draft.value}
      autoFocus
      onChange={(e) => { set({ kind: draft.kind, id: draft.id, value: e.target.value }) }}
      onBlur={() => { commit() }}
      onKeyDown={keyDown}
      onClick={(e) => { e.stopPropagation() }}
    />
  )
}

/** 行尾操作钮：重命名 + 原地确认删除（群组行/会话行同款）。 */
function NodeOps(props: { renameLabel: string, deleteLabel: string, onRename: () => void, onDelete: () => void }): ReactNode {
  const { renameLabel, deleteLabel, onRename, onDelete } = props
  return (
    <span className="dsgc-nodeops">
      <button
        className="dsgc-opbtn"
        title={renameLabel}
        aria-label={renameLabel}
        onClick={(e) => { e.stopPropagation(); onRename() }}
      >
        {Icon(P.IconEditOutline16, 14)}
      </button>
      <ConfirmDelete label={deleteLabel} onConfirm={onDelete} />
    </span>
  )
}

export function NavPanel(props: NavPanelProps): ReactNode {
  const { snap, search, setSearch, collapsedGroups, setCollapsedGroups, gid, sid, setGid, setSid, setPartsSel, renameDraft, setRenameDraft, mutate, navOpen } = props

  const commitRename = async (): Promise<void> => {
    if (!renameDraft) return
    const d = renameDraft
    setRenameDraft(null)
    const value = String(d.value || '').trim()
    if (!value) return
    if (d.kind === 'group') await mutate({ op: 'renameGroup', groupId: d.id, name: value })
    else await mutate({ op: 'renameSession', sessionId: d.id, name: value })
  }

  const renameKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitRename()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setRenameDraft(null)
    }
  }

  // 选中即清编辑态（三连调用收敛为一处）
  const clearEdits = (): void => {
    setPartsSel(null)
    setRenameDraft(null)
  }
  const pickGroup = (id: string): void => {
    setGid(id)
    clearEdits()
  }
  const pickSession = (gidToSet: string, sidToSet: string): void => {
    setGid(gidToSet)
    setSid(sidToSet)
    clearEdits()
  }

  const q = search.trim().toLowerCase()
  const groupMatches = (g: ClientSnapshot['groups'][number]): { show: boolean, filterSessions: boolean } => {
    if (!q) return { show: true, filterSessions: false }
    if (g.name.toLowerCase().includes(q)) return { show: true, filterSessions: false }
    const hitSessions = g.sessionIds.map((id) => sessById(snap, id)).filter((s) => s && s.name.toLowerCase().includes(q))
    return { show: hitSessions.length > 0, filterSessions: true }
  }

  const group = gid ? groupById(snap, gid) : null
  const selected = sid ? sessById(snap, sid) : null

  const treeNodes: ReactNode[] = []
  for (const g of snap.groups) {
    const match = groupMatches(g)
    if (!match.show) continue
    const expanded = q ? true : !collapsedGroups.has(g.id)
    const isRenameGroup = renameDraft && renameDraft.kind === 'group' && renameDraft.id === g.id
    const groupChildren: ReactNode[] = []

    if (expanded) {
      for (const sessionId of g.sessionIds) {
        const s = sessById(snap, sessionId)
        if (!s) continue
        if (match.filterSessions && !s.name.toLowerCase().includes(q)) continue
        const isActive = selected && s.id === selected.id && g.id === group?.id
        const isRenameSess = renameDraft && renameDraft.kind === 'session' && renameDraft.id === s.id
        // 会话状态（对齐主 GUI StateDot：idle 不渲染点）
        const st = sessStatus(snap.run, s.id)

        groupChildren.push(
          <div
            key={s.id}
            className={'dsgc-sess-row' + (isActive ? ' on' : '')}
            role="button"
            tabIndex={0}
            onClick={() => { pickSession(g.id, s.id) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                pickSession(g.id, s.id)
              }
            }}
          >
            {/* 固定宽度状态槽（对齐主 GUI：槽恒在、点按状态渲染——行间文案对齐） */}
            <span className="dsgc-sess-status">
              {st !== 'idle'
                ? (
                  <span role="img" title={SESS_STATUS_LABEL[st]} aria-label={SESS_STATUS_LABEL[st]}>
                    <P.StateDot state={st} size={8} />
                  </span>
                )
                : null}
            </span>
            {isRenameSess
              ? <RenameField draft={renameDraft!} set={setRenameDraft} commit={() => { commitRename() }} keyDown={renameKeyDown} />
              : (
                <HoverTip label={s.name} side="right" delayMs={500} className="dsgc-sess-name">
                  {s.name}
                </HoverTip>
                )}
            <NodeOps
              renameLabel="重命名会话"
              deleteLabel="删除会话"
              onRename={() => { setRenameDraft({ kind: 'session', id: s.id, value: s.name }) }}
              onDelete={() => { mutate({ op: 'deleteSession', sessionId: s.id }) }}
            />
          </div>,
        )
      }

      groupChildren.push(
        <button key="__add" className="dsgc-addsess" onClick={() => { mutate({ op: 'createSession', groupId: g.id }) }}>
          {Icon(P.IconPlusOutline16, 14)}新会话
        </button>,
      )
    }

    treeNodes.push(
      <div key={g.id} className="dsgc-gnode">
        <div
          className={'dsgc-grow-row' + (g.id === group?.id ? ' on' : '')}
          role="button"
          tabIndex={0}
          onClick={() => { pickGroup(g.id) }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              pickGroup(g.id)
            }
          }}
        >
          <button
            className={'dsgc-twist' + (expanded ? '' : ' closed')}
            title={expanded ? '收起' : '展开'}
            aria-label={expanded ? '收起' : '展开'}
            onClick={(e) => {
              e.stopPropagation()
              setCollapsedGroups((prev) => {
                const next = new Set(prev)
                if (next.has(g.id)) next.delete(g.id)
                else next.add(g.id)
                return next
              })
            }}
          >
            {Icon(P.IconChevronDownOutline14, 14)}
          </button>
          {isRenameGroup
            ? <RenameField draft={renameDraft!} set={setRenameDraft} commit={() => { commitRename() }} keyDown={renameKeyDown} />
            : <span className="dsgc-gname">{g.name}</span>}
          <NodeOps
            renameLabel="重命名群组"
            deleteLabel="删除群组"
            onRename={() => { setRenameDraft({ kind: 'group', id: g.id, value: g.name }) }}
            onDelete={() => { mutate({ op: 'deleteGroup', groupId: g.id }) }}
          />
        </div>
        {expanded ? <div className="dsgc-sess-list">{groupChildren}</div> : null}
      </div>,
    )
  }

  return (
    <div className={'dsgc-nav' + (navOpen ? '' : ' closed')} aria-hidden={navOpen ? undefined : 'true'}>
      <P.Input
        icon={Icon(P.IconSearchOutline16, 16)}
        className="dsgc-search"
        placeholder="搜索群组与会话…"
        value={search}
        onChange={(e: { target: { value: string } }) => setSearch(e.target.value)}
      />
      {treeNodes.length
        ? <div className="dsgc-tree">{treeNodes}</div>
        : <div className="dsgc-hint">{q ? '没有匹配「' + search.trim() + '」的群组或会话' : '暂无群组'}</div>}
      <P.Button variant="outline" onClick={() => { mutate({ op: 'createGroup' }) }}>
        {Icon(P.IconPlusOutline16, 16)}新建群组
      </P.Button>
    </div>
  )
}
