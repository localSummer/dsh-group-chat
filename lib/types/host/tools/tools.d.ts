/**
 * 工具执行（TOOLS.md §2：沙箱 / §3：确认闸门）：read_file / list_dir /
 * run_command 三件套；realpath 硬边界 + 分隔符比较；run_command 按群组
 * 权限档位走逐条确认或直接执行，经 `shell` 服务（ctx.shell 沙箱执行器）
 * 以 per-call sandboxPolicy 收紧到群工作区。
 * @module dsh-group-chat/host/tools
 */
import { TOOL_SCHEMAS } from '../../core/tools.ts';
import type { GroupRecord, ToolExecution } from '../../core/types.ts';
import type { HostState } from '../state.ts';
/** 工具面。 */
export interface Tools {
    /** 执行一次工具调用（args 解析 + 分发 + 计时；确认闸门在 run_command 内）。 */
    executeTool: (g: GroupRecord, root: string, tc: {
        id: string;
        name: string;
        args: string;
    }) => Promise<ToolExecution>;
    /** 工具 schema（view_only 档剔除 run_command）。 */
    buildToolSchemas: (g: GroupRecord) => (typeof TOOL_SCHEMAS)[number][];
    /** 置 pendingConfirm 后无限等待，confirmCommand/stop/dispose 唤醒。 */
    requestConfirmation: (toolCallId: string, args: Record<string, unknown>) => Promise<boolean>;
    /** 唤醒确认等待（以拒绝放行；置空 pendingConfirm）。 */
    wakeConfirm: () => void;
    /** kill 正在执行的命令子进程。 */
    killChild: () => void;
}
/** 创建工具面。 */
export declare function createTools(core: HostState, touch: () => void): Tools;
