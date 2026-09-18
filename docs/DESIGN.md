---
name: 模型群聊（dsh-group-chat）
description: DSW 宿主世界内的三区工作台——导航 / 会话 / 上下文分权，角色色环是唯一个性源
colors:
  info-fill: "var(--dsw-alias-button-info-fill, #4f6ef7)"
  focus-brand: "var(--dsw-alias-brand-primary, var(--dsw-alias-state-business-primary, #4f6ef7))"
  error: "var(--dsw-alias-state-error-primary, #e5484d)"
  bg-base: "var(--dsw-alias-bg-base, transparent)"
  bg-layer-2: "var(--dsw-alias-bg-layer-2, transparent)"
  bg-layer-3: "var(--dsw-alias-bg-layer-3, rgba(128,128,128,.06))"
  bg-module: "var(--dsw-alias-bg-module-platform, rgba(128,128,128,.12))"
  border-l1: "var(--dsw-alias-border-l1, rgba(128,128,128,.2))"
  border-l2: "var(--dsw-alias-border-l2, rgba(128,128,128,.3))"
  border-l3: "var(--dsw-alias-border-l3, rgba(128,128,128,.4))"
  label-primary: "var(--dsw-alias-label-primary, inherit)"
  label-secondary: "var(--dsw-alias-label-secondary, inherit)"
  label-tertiary: "var(--dsw-alias-label-tertiary, inherit)"
  label-dimmed: "var(--dsw-alias-label-dimmed, rgba(128,128,128,.5))"
  label-on-info: "var(--dsw-alias-label-primary-foreground, #fff)"
  hover-fill: "var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.12))"
  active-fill: "var(--dsw-alias-interactive-bg-active, rgba(128,128,128,.18))"
  input-bg: "var(--dsw-specific-input-major, var(--dsw-alias-bg-layer-3, transparent))"
  scrollbar: "var(--dsw-alias-scrollbar-bg-l2, rgba(128,128,128,.35))"
  on-danger: "#ffffff"
  focus-fallback: "#4f6ef7"
  error-fallback: "#e5484d"
  role-blue: "#5b8def"
  role-green: "#22a06b"
  role-amber: "#e8912d"
  role-purple: "#c678dd"
  role-red: "#e05661"
  role-teal: "#56b6c2"
  role-olive: "#98c379"
  role-bronze: "#d19a66"
  role-fallback: "#888888"
typography:
  title:
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.4
  subtitle:
    fontSize: "14px"
    fontWeight: 600
  body:
    fontSize: "14px"
    lineHeight: 1.6
  control:
    fontSize: "13px"
  minor:
    fontSize: "12.5px"
  label:
    fontSize: "12px"
    fontWeight: 500
  caption:
    fontSize: "11.5px"
    lineHeight: 1.5
  micro:
    fontSize: "11px"
    fontWeight: 500
  micro-tiny:
    fontSize: "10.5px"
    fontWeight: 500
rounded:
  xs: "4px"
  sm: "5px"
  md: "6px"
  lg: "8px"
  xl: "10px"
  card: "12px"
  input-card: "22px"
  pill: "999px"
spacing:
  xs: "2px"
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  xxl: "16px"
  xxxl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.info-fill}"
    textColor: "{colors.label-on-info}"
    rounded: "{rounded.lg}"
  stop-button:
    backgroundColor: "{colors.error}"
    textColor: "{colors.on-danger}"
  participant-chip:
    backgroundColor: "transparent"
    textColor: "{colors.label-secondary}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
    typography: "{typography.label}"
  participant-chip-active:
    backgroundColor: "{colors.active-fill}"
    textColor: "{colors.label-primary}"
  role-card:
    backgroundColor: "{colors.bg-layer-3}"
    textColor: "{colors.label-primary}"
    rounded: "{rounded.card}"
    padding: "10px 12px"
  message-card:
    backgroundColor: "{colors.bg-layer-3}"
    textColor: "{colors.label-primary}"
    rounded: "{rounded.card}"
    padding: "10px 14px"
    typography: "{typography.body}"
  user-bubble:
    backgroundColor: "{colors.info-fill}"
    textColor: "{colors.label-on-info}"
    rounded: "{rounded.card}"
  session-row:
    backgroundColor: "transparent"
    textColor: "{colors.label-secondary}"
    rounded: "{rounded.md}"
    padding: "4px 8px"
    typography: "{typography.minor}"
  model-badge:
    backgroundColor: "{colors.bg-module}"
    textColor: "{colors.label-secondary}"
    rounded: "{rounded.pill}"
    typography: "{typography.micro}"
  mention-popup:
    backgroundColor: "{colors.bg-layer-3}"
    rounded: "{rounded.xl}"
    padding: "4px"
  settings-card:
    backgroundColor: "{colors.bg-layer-3}"
    rounded: "{rounded.card}"
    padding: "14px 16px"
---

# Design System: 模型群聊（dsh-group-chat）

<!-- impeccable:design-schema 1 -->

对已构建产物（`client.js` 内嵌 CSS/JSX）的事实记录；产品事实见 PRODUCT.md，此处不重复。本版取代重写前的两栏设计记录。

## Overview

**Creative North Star: 「三区工作台」**

导航 / 会话 / 上下文三区分权的工作台：左栏定位（搜索 + 群组→会话目录树），中栏阅读（以宿主同源的 MarkdownText 正文 + 思考折叠行为阅读中心），右栏管理（角色卡 + 工作区目录）。会话流是唯一的主舞台，发送是唯一的主操作（info 填充）；配置不挤进会话栏，阅读不被管理打断——这是对旧两栏「左栏过载」结构的直接否定。角色编辑走右侧滑出抽屉，进一步把表单从工作台上移开。

视觉世界完全继承宿主：颜色、边框、阴影一律走 DSW 别名令牌（`--dsw-alias-*`）带灰阶回退，明暗主题随宿主切换；交互控件优先取宿主原语（`@deepseek-ai/dsh-client-ui-primitives` 的 Button / Input / Switch / Tooltip / DisclosureRow / MarkdownText / 60+ 描边图标 / fileSizeText），插件自有 CSS 只覆盖原语管不到的部分——三区布局骨架、目录树、消息流、composer、抽屉、chips、文件浏览器。个性只来自一处：角色色环与色点（8 色 PALETTE）。密度偏高、克制、低强度；没有气泡墙，没有装饰性渐变，没有投影堆叠——深度靠分层底色 + 1px 边框，投影只给临时浮层。

命名签名交互是流式发言的「正在输入…」行 + 思考折叠实时摘要（对标宿主会话流的 ReasoningRow）。界面文案为中文。

**Key Characteristics:**

- 三区固定/流体的工作台骨架：左 232px（可收起）、右 304px（可收起）、中央流体，容器查询降级（≤880px 右栏覆盖式、≤640px 左栏 200px）
- DSW 令牌纪律：一切颜色经 `--dsw-alias-*` + 灰阶回退；PALETTE 8 色是仅有的字面色，且只用于角色环/点
- 宿主原语优先：Button / Input / Switch / Tooltip / DisclosureRow / MarkdownText / Icon*Outline 直接复用，自有 CSS 补足布局与定制件
- 分层不投影：静止表面零阴影，阴影只属于浮层（@弹层 / 回到底部药丸 / 抽屉 / 覆盖式右栏）与输入面豁免（composer 输入卡，宿主输入面语言）
- 行/卡二分：导航一律平铺行（圆角 6），卡片只承载内容单元（圆角 12）
- 微字号梯队承载身份信息（模型徽章、时间、尺寸），保持阅读列安静

## Colors

面板自身不定义任何色相——色相全部由宿主 DSW 主题令牌与 8 色 PALETTE 供给。

### Primary
- **Info 填充**（`var(--dsw-alias-button-info-fill, #4f6ef7)`）：发送主按钮、用户消息气泡、用户头像底。会话区里唯一的强色块， rarity 是设计点。
- **焦点品牌色**（`var(--dsw-alias-brand-primary, …#4f6ef7)`）：全部自有控件 `focus-visible` 的 2px 描边（offset 1px），回退链落到 state-business-primary。

### Secondary
- **错误色**（`var(--dsw-alias-state-error-primary, #e5484d)`）：停止按钮（自定义 danger 覆写）、错误文字、删除确认态的 danger 操作按钮、系统通知错误态、会话头「清空」按钮的 danger hover/active（淡红底 + 错误色文字，`color-mix` 10%/16%）；清空被拒（对话进行中）经宿主 Toast 原语提示。
- **输入焦点色**（`var(--dsw-alias-state-business-primary, #4f6ef7)`）：所有输入控件统一的 focus 边框——自有 input/select/textarea 的 focus 边框、宿主 P.Input 搜索框的 `:focus-within` 边框（`.dsgc-search:focus-within` 覆写，与面板一致而非宿主默认 brand 色）、主题输入框的下划线变体。

### Tertiary（角色色板，PALETTE 8 色）
- **群青 `#5b8def` / 松绿 `#22a06b` / 琥珀 `#e8912d` / 紫藤 `#c678dd` / 绯红 `#e05661` / 青瓷 `#56b6c2` / 橄榄 `#98c379` / 古铜 `#d19a66`**，无角色色时回退 **中性灰 `#888888`**。仅出现在：消息头像 2px 色环、角色卡 10px 色点、参与角色 chip 8px 色点、@弹层候选项色点、抽屉调色盘 18px 色点。不用于任何表面、文字或边框。

### Neutral
- **底色三层**：`bg-base`（面板根）/ `bg-layer-2`（凹陷面：抽屉、文件浏览器）/ `bg-layer-3`（标准卡片面：消息卡、角色卡、@弹层、输入框回退）。
- **模块底**（`bg-module-platform`）：徽章、中性头像、系统通知胶囊的底色。
- **边框三级**：`border-l1`（栏间 1px 分隔线、消息卡边框、会话列表左规线）/ `border-l2`（卡片与控件标准边框、思考体左规线）/ `border-l3`（无角色头像的默认 2px 环）。
- **文字三级**：`label-primary` / `label-secondary` / `label-tertiary`；`label-dimmed` 仅作卡片 hover 边框；`label-primary-foreground` 为 info 填充上的前景白。
- **交互底**：`interactive-bg-hover`（平铺行/操作钮 hover）与 `interactive-bg-active`（选中行、选中 chip）。
- **输入底**（`--dsw-specific-input-major`，回退 layer-3）与**滚动条**（`scrollbar-bg-l2`）。

### Named Rules
**唯一个性源规则。** 角色颜色只以环和点的形式出现（头像环、色点），永不染指文字色或边框。唯一例外：**@提及芯片**——角色身份在输入区内的直接引用，允许「色点 + 该色 color-mix 15% 淡底胶囊」，仍不染文字色、不做满饱和底、不进消息流渲染。其余任何屏里的彩色面积以个位数像素计。
**令牌纪律规则。** 每个颜色引用都是 `var(--dsw-alias-*, 灰阶回退)` 的完整对；PALETTE 8 色 + `#888` 回退 + danger 上的 `#fff` 是代码里仅有的字面色。新样式不得绕过这对结构。

## Typography

**Display Font:** 无——全部继承宿主字体栈（控件显式 `font:inherit`，插件不声明任何 font-family）。
**Body Font:** 宿主栈，根字号 14px（`var(--dsh-content-font-size, 14px)`）。
**Label/Mono Font:** 无独立字体；数字用 `font-variant-numeric: tabular-nums`（轮数计数器）。

**Character:** 窄梯、高密度：全部文字落在 10.5–15px 的八级微梯里，层级靠字重（600）而非字号跳变；身份类信息（模型、时间、文件尺寸）压到 11px 以下，把注意力让给正文。

### Hierarchy
- **Title**（600, 15px, 1.4）：设置页标题。
- **Subtitle**（600, 14px）：会话标题（max-width 30% 截断）、抽屉标题。
- **Body**（400, 14px, 1.6）：根字号、消息正文、群组行。
- **Control**（400, 13px）：输入框、select、textarea、搜索框、角色名、设置页描述。
- **Minor**（400, 12.5px）：会话行、重命名框、@候选、文件行、思考体（行高 1.7）。
- **Label**（500, 12px）：表单标签、chips、提示、区块头（600）、轮数。
- **Caption**（400, 11.5px, 1.5）：系统通知、思考摘要（44ch 截断）、角色人设（2 行钳制）。
- **Micro**（500, 11px, line-height 17）：角色卡模型徽章。
- **Micro-tiny**（500, 10.5px）：流内模型徽章（line-height 16）、相对时间、文件尺寸。

### Named Rules
**窄梯规则。** 不引入 15px 以上的字号；层级升级优先用 600 字重和颜色（secondary→primary），其次才是 +1px。徽章类永远 ≤11px。

## Layout

三区工作台（`.dsgc-root` 为 `container-type:inline-size` 容器，响应式全部走容器查询而非媒体查询）：

- **左导航 232px**（`flex:none`，右缘 1px `border-l1`，**可收起**——左接缝收合钮触发，收合动画与右栏同款配方）：搜索框（P.Input，13px）→ 目录树（`flex:1` 滚动）→「新建群组」（P.Button outline）。群组块间距 6px；群组行（继承 14px）展开后会话列表带上缘 4px 呼吸 + 1px `border-l1` 左规线 + 12px 缩进，会话行距 2px、行内边距 6px 8px（12.5px 字号、行高 1.5）。
- **中央会话区流体**（`flex:1;min-width:0;position:relative`）：会话头（12px 16px，标题 + 主题输入框 + 清空 ghost 钮——清空经确认弹窗（P.Modal：说明删除范围〔会话名 + 消息条数〕、不可恢复后果、不受影响项，busy 时禁用确认），收合控制不在头部，见接缝收合钮；主题输入框为透明无边框内联输入，hover 露出 border-b2 下划线、focus 变 business-primary 下划线——无方框 outline）→ 消息流（padding 20px 24px 16px，行距 16px，贴底跟随，离底 60px 即出「回到底部」浮动药丸，锚在 composer 上方 `bottom:calc(100% + 8px)`）→ composer（钉底，无分隔线 + padding 12px 16px 14px，列间 10px，输入卡见签名组件）。
- **右上下文栏 304px**（`flex:none`，左缘 1px `border-l1`，整体滚动）：「群成员」角色卡列 + 「工作区目录」（`.dsgc-wsrow` 弹性行：输入 flex:1 + min-width:0，按钮 flex:none + nowrap，杜绝「浏览」文字折行；内联文件浏览器）。
- **容器查询降级**：≤880px 右栏转绝对定位覆盖层（z-index 15，带投影与 `border-l2`）；≤640px 左栏收窄 200px、消息体 max-width 放宽到 88%（常态 76%）。
- **角色抽屉**：右侧滑出 380px（`max-width:calc(100% - 40px)`），覆盖在右栏之上（z-index 20）。
- **滚动容器**（7 处，统一 `scrollbar-width:thin` + `scrollbar` 色）：目录树、消息流、右栏、抽屉体、文件列表、@弹层、思考体。
- **@弹层**：钉在 composer 输入框正上方（`bottom:calc(100% + 6px)`），z-index 30，max-height 220px。

间距节奏：行内元素 2–8px，卡片内 7–14px，区块间 8–12px，栏 padding 10–12px；消息流留白最大（24px 横向）。

### Named Rules
**行/卡二分规则。** 导航与列表一律平铺行（无边框、圆角 6、hover 换底色）；卡片（圆角 12、边框、底色）只承载内容单元——角色卡、消息卡、设置卡。禁止给平铺行加边框或给卡片去掉边框。
**三区守恒规则。** 只有三个常驻区。新功能要么进右栏（管理类）、要么走抽屉/弹层（临时类），不得开辟第四栏。

## Elevation & Depth

分层不投影：静止表面靠三层底色（layer-2 凹陷 / layer-3 抬升）+ 1px 边框表达深度，宿主主题令牌保证明暗两态成立。投影是「临时浮层」与「输入面」的专属信号，浮层四处（方向一致向左或向下）+ 输入卡一处：

### Shadow Vocabulary
- **@弹层**（`var(--dsw-shadow-lv3, 0 8px 24px rgba(0,0,0,.18))`）：向下投，输入时的成员候选浮层。
- **回到底部药丸**（同 @弹层配方）：向下投，消息流离底时的浮动按钮。
- **接缝收合钮·左**（`3px 0 10px rgba(0,0,0,.07)`）：向右投，左接缝竖向页签；**接缝收合钮·右**（`-3px 0 10px rgba(0,0,0,.07)`）：向左投，右接缝竖向页签（镜像对）。
- **角色抽屉**（`-12px 0 32px rgba(0,0,0,.14)`）：向左投，380px 滑出面板。
- **覆盖式右栏**（`-12px 0 32px rgba(0,0,0,.16)`）：向左投，≤880px 容器下右栏的覆盖态。
- **输入卡（输入面豁免）**（`var(--dsw-elevation-soft, 0 1px 3px rgba(0,0,0,.08))`，描边色 `--dsw-elevation-stroke-color: border-l2`）：composer 输入卡的宿主输入面语言。

### Named Rules
**分层不投影规则（含输入面豁免）。** 静止表面（卡片、行、面板）零阴影；**唯一豁免是输入面**——composer 输入卡遵循宿主输入面语言（`--dsw-specific-input-major` 底 + `--dsw-elevation-soft` 软影 + 22px 圆角，与主会话 composer 卡同源），其余任何静止表面仍零阴影。需要阴影 = 你正在做一个浮层（弹层/抽屉/覆盖/浮动按钮），用完即走。

## Shapes

圆角随体量递增：操作钮 4px → 步进钮 5px → 平铺行/输入 6px → 面板与输入控件 8px → @弹层 10px → 内容卡 12px → 输入卡 22px（composer 输入卡，对标主会话）→ 身份徽章与 chips 999px 胶囊。圆是身份专属形状：头像（28px，2px 环）、角色色点（10px）、chip 色点（8px）、会话点（5px currentColor，opacity .45）、调色盘色点（18px）。思考体用 2px `border-l2` 左规线代替任何容器形状——「引文」而非「卡片」。用户气泡边框透明、行序反转（row-reverse），与角色卡形成方向对比。

## Components

### Buttons
宿主 P.Button 三变体 + 两处定制：**ghost**（聊天头「清空」、抽屉关闭、文件浏览器关闭）；**outline**（「新建群组」「浏览」上一步/主目录）；**primary**（「发送」「选定此目录」、抽屉「保存」，info 填充 + 前景白 + 600）。**停止按钮** = outline 基座 + 自定义 `.dsgc-stopbtn` 覆写（错误色底 + 白字 + 600，hover `brightness(1.08)`）。**回到底部药丸** = 自有 `.dsgc-tobtn`（实底 `bg-layer-3` + `border-l2` + 999px 胶囊 + `shadow-lv3`，图标 + 12px 文字，不用宿主变体——透明底 outline 会与消息内容相互透底）。尺寸走原语 `size:"sm"`。

### Seam handles（左右栏收合钮）
钉在会话区两缘的竖向页签（`position:absolute`，垂直居中 `translateY(-50%)`，24×56px）：**钮在哪一侧就控制哪一侧的面板**——位置即语义，取代原先挤在会话头部的两枚翻转同款图标钮。左钮 IconChevronLeftOutline14、右钮 IconChevronRightOutline14（16px 渲染，方向相反、各指其侧，不再用 scaleX 翻转）。半页签形状：靠接缝一侧无边框、另一侧 8px 圆角（左钮 `0 8px 8px 0`、右钮镜像）；实底 `bg-layer-3` + `border-l2` + 轻方向性软影（见影调词表）。z-index 14（低于 ≤880px 覆盖式右栏的 15——窄模式滑行时钮藏于面板下、到位后在接缝处露出）。状态经 `aria-expanded` + 动态 title/aria-label（收起/展开·其侧栏名）；hover 换 `hover-fill` 提色。

### Chips
参与角色 chip 为自有件：胶囊（999px）+ `border-l2` + 透明底 + 8px 角色色点，12px；选中态换 `active-fill` 底（边框不变）；hover 只提字色；对话中禁用（opacity .5）。被 @ 时 chips 让位给一行说明文字。

### Cards / Containers
内容卡统一语言：`bg-layer-3` + 1px `border-l2`（消息卡用 `border-l1`）+ 圆角 12 + `.16s` 边框/底色过渡，hover 边框 → `label-dimmed`。变体：角色卡（padding 10px 12px，头部 = 色点 + 名字 + Tooltip 包裹的启停 Switch；人设 2 行钳制；模型徽章 + 思考图标 + hover 显现的编辑/删除操作钮）、设置卡（`dgcs-card`，padding 14px 16px，横排文字 + P.Switch）。文件浏览器是凹陷变体：`bg-layer-2` + `border-l2` + 圆角 8。

### Inputs / Fields
- **自有控件**（input/select/textarea）：`input-bg` 底 + `border-l2`，圆角 8，13px，focus 边框 → 输入焦点色；表单字段 = 12px/500 标签 + 5px 间距。
- **搜索**：P.Input 带描边图标（IconSearchOutline16）。
- **Composer 输入**：卡内无边框 **contenteditable**（非受控——React 不管理其子节点；36px 起、自适应增高至 180px、左缩进 14px）。@成员 = 原子芯片（`.dsgc-chipin`：`contenteditable=false` + `draggable`，退格整删、`user-select:all`）；序列化契约：芯片展开回纯文本「@名字␠」、`<br>`→换行——**芯片=糖、正则=真**（参与判定与发送值仍由 mentionedRoles 正则对序列化文本承载，手打 @名字 与芯片等价）。行为：Enter 发送 / Shift+Enter `insertLineBreak` 换行（弹层开时亦然——换行后的 input 事件自然关弹层）/ 粘贴与拖放均强制 `text/plain`（`insertText`，拖放是粘贴之外的第二入口）/ IME 组合期只读不写 DOM（`isComposing` + keyCode 229 双守卫）；插入全程走 execCommand（`delete`/`insertHTML`/`insertText`）保 undo 栈，`insertHTML` 后选区经 `data-new` 标记营救（部分浏览器把选区落进 contenteditable=false 芯片内部，曾致空格丢失与光标不可见）；弹层失焦即关、候选索引按候选收缩钳制、芯片插入前校验选区落在输入区内、发送带在途锁；占位符 = 独立覆盖层 `.dsgc-ph`（`pointer-events:none`，对齐主会话——不用 ::before，生成内容会把聚焦光标顶到占位文字之后）。
- **安静输入**：会话主题框为无边框透明输入（secondary 色，focus 提为 primary）；目录树重命名为内联 mini 输入（12.5px，圆角 6）。

### Navigation
左侧目录树全平铺行：群组行（继承字号，选中仅 600 + primary，无底色）+ 会话行（12.5px / 行高 1.5，行距 2px、行内边距 6px 8px，5px 点，选中 = `active-fill` + 600）；群组块间距 6px，会话列表与群组行间 4px 呼吸；hover 换 `hover-fill`；`.12s` 过渡。折叠 chevron 旋转 -90°（`.16s ease`）。节点操作钮 hover 才显现；重命名走内联输入；删除 = 两次点击确认（第一次变 danger 红并提示「再次点击确认删除」）。「新会话」为弱化矮行（12px / 行高 1.5 / 内边距 5px 8px）。整行 `role="button"` + `tabIndex` + Enter/Space 键控。

### 消息流（签名组件）
角色消息 = 28px 圆头像（2px 角色色环，无角色时 `border-l3`/用户头像 info 填充透明环）+ 头部行（名字 600 + 模型徽章 10.5px + 相对时间）+ layer-3 卡内 MarkdownText（宿主同源渲染，labels 冻结对象：复制/已复制/脚注）。用户消息 = info 填充行反转气泡，纯文本 pre-wrap。系统通知 = 居中 `bg-module` 胶囊（11.5px，错误态换错误色文字）。**流式行**：时间槽显示「正在输入…」+ streaming MarkdownText（opacity .92）+ 运行中的思考折叠（摘要实时跟随最新一行）；首个 delta 到达前卡内渲染「思考中」占位行（ThinkRow 同语言：思考图标 + 次要色 12px + 三点交错呼吸 1.2s，`dsgc-dot-breathe`；深度思考模型首字节可能等数秒到数十秒，空白气泡会被感知为卡死）。空态 = 居中 40ch（20px 描边图标 50% 透明度 + 13px/600 标题 + 提示）。

### 思考折叠行（签名组件）
P.DisclosureRow 定制：12px 行（hover 换底），IconThinkOutline14 + 「思考」+ 折叠摘要（剥离 markdown 标记的纯文本，44ch 截断，11.5px）；展开体为 pre-wrap 纯文本 12.5px/1.7，左缘 2px `border-l2` 规线，max-height 320px 滚动。

### Composer（签名组件）
纵列：参与角色 chips 行（卡外，配置不入卡）→ **输入卡**（对标主会话 composer 卡：22px 圆角独立卡、`input-major` 实底、`elevation-soft` 软影【输入面豁免】、卡内无边框 textarea 36px 起自适应，左缩进 14px）→ 卡内底部**附件行**（权限芯片居左 + 轮数步进器 −/数字/+（数字 26px 宽 tabular-nums + 「轮」）紧邻 P.Button primary「发送」/ 覆写 danger「停止」，全部 white-space:nowrap——发送参数与主操作同组）。composer 区无 `border-top` 硬分隔，输入卡直接浮在消息流下方（上缘留 12px 呼吸）。@弹层（卡内锚定、向上溢出卡片）：layer-3 + `border-l2` + 圆角 10 + `shadow-lv3`，候选项 = 色点 + 名字（500）+ 模型（11px），键盘 ↑↓/Enter/Tab（Esc 不参与——输入法组合下行为不稳，明确不做）；Enter/Tab/点击候选 → 删除光标前 @词并插入**原子芯片**（候选钮 `mousedown` 阻止默认，保住输入区选区）；底部操作提示行。

### 角色抽屉
右侧滑出 380px：`bg-layer-2` + 左缘 `border-l2` + 向左投影 + `.18s ease-out` 入场动画（translateX 24px + 淡入）；头（标题 + ghost 关闭）/ 体（滚动，12px 间距表单：名称、标识色调色盘、人设 textarea、提供方/模型 select、温度、深度思考 P.Switch）/ 脚（取消 outline + 保存 primary）。Escape 关闭。

### 文件浏览器
右栏内联凹陷面板：路径行（11px 截断）+ 工具行（选定此目录 primary sm / 上一级 / 主目录 / 关闭）+ 列表（目录在前、名称带 `/` 后缀、隐藏项 opacity .55、文件行惰性无 hover、尺寸 10.5px 经 P.fileSizeText）。与目录树同一平铺行语言。

## Motion

动效只为反馈、状态与连续性服务；流式正文零逐帧动画（SSE 120ms 高频更新不叠加效果）。统一到达曲线 `cubic-bezier(0.16,1,.3,1)`，退场恒短于入场（ease-in 出）。

- **签名循环（唯一）**：`dsgc-presence` 1.8s ease-in-out infinite——正在流式发言的角色头像以 `--role-color`（color-mix 22%）呼吸 4px 光环；随 live 行卸载即停。
- **出现确认**（fade + 轻微位移）：消息 `.22s`（6px 上浮）、@弹层 `.16s`（4px）、回到底部 `.18s`（6px，保留 translateX(-50%) 定位）、思考正文 `.2s`（3px）、错误 `.18s` / 文件浏览器 `.2s` / 空状态 `.3s`（纯 fade）、系统消息 `.24s`（scale .96）。
- **布局连续性（唯一的 layout 动画，左右对称两处）**：左右栏折叠，同一配方。宽模式 `width →0` + opacity（开 `.28s` 曲线到 / 合 `.24s` ease-in），子元素固定宽防内容重排（左栏 212 / 右栏 280），`visibility` 延迟 `.22s` 切换（关闭时键盘焦点安全）；窄容器（≤880px）右栏覆盖层 `translateX` 滑行（开 `.3s` / 合 `.26s`），左栏在 ≤640px 下子元素改 `width:auto` 适配 200px 窄宽。**接缝收合钮随接缝滑行**：宽模式由布局驱动（中栏连续变宽，贴缘绝对定位的钮自动同步，无自有动画）；窄模式右钮以同曲线 `right` 过渡（`.3s`）跟踪覆盖层左缘。
- **抽屉**：入 `.22s`（32px 滑入 + 淡入）；出 `.14s` ease-in + `pointer-events:none`——取消/Esc 走 140ms 退场后卸载，保存成功为即时确认。
- **时长纪律**：微反馈 ≤150ms（色彩过渡 `.12/.16s` 沿用）→ 出现 160–240ms → 布局 260–300ms。
- **Reduced motion**：全部过渡与动画停用（含 presence 光环、右栏与抽屉），保留承载意义的颜色/透明度状态；加载旋转亦停。

## Do's and Don'ts

### Do:
- **Do** 原语优先：宿主有 Button/Input/Switch/Tooltip/DisclosureRow/MarkdownText/Icon*Outline 就直接用；自有 CSS 只写原语覆盖不到的布局与定制件。
- **Do** 每个颜色引用都带完整 `var(--dsw-alias-*, 灰阶回退)` 对，明暗主题自动成立。
- **Do** 角色颜色只画环和点；头像环 2px、角色点 10px、chip 点 8px。@提及芯片是唯一带色底的例外（色点 + 15% 淡底胶囊，见唯一个性源规则）。
- **Do** 响应式用容器查询（880px / 640px 两级），新面板不依赖视口媒体查询。
- **Do** 所有滚动容器给 `scrollbar-width:thin` + `scrollbar` 色；所有自有可交互控件给 `focus-visible` 2px 品牌描边 + offset 1px。
- **Do** 破坏性操作二次确认，两档形态：树删除用两次点击（第一次变 danger 红）；清空会话用确认弹窗（体量大且不可恢复，需说明范围与后果）。Esc 关闭临时层，键盘可达（Enter/Space/↑↓/Tab）。
- **Do** `prefers-reduced-motion:reduce` 下关闭全部过渡与动画（含 presence 光环、右栏折叠、抽屉与加载旋转）。
- **Do** 时间显示用相对时间（刚刚 / N 分钟前 / N 小时前 / M月D日）。

### Don't:
- **Don't** 在 PALETTE 之外引入字面色（danger 上的 `#fff` 与令牌回退值除外）；也不要把 PALETTE 用在环/点之外的任何地方。
- **Don't** 给静止表面加阴影——阴影只属于弹层/浮动按钮/抽屉/覆盖式右栏，以及输入面豁免（composer 输入卡的宿主输入面语言）。
- **Don't** 开辟第四栏或把表单塞进会话区；管理进右栏，临时走抽屉/弹层。
- **Don't** 使用 Unicode 图形符或伪造光标（如 `▍`）——图标一律取 Icon*Outline 原语，流式态用「正在输入…」时间槽 + opacity .92 表达。
- **Don't** 把侧边栏入口的对齐 hack（`panelRow :has(.dsgc-entryOverlay)` 系列规则与 `newSession` 类名钩子）复制到新表面——那是外壳插槽的度量对齐权宜，由 `client.js` 文件头注释持有，不属于本设计系统。
- **Don't** 在本文件记录产品事实（用户、用途、能力约束）——归 PRODUCT.md；设计文档只管视觉。
