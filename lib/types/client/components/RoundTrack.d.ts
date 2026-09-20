/**
 * 多轮进度轨道（RareUI Step player 的插件习语重写）：把本次 run 的发言计划
 * （queue：轮次 × 参与角色顺序展开）渲染为步点序列——已完成 = 角色色实心点、
 * 当前 = 拉伸小条 + 角色色微光扫动填充（流式期间交棒）、未开始 = 空心点；
 * 轮与轮之间加大间距。run 结束随组件卸载（临时态，不占常驻布局）。
 * 无播放/暂停控件（停止按钮在 composer），步点不可点。
 * @module dsh-group-chat/client/RoundTrack
 */
import type { ReactNode } from 'react';
import { type ClientSnapshot } from '../lib/model.ts';
interface RoundTrackProps {
    snap: ClientSnapshot;
}
export declare function RoundTrack(props: RoundTrackProps): ReactNode;
export {};
