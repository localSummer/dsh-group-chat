/**
 * 角色发言失败卡：人话标题 + 可展开原文。操作条由 Bubble 放在气泡外下方。
 * @module dsh-group-chat/client/FailCard
 */

import { useState, type ReactNode } from 'react'
import { Icon, P } from '../lib/ui.ts'
import { classifySpeakFailure } from '../../core/errors.ts'
import { ClipWell, Fold } from './Fold.tsx'

export interface FailCardProps {
  raw: string
}

export function FailCard(props: FailCardProps): ReactNode {
  const view = classifySpeakFailure(props.raw)
  const [open, setOpen] = useState(false)

  return (
    <div className="dsgc-fail">
      <div className="dsgc-failhead">
        <span className="dsgc-failicon" aria-hidden="true">{Icon(P.IconWarningOutline16, 14)}</span>
        <div className="dsgc-failcopy">
          <div className="dsgc-failtitle">{view.title}</div>
          {view.detail ? <div className="dsgc-faildetail">{view.detail}</div> : null}
        </div>
      </div>
      {view.raw
        ? (
          <>
            <button
              type="button"
              className={'dsgc-failmore' + (open ? ' open' : '')}
              aria-expanded={open}
              onClick={() => { setOpen((v) => !v) }}
            >
              {open ? '收起原始错误' : '查看原始错误'}
            </button>
            <Fold open={open}>
              <ClipWell maxHeight={220} watch={open}>
                <pre className="dsgc-failraw">{view.raw}</pre>
              </ClipWell>
            </Fold>
          </>
          )
        : null}
    </div>
  )
}
