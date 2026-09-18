/**
 * 资料读取与路径解析：群组工作区目录 → 注入文件清单 + 目录浏览器。
 * 路径解析顺序：~ 展开到 home；绝对路径直用；相对路径先试各工作区根，
 * 再试 dsh web 进程 cwd。目录浏览器与资料读取共用同一套解析。
 * @module dsh-group-chat/host/materials
 */
import type { BrowseResult, GroupRecord } from '../../core/types.ts';
import type { HostState } from '../state.ts';
/** 资料面。 */
export interface Materials {
    /** 群组工作区目录 → 注入文件清单（dir 为解析后的展示路径）。 */
    loadWorkspaceFiles: (g: GroupRecord) => Promise<{
        dir: string;
        parts: {
            name: string;
            content: string;
            error?: string;
        }[];
    }>;
    /** 文件清单 → system 提示词内的「共享资料」块（单文件 16k / 总量 48k 截断）。 */
    materialBlock: (parts: {
        name: string;
        content: string;
        error?: string;
    }[], dir: string) => string;
    /** 目录浏览：返回文件+目录条目（绝对路径由 Host 解析，客户端不拼路径）。 */
    browse: (args: {
        path?: string;
    } | undefined) => Promise<BrowseResult>;
}
/** 创建资料面。 */
export declare function createMaterials(core: HostState): Materials;
