# dsh-group-chat 持久化方案 v2.1（会话级文件隔离）

> 经逐项 grill-me 确认、并经独立架构评审（B+ → 修订后达 A）后的最终方案。取代 v1「全局双文件」（ledger.json + messages.json 把全部消息塞进一个文件）的布局。本文件是持久化的唯一权威设计来源。
>
> **v2.1 评审修订**：修复 4 个 blocker（fsync 目标目录、写失败脏标记语义、文件缺失恢复路径、热重载交错），采纳 4 项改进（roles 随群组落盘、迁移幂等、紧凑序列化、隔离件限量）。

## 0. 决策总览

grill-me 确认项：

| # | 决策点 | 结论 |
|---|---|---|
| 1 | 隔离粒度 | 一个会话持久化为一个文件 |
| 2 | 文件名格式 | `session-<uuid>.json`（uuid 即会话 id） |
| 3 | 目录结构 | 每个群组一个目录，其下 `sessions/` 子目录放会话文件 |
| 4 | 工作区设置 | 群组目录根下的 `workspaceDir` 纯文本文件 |
| 5 | 原子写策略 | 群组目录级共享的 `atomicWriteGroup()`，按 flush 批量合并 |
| 6 | 损坏恢复 | 每个会话文件损坏时就地隔离 `.corrupt-*`，仅丢该会话消息 |
| 7 | 客户端读取 | 不新增 API：全量快照 + 客户端按 `sessionId` 本地过滤 |
| 8 | 会话文件结构 | 自包含完整版（schema/savedAt/id/name/groupId/topic/createdAt/messages + 可选 namePinned/topicPinned，手动编辑标记=true 时写入，自动整理跳过该字段） |
| 9 | setWorkspaceDir | 仅更新值，无额外处理 |
| 10 | messages 字段 | 推荐结构（对标 DSH 本地会话 session.v3 的消息形态） |

评审修订项：

| # | 决策点 | 结论 |
|---|---|---|
| 11 | 角色存储 | 每群组 `<group>/roles.json`（消除 persona 留在 ledger 单点的不对称） |
| 12 | 写失败语义 | flush 失败保留脏标记，下次 flush 重试（不继承 v1「先清脏再写」的静默丢数据模式） |
| 13 | fsync 目标 | 对每个实际发生 rename 的目录分别 fsync（sessions/ 与群组根不可混用） |
| 14 | 热重载顺序 | dispose = 同步最终 flush → release 锁 → 置空 store |

## 1. 设计目标

1. **一个会话 = 一个持久化文件**：会话数据自成一体，可独立备份/迁移/恢复
2. **一个群组 = 一个目录**：群组与会话的隔离边界在文件系统层面直接可见
3. 会话文件自包含，对齐 DSH 本地会话文件（`session.v3.jsonl.zstd`）的自包含思想
4. 保留 v1 既有承诺：原子写、单实例锁、损坏隔离、schema 版本字段、锁不可得降级内存态运行
5. **爆炸半径对称**（v2.1）：任何单文件损坏只影响其承载的最小单元（单会话消息 / 单群角色 / 群组名），不放大到全库

## 2. 目录结构

```
~/.dsh/storages/group-chat/                          # STORE_DIR（DSH_GROUP_CHAT_STORE 可覆盖，沿用 v1）
├── .lock                                            # 单实例锁（PID 存活检测，沿用 v1）
├── ledger.json                                      # 群组/会话清单（schema: 2，纯清单）
└── <group-id>/                                      # 每个群组一个目录（目录名 = 群组 id）
    ├── workspaceDir                                 # 群组工作区目录设置（纯文本一行路径）
    ├── roles.json                                   # 该群组的角色定义（schema: 1）
    └── sessions/
        ├── session-<uuid>.json                     # 一个会话一个文件
        └── session-<uuid>.json.corrupt-<ts>-<pid>   # 损坏隔离副本（就地 rename，限量保留）
```

- **uuid 即会话 id**：新建会话用 `randomUUID()` 生成，取代 v1 的 `sess-N` 自增 id；消息 id 沿用 `msg-N`，角色 id 沿用 `role-N` 自增
- `workspaceDir` 为纯文本文件，内容为路径字符串（一行，无 JSON 包裹）

## 3. 文件内容

### 3.1 ledger.json（schema: 2）——纯清单

单一事实来源仅限**清单与顺序**：群组（id + 名）、每个群组拥有的会话（id 归属 + 顺序）。**角色、会话的 name/topic/createdAt 均不存这里**（分别存 roles.json 与会话文件，避免双写漂移）：

```json
{
  "schema": 2,
  "savedAt": 173xxxx,
  "groups":   [ { "id": "grp-1", "name": "默认群组" } ],
  "sessions": [ { "id": "<uuid>", "groupId": "grp-1" } ]
}
```

- 会话顺序 = `sessions` 数组顺序（目录树顺序）
- 写 ledger 的操作：建群/删群/改群组名、建会话/删会话；改角色 → 写该群 `roles.json`；改会话名/主题/清空消息 → 写会话文件

### 3.2 roles.json（schema: 1）——群组级角色定义

```json
{
  "schema": 1,
  "savedAt": 173xxxx,
  "roles": [
    { "id": "role-1", "name": "产品经理", "color": "#5b8def", "persona": "…",
      "provider": "…", "model": "…", "temperature": 0.7, "enabled": true, "thinking": false }
  ]
}
```

- 角色天然按群组划分（v1 数据模型即如此），落盘位置与之对齐；`groupId` 字段不再需要（目录即归属）
- 群组建群时若无角色 → 不写该文件（视为空角色列表）

### 3.3 session-\<uuid\>.json（会话文件，自包含）

```json
{
  "schema": 1,
  "savedAt": 173xxxx,
  "id": "3f2b8c1e-…",
  "name": "会话 1",
  "groupId": "grp-1",
  "topic": "会话主题",
  "createdAt": 173xxxx,
  "messages": [
    {
      "id": "msg-abc123",
      "speaker": "user",
      "text": "用户输入或角色发言内容",
      "model": "deepseek/deepseek-chat",
      "ts": 173xxxx,
      "seq": 1,
      "reasoning": "思考过程",
      "reasoningFull": "完整思考",
      "thinkingSummary": "思考摘要"
    }
  ]
}
```

消息对象字段（最终确认）：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✓ | `msg-N`（沿用自增） |
| `speaker` | string | ✓ | `user` / `system` / 角色 id |
| `text` | string | ✓ | 正文 |
| `model` | string | ✗ | 角色消息为 `provider / model`；用户/系统消息省略 |
| `ts` | number | ✓ | 毫秒时间戳 |
| `seq` | number | ✓ | 会话内序号（从 1 递增） |
| `reasoning` | string | ✗ | 思考过程；无则整个字段省略（不写 null） |
| `reasoningFull` | string | ✗ | 完整思考；省略同上 |
| `thinkingSummary` | string | ✗ | 思考摘要；省略同上 |

实现注意：

- 可选字段「无则省略」，不写 `null`（对齐 v1 的 undefined 序列化行为）
- v1 的 `error: true`（系统错误行）不在确认结构内：作为兼容扩展字段保留（系统错误行 `speaker:"system"` + `error:true`，落盘保留该字段以不丢错误语义；读取时容忍缺失）

### 3.4 workspaceDir（群组工作区目录设置）

内容为一行路径文本，如 `/home/xxx/projects/my-repo`。hydrate 时逐群组读入；`setWorkspaceDir` 时原子重写该文件并更新内存态——不做任何其他处理（如移动旧会话文件）。

## 4. 原子写策略（atomicWriteGroup）

沿用 v1 的 `tmp + fsync + rename` 原子写原语，升级为「按群组目录共享、按 flush 批量」：

1. **脏标记按文件记**：消息落盘/会话元数据变更 → 标脏该会话文件；角色变更 → 标脏该群 `roles.json`；清单变更 → 标脏 ledger。同一 tick 内多次变更合并为一次写（沿用 v1 事件驱动 + microtask 合并）
2. **flush 时调用共享方法 `atomicWriteGroup(groupDir, files)`**：
   - 对目录下每个脏文件依次执行：写 `<file>.tmp-<pid>` → `fsync` → `chmod 600` → `rename`
   - **fsync 每个实际发生 rename 的目录**（v2.1 修复）：会话文件 rename 发生在 `<group>/sessions/` 内 → fsync `sessions/`；`workspaceDir`/`roles.json` 的 rename → fsync 群组根；ledger → fsync STORE 根。同一目录内 N 个 rename 合并为该目录一次 fsync——批量共享优化的落点是「每目录一次」，不是「每群组一次」
3. **序列化格式**（v2.1）：会话文件与 `roles.json` 紧凑序列化（`JSON.stringify(doc)`，不 pretty-print，省 10-20% 体积与写放大）；`ledger.json` 保留 pretty（小文件、便于人工检查）
4. **写失败保留脏标记**（v2.1 修复，不继承 v1「先清脏再写」）：flush 中任一文件写抛异常 → 该文件脏标记保留，console.error 记录，下次任何触发点重试写（全量快照重写模型下零成本）；同 flush 中其余文件照常写
5. 流式 partial 不落盘（沿用 v1：整条消息 append 完成后才标脏）

### 卸载/热重载顺序（v2.1 修复）

`ctx.effect` 清理函数按以下顺序执行，消除 v1「先置 store=null、在途 flush 抛 TypeError 丢待写数据」的交错窗口：

1. **同步执行最终 flush**：把当前全部脏标记写完（不再走 microtask 调度）
2. `store.release()` 释放锁
3. `store = null`

此后任何迟到的 flush 调用先检查 `store === null` 直接返回，不抛异常、不丢已合并变更。

## 5. 损坏恢复

- **会话文件损坏**：JSON 解析失败 → rename 为 `session-<uuid>.json.corrupt-<ts>-<pid>` 就地隔离 → 该会话以空消息重建。爆炸半径 = 单个会话的消息（v1 是 messages.json 坏丢全部会话消息，v2 显著缩小）
- **ledger 有会话 id 但文件缺失**（含用户手删文件，v2.1 补齐）：按空消息会话重建，console 单行提示；不隔离、不刷屏告警
- **roles.json 损坏**（v2.1）：该群组角色空重建 + 告警，爆炸半径 = 单群角色
- **ledger.json 损坏**：隔离后空态重建；群组目录仍在，hydrate 扫描目录回收群组/角色/会话文件（按目录归属），仅丢群组名
- **孤儿文件**：`sessions/` 下文件名不符合 `session-<uuid>.json` 模式的忽略；文件内 `groupId` 与所在目录不符的以目录归属为准（行级校验丢弃无法解析的条目，沿用 v1）
- **残留清理**（v2.1）：hydrate 时删除各目录的 `.tmp-*` 半成品；`.corrupt-*` 每个文件前缀只保留最近 1 份，更早的在 hydrate 时删除
- **workspaceDir 损坏/缺失**：视为空设置
- **锁不可得**（双进程）：降级内存态运行并 console 告警（沿用 v1）

## 6. 客户端接口（不变）

不新增按会话的 API。浏览器半继续用：

- `GET /api/group-chat/state` 全量快照
- `POST /api/group-chat/action`（mutate/send/stop/models/browse）
- `GET /api/group-chat/events` SSE

客户端本地按 `sessionId` 过滤渲染单会话消息。隔离发生在存储层，对浏览器半完全透明。

（持久化写失败的 UI 可见告警为编码阶段可选项，见 §11 未决项。）

## 7. hydrate（启动恢复）

1. 获取 `.lock`（PID 存活检测，沿用 v1）
2. 读 ledger.json（schema 2）→ 群组/会话清单
3. 清理各目录 `.tmp-*` 残留；`.corrupt-*` 限量清理（每前缀保留最近 1 份）
4. 逐群组读 `workspaceDir`、`roles.json`
5. 逐会话读 `<group-id>/sessions/session-<uuid>.json` → messages Map + `sess.messageIds`（按文件内数组顺序）；**ledger 有 id 而文件缺失 → 空消息重建**
6. 空群补会话、全空建默认群组（沿用 v1 规则：至少一个群组、每群至少一个会话）
7. `idSeq` 恢复：扫描 `roles.json`（`role-N`）与会话文件（`msg-N`）取 max（会话 id 已改用 uuid，不再参与自增序号）
8. hydrate 补建的默认会话/群组立即落盘（保证 ledger 与会话文件的引用一致，避免下次启动误报「文件缺失」）

## 8. 迁移（v1 → v2.1，一次性，幂等）

启动时在锁保护下检测到 v1 布局（STORE 根存在 `messages.json`）即执行：

1. **先清半成品**（v2.1）：若群组 `sessions/` 已有上次迁移中断的残留文件，而 v1 `messages.json` 仍在（事实源未动，安全）→ 先清空各群组 `sessions/` 与 `roles.json`，保证重试幂等、孤儿不累积
2. 读 v1 ledger.json（schema 1）+ messages.json
3. 按 `sessionId` 把 messages.json 拆分；每个会话生成新 uuid，写 `<group-id>/sessions/session-<uuid>.json`（紧凑序列化；name/topic/createdAt/messages 原文保留）
4. v1 的角色按 `groupId` 分组写入各 `<group>/roles.json`
5. 每个群组把 v1 的 `group.workspaceDir` 写入其目录下 `workspaceDir` 文件
6. 写新 ledger.json（schema 2，纯清单：剔除角色、剔除会话明细字段）
7. 旧 `messages.json` rename 为 `messages.json.migrated-<ts>` 保留兜底（**从不删除**，无永久丢失窗口）
8. 中途失败：保持 v1 文件原样，下次启动重试（重试从第 1 步重新开始，幂等）

## 9. 验证清单（实现完成的判定标准）

- [ ] 双群组各两会话发消息后：`<g1>/sessions/` 与 `<g2>/sessions/` 各自只含本群会话文件；任一文件内无跨群/跨会话消息
- [ ] 重启（重新 apply）后：消息/主题/会话名/工作区目录设置/角色完整恢复
- [ ] 手工损坏单个会话文件 → 重启后仅该会话消息丢失，其余会话与全部配置完好
- [ ] 手工删除单个会话文件 → 重启后该会话空消息重建，不产生告警风暴
- [ ] 手工损坏某群 roles.json → 仅该群角色丢失，其余群与全部会话完好
- [ ] 删除会话 → 对应 `session-<uuid>.json` 清理；删除群组 → 群组目录清理；删除/编辑角色 → 仅该群 `roles.json` 重写
- [ ] flush 写失败（模拟磁盘满/只读）后再次触发变更：脏文件在下次 flush 补写成功，不静默丢失
- [ ] 热重载（dispose）时有在途脏标记：同步最终 flush 完成后再释放锁，无 TypeError、无丢写
- [ ] 断电模拟：rename 后、目录 fsync 前 crash → 重启不丢文件（fsync 目标为实际发生 rename 的目录）
- [ ] 迁移中断后重试 → 幂等完成，无孤儿会话文件累积
- [ ] `DSH_GROUP_CHAT_STORE` 指向临时目录的 Host 半冒烟测试通过
- [ ] v1 数据迁移：旧 messages.json 正确拆分到各会话文件、角色正确分组到各群 roles.json

## 10. Over-engineering 红线（评审确认，明确不做）

WAL/预写日志、双副本 ledger、校验和链、SQLite/LMDB 嵌入库、为对标 DSH session.v3 改 jsonl+zstd、跨平台文件锁/锁等待队列、多版本快照/自动云备份。`tmp+fsync+rename + .migrated/.corrupt` 兜底已覆盖本场景（单机、单用户、低频写、千级消息量）的全部故障模型；写放大量化（单会话 2000 条 × 4KB ≈ 8MB 终态、累计 ~8GB）占 SSD TBW <0.01%，无需优化。

## 11. 与既有文档的关系 / 未决项

实现时需同步更新 `README.md`「数据与持久化」与 `PRODUCT.md` 能力条目（双文件 → 会话级文件布局）。

未决（编码时再定，均不改变本方案的存储布局）：

- 持久化写失败是否向 UI 推可见告警（涉及 client.js 改动；磁盘满是最可能真实诱因）
- flush 失败的重试策略（立即随下次变更重试 vs 简单退避定时重试）
