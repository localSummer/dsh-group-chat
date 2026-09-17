# dsh-group-chat

DSH Web GUI 的「模型群聊」插件：多模型角色群组对话面板。

## 功能

- **群组管理**：新建、重命名、删除（至少保留一个群组）；左栏搜索框按群组名/会话名过滤
- **会话目录树**：每个群组内多个会话，左栏以「群组 → 会话」目录树呈现（展开/收起、新建、重命名、删除）；消息挂在会话上，会话各有主题
- **角色-模型绑定**：群组内每个角色绑定一个 provider/model（可各不相同），配置人设、标识色、Temperature、深度思考开关；角色为群组级，全会话共享；配置走右侧滑出抽屉
- **群内共享对话**：所有消息对全群共享；发言以「【角色名】内容」形式注入每个角色的上下文，流式显示
- **消息渲染**：角色发言以宿主同款 markdown 渲染（标题、列表、表格、代码块、公式）；开启「深度思考」的角色发言带可折叠的思考行（折叠时显示摘要，展开看全文，流式时实时跟随）
- **多轮对话**：发送消息后选择参与角色按顺序自动多轮对话（1–10 轮），可随时停止
- **@成员点名**：输入框键入 @ 弹出成员候选（↑↓ 选择、Enter/Tab 插入、Esc 关闭）；被 @ 的成员优先作为本轮参与角色
- **三区工作台**：左栏导航（搜索 + 目录树）；中栏会话流（色环头像 + 模型徽章 + 时间，贴底自动跟随、可回到底部）；右栏上下文（角色卡 + 工作区目录），可一键收起，窄面板时覆盖式呈现
- **群组工作区目录**：每个群组指定一个目录，发送时自动读取目录内文本文件（扩展名白名单、跳过隐藏项、最多 20 个）注入全体角色上下文；支持 `~`、绝对路径与工作区相对路径（按各工作区根依次解析），右栏内置目录选择浏览器
- **设置启用**：设置页「模型群聊」分区提供启停开关（持久化于 settings.yaml）；关闭时隐藏侧边栏入口并中止进行中的对话

## 架构

双平面插件（参考 dsh-task-board 模式）：

- **Host 半**（`index.mjs`，host 进程组合插件）：群组/会话/角色/资料/消息内存状态机；群组与会话增删改；角色发言经 `llm` 服务按绑定路由流式生成；资料经 `fs` 服务读取；经 `webServer` 暴露：
  - `GET /api/group-chat/state` — 全量快照
  - `POST /api/group-chat/action` — `{kind: mutate|send|stop|models|preview, ...}`
  - `GET /api/group-chat/events` — SSE，状态变化推送（120ms 节流）
  - 路由带回环 + 同源信任栏（参考 dsh-task-board 的 loopback guard）
- **浏览器半**（`client.js`，`dsh.client` 模块）：侧边栏 `sidebar.panellist` 入口 + `main` 键面板 + `settings.section` 设置页；经 fetch/SSE 访问 Host API；UI 使用宿主 DSW 原语（`@deepseek-ai/dsh-client-ui-primitives`，shell 静态种子模块）——Button/Input/Switch/Tooltip/统一描边图标与 `MarkdownText` 渲染器

## 安装（本 profile）

`package.json` 的 `dependencies` 已含 `"dsh-group-chat": "link:./plugins/dsh-group-chat"`，且 `dsh.profile.bundles` 已列 `dsh-group-chat`。修改后执行：

```bash
cd ~/.dsh/profiles/web && pnpm install
```

重启 `dsh web` 生效。

## 数据与持久化

- 会话级文件隔离持久化于 `~/.dsh/storages/group-chat/`（设计详见 `PERSISTENCE.md`；gitignore 已覆盖）：
  - `ledger.json` — 群组/会话清单（`schema: 2`，纯清单）
  - `<group-id>/roles.json` — 群组角色定义（`schema: 1`）
  - `<group-id>/workspaceDir` — 群组工作区目录设置（纯文本一行）
  - `<group-id>/sessions/session-<uuid>.json` — 一个会话一个文件（自包含名称/主题/创建时间/消息）
- 事件驱动写：变更按文件标脏，同一 tick 内合并，流式 partial 不落盘
- 原子写（tmp + fsync + rename，每个实际发生 rename 的目录一次 fsync）、单实例 `.lock`（PID 存活检测，崩溃残留自动清理）
- 写失败保留脏标记，下次 flush 自动重试；插件卸载时同步最终 flush 后再释放锁
- 损坏处理：单会话文件坏仅丢该会话消息（隔离 `.corrupt-*`，每前缀保留最近 1 份）；ledger 坏可扫描群组目录回收；行级校验丢弃孤儿条目
- v1 双文件布局（ledger.json + messages.json）首次启动自动迁移（幂等；旧 messages.json 归档为 `.migrated-*`，从不删除）
- 锁不可得（双进程）时降级为内存态运行并告警
- 设置页的 `enabled` 开关经 settings 服务持久化于 `settings.yaml`；进行中的对话运行态（run）不持久化
