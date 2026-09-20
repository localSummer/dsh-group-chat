/**
 * 发言人执行态点阵光球（live 行头像内容）：角色色单色点阵 Canvas 2D 动画。
 * thinking（轨道热斑游走＝等待首字节/推理中）与 listening（向外涟漪＝正文
 * 流出）两态间弹簧缩放 + 权重交叉淡入；裁掉参考实现 MatrixOrb 的 label、
 * level 与 idle 态（本场景只有执行中一种挂载时机），尺寸钉死为头像内容盒。
 * @module dsh-group-chat/client/SpeakerOrb
 */
import { type ReactNode } from 'react';
export type SpeakerOrbState = 'thinking' | 'listening';
export declare function SpeakerOrb(props: {
    state: SpeakerOrbState;
    color: string;
}): ReactNode;
