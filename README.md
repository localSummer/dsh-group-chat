# dsh-group-chat

DSH Web GUI 的「模型群聊」插件：多模型角色群组对话面板。

## 功能

- **角色-模型绑定**：群组内每个角色绑定一个 provider/model（可各不相同），配置人设、标识色、Temperature
- **群内共享对话**：所有消息对全群共享；发言以「【角色名】内容」形式注入每个角色的上下文，流式显示
- **多轮对话**：发送消息后选择参与角色按顺序自动多轮对话（1–10 轮），可随时停止
- **共享资料空间**：文本笔记 + 文件路径（发送时读取最新内容注入全体角色上下文，总量截断保护）
- **设置启用**：设置页「模型群聊」分区提供启停开关（持久化于 settings.yaml）；关闭时隐藏侧边栏入口并中止进行中的对话

## 架构

双平面插件（参考 dsh-task-board 模式）：

- **Host 半**（`index.mjs`，host 进程组合插件）：群组/角色/资料/消息内存状态机；角色发言经 `llm` 服务按绑定路由流式生成；资料经 `fs` 服务读取；经 `webServer` 暴露：
  - `GET /api/group-chat/state` — 全量快照
  - `POST /api/group-chat/action` — `{kind: mutate|send|stop|models|preview, ...}`
  - `GET /api/group-chat/events` — SSE，状态变化推送（120ms 节流）
  - 路由带回环 + 同源信任栏（参考 dsh-task-board 的 loopback guard）
- **浏览器半**（`client.js`，`dsh.client` 模块）：侧边栏 `sidebar.panellist` 入口 + `main` 键面板 + `settings.section` 设置页；经 fetch/SSE 访问 Host API

## 安装（本 profile）

`package.json` 的 `dependencies` 已含 `"dsh-group-chat": "link:./plugins/dsh-group-chat"`，且 `dsh.profile.bundles` 已列 `dsh-group-chat`。修改后执行：

```bash
cd ~/.dsh/profiles/web && pnpm install
```

重启 `dsh web` 生效。

## 数据与持久化

- 群聊数据（群组/角色/消息/资料）为**进程内存态**，重启 `dsh web` 后清空
- 设置页的 `enabled` 开关经 settings 服务持久化于 `settings.yaml`
