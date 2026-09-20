# dsh-group-chat

![模型群聊面板](assets/banner.png)

DSH Web GUI 的「模型群聊」插件：多模型角色群组对话面板。

兼容：`dsh >= 0.1.5-rc.1`（Web profile）

## 功能

- **群组管理**：新建、重命名、删除（至少保留一个群组；树节点与角色卡删除为原地确认——掀盖 + ✓/✗ 微面板）；左栏搜索框按群组名/会话名过滤
- **会话目录树**：每个群组内多个会话，左栏以「群组 → 会话」目录树呈现（展开/收起、新建、重命名、删除，至少保留一个会话）；消息挂在会话上。会话行名称前状态点对齐主会话列表：进行中 / 等待确认（命令闸门）/ 已完成 / 已出错；打开该会话即清「输出完毕」标记
- **角色-模型绑定**：群组内每个角色绑定一个 provider/model（可各不相同），配置人设、标识色、Temperature、深度思考开关、单独启用/停用；开启深度思考时可选**推理级别**（选项取自 DSH 当前模型设置的推理选项，未配置则用默认）；角色为群组级，全会话共享；配置走右侧滑出抽屉
- **群内共享对话**：所有消息对全群共享；发言以「【角色名】内容」形式注入每个角色的上下文（最近 40 条原文），流式显示
- **会话标题与主题**：会话头可手改主题。每轮结束后后台用 DSH 默认模型整理——占位名「新会话」生成一次「类别 emoji + 对象｜目标」，主题为演进式一句话摘要并注入后续角色上下文；手动改名/改主题后该字段不再自动改
- **会话约束备忘**：超过 40 条窗口后，被挤出的旧消息后台折成无主「已定 / 否决 / 未决」，作为「结论备忘」卡插在消息流折点；只读、空则不占位；清空消息时一并清除
- **消息渲染**：角色发言以 DSH 同款 markdown 渲染（标题、列表、表格、代码块、公式）；开启「深度思考」的角色发言带可折叠的思考行（折叠时显示摘要，展开看全文，流式时实时跟随）。用户/角色消息悬停可复制、可表情回应（6 emoji 弹层 + 上浮飘散，已回应胶囊常驻、点击取消；仅用户标注，不注入角色上下文）；发言失败保留为该角色失败卡（人话标题 + 可展开原文），常驻「复制 / 重试」（原地覆盖同一条；对话进行中或角色停用则不可重试）
- **清空会话**：会话头可清空本会话消息（含结论备忘），确认弹窗说明范围与不可恢复；对话进行中需先停止
- **多轮对话**：发送前用 chips 选择本轮参与角色；发送后按顺序自动多轮（1–10 轮，一轮 = 参与角色各说一次，轮数数字为滚轮动画），可随时停止；run 进行时消息流下方显示发言计划进度轨道（步点随发言推进交棒）。被 @ 的成员优先作为本轮参与角色
- **@点名**：裸 `@` 弹出成员候选（↑↓ 选择、Enter/Tab 插入）；`@` 后继续键入则在群工作区内检索文件，插入 `@path` 芯片（只写入路径，不把文件正文再灌进 prompt）
- **三区工作台**：左栏导航（搜索 + 目录树）；中栏会话流（色环头像 + 模型徽章 + 相对时间，贴底自动跟随、可回到底部）；右栏上下文（角色卡 + 工作区目录）。左右栏均可经接缝钮收起，窄面板时右栏覆盖式呈现
- **群组工作区目录**：每个群组指定一个目录（群级、全会话共享；无独立笔记或文件清单）。角色发言时自动读取目录**根下一层**文本文件（扩展名白名单、跳过隐藏项、最多 20 个；单文件 16k / 总量 48k 截断）注入全体角色 system 提示词的「共享资料」块；支持 `~`、绝对路径与相对 DSH 工作区根解析，右栏内置目录选择浏览器；未设置则不注入、不暴露工具
- **工具执行（docs/TOOLS.md）**：设置工作区后角色可调用 `read_file` / `list_dir` 主动查看工作区（realpath 硬边界，逃逸/软链越界一律拒绝）；**权限档位**于消息输入框下方左下角芯片切换（对齐主会话 `/permission` 三档：仅可查看 / 工作区内修改 / 完全权限；默认仅可查看，按群组记忆持久化）——工作区内修改档角色可请求执行 shell 命令（经 DSH `ctx.shell` 沙箱执行器：cwd 与沙箱策略均收紧到工作区、超时 120s），**每条命令在会话流内逐条确认**（允许 / 拒绝 / 停止，命令全文展示不截断）；完全权限档免确认直接执行（对齐 DSH danger-full-access 语义），切换时经主会话同款风险确认弹窗；工具调用以折叠行内嵌于角色消息（含耗时与状态），摘要注入后续发言上下文；不支持 tools 的模型自动降级为纯文本
- **设置启用**：设置页「模型群聊」分区提供启停开关（持久化于 settings.yaml）；关闭时隐藏侧边栏入口并中止进行中的对话

## 架构

dual-face 插件（对齐 [dsh-web](https://github.com/zhu1090093659/dsh-web) 家族的 dsh-usage 包形状）。包名 `@roaming-ai/dsh-group-chat`，bundle 行 `id: group-chat`（`cordis.patch.yml`）。

- **源码与构建**：TypeScript 源码于 `src/`（`core/` 纯逻辑、`host/`、`client/`、`shared/` 两边共用的路径语法）；`pnpm build` 先 `tsc` 产声明到 `lib/types/`，再 `tsdown`（`shared/tsdown.client.ts` 预设拷贝自 dsh-web）产出 `lib/index.js`（host ESM）+ `lib/client.js`（client 闭包工厂）
- **host**（`src/index.ts` + `src/host/`）：`inject = ['llm', 'fs', 'webServer', 'workspaceRegistry']`，设置命名空间 `group-chat`。同名包每进程至多挂一次（`mountOnce`）。组合根 `service.ts` 装配：
  - `state` — 群组/会话/角色/消息内存表 + run 运行态
  - `persistence/` — 会话级文件落盘与启动 hydrate
  - `materials/` — 工作区路径解析、根下一层文本注入、目录浏览、`@` 文件检索
  - `tools/` — `read_file` / `list_dir` / `run_command` 沙箱与确认闸门
  - `engine/` — `runLoop` 串行发言；设置工作区后进入「生成⇄工具」循环（只读工具自动执行，`run_command` 经 `confirmCommand` 逐条确认）；整次循环结束后后台 `retitle`（标题/主题）与 `fold`（约束备忘），立刻 idle、不占 run
  - `broadcast` — 全量快照 + SSE 120ms 节流
  - `api/` — HTTP 护栏与动作分发
- **HTTP**：
  - `GET /api/group-chat/state` — 全量快照
  - `POST /api/group-chat/action` — `{kind: mutate|send|retrySpeak|stop|confirmCommand|models|efforts|browse|fileSearch, ...}`（`retrySpeak` 原地覆盖失败卡；`mutate` 含 `reactMessage` 表情回应 toggle；`efforts` 查 provider/model 推理级别，60s 缓存；`browse` 为右栏目录浏览器；`fileSearch` 为输入框 @ 文件检索）；快照 `run` 暴露完整发言计划 `queue` + 游标 `queueIndex`（进度轨道数据面）
  - `GET /api/group-chat/events` — SSE，状态变化推送（120ms 节流）
  - 路由带回环 + 同源信任栏（`src/host/api/http.ts`，语义对齐 dsh-web 家族的 loopback fence）
- **client**（`src/client/`，`dsh.client` 模块，`inject = ['slots', 'settingsScope']`）：侧边栏 `sidebar.panellist` 入口 + `main` 键面板 + `settings.section` 设置页；经 fetch/SSE 访问 host API，按 `sessionId` 本地过滤渲染。UI 使用 DSW 原语（`@deepseek-ai/dsh-client-ui-primitives`，shell 静态种子模块）——Button/Input/Switch/Tooltip/统一描边图标与 `MarkdownText` 渲染器。未发送草稿按会话分槽、模块级跨挂载存活（主会话⇄群聊会卸载 composer）。

设计文档位于 `docs/`：`PRODUCT.md`（产品定义）、`DESIGN.md`（界面设计契约）、`PERSISTENCE.md`（持久化契约）、`TOOLS.md`（工具执行护栏）。

## 安装

通过官方 `dsh plugin` 装进 web profile。它在 `$DSH_HOME/profiles/web` 里转发给 pnpm；本包声明了 `dsh.bundle`，安装成功后会按真实包名 `@roaming-ai/dsh-group-chat` 自动写入 `dsh.profile.bundles`。不要手改 profile 的 `package.json` 或 `cordis.patch.yml`。

要求：已能运行 `dsh web`；Node `^22.19.0 || >=24`；PATH 上有 `pnpm`。

### 从 GitHub 安装

```sh
dsh plugin --profile web add github:localSummer/dsh-group-chat#main
```

等价：`dsh plugin --profile web add git+https://github.com/localSummer/dsh-group-chat.git`

本包的 `prepare` 会在安装时构建 `lib/`。pnpm 若拦截构建脚本，把提示的 key 写进 `$DSH_HOME/profiles/web/pnpm-workspace.yaml` 的 `allowBuilds`，再重跑同一条命令。

### 从本地检出安装（开发）

相对路径按**调用目录**锚定（`dsh plugin` 的 cwd 是 profile 目录，不要在 profile 里写 `.` / `../`）。

```sh
git clone https://github.com/localSummer/dsh-group-chat.git
cd dsh-group-chat
pnpm install && pnpm build
dsh plugin --profile web add link:$(pwd)
```

也可以给绝对路径：`dsh plugin --profile web add /path/to/dsh-group-chat`。

开发辅助（在本仓库内）：`pnpm watch`（tsdown 增量构建）、`pnpm test`、`pnpm typecheck`。`link:` 安装后改源码需重建产物；host 通常仍要重启 `dsh web`。

### 安装后

重启 `dsh web`（或 `dsh --profile web`）。用 dump 确认组合层已挂上：

```sh
dsh --profile web --dump-config
```

应出现 `# == @roaming-ai/dsh-group-chat` 层，且含 `id: group-chat` 行。侧边栏有「群聊」入口，设置页有「模型群聊」开关。

## 卸载

```sh
dsh plugin --profile web remove @roaming-ai/dsh-group-chat
```

然后重启 DSH。会话数据留在 `~/.dsh/storages/group-chat/`，卸载不会删除。

## 数据与持久化

会话级文件隔离，根目录 `~/.dsh/storages/group-chat/`（`DSH_GROUP_CHAT_STORE` 可覆盖；设计详见 `docs/PERSISTENCE.md`）：

```
~/.dsh/storages/group-chat/
├── .lock
├── ledger.json                         # schema: 3，纯清单；群组含 permissionTier
└── <group-id>/
    ├── workspaceDir                    # 纯文本一行路径
    ├── roles.json                      # schema: 1，该群角色（含 thinking / reasoningEffort）
    └── sessions/
        └── session-<uuid>.json         # schema: 1，自包含
```

- **ledger.json**（`schema: 3`）：群组 id/名/`permissionTier` + 会话 id 归属与顺序。v2 遗留 `allowCommands` 读取时迁移（true → 工作区内修改，false/无 → 仅可查看）
- **roles.json**：角色定义；`groupId` 由目录归属，不写入文件
- **session-\<uuid\>.json**：名称/主题/`createdAt`/消息；可选 `namePinned` / `topicPinned`、`constraints` / `constraintsUpToSeq`（空数组与水位 0 省略）、消息上的 `toolCalls` / `error` / `failedRoleId`
- 工作区文件内容不写入本目录；每次发言由 materials 实时读盘。全量保留，不裁剪
- 事件驱动写：变更按文件标脏，同一 tick 内合并；流式 partial 不落盘。会话文件与 `roles.json` 紧凑序列化，ledger pretty
- 原子写（`@deepseek-ai/dsh-atomic-write` 的 `writeFileAtomic`：wx 独占创建 + 随机后缀 tmp + rename，无 per-file fsync 对齐 DSH 基座标准；每个实际发生 rename 的目录一次 fsync）、单实例 `.lock`（PID 存活检测，崩溃残留自动清理）
- 写失败保留脏标记，下次 flush 自动重试；插件卸载时先唤醒确认等待并 kill 子进程，再等待挂起 flush 并最终落盘、释放锁（异步 disposer，cordis await）
- 损坏处理：单会话文件坏仅丢该会话消息（隔离 `.corrupt-*`，每前缀保留最近 1 份）；ledger 有 id 而文件缺失则空消息重建；`roles.json` 坏仅空该群角色；ledger 坏可扫描群组目录回收（仅丢群组名）；行级校验丢弃孤儿条目；hydrate 清 `.tmp-*`
- v1 双文件布局（ledger.json + messages.json）首次启动自动迁移（幂等；旧 messages.json 归档为 `.migrated-*`，从不删除）
- 锁不可得（双进程）时降级为内存态运行并告警
- 设置页的 `enabled` 开关经 settings 服务持久化于 `settings.yaml` 的 `group-chat` 段；进行中的对话运行态（run，含「输出完毕」标记）不持久化，重启即清
