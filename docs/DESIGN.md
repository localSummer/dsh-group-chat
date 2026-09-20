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

命名签名交互是流式发言的「深度求索...」行 + 思考折叠实时摘要（对标宿主会话流的 ReasoningRow）。界面文案为中文。

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
- **群青 `#5b8def` / 松绿 `#22a06b` / 琥珀 `#e8912d` / 紫藤 `#c678dd` / 绯红 `#e05661` / 青瓷 `#56b6c2` / 橄榄 `#98c379` / 古铜 `#d19a66`**，无角色色时回退 **中性灰 `#888888`**。仅出现在：消息头像 2px 色环、角色卡 10px 色点、参与角色 chip 8px 色点、@弹层候选项色点、抽屉调色盘 18px 色点、多轮进度轨道 6px 实心步点（当前步小条的 22%/65% 淡底与高光同源）。不用于任何表面、文字或边框。

### Neutral
- **底色三层**：`bg-base`（面板根）/ `bg-layer-2`（凹陷面：抽屉、文件浏览器）/ `bg-layer-3`（标准卡片面：消息卡、角色卡、@弹层、输入框回退）。
- **模块底**（`bg-module-platform`）：徽章、中性头像、系统通知胶囊的底色。
- **边框三级**：`border-l1`（栏间 1px 分隔线、消息卡边框、会话列表左规线）/ `border-l2`（卡片与控件标准边框、思考体左规线）/ `border-l3`（无角色头像的默认 2px 环）。
- **文字三级**：`label-primary` / `label-secondary` / `label-tertiary`；`label-dimmed` 仅作卡片 hover 边框；`label-primary-foreground` 为 info 填充上的前景白。
- **交互底**：`interactive-bg-hover`（平铺行/操作钮 hover）与 `interactive-bg-active`（选中行、选中 chip）。
- **输入底**（`--dsw-specific-input-major`，回退 layer-3）与**滚动条**（`scrollbar-bg-l2`）。

### Named Rules
**唯一个性源规则。** 角色颜色只以环和点的形式出现（头像环、色点），永不染指文字色或边框。两处输入区例外：**@角色芯片**——角色身份在输入区内的直接引用，允许「色点 + 该色 color-mix 15% 淡底胶囊」，仍不染文字色、不做满饱和底、不进消息流渲染；**@文件芯片**——中性淡底（`--dsw-static-neutral-bluish-300` 18%），目录芯片淡琥珀底（`--dsw-static-amber-400` 18%）+ FileTypeIcon，与角色 PALETTE 分家。其余任何屏里的彩色面积以个位数像素计。
**令牌纪律规则。** 每个颜色引用都是 `var(--dsw-alias-*, 灰阶回退)` 的完整对；PALETTE 8 色 + `#888` 回退 + danger 上的 `#fff` 是代码里仅有的字面色。新样式不得绕过这对结构。**例外（记录在案）**：流式「深度求索...」微光扫动使用宿主静态品牌令牌 `--dsw-static-deepseek-500/200`（回退 `#4176e6`/`#d3e2ff`）——对标宿主 TurnStatus「深度求索中...」的品牌签名动画，非主题别名（品牌色不随明暗主题反转）。

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
- **Caption**（400, 11.5px, 1.5）：系统通知、思考摘要（44ch 截断）、角色人设（2 行钳制）、结论备忘说明与条目。
- **Micro**（500, 11px, line-height 17）：角色卡模型徽章。
- **Micro-tiny**（500, 10.5px）：流内模型徽章（line-height 16）、相对时间、文件尺寸。

### Named Rules
**窄梯规则。** 不引入 15px 以上的字号；层级升级优先用 600 字重和颜色（secondary→primary），其次才是 +1px。徽章类永远 ≤11px。

## Layout

三区工作台（`.dsgc-root` 为 `container-type:inline-size` 容器，响应式全部走容器查询而非媒体查询）：

- **左导航 232px**（`flex:none`，右缘 1px `border-l1`，**可收起**——左接缝收合钮触发，收合动画与右栏同款配方）：搜索框（P.Input，13px）→ 目录树（`flex:1` 滚动）→「新建群组」（P.Button outline）。群组块间距 6px；群组行（继承 14px）展开后会话列表带上缘 4px 呼吸 + 1px `border-l1` 左规线 + 12px 缩进，会话行距 2px、行内边距 6px 8px（12.5px 字号、行高 1.5）。
- **中央会话区流体**（`flex:1;min-width:0;position:relative`）：会话头一行（12px 16px：标题 + 主题输入框 + 清空 ghost 钮）。清空经确认弹窗（P.Modal：说明删除范围〔会话名 + 消息条数 + 本会话约束备忘〕、不可恢复后果、不受影响项，busy 时禁用确认），收合控制不在头部，见接缝收合钮；主题输入框为透明无边框内联输入，hover 露出 border-b2 下划线、focus 变 business-primary 下划线——无方框 outline）→ 消息流（padding 20px 24px 16px，行距 16px，贴底跟随，离底 60px 即出「回到底部」浮动药丸，锚在 composer 上方 `bottom:calc(100% + 8px)`；有约束备忘时在窗口折点插入居中收窄内容卡）→ composer（钉底，无分隔线 + padding 12px 16px 14px，列间 10px，输入卡见签名组件）。
- **右上下文栏 304px**（`flex:none`，左缘 1px `border-l1`，整体滚动）：「群成员」角色卡列 + 「工作区目录」（`.dsgc-wsrow` 弹性行：输入 flex:1 + min-width:0，按钮 flex:none + nowrap，杜绝「浏览」文字折行；内联文件浏览器）。
- **容器查询降级**：≤880px 右栏转绝对定位覆盖层（z-index 15，带投影与 `border-l2`）；≤640px 左栏收窄 200px、消息体 max-width 放宽到 88%（常态 76%）。
- **角色抽屉**：右侧滑出 380px（`max-width:calc(100% - 40px)`），覆盖在右栏之上（z-index 20）。
- **滚动容器**（统一 `scrollbar-width:thin` + `scrollbar` 色）：目录树、消息流、右栏、抽屉体、文件列表、@弹层；思考体 / 工具输出 / 失败原文 / 结论备忘条目共用 `ClipWell`（max-height 内滚 + 上下沿裁切遮罩）。
- **@弹层**：钉在 composer 输入框正上方（`bottom:calc(100% + 6px)`），z-index 30，max-height 220px。

间距节奏：行内元素 2–8px，卡片内 7–14px，区块间 8–12px，栏 padding 10–12px；消息流留白最大（24px 横向）。

### Named Rules
**行/卡二分规则。** 导航与列表一律平铺行（无边框、圆角 6、hover 换底色）；卡片（圆角 12、边框、底色）只承载内容单元——角色卡、消息卡、设置卡。禁止给平铺行加边框或给卡片去掉边框。
**三区守恒规则。** 只有三个常驻区。新功能要么进右栏（管理类）、要么走抽屉/弹层（临时类），不得开辟第四栏。会话结论备忘挂在消息流折点，不是第四栏、不钉会话头。

## Elevation & Depth

分层不投影：静止表面靠三层底色（layer-2 凹陷 / layer-3 抬升）+ 1px 边框表达深度，宿主主题令牌保证明暗两态成立。投影是「临时浮层」与「输入面」的专属信号，浮层四处（方向一致向左或向下）+ 输入卡一处：

### Shadow Vocabulary
- **@弹层**（`var(--dsw-shadow-lv3, 0 8px 24px rgba(0,0,0,.18))`）：向下投，输入时的成员或文件候选浮层。
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

### Session constraints（消息流折点结论备忘卡）
只读内容卡，插在「窗口外旧消息」与「最近原文窗口」之间（`WINDOW_SIZE`；消息都还在窗口内则放流顶）：`bg-layer-3` + 1px `border-l2` + 圆角 12 + padding 10px 12px，宽度对齐消息卡（76%，≤640px 88%）、`align-self:center`（与角色卡同语言；只读，无 hover 提边）。卡头两行：12px/600「结论备忘」+ 11.5px caption「窗口外消息折成的已定 / 否决 / 未决，供后续角色接着用。」条目 caption 11.5px / 行高 1.5；条目区 `max-height:160px`，超出内部滚动（标题与「还有 N 条」钉在滚动区外，`overscroll-behavior:contain` 不把滚轮交给消息流）。滚动上下沿为 14px layer-3 渐变遮罩（有溢出才显现，opacity `.12s`）——是裁切提示，不是卡片投影。超 4 条时第 4 条起装在 `grid-template-rows: 0fr→1fr` 里：展开 `.22s` 到达曲线，收起 `.16s` ease-in，额外条目随高度淡入。一行一条：文案前缀「已定 / 否决 / 未决」+ 一句约束。已定前缀 `label-secondary`、否决前缀 `state-error-primary`（对齐清空 hover / 系统错误，不是角色红）、未决前缀 `label-tertiary`；正文一律 `label-primary`。空备忘不渲染。1–4 条全露；超过 4 条默认露 3 条 + 底部弱平铺「还有 N 条约束」（`role="button"`，Enter/Space），展开后全部 + 「收起」；展开态不 persist，换会话重置。折叠后台完全静默（对齐 retitle，不画「整理中」）。卡片出现用现有 fade ≤180ms；reduced-motion 关掉。卡头 `h2` + `aria-labelledby`；前缀对读屏可读。不钉会话头、不自动滚去找这张卡。

### Chips
参与角色 chip 为自有件：胶囊（999px）+ `border-l2` + 透明底 + 8px 角色色点，12px；选中态换 `active-fill` 底（边框不变）；hover 只提字色；对话中禁用（opacity .5）。被 @ 时 chips 让位给一行说明文字。

### Cards / Containers
内容卡统一语言：`bg-layer-3` + 1px `border-l2`（消息卡用 `border-l1`）+ 圆角 12 + `.16s` 边框/底色过渡，hover 边框 → `label-dimmed`。变体：角色卡（padding 10px 12px，头部 = 色点 + 名字 + Tooltip 包裹的启停 Switch；人设 2 行钳制；模型徽章 + 思考图标 + hover 显现的编辑/删除操作钮）、设置卡（`dgcs-card`，padding 14px 16px，横排文字 + P.Switch）、结论备忘卡（padding 10px 12px，只读、无 hover 提边）。文件浏览器是凹陷变体：`bg-layer-2` + `border-l2` + 圆角 8。

### Inputs / Fields
- **自有控件**（input/select/textarea）：`input-bg` 底 + `border-l2`，圆角 8，13px，focus 边框 → 输入焦点色；表单字段 = 12px/500 标签 + 5px 间距。
- **搜索**：P.Input 带描边图标（IconSearchOutline16）。
- **Composer 输入**：卡内无边框 **contenteditable**（非受控——React 不管理其子节点；36px 起、自适应增高至 180px、左缩进 14px）。@成员 / @文件 = 原子芯片（`.dsgc-chipin`：`contenteditable=false` + `draggable`，退格整删、`user-select:all`；文件另加 `.dsgc-chipin-file` + FileTypeIcon）。序列化契约：角色芯片展开回「@名字␠」、文件芯片展开回 `@path` 或 `@"path with spaces"`、`<br>`→换行——**芯片=糖、文本=真**（参与判定仍由 mentionedRoles 正则对序列化文本承载，手打 @名字 与芯片等价；文件芯片不把正文写入消息）。弹层分流：裸 `@` 出成员候选；`@` 后 query 非空出工作区文件候选（目录行右侧 chevron，Enter 插入芯片）。行为：Enter 发送 / Shift+Enter `insertLineBreak` 换行（弹层开时亦然——换行后的 input 事件自然关弹层）/ 粘贴与拖放均强制 `text/plain`（`insertText`，拖放是粘贴之外的第二入口）/ IME 组合期只读不写 DOM（`isComposing` + keyCode 229 双守卫）；插入全程走 execCommand（`delete`/`insertHTML`/`insertText`）保 undo 栈，`insertHTML` 后选区经 `data-new` 标记营救（部分浏览器把选区落进 contenteditable=false 芯片内部，曾致空格丢失与光标不可见）；弹层失焦即关、候选索引按候选收缩钳制、芯片插入前校验选区落在输入区内、发送带在途锁；占位符 = 独立覆盖层 `.dsgc-ph`（`pointer-events:none`，对齐主会话——不用 ::before，生成内容会把聚焦光标顶到占位文字之后）。
- **安静输入**：会话主题框为无边框透明输入（secondary 色，focus 提为 primary）；目录树重命名为内联 mini 输入（12.5px，圆角 6）。

### Navigation
左侧目录树全平铺行：群组行（继承字号，选中仅 600 + primary，无底色）+ 会话行（12.5px / 行高 1.5，行距 2px、行内边距 6px 8px，名称前状态点，选中 = `active-fill` + 600）；群组块间距 6px，会话列表与群组行间 4px 呼吸；hover 换 `hover-fill`；`.12s` 过渡。折叠 chevron 旋转 -90°（`.16s ease`）。节点操作钮 hover 才显现；重命名走内联输入；删除走**原地确认删除**（`ConfirmDelete`：自绘垃圾桶掀盖 + 侧滑 ✓确认/✗取消 微面板——点盖开启 `.16s` 到达曲线、收起 `.12s` ease-in；armed 态图标与 ✓ 用错误色，Esc/点击外部取消；armed 时操作钮经 `:has` 常驻不随行 hover 消隐；角色卡删除同款）。「新会话」为弱化矮行（12px / 行高 1.5 / 内边距 5px 8px）。整行 `role="button"` + `tabIndex` + Enter/Space 键控。会话名 ellipsis 截断；hover 名称 500ms 后在行右侧出完整标题气泡（`HoverTip`，`side="right"`，portal `document.body`，视觉对齐宿主侧栏会话行：`--dsw-alias-tooltip-bg`、13px / 20px、圆角 8、150ms fade）；重命名输入态不出气泡。

会话状态点 = 宿主 P.StateDot（8px，主题变量 + reduced-motion 由原语自带；点外层 span 带 title/aria-label 悬停文案，StateDot 自身 aria-hidden），落在**恒在的固定宽度状态槽**（8px，对齐主会话列表 `.slot` 模式——有无状态点的行间文案 x 坐标一致）：进行中 = `ongoing` 蓝像素追逐动画（含用户已点停止、run 未真正停完的窗口）、等待确认 = `warning` 琥珀（run_command 确认闸门挂起，优先级最高）、已完成 = `done` 绿 / 已出错 = `error` 红（run 结束标记 run.finished：正常跑完/停止 → ok，发言失败 → error）；idle 槽内无点。标记生命周期见 PRODUCT.md（内存态、查看即清、新 run 覆盖）。

### 消息流（签名组件）
角色消息 = 28px 圆头像（2px 角色色环，无角色时 `border-l3`/用户头像 info 填充透明环）+ 头部行（名字 600 + 模型徽章 10.5px + 相对时间）+ layer-3 卡内 MarkdownText（宿主同源渲染，labels 冻结对象：复制/已复制/脚注）。用户消息 = info 填充行反转气泡，纯文本 pre-wrap。系统通知 = 居中 `bg-module` 胶囊（11.5px；停止等普通通知，不再承载发言失败）。**操作条**（`.dsgc-msgops`）在气泡**外**下方，角色消息左齐、自己的消息右齐：用户/角色消息悬停出「复制」与「回应」（表情微钮 + 已回应胶囊，见表情回应）；失败卡常驻「复制 / 重试」（图标+文字，不依赖悬停）。触控无 hover 时常驻。**失败卡** = 仍是该角色的消息行（头像/名字/模型保留）+ 淡错误底圆角卡（无左侧色条）：警告圆标 + 人话标题（额度已用尽 / 请求过于频繁 / 鉴权失败…）+ 可选短因 + 「查看原始错误」展开供应商原文。存量 `speaker:system` 失败行启动时按「角色「名」发言失败」反推角色并补 `failedRoleId`。重试进行中该失败卡让位给 live 流式行（插在原槽位，不钉在列表末尾），成功后原地覆盖为正常发言。**流式行**：时间槽显示「深度求索...」（`dsgc-typing`——DeepSeek 品牌蓝微光扫动，见 Motion 签名循环）+ streaming MarkdownText（opacity .92）+ 运行中的思考折叠（摘要实时跟随最新一行）；首个 delta 到达前卡内渲染「思考中」占位行（ThinkRow 同语言：思考图标 + 次要色 12px + 三点交错呼吸 1.2s，`dsgc-dot-breathe`；深度思考模型首字节可能等数秒到数十秒，空白气泡会被感知为卡死）。空态 = 居中 40ch（20px 描边图标 50% 透明度 + 13px/600 标题 + 提示）。

### 表情回应（签名组件，RareUI Emoji reaction 重写）
操作条上的回应微钮（自绘微笑描边 SVG——原语无表情类图标的内联回退，PermissionSelect 内联 SVG 同先例）弹出 `ReactionPicker`：portal `document.body`（躲开 `container-type` 对 fixed 的容器化）、按触发钮 rect 定位向上弹（空间不足向下翻）、z-index 30、视觉对齐 @弹层（layer-3 + `border-l2` + 圆角 10 + `shadow-lv3`）；6 个 Unicode emoji 候选（**内容非 chrome，记录在案的图标规则例外**——不引入图片资产）；已回应候选品牌色 12% 淡底高亮，再点取消；键盘 ←→/Enter、Esc/外点关闭。选中（新增）后 5 份 emoji 副本从触发钮上浮飘散（`.6s` 一次性：上移 44–68px + 随机横漂 ±18px + 收缩 .4 + blur 2px + 淡出，40ms 交错；reduced-motion 由 JS 跳过生成）。已回应以中性淡底胶囊（12px emoji、999px）常驻操作条，点击取消。

### 多轮进度轨道（RareUI Step player 重写）
run 进行时常驻消息流与 composer 之间的一行临时态（`aria-hidden` 装饰——当前发言者由 live 行承载）：步点 = 快照 `run.queue` 完整发言计划；已完成 = 6px **角色色**实心点（记录在案的 PALETTE 用法扩展，见 Named Rules）、当前 = 拉伸 28px 小条（角色色 22% 底 + 角色色 65% 高光 `1.8s` 线性扫动，弱化版 shimmer）+ 未开始 = `border-l2` 空心点；轮间加大间距（步点宽度/底色 `.16s` 过渡交棒）。步点 hover 出「第 x/y 位：角色名」title。run 结束随组件卸载（fade `.18s`）。无播放/暂停控件（停止按钮在 composer）、步点不可点。

### 思考折叠行（签名组件）
P.DisclosureRow 只管摘要行：12px 行（hover 换底），IconThinkOutline14 + 「思考」+ 折叠摘要（剥离 markdown 标记的纯文本，44ch 截断，11.5px）。展开体走共用 `Fold` + `ClipWell`：pre-wrap 纯文本 12.5px/1.7，左缘 2px `border-l2` 规线，max-height 320px；超出上下沿 14px 裁切遮罩。展开 `.22s` 到达曲线 / 收起 `.16s` ease-in（`0fr→1fr` + 淡入）。宿主 DisclosureRow 关闭即卸载子节点，高度动画挂在行外。

### 工具调用折叠行
同一配方：摘要行（工具名 + 参数 40ch + 成功/拒绝/失败 · 耗时）+ 行外 `Fold`/`ClipWell`，输出 max-height 260px。失败卡「查看原始错误」同款，原文 max-height 220px、遮罩取 layer-2。

### Composer（签名组件）
纵列：参与角色 chips 行（卡外，配置不入卡）→ **输入卡**（对标主会话 composer 卡：22px 圆角独立卡、`input-major` 实底、`elevation-soft` 软影【输入面豁免】、卡内无边框 textarea 36px 起自适应，左缩进 14px）→ 卡内底部**附件行**（权限芯片居左 + 轮数步进器 −/数字/+（数字 26px 宽 tabular-nums 滚轮动画 `RollingNumber` + 「轮」）紧邻 P.Button primary「发送」/ 覆写 danger「停止」，全部 white-space:nowrap——发送参数与主操作同组）。轮数整块（含 ±、数字、「轮」）hover 出气泡：`side="top"`、延迟 500ms（对齐侧栏会话行 hover，点 ± 不闪）、`maxWidth={280}`；三行 `pre-line`——「一轮 = 参与角色各说一次。」/「要他们自己互相反驳、你不插话时再加轮。」/「要边看边插话，就留 1，再点发送。」；去掉 native `title`，避免双气泡；± 保留 `aria-label`。气泡视觉对齐宿主 Tooltip（`--dsw-alias-tooltip-bg`、13px / 20px、圆角 8、150ms fade），但 portal 到 `document.body`——`.dsgc-root` 的 `container-type` 会把原语 `position:fixed` 按容器定位，坐标按视口算就会飞出屏幕。composer 区无 `border-top` 硬分隔，输入卡直接浮在消息流下方（上缘留 12px 呼吸）。@弹层（卡内锚定、向上溢出卡片）：layer-3 + `border-l2` + 圆角 10 + `shadow-lv3`。成员候选项 = 色点 + 名字（500）+ 模型（11px）；文件候选项 = 22px FileTypeIcon 井位（目录淡琥珀底 / 文件 module 底）+ 路径 + 目录行右侧 chevron。键盘 ↑↓/Enter/Tab（文件弹层 Esc 关闭；成员弹层 Esc 不参与——输入法组合下行为不稳，明确不做）；Enter/Tab/点击候选 → 删除光标前 @词并插入**原子芯片**（候选钮 `mousedown` 阻止默认，保住输入区选区）；底部操作提示行。

### 角色抽屉
右侧滑出 380px：`bg-layer-2` + 左缘 `border-l2` + 向左投影 + `.18s ease-out` 入场动画（translateX 24px + 淡入）；头（标题 + ghost 关闭）/ 体（滚动，12px 间距表单：名称、标识色调色盘、人设 textarea、提供方/模型 select、温度、深度思考 P.Switch）/ 脚（取消 outline + 保存 primary）。Escape 关闭。

### 文件浏览器
右栏内联凹陷面板：路径行（11px 截断）+ 工具行（选定此目录 primary sm / 上一级 / 主目录 / 关闭）+ 列表（目录在前、名称带 `/` 后缀、隐藏项 opacity .55、文件行惰性无 hover、尺寸 10.5px 经 P.fileSizeText）。与目录树同一平铺行语言。

## Motion

动效只为反馈、状态与连续性服务；流式正文零逐帧动画（SSE 120ms 高频更新不叠加效果）。统一到达曲线 `cubic-bezier(0.16,1,.3,1)`，退场恒短于入场（ease-in 出）。

- **签名循环**：`dsgc-presence` 1.8s ease-in-out infinite——正在流式发言的角色头像以 `--role-color`（color-mix 22%）呼吸 4px 光环；随 live 行卸载即停。`dsgc-typing-shimmer` 1.8s linear infinite——live 行「深度求索...」时间槽的品牌蓝微光扫动（对标宿主 TurnStatus「深度求索中...」：`--dsw-static-deepseek-500/200` 渐变带 + `background-clip:text` + `background-position` 扫动；reduced-motion 降级为静态渐变）。`dsgc-dot-breathe` 1.2s（0/.2/.4s 交错）——首个 delta 前「思考中」占位行的三点呼吸。`dsgc-rtrack-sweep` 1.8s linear infinite——多轮进度轨道当前步小条的角色色高光扫动（reduced-motion 停用，保留 22% 淡底状态）。
- **微反馈（一次性/滚轮）**：数字滚轮（轮数步进器与「还有 N 条约束」计数）每位数字经 `translateY` 数字条滚到目标位 `.15s` 到达曲线（`RollingNumber`，reduced-motion 直接跳变）；表情回应漂浮副本 `.6s` ease-out（5 份交错 40ms，上移 + 横漂 + 收缩 + blur + 淡出；reduced-motion 不生成）。
- **出现确认**（fade + 轻微位移）：消息 `.22s`（6px 上浮）、@弹层 `.16s`（4px）、回到底部 `.18s`（6px，保留 translateX(-50%) 定位）、原地确认删除面板 `.16s`（4px 侧滑；收起 `.12s` ease-in）、回应弹层 `.16s`（4px）、进度轨道 `.18s`（纯 fade）、错误 `.18s` / 文件浏览器 `.2s` / 空状态 `.3s`（纯 fade）、系统消息 `.24s`（scale .96）、结论备忘卡 `.18s`（纯 fade）。
- **会话内折叠（共用）**：思考全文、工具输出、失败原文、结论备忘额外条目走同一套 `Fold`：`grid-template-rows 0fr→1fr`（开 `.22s` 到达曲线 / 合 `.16s` ease-in）+ 内容淡入。超出 max-height 后 `ClipWell` 上下沿 14px 渐变遮罩（有溢出才显现，opacity `.12s`）——是裁切提示，不是卡片投影。
- **布局连续性（唯一的 layout 动画，左右对称两处）**：左右栏折叠，同一配方。宽模式 `width →0` + opacity（开 `.28s` 曲线到 / 合 `.24s` ease-in），子元素经 flex 列默认 stretch 填满内容区（不写死宽度——面板为 content-box，宿主无全局 border-box，写死像素会与内容区实宽脱节致左右内距失衡；收合期间内容随面板收缩，行内 ellipsis 渐进截断 + nowrap 元素 `overflow:hidden` 防涂抹），`visibility` 延迟 `.22s` 切换（关闭时键盘焦点安全）；窄容器（≤880px）右栏覆盖层 `translateX` 滑行（开 `.3s` / 合 `.26s`），左栏在 ≤640px 下收窄至 200px。**接缝收合钮随接缝滑行**：宽模式由布局驱动（中栏连续变宽，贴缘绝对定位的钮自动同步，无自有动画）；窄模式右钮以同曲线 `right` 过渡（`.3s`）跟踪覆盖层左缘。
- **抽屉**：入 `.22s`（32px 滑入 + 淡入）；出 `.14s` ease-in + `pointer-events:none`——取消/Esc 走 140ms 退场后卸载，保存成功为即时确认。
- **时长纪律**：微反馈 ≤150ms（色彩过渡 `.12/.16s` 沿用）→ 出现 160–240ms → 布局 260–300ms。
- **Reduced motion**：全部过渡与动画停用（含 presence 光环、右栏与抽屉），保留承载意义的颜色/透明度状态；加载旋转亦停；表情回应漂浮副本不生成。

## Do's and Don'ts

### Do:
- **Do** 原语优先：宿主有 Button/Input/Switch/Tooltip/DisclosureRow/MarkdownText/Icon*Outline 就直接用；自有 CSS 只写原语覆盖不到的布局与定制件。
- **Do** 每个颜色引用都带完整 `var(--dsw-alias-*, 灰阶回退)` 对，明暗主题自动成立。
- **Do** 角色颜色只画环和点；头像环 2px、角色点 10px、chip 点 8px。输入区内带色底的例外只有 @角色芯片（色点 + 15% 淡底胶囊）与 @文件芯片（中性/目录淡琥珀底），见唯一个性源规则。
- **Do** 响应式用容器查询（880px / 640px 两级），新面板不依赖视口媒体查询。
- **Do** 所有滚动容器给 `scrollbar-width:thin` + `scrollbar` 色；所有自有可交互控件给 `focus-visible` 2px 品牌描边 + offset 1px。
- **Do** 破坏性操作二次确认，两档形态：树节点与角色卡删除用原地确认（`ConfirmDelete` 掀盖 + ✓/✗ 微面板）；清空会话用确认弹窗（体量大且不可恢复，需说明范围与后果）。Esc 关闭临时层，键盘可达（Enter/Space/↑↓/Tab）。
- **Do** `prefers-reduced-motion:reduce` 下关闭全部过渡与动画（含 presence 光环、右栏折叠、抽屉与加载旋转）。
- **Do** 时间显示用相对时间（刚刚 / N 分钟前 / N 小时前 / M月D日）。

### Don't:
- **Don't** 在 PALETTE 之外引入字面色（danger 上的 `#fff` 与令牌回退值除外）；也不要把 PALETTE 用在环/点之外的任何地方。
- **Don't** 给静止表面加阴影——阴影只属于弹层/浮动按钮/抽屉/覆盖式右栏，以及输入面豁免（composer 输入卡的宿主输入面语言）。
- **Don't** 开辟第四栏或把表单塞进会话区；管理进右栏，临时走抽屉/弹层。
- **Don't** 使用 Unicode 图形符或伪造光标（如 `▍`）——图标一律取 Icon*Outline 原语，流式态用「深度求索...」时间槽（品牌蓝微光扫动）+ opacity .92 表达。
- **Don't** 把侧边栏入口的对齐 hack（`panelRow :has(.dsgc-entryOverlay)` 系列规则与 `newSession` 类名钩子）复制到新表面——那是外壳插槽的度量对齐权宜，由 `client.js` 文件头注释持有，不属于本设计系统。
- **Don't** 在本文件记录产品事实（用户、用途、能力约束）——归 PRODUCT.md；设计文档只管视觉。
