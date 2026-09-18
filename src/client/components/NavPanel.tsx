/**
 * 左侧导航栏组件
 * @module dsh-group-chat/client/components
 */

import type { ReactNode, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Icon, P } from '../lib/ui.ts'
import { groupById, sessById, type ClientSnapshot } from '../lib/model.ts'

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
  renameDraft: { kind: 'group' | 'session', id: string, value: string } | null
  setRenameDraft: (val: { kind: 'group' | 'session', id: string, value: string } | null) => void
  confirmDel: { kind: 'group' | 'session', id: string } | null
  setConfirmDel: (val: { kind: 'group' | 'session', id: string } | null) => void
  mutate: (args: Record<string, unknown>) => Promise<unknown>
  navOpen: boolean
}

export function NavPanel(props: NavPanelProps): ReactNode {
  const { snap, search, setSearch, collapsedGroups, setCollapsedGroups, gid, sid, setGid, setSid, setPartsSel, renameDraft, setRenameDraft, confirmDel, setConfirmDel, mutate, navOpen } = props

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
      void commitRename()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setRenameDraft(null)
    }
  }

  const doDelete = async (): Promise<void> => {
    if (!confirmDel) return
    const d = confirmDel
    setConfirmDel(null)
    if (d.kind === 'group') await mutate({ op: 'deleteGroup', groupId: d.id })
    else await mutate({ op: 'deleteSession', sessionId: d.id })
  }

  const q = search.trim().toLowerCase()
  const groupMatches = (g: ClientSnapshot['groups'][number]): { show: boolean, filterSessions: boolean } => {
    if (!q) return { show: true, filterSessions: false }
    if (g.name.toLowerCase().includes(q)) return { show: true, filterSessions: false }
    const hitSessions = g.sessionIds.map((id) => sessById(snap, id)).filter((s) => s && s.name.toLowerCase().includes(q))
    return { show: hitSessions.length > 0, filterSessions: true }
  }

  const group = gid ? groupById(snap, gid) : null

  const treeNodes: ReactNode[] = []
  for (const g of snap.groups) {
    const match = groupMatches(g)
    if (!match.show) continue
    const expanded = q ? true : !collapsedGroups.has(g.id)
    const isRenameGroup = renameDraft && renameDraft.kind === 'group' && renameDraft.id === g.id
    const isConfirmGroup = confirmDel && confirmDel.kind === 'group' && confirmDel.id === g.id
    const groupChildren: ReactNode[] = []
    
    if (expanded) {
      for (const sessionId of g.sessionIds) {
        const s = sessById(snap, sessionId)
        if (!s) continue
        if (match.filterSessions && !s.name.toLowerCase().includes(q)) continue
        const sess = sid ? sessById(snap, sid) : null
        const isActive = sess && s.id === sess.id && g.id === group?.id
        const isRenameSess = renameDraft && renameDraft.kind === 'session' && renameDraft.id === s.id
        const isConfirm = confirmDel && confirmDel.kind === 'session' && confirmDel.id === s.id
        
        groupChildren.push(
          <div
            key={s.id}
            className={'dsgc-sess-row' + (isActive ? ' on' : '')}
            role="button"
            tabIndex={0}
            onClick={() => { setGid(g.id); setSid(s.id); setPartsSel(null); setConfirmDel(null); setRenameDraft(null) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setGid(g.id); setSid(s.id); setPartsSel(null); setConfirmDel(null); setRenameDraft(null)
              }
            }}
          >
            <span className="dsgc-sess-dot" />
            {isRenameSess
              ? (
                <input
                  className="dsgc-rename"
                  value={renameDraft!.value}
                  autoFocus
                  onChange={(e) => { setRenameDraft({ kind: 'session', id: s.id, value: e.target.value }) }}
                  onBlur={() => { void commitRename() }}
                  onKeyDown={renameKeyDown}
                  onClick={(e) => { e.stopPropagation() }}
                />
                )
              : <span className="dsgc-sess-name">{s.name}</span>}
            <span className="dsgc-nodeops">
              <button
                className="dsgc-opbtn"
                title="重命名会话"
                aria-label="重命名会话"
                onClick={(e) => { e.stopPropagation(); setRenameDraft({ kind: 'session', id: s.id, value: s.name }) }}
              >
                {Icon(P.IconEditOutline16, 14)}
              </button>
              <button
                className={'dsgc-opbtn' + (isConfirm ? ' danger' : '')}
                title={isConfirm ? '再次点击确认删除' : '删除会话'}
                aria-label="删除会话"
                onClick={(e) => {
                  e.stopPropagation()
                  if (isConfirm) void doDelete()
                  else setConfirmDel({ kind: 'session', id: s.id })
                }}
              >
                {Icon(P.IconTrashOutline16, 14)}
              </button>
            </span>
          </div>,
        )
      }
      
      groupChildren.push(
        <button key="__add" className="dsgc-addsess" onClick={() => { void mutate({ op: 'createSession', groupId: g.id }) }}>
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
          onClick={() => { setGid(g.id); setPartsSel(null); setConfirmDel(null); setRenameDraft(null) }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setGid(g.id); setPartsSel(null); setConfirmDel(null); setRenameDraft(null)
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
            ? (
              <input
                className="dsgc-rename"
                value={renameDraft!.value}
                autoFocus
                onChange={(e) => { setRenameDraft({ kind: 'group', id: g.id, value: e.target.value }) }}
                onBlur={() => { void commitRename() }}
                onKeyDown={renameKeyDown}
                onClick={(e) => { e.stopPropagation() }}
              />
              )
            : <span className="dsgc-gname">{g.name}</span>}
          <span className="dsgc-nodeops">
            <button
              className="dsgc-opbtn"
              title="重命名群组"
              aria-label="重命名群组"
              onClick={(e) => { e.stopPropagation(); setRenameDraft({ kind: 'group', id: g.id, value: g.name }) }}
            >
              {Icon(P.IconEditOutline16, 14)}
            </button>
            <button
              className={'dsgc-opbtn' + (isConfirmGroup ? ' danger' : '')}
              title={isConfirmGroup ? '再次点击确认删除' : '删除群组'}
              aria-label="删除群组"
              onClick={(e) => {
                e.stopPropagation()
                if (isConfirmGroup) void doDelete()
                else setConfirmDel({ kind: 'group', id: g.id })
              }}
            >
              {Icon(P.IconTrashOutline16, 14)}
            </button>
          </span>
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
      <P.Button variant="outline" onClick={() => { void mutate({ op: 'createGroup' }) }}>
        {Icon(P.IconPlusOutline16, 16)}新建群组
      </P.Button>
    </div>
  )
}
