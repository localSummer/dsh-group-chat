/**
 * dsh-group-chat — 浏览器半（web 客户端模块）。
 *
 * 经 window.__ModuleLoader__.load 注册；factory 返回 Cordis 客户端插件：
 *  - 「模型群聊」设置页（settings.section）：启停开关，写 host 的 group-chat
 *    设置命名空间（settings.yaml 持久化）
 *  - 启用时挂载：侧边栏「群聊」入口（sidebar.panellist）+ 中央主面板（main）
 *  - 面板数据走 /api/group-chat/*（fetch + SSE），Host 半持有全部状态
 *  - DSW 原语（@deepseek-ai/dsh-client-ui-primitives，shell 静态种子模块）
 *    提供按钮/输入/开关/菜单/图标与 MarkdownText 渲染器
 *
 * 主面板布局：三区工作台——左导航栏（搜索 + 群组→会话目录树）、中央会话流
 * （@成员 点名 + markdown 渲染 + 思考折叠）、右上下文栏（群成员角色卡 + 工作区
 * 目录），右栏可收起，角色编辑走右侧滑出抽屉。
 *
 * 侧边栏入口整行命中层携带 “newSession” 类名：任务看板等 DOM 注入式面板
 * 用 [class*="newSession"] 识别“侧边栏导航点击”并自动收起自己，与点击
 * “新建会话”行为一致。
 */
/**
 * 设计契约（impeccable direction contract；seed key 76db9e37，surface roll
 * 第 4/6/1 手中用户锁定 C「三区工作台」，代码先行）
 *
 * THESIS：导航 / 会话 / 上下文三区分权的工作台——会话流以宿主同源渲染
 * （MarkdownText 正文 + 思考折叠行 + CodeBlock 代码块）为阅读中心，拒绝
 * 把全部配置挤进一栏的旧左栏过载。
 * OWN-WORLD：DSW 原语全套（Button/Input/Switch/Menu/Tooltip/60+ 描边图标）
 * + 角色色环为唯一个性源；卡片仅承载内容单元，导航一律平铺行。
 * STORY：用户在左栏定位群组与会话，在中栏以 @点名驱动多角色讨论（角色发言
 * 以 markdown 呈现、思考可折叠），在右栏管理角色与工作区目录；发送是唯一
 * 主操作（info 填充）。
 * FIRST VIEWPORT：左 232px 导航（搜索框 + 目录树 + 新建群组）；中央为
 * 会话流（色环头像 + 模型徽章 + 时间 + markdown 消息，底部富 composer 携带
 * 参与角色 chips、@弹层、轮数 stepper、发送/停止）；右 304px 上下文栏
 * （角色卡列 + 工作区目录），窄容器时覆盖式呈现、可一键收起。
 * FORM：既有界面（DSH 生态）内的 surface 重设计，继承宿主视觉世界；
 * 命名签名交互：流式发言的「正在输入」行 + 思考折叠实时摘要。
 * FINISH：unreviewed and undocumented is unfinished; this build ends with
 * the finish review, the verdict, and DESIGN.md.
 */
window.__ModuleLoader__.load({
  id: "dsh-group-chat",
  factory: (require) => {
    const React = require("react");
    const { useState, useEffect, useRef, useCallback } = React;
    const h = React.createElement;
    const P = require("@deepseek-ai/dsh-client-ui-primitives");

    const PALETTE = ["#5b8def", "#22a06b", "#e8912d", "#c678dd", "#e05661", "#56b6c2", "#98c379", "#d19a66"];
    const API_PREFIX = "/api/group-chat";
    const MD_LABELS = Object.freeze({ code: { copyLabel: "复制", copiedLabel: "已复制" }, footnotes: "脚注" });

    // ---------- 样式 ----------
    const CSS = [
      /* ===== 布局骨架：三区工作台；卡片只用于内容单元，导航用平铺行 ===== */
      ".dsgc-root{display:flex;height:100%;min-height:0;background:var(--dsw-alias-bg-base,transparent);color:var(--dsw-alias-label-primary,inherit);font-size:var(--dsh-content-font-size,14px);container-type:inline-size;position:relative}",
      ".dsgc-loading{padding:24px;color:var(--dsw-alias-label-tertiary,inherit);display:flex;gap:8px;align-items:center}",
      ".dsgc-loading svg{animation:dsgc-spin 1s linear infinite}",
      "@keyframes dsgc-spin{to{transform:rotate(360deg)}}",
      /* ===== 左导航栏 ===== */
      ".dsgc-nav{width:232px;flex:none;display:flex;flex-direction:column;gap:8px;border-right:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2));padding:12px 10px;min-height:0;min-width:0}",
      ".dsgc-search{flex:none}",
      ".dsgc-search input{font-size:13px}",
      ".dsgc-search:focus-within{border-color:var(--dsw-alias-state-business-primary,#4f6ef7)}",
      ".dsgc-tree{display:flex;flex-direction:column;gap:1px;flex:1;overflow-y:auto;min-height:0;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent}",
      ".dsgc-grow-row{display:flex;align-items:center;gap:2px;min-width:0;border:none;background:none;border-radius:6px;padding:5px 6px;color:var(--dsw-alias-label-secondary,inherit);transition:background-color .12s,color .12s;cursor:pointer;font:inherit;text-align:left}",
      ".dsgc-grow-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12));color:var(--dsw-alias-label-primary,inherit)}",
      ".dsgc-grow-row.on{color:var(--dsw-alias-label-primary,inherit);font-weight:600}",
      ".dsgc-twist{flex:none;width:16px;height:16px;border:none;background:none;color:inherit;cursor:pointer;padding:0;display:inline-flex;align-items:center;justify-content:center}",
      ".dsgc-twist svg{transition:transform .16s ease}",
      ".dsgc-twist.closed svg{transform:rotate(-90deg)}",
      ".dsgc-gname{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".dsgc-nodeops{display:none;gap:2px;flex:none}",
      ".dsgc-grow-row:hover .dsgc-nodeops,.dsgc-sess-row:hover .dsgc-nodeops{display:inline-flex}",
      ".dsgc-opbtn{border:none;background:none;color:var(--dsw-alias-label-tertiary,inherit);cursor:pointer;padding:2px;border-radius:4px;line-height:0;transition:background-color .12s,color .12s}",
      ".dsgc-opbtn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.15));color:var(--dsw-alias-label-primary,inherit)}",
      ".dsgc-opbtn.danger{color:var(--dsw-alias-state-error-primary,#e5484d)}",
      ".dsgc-sess-list{display:flex;flex-direction:column;gap:1px;margin:1px 0 3px 4px;padding-left:12px;border-left:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.15))}",
      ".dsgc-sess-row{display:flex;align-items:center;gap:6px;min-width:0;border:none;background:none;border-radius:6px;padding:5px 8px;font-size:12.5px;color:var(--dsw-alias-label-secondary,inherit);transition:background-color .12s,color .12s;cursor:pointer;text-align:left;font-family:inherit}",
      ".dsgc-sess-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12));color:var(--dsw-alias-label-primary,inherit)}",
      ".dsgc-sess-row.on{background:var(--dsw-alias-interactive-bg-active,rgba(128,128,128,.2));color:var(--dsw-alias-label-primary,inherit);font-weight:600}",
      ".dsgc-sess-dot{flex:none;width:5px;height:5px;border-radius:50%;background:currentColor;opacity:.45}",
      ".dsgc-sess-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".dsgc-addsess{border:none;background:none;color:var(--dsw-alias-label-tertiary,inherit);cursor:pointer;text-align:left;font-size:12px;padding:4px 8px;border-radius:6px;transition:background-color .12s,color .12s;font-family:inherit;display:flex;align-items:center;gap:5px;line-height:1;white-space:nowrap}",
      ".dsgc-addsess:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12));color:var(--dsw-alias-label-primary,inherit)}",
      ".dsgc-rename{font:inherit;font-size:12.5px;min-width:0;flex:1;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));background:var(--dsw-specific-input-major,var(--dsw-alias-bg-layer-3,transparent));color:inherit;border-radius:6px;padding:1px 6px;outline:none;transition:border-color .16s}",
      ".dsgc-rename:focus{border-color:var(--dsw-alias-state-business-primary,#4f6ef7)}",
      ".dsgc-hint{font-size:12px;color:var(--dsw-alias-label-tertiary,inherit);line-height:1.5;text-wrap:balance}",
      /* ===== 中央会话区 ===== */
      ".dsgc-chat{flex:1;display:flex;flex-direction:column;min-width:0;min-height:0}",
      ".dsgc-chathead{display:flex;gap:10px;align-items:center;padding:12px 16px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2))}",
      ".dsgc-sess-title{flex:none;font-weight:600;font-size:14px;color:var(--dsw-alias-label-primary,inherit);max-width:30%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".dsgc-topic{flex:1;background:transparent;border:none;border-bottom:1px solid transparent;padding:2px;min-height:20px;color:var(--dsw-alias-label-secondary,inherit);font:inherit;outline:none;min-width:0;transition:color .12s,border-color .12s}",
      ".dsgc-topic:hover{border-bottom-color:var(--dsw-alias-border-l2,rgba(128,128,128,.3))}",
      ".dsgc-topic:focus{color:var(--dsw-alias-label-primary,inherit);border-bottom-color:var(--dsw-alias-state-business-primary,#4f6ef7)}",
      ".dsgc-topic::placeholder{color:var(--dsw-alias-label-tertiary,inherit)}",
      ".dsgc-msgs{flex:1;overflow-y:auto;padding:20px 24px 16px;display:flex;flex-direction:column;gap:16px;min-height:0;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent}",
      ".dsgc-msg{display:flex;gap:10px;align-items:flex-start;max-width:100%;animation:dsgc-msg-in .22s cubic-bezier(.16,1,.3,1)}",
      ".dsgc-msg.mine{flex-direction:row-reverse}",
      ".dsgc-avatar{width:28px;height:28px;box-sizing:border-box;border:2px solid var(--dsw-alias-border-l3,rgba(128,128,128,.4));border-radius:50%;background:var(--dsw-alias-bg-module-platform,rgba(128,128,128,.12));color:var(--dsw-alias-label-primary,inherit);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex:none;margin-top:1px}",
      ".dsgc-avatar.mine{border-color:transparent;background:var(--dsw-alias-button-info-fill,#4f6ef7);color:var(--dsw-alias-label-primary-foreground,#fff)}",
      ".dsgc-msgbody{max-width:76%;min-width:0;display:flex;flex-direction:column;gap:5px}",
      ".dsgc-msg.mine .dsgc-msgbody{align-items:flex-end}",
      ".dsgc-msghead{display:flex;gap:6px;align-items:center;min-width:0;font-size:12px;color:var(--dsw-alias-label-secondary,inherit)}",
      ".dsgc-msgname{font-weight:600;color:var(--dsw-alias-label-primary,inherit);white-space:nowrap}",
      ".dsgc-msgmodel{background:var(--dsw-alias-bg-module-platform,rgba(128,128,128,.12));border-radius:999px;padding:0 7px;font-size:10.5px;font-weight:500;line-height:16px;color:var(--dsw-alias-label-secondary,inherit);white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}",
      ".dsgc-msgtime{font-size:10.5px;color:var(--dsw-alias-label-tertiary,inherit);white-space:nowrap}",
      ".dsgc-msgtext{background:var(--dsw-alias-bg-layer-3,rgba(128,128,128,.06));border:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.15));padding:10px 14px;border-radius:12px;line-height:1.6;text-align:left;color:var(--dsw-alias-label-primary,inherit);min-width:0;overflow-wrap:anywhere}",
      ".dsgc-msg.mine .dsgc-msgtext{background:var(--dsw-alias-button-info-fill,#4f6ef7);border-color:transparent;color:var(--dsw-alias-label-primary-foreground,#fff);white-space:pre-wrap;word-break:break-word}",
      ".dsgc-msgtext.live{opacity:.92}",
      ".dsgc-msg.live .dsgc-avatar{--presence-ring:color-mix(in srgb,var(--role-color,#4f6ef7) 22%,transparent);animation:dsgc-presence 1.8s ease-in-out infinite}",
      ".dsgc-think{margin:2px 0}",
      ".dsgc-think .dsgc-thinkrow{font-size:12px;color:var(--dsw-alias-label-secondary,inherit);border-radius:8px;padding:3px 8px;transition:background-color .12s}",
      ".dsgc-think .dsgc-thinkrow:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.1))}",
      ".dsgc-think .dsgc-thinksummary{color:var(--dsw-alias-label-tertiary,inherit);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:44ch;font-size:11.5px;margin-left:6px}",
      ".dsgc-think .dsgc-thinkbody{font-size:12.5px;line-height:1.7;color:var(--dsw-alias-label-secondary,inherit);white-space:pre-wrap;word-break:break-word;border-left:2px solid var(--dsw-alias-border-l2,rgba(128,128,128,.25));margin:2px 0 4px;padding:2px 0 2px 10px;max-height:320px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent;animation:dsgc-think-in .2s ease-out}",
      ".dsgc-sysmsg{align-self:center;font-size:11.5px;color:var(--dsw-alias-label-secondary,inherit);background:var(--dsw-alias-bg-module-platform,rgba(128,128,128,.1));border-radius:999px;padding:2px 10px;text-align:center;max-width:90%;animation:dsgc-sys-in .24s ease-out}",
      ".dsgc-sysmsg.err{color:var(--dsw-alias-state-error-primary,#e5484d)}",
      ".dsgc-err{font-size:12px;color:var(--dsw-alias-state-error-primary,#e5484d);animation:dsgc-fade-in .18s ease-out}",
      ".dsgc-empty{margin:auto;display:flex;flex-direction:column;align-items:center;gap:10px;color:var(--dsw-alias-label-tertiary,inherit);text-align:center;max-width:40ch;padding:24px;animation:dsgc-fade-in .3s ease-out}",
      ".dsgc-empty svg{opacity:.5}",
      ".dsgc-empty .dsgc-emptytitle{font-size:13px;font-weight:600;color:var(--dsw-alias-label-secondary,inherit)}",
      ".dsgc-empty .dsgc-hint{text-wrap:balance}",
      ".dsgc-tobottom{position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);z-index:12;animation:dsgc-rise-in .18s cubic-bezier(.16,1,.3,1)}",
      /* ===== composer ===== */
      ".dsgc-composer{border-top:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2));padding:12px 16px 14px;display:flex;flex-direction:column;gap:10px;position:relative}",
      ".dsgc-stopbtn{background:var(--dsw-alias-state-error-primary,#e5484d);border-color:transparent;color:#fff;font-weight:600}",
      ".dsgc-stopbtn:hover:not(:disabled){filter:brightness(1.08);color:#fff}",
      ".dsgc-parts{display:flex;gap:6px;flex-wrap:wrap;align-items:center;row-gap:4px}",
      ".dsgc-partslabel{font-size:12px;color:var(--dsw-alias-label-tertiary,inherit);flex:none}",
      ".dsgc-partchip{display:inline-flex;gap:6px;align-items:center;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));background:transparent;color:var(--dsw-alias-label-secondary,inherit);border-radius:999px;padding:2px 10px;font-size:12px;line-height:1.5;cursor:pointer;transition:background-color .12s,color .12s,border-color .12s;font-family:inherit}",
      ".dsgc-partchip:hover{color:var(--dsw-alias-label-primary,inherit)}",
      ".dsgc-partchip.on{background:var(--dsw-alias-interactive-bg-active,rgba(128,128,128,.18));color:var(--dsw-alias-label-primary,inherit);border-color:var(--dsw-alias-border-l2,rgba(128,128,128,.3))}",
      ".dsgc-partchip:disabled{opacity:.5;cursor:default}",
      ".dsgc-chipdot{width:8px;height:8px;border-radius:50%;flex:none;display:inline-block}",
      ".dsgc-sendrow{display:flex;gap:8px;align-items:center;justify-content:flex-end}",
      ".dsgc-sendrow button{white-space:nowrap}",
      ".dsgc-rounds{display:flex;gap:2px;align-items:center;font-size:12px;color:var(--dsw-alias-label-secondary,inherit);flex:none;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));border-radius:8px;padding:2px}",
      ".dsgc-rounds .dsgc-roundbtn{border:none;background:none;color:var(--dsw-alias-label-secondary,inherit);cursor:pointer;padding:3px;border-radius:5px;line-height:0;transition:background-color .12s,color .12s}",
      ".dsgc-rounds .dsgc-roundbtn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.15));color:var(--dsw-alias-label-primary,inherit)}",
      ".dsgc-rounds .dsgc-roundbtn:disabled{opacity:.4;cursor:default}",
      ".dsgc-rounds .dsgc-roundnum{width:26px;text-align:center;font-variant-numeric:tabular-nums;font-weight:600;color:var(--dsw-alias-label-primary,inherit)}",
      /* ===== @成员弹层 ===== */
      ".dsgc-mentionwrap{position:relative}",
      ".dsgc-mention{animation:dsgc-pop-in .16s cubic-bezier(.16,1,.3,1);position:absolute;left:0;right:0;bottom:calc(100% + 6px);background:var(--dsw-alias-bg-layer-3,#fff);border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));border-radius:10px;box-shadow:var(--dsw-shadow-lv3,0 8px 24px rgba(0,0,0,.18));max-height:220px;overflow-y:auto;padding:4px;z-index:30;display:flex;flex-direction:column;gap:2px;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent}",
      ".dsgc-mentionitem{display:flex;align-items:center;gap:8px;border:none;background:none;color:var(--dsw-alias-label-secondary,inherit);font:inherit;font-size:12.5px;text-align:left;cursor:pointer;padding:6px 8px;border-radius:6px;transition:background-color .12s,color .12s}",
      ".dsgc-mentionitem.on,.dsgc-mentionitem:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.15));color:var(--dsw-alias-label-primary,inherit)}",
      ".dsgc-mentionname{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}",
      ".dsgc-mentionmodel{font-size:11px;color:var(--dsw-alias-label-tertiary,inherit)}",
      ".dsgc-mentionhint{font-size:11px;color:var(--dsw-alias-label-tertiary,inherit);padding:2px 8px 1px}",
      /* ===== 右上下文栏 ===== */
      ".dsgc-aside{width:304px;flex:none;display:flex;flex-direction:column;gap:10px;border-left:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2));padding:12px;min-height:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent;transition:width .28s cubic-bezier(.16,1,.3,1),opacity .18s ease,padding .28s cubic-bezier(.16,1,.3,1),border-left-width .28s cubic-bezier(.16,1,.3,1)}",
      ".dsgc-aside>*{flex:none;width:280px;box-sizing:border-box}",
      ".dsgc-aside.closed{width:0;opacity:0;padding-left:0;padding-right:0;border-left-width:0;visibility:hidden;transition:width .24s ease-in,opacity .16s ease-in,padding .24s ease-in,border-left-width .24s ease-in,visibility 0s .22s}",
      ".dsgc-sec{display:flex;flex-direction:column;gap:8px;flex:none}",
      ".dsgc-sechead{display:flex;align-items:center;gap:6px;font-weight:600;font-size:12px;color:var(--dsw-alias-label-tertiary,inherit);padding-top:2px}",
      ".dsgc-sechead .dsgc-secspacer{flex:1}",
      ".dsgc-seccount{font-weight:500;color:var(--dsw-alias-label-tertiary,inherit)}",
      ".dsgc-roles{display:flex;flex-direction:column;gap:8px}",
      ".dsgc-role{border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));background:var(--dsw-alias-bg-layer-3,transparent);border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:7px;transition:border-color .16s,background-color .16s;list-style:none;text-align:left;font:inherit;cursor:pointer;color:inherit}",
      ".dsgc-role:hover{border-color:var(--dsw-alias-label-dimmed,rgba(128,128,128,.5))}",
      ".dsgc-rolehead{display:flex;gap:8px;align-items:center}",
      ".dsgc-roledot{width:10px;height:10px;border-radius:50%;flex:none}",
      ".dsgc-rolename{font-weight:600;font-size:13px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-primary,inherit)}",
      ".dsgc-role.off .dsgc-rolename{color:var(--dsw-alias-label-tertiary,inherit)}",
      ".dsgc-rolepersona{font-size:11.5px;color:var(--dsw-alias-label-tertiary,inherit);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:0}",
      ".dsgc-rolemodel{width:fit-content;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:var(--dsw-alias-bg-module-platform,rgba(128,128,128,.12));border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px;color:var(--dsw-alias-label-secondary,inherit)}",
      ".dsgc-roleops{display:flex;gap:2px;flex:none;opacity:0;transition:opacity .12s}",
      ".dsgc-role:hover .dsgc-roleops,.dsgc-role:focus-within .dsgc-roleops{opacity:1}",
      ".dsgc-rolemenu{display:flex;align-items:center;justify-content:space-between;gap:8px}",
      /* ===== 表单与控件（角色抽屉内） ===== */
      ".dsgc-field{display:flex;flex-direction:column;gap:5px}",
      ".dsgc-field>label{font-size:12px;font-weight:500;color:var(--dsw-alias-label-secondary,inherit)}",
      ".dsgc-input,.dsgc-select,.dsgc-textarea{background:var(--dsw-specific-input-major,var(--dsw-alias-bg-layer-3,transparent));border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));color:var(--dsw-alias-label-primary,inherit);font:inherit;font-size:13px;border-radius:8px;padding:6px 10px;width:100%;box-sizing:border-box;outline:none;transition:border-color .16s,background-color .16s}",
      ".dsgc-input:focus,.dsgc-select:focus,.dsgc-textarea:focus{border-color:var(--dsw-alias-state-business-primary,#4f6ef7)}",
      ".dsgc-input::placeholder,.dsgc-textarea::placeholder{color:var(--dsw-alias-label-tertiary,inherit)}",
      ".dsgc-textarea{resize:vertical;min-height:76px}",
      ".dsgc-palette{display:flex;gap:6px;flex-wrap:wrap}",
      ".dsgc-dot{width:18px;height:18px;border-radius:50%;border:2px solid transparent;cursor:pointer;padding:0;transition:transform .12s}",
      ".dsgc-dot:hover{transform:scale(1.12)}",
      ".dsgc-dot.on{border-color:var(--dsw-alias-label-primary,#fff)}",
      ".dsgc-form{display:flex;flex-direction:column;gap:12px}",
      ".dsgc-formerr{font-size:12px;color:var(--dsw-alias-state-error-primary,#e5484d);line-height:1.5}",
      ".dsgc-selhint{font-size:12px;color:var(--dsw-alias-label-tertiary,inherit);line-height:1.5;display:flex;gap:6px;align-items:center;flex-wrap:wrap}",
      /* ===== 角色编辑抽屉（右侧滑出） ===== */
      ".dsgc-drawer{position:absolute;top:0;right:0;bottom:0;width:380px;max-width:calc(100% - 40px);z-index:20;background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-bg-base,#fff));border-left:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));box-shadow:-12px 0 32px rgba(0,0,0,.14);display:flex;flex-direction:column;animation:dsgc-drawer-in .22s cubic-bezier(.16,1,.3,1)}",
      ".dsgc-drawer.closing{animation:dsgc-drawer-out .14s ease-in forwards;pointer-events:none}",
      "@keyframes dsgc-drawer-in{from{transform:translateX(32px);opacity:0}to{transform:none;opacity:1}}",
      "@keyframes dsgc-drawer-out{to{transform:translateX(32px);opacity:0}}",
      "@keyframes dsgc-msg-in{from{opacity:0;transform:translateY(6px)}}",
      "@keyframes dsgc-sys-in{from{opacity:0;transform:scale(.96)}}",
      "@keyframes dsgc-think-in{from{opacity:0;transform:translateY(-3px)}}",
      "@keyframes dsgc-pop-in{from{opacity:0;transform:translateY(4px)}}",
      "@keyframes dsgc-rise-in{from{opacity:0;transform:translate(-50%,6px)}}",
      "@keyframes dsgc-fade-in{from{opacity:0}}",
      "@keyframes dsgc-presence{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--role-color,#4f6ef7) 0%,transparent)}50%{box-shadow:0 0 0 4px var(--presence-ring)}}",
      ".dsgc-drawerhead{display:flex;align-items:center;gap:8px;padding:14px 16px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2));flex:none}",
      ".dsgc-drawertitle{flex:1;font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary,inherit)}",
      ".dsgc-drawerbody{flex:1;overflow-y:auto;padding:16px;min-height:0;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent}",
      ".dsgc-drawerfoot{display:flex;gap:8px;justify-content:flex-end;padding:12px 16px;border-top:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2));flex:none}",
      /* ===== 文件浏览器（目录选择） ===== */
      ".dsgc-fb{border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));background:var(--dsw-alias-bg-layer-2,transparent);border-radius:8px;display:flex;flex-direction:column;gap:6px;padding:8px;animation:dsgc-fade-in .2s ease-out}",
      ".dsgc-fbhead{display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0}",
      ".dsgc-fbhead button{flex:none;white-space:nowrap}",
      ".dsgc-wsrow{display:flex;gap:6px;align-items:center;min-width:0}",
      ".dsgc-wsrow .dsgc-input{width:auto;flex:1;min-width:0}",
      ".dsgc-wsrow>button{flex:none;white-space:nowrap}",
      ".dsgc-nav>button{white-space:nowrap}",
      ".dsgc-fbpath{flex:1;min-width:0;font-size:11px;color:var(--dsw-alias-label-secondary,inherit);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".dsgc-fblist{display:flex;flex-direction:column;gap:1px;max-height:220px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent}",
      ".dsgc-fbrow{display:flex;align-items:center;gap:7px;width:100%;border:none;background:none;color:var(--dsw-alias-label-primary,inherit);font:inherit;font-size:12.5px;text-align:left;cursor:pointer;padding:3px 8px;border-radius:6px;transition:background-color .12s}",
      ".dsgc-fbrow:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.15))}",
      ".dsgc-fbrow.dim{opacity:.55}",
      ".dsgc-fbrow.file{cursor:default}",
      ".dsgc-fbrow.file:hover{background:none}",
      ".dsgc-fbname{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".dsgc-fbsize{flex:none;font-size:10.5px;color:var(--dsw-alias-label-tertiary,inherit)}",
      /* ===== 键盘焦点 ===== */
      ".dsgc-partchip:focus-visible,.dsgc-mentionitem:focus-visible,.dsgc-dot:focus-visible,.dsgc-opbtn:focus-visible,.dsgc-twist:focus-visible,.dsgc-addsess:focus-visible,.dsgc-grow-row:focus-visible,.dsgc-sess-row:focus-visible,.dsgc-rename:focus-visible,.dsgc-fbrow:focus-visible,.dsgc-role:focus-visible,.dsgc-roundbtn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,var(--dsw-alias-state-business-primary,#4f6ef7));outline-offset:1px}",
      /* ===== 窄容器：右栏覆盖式呈现 ===== */
      "@container (max-width: 880px){.dsgc-aside{position:absolute;top:0;right:0;bottom:0;z-index:15;width:min(304px,88%);box-shadow:-12px 0 32px rgba(0,0,0,.16);border-left:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));transition:transform .3s cubic-bezier(.16,1,.3,1),opacity .2s ease}.dsgc-aside>*{width:auto}.dsgc-aside.closed{width:min(304px,88%);padding-left:12px;padding-right:12px;border-left-width:1px;transform:translateX(calc(100% + 14px));opacity:0;transition:transform .26s ease-in,opacity .18s ease-in,visibility 0s .24s}}",
      "@container (max-width: 640px){.dsgc-nav{width:200px}.dsgc-msgbody{max-width:88%}}",
      /* ===== 侧边栏入口对齐（外壳将插槽内容包在 panelGlyph span 内，必须用后代 :has） ===== */
      '[class*="panelList"]:has(.dsgc-entryOverlay){margin-top:4px}',
      '[class*="panelRow"]:has(.dsgc-entryOverlay){position:relative;box-sizing:border-box;height:36px;min-height:36px;padding:0 10px;font-size:13px}',
      '[class*="panelRow"][class*="panelActive"]:has(.dsgc-entryOverlay){font-weight:600}',
      '[class*="panelRow"]:has(.dsgc-entryOverlay) > [class*="panelTitle"]{padding-left:24px}',
      '.dsgc-entryOverlay{position:absolute;inset:0;display:flex;align-items:center;padding:0 10px;box-sizing:border-box}',
      '.dsgc-entryIcon{flex:none;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center}',
      '.dsgc-entryIcon svg{width:18px;height:18px;display:block}',
      '[data-sidebar-collapsed] .dsgc-entryOverlay,[class*="collapsed"] .dsgc-entryOverlay{justify-content:center;padding:0}',
      '[data-sidebar-collapsed] [class*="panelRow"]:has(.dsgc-entryOverlay),[class*="collapsed"] [class*="panelRow"]:has(.dsgc-entryOverlay){margin:0 auto}',
      '@media (prefers-reduced-motion:reduce){.dsgc-dot,.dsgc-partchip,.dsgc-mentionitem,.dsgc-grow-row,.dsgc-sess-row,.dsgc-opbtn,.dsgc-addsess,.dsgc-topic,.dsgc-role,.dsgc-rename,.dsgc-input,.dsgc-select,.dsgc-textarea,.dsgc-fbrow,.dsgc-twist svg,.dsgc-roleops,.dsgc-roundbtn,.dsgc-aside,.dsgc-aside.closed{transition:none}.dsgc-dot:hover{transform:none}.dsgc-drawer,.dsgc-msg,.dsgc-sysmsg,.dsgc-mention,.dsgc-tobottom,.dsgc-err,.dsgc-empty,.dsgc-fb,.dsgc-think .dsgc-thinkbody,.dsgc-msg.live .dsgc-avatar,.dsgc-loading svg{animation:none}}',
      /* ===== 设置页（同一卡片语言） ===== */
      '.dgcs-page{display:flex;flex-direction:column;gap:14px;padding:4px 0}',
      '.dgcs-head{display:flex;flex-direction:column;gap:6px}',
      '.dgcs-title{margin:0;font-size:15px;font-weight:600;line-height:1.4;color:var(--dsw-alias-label-primary,inherit)}',
      '.dgcs-desc{margin:0;font-size:13px;line-height:1.6;color:var(--dsw-alias-label-secondary,inherit)}',
      '.dgcs-card{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));background:var(--dsw-alias-bg-layer-3,transparent);border-radius:12px;padding:14px 16px;transition:border-color .16s}',
      '.dgcs-cardtext{display:flex;flex-direction:column;gap:3px;min-width:0}',
      '.dgcs-cardtitle{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary,inherit)}',
      '.dgcs-cardhint{font-size:12px;color:var(--dsw-alias-label-tertiary,inherit)}',
    ].join("\n");

    if (typeof document !== "undefined") {
      const tagId = "dsh-group-chat/styles.css";
      if (document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
        const tag = document.createElement("style");
        tag.dataset.plugin = "dsh-group-chat";
        tag.dataset.pluginCss = tagId;
        tag.textContent = CSS;
        document.head.appendChild(tag);
      }
    }

    // ---------- transport ----------
    async function readJson(fetchPromise) {
      const response = await fetchPromise;
      const body = await response.json();
      if (!response.ok) throw new Error(body && body.error ? body.error : "请求失败（HTTP " + response.status + "），请稍后重试");
      return body;
    }
    const api = {
      state: () => readJson(fetch(API_PREFIX + "/state", { cache: "no-store" })),
      action: (payload) => readJson(fetch(API_PREFIX + "/action", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })),
    };

    // ---------- 侧边栏入口图标 ----------
    function Glyph(props) {
      const size = (props && props.size) || 18;
      return h("span", { className: "dsgc-entryOverlay newSession" },
        h("span", { className: "dsgc-entryIcon" },
          h("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
            h("path", { d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" }),
            h("circle", { cx: 9, cy: 7, r: 4 }),
            h("path", { d: "M23 21v-2a4 4 0 0 0-3-3.87" }),
            h("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" }))));
    }

    // ---------- 小工具 ----------
    const roleById = (s, id) => {
      for (const r of s.roles) if (r.id === id) return r;
      return null;
    };
    const sessById = (s, id) => {
      for (const x of s.sessions) if (x.id === id) return x;
      return null;
    };
    const groupById = (s, id) => {
      for (const g of s.groups) if (g.id === id) return g;
      return null;
    };
    const escapeRegExp = (v) => String(v).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const firstLine = (text) => {
      const i = text.indexOf("\n");
      return i === -1 ? text : text.slice(0, i);
    };
    const latestLine = (text) => {
      const visible = text.trimEnd();
      const i = visible.lastIndexOf("\n");
      return i === -1 ? visible : visible.slice(i + 1);
    };
    const fmtTime = (ts) => {
      const delta = Math.max(0, Date.now() - ts);
      if (delta < 60000) return "刚刚";
      if (delta < 3600000) return Math.floor(delta / 60000) + " 分钟前";
      if (delta < 86400000) return Math.floor(delta / 3600000) + " 小时前";
      const d = new Date(ts);
      const sameYear = d.getFullYear() === new Date().getFullYear();
      const pad = (n) => (n < 10 ? "0" + n : "" + n);
      return sameYear ? (d.getMonth() + 1) + "月" + d.getDate() + "日" : d.getFullYear() + "/" + (d.getMonth() + 1) + "/" + d.getDate();
    };
    const Icon = (comp, size, extra) => h(comp, Object.assign({ size: size }, extra || {}));

    // ---------- 思考折叠行（对标宿主 ReasoningRow：折叠摘要 / 展开全文） ----------
    function ThinkRow(props) {
      const text = props.text || "";
      const running = !!props.running;
      const [expanded, setExpanded] = useState(false);
      const plain = (line) => line.replace(/^(\s*#{1,6}\s+|\s*[-*+]\s+|\s*>\s*)+/, "").replace(/[*`_~]/g, "").replace(/\s+/g, " ").trim();
      const summary = plain(running ? latestLine(text) : firstLine(text));
      return h("div", { className: "dsgc-think" },
        h(P.DisclosureRow, {
          rowClassName: "dsgc-thinkrow",
          icon: h(P.IconThinkOutline14, { size: 14 }),
          title: "思考",
          open: expanded,
          expandable: true,
          expandOnRowClick: true,
          onToggle: () => setExpanded((v) => !v),
          collapsedContent: text ? h("span", { className: "dsgc-thinksummary" }, summary) : null,
        }, h("div", { className: "dsgc-thinkbody" }, text)));
    }

    // ---------- 聊天消息 ----------
    function Bubble(props) {
      const snap = props.snap;
      const m = props.m;
      const isUser = m.speaker === "user";
      const isSys = m.speaker === "system";
      const role = !isUser && !isSys ? roleById(snap, m.speaker) : null;
      const name = isUser ? "我" : isSys ? "系统" : role ? role.name : "成员";
      if (isSys) return h("div", { className: "dsgc-sysmsg" + (m.error ? " err" : "") }, m.text);
      const body = isUser
        ? h("div", { className: "dsgc-msgtext" }, m.text)
        : h("div", { className: "dsgc-msgtext" },
            m.reasoning ? h(ThinkRow, { text: m.reasoning }) : null,
            h(P.MarkdownText, { text: m.text || "（无内容）", labels: MD_LABELS }));
      return h("div", { className: "dsgc-msg" + (isUser ? " mine" : "") },
        h("div", { className: "dsgc-avatar" + (isUser ? " mine" : ""), style: isUser || !role ? undefined : { border: "2px solid " + (role.color || "#888") } }, name.slice(0, 1)),
        h("div", { className: "dsgc-msgbody" },
          h("div", { className: "dsgc-msghead" },
            h("span", { className: "dsgc-msgname" }, name),
            m.model ? h("span", { className: "dsgc-msgmodel", title: m.model }, m.model) : null,
            m.ts ? h("span", { className: "dsgc-msgtime" }, fmtTime(m.ts)) : null),
          body));
    }

    // ---------- 角色编辑抽屉（右侧滑出，不遮挡会话流阅读） ----------
    function RoleDrawer(props) {
      const draft = props.draft;
      const set = props.set;
      const models = props.models;
      const providers = (models && models.providers) || [];
      const modelsOf = (models && models.modelsByProvider && models.modelsByProvider[draft.provider]) || [];
      const [closing, setClosing] = useState(false);
      const close = () => {
        if (closing) return;
        setClosing(true);
        window.setTimeout(() => props.onCancel(), 140);
      };
      const onProvider = (e) => {
        const p = e.target.value;
        const list = (models && models.modelsByProvider && models.modelsByProvider[p]) || [];
        set(Object.assign({}, draft, { provider: p, model: list.length ? list[0].id : "" }));
      };
      useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") close(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
      }, []);
      return h("div", { className: "dsgc-drawer" + (closing ? " closing" : ""), role: "dialog", "aria-modal": "false", "aria-label": draft.id ? "编辑角色" : "添加角色" },
        h("div", { className: "dsgc-drawerhead" },
          Icon(P.IconUserOutline16, 16),
          h("span", { className: "dsgc-drawertitle" }, draft.id ? "编辑角色" : "添加角色"),
          h(P.Button, { variant: "ghost", size: "sm", onClick: close, "aria-label": "关闭" }, Icon(P.IconCloseOutline16, 16))),
        h("div", { className: "dsgc-drawerbody" },
          h("div", { className: "dsgc-form" },
            h("div", { className: "dsgc-field" },
              h("label", null, "名称"),
              h("input", { className: "dsgc-input", value: draft.name, autoFocus: !draft.id, onChange: (e) => set(Object.assign({}, draft, { name: e.target.value })), placeholder: "例如：产品经理" })),
            h("div", { className: "dsgc-field" },
              h("label", null, "标识色"),
              h("div", { className: "dsgc-palette" }, PALETTE.map((c) => h("button", {
                key: c, type: "button", className: "dsgc-dot" + (draft.color === c ? " on" : ""),
                style: { background: c }, onClick: () => set(Object.assign({}, draft, { color: c })),
                "aria-label": "选择标识色 " + c,
              })))),
            h("div", { className: "dsgc-field" },
              h("label", null, "人设 / 角色设定"),
              h("textarea", { className: "dsgc-textarea", rows: 4, value: draft.persona, onChange: (e) => set(Object.assign({}, draft, { persona: e.target.value })), placeholder: "性格、立场、说话风格、专业背景……" })),
            h("div", { className: "dsgc-field" },
              h("label", null, "模型提供方"),
              providers.length
                ? h("select", { className: "dsgc-select", value: draft.provider, onChange: onProvider },
                    h("option", { value: "" }, "选择提供方…"),
                    providers.map((p) => h("option", { key: p.id, value: p.id }, p.name || p.id)))
                : h("div", { className: "dsgc-selhint" },
                    (props.modelsError ? "模型目录加载失败：" + props.modelsError : "暂无可用 provider") + " ",
                    h(P.Button, { variant: "outline", size: "sm", onClick: props.onRetryModels }, "重试"))),
            h("div", { className: "dsgc-field" },
              h("label", null, "模型"),
              modelsOf.length
                ? h("select", { className: "dsgc-select", value: draft.model, onChange: (e) => set(Object.assign({}, draft, { model: e.target.value })) },
                    modelsOf.map((m) => h("option", { key: m.id, value: m.id }, m.name || m.id)))
                : h("div", { className: "dsgc-selhint" }, "请先选择有可用模型的提供方")),
            h("div", { className: "dsgc-field" },
              h("label", null, "温度（可选）"),
              h("input", { className: "dsgc-input", type: "number", step: "0.1", min: "0", max: "2", value: draft.temperature == null ? "" : String(draft.temperature), onChange: (e) => set(Object.assign({}, draft, { temperature: e.target.value === "" ? undefined : Number(e.target.value) })) })),
            h("div", { className: "dsgc-field" },
              h("label", null, "深度思考"),
              h("div", { style: { display: "flex", gap: 10, alignItems: "center" } },
                h(P.Switch, { checked: draft.thinking === true, onChange: (v) => set(Object.assign({}, draft, { thinking: v })), label: "深度思考" }),
                h("span", { className: "dsgc-hint" }, "开启后角色发言前先思考（支持思考的模型）"))),
            props.formError ? h("div", { className: "dsgc-formerr" }, props.formError) : null)),
        h("div", { className: "dsgc-drawerfoot" },
          h(P.Button, { variant: "outline", onClick: close }, "取消"),
          h(P.Button, { variant: "primary", onClick: props.onSave }, draft.id ? "保存" : "添加")));
    }

    // ---------- 主面板 ----------
    function GroupChatPanel(props) {
      const [snap, setSnap] = useState(null);
      const [gid, setGid] = useState(null);
      const [sid, setSid] = useState(null);
      const [search, setSearch] = useState("");
      const [collapsedGroups, setCollapsedGroups] = useState(() => new Set());
      const [renameDraft, setRenameDraft] = useState(null); // {kind:'group'|'session', id, value}
      const [confirmDel, setConfirmDel] = useState(null); // {kind:'group'|'session', id}
      const [roleDraft, setRoleDraft] = useState(null);
      const [roleFormError, setRoleFormError] = useState("");
      const [models, setModels] = useState(null);
      const [modelsError, setModelsError] = useState(null);
      const [fileBrowser, setFileBrowser] = useState(null); // {open, loading, list, error}
      const [wsDraft, setWsDraft] = useState(null);
      const [partsSel, setPartsSel] = useState(null);
      const [rounds, setRounds] = useState(1);
      const [input, setInput] = useState("");
      const [err, setErr] = useState("");
      const [topicDraft, setTopicDraft] = useState(null);
      const [mention, setMention] = useState(null); // {query, caret}
      const [mentionIdx, setMentionIdx] = useState(0);
      const [asideOpen, setAsideOpen] = useState(true);
      const [atBottom, setAtBottom] = useState(true);
      const inputRef = useRef(null);
      const scrollRef = useRef(null);

      // 初始加载 + SSE 订阅；Host 新建群组/会话后自动选中新项
      useEffect(() => {
        let live = true;
        api.state().then((s) => {
          if (live && s && s.ok) setSnap(s);
        }).catch(() => { /* SSE 会重试 */ });
        const events = new EventSource(API_PREFIX + "/events");
        events.onmessage = (message) => {
          try {
            const s = JSON.parse(message.data);
            if (!live || !s || !s.ok) return;
            const created = s.lastCreated;
            if (created && created.sessionId) {
              setGid(created.groupId);
              setSid(created.sessionId);
              setPartsSel(null);
            }
            setSnap(s);
          } catch (e) { /* ignore malformed frame */ }
        };
        return () => {
          live = false;
          events.close();
        };
      }, []);

      // 贴底时新内容自动跟随滚动
      const onMsgsScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 60);
      }, []);
      useEffect(() => {
        const el = scrollRef.current;
        if (el && atBottom) el.scrollTop = el.scrollHeight;
      }, [snap]);
      // composer 输入框随内容自适应高度
      useEffect(() => {
        const el = inputRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = Math.min(180, Math.max(40, el.scrollHeight)) + "px";
      }, [input]);

      const action = async (payload) => {
        try {
          return await api.action(payload);
        } catch (e) {
          setErr(String((e && e.message) || e));
          return null;
        }
      };
      const mutate = async (args) => {
        setErr("");
        const res = await action(Object.assign({ kind: "mutate" }, args));
        if (res && res.ok && res.snapshot) {
          if (res.lastCreated && res.lastCreated.sessionId) {
            setGid(res.lastCreated.groupId);
            setSid(res.lastCreated.sessionId);
            setPartsSel(null);
          }
          setSnap(res.snapshot);
          if (res.snapshot.error) setErr(res.snapshot.error);
        }
        return res;
      };

      if (!snap) return h("div", { className: "dsgc-root" }, h("div", { className: "dsgc-loading" }, Icon(P.IconLoadingOutline16, 16), "加载中…"));

      // ---- 选中群组/会话解析 ----
      let group = gid ? groupById(snap, gid) : null;
      if (!group && snap.groups.length) group = snap.groups[0];
      if (!group) return h("div", { className: "dsgc-root" }, h("div", { className: "dsgc-loading" }, "暂无群组"));
      let sess = sid ? sessById(snap, sid) : null;
      if (!sess || sess.groupId !== group.id) sess = group.sessionIds.length ? sessById(snap, group.sessionIds[group.sessionIds.length - 1]) : null;

      const msgById = {};
      for (const m of snap.messages) msgById[m.id] = m;

      const enabledRoles = group.roleIds.map((id) => roleById(snap, id)).filter((r) => r && r.enabled);
      const participants = partsSel || enabledRoles.map((r) => r.id);
      // run 挂在会话上：仅当前会话处于对话中时显示流式与停止按钮
      const busyNow = !!(sess && snap.run.running && snap.run.sessionId === sess.id);

      const togglePart = (rid) => {
        const has = participants.includes(rid);
        setPartsSel(has ? participants.filter((x) => x !== rid) : participants.concat([rid]));
      };

      // ---- @成员：候选与插入 ----
      const mentionCandidates = mention
        ? enabledRoles.filter((r) => r.name.toLowerCase().includes((mention.query || "").toLowerCase()))
        : [];
      const onInputChange = (e) => {
        const v = e.target.value;
        const caret = e.target.selectionStart == null ? v.length : e.target.selectionStart;
        setInput(v);
        const before = v.slice(0, caret);
        const m = /(?:^|\s)@([^\s@]*)$/.exec(before);
        setMention(m ? { query: m[1], caret } : null);
        setMentionIdx(0);
      };
      const applyMention = (role) => {
        if (!mention || !role) return;
        const v = input;
        const before = v.slice(0, mention.caret);
        const after = v.slice(mention.caret);
        const replaced = before.replace(/@([^\s@]*)$/, "@" + role.name + " ");
        const next = replaced + after;
        const caretPos = replaced.length;
        setInput(next);
        setMention(null);
        setMentionIdx(0);
        const el = inputRef.current;
        if (el) {
          el.focus();
          el.setSelectionRange(caretPos, caretPos);
        }
      };
      const mentionedRoles = enabledRoles.filter((r) => new RegExp("(^|\\s)@" + escapeRegExp(r.name) + "(?=\\s|$)").test(input));

      const onInputKeyDown = (e) => {
        if (mention && mentionCandidates.length) {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setMentionIdx((mentionIdx + 1) % mentionCandidates.length);
            return;
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setMentionIdx((mentionIdx - 1 + mentionCandidates.length) % mentionCandidates.length);
            return;
          }
          if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            applyMention(mentionCandidates[mentionIdx]);
            return;
          }
          if (e.key === "Escape") {
            e.preventDefault();
            setMention(null);
            return;
          }
        }
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendMsg();
        }
      };

      // ---- 动作 ----
      const fetchModels = async () => {
        try {
          const m = await api.action({ kind: "models" });
          if (m && m.ok && Array.isArray(m.providers)) {
            setModels(m);
            setModelsError(null);
            return;
          }
          setModelsError(m && m.error ? String(m.error) : "响应异常");
        } catch (e) {
          setModelsError(String((e && e.message) || e));
        }
      };
      const openRoleEditor = async (role) => {
        setErr("");
        setRoleFormError("");
        if (!models || modelsError) await fetchModels();
        setRoleDraft(role
          ? { id: role.id, name: role.name, color: role.color, persona: role.persona, provider: role.provider, model: role.model, temperature: role.temperature, enabled: role.enabled, thinking: role.thinking === true }
          : { name: "", color: null, persona: "", provider: "", model: "", temperature: undefined, enabled: true, thinking: false });
      };
      const saveRole = async () => {
        if (!roleDraft.name.trim()) {
          setRoleFormError("角色名称不能为空");
          return;
        }
        if (!roleDraft.provider || !roleDraft.model) {
          setRoleFormError("请选择角色绑定的模型");
          return;
        }
        const res = await mutate({ op: "upsertRole", groupId: group.id, role: roleDraft });
        if (res && res.ok && res.snapshot && !res.snapshot.error) {
          setRoleDraft(null);
          setRoleFormError("");
        }
      };

      const sendMsg = async () => {
        if (busyNow) return;
        // 被 @ 的成员优先作为本轮参与角色
        const parts = mentionedRoles.length ? mentionedRoles.map((r) => r.id) : participants;
        if (!parts.length) {
          setErr(mentionedRoles.length ? "" : "请至少选择一个参与角色（或在消息中 @成员）");
          if (!mentionedRoles.length) return;
        }
        const res = await action({ kind: "send", sessionId: sess.id, text: input, participantRoleIds: parts, rounds: rounds });
        if (res && !res.ok && res.error) setErr(res.error);
        else if (res && res.ok) {
          setInput("");
          setMention(null);
          setErr("");
          setAtBottom(true);
        }
      };
      const stopRun = async () => {
        await action({ kind: "stop", sessionId: sess.id });
      };

      const commitRename = async () => {
        if (!renameDraft) return;
        const d = renameDraft;
        setRenameDraft(null);
        const value = String(d.value || "").trim();
        if (!value) return;
        if (d.kind === "group") await mutate({ op: "renameGroup", groupId: d.id, name: value });
        else await mutate({ op: "renameSession", sessionId: d.id, name: value });
      };
      const renameKeyDown = (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commitRename();
        } else if (e.key === "Escape") {
          e.preventDefault();
          setRenameDraft(null);
        }
      };
      const doDelete = async () => {
        if (!confirmDel) return;
        const d = confirmDel;
        setConfirmDel(null);
        if (d.kind === "group") await mutate({ op: "deleteGroup", groupId: d.id });
        else await mutate({ op: "deleteSession", sessionId: d.id });
      };

      const commitWsDir = () => {
        if (wsDraft !== null && group && wsDraft !== (group.workspaceDir || "")) {
          mutate({ op: "setWorkspaceDir", groupId: group.id, path: wsDraft });
        }
        setWsDraft(null);
      };
      const openBrowser = async (path) => {
        setFileBrowser({ open: true, loading: true, list: null, error: "" });
        try {
          const res = await api.action({ kind: "browse", path: path || "" });
          if (res && res.ok) setFileBrowser({ open: true, loading: false, list: res, error: "" });
          else setFileBrowser({ open: true, loading: false, list: null, error: (res && res.error) || "浏览失败" });
        } catch (e) {
          setFileBrowser({ open: true, loading: false, list: null, error: String((e && e.message) || e) });
        }
      };
      const selectCurrentDir = () => {
        if (!fileBrowser || !fileBrowser.list || !group) return;
        const path = fileBrowser.list.path;
        mutate({ op: "setWorkspaceDir", groupId: group.id, path: path });
        setWsDraft(null);
        setFileBrowser(null);
      };

      const commitTopic = () => {
        if (topicDraft !== null && sess && topicDraft !== sess.topic) mutate({ op: "setTopic", sessionId: sess.id, topic: topicDraft });
        setTopicDraft(null);
      };

      // ---- 消息流（当前会话 + 流式尾巴） ----
      const bubbles = [];
      if (sess) {
        for (const mid of sess.messageIds) {
          const m = msgById[mid];
          if (m) bubbles.push(h(Bubble, { key: m.id, snap: snap, m: m }));
        }
      }
      if (busyNow && snap.run.currentRoleId) {
        const lr = roleById(snap, snap.run.currentRoleId);
        if (lr) bubbles.push(h("div", { key: "__live", className: "dsgc-msg live" },
          h("div", { className: "dsgc-avatar", style: { border: "2px solid " + (lr.color || "#888"), "--role-color": lr.color || "#888" } }, lr.name.slice(0, 1)),
          h("div", { className: "dsgc-msgbody" },
            h("div", { className: "dsgc-msghead" },
              h("span", { className: "dsgc-msgname" }, lr.name),
              h("span", { className: "dsgc-msgmodel" }, lr.provider + " / " + lr.model),
              h("span", { className: "dsgc-msgtime" }, "正在输入…")),
            h("div", { className: "dsgc-msgtext live" },
              snap.run.partialReasoning ? h(ThinkRow, { text: snap.run.partialReasoning, running: true }) : null,
              snap.run.partial ? h(P.MarkdownText, { text: snap.run.partial, streaming: true, labels: MD_LABELS }) : null))));
      }

      // ---- 左栏：搜索 + 群组/会话目录树 ----
      const q = search.trim().toLowerCase();
      const groupMatches = (g) => {
        if (!q) return { show: true, filterSessions: false };
        if (g.name.toLowerCase().includes(q)) return { show: true, filterSessions: false };
        const hitSessions = g.sessionIds.map((id) => sessById(snap, id)).filter((s) => s && s.name.toLowerCase().includes(q));
        return { show: hitSessions.length > 0, filterSessions: true };
      };
      const treeNodes = [];
      for (const g of snap.groups) {
        const match = groupMatches(g);
        if (!match.show) continue;
        const expanded = q ? true : !collapsedGroups.has(g.id);
        const isRenameGroup = renameDraft && renameDraft.kind === "group" && renameDraft.id === g.id;
        const isConfirmGroup = confirmDel && confirmDel.kind === "group" && confirmDel.id === g.id;
        const groupChildren = [];
        if (expanded) {
          for (const sessionId of g.sessionIds) {
            const s = sessById(snap, sessionId);
            if (!s) continue;
            if (match.filterSessions && !s.name.toLowerCase().includes(q)) continue;
            const isActive = sess && s.id === sess.id && g.id === group.id;
            const isRenameSess = renameDraft && renameDraft.kind === "session" && renameDraft.id === s.id;
            const isConfirm = confirmDel && confirmDel.kind === "session" && confirmDel.id === s.id;
            groupChildren.push(h("div", {
              key: s.id,
              className: "dsgc-sess-row" + (isActive ? " on" : ""), role: "button", tabIndex: 0,
              onClick: () => { setGid(g.id); setSid(s.id); setPartsSel(null); setConfirmDel(null); setRenameDraft(null); },
              onKeyDown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setGid(g.id); setSid(s.id); setPartsSel(null); setConfirmDel(null); setRenameDraft(null); } },
            },
              h("span", { className: "dsgc-sess-dot" }),
              isRenameSess
                ? h("input", {
                    className: "dsgc-rename", value: renameDraft.value, autoFocus: true,
                    onChange: (e) => setRenameDraft({ kind: "session", id: s.id, value: e.target.value }),
                    onBlur: commitRename, onKeyDown: renameKeyDown,
                    onClick: (e) => e.stopPropagation(),
                  })
                : h("span", { className: "dsgc-sess-name" }, s.name),
              h("span", { className: "dsgc-nodeops" },
                h("button", { className: "dsgc-opbtn", title: "重命名会话", "aria-label": "重命名会话", onClick: (e) => { e.stopPropagation(); setRenameDraft({ kind: "session", id: s.id, value: s.name }); } }, Icon(P.IconEditOutline16, 14)),
                h("button", {
                  className: "dsgc-opbtn" + (isConfirm ? " danger" : ""), title: isConfirm ? "再次点击确认删除" : "删除会话", "aria-label": "删除会话",
                  onClick: (e) => {
                    e.stopPropagation();
                    if (isConfirm) doDelete();
                    else setConfirmDel({ kind: "session", id: s.id });
                  },
                }, Icon(P.IconTrashOutline16, 14)))));
          }
          groupChildren.push(h("button", {
            key: "__add", className: "dsgc-addsess",
            onClick: () => mutate({ op: "createSession", groupId: g.id }),
          }, Icon(P.IconPlusOutline16, 14), "新会话"));
        }
        treeNodes.push(h("div", { key: g.id, className: "dsgc-gnode" },
          h("div", {
              className: "dsgc-grow-row" + (g.id === group.id ? " on" : ""), role: "button", tabIndex: 0,
              onClick: () => { setGid(g.id); setPartsSel(null); setConfirmDel(null); setRenameDraft(null); },
              onKeyDown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setGid(g.id); setPartsSel(null); setConfirmDel(null); setRenameDraft(null); } },
            },
            h("button", {
              className: "dsgc-twist" + (expanded ? "" : " closed"), title: expanded ? "收起" : "展开", "aria-label": expanded ? "收起" : "展开",
              onClick: (e) => {
                e.stopPropagation();
                setCollapsedGroups((prev) => {
                  const next = new Set(prev);
                  if (next.has(g.id)) next.delete(g.id);
                  else next.add(g.id);
                  return next;
                });
              },
            }, Icon(P.IconChevronDownOutline14, 14)),
            isRenameGroup
              ? h("input", {
                  className: "dsgc-rename", value: renameDraft.value, autoFocus: true,
                  onChange: (e) => setRenameDraft({ kind: "group", id: g.id, value: e.target.value }),
                  onBlur: commitRename, onKeyDown: renameKeyDown,
                  onClick: (e) => e.stopPropagation(),
                })
              : h("span", { className: "dsgc-gname" }, g.name),
            h("span", { className: "dsgc-nodeops" },
              h("button", { className: "dsgc-opbtn", title: "重命名群组", "aria-label": "重命名群组", onClick: (e) => { e.stopPropagation(); setRenameDraft({ kind: "group", id: g.id, value: g.name }); } }, Icon(P.IconEditOutline16, 14)),
              h("button", {
                className: "dsgc-opbtn" + (isConfirmGroup ? " danger" : ""),
                title: isConfirmGroup ? "再次点击确认删除" : "删除群组", "aria-label": "删除群组",
                onClick: (e) => {
                  e.stopPropagation();
                  if (isConfirmGroup) doDelete();
                  else setConfirmDel({ kind: "group", id: g.id });
                },
              }, Icon(P.IconTrashOutline16, 14)))),
          expanded ? h("div", { className: "dsgc-sess-list" }, groupChildren) : null));
      }

      const navPanel = h("div", { className: "dsgc-nav" },
        h(P.Input, { icon: Icon(P.IconSearchOutline16, 16), className: "dsgc-search", placeholder: "搜索群组与会话…", value: search, onChange: (e) => setSearch(e.target.value) }),
        treeNodes.length
          ? h("div", { className: "dsgc-tree" }, treeNodes)
          : h("div", { className: "dsgc-hint" }, q ? "没有匹配「" + search.trim() + "」的群组或会话" : "暂无群组"),
        h(P.Button, { variant: "outline", onClick: () => mutate({ op: "createGroup" }) }, Icon(P.IconPlusOutline16, 16), "新建群组"));

      // ---- 右栏：成员角色卡 + 工作区目录 ----
      const asidePanel = h("div", { className: "dsgc-aside" + (asideOpen ? "" : " closed"), "aria-hidden": asideOpen ? undefined : "true" },
        h("div", { className: "dsgc-sec" },
          h("div", { className: "dsgc-sechead" },
            "群成员",
            h("span", { className: "dsgc-secspacer" }),
            h("span", { className: "dsgc-seccount" }, group.roleIds.length ? group.roleIds.length + " 个" : ""),
            h(P.Button, { variant: "ghost", size: "sm", onClick: () => openRoleEditor(null), "aria-label": "添加角色" }, Icon(P.IconPlusOutline16, 14), "添加")),
          group.roleIds.length
            ? h("div", { className: "dsgc-roles" }, group.roleIds.map((rid) => {
                const r = roleById(snap, rid);
                if (!r) return null;
                return h("div", {
                  key: r.id, className: "dsgc-role" + (r.enabled ? "" : " off"), role: "button", tabIndex: 0,
                  onClick: () => openRoleEditor(r),
                  onKeyDown: (e) => { if (e.key === "Enter") { e.preventDefault(); openRoleEditor(r); } },
                  title: "点击编辑角色",
                },
                  h("div", { className: "dsgc-rolehead" },
                    h("span", { className: "dsgc-roledot", style: { background: r.color || "#888" } }),
                    h("span", { className: "dsgc-rolename" }, r.name),
                    h(P.Tooltip, { label: r.enabled ? "停用该角色" : "启用该角色", side: "top", delayMs: 300 },
                      h("span", {
                        onClick: (e) => e.stopPropagation(),
                        onKeyDown: (e) => e.stopPropagation(),
                        style: { display: "inline-flex", flex: "none" },
                      },
                        h(P.Switch, { checked: r.enabled, onChange: () => mutate({ op: "setRoleEnabled", roleId: r.id, enabled: !r.enabled }), label: r.enabled ? "停用该角色" : "启用该角色", "aria-label": (r.enabled ? "停用" : "启用") + "角色 " + r.name })))),
                  r.persona ? h("div", { className: "dsgc-rolepersona", title: r.persona }, r.persona) : null,
                  h("div", { className: "dsgc-rolemenu" },
                    h("span", { className: "dsgc-rolemodel", title: r.provider + " / " + r.model + (r.thinking ? " · 深度思考" : "") },
                      r.provider + " / " + r.model),
                    r.thinking ? h("span", { title: "深度思考", style: { display: "inline-flex", alignItems: "center", color: "var(--dsw-alias-label-tertiary,inherit)" } }, Icon(P.IconThinkOutline14, 14)) : null,
                    h("span", { className: "dsgc-roleops" },
                      h("button", { className: "dsgc-opbtn", title: "编辑角色", "aria-label": "编辑角色", onClick: (e) => { e.stopPropagation(); openRoleEditor(r); } }, Icon(P.IconEditOutline16, 14)),
                      h("button", { className: "dsgc-opbtn danger", title: "移除角色", "aria-label": "移除角色", onClick: (e) => { e.stopPropagation(); mutate({ op: "deleteRole", roleId: r.id }); } }, Icon(P.IconTrashOutline16, 14)))));
              }))
            : h("div", { className: "dsgc-hint" }, "还没有角色。每个角色可绑定不同的 provider/model，在群内以独立身份发言。")),
        h("div", { className: "dsgc-sec" },
          h("div", { className: "dsgc-sechead" }, "工作区目录"),
          h("div", { className: "dsgc-field" },
            h("div", { className: "dsgc-wsrow" },
              h("input", {
                className: "dsgc-input", value: wsDraft === null ? (group.workspaceDir || "") : wsDraft,
                placeholder: "~/docs 或 /abs/dir", onChange: (e) => setWsDraft(e.target.value),
                onBlur: commitWsDir, onKeyDown: (e) => { if (e.key === "Enter") e.target.blur(); },
              }),
              h(P.Button, { variant: "outline", size: "sm", onClick: () => openBrowser(wsDraft === null ? group.workspaceDir : wsDraft) }, Icon(P.IconFolderOpenOutline16, 14), "浏览")),
            h("div", { className: "dsgc-hint" }, "发送时读取目录内文本文件，注入本群全体角色上下文")),
          fileBrowser && fileBrowser.open
            ? h("div", { className: "dsgc-fb" },
                h("div", { className: "dsgc-fbhead" },
                  h("span", { className: "dsgc-fbpath", title: fileBrowser.list ? fileBrowser.list.path : "" }, fileBrowser.loading ? "读取中…" : (fileBrowser.list ? fileBrowser.list.path : "")),
                  h("span", { style: { display: "flex", gap: 4, alignItems: "center" } },
                    h(P.Button, { variant: "primary", size: "sm", disabled: !fileBrowser.list, onClick: selectCurrentDir }, "选定此目录"),
                    fileBrowser.list ? h(P.Button, { variant: "outline", size: "sm", title: "上一级", "aria-label": "上一级", onClick: () => openBrowser(fileBrowser.list.parent) }, Icon(P.IconChevronUpOutline14, 14)) : null,
                    fileBrowser.list ? h(P.Button, { variant: "outline", size: "sm", title: "主目录", "aria-label": "主目录", onClick: () => openBrowser(fileBrowser.list.home) }, Icon(P.IconFolderClose16, 14)) : null,
                    h(P.Button, { variant: "ghost", size: "sm", onClick: () => setFileBrowser(null), "aria-label": "关闭浏览器" }, Icon(P.IconCloseOutline16, 14)))),
                fileBrowser.error ? h("div", { className: "dsgc-err" }, fileBrowser.error) : null,
                fileBrowser.list
                  ? h("div", { className: "dsgc-fblist" },
                      fileBrowser.list.entries.length
                        ? fileBrowser.list.entries.map((e) => e.type === "directory"
                            ? h("button", {
                                key: e.path, type: "button",
                                className: "dsgc-fbrow" + (e.hidden ? " dim" : "") + " dir",
                                onClick: () => openBrowser(e.path),
                              },
                                Icon(e.hidden ? P.IconFolderClose16 : P.IconFolderOpenOutline16, 14),
                                h("span", { className: "dsgc-fbname" }, e.name + "/"))
                            : h("div", {
                                key: e.path,
                                className: "dsgc-fbrow dim file",
                              },
                                h("span", { className: "dsgc-fbname" }, e.name),
                                e.size !== undefined ? h("span", { className: "dsgc-fbsize" }, P.fileSizeText(e.size)) : null))
                        : h("div", { className: "dsgc-hint" }, "空目录"))
                  : null)
            : null));

      // ---- 中栏：当前会话 ----
      const chatPanel = h("section", { className: "dsgc-chat" },
        h("div", { className: "dsgc-chathead" },
          sess ? h("span", { className: "dsgc-sess-title", title: "当前会话：" + sess.name }, sess.name) : null,
          h("input", {
            className: "dsgc-topic", value: topicDraft === null ? (sess ? sess.topic : "") : topicDraft,
            placeholder: "设置本会话主题（可选）…",
            onChange: (e) => setTopicDraft(e.target.value), onBlur: commitTopic,
            onKeyDown: (e) => { if (e.key === "Enter") e.target.blur(); },
          }),
          h(P.Button, { variant: "ghost", size: "sm", title: "清空当前会话的消息记录", onClick: () => sess && mutate({ op: "clearMessages", sessionId: sess.id }) }, "清空"),
          h(P.Button, {
            variant: "ghost", size: "sm", title: asideOpen ? "收起成员与工作区栏" : "展开成员与工作区栏",
            "aria-label": asideOpen ? "收起上下文栏" : "展开上下文栏", onClick: () => setAsideOpen(!asideOpen),
            style: { transform: "scaleX(-1)" },
          }, Icon(P.IconPanelLeftOutline16, 16))),
        h("div", { className: "dsgc-msgs", ref: scrollRef, onScroll: onMsgsScroll },
          bubbles.length ? bubbles : h("div", { className: "dsgc-empty" },
            Icon(P.IconSparkle16, 20),
            h("div", { className: "dsgc-emptytitle" }, sess && sess.topic ? "「" + sess.topic + "」" : "会话已就绪"),
            h("div", { className: "dsgc-hint" }, enabledRoles.length
              ? "发送消息开始讨论；@成员 点名让其优先回应；留空直接发送可让角色自由讨论——每轮全体参与角色按顺序各发言一次，可用右下角轮数控制（1–10 轮）"
              : "先在右侧添加角色（每个角色可绑定不同模型），再回到这里发起讨论。"))),
        h("div", { className: "dsgc-composer" },
          !atBottom && bubbles.length
            ? h("div", { className: "dsgc-tobottom" },
                h(P.Button, { variant: "outline", size: "sm", onClick: () => { const el = scrollRef.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); } },
                  Icon(P.IconChevronDownOutline14, 14), "回到底部"))
            : null,
          err ? h("div", { className: "dsgc-err" }, err) : null,
          h("div", { className: "dsgc-parts" },
            h("span", { className: "dsgc-partslabel" }, "参与角色"),
            mentionedRoles.length
              ? h("span", { className: "dsgc-partslabel" }, "已 @ " + mentionedRoles.map((r) => r.name).join("、") + "（本轮仅被点名成员发言）")
              : enabledRoles.length
                ? enabledRoles.map((r) => h("button", { key: r.id, type: "button", className: "dsgc-partchip" + (participants.includes(r.id) ? " on" : ""), onClick: () => togglePart(r.id), disabled: busyNow, title: busyNow ? "对话进行中，暂停调整" : "点击切换本轮是否参与" },
                    h("span", { className: "dsgc-chipdot", style: { background: r.color || "#888" } }), r.name))
                : h("span", { className: "dsgc-hint" }, "还没有启用的角色，请在右侧添加")),
          h("div", { className: "dsgc-mentionwrap" },
            mention && mentionCandidates.length > 0
              ? h("div", { className: "dsgc-mention", role: "listbox" },
                  mentionCandidates.map((r, i) => h("button", {
                    key: r.id, type: "button", className: "dsgc-mentionitem" + (i === mentionIdx ? " on" : ""), role: "option", "aria-selected": i === mentionIdx ? "true" : "false",
                    onClick: () => applyMention(r),
                    onMouseEnter: () => setMentionIdx(i),
                  },
                    h("span", { className: "dsgc-chipdot", style: { background: r.color || "#888" } }),
                    h("span", { className: "dsgc-mentionname" }, r.name),
                    h("span", { className: "dsgc-mentionmodel" }, r.provider + " / " + r.model))),
                  h("span", { className: "dsgc-mentionhint" }, "↑↓ 选择 · Enter/Tab 插入 · Esc 关闭"))
              : null,
            h("textarea", {
              className: "dsgc-textarea", ref: inputRef, rows: 2,
              placeholder: "发消息给全群，@成员 点名让其回应（留空则让角色自由讨论）…",
              value: input, onChange: onInputChange, onKeyDown: onInputKeyDown,
              style: { resize: "none", minHeight: "40px", maxHeight: "180px", boxSizing: "border-box" },
            })),
          h("div", { className: "dsgc-sendrow" },
            h("span", { style: { flex: 1 } }),
            h("div", { className: "dsgc-rounds", title: "自由讨论的轮数（1–10）：一轮 = 全体参与角色按顺序各发言一次" },
              h("button", { type: "button", className: "dsgc-roundbtn", "aria-label": "减少轮数", disabled: rounds <= 1, onClick: () => setRounds(Math.max(1, rounds - 1)) }, Icon(P.IconChevronLeftOutline14, 12)),
              h("span", { className: "dsgc-roundnum", title: "轮数" }, rounds),
              h("button", { type: "button", className: "dsgc-roundbtn", "aria-label": "增加轮数", disabled: rounds >= 10, onClick: () => setRounds(Math.min(10, rounds + 1)) }, Icon(P.IconChevronRightOutline14, 12)),
              h("span", { style: { padding: "0 6px 0 2px" } }, "轮")),
            busyNow
              ? h(P.Button, { variant: "outline", className: "dsgc-stopbtn", onClick: stopRun }, Icon(P.IconStopFill16, 16), "停止")
              : h(P.Button, { variant: "primary", onClick: sendMsg, disabled: (!participants.length && !mentionedRoles.length) || !sess }, Icon(P.IconSendOutline16, 16), "发送"))));

      return h("div", { className: "dsgc-root" },
        navPanel,
        chatPanel,
        asidePanel,
        roleDraft ? h(RoleDrawer, { draft: roleDraft, set: setRoleDraft, models: models, modelsError: modelsError, onRetryModels: fetchModels, onSave: saveRole, onCancel: () => { setRoleDraft(null); setRoleFormError(""); }, formError: roleFormError }) : null);
    }

    // ---------- 设置页：启停开关 ----------
    function GroupChatSettingsSection(props) {
      const scope = props.settingsScope;
      const [snap, setSnap] = useState(null);
      const [pending, setPending] = useState(false);

      useEffect(() => {
        let live = true;
        const read = () => {
          if (!live) return;
          try {
            setSnap(scope.getSnapshot());
          } catch (e) { /* ignore */ }
        };
        read();
        const off = scope.subscribe(read);
        return () => {
          live = false;
          off();
        };
      }, []);

      const ready = snap !== null && snap.status === "ready";
      const writable = ready ? snap.writable !== false : false;
      const enabled = ready ? (snap.value && snap.value.enabled) !== false : true;

      const toggle = async () => {
        if (!writable || pending) return;
        setPending(true);
        try {
          await scope.set("enabled", !enabled);
        } catch (e) {
          console.error("[dsh-group-chat] settings write failed", e);
        } finally {
          setPending(false);
        }
      };

      return h("div", { className: "dgcs-page" },
        h("div", { className: "dgcs-head" },
          h("h3", { className: "dgcs-title" }, "模型群聊"),
          h("p", { className: "dgcs-desc" }, "多模型角色群组对话面板：每个角色绑定不同的 provider/model；群组内多会话目录树管理，群内共享对话记录与资料空间；消息以 markdown 渲染、支持思考折叠；输入框支持 @成员 点名。数据持久化于 ~/.dsh/storages/group-chat/，重启 dsh web 后恢复。")),
        h("div", { className: "dgcs-card" },
          h("div", { className: "dgcs-cardtext" },
            h("div", { className: "dgcs-cardtitle" }, enabled ? "已启用" : "已停用"),
            h("div", { className: "dgcs-cardhint" }, writable ? (enabled ? "关闭后侧边栏将不再显示「群聊」入口，进行中的对话会被中止。" : "开启后侧边栏显示「群聊」入口。") : "当前设置不可写（可能被配置文件覆盖）。")),
          h(P.Switch, {
            checked: enabled, onChange: toggle, disabled: !writable || pending,
            label: "模型群聊启停", title: pending ? "正在写入…" : enabled ? "点击停用" : "点击启用",
          })));
    }

    // ---------- 插件 ----------
    return {
      name: "group-chat-client",
      inject: ["slots", "settingsScope"],
      apply(ctx) {
        const scope = ctx.settingsScope.bind({ namespace: "group-chat" });

        // 设置页常驻注册（禁用时也保留入口，便于重新启用）
        ctx.slots.inject("settings.section", () =>
          ctx.slots.register(
            {
              name: "settings.section",
              id: "dsh-group-chat",
              order: 60,
              label: () => "模型群聊",
              inject: () => ({ settingsScope: scope }),
            },
            GroupChatSettingsSection,
          ),
        );

        // 启用门控：enabled 为 false 时卸载侧边栏入口与主面板
        let uiDisposer;
        const mountUi = () => {
          if (uiDisposer !== undefined) return;
          const disposers = [];
          try {
            disposers.push(ctx.slots.inject("main", () =>
              ctx.slots.register({ name: "main", key: "group-chat" }, () => h(GroupChatPanel, null))));
            disposers.push(ctx.slots.inject("sidebar.panellist", () =>
              ctx.slots.register({ name: "sidebar.panellist", id: "group-chat", order: 50, label: "群聊" }, (props) => h(Glyph, props))));
          } catch (e) {
            console.error("[dsh-group-chat] mount failed:", e);
          }
          uiDisposer = () => {
            uiDisposer = undefined;
            for (const dispose of disposers.splice(0)) dispose();
          };
        };
        const syncEnabled = () => {
          const snapshot = scope.getSnapshot();
          const on = snapshot.status === "ready"
            ? (snapshot.value && snapshot.value.enabled) !== false
            : snapshot.status === "unavailable";
          if (on) mountUi();
          else if (uiDisposer !== undefined) uiDisposer();
        };
        scope.subscribe(syncEnabled);
        syncEnabled();
      },
    };
  },
});
