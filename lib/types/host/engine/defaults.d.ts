/**
 * 引擎共享小件：DSH 默认模型读取 + 发言人展示名（retitle / fold / conversation 共用）。
 * @module dsh-group-chat/host/engine/defaults
 */
import type { RoleRecord } from '../../core/types.ts';
import type { HostState } from '../state.ts';
/** DSH 默认模型（agentDefaultModel 服务缺位或未配置时返回 null，调用方静默跳过）。 */
export declare const defaultModel: (core: HostState) => {
    provider: string;
    model: string;
} | null;
/** 发言人展示名（roles 表内查角色名；user/system 固定文案，见 speakerLabel）。 */
export declare const speakerNameOf: (roles: Map<string, RoleRecord>, speaker: string) => string;
