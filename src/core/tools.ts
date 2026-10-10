/**
 * 工具执行护栏常量与 schema（TOOLS.md §1/§5；core 层纯数据）。
 * @module dsh-group-chat/core/tools
 */

// ---------- 工具执行护栏常量（TOOLS.md §5） ----------
/** run_command 超时。 */
export const RUN_CMD_TIMEOUT_MS = 120e3
/** read_file 单文件上限（超出截断）。 */
export const READ_FILE_MAX_BYTES = 100 * 1024
/** read_file 默认返回行数（按需窗口，不整文件灌入）。 */
export const READ_FILE_DEFAULT_LINES = 200
/** 单条工具输出回注截断。 */
export const CMD_OUTPUT_MAX_CHARS = 8e3
/** 命令输出采集内存上限（1MB，超出弃置仅计数）。 */
export const CMD_CAPTURE_MAX_BYTES = 1 << 20
/** 单条发言工具结果累计预算（含地板成本）。 */
export const TOOL_RESULTS_TOTAL_MAX = 32e3
/** 每次调用地板成本（防空输出零累积）。 */
export const TOOL_FLOOR_COST_CHARS = 100
/** 连续空输出/相同调用次数 → 强制收尾。 */
export const TOOL_REPEAT_LIMIT = 6
/** transcript 中工具输出摘要截断。 */
export const TRANSCRIPT_TOOL_SUMMARY = 200

/** 工具 schema（TOOLS.md §1）。 */
export const TOOL_SCHEMAS = [
  {
    name: 'read_file',
    description: '按需读取工作区内一个文本文件的片段（默认前 200 行，带行号；要后文再传 offset；单次不超过 8k 字符；超过 100KB 的文件先截断）。不要把目录里的文件逐个读完。',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '相对工作区根的路径' },
        offset: { type: 'number', description: '起始行号，从 1 开始，默认 1' },
        limit: { type: 'number', description: '读取行数，默认 200' },
      },
      required: ['path'],
    },
  },
  {
    name: 'list_dir',
    description: '列出群组工作区目录内一个子目录的条目（名称/类型/大小）',
    parameters: { type: 'object', properties: { path: { type: 'string', description: '相对工作区根的路径，默认 "."' } } },
  },
  {
    name: 'run_command',
    description: '在群组工作区目录内执行 shell 命令（如运行测试、git 操作；超时 120 秒；是否需要确认取决于群组权限档位）',
    parameters: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] },
  },
] as const
