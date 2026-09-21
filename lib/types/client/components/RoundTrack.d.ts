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
import { type ReactNode } from 'react';
import { type ClientSnapshot } from '../lib/model.ts';
interface RoundTrackProps {
    snap: ClientSnapshot;
}
export declare function RoundTrack(props: RoundTrackProps): ReactNode;
export {};
