# AGENTS.md — dsh-group-chat

DSH Web GUI 的「模型群聊」插件（`@roaming-ai/dsh-group-chat`）：多模型角色群组对话面板。本文件是本包的 Agent 工作入口；**不要把 `docs/` 全文贴进本文件**，需要细节时按下方索引按需打开对应文档。

工作目录以本包根为准（本文件所在目录），不要把上级 `~/.dsh` 工作区根当成这个包的工程根。

与 Agent 对话默认使用中文。UI 文案为中文。

---

## 工程形态

- **类型**：DSH dual-face 插件（host ESM + client 闭包工厂），不是独立 Web App。
- **包名 / bundle id**：`@roaming-ai/dsh-group-chat` / `group-chat`（`cordis.patch.yml`）。
- **兼容**：`dsh >= 0.1.5-rc.1`（web profile）；Node `^22.19.0 || >=24`；包管理器 pnpm。
- **数据模型**：Group 1..N Session；消息挂在会话上；角色与工作区目录挂在群组上。
- **设置命名空间**：`group-chat`（`settings.yaml` 的 `enabled` 开关）。

---

## 常用命令

在本包根执行：

| 命令 | 用途 |
|---|---|
| `pnpm test` | Vitest（`tests/**/*.spec.ts`、`src/**/*.test.ts`） |
| `pnpm typecheck` | `tsc --noEmit` + 测试 tsconfig |
| `pnpm build` | `tsc` 产 `lib/types/`，再 `tsdown` 产 `lib/index.js` + `lib/client.js` |
| `pnpm watch` | tsdown 增量构建 |
| `pnpm pack:check` | 构建后 dry-run 打包 |

改 host/client 行为后至少跑相关 spec + `pnpm typecheck`。`lib/` 是构建产物，不要手改。

---

## 目录与分层

```
src/
  core/          纯逻辑（类型、JSON 契约、状态派生、工具 schema）；无 cordis
  shared/        host/client 共用的路径语法（如 @ 文件提及）
  host/          宿主半：状态机、持久化、资料、工具、引擎、HTTP/SSE
    state.ts     内存表 + run
    broadcast.ts 全量快照 + SSE 120ms 节流
    persistence/ 会话级文件落盘 / hydrate
    materials/   工作区路径、根下一层文本注入、目录浏览、@ 文件检索
    tools/       read_file / list_dir / run_command 沙箱与确认闸门
    engine/      runLoop / speak、retitle、fold
    api/         回环护栏、路由、动作分发
  client/        浏览器半：槽位挂载、三区面板、DSW 原语
  index.ts       host 入口（inject: llm, fs, shell, webServer, workspaceRegistry）
  mount-once.ts  同名包每进程至多挂一次
tests/           按层冒烟；shell 用 tests/shell-stub.ts
docs/            设计权威来源（索引见下）
```

分层约束：

- `core/` 不依赖 cordis / Node 宿主服务；可测纯函数放这里。
- host 与 client **运行时不共享模块**（设置命名空间等字符串两边各写一份）；可共享的只有 `core/` 与 `shared/`。
- 每层一目录 + `index.ts` barrel（对齐现有 host/client 结构）；不要为一次性逻辑再抽抽象层。
- HTTP：`GET /api/group-chat/state`、`POST /api/group-chat/action`、`GET /api/group-chat/events`。客户端按 `sessionId` 本地过滤快照，不另开会话 API。

---

## 编码约定

- TypeScript ESM，`import` 带 `.ts` / `.tsx` 扩展名；`strict`。
- 最少代码：不实现需求外功能，不为一次性调用做抽象，不碰文档红线里「明确不做」的项。
- 只改必须改的文件；不要顺手格式化/重构相邻代码。
- UI：宿主原语优先（`@deepseek-ai/dsh-client-ui-primitives`）；颜色走 `--dsw-alias-*` + 灰阶回退；角色色只用于环/点（8 色 PALETTE）。
- 样式在 `src/client/lib/styles.ts` 内联 CSS 字符串。类名保持原样——尤其侧栏入口的 `newSession`，是跨插件识别导航点击的约定，哈希化会破坏它。
- 消息时间用绝对时钟（同日 `HH:mm` / 同年 `M月D日 HH:mm` / 跨年 `Y年M月D日 HH:mm`），不用相对时间。
- 破坏性操作要确认：树节点/角色卡用原地确认；清空会话用弹窗。
- 工具与持久化的安全/故障语义以对应 `docs/` 为准，不要另发明存储布局或沙箱策略。

---

## 文档索引（`docs/`）

权威设计在这些文件里。**本表只做路由，不复制正文。** 动手前按变更面打开对应文档；不要凭 README 或记忆覆盖文档里的已确认决策。

| 文档 | 权威范围 | 何时打开 |
|---|---|---|
| [docs/PRODUCT.md](docs/PRODUCT.md) | 产品定义、能力与约束、原则、品牌文案 | 改用户可见能力、边界、交互流程、设置启停 |
| [docs/DESIGN.md](docs/DESIGN.md) | 三区工作台视觉契约、令牌、组件、动效、Do/Don't | 改 UI / CSS / 布局 / 签名交互 |
| [docs/PERSISTENCE.md](docs/PERSISTENCE.md) | 会话级文件布局、原子写、hydrate、损坏隔离、迁移 | 改落盘、ledger/roles/session 字段、锁与 flush |
| [docs/TOOLS.md](docs/TOOLS.md) | 三件套工具、沙箱、确认闸门、agent loop、护栏常量 | 改 `read_file` / `list_dir` / `run_command`、权限档、回注 |
| [docs/REUSE-AUDIT.md](docs/REUSE-AUDIT.md) | 相对 DSH 基座的复用/搁置决策 | 改官方依赖替换、host 是否继续自建状态机 |

补充（不在 `docs/` 内，但是用户面入口）：[README.md](README.md) 安装、功能摘要、存储目录树。用户可见行为变了要一起核对。

代码 → 文档速查：

| 改动面 | 先读 |
|---|---|
| `src/client/**`、`styles.ts` | DESIGN.md；能力变化再读 PRODUCT.md |
| `src/host/persistence/**`、`src/core/json.ts` | PERSISTENCE.md |
| `src/host/tools/**`、`src/host/engine/conversation.ts`、`src/core/tools.ts` | TOOLS.md |
| `src/core/types.ts`、`src/host/state.ts`、`src/host/api/**` | PRODUCT.md + 被触及字段所属的 PERSISTENCE / TOOLS |
| `package.json` 的 DSH 依赖、`ctx.shell` / atomic-write 等替换 | REUSE-AUDIT.md |

各文档内部的「Over-engineering 红线 / 明确不做 / 搁置项」视为硬约束，实现时不得默默推翻。

---

## 代码变更后的文档同步（强制）

**每次改代码后，在收尾前必须评估文档是否仍与实现一致；需要更新时直接更新，不要留到「以后」。**

评估清单（有一项为是就改文档）：

1. 用户可见能力、约束、默认值、文案或流程变了 → `docs/PRODUCT.md`，并核对 `README.md` 功能摘要。
2. 布局、令牌用法、组件形态、动效、Do/Don't 变了 → `docs/DESIGN.md`。
3. 存储目录、schema、字段、flush/锁/迁移/损坏恢复变了 → `docs/PERSISTENCE.md`，并核对 `README.md`「数据与持久化」。
4. 工具集、沙箱、确认闸门、权限档、护栏常量、回注契约变了 → `docs/TOOLS.md`。
5. 与 DSH 官方包的复用/搁置结论变了 → `docs/REUSE-AUDIT.md`。
6. 新增了 `docs/` 下的文档，或某文档职责变了 → **同步更新本文件的文档索引表**（仍只写索引，不贴全文）。

怎么改：

- 只改被实现触及的段落；不重写无关章节，不把实现细节倾销进 PRODUCT。
- DESIGN 不记录产品事实（用户/用途/能力约束归 PRODUCT）；PRODUCT 不写视觉令牌。
- 文档与代码冲突时，以**已落地的代码 + 本次确认的决策**为准，把文档改到一致。
- 评估结论为「无需更新」时，不必为了同步而改文档。

---

## 明确不做（除非用户显式要求推翻）

来自现有文档红线，实现时默认遵守：

- 不把群聊重写成 DSH Agent/Session 编排；保持独立状态机 + 自有 HTTP/SSE。
- 不引入 WAL、SQLite、多实例文件锁、jsonl+zstd 等存储方案。
- 不对 `run_command` 做命令黑名单；不设正常工具调用次数上限；确认等待不设 TTL。
- 不并行跑多角色工具循环；不把共享资料做成独立笔记/文件清单。
- 不改 DSH 源码（纯外挂插件）。
- 不为静止表面加阴影；不把 PALETTE 用在环/点之外；不把表单塞进会话区。
