/**
 * 浏览器半样式：CSS 以内联字符串承载（刻意不迁移 CSS Modules 管线——
 * 类名需保持原样，侧栏入口的 “newSession” 类名是任务看板等 DOM 注入式
 * 面板识别“侧边栏导航点击”的跨插件标记，哈希化会破坏该约定）。
 * 工厂执行时幂等注入 <style>，loader 卸载时按 data-plugin 摘除标签。
 * @module dsh-group-chat/client/styles
 */

/** 注入标签的唯一 id。 */
const TAG_ID = 'dsh-group-chat/styles.css'

export const CSS = [
  /* ===== 布局骨架：三区工作台；卡片只用于内容单元，导航用平铺行 ===== */
  '.dsgc-root{display:flex;height:100%;min-height:0;background:var(--dsw-alias-bg-base,transparent);color:var(--dsw-alias-label-primary,inherit);font-size:var(--dsh-content-font-size,14px);container-type:inline-size;position:relative}',
  '.dsgc-loading{padding:24px;color:var(--dsw-alias-label-tertiary,inherit);display:flex;gap:8px;align-items:center;opacity:0;animation:dsgc-loading-in .18s ease-out .15s forwards}',
  /* 首开加载态延迟 150ms 淡入：本机回路通常数毫秒内数据即达并卸载本元素，
     快路径完全不可见（无闪现，等同移除）；慢路径才出现反馈，空白面板不再是唯一信号 */
  '@keyframes dsgc-loading-in{to{opacity:1}}',
  '.dsgc-loading svg{animation:dsgc-spin 1s linear infinite}',
  '@keyframes dsgc-spin{to{transform:rotate(360deg)}}',
  /* ===== 左导航栏（可收起，收合动画与右栏同款配方） ===== */
  '.dsgc-nav{width:232px;flex:none;display:flex;flex-direction:column;gap:8px;border-right:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2));padding:12px 10px;min-height:0;min-width:0;transition:width .28s cubic-bezier(.16,1,.3,1),opacity .18s ease,padding .28s cubic-bezier(.16,1,.3,1),border-right-width .28s cubic-bezier(.16,1,.3,1)}',
  /* 子元素经 flex 列默认 stretch 填满内容区（不写死宽度：内容区实宽 232px——
     宿主无全局 border-box，面板为 content-box，旧版写死 212px 曾致右侧多出
     20px 死区、左右内距失衡）；收合动画期间内容随面板收缩，行内 ellipsis
     渐进截断 + visibility 0.22s 切断，无溢出涂抹 */
  '.dsgc-nav>*{flex:none}',
  '.dsgc-nav.closed{width:0;opacity:0;padding-left:0;padding-right:0;border-right-width:0;visibility:hidden;transition:width .24s ease-in,opacity .16s ease-in,padding .24s ease-in,border-right-width .24s ease-in,visibility 0s .22s}',
  '.dsgc-search{flex:none}',
  '.dsgc-search input{font-size:13px}',
  '.dsgc-search:focus-within{border-color:var(--dsw-alias-state-business-primary,#4f6ef7)}',
  '.dsgc-tree{display:flex;flex-direction:column;gap:6px;flex:1;overflow-y:auto;min-height:0;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent}',
  '.dsgc-grow-row{display:flex;align-items:center;gap:2px;min-width:0;border:none;background:none;border-radius:6px;padding:5px 6px;color:var(--dsw-alias-label-secondary,inherit);transition:background-color .12s,color .12s;cursor:pointer;font:inherit;text-align:left}',
  '.dsgc-grow-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12));color:var(--dsw-alias-label-primary,inherit)}',
  '.dsgc-grow-row.on{color:var(--dsw-alias-label-primary,inherit);font-weight:600}',
  '.dsgc-twist{flex:none;width:16px;height:16px;border:none;background:none;color:inherit;cursor:pointer;padding:0;display:inline-flex;align-items:center;justify-content:center}',
  '.dsgc-twist svg{transition:transform .16s ease}',
  '.dsgc-twist.closed svg{transform:rotate(-90deg)}',
  '.dsgc-gname{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '.dsgc-nodeops{display:none;gap:2px;flex:none}',
  '.dsgc-grow-row:hover .dsgc-nodeops,.dsgc-sess-row:hover .dsgc-nodeops{display:inline-flex}',
  '.dsgc-opbtn{border:none;background:none;color:var(--dsw-alias-label-tertiary,inherit);cursor:pointer;padding:2px;border-radius:4px;line-height:0;transition:background-color .12s,color .12s}',
  '.dsgc-opbtn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.15));color:var(--dsw-alias-label-primary,inherit)}',
  '.dsgc-opbtn.danger{color:var(--dsw-alias-state-error-primary,#e5484d)}',
  '.dsgc-sess-list{display:flex;flex-direction:column;gap:2px;margin:4px 0 2px 4px;padding-left:12px;border-left:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.15))}',
  '.dsgc-sess-row{display:flex;align-items:center;gap:6px;min-width:0;border:none;background:none;border-radius:6px;padding:6px 8px;font-size:12.5px;line-height:1.5;color:var(--dsw-alias-label-secondary,inherit);transition:background-color .12s,color .12s;cursor:pointer;text-align:left;font-family:inherit}',
  '.dsgc-sess-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12));color:var(--dsw-alias-label-primary,inherit)}',
  '.dsgc-sess-row.on{background:var(--dsw-alias-interactive-bg-active,rgba(128,128,128,.2));color:var(--dsw-alias-label-primary,inherit);font-weight:600}',
  '.dsgc-sess-status{flex:none;width:8px;height:8px;display:inline-flex;justify-content:center;align-items:center}',
  '.dsgc-sess-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '.dsgc-addsess{border:none;background:none;color:var(--dsw-alias-label-tertiary,inherit);cursor:pointer;text-align:left;font-size:12px;line-height:1.5;padding:5px 8px;border-radius:6px;transition:background-color .12s,color .12s;font-family:inherit;display:flex;align-items:center;gap:5px;white-space:nowrap;overflow:hidden}',
  '.dsgc-addsess:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12));color:var(--dsw-alias-label-primary,inherit)}',
  '.dsgc-rename{font:inherit;font-size:12.5px;min-width:0;flex:1;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));background:var(--dsw-specific-input-major,var(--dsw-alias-bg-layer-3,transparent));color:inherit;border-radius:6px;padding:1px 6px;outline:none;transition:border-color .16s}',
  '.dsgc-rename:focus{border-color:var(--dsw-alias-state-business-primary,#4f6ef7)}',
  '.dsgc-hint{font-size:12px;color:var(--dsw-alias-label-tertiary,inherit);line-height:1.5;text-wrap:balance}',
  /* ===== 中央会话区 ===== */
  '.dsgc-chat{flex:1;display:flex;flex-direction:column;min-width:0;min-height:0;position:relative}',
  /* 接缝收合钮：钉在会话区两缘、垂直居中、各控其侧（图标方向相反的 chevron）。
     宽模式下面板宽度过渡 → 中栏连续变宽，绝对定位的钮贴缘自动随接缝滑行（布局驱动）；
     窄模式右栏为覆盖层，钮用同曲线 right 过渡跟踪其左缘。浮层配方：实底 + border-l2 + 轻方向性软影 */
  '.dsgc-seambtn{position:absolute;top:50%;transform:translateY(-50%);z-index:14;width:24px;height:56px;display:flex;align-items:center;justify-content:center;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));background:var(--dsw-alias-bg-layer-3,#fff);color:var(--dsw-alias-label-secondary,inherit);cursor:pointer;transition:background-color .12s,color .12s,border-color .12s,right .3s cubic-bezier(.16,1,.3,1)}',
  '.dsgc-seambtn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.15));color:var(--dsw-alias-label-primary,inherit);border-color:var(--dsw-alias-border-l3,rgba(128,128,128,.4))}',
  '.dsgc-seambtn.left{left:0;border-left:none;border-radius:0 8px 8px 0;box-shadow:3px 0 10px rgba(0,0,0,.07)}',
  '.dsgc-seambtn.right{right:0;border-right:none;border-radius:8px 0 0 8px;box-shadow:-3px 0 10px rgba(0,0,0,.07)}',
  '.dsgc-chathead{display:flex;gap:10px;align-items:center;padding:12px 16px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2))}',
  '.dsgc-sess-title{flex:none;font-weight:600;font-size:14px;color:var(--dsw-alias-label-primary,inherit);max-width:30%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '.dsgc-topic{flex:1;background:transparent;border:none;border-bottom:1px solid transparent;padding:2px;min-height:20px;color:var(--dsw-alias-label-secondary,inherit);font:inherit;outline:none;min-width:0;transition:color .12s,border-color .12s}',
  '.dsgc-topic:hover{border-bottom-color:var(--dsw-alias-border-l2,rgba(128,128,128,.3))}',
  '.dsgc-topic:focus{color:var(--dsw-alias-label-primary,inherit);border-bottom-color:var(--dsw-alias-state-business-primary,#4f6ef7)}',
  '.dsgc-topic::placeholder{color:var(--dsw-alias-label-tertiary,inherit)}',
  /* 清空按钮：破坏性操作的 hover/active 反馈——宿主 ghost hover 是低强度灰底（在本
     面板底色上近透明、无感知），改为 danger 色文字 + 淡红底，与弹窗内 danger 确认
     按钮同语言；特异性高于原语 .ghost:hover:not(:disabled) */
  '.dsgc-chathead .dsgc-clearbtn{transition:background-color .12s,color .12s}',
  '.dsgc-chathead .dsgc-clearbtn:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#e5484d) 10%,transparent);color:var(--dsw-alias-state-error-primary,#e5484d)}',
  '.dsgc-chathead .dsgc-clearbtn:active:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#e5484d) 16%,transparent)}',
  '.dsgc-msgs{flex:1;overflow-y:auto;padding:20px 24px 16px;display:flex;flex-direction:column;gap:16px;min-height:0;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent}',
  '.dsgc-msg{display:flex;gap:10px;align-items:flex-start;max-width:100%;animation:dsgc-msg-in .22s cubic-bezier(.16,1,.3,1)}',
  '.dsgc-msg.mine{flex-direction:row-reverse}',
  '.dsgc-avatar{width:28px;height:28px;box-sizing:border-box;border:2px solid var(--dsw-alias-border-l3,rgba(128,128,128,.4));border-radius:50%;background:var(--dsw-alias-bg-module-platform,rgba(128,128,128,.12));color:var(--dsw-alias-label-primary,inherit);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex:none;margin-top:1px}',
  '.dsgc-avatar.mine{border-color:transparent;background:var(--dsw-alias-button-info-fill,#4f6ef7);color:var(--dsw-alias-label-primary-foreground,#fff)}',
  '.dsgc-msgbody{max-width:76%;min-width:0;display:flex;flex-direction:column;gap:5px}',
  '.dsgc-msg.mine .dsgc-msgbody{align-items:flex-end}',
  '.dsgc-msghead{display:flex;gap:6px;align-items:center;min-width:0;font-size:12px;color:var(--dsw-alias-label-secondary,inherit)}',
  '.dsgc-msgname{font-weight:600;color:var(--dsw-alias-label-primary,inherit);white-space:nowrap}',
  '.dsgc-msgmodel{background:var(--dsw-alias-bg-module-platform,rgba(128,128,128,.12));border-radius:999px;padding:0 7px;font-size:10.5px;font-weight:500;line-height:16px;color:var(--dsw-alias-label-secondary,inherit);white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}',
  '.dsgc-msgtime{font-size:10.5px;color:var(--dsw-alias-label-tertiary,inherit);white-space:nowrap}',
  /* 流式「深度求索...」（对标宿主 TurnStatus「深度求索中...」签名动画）：DeepSeek
     品牌蓝渐变带扫过文字的微光——background-clip:text + background-position
     1.8s linear 无限扫动；令牌取宿主静态品牌色 --dsw-static-deepseek-*（非主题
     别名，回退为品牌字面值），贯穿首轮 token 前与流式全程 */
  '.dsgc-typing{background:linear-gradient(90deg,var(--dsw-static-deepseek-500,#4176e6) 0%,var(--dsw-static-deepseek-500,#4176e6) 40%,var(--dsw-static-deepseek-200,#d3e2ff) 50%,var(--dsw-static-deepseek-500,#4176e6) 60%,var(--dsw-static-deepseek-500,#4176e6) 100%);color:#0000;-webkit-text-fill-color:transparent;background-position:100% 0;background-size:250% 100%;-webkit-background-clip:text;background-clip:text;font-weight:600;animation:dsgc-typing-shimmer 1.2s linear infinite}',
  '@keyframes dsgc-typing-shimmer{to{background-position:0 0}}',
  '.dsgc-msgtext{background:var(--dsw-alias-bg-layer-3,rgba(128,128,128,.06));border:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.15));padding:10px 14px;border-radius:12px;line-height:1.6;text-align:left;color:var(--dsw-alias-label-primary,inherit);min-width:0;overflow-wrap:anywhere}',
  '.dsgc-msg.mine .dsgc-msgtext{background:var(--dsw-alias-button-info-fill,#4f6ef7);border-color:transparent;color:var(--dsw-alias-label-primary-foreground,#fff);white-space:pre-wrap;word-break:break-word}',
  '.dsgc-msgtext.live{opacity:.92}',
  '.dsgc-msg.live .dsgc-avatar{--presence-ring:color-mix(in srgb,var(--role-color,#4f6ef7) 22%,transparent);animation:dsgc-presence 1.8s ease-in-out infinite}',
  '.dsgc-think{margin:2px 0}',
  '.dsgc-think .dsgc-thinkrow{font-size:12px;color:var(--dsw-alias-label-secondary,inherit);border-radius:8px;padding:3px 8px;transition:background-color .12s}',
  '.dsgc-think .dsgc-thinkrow:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.1))}',
  '.dsgc-think .dsgc-thinksummary{color:var(--dsw-alias-label-tertiary,inherit);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:44ch;font-size:11.5px;margin-left:6px}',
  '.dsgc-think .dsgc-thinkbody{font-size:12.5px;line-height:1.7;color:var(--dsw-alias-label-secondary,inherit);white-space:pre-wrap;word-break:break-word;border-left:2px solid var(--dsw-alias-border-l2,rgba(128,128,128,.25));margin:2px 0 4px;padding:2px 0 2px 10px;max-height:320px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent;animation:dsgc-think-in .2s ease-out}',
  /* 首 delta 前的「思考中」占位行：ThinkRow 同语言（思考图标 + 次要色 12px 小字）
     + 三点交错呼吸动画——深度思考模型首字节可能等数秒到数十秒，空白气泡会被
     感知为卡死；delta 到达后被真实思考行/正文自然替换 */
  '.dsgc-pending{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--dsw-alias-label-secondary,inherit)}',
  '.dsgc-pending svg{flex:none}',
  '.dsgc-pendingdots{display:inline-flex;gap:2px;align-items:center}',
  '.dsgc-pendingdots i{width:3px;height:3px;border-radius:50%;background:currentColor;opacity:.3;animation:dsgc-dot-breathe 1.2s ease-in-out infinite}',
  '.dsgc-pendingdots i:nth-child(2){animation-delay:.2s}',
  '.dsgc-pendingdots i:nth-child(3){animation-delay:.4s}',
  '@keyframes dsgc-dot-breathe{0%,100%{opacity:.25}50%{opacity:1}}',
  '.dsgc-sysmsg{align-self:center;font-size:11.5px;color:var(--dsw-alias-label-secondary,inherit);background:var(--dsw-alias-bg-module-platform,rgba(128,128,128,.1));border-radius:999px;padding:2px 10px;text-align:center;max-width:90%;animation:dsgc-sys-in .24s ease-out}',
  /* ===== 工具调用行 / 确认卡片（对标思考折叠语言） ===== */
  '.dsgc-tool{margin:2px 0}',
  '.dsgc-tool .dsgc-toolrow{font-size:12px;color:var(--dsw-alias-label-secondary,inherit);border-radius:8px;padding:3px 8px;transition:background-color .12s}',
  '.dsgc-tool .dsgc-toolrow:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.1))}',
  '.dsgc-tool .dsgc-toolsummary{color:var(--dsw-alias-label-tertiary,inherit);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:40ch;font-size:11.5px;margin-left:6px}',
  '.dsgc-tool .dsgc-toolbody{font-size:12px;line-height:1.6;color:var(--dsw-alias-label-secondary,inherit);white-space:pre-wrap;word-break:break-word;border-left:2px solid var(--dsw-alias-border-l2,rgba(128,128,128,.25));margin:2px 0 4px;padding:2px 0 2px 10px;max-height:260px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent}',
  '.dsgc-confirm{border:1px solid var(--dsw-alias-state-business-primary,#4f6ef7);border-radius:12px;background:var(--dsw-alias-bg-layer-3,rgba(128,128,128,.06));padding:10px 12px;display:flex;flex-direction:column;gap:8px;max-width:76%;animation:dsgc-fade-in .18s ease-out}',
  '.dsgc-confirmtitle{font-size:12px;font-weight:600;color:var(--dsw-alias-label-primary,inherit);display:flex;align-items:center;gap:6px}',
  '.dsgc-confirmcmd{font-size:12px;line-height:1.6;white-space:pre-wrap;word-break:break-word;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));border-radius:8px;padding:8px 10px;background:var(--dsw-alias-bg-layer-2,transparent);color:var(--dsw-alias-label-primary,inherit);max-height:240px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent}',
  '.dsgc-confirmops{display:flex;gap:8px;justify-content:flex-end}',
  '.dsgc-sysmsg.err{color:var(--dsw-alias-state-error-primary,#e5484d)}',
  /* 清空确认弹窗内的说明列表 */
  '.dsgc-clearnotes{margin:0;padding-left:18px;font-size:13px;line-height:1.8;color:var(--dsw-alias-label-secondary,inherit);display:flex;flex-direction:column;gap:2px}',
  '.dsgc-err{font-size:12px;color:var(--dsw-alias-state-error-primary,#e5484d);animation:dsgc-fade-in .18s ease-out}',
  '.dsgc-empty{margin:auto;display:flex;flex-direction:column;align-items:center;gap:10px;color:var(--dsw-alias-label-tertiary,inherit);text-align:center;max-width:40ch;padding:24px;animation:dsgc-fade-in .3s ease-out}',
  '.dsgc-empty svg{opacity:.5}',
  '.dsgc-empty .dsgc-emptytitle{font-size:13px;font-weight:600;color:var(--dsw-alias-label-secondary,inherit)}',
  '.dsgc-empty .dsgc-hint{text-wrap:balance}',
  '.dsgc-tobottom{position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);z-index:12;animation:dsgc-rise-in .18s cubic-bezier(.16,1,.3,1)}',
  /* 回到底部：实底浮动胶囊（@弹层同款浮层配方——实底 + border-l2 + shadow-lv3），不与消息内容相互透底 */
  '.dsgc-tobtn{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));background:var(--dsw-alias-bg-layer-3,#fff);color:var(--dsw-alias-label-secondary,inherit);border-radius:999px;padding:5px 12px;font:inherit;font-size:12px;line-height:1.4;cursor:pointer;box-shadow:var(--dsw-shadow-lv3,0 8px 24px rgba(0,0,0,.18));transition:color .12s,border-color .12s}',
  '.dsgc-tobtn:hover{color:var(--dsw-alias-label-primary,inherit);border-color:var(--dsw-alias-border-l3,rgba(128,128,128,.4))}',
  /* ===== composer ===== */
  '.dsgc-composer{padding:12px 16px 14px;display:flex;flex-direction:column;gap:10px;position:relative}',
  /* 输入卡（对标主会话 composer 卡）：22px 圆角独立卡、input-major 实底、
     elevation-soft 软影（DESIGN.md 输入面豁免——输入面遵循宿主输入面语言，
     其余静止表面仍零阴影）；chips 等配置行留卡外 */
  '.dsgc-card{background:var(--dsw-specific-input-major,var(--dsw-alias-bg-layer-3,transparent));--dsw-elevation-stroke-color:var(--dsw-alias-border-l2,rgba(128,128,128,.3));box-shadow:var(--dsw-elevation-soft,0 1px 3px rgba(0,0,0,.08));border-radius:22px;padding:8px 0 0;display:flex;flex-direction:column;gap:8px;position:relative}',
  /* 输入区：非受控 contenteditable（React 不管子节点）；白空间与换行规则
     与序列化契约对齐（pre-wrap + <br>→\n） */
  '.dsgc-edit{display:block;box-sizing:border-box;width:100%;min-height:36px;max-height:180px;overflow-y:auto;outline:none;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;font:inherit;font-size:13px;line-height:24px;color:var(--dsw-alias-label-primary,inherit);caret-color:var(--dsw-alias-state-business-primary,#4f6ef7);scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent;position:relative;z-index:1}',
  '.dsgc-card .dsgc-edit{padding:6px 8px 0 14px}',
  /* 占位符 = 独立覆盖层（对齐主会话）：不用 ::before——生成内容会把聚焦光标
     顶到占位文字之后；覆盖层 pointer-events:none 不参与光标布局，
     与输入区同 padding 基准（左 14 / 上 6） */
  '.dsgc-ph{position:absolute;left:14px;top:6px;max-width:calc(100% - 22px);color:var(--dsw-alias-label-tertiary,inherit);pointer-events:none;user-select:none;font-size:13px;line-height:24px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
  /* @提及芯片（输入区内原子元素）：色点 + 角色色淡底胶囊——弹层候选行同语言 */
  '.dsgc-chipin{display:inline-flex;align-items:center;gap:4px;background:color-mix(in srgb,var(--role-color,#888) 15%,transparent);border-radius:999px;padding:1px 7px 1px 5px;margin:0 1px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-primary,inherit);white-space:nowrap;user-select:all}',
  '.dsgc-card .dsgc-sendrow{padding:0 12px 10px}',
  '.dsgc-stopbtn{background:var(--dsw-alias-state-error-primary,#e5484d);border-color:transparent;color:#fff;font-weight:600}',
  '.dsgc-stopbtn:hover:not(:disabled){filter:brightness(1.08);color:#fff}',
  '.dsgc-parts{display:flex;gap:6px;flex-wrap:wrap;align-items:center;row-gap:4px;height:24px}',
  '.dsgc-partslabel{font-size:12px;color:var(--dsw-alias-label-tertiary,inherit);flex:none}',
  '.dsgc-partchip{display:inline-flex;gap:6px;align-items:center;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));background:transparent;color:var(--dsw-alias-label-secondary,inherit);border-radius:999px;padding:2px 10px;font-size:12px;line-height:1.5;cursor:pointer;transition:background-color .12s,color .12s,border-color .12s;font-family:inherit}',
  '.dsgc-partchip:hover{color:var(--dsw-alias-label-primary,inherit)}',
  '.dsgc-partchip.on{background:var(--dsw-alias-interactive-bg-active,rgba(128,128,128,.18));color:var(--dsw-alias-label-primary,inherit);border-color:var(--dsw-alias-border-l2,rgba(128,128,128,.3))}',
  '.dsgc-partchip:disabled{opacity:.5;cursor:default}',
  '.dsgc-chipdot{width:8px;height:8px;border-radius:50%;flex:none;display:inline-block}',
  '.dsgc-sendrow{display:flex;gap:8px;align-items:center;justify-content:flex-end}',
  '.dsgc-sendrow button{white-space:nowrap}',
  /* ===== 权限档位选择器（对齐主会话 composer 左下角芯片） ===== */
  '.dsgc-permtrigger{min-width:0;max-width:220px;height:28px;color:var(--dsw-alias-label-secondary,inherit);cursor:pointer;background:transparent;border:none;border-radius:999px;outline:none;align-items:center;gap:4px;padding:0 4px 0 8px;font-size:13px;font-weight:500;line-height:20px;display:inline-flex;font-family:inherit;transition:background-color .12s,color .12s}',
  '.dsgc-permtrigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.15));color:var(--dsw-alias-label-primary,inherit)}',
  '.dsgc-permtrigger:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-border-l3,rgba(128,128,128,.4))}',
  '.dsgc-permtrigger:disabled{color:var(--dsw-alias-label-dimmed,inherit);cursor:default}',
  '.dsgc-permicon{flex:none;display:inline-flex}',
  '.dsgc-permicon svg{width:14px;height:14px}',
  '.dsgc-permlabel{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}',
  '.dsgc-permchevron{color:var(--dsw-alias-label-caption,inherit);flex:none;transition:transform .12s;display:inline-flex}',
  '.dsgc-permchevron.open{transform:rotate(180deg)}',
  '.dsgc-rounds{display:flex;gap:2px;align-items:center;font-size:12px;color:var(--dsw-alias-label-secondary,inherit);flex:none;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));border-radius:8px;padding:2px}',
  '.dsgc-rounds .dsgc-roundbtn{border:none;background:none;color:var(--dsw-alias-label-secondary,inherit);cursor:pointer;padding:3px;border-radius:5px;line-height:0;transition:background-color .12s,color .12s}',
  '.dsgc-rounds .dsgc-roundbtn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.15));color:var(--dsw-alias-label-primary,inherit)}',
  '.dsgc-rounds .dsgc-roundbtn:disabled{opacity:.4;cursor:default}',
  '.dsgc-rounds .dsgc-roundnum{width:26px;text-align:center;font-variant-numeric:tabular-nums;font-weight:600;color:var(--dsw-alias-label-primary,inherit)}',
  /* ===== @成员弹层 ===== */
  '.dsgc-mentionwrap{position:relative}',
  '.dsgc-mention{animation:dsgc-pop-in .16s cubic-bezier(.16,1,.3,1);position:absolute;left:0;right:0;bottom:calc(100% + 6px);background:var(--dsw-alias-bg-layer-3,#fff);border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));border-radius:10px;box-shadow:var(--dsw-shadow-lv3,0 8px 24px rgba(0,0,0,.18));max-height:220px;overflow-y:auto;padding:4px;z-index:30;display:flex;flex-direction:column;gap:2px;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent}',
  '.dsgc-mentionitem{display:flex;align-items:center;gap:8px;border:none;background:none;color:var(--dsw-alias-label-secondary,inherit);font:inherit;font-size:12.5px;text-align:left;cursor:pointer;padding:6px 8px;border-radius:6px;transition:background-color .12s,color .12s}',
  '.dsgc-mentionitem.on,.dsgc-mentionitem:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.15));color:var(--dsw-alias-label-primary,inherit)}',
  '.dsgc-mentionname{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}',
  '.dsgc-mentionmodel{font-size:11px;color:var(--dsw-alias-label-tertiary,inherit)}',
  '.dsgc-mentionhint{font-size:11px;color:var(--dsw-alias-label-tertiary,inherit);padding:2px 8px 1px}',
  '.dsgc-mention-file .dsgc-mentionitem.dsgc-hint{cursor:default;color:var(--dsw-alias-label-tertiary,inherit);justify-content:center}',
  '.dsgc-mention-file .dsgc-mentionitem.dsgc-hint:hover{background:none}',
  /* ===== 右上下文栏 ===== */
  '.dsgc-aside{width:304px;flex:none;display:flex;flex-direction:column;gap:10px;border-left:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2));padding:12px;min-height:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent;transition:width .28s cubic-bezier(.16,1,.3,1),opacity .18s ease,padding .28s cubic-bezier(.16,1,.3,1),border-left-width .28s cubic-bezier(.16,1,.3,1)}',
  /* 子元素经 flex 列默认 stretch 填满内容区（面板为 content-box、内容区实宽
     304px；旧版写死 280px 曾致右侧多出 24px 死区） */
  '.dsgc-aside>*{flex:none}',
  '.dsgc-aside.closed{width:0;opacity:0;padding-left:0;padding-right:0;border-left-width:0;visibility:hidden;transition:width .24s ease-in,opacity .16s ease-in,padding .24s ease-in,border-left-width .24s ease-in,visibility 0s .22s}',
  '.dsgc-sec{display:flex;flex-direction:column;gap:8px;flex:none}',
  '.dsgc-sechead{display:flex;align-items:center;gap:6px;font-weight:600;font-size:12px;color:var(--dsw-alias-label-tertiary,inherit);padding-top:2px}',
  '.dsgc-sechead .dsgc-secspacer{flex:1}',
  '.dsgc-seccount{font-weight:500;color:var(--dsw-alias-label-tertiary,inherit)}',
  '.dsgc-roles{display:flex;flex-direction:column;gap:8px}',
  '.dsgc-role{border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));background:var(--dsw-alias-bg-layer-3,transparent);border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:7px;transition:border-color .16s,background-color .16s;list-style:none;text-align:left;font:inherit;cursor:pointer;color:inherit}',
  '.dsgc-role:hover{border-color:var(--dsw-alias-label-dimmed,rgba(128,128,128,.5))}',
  '.dsgc-rolehead{display:flex;gap:8px;align-items:center}',
  '.dsgc-roledot{width:10px;height:10px;border-radius:50%;flex:none}',
  '.dsgc-rolename{font-weight:600;font-size:13px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-primary,inherit)}',
  '.dsgc-role.off .dsgc-rolename{color:var(--dsw-alias-label-tertiary,inherit)}',
  '.dsgc-rolepersona{font-size:11.5px;color:var(--dsw-alias-label-tertiary,inherit);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:0}',
  '.dsgc-rolemodel{width:fit-content;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:var(--dsw-alias-bg-module-platform,rgba(128,128,128,.12));border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px;color:var(--dsw-alias-label-secondary,inherit)}',
  '.dsgc-roleops{display:flex;gap:2px;flex:none;opacity:0;transition:opacity .12s}',
  '.dsgc-role:hover .dsgc-roleops,.dsgc-role:focus-within .dsgc-roleops{opacity:1}',
  '.dsgc-rolemenu{display:flex;align-items:center;justify-content:space-between;gap:8px}',
  /* ===== 表单与控件（角色抽屉内） ===== */
  '.dsgc-field{display:flex;flex-direction:column;gap:5px}',
  '.dsgc-field>label{font-size:12px;font-weight:500;color:var(--dsw-alias-label-secondary,inherit)}',
  '.dsgc-input,.dsgc-select,.dsgc-textarea{background:var(--dsw-specific-input-major,var(--dsw-alias-bg-layer-3,transparent));border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));color:var(--dsw-alias-label-primary,inherit);font:inherit;font-size:13px;border-radius:8px;padding:6px 10px;width:100%;box-sizing:border-box;outline:none;transition:border-color .16s,background-color .16s}',
  '.dsgc-input:focus,.dsgc-select:focus,.dsgc-textarea:focus{border-color:var(--dsw-alias-state-business-primary,#4f6ef7)}',
  '.dsgc-input::placeholder,.dsgc-textarea::placeholder{color:var(--dsw-alias-label-tertiary,inherit)}',
  '.dsgc-textarea{resize:vertical;min-height:76px}',
  '.dsgc-palette{display:flex;gap:6px;flex-wrap:wrap}',
  '.dsgc-dot{width:18px;height:18px;border-radius:50%;border:2px solid transparent;cursor:pointer;padding:0;transition:transform .12s}',
  '.dsgc-dot:hover{transform:scale(1.12)}',
  '.dsgc-dot.on{border-color:var(--dsw-alias-label-primary,#fff)}',
  '.dsgc-form{display:flex;flex-direction:column;gap:12px}',
  '.dsgc-formerr{font-size:12px;color:var(--dsw-alias-state-error-primary,#e5484d);line-height:1.5}',
  '.dsgc-selhint{font-size:12px;color:var(--dsw-alias-label-tertiary,inherit);line-height:1.5;display:flex;gap:6px;align-items:center;flex-wrap:wrap}',
  /* ===== 角色编辑抽屉（右侧滑出） ===== */
  '.dsgc-drawer{position:absolute;top:0;right:0;bottom:0;width:380px;max-width:calc(100% - 40px);z-index:20;background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-bg-base,#fff));border-left:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));box-shadow:-12px 0 32px rgba(0,0,0,.14);display:flex;flex-direction:column;animation:dsgc-drawer-in .22s cubic-bezier(.16,1,.3,1)}',
  '.dsgc-drawer.closing{animation:dsgc-drawer-out .14s ease-in forwards;pointer-events:none}',
  '@keyframes dsgc-drawer-in{from{transform:translateX(32px);opacity:0}to{transform:none;opacity:1}}',
  '@keyframes dsgc-drawer-out{to{transform:translateX(32px);opacity:0}}',
  '@keyframes dsgc-msg-in{from{opacity:0;transform:translateY(6px)}}',
  '@keyframes dsgc-sys-in{from{opacity:0;transform:scale(.96)}}',
  '@keyframes dsgc-think-in{from{opacity:0;transform:translateY(-3px)}}',
  '@keyframes dsgc-pop-in{from{opacity:0;transform:translateY(4px)}}',
  '@keyframes dsgc-rise-in{from{opacity:0;transform:translate(-50%,6px)}}',
  '@keyframes dsgc-fade-in{from{opacity:0}}',
  '@keyframes dsgc-presence{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--role-color,#4f6ef7) 0%,transparent)}50%{box-shadow:0 0 0 4px var(--presence-ring)}}',
  '.dsgc-drawerhead{display:flex;align-items:center;gap:8px;padding:14px 16px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2));flex:none}',
  '.dsgc-drawertitle{flex:1;font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary,inherit)}',
  '.dsgc-drawerbody{flex:1;overflow-y:auto;padding:16px;min-height:0;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent}',
  '.dsgc-drawerfoot{display:flex;gap:8px;justify-content:flex-end;padding:12px 16px;border-top:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2));flex:none}',
  /* ===== 文件浏览器（目录选择） ===== */
  '.dsgc-fb{border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));background:var(--dsw-alias-bg-layer-2,transparent);border-radius:8px;display:flex;flex-direction:column;gap:6px;padding:8px;animation:dsgc-fade-in .2s ease-out}',
  '.dsgc-fbhead{display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0}',
  '.dsgc-fbhead button{flex:none;white-space:nowrap}',
  '.dsgc-wsrow{display:flex;gap:6px;align-items:center;min-width:0}',
  '.dsgc-wsrow .dsgc-input{width:auto;flex:1;min-width:0}',
  '.dsgc-wsrow>button{flex:none;white-space:nowrap}',
  '.dsgc-nav>button{white-space:nowrap;overflow:hidden}',
  '.dsgc-fbpath{flex:1;min-width:0;font-size:11px;color:var(--dsw-alias-label-secondary,inherit);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '.dsgc-fblist{display:flex;flex-direction:column;gap:1px;max-height:220px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent}',
  '.dsgc-fbrow{display:flex;align-items:center;gap:7px;width:100%;border:none;background:none;color:var(--dsw-alias-label-primary,inherit);font:inherit;font-size:12.5px;text-align:left;cursor:pointer;padding:3px 8px;border-radius:6px;transition:background-color .12s}',
  '.dsgc-fbrow:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.15))}',
  '.dsgc-fbrow.dim{opacity:.55}',
  '.dsgc-fbrow.file{cursor:default}',
  '.dsgc-fbrow.file:hover{background:none}',
  '.dsgc-fbname{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '.dsgc-fbsize{flex:none;font-size:10.5px;color:var(--dsw-alias-label-tertiary,inherit)}',
  /* ===== 键盘焦点 ===== */
  '.dsgc-partchip:focus-visible,.dsgc-mentionitem:focus-visible,.dsgc-dot:focus-visible,.dsgc-opbtn:focus-visible,.dsgc-twist:focus-visible,.dsgc-addsess:focus-visible,.dsgc-grow-row:focus-visible,.dsgc-sess-row:focus-visible,.dsgc-rename:focus-visible,.dsgc-fbrow:focus-visible,.dsgc-role:focus-visible,.dsgc-roundbtn:focus-visible,.dsgc-tobtn:focus-visible,.dsgc-seambtn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,var(--dsw-alias-state-business-primary,#4f6ef7));outline-offset:1px}',
  /* ===== 窄容器：右栏覆盖式呈现 ===== */
  '@container (max-width: 880px){.dsgc-aside{position:absolute;top:0;right:0;bottom:0;z-index:15;width:min(304px,88%);box-shadow:-12px 0 32px rgba(0,0,0,.16);border-left:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));transition:transform .3s cubic-bezier(.16,1,.3,1),opacity .2s ease}.dsgc-aside.closed{width:min(304px,88%);padding-left:12px;padding-right:12px;border-left-width:1px;transform:translateX(calc(100% + 14px));opacity:0;transition:transform .26s ease-in,opacity .18s ease-in,visibility 0s .24s}.dsgc-seambtn.right:not(.closed){right:min(304px,88%)}}',
  '@container (max-width: 640px){.dsgc-nav{width:200px}.dsgc-msgbody{max-width:88%}}',
  /* ===== 侧边栏入口对齐（外壳将插槽内容包在 panelGlyph span 内，必须用后代 :has） ===== */
  '[class*="panelList"]:has(.dsgc-entryOverlay){margin-top:4px}',
  '[class*="panelRow"]:has(.dsgc-entryOverlay){position:relative;box-sizing:border-box;height:36px;min-height:36px;padding:0 10px;font-size:13px;transition:background-color .12s,color .12s}',
  '[class*="panelRow"][class*="panelActive"]:has(.dsgc-entryOverlay){font-weight:600}',
  /* 入口 hover：宿主 panelRow:hover 只给灰底、不变文字色（低强度到近无感）；
     对齐任务看板入口行——hover 灰底 + 文字/图标转 label-primary */
  '[class*="panelRow"]:has(.dsgc-entryOverlay):hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12));color:var(--dsw-alias-label-primary,inherit)}',
  /* DOM 注入式全幅视图（任务看板 data-dsh-taskboard-active / SSH data-dsh-ssh-active）
     激活时接管中央列：外壳面板状态机未变（activePanelId 仍指向群聊），但视图已被
     覆盖——群聊入口随之视觉复位，避免停留“激活”态误导当前所在视图。两行特异性
     相同（0,4,1），hover 行在后，复位不吞 hover 反馈 */
  'html[data-dsh-taskboard-active] [class*="panelRow"][class*="panelActive"]:has(.dsgc-entryOverlay),html[data-dsh-ssh-active] [class*="panelRow"][class*="panelActive"]:has(.dsgc-entryOverlay){background:transparent;color:var(--dsw-alias-label-secondary,inherit);font-weight:400}',
  'html[data-dsh-taskboard-active] [class*="panelRow"]:has(.dsgc-entryOverlay):hover,html[data-dsh-ssh-active] [class*="panelRow"]:has(.dsgc-entryOverlay):hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12));color:var(--dsw-alias-label-primary,inherit)}',
  /* 收起态例外：外壳把收起栏所有面板图标统一为 primary 色（激活与否不由颜色表达），
     复位规则不得把群聊图标调暗成 secondary；仅去掉激活底色即可 */
  'html[data-dsh-taskboard-active] [data-sidebar-collapsed] [class*="panelRow"]:has(.dsgc-entryOverlay),html[data-dsh-ssh-active] [data-sidebar-collapsed] [class*="panelRow"]:has(.dsgc-entryOverlay),html[data-dsh-taskboard-active] [class*="collapsed"] [class*="panelRow"]:has(.dsgc-entryOverlay),html[data-dsh-ssh-active] [class*="collapsed"] [class*="panelRow"]:has(.dsgc-entryOverlay){color:var(--dsw-alias-label-primary,inherit)}',
  '[class*="panelRow"]:has(.dsgc-entryOverlay) > [class*="panelTitle"]{padding-left:24px}',
  '.dsgc-entryOverlay{position:absolute;inset:0;display:flex;align-items:center;padding:0 10px;box-sizing:border-box}',
  '.dsgc-entryIcon{flex:none;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center}',
  '.dsgc-entryIcon svg{width:18px;height:18px;display:block}',
  '[data-sidebar-collapsed] .dsgc-entryOverlay,[class*="collapsed"] .dsgc-entryOverlay{justify-content:center;padding:0}',
  '[data-sidebar-collapsed] [class*="panelRow"]:has(.dsgc-entryOverlay),[class*="collapsed"] [class*="panelRow"]:has(.dsgc-entryOverlay){margin:0 auto}',
  '@media (prefers-reduced-motion:reduce){.dsgc-dot,.dsgc-partchip,.dsgc-mentionitem,.dsgc-grow-row,.dsgc-sess-row,.dsgc-opbtn,.dsgc-addsess,.dsgc-topic,.dsgc-role,.dsgc-rename,.dsgc-input,.dsgc-select,.dsgc-textarea,.dsgc-fbrow,.dsgc-twist svg,.dsgc-roleops,.dsgc-roundbtn,.dsgc-permtrigger,.dsgc-permchevron,.dsgc-tobtn,.dsgc-seambtn,.dsgc-aside,.dsgc-aside.closed,.dsgc-nav,.dsgc-nav.closed,.dsgc-clearbtn,[class*="panelRow"]:has(.dsgc-entryOverlay){transition:none}.dsgc-dot:hover{transform:none}.dsgc-drawer,.dsgc-msg,.dsgc-sysmsg,.dsgc-mention,.dsgc-tobottom,.dsgc-err,.dsgc-empty,.dsgc-fb,.dsgc-think .dsgc-thinkbody,.dsgc-msg.live .dsgc-avatar,.dsgc-loading svg,.dsgc-pendingdots i,.dsgc-typing{animation:none}.dsgc-typing{background-position:0 0;background-size:100% 100%}}',
  /* ===== 设置页（同一卡片语言） ===== */
  '.dgcs-page{display:flex;flex-direction:column;gap:14px;padding:4px 0}',
  '.dgcs-head{display:flex;flex-direction:column;gap:6px}',
  '.dgcs-title{margin:0;font-size:15px;font-weight:600;line-height:1.4;color:var(--dsw-alias-label-primary,inherit)}',
  '.dgcs-desc{margin:0;font-size:13px;line-height:1.6;color:var(--dsw-alias-label-secondary,inherit)}',
  '.dgcs-card{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));background:var(--dsw-alias-bg-layer-3,transparent);border-radius:12px;padding:14px 16px;transition:border-color .16s}',
  '.dgcs-cardtext{display:flex;flex-direction:column;gap:3px;min-width:0}',
  '.dgcs-cardtitle{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary,inherit)}',
  '.dgcs-cardhint{font-size:12px;color:var(--dsw-alias-label-tertiary,inherit)}',
].join('\n')

/** 工厂执行时幂等注入样式标签（loader 卸载时按 data-plugin 摘除）。 */
export function injectStyles(): void {
  if (typeof document === 'undefined') return
  if (document.querySelector('style[data-plugin-css=' + JSON.stringify(TAG_ID) + ']') === null) {
    const tag = document.createElement('style')
    tag.dataset.plugin = 'dsh-group-chat'
    tag.dataset.pluginCss = TAG_ID
    tag.textContent = CSS
    document.head.appendChild(tag)
  }
}
