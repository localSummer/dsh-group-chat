/**
 * 多轮进度轨道（RareUI Step player 的插件习语重写）：把本次 run 的发言计划
 * （queue：轮次 × 参与角色顺序展开）渲染为步点序列——已完成 = 角色色实心点、
 * 当前 = 拉伸小条 + 角色色微光扫动填充（静态淡底会被感知为卡住：深度思考
 * 模型首字节可等数十秒，扫动是「仍在进行」的常驻信号）、未开始 = 空心点；
 * 轮与轮之间加大间距。轨道尾部为当前发言人的运行计时（对齐主会话 TurnStatus
 * 时钟：锚定回话开始、1s tick、≥15s 才显示、`N秒`/`M分SS秒` 格式，数字走
 * RollingNumber 滚轮）。run 结束随组件卸载（临时态，不占常驻布局）。
 * 无播放/暂停控件（停止按钮在 composer），步点不可点。
 * @module dsh-group-chat/client/RoundTrack
 */

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { roleById, type ClientSnapshot } from '../lib/model.ts'
import { RollingNumber } from './RollingNumber.tsx'

interface RoundTrackProps {
  snap: ClientSnapshot
}

/** 主会话 TurnStatus 的显示门槛：计时 ≥15s 才出时钟（降低短回合噪音）。 */
const SHOW_CLOCK_AFTER_MS = 15000

/** 当前发言人运行计时（对齐主会话 formatRunDuration：`{seconds}秒` / `{minutes}分{seconds 补零2}秒`）。 */
function TurnElapsed(props: { startedAt: number }): ReactNode {
  const { startedAt } = props
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => { setNow(Date.now()) }, 1000)
    return () => { clearInterval(id) }
  }, [])
  const elapsed = Math.max(0, now - startedAt)
  if (elapsed < SHOW_CLOCK_AFTER_MS) return null
  const total = Math.floor(elapsed / 1000)
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return (
    <span className="dsgc-rtrack-elapsed" title="当前发言人已运行">
      {minutes > 0
        ? <><RollingNumber value={minutes} />分<RollingNumber value={seconds} pad={2} />秒</>
        : <><RollingNumber value={seconds} />秒</>}
    </span>
  )
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
      {curIdx >= 0 && run.turnStartedAt !== null ? <TurnElapsed startedAt={run.turnStartedAt} /> : null}
    </div>
  )
}
