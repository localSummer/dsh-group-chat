# dsh-group-chat 复用审计（REUSE-AUDIT）

> **v1.1**：§2.1 / §2.2 两项定案替换已实施（保持功能一致 + 异步化适配：flush 串行链 + 版本号脏标记防 await 期间重标丢失；dispose 链异步化，cordis await disposer；`RunState.childProc` → `commandAbort`）。测试适配：shell 桩（tests/shell-stub.ts）、dispose await、文件断言改轮询。相关文档同步：PERSISTENCE.md v2.2、TOOLS.md v1.2、README。
> **v1.0**：经逐项 grill-me 确认的 6 项决策。范围：审查 `src/host` + `src/core` 全量源码（~3400 行）与 `src/client` 结构（~3960 行），对照 DSH 基座实际挂载面——本插件运行的 web profile = `@deepseek-ai/dsh-base` + `@deepseek-ai/dsh-web-app`（见 `$DSH_HOME/profiles/web/package.json` 的 `dsh.profile.bundles`）——判断哪些自实现可以直接换成 DSH 官方依赖包。产出：**2 项定案的低成本替换**、**明确搁置的中档项**、**细节 nit 清单**。不做中档/架构级重构。

## 0. 决策总览（grill-me 确认项）

| # | 决策点 | 结论 |
|---|---|---|
| 1 | 产出目标 | 审计报告 + 低成本替换清单；中档（storage domain）与架构级（Agent/Session 编排）重构明确搁置 |
| 2 | 原子写 | `store.ts` 的 `atomicWrite` → `@deepseek-ai/dsh-atomic-write` 的 `writeFileAtomic`（§2.1） |
| 3 | `run_command` | spawn 自实现 → 注入 `ctx.shell` + per-call `sandboxPolicy`（§2.2） |
| 4 | 工具读取 | `tools.ts` 的 `read_file`/`list_dir` 保持 `node:fs`（fence + 截断一体，§3 搁置 + §5.2） |
| 5 | 目录浏览 | `materials.browse` 保持自实现（`ctx.directoryPicker` 的 native/browse 双态回退问题，§3） |
| 6 | 交付 | 本文档（`docs/REUSE-AUDIT.md`） |

## 1. 对照表：自实现 vs DSH 依赖包

匹配度：**高** = 语义同构可直接换；**中** = 需要适配或接受语义变化；**低** = 绑定 Session/Agent 生命周期，当前架构下接不进去；**已复用** = 插件已经在用。

| # | 插件自实现 | 规模 | DSH 对应物 | 匹配度 | 备注 |
|---|---|---|---|---|---|
| 1 | `store.ts` `atomicWrite`（tmp+fsync+rename） | ~30 行 | `@deepseek-ai/dsh-atomic-write`：`writeFileAtomic` + `withFileLock` | 高 | 定案替换（§2.1） |
| 2 | `persistence/` 整层（锁/脏标记/损坏隔离/v1 迁移） | 703 行 | `ctx.storage` + `storage-domain`（json 后端自带原子写+fsync dir+节流 write-behind；`session-projection-cache` 有先例） | 中 | 搁置（§3） |
| 3 | `tools.ts` realpath 硬边界 + `read_file`/`list_dir` | 194 行 | `fs` 服务（materials 层已在用）+ `tool-fs` + `sandbox-policy` | 中 | 搁置（§3）；`ctx.fs` 的 fence 钉在全局 workspaceRoot（`process.cwd()`），对任意位置的群工作区无约束力 |
| 4 | `run_command`（spawn bash + 120s 超时 + SIGKILL + 采集） | ~40 行 | `ctx.shell`（bash-sandbox 执行器，`ShellExecRequest` 支持 per-call `workdir`/`timeoutMs`/`stdoutMaxBytes`/`signal`/`sandboxPolicy`） | 高 | 定案替换（§2.2） |
| 5 | 确认闸门 `pendingConfirm`/`confirmSignal` | ~30 行 | `ctx.approval`（user-approval） | 低 | `ApprovalRequest` 强绑 `Agent` + Session 审计事件，面板 UI 接不进 |
| 6 | `conversation.ts` 生成⇄工具循环（streamRound/回注/wrapUp） | 395 行 | `dsh-agent-loop`（ReactLoopAgent） | 低 | 整循环绑定 Session 事件日志与 Agent 注册表 |
| 7 | `retitle.ts` 标题/主题整理 | 118 行 | `ctx.sessionTitle` | 低 | log/session-bound，吃任意转写；插件已复用 `purpose: 'session-title'` 语义 |
| 8 | `fold.ts` 窗口外约束折叠 | 99 行 | `compaction-basic` | 低 | session-bound |
| 9 | `http.ts` 回环信任栏 | 80 行 | `dsh-client-connection` trustedHosts 语义 | 语义对齐 | dsh-web 的 loopback.ts 未独立发布，只能抄语义（源码注释已声明对齐） |
| 10 | `broadcast.ts` SSE 节流 + client `EventSource`/fetch | 65+ | 无独立可复用物（connection 面向主会话 RPC） | — | — |
| 11 | materials 路径解析/文件注入/@检索 | 195 行 | `fs` 服务 + `@deepseek-ai/dsh-file-reference-local` 的 `WorkspaceFileSearch` | **已复用** | — |
| 12 | client 聊天 UI（Bubble/Composer/MessageFlow…） | ~4000 行 | `@deepseek-ai/dsh-client-ui-primitives`（Button/Input/Switch/Tooltip/`MarkdownText`） | **已复用** | `dsh-client-ui-chat` 组件主会话绑定，搬不动 |

**总判断**：凡是**无状态工具原语**（atomic-write、fs seam、file-reference、UI primitives），插件要么已复用、要么可以低成本换（本次定案 2 项）；凡是**绑定 Session/Agent 生命周期的服务**（approval、sessionTitle、compaction、agent-loop、sandbox-policy 全局根），插件因为选择了「独立状态机 + 自有 HTTP/SSE」这条路线而全部吃不到。真正能吃到它们的方式是把群聊重写成 Agent/Session 之上的编排（`@deepseek-ai/dsh-experimental-agent-team` 路线）——当前路线是有意选择：换来面板自由与对主会话零侵入。

## 2. 定案替换（低成本）

### 2.1 `atomicWrite` → `writeFileAtomic`

- **现状**（`src/host/persistence/store.ts`）：`open(tmp, 'w')` + 可预测后缀 `.tmp-<pid>` + 文件 fsync + `renameSync`；同步。
- **替换**：`writeFileAtomic(file, text, { mode: 0o600, dirMode: 0o700 })`（`@deepseek-ai/dsh-atomic-write`，零依赖包）。
- **得到**：
  - `wx` 独占创建——拒绝符号链接预置在 tmp 路径（现有 `open('w')` 会跟随）；
  - 随机后缀 tmp——消除可预测名竞争；
  - rename 替换的是符号链接目标本身而非穿透写入；
  - Windows `EACCES`/`EBUSY`/`EPERM` 有界重试。
- **失去**：per-file fsync——`dsh-atomic-write` 明确声明 crash durability 为 out of scope（DSH 全基座同标准）。断电可能丢最后一批 rename；进程崩溃不受影响（rename 进程内原子）。对聊天数据可接受，已确认。
- **保留**：
  - 批量目录 fsync（`fsyncDir`，调用侧职责不变）；
  - 单实例 `.lock`（PID 存活检测）——与 `withFileLock` 用途不同（那是 per-file RMW 跨进程序列化），**不引入** `withFileLock`。
- **适配点（主要成本）**：`writeFileAtomic` 是 **async**，而 `persistence.ts` 的 `flushNow()` 与卸载路径 `release()`（同步最终 flush 后释放锁）是同步链。需要：
  1. `flushNow` 改 async（脏标记清除移入写入成功后）；
  2. `service.dispose()` 的「最终 flush → release 锁」改为先等待 flush 完成的 async 链（cordis effect 清理支持 async disposer）；
  3. `store.ts` 的 `migrateV1`（构造期一次性同步迁移）保持同步自实现或改 async 初始化——建议迁移路径单独保留同步写法，避免 hydrate 时序复杂化。
- **依赖变更**：`dependencies` + `@deepseek-ai/dsh-atomic-write`。
- **文档联动**：`PERSISTENCE.md` v2.1 的「原子写 tmp+fsync+rename（每目录一次 fsync）」措辞更新为「`writeFileAtomic`（wx 独占创建 + 随机后缀 + rename；无 per-file fsync，对齐 DSH 基座标准；目录 fsync 保留批量执行）」。

### 2.2 `run_command` → `ctx.shell` + per-call `sandboxPolicy`

- **现状**（`src/host/tools/tools.ts`）：`spawn('bash', ['-c', command], { cwd: root })` + 120s `SIGKILL` + `run.childProc` 引用 + 采集上限/丢弃字节计数。
- **替换**：注入 `shell` 服务（web profile 已挂 `bash-sandbox`，注册为 `ctx.shell`；Windows 由 `pwsh-sandbox` 顶上）：

  ```ts
  const spec = ctx.shell.resolve({
    command,
    workdir: root,                      // per-call：群工作区根
    timeoutMs: 120_000,                 // 现 RUN_CMD_TIMEOUT_MS
    stdoutMaxBytes: CMD_CAPTURE_MAX_BYTES,
    sandboxPolicy: { mode: 'workspace-write', workspaceRoot: root }, // per-call 收紧到群工作区
    signal: abortController.signal,     // stop/dispose 时 abort()
  })
  const result = await ctx.shell.run(spec)
  ```

- **得到**：
  - **真正的 confinement**：per-call `sandboxPolicy` 把命令封在群工作区内（OS 级）——现有版本只固定 cwd，**无任何强制力**（命令可 `cd /` 逃逸）；
  - `AbortSignal` 替代 `run.childProc` 引用与手动 `SIGKILL`；
  - `CollectedOutput` 采集上限语义（对应丢弃字节计数）；
  - Windows 支持（现有 `spawn('bash')` 在 Windows 本就不可用）；
  - 删除 ~40 行 spawn/计时/kill 处理。
- **已知风险（已确认接受）**：sandbox runner 在异构环境失效时，前台命令抛 `SANDBOX_UNAVAILABLE`——今天能跑的命令可能跑不了。收益（强制 confinement + 免维护子进程细节）大于风险。
- **保留（不动）**：
  - 确认闸门（`pendingConfirm`/`confirmSignal` 三出口，`TOOLS.md` §确认等待）；
  - 权限档位映射（`view_only` 不暴露 `run_command` / `workspace_write` 逐条确认 / `full_access` 免确认）；
  - 输出二次截断（`CMD_OUTPUT_MAX_CHARS`）与错误文案。
- **依赖变更**：无新增包；`src/index.ts` 的 `inject` 数组加 `'shell'`。
- **文档联动**：`TOOLS.md` 决策 #3「`run_command` 仅锚定 cwd，命令内容不过滤」升级为「经 `ctx.shell` per-call sandboxPolicy 收紧到群工作区（workspace-write 语义），runner 失效时抛 `SANDBOX_UNAVAILABLE`」。

## 3. 明确搁置项（本次不做，附理由）

| 候选 | 搁置理由 |
|---|---|
| `persistence/` → `ctx.storage` domain（json 后端） | 换来 schema 校验 + 变更事件 + 单 open 强制 + 节流 write-behind；失去用户可见布局（一会话一文件）、单文件损坏只丢该会话的隔离粒度、v1 迁移、ledger pretty。数据搬进 backend 私有格式，需要完整迁移方案。`session-projection-cache` 有先例可抄，将来做中档重构时的首选。 |
| `tools.ts` 读取走 `ctx.fs` | fence（realpath 硬边界）与 100KB 截断是一体逻辑；`ctx.fs` fence 钉在全局 workspaceRoot 对群工作区无约束力，`readText` 无界。换了省不掉 fence 与截断，只多一层异步。见 §5.2。 |
| `conversation.ts` 循环 → `dsh-agent-loop` | 绑定 Session 事件日志与 Agent 注册表；群聊需要多角色轮转 + 自有消息表 + 失败卡重试语义。 |
| 确认闸门 → `ctx.approval` | `ApprovalRequest` 强绑 `Agent` 与会话审计日志；插件面板 UI + 自有 SSE 通道接不进去。 |
| `retitle` → `ctx.sessionTitle` | 服务 log/session-bound（吃 Session 的用户消息投影），不吃任意转写；插件已复用 `purpose: 'session-title'`（deepseek adapter 据此关思考、秒级返回）。 |
| `fold` → `compaction-basic` | session-bound。 |
| `materials.browse` → `ctx.directoryPicker`（browse 能力） | 语义几乎同构（列一层 + 祖先链 + 截断 + 错误码 + `createDirectory` 赠品）；但 web profile 的 `directory-picker-auto` 启动时在 native/browse 间二选一，选 native 时 browse 能力不存在，插件必须保留自己的列目录作回退——双路径维护不值当 ~40 行的收益。 |
| client transport → `dsh-client-connection` | connection 面向主会话 RPC 通道，插件自有路由 + SSE 是有意选择。 |

## 4. 已复用确认（无需动作）

- `llm` seam：`stream`/`GenerateOptions`/`Message` wire、`purpose: 'session-title'` 辅助调用语义、efforts 查询（60s 缓存）。
- `fs` seam（materials 层）：`resolve`/`stat`/`listDir`/`readText`/`processPath`。
- `@deepseek-ai/dsh-file-reference-local`：`WorkspaceFileSearch`（@ 文件检索）与 file-mention 语法（`shared/file-mention-grammar.ts` 对齐）。
- `@deepseek-ai/dsh-client-ui-primitives`（DSW）：Button/Input/Switch/Tooltip/统一描边图标/`MarkdownText`。
- `workspaceRegistry`（工作区根解析缓存）、`settings` 双面接入（`installSection`/`register` 两代 API 兼容）、`webServer` 路由注册、`mountOnce`（bundle 聚合与独立安装并存）。

## 5. 细节 nit 清单（仅记录，不动代码）

1. **错误契约字符串匹配**（`conversation.ts`）：`m.includes('UNSUPPORTED_REASONING_EFFORT')` 与 B2 降级的 `/tool/i` 正则——`TOOLS.md` v1.1 决策 #10 已评审接受（dsh-llm 当前无稳定错误码）。已知盲区：中文 failure 文本不含 "tool" 时降级不触发（行为 = 抛错成失败卡，可接受）。**跟踪点**：若 dsh-llm 将来暴露稳定 `code`，应换成 code 判定。
2. **fs seam 不一致**：materials 走 `ctx.fs`、tools 走 `node:fs`——同一插件两套读文件习语。本次保留（见 §3），若 dsh-fs 将来支持 per-target fence 或有界 `readText` 可重评。
3. **`run.partial` 复位分散**：`runLoop` 每角色开头、`writeFailure`、finally 各处手工清空——正确但易漏，将来加字段时注意同步清理。
4. **防御性冗余**（无害）：`conversation.ts` 在 `wsRoot === null` 时跳出工具回注循环，而 `buildToolSchemas` 此时必返回空数组不会产生 tool-call——双保险，保留。

## 6. 依赖变更汇总

| 位置 | 变更 |
|---|---|
| `package.json` `dependencies` | + `@deepseek-ai/dsh-atomic-write`（零依赖包） |
| `src/index.ts` `inject` | + `'shell'`（`ctx.shell` 由 web profile 的 `bash-sandbox` 提供；无新增包依赖） |
| `docs/PERSISTENCE.md` | 原子写措辞更新（§2.1） |
| `docs/TOOLS.md` | 决策 #3 升级为 sandboxPolicy 收紧（§2.2） |
