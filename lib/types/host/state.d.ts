/**
 * 群聊宿主服务共享状态容器：四张表 + run（对话进行时状态）+ 可变槽位
 * （store / revision / idSeq / lastCreated）。各功能模块（persistence /
 * broadcast / materials / tools / conversation / actions）以工厂装配到同一
 * 容器上，模块间只经显式依赖传递；容器本身只含数据与稳定引用，不含行为。
 * @module dsh-group-chat/host/state
 */
import type { Context } from '@deepseek-ai/cordis';
import type { Store } from './persistence/store.ts';
import type { GroupRecord, LastCreated, MessageRecord, RoleRecord, RunState, SessionRecord } from '../core/types.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        agentDefaultModel?: {
            currentSelection(): {
                provider: string;
                model: string;
            };
        };
    }
}
/** 角色标识色板（新增角色依序取色）。 */
export declare const PALETTE: string[];
/** 宿主服务共享状态容器（见模块注释；可变原始值一律经 core.* 访问）。 */
export interface HostState {
    ctx: Context;
    llm: Context['llm'];
    fs: Context['fs'];
    groups: Map<string, GroupRecord>;
    sessions: Map<string, SessionRecord>;
    roles: Map<string, RoleRecord>;
    messages: Map<string, MessageRecord>;
    run: RunState;
    /** 持久化句柄；锁失败降级内存态为 null，dispose 后置 null。 */
    store: Store | null;
    /** 快照版本号：touch() 递增。 */
    revision: number;
    /** id 序号（hydrate 后推进到历史最大值 + 1）。 */
    idSeq: number;
    nid: (p: string) => string;
    /** 最近一次创建的群组/会话，供客户端定位选中项。 */
    lastCreated: LastCreated | null;
    newSession: (groupId: string, name?: string) => SessionRecord;
}
/** 创建共享状态容器（仅数据与稳定引用，不含行为）。 */
export declare function createHostState(ctx: Context): HostState;
