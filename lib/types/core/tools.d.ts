/**
 * 工具执行护栏常量与 schema（TOOLS.md §1/§5；core 层纯数据）。
 * @module dsh-group-chat/core/tools
 */
/** run_command 超时。 */
export declare const RUN_CMD_TIMEOUT_MS = 120000;
/** read_file 单文件上限（超出截断）。 */
export declare const READ_FILE_MAX_BYTES: number;
/** 单条工具输出回注截断。 */
export declare const CMD_OUTPUT_MAX_CHARS = 8000;
/** 命令输出采集内存上限（1MB，超出弃置仅计数）。 */
export declare const CMD_CAPTURE_MAX_BYTES: number;
/** 单条发言工具结果累计预算（含地板成本）。 */
export declare const TOOL_RESULTS_TOTAL_MAX = 32000;
/** 每次调用地板成本（防空输出零累积）。 */
export declare const TOOL_FLOOR_COST_CHARS = 100;
/** 连续空输出/相同调用次数 → 强制收尾。 */
export declare const TOOL_REPEAT_LIMIT = 6;
/** transcript 中工具输出摘要截断。 */
export declare const TRANSCRIPT_TOOL_SUMMARY = 200;
/** 工具 schema（TOOLS.md §1）。 */
export declare const TOOL_SCHEMAS: readonly [{
    readonly name: "read_file";
    readonly description: "读取群组工作区目录内的一个文本文件内容（≤100KB，超出截断）";
    readonly parameters: {
        readonly type: "object";
        readonly properties: {
            readonly path: {
                readonly type: "string";
                readonly description: "相对工作区根的路径";
            };
        };
        readonly required: readonly ["path"];
    };
}, {
    readonly name: "list_dir";
    readonly description: "列出群组工作区目录内一个子目录的条目（名称/类型/大小）";
    readonly parameters: {
        readonly type: "object";
        readonly properties: {
            readonly path: {
                readonly type: "string";
                readonly description: "相对工作区根的路径，默认 \".\"";
            };
        };
    };
}, {
    readonly name: "run_command";
    readonly description: "在群组工作区目录内执行 shell 命令（如运行测试、git 操作；超时 120 秒；是否需要确认取决于群组权限档位）";
    readonly parameters: {
        readonly type: "object";
        readonly properties: {
            readonly command: {
                readonly type: "string";
            };
        };
        readonly required: readonly ["command"];
    };
}];
