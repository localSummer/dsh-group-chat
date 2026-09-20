/**
 * 多轮进度轨道（RareUI Step player 的插件习语重写）：把本次 run 的发言计划
 * （queue：轮次 × 参与角色顺序展开）渲染为步点序列——已完成 = 角色色实心点、
 * 当前 = 拉伸小条 + 角色色微光扫动填充（流式期间交棒）、未开始 = 空心点；
 * 轮与轮之间加大间距。run 结束随组件卸载（临时态，不占常驻布局）。
 * 无播放/暂停控件（停止按钮在 composer），步点不可点。
 * @module dsh-group-chat/client/RoundTrack
 */

import type { CSSProperties, ReactNode } from 'react'
import { roleById, type ClientSnapshot } from '../lib/model.ts'

interface RoundTrackProps {
  snap: ClientSnapshot
}

export function RoundTrack(props: RoundTrackProps): ReactNode {
  const { snap } = props
  const run = snap.run
  const plan = run.queue
  if (!plan.length) return null
  // 每轮人数：计划中 queue[0] 第二次出现的索引（无重复 = 单轮，不加轮分隔）
  const second = plan.indexOf(plan[0], 1)
  const perRound = second === -1 ? plan.length : second
  // 当前步：queueIndex - 1（正在发言）；currentRoleId 为空（失败/收尾）时无当前步
  const curIdx = run.currentRoleId ? run.queueIndex - 1 : -1

  return (
    <div className="dsgc-rtrack" aria-hidden="true">
      {plan.map((roleId, i) => {
        const role = roleById(snap, roleId)
        const state = i === curIdx ? 'cur' : i < run.queueIndex ? 'done' : 'todo'
        const title = '第 ' + (i + 1) + ' / ' + plan.length + ' 位：' + (role ? role.name : '未知角色')
          + (i === curIdx ? '（发言中）' : i < run.queueIndex ? '' : '（待发言）')
        return (
          <span
            key={i}
            className={'dsgc-rtrack-step ' + state + (perRound < plan.length && i > 0 && i % perRound === 0 ? ' roundsep' : '')}
            style={{ '--role-color': (role && role.color) || '#888' } as CSSProperties}
            title={title}
          />
        )
      })}
    </div>
  )
}
