window.__ModuleLoader__.load({
	id: "@roaming-ai/dsh-group-chat",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __create = Object.create;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
			value: mod,
			enumerable: true
		}) : target, mod));
		//#endregion
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		_deepseek_ai_dsh_client_ui_primitives = __toESM(_deepseek_ai_dsh_client_ui_primitives, 1);
		let react_jsx_runtime = require("react/jsx-runtime");
		let react_dom = require("react-dom");
		let react_dom_client = require("react-dom/client");
		//#region src/client/lib/styles.ts
		/**
		* 浏览器半样式：CSS 以内联字符串承载（刻意不迁移 CSS Modules 管线——
		* 类名需保持原样，侧栏入口的 “newSession” 类名是任务看板等 DOM 注入式
		* 面板识别“侧边栏导航点击”的跨插件标记，哈希化会破坏该约定）。
		* 工厂执行时幂等注入 <style>，loader 卸载时按 data-plugin 摘除标签。
		* @module dsh-group-chat/client/styles
		*/
		/** 注入标签的唯一 id。 */
		const TAG_ID = "dsh-group-chat/styles.css";
		const CSS = [
			".dsgc-root{display:flex;height:100%;min-height:0;background:var(--dsw-alias-bg-base,transparent);color:var(--dsw-alias-label-primary,inherit);font-size:var(--dsh-content-font-size,14px);container-type:inline-size;position:relative}",
			".dsgc-loading{padding:24px;color:var(--dsw-alias-label-tertiary,inherit);display:flex;gap:8px;align-items:center;opacity:0;animation:dsgc-loading-in .18s ease-out .15s forwards}",
			"@keyframes dsgc-loading-in{to{opacity:1}}",
			".dsgc-loading svg{animation:dsgc-spin 1s linear infinite}",
			"@keyframes dsgc-spin{to{transform:rotate(360deg)}}",
			".dsgc-nav{width:232px;flex:none;display:flex;flex-direction:column;gap:8px;border-right:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2));padding:12px 10px;min-height:0;min-width:0;transition:width .28s cubic-bezier(.16,1,.3,1),opacity .18s ease,padding .28s cubic-bezier(.16,1,.3,1),border-right-width .28s cubic-bezier(.16,1,.3,1)}",
			".dsgc-nav>*{flex:none}",
			".dsgc-nav.closed{width:0;opacity:0;padding-left:0;padding-right:0;border-right-width:0;visibility:hidden;transition:width .24s ease-in,opacity .16s ease-in,padding .24s ease-in,border-right-width .24s ease-in,visibility 0s .22s}",
			".dsgc-search{flex:none}",
			".dsgc-search input{font-size:13px}",
			".dsgc-search:focus-within{border-color:var(--dsw-alias-state-business-primary,#4f6ef7)}",
			".dsgc-tree{display:flex;flex-direction:column;gap:6px;flex:1;overflow-y:auto;min-height:0;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent}",
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
			".dsgc-cdel{display:inline-flex;align-items:center;flex:none}",
			".dsgc-nodeops:has(.dsgc-cdel.armed){display:inline-flex}",
			".dsgc-roleops:has(.dsgc-cdel.armed){opacity:1}",
			".dsgc-cdel-bin{border:none;background:none;cursor:pointer;padding:2px;border-radius:4px;line-height:0;color:var(--dsw-alias-label-tertiary,inherit);transition:background-color .12s,color .12s}",
			".dsgc-cdel-bin:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.15))}",
			".dsgc-cdel.armed .dsgc-cdel-bin{color:var(--dsw-alias-state-error-primary,#e5484d)}",
			".dsgc-cdel-lid{transform-origin:2.4px 4.4px;transition:transform .16s cubic-bezier(.16,1,.3,1)}",
			".dsgc-cdel.armed .dsgc-cdel-lid{transform:translateY(-1.4px) rotate(-16deg)}",
			".dsgc-cdel-panel{display:inline-flex;gap:2px;overflow:hidden;max-width:0;opacity:0;visibility:hidden;transition:max-width .12s ease-in,opacity .12s ease-in,margin .12s ease-in,visibility 0s .12s}",
			".dsgc-cdel.armed .dsgc-cdel-panel{max-width:40px;opacity:1;visibility:visible;margin-right:2px;transition:max-width .16s cubic-bezier(.16,1,.3,1),opacity .16s ease,margin .16s cubic-bezier(.16,1,.3,1),visibility 0s}",
			".dsgc-cdel-yes,.dsgc-cdel-no{border:none;background:none;cursor:pointer;padding:2px;border-radius:4px;line-height:0;transition:background-color .12s,color .12s;flex:none}",
			".dsgc-cdel-yes{color:var(--dsw-alias-state-error-primary,#e5484d)}",
			".dsgc-cdel-no{color:var(--dsw-alias-label-tertiary,inherit)}",
			".dsgc-cdel-yes:hover{background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#e5484d) 10%,transparent)}",
			".dsgc-cdel-no:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.15));color:var(--dsw-alias-label-primary,inherit)}",
			".dsgc-sess-list{display:flex;flex-direction:column;gap:2px;margin:4px 0 2px 4px;padding-left:12px;border-left:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.15))}",
			".dsgc-sess-row{display:flex;align-items:center;gap:6px;min-width:0;border:none;background:none;border-radius:6px;padding:6px 8px;font-size:12.5px;line-height:1.5;color:var(--dsw-alias-label-secondary,inherit);transition:background-color .12s,color .12s;cursor:pointer;text-align:left;font-family:inherit}",
			".dsgc-sess-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12));color:var(--dsw-alias-label-primary,inherit)}",
			".dsgc-sess-row.on{background:var(--dsw-alias-interactive-bg-active,rgba(128,128,128,.2));color:var(--dsw-alias-label-primary,inherit);font-weight:600}",
			".dsgc-sess-status{flex:none;width:8px;height:8px;display:inline-flex;justify-content:center;align-items:center}",
			".dsgc-sess-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
			".dsgc-addsess{border:none;background:none;color:var(--dsw-alias-label-tertiary,inherit);cursor:pointer;text-align:left;font-size:12px;line-height:1.5;padding:5px 8px;border-radius:6px;transition:background-color .12s,color .12s;font-family:inherit;display:flex;align-items:center;gap:5px;white-space:nowrap;overflow:hidden}",
			".dsgc-addsess:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12));color:var(--dsw-alias-label-primary,inherit)}",
			".dsgc-rename{font:inherit;font-weight:400;font-size:12.5px;min-width:0;flex:1;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));background:var(--dsw-specific-input-major,var(--dsw-alias-bg-layer-3,transparent));color:inherit;border-radius:6px;padding:1px 6px;outline:none;transition:border-color .16s}",
			".dsgc-rename:focus{border-color:var(--dsw-alias-state-business-primary,#4f6ef7)}",
			".dsgc-hint{font-size:12px;color:var(--dsw-alias-label-tertiary,inherit);line-height:1.5;text-wrap:balance}",
			".dsgc-chat{flex:1;display:flex;flex-direction:column;min-width:0;min-height:0;position:relative}",
			".dsgc-seambtn{position:absolute;top:50%;transform:translateY(-50%);z-index:14;width:24px;height:56px;display:flex;align-items:center;justify-content:center;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));background:var(--dsw-alias-bg-layer-3,#fff);color:var(--dsw-alias-label-secondary,inherit);cursor:pointer;transition:background-color .12s,color .12s,border-color .12s,right .3s cubic-bezier(.16,1,.3,1)}",
			".dsgc-seambtn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.15));color:var(--dsw-alias-label-primary,inherit);border-color:var(--dsw-alias-border-l3,rgba(128,128,128,.4))}",
			".dsgc-seambtn.left{left:0;border-left:none;border-radius:0 8px 8px 0;box-shadow:3px 0 10px rgba(0,0,0,.07)}",
			".dsgc-seambtn.right{right:0;border-right:none;border-radius:8px 0 0 8px;box-shadow:-3px 0 10px rgba(0,0,0,.07)}",
			".dsgc-chathead{display:flex;flex-direction:column;gap:6px;padding:12px 16px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2))}",
			".dsgc-chathead-row{display:flex;gap:10px;align-items:center;min-width:0}",
			".dsgc-constraints{align-self:center;box-sizing:border-box;width:76%;max-width:76%;display:flex;flex-direction:column;gap:8px;min-width:0;padding:10px 12px;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));background:var(--dsw-alias-bg-layer-3,rgba(128,128,128,.06));border-radius:12px;animation:dsgc-fade-in .18s ease-out}",
			".dsgc-chead{display:flex;flex-direction:column;gap:2px;min-width:0}",
			".dsgc-ctitle{margin:0;font:inherit;font-size:12px;font-weight:600;line-height:1.5;color:var(--dsw-alias-label-primary,inherit)}",
			".dsgc-cdesc{margin:0;font-size:11.5px;line-height:1.5;color:var(--dsw-alias-label-tertiary,inherit)}",
			".dsgc-fold{display:grid;grid-template-rows:0fr;transition:grid-template-rows .16s ease-in}",
			".dsgc-fold.open{grid-template-rows:1fr;transition:grid-template-rows .22s cubic-bezier(.16,1,.3,1)}",
			".dsgc-fold-inner{min-height:0;overflow:hidden;display:flex;flex-direction:column;gap:2px;opacity:0;transition:opacity .12s ease-in}",
			".dsgc-fold.open .dsgc-fold-inner{opacity:1;transition:opacity .18s cubic-bezier(.16,1,.3,1)}",
			".dsgc-clip{--dsgc-clip-from:var(--dsw-alias-bg-layer-3,rgba(128,128,128,.18));position:relative;min-width:0}",
			".dsgc-clip::before,.dsgc-clip::after{content:\"\";position:absolute;left:0;right:0;height:14px;pointer-events:none;z-index:1;opacity:0;transition:opacity .12s}",
			".dsgc-clip::before{top:0;background:linear-gradient(to bottom,var(--dsgc-clip-from),transparent)}",
			".dsgc-clip::after{bottom:0;background:linear-gradient(to top,var(--dsgc-clip-from),transparent)}",
			".dsgc-clip.can-up::before,.dsgc-clip.can-down::after{opacity:1}",
			".dsgc-clip-scroll{min-width:0;overflow-y:auto;overscroll-behavior:contain;overflow-anchor:none;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent}",
			".dsgc-clist{display:flex;flex-direction:column;gap:2px;min-width:0}",
			".dsgc-constraint{display:flex;gap:8px;align-items:flex-start;min-width:0;font-size:11.5px;line-height:1.5}",
			".dsgc-ckind{flex:none;font-weight:500}",
			".dsgc-ckind.decided{color:var(--dsw-alias-label-secondary,inherit)}",
			".dsgc-ckind.rejected{color:var(--dsw-alias-state-error-primary,#e5484d)}",
			".dsgc-ckind.open{color:var(--dsw-alias-label-tertiary,inherit)}",
			".dsgc-ctext{min-width:0;color:var(--dsw-alias-label-primary,inherit);overflow-wrap:break-word}",
			".dsgc-cmore{align-self:flex-start;border:none;background:none;padding:0;font:inherit;font-size:11.5px;line-height:1.5;color:var(--dsw-alias-label-tertiary,inherit);cursor:pointer}",
			".dsgc-cmore:hover{color:var(--dsw-alias-label-secondary,inherit)}",
			".dsgc-cmore:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,var(--dsw-alias-state-business-primary,#4f6ef7));outline-offset:1px}",
			".dsgc-sess-title{flex:none;font-weight:600;font-size:14px;color:var(--dsw-alias-label-primary,inherit);max-width:30%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
			".dsgc-topic{flex:1;background:transparent;border:none;border-bottom:1px solid transparent;padding:2px;min-height:20px;color:var(--dsw-alias-label-secondary,inherit);font:inherit;outline:none;min-width:0;transition:color .12s,border-color .12s}",
			".dsgc-topic:hover{border-bottom-color:var(--dsw-alias-border-l2,rgba(128,128,128,.3))}",
			".dsgc-topic:focus{color:var(--dsw-alias-label-primary,inherit);border-bottom-color:var(--dsw-alias-state-business-primary,#4f6ef7)}",
			".dsgc-topic::placeholder{color:var(--dsw-alias-label-tertiary,inherit)}",
			".dsgc-chathead .dsgc-clearbtn{transition:background-color .12s,color .12s}",
			".dsgc-chathead .dsgc-clearbtn:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#e5484d) 10%,transparent);color:var(--dsw-alias-state-error-primary,#e5484d)}",
			".dsgc-chathead .dsgc-clearbtn:active:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#e5484d) 16%,transparent)}",
			".dsgc-msgs{flex:1;overflow-y:auto;padding:20px 24px 16px;display:flex;flex-direction:column;gap:16px;min-height:0;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent}",
			".dsgc-msg{display:flex;gap:10px;align-items:flex-start;max-width:100%;animation:dsgc-msg-in .22s cubic-bezier(.16,1,.3,1)}",
			".dsgc-msg.mine{flex-direction:row-reverse}",
			".dsgc-avatar{width:28px;height:28px;box-sizing:border-box;border:2px solid var(--dsw-alias-border-l3,rgba(128,128,128,.4));border-radius:50%;background:var(--dsw-alias-bg-module-platform,rgba(128,128,128,.12));color:var(--dsw-alias-label-primary,inherit);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex:none;margin-top:1px}",
			".dsgc-avatar.mine{border-color:transparent;background:var(--dsw-alias-button-info-fill,#4f6ef7);color:var(--dsw-alias-label-primary-foreground,#fff)}",
			".dsgc-avatar .dsgc-orb{display:block}",
			".dsgc-msgbody{max-width:76%;min-width:0;display:flex;flex-direction:column;gap:5px}",
			".dsgc-msg.mine .dsgc-msgbody{align-items:flex-end}",
			".dsgc-msghead{display:flex;gap:6px;align-items:center;min-width:0;font-size:12px;color:var(--dsw-alias-label-secondary,inherit)}",
			".dsgc-msgname{font-weight:600;color:var(--dsw-alias-label-primary,inherit);white-space:nowrap}",
			".dsgc-msgmodel{background:var(--dsw-alias-bg-module-platform,rgba(128,128,128,.12));border-radius:999px;padding:0 7px;font-size:10.5px;font-weight:500;line-height:16px;color:var(--dsw-alias-label-secondary,inherit);white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}",
			".dsgc-msgtime{font-size:10.5px;color:var(--dsw-alias-label-tertiary,inherit);white-space:nowrap}",
			".dsgc-typing{background:linear-gradient(90deg,var(--dsw-static-deepseek-500,#4176e6) 0%,var(--dsw-static-deepseek-500,#4176e6) 40%,var(--dsw-static-deepseek-200,#d3e2ff) 50%,var(--dsw-static-deepseek-500,#4176e6) 60%,var(--dsw-static-deepseek-500,#4176e6) 100%);color:#0000;-webkit-text-fill-color:transparent;background-position:100% 0;background-size:250% 100%;-webkit-background-clip:text;background-clip:text;font-weight:600;animation:dsgc-typing-shimmer 1.2s linear infinite}",
			"@keyframes dsgc-typing-shimmer{to{background-position:0 0}}",
			".dsgc-msgtext{background:var(--dsw-alias-bg-layer-3,rgba(128,128,128,.06));border:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.15));padding:10px 14px;border-radius:12px;line-height:1.6;text-align:left;color:var(--dsw-alias-label-primary,inherit);min-width:0;overflow-wrap:anywhere}",
			".dsgc-msg.mine .dsgc-msgtext{background:var(--dsw-alias-button-info-fill,#4f6ef7);border-color:transparent;color:var(--dsw-alias-label-primary-foreground,#fff);white-space:pre-wrap;word-break:break-word}",
			".dsgc-msgtext.live{opacity:.92}",
			".dsgc-think{margin:2px 0}",
			".dsgc-think .dsgc-thinkrow{font-size:12px;color:var(--dsw-alias-label-secondary,inherit);border-radius:8px;padding:3px 8px;transition:background-color .12s}",
			".dsgc-think .dsgc-thinkrow:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.1))}",
			".dsgc-think .dsgc-thinksummary{color:var(--dsw-alias-label-tertiary,inherit);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:44ch;font-size:11.5px;margin-left:6px}",
			".dsgc-think .dsgc-clip{margin:2px 0 4px;padding-left:10px;border-left:2px solid var(--dsw-alias-border-l2,rgba(128,128,128,.25))}",
			".dsgc-think .dsgc-thinkbody{font-size:12.5px;line-height:1.7;color:var(--dsw-alias-label-secondary,inherit);white-space:pre-wrap;word-break:break-word}",
			".dsgc-pending{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--dsw-alias-label-secondary,inherit)}",
			".dsgc-pending svg{flex:none}",
			".dsgc-pendingdots{display:inline-flex;gap:2px;align-items:center}",
			".dsgc-pendingdots i{width:3px;height:3px;border-radius:50%;background:currentColor;opacity:.3;animation:dsgc-dot-breathe 1.2s ease-in-out infinite}",
			".dsgc-pendingdots i:nth-child(2){animation-delay:.2s}",
			".dsgc-pendingdots i:nth-child(3){animation-delay:.4s}",
			"@keyframes dsgc-dot-breathe{0%,100%{opacity:.25}50%{opacity:1}}",
			".dsgc-sysmsg{align-self:center;font-size:11.5px;color:var(--dsw-alias-label-secondary,inherit);background:var(--dsw-alias-bg-module-platform,rgba(128,128,128,.1));border-radius:999px;padding:2px 10px;text-align:center;max-width:90%;animation:dsgc-sys-in .24s ease-out}",
			".dsgc-msgops{display:inline-flex;align-items:center;gap:2px;margin-top:2px;min-height:24px;visibility:hidden;opacity:0;transition:opacity .12s,visibility .12s}",
			".dsgc-msg:hover .dsgc-msgops,.dsgc-msg:focus-within .dsgc-msgops,.dsgc-msgops.always{visibility:visible;opacity:1}",
			"@media (hover:none){.dsgc-msg .dsgc-msgops{visibility:visible;opacity:1}}",
			".dsgc-msg.mine .dsgc-msgops{justify-content:flex-end}",
			".dsgc-msgdur{margin-left:8px;flex:none;font-size:10.5px;font-weight:500;color:var(--dsw-alias-label-tertiary,inherit);font-variant-numeric:tabular-nums;line-height:1;white-space:nowrap}",
			".dsgc-msgop{border:none;background:none;color:var(--dsw-alias-label-tertiary,inherit);cursor:pointer;padding:3px 6px;border-radius:6px;display:inline-flex;align-items:center;gap:4px;font:inherit;font-size:11.5px;line-height:16px;transition:background-color .12s,color .12s}",
			".dsgc-msgop svg{flex:none}",
			".dsgc-msgop:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.15));color:var(--dsw-alias-label-primary,inherit)}",
			".dsgc-msgop:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,var(--dsw-alias-state-business-primary,#4f6ef7));outline-offset:1px}",
			".dsgc-msgop.done{color:var(--dsw-alias-state-success-primary,#30a46c)}",
			".dsgc-msgop.retry{color:var(--dsw-alias-state-error-primary,#e5484d)}",
			".dsgc-msgop.retry:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#e5484d) 10%,transparent);color:var(--dsw-alias-state-error-primary,#e5484d)}",
			".dsgc-msgop:disabled{opacity:.4;cursor:default}",
			".dsgc-fail{background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#e5484d) 8%,var(--dsw-alias-bg-layer-3,rgba(128,128,128,.06)));border:1px solid color-mix(in srgb,var(--dsw-alias-state-error-primary,#e5484d) 28%,var(--dsw-alias-border-l1,rgba(128,128,128,.15)));border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:6px;min-width:0;animation:dsgc-fade-in .18s ease-out}",
			".dsgc-failhead{display:flex;align-items:flex-start;gap:8px;min-width:0}",
			".dsgc-failicon{flex:none;width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:var(--dsw-alias-state-error-primary,#e5484d);background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#e5484d) 12%,transparent);margin-top:1px}",
			".dsgc-failcopy{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}",
			".dsgc-failtitle{font-size:13px;font-weight:600;line-height:1.4;color:var(--dsw-alias-label-primary,inherit)}",
			".dsgc-faildetail{font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary,inherit);overflow-wrap:anywhere}",
			".dsgc-failmore{align-self:flex-start;border:none;background:none;padding:0;font:inherit;font-size:11.5px;line-height:1.5;color:var(--dsw-alias-label-tertiary,inherit);cursor:pointer}",
			".dsgc-failmore:hover{color:var(--dsw-alias-label-secondary,inherit)}",
			".dsgc-failmore:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,var(--dsw-alias-state-business-primary,#4f6ef7));outline-offset:1px}",
			".dsgc-fail .dsgc-clip{--dsgc-clip-from:var(--dsw-alias-bg-layer-2,rgba(128,128,128,.12));border-radius:8px}",
			".dsgc-failraw{margin:0;font-size:11.5px;line-height:1.55;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;padding:8px 10px;border-radius:8px;background:var(--dsw-alias-bg-layer-2,transparent);color:var(--dsw-alias-label-secondary,inherit)}",
			".dsgc-tool{margin:2px 0}",
			".dsgc-tool .dsgc-toolrow{font-size:12px;color:var(--dsw-alias-label-secondary,inherit);border-radius:8px;padding:3px 8px;transition:background-color .12s}",
			".dsgc-tool .dsgc-toolrow:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.1))}",
			".dsgc-tool .dsgc-toolsummary{color:var(--dsw-alias-label-tertiary,inherit);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:40ch;font-size:11.5px;margin-left:6px}",
			".dsgc-tool .dsgc-clip{margin:2px 0 4px;padding-left:10px;border-left:2px solid var(--dsw-alias-border-l2,rgba(128,128,128,.25))}",
			".dsgc-tool .dsgc-toolbody{font-size:12px;line-height:1.6;color:var(--dsw-alias-label-secondary,inherit);white-space:pre-wrap;word-break:break-word}",
			".dsgc-confirm{border:1px solid var(--dsw-alias-state-business-primary,#4f6ef7);border-radius:12px;background:var(--dsw-alias-bg-layer-3,rgba(128,128,128,.06));padding:10px 12px;display:flex;flex-direction:column;gap:8px;max-width:76%;animation:dsgc-fade-in .18s ease-out}",
			".dsgc-confirmtitle{font-size:12px;font-weight:600;color:var(--dsw-alias-label-primary,inherit);display:flex;align-items:center;gap:6px}",
			".dsgc-confirmcmd{font-size:12px;line-height:1.6;white-space:pre-wrap;word-break:break-word;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));border-radius:8px;padding:8px 10px;background:var(--dsw-alias-bg-layer-2,transparent);color:var(--dsw-alias-label-primary,inherit);max-height:240px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent}",
			".dsgc-confirmops{display:flex;gap:8px;justify-content:flex-end}",
			".dsgc-clearnotes{margin:0;padding-left:18px;font-size:13px;line-height:1.8;color:var(--dsw-alias-label-secondary,inherit);display:flex;flex-direction:column;gap:2px}",
			".dsgc-err{font-size:12px;color:var(--dsw-alias-state-error-primary,#e5484d);animation:dsgc-fade-in .18s ease-out}",
			".dsgc-empty{margin:auto;display:flex;flex-direction:column;align-items:center;gap:10px;color:var(--dsw-alias-label-tertiary,inherit);text-align:center;max-width:40ch;padding:24px;animation:dsgc-fade-in .3s ease-out}",
			".dsgc-empty svg{opacity:.5}",
			".dsgc-empty .dsgc-emptytitle{font-size:13px;font-weight:600;color:var(--dsw-alias-label-secondary,inherit)}",
			".dsgc-empty .dsgc-hint{text-wrap:balance}",
			".dsgc-tobottom{position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);z-index:12;animation:dsgc-rise-in .18s cubic-bezier(.16,1,.3,1)}",
			".dsgc-tobtn{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));background:var(--dsw-alias-bg-layer-3,#fff);color:var(--dsw-alias-label-secondary,inherit);border-radius:999px;padding:5px 12px;font:inherit;font-size:12px;line-height:1.4;cursor:pointer;box-shadow:var(--dsw-shadow-lv3,0 8px 24px rgba(0,0,0,.18));transition:color .12s,border-color .12s}",
			".dsgc-tobtn:hover{color:var(--dsw-alias-label-primary,inherit);border-color:var(--dsw-alias-border-l3,rgba(128,128,128,.4))}",
			".dsgc-composer{padding:12px 16px 14px;display:flex;flex-direction:column;gap:10px;position:relative}",
			".dsgc-card{background:var(--dsw-specific-input-major,var(--dsw-alias-bg-layer-3,transparent));--dsw-elevation-stroke-color:var(--dsw-alias-border-l2,rgba(128,128,128,.3));box-shadow:var(--dsw-elevation-soft,0 1px 3px rgba(0,0,0,.08));border-radius:22px;padding:8px 0 0;display:flex;flex-direction:column;gap:8px;position:relative}",
			".dsgc-edit{display:block;box-sizing:border-box;width:100%;min-height:36px;max-height:180px;overflow-y:auto;outline:none;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;font:inherit;font-size:13px;line-height:24px;color:var(--dsw-alias-label-primary,inherit);caret-color:var(--dsw-alias-state-business-primary,#4f6ef7);scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent;position:relative;z-index:1}",
			".dsgc-card .dsgc-edit{padding:6px 8px 0 14px}",
			".dsgc-ph{position:absolute;left:14px;top:6px;max-width:calc(100% - 22px);color:var(--dsw-alias-label-tertiary,inherit);pointer-events:none;user-select:none;font-size:13px;line-height:24px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
			".dsgc-chipin{display:inline-flex;align-items:center;gap:4px;background:color-mix(in srgb,var(--role-color,#888) 15%,transparent);border-radius:999px;padding:1px 7px 1px 5px;margin:0 1px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-primary,inherit);white-space:nowrap;user-select:all}",
			".dsgc-card .dsgc-sendrow{padding:0 12px 10px}",
			"button.dsgc-stopbtn{background:var(--dsw-alias-state-error-primary,#e5484d);border-color:transparent;color:#fff;font-weight:600}",
			"button.dsgc-stopbtn:hover:not(:disabled){background:var(--dsw-alias-state-error-primary,#e5484d);filter:brightness(1.08);color:#fff}",
			".dsgc-parts{display:flex;align-items:flex-start;gap:6px;min-height:24px}",
			".dsgc-partslabel{font-size:12px;line-height:24px;color:var(--dsw-alias-label-tertiary,inherit);flex:none}",
			".dsgc-partlist{display:flex;flex-wrap:wrap;align-items:center;gap:6px;row-gap:4px;flex:1;min-width:0}",
			".dsgc-partchip{display:inline-flex;gap:6px;align-items:center;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));background:transparent;color:var(--dsw-alias-label-secondary,inherit);border-radius:999px;padding:2px 10px;font-size:12px;line-height:1.5;cursor:pointer;transition:background-color .12s,color .12s,border-color .12s;font-family:inherit}",
			".dsgc-partchip:hover{color:var(--dsw-alias-label-primary,inherit)}",
			".dsgc-partchip.on{background:var(--dsw-alias-interactive-bg-active,rgba(128,128,128,.18));color:var(--dsw-alias-label-primary,inherit);border-color:var(--dsw-alias-border-l2,rgba(128,128,128,.3))}",
			".dsgc-partchip:disabled{opacity:.5;cursor:default}",
			".dsgc-chipdot{width:8px;height:8px;border-radius:50%;flex:none;display:inline-block}",
			".dsgc-sendrow{display:flex;gap:8px;align-items:center;justify-content:flex-end}",
			".dsgc-sendrow button{white-space:nowrap}",
			".dsgc-permtrigger{min-width:0;max-width:220px;height:28px;color:var(--dsw-alias-label-secondary,inherit);cursor:pointer;background:transparent;border:none;border-radius:999px;outline:none;align-items:center;gap:4px;padding:0 4px 0 8px;font-size:13px;font-weight:500;line-height:20px;display:inline-flex;font-family:inherit;transition:background-color .12s,color .12s}",
			".dsgc-permtrigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.15));color:var(--dsw-alias-label-primary,inherit)}",
			".dsgc-permtrigger:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-border-l3,rgba(128,128,128,.4))}",
			".dsgc-permtrigger:disabled{color:var(--dsw-alias-label-dimmed,inherit);cursor:default}",
			".dsgc-permicon{flex:none;display:inline-flex}",
			".dsgc-permicon svg{width:14px;height:14px}",
			".dsgc-permlabel{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}",
			".dsgc-permchevron{color:var(--dsw-alias-label-caption,inherit);flex:none;transition:transform .12s;display:inline-flex}",
			".dsgc-permchevron.open{transform:rotate(180deg)}",
			".dsgc-rounds{display:flex;gap:2px;align-items:center;font-size:12px;color:var(--dsw-alias-label-secondary,inherit);flex:none;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));border-radius:8px;padding:2px}",
			".dsgc-rounds .dsgc-roundbtn{border:none;background:none;color:var(--dsw-alias-label-secondary,inherit);cursor:pointer;padding:3px;border-radius:5px;line-height:0;transition:background-color .12s,color .12s}",
			".dsgc-rounds .dsgc-roundbtn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.15));color:var(--dsw-alias-label-primary,inherit)}",
			".dsgc-rounds .dsgc-roundbtn:disabled{opacity:.4;cursor:default}",
			".dsgc-rounds .dsgc-roundnum{width:26px;text-align:center;font-variant-numeric:tabular-nums;font-weight:600;color:var(--dsw-alias-label-primary,inherit)}",
			".dsgc-roll{display:inline-flex;font-variant-numeric:tabular-nums;line-height:1}",
			".dsgc-roll-col{display:inline-block;height:1em;overflow:hidden;line-height:1}",
			".dsgc-roll-strip{display:block;transition:transform .15s cubic-bezier(.16,1,.3,1)}",
			".dsgc-roll-d{display:block;height:1em;line-height:1;text-align:center}",
			".dsgc-rtrack{display:flex;align-items:center;gap:4px;padding:0 24px 4px;flex:none;animation:dsgc-rtrack-in .18s ease-out}",
			"@keyframes dsgc-rtrack-in{from{opacity:0}}",
			".dsgc-rtrack-step{flex:none;width:6px;height:6px;border-radius:999px;transition:width .16s cubic-bezier(.16,1,.3,1),background-color .16s ease,border-color .16s ease}",
			".dsgc-rtrack-step.done{background:var(--role-color,#888)}",
			".dsgc-rtrack-step.todo{border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3))}",
			".dsgc-rtrack-step.cur{width:28px;height:6px;background:color-mix(in srgb,var(--role-color,#888) 22%,transparent);position:relative;overflow:hidden}",
			".dsgc-rtrack-step.cur::after{content:\"\";position:absolute;inset:0;border-radius:999px;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--role-color,#888) 65%,transparent),transparent);animation:dsgc-rtrack-sweep 1.8s linear infinite}",
			"@keyframes dsgc-rtrack-sweep{from{transform:translateX(-100%)}to{transform:translateX(100%)}}",
			".dsgc-rtrack-step.roundsep{margin-left:10px}",
			".dsgc-rtrack-elapsed{margin-left:8px;flex:none;font-size:11px;font-weight:500;color:var(--dsw-alias-label-tertiary,inherit);font-variant-numeric:tabular-nums;line-height:1}",
			".dsgc-rewrap{position:relative;display:inline-flex}",
			".dsgc-repick{position:fixed;z-index:30;display:flex;gap:2px;padding:4px;background:var(--dsw-alias-bg-layer-3,rgba(128,128,128,.06));border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));border-radius:10px;box-shadow:var(--dsw-shadow-lv3,0 8px 24px rgba(0,0,0,.18));outline:none;animation:dsgc-repick-in .16s cubic-bezier(.16,1,.3,1)}",
			"@keyframes dsgc-repick-in{from{opacity:0;transform:translateY(4px)}}",
			".dsgc-repickitem{border:none;background:none;cursor:pointer;padding:3px 4px;border-radius:6px;font-size:15px;line-height:1;transition:background-color .12s,transform .12s}",
			".dsgc-repickitem:hover,.dsgc-repickitem.on{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12))}",
			".dsgc-repickitem.on{transform:translateY(-1px)}",
			".dsgc-repickitem.has{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#4f6ef7) 12%,transparent)}",
			".dsgc-repill{border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));background:var(--dsw-alias-bg-layer-3,rgba(128,128,128,.06));cursor:pointer;padding:0 6px;border-radius:999px;font-size:12px;line-height:18px;transition:background-color .12s,border-color .12s;font-family:inherit;color:inherit}",
			".dsgc-repill:hover{border-color:var(--dsw-alias-label-dimmed,rgba(128,128,128,.5))}",
			".dsgc-refly{position:absolute;left:50%;bottom:0;font-size:14px;line-height:1;pointer-events:none;animation:dsgc-refly-up var(--dur,.6s) ease-out forwards}",
			"@keyframes dsgc-refly-up{from{opacity:1;transform:translate(-50%,0) scale(1)}to{opacity:0;transform:translate(calc(-50% + var(--dx,0px)),var(--fly,-52px)) scale(.4);filter:blur(2px)}}",
			".dsgc-hovertip{position:fixed;z-index:100;width:max-content;max-width:50vw;padding:3px 7px;border-radius:8px;background:var(--dsw-alias-tooltip-bg,#1f1f1f);color:var(--dsw-static-neutral-bluish-00,#fff);font-size:13px;line-height:20px;white-space:pre-line;overflow-wrap:break-word;pointer-events:none;animation:dsgc-hovertip-in 150ms var(--ds-ease-in-out,ease)}",
			".dsgc-hovertip[data-side=\"right\"]{transform:translateY(-50%)}",
			".dsgc-hovertip[data-side=\"top\"]{transform:translate(-50%,-100%)}",
			".dsgc-hovertip[data-side=\"bottom\"]{transform:translateX(-50%)}",
			"@keyframes dsgc-hovertip-in{from{opacity:0}}",
			".dsgc-mentionwrap{position:relative}",
			".dsgc-mention{animation:dsgc-pop-in .16s cubic-bezier(.16,1,.3,1);position:absolute;left:0;right:0;bottom:calc(100% + 6px);background:var(--dsw-alias-bg-layer-3,#fff);border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));border-radius:10px;box-shadow:var(--dsw-shadow-lv3,0 8px 24px rgba(0,0,0,.18));max-height:220px;overflow-y:auto;padding:4px;z-index:30;display:flex;flex-direction:column;gap:2px;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent}",
			".dsgc-mentionitem{display:flex;align-items:center;gap:8px;border:none;background:none;color:var(--dsw-alias-label-secondary,inherit);font:inherit;font-size:12.5px;text-align:left;cursor:pointer;padding:6px 8px;border-radius:6px;transition:background-color .12s,color .12s}",
			".dsgc-mentionitem.on,.dsgc-mentionitem:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.15));color:var(--dsw-alias-label-primary,inherit)}",
			".dsgc-mentionname{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}",
			".dsgc-mentionmodel{font-size:11px;color:var(--dsw-alias-label-tertiary,inherit)}",
			".dsgc-mentionhint{font-size:11px;color:var(--dsw-alias-label-tertiary,inherit);padding:2px 8px 1px}",
			".dsgc-mention-file .dsgc-mentionitem.dsgc-hint{cursor:default;color:var(--dsw-alias-label-tertiary,inherit);justify-content:center}",
			".dsgc-mention-file .dsgc-mentionitem.dsgc-hint:hover{background:none}",
			".dsgc-fileglyph{flex:none;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;border-radius:5px}",
			".dsgc-fileglyph.dir{background:color-mix(in srgb,var(--dsw-static-amber-400,#e8912d) 16%,transparent)}",
			".dsgc-fileglyph.file{background:var(--dsw-alias-bg-module-platform,rgba(128,128,128,.12))}",
			".dsgc-filedrill{flex:none;display:inline-flex;color:var(--dsw-alias-label-tertiary,inherit)}",
			".dsgc-mentionitem.on .dsgc-filedrill,.dsgc-mentionitem:hover .dsgc-filedrill{color:var(--dsw-alias-label-secondary,inherit)}",
			".dsgc-chipin-file{background:color-mix(in srgb,var(--dsw-static-neutral-bluish-300,rgba(128,128,128,.55)) 18%,transparent)}",
			".dsgc-chipin-file[data-dir=\"1\"]{background:color-mix(in srgb,var(--dsw-static-amber-400,#e8912d) 18%,transparent)}",
			".dsgc-chipglyph{flex:none;width:14px;height:14px;display:inline-flex;align-items:center;justify-content:center;overflow:hidden}",
			".dsgc-chipglyph svg{display:block}",
			".dsgc-aside{width:304px;flex:none;display:flex;flex-direction:column;gap:10px;border-left:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2));padding:12px;min-height:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent;transition:width .28s cubic-bezier(.16,1,.3,1),opacity .18s ease,padding .28s cubic-bezier(.16,1,.3,1),border-left-width .28s cubic-bezier(.16,1,.3,1)}",
			".dsgc-aside>*{flex:none}",
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
			".dsgc-rolemeta{display:flex;align-items:center;gap:6px;min-width:0;flex:1}",
			".dsgc-rolemodel{min-width:0;flex:0 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:var(--dsw-alias-bg-module-platform,rgba(128,128,128,.12));border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px;color:var(--dsw-alias-label-secondary,inherit)}",
			".dsgc-rolethink{display:inline-flex;align-items:center;flex:none;color:var(--dsw-alias-label-tertiary,inherit)}",
			".dsgc-roleops{display:flex;gap:2px;flex:none;margin-left:auto;opacity:0;transition:opacity .12s}",
			".dsgc-role:hover .dsgc-roleops,.dsgc-role:focus-within .dsgc-roleops{opacity:1}",
			".dsgc-rolemenu{display:flex;align-items:center;gap:8px}",
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
			".dsgc-drawer{position:absolute;top:0;right:0;bottom:0;width:380px;max-width:calc(100% - 40px);z-index:20;background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-bg-base,#fff));border-left:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));box-shadow:-12px 0 32px rgba(0,0,0,.14);display:flex;flex-direction:column;animation:dsgc-drawer-in .22s cubic-bezier(.16,1,.3,1)}",
			".dsgc-drawer.closing{animation:dsgc-drawer-out .14s ease-in forwards;pointer-events:none}",
			"@keyframes dsgc-drawer-in{from{transform:translateX(32px);opacity:0}to{transform:none;opacity:1}}",
			"@keyframes dsgc-drawer-out{to{transform:translateX(32px);opacity:0}}",
			"@keyframes dsgc-msg-in{from{opacity:0;transform:translateY(6px)}}",
			"@keyframes dsgc-sys-in{from{opacity:0;transform:scale(.96)}}",
			"@keyframes dsgc-pop-in{from{opacity:0;transform:translateY(4px)}}",
			"@keyframes dsgc-rise-in{from{opacity:0;transform:translate(-50%,6px)}}",
			"@keyframes dsgc-fade-in{from{opacity:0}}",
			".dsgc-drawerhead{display:flex;align-items:center;gap:8px;padding:14px 16px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2));flex:none}",
			".dsgc-drawertitle{flex:1;font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary,inherit)}",
			".dsgc-drawerbody{flex:1;overflow-y:auto;padding:16px;min-height:0;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent}",
			".dsgc-drawerfoot{display:flex;gap:8px;justify-content:flex-end;padding:12px 16px;border-top:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2));flex:none}",
			".dsgc-fb{border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));background:var(--dsw-alias-bg-layer-2,transparent);border-radius:8px;display:flex;flex-direction:column;gap:6px;padding:8px;animation:dsgc-fade-in .2s ease-out}",
			".dsgc-fbhead{display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0}",
			".dsgc-fbhead button{flex:none;white-space:nowrap}",
			".dsgc-wsrow{display:flex;gap:6px;align-items:center;min-width:0}",
			".dsgc-wsrow .dsgc-input{width:auto;flex:1;min-width:0}",
			".dsgc-wsrow>button{flex:none;white-space:nowrap}",
			".dsgc-nav>button{white-space:nowrap;overflow:hidden}",
			".dsgc-fbpath{flex:1;min-width:0;font-size:11px;color:var(--dsw-alias-label-secondary,inherit);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
			".dsgc-fblist{display:flex;flex-direction:column;gap:1px;max-height:220px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent}",
			".dsgc-fbrow{display:flex;align-items:center;gap:7px;width:100%;border:none;background:none;color:var(--dsw-alias-label-primary,inherit);font:inherit;font-size:12.5px;text-align:left;cursor:pointer;padding:3px 8px;border-radius:6px;transition:background-color .12s}",
			".dsgc-fbrow:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.15))}",
			".dsgc-fbrow.dim{opacity:.55}",
			".dsgc-fbrow.file{cursor:default}",
			".dsgc-fbrow.file:hover{background:none}",
			".dsgc-fbname{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
			".dsgc-fbsize{flex:none;font-size:10.5px;color:var(--dsw-alias-label-tertiary,inherit)}",
			".dsgc-partchip:focus-visible,.dsgc-mentionitem:focus-visible,.dsgc-dot:focus-visible,.dsgc-opbtn:focus-visible,.dsgc-twist:focus-visible,.dsgc-addsess:focus-visible,.dsgc-grow-row:focus-visible,.dsgc-sess-row:focus-visible,.dsgc-fbrow:focus-visible,.dsgc-role:focus-visible,.dsgc-roundbtn:focus-visible,.dsgc-tobtn:focus-visible,.dsgc-seambtn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,var(--dsw-alias-state-business-primary,#4f6ef7));outline-offset:1px}",
			"@container (max-width: 880px){.dsgc-aside{position:absolute;top:0;right:0;bottom:0;z-index:15;width:min(304px,88%);box-shadow:-12px 0 32px rgba(0,0,0,.16);border-left:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));transition:transform .3s cubic-bezier(.16,1,.3,1),opacity .2s ease}.dsgc-aside.closed{width:min(304px,88%);padding-left:12px;padding-right:12px;border-left-width:1px;transform:translateX(calc(100% + 14px));opacity:0;transition:transform .26s ease-in,opacity .18s ease-in,visibility 0s .24s}.dsgc-seambtn.right:not(.closed){right:min(304px,88%)}}",
			"@container (max-width: 640px){.dsgc-nav{width:200px}.dsgc-msgbody{max-width:88%}.dsgc-constraints{width:88%;max-width:88%}}",
			"[class*=\"panelList\"]:has(.dsgc-entryOverlay){margin-top:4px}",
			"[class*=\"panelRow\"]:has(.dsgc-entryOverlay){position:relative;box-sizing:border-box;height:36px;min-height:36px;padding:0 10px;font-size:13px;transition:background-color .12s,color .12s}",
			"[class*=\"panelRow\"][class*=\"panelActive\"]:has(.dsgc-entryOverlay){font-weight:600}",
			"[class*=\"panelRow\"]:has(.dsgc-entryOverlay):hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12));color:var(--dsw-alias-label-primary,inherit)}",
			"html[data-dsh-taskboard-active] [class*=\"panelRow\"][class*=\"panelActive\"]:has(.dsgc-entryOverlay),html[data-dsh-ssh-active] [class*=\"panelRow\"][class*=\"panelActive\"]:has(.dsgc-entryOverlay){background:transparent;color:var(--dsw-alias-label-secondary,inherit);font-weight:400}",
			"html[data-dsh-taskboard-active] [class*=\"panelRow\"]:has(.dsgc-entryOverlay):hover,html[data-dsh-ssh-active] [class*=\"panelRow\"]:has(.dsgc-entryOverlay):hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12));color:var(--dsw-alias-label-primary,inherit)}",
			"html[data-dsh-taskboard-active] [data-sidebar-collapsed] [class*=\"panelRow\"]:has(.dsgc-entryOverlay),html[data-dsh-ssh-active] [data-sidebar-collapsed] [class*=\"panelRow\"]:has(.dsgc-entryOverlay),html[data-dsh-taskboard-active] [class*=\"collapsed\"] [class*=\"panelRow\"]:has(.dsgc-entryOverlay),html[data-dsh-ssh-active] [class*=\"collapsed\"] [class*=\"panelRow\"]:has(.dsgc-entryOverlay){color:var(--dsw-alias-label-primary,inherit)}",
			"[class*=\"panelRow\"]:has(.dsgc-entryOverlay) > [class*=\"panelTitle\"]{padding-left:24px}",
			".dsgc-entryOverlay{position:absolute;inset:0;display:flex;align-items:center;padding:0 10px;box-sizing:border-box}",
			".dsgc-entryIcon{flex:none;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center}",
			".dsgc-entryIcon svg{width:18px;height:18px;display:block}",
			"[data-sidebar-collapsed] .dsgc-entryOverlay,[class*=\"collapsed\"] .dsgc-entryOverlay{justify-content:center;padding:0}",
			"[data-sidebar-collapsed] [class*=\"panelRow\"]:has(.dsgc-entryOverlay),[class*=\"collapsed\"] [class*=\"panelRow\"]:has(.dsgc-entryOverlay){margin:0 auto}",
			"@media (prefers-reduced-motion:reduce){.dsgc-dot,.dsgc-partchip,.dsgc-mentionitem,.dsgc-grow-row,.dsgc-sess-row,.dsgc-opbtn,.dsgc-addsess,.dsgc-topic,.dsgc-role,.dsgc-rename,.dsgc-input,.dsgc-select,.dsgc-textarea,.dsgc-fbrow,.dsgc-twist svg,.dsgc-roleops,.dsgc-roundbtn,.dsgc-permtrigger,.dsgc-permchevron,.dsgc-tobtn,.dsgc-seambtn,.dsgc-aside,.dsgc-aside.closed,.dsgc-nav,.dsgc-nav.closed,.dsgc-clearbtn,.dsgc-cmore,.dsgc-msgops,.dsgc-msgop,.dsgc-failmore,.dsgc-clip::before,.dsgc-clip::after,.dsgc-fold,.dsgc-fold-inner,.dsgc-fold.open,.dsgc-fold.open .dsgc-fold-inner,.dsgc-cdel-bin,.dsgc-cdel-yes,.dsgc-cdel-no,.dsgc-cdel-lid,.dsgc-cdel-panel,.dsgc-cdel.armed .dsgc-cdel-panel,.dsgc-roll-col,.dsgc-roll-strip,.dsgc-rtrack,.dsgc-rtrack-step,.dsgc-repick,.dsgc-repickitem,.dsgc-repills,.dsgc-repill,.dsgc-refly,[class*=\"panelRow\"]:has(.dsgc-entryOverlay){transition:none}.dsgc-dot:hover{transform:none}.dsgc-drawer,.dsgc-msg,.dsgc-sysmsg,.dsgc-mention,.dsgc-tobottom,.dsgc-err,.dsgc-empty,.dsgc-fb,.dsgc-loading svg,.dsgc-pendingdots i,.dsgc-typing,.dsgc-constraints,.dsgc-hovertip,.dsgc-fail,.dsgc-rtrack,.dsgc-rtrack-step.cur::after,.dsgc-refly{animation:none}.dsgc-typing{background-position:0 0;background-size:100% 100%}}",
			".dgcs-page{display:flex;flex-direction:column;gap:14px;padding:4px 0}",
			".dgcs-head{display:flex;flex-direction:column;gap:6px}",
			".dgcs-title{margin:0;font-size:15px;font-weight:600;line-height:1.4;color:var(--dsw-alias-label-primary,inherit)}",
			".dgcs-desc{margin:0;font-size:13px;line-height:1.6;color:var(--dsw-alias-label-secondary,inherit)}",
			".dgcs-card{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));background:var(--dsw-alias-bg-layer-3,transparent);border-radius:12px;padding:14px 16px;transition:border-color .16s}",
			".dgcs-cardtext{display:flex;flex-direction:column;gap:3px;min-width:0}",
			".dgcs-cardtitle{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary,inherit)}",
			".dgcs-cardhint{font-size:12px;color:var(--dsw-alias-label-tertiary,inherit)}"
		].join("\n");
		/** 工厂执行时幂等注入样式标签（loader 卸载时按 data-plugin 摘除）。 */
		function injectStyles() {
			if (typeof document === "undefined") return;
			if (document.querySelector("style[data-plugin-css=" + JSON.stringify(TAG_ID) + "]") === null) {
				const tag = document.createElement("style");
				tag.dataset.plugin = "@roaming-ai/dsh-group-chat";
				tag.dataset.pluginCss = TAG_ID;
				tag.textContent = CSS;
				document.head.appendChild(tag);
			}
		}
		//#endregion
		//#region src/client/lib/ui.ts
		/**
		* 浏览器半 UI 基座：DSW 原语（shell 静态种子模块，loader 模块表 external）
		* 与动态图标 / 命令式 createElement 辅助。组件主体已 JSX 化（.tsx）；此处
		* 仅保留 slot 注册回调与动态图标表需要的少量命令式辅助。
		* @module dsh-group-chat/client/ui
		*/
		/** 命令式 createElement（仅 slot 注册回调用）。 */
		const h$1 = react.createElement;
		/** 按名取 DSW 原语（图标表驱动）。 */
		function pickPrimitive(name) {
			return _deepseek_ai_dsh_client_ui_primitives[name];
		}
		/** 以统一 size 包装图标组件调用（放在 JSX 子元素位）。 */
		function Icon(comp, size, extra) {
			return h$1(comp, Object.assign({ size }, extra || {}));
		}
		//#endregion
		//#region src/core/status.ts
		/** 状态点悬停/读屏文案（idle 不渲染点，无文案）。 */
		const SESS_STATUS_LABEL = {
			idle: "",
			ongoing: "进行中",
			warning: "等待确认",
			done: "已完成",
			error: "已出错"
		};
		/** 派生单个会话的列表状态（run 为快照的 run 视图）。 */
		function sessStatus(run, sessionId) {
			if (run.running && run.sessionId === sessionId) return run.pendingConfirm ? "warning" : "ongoing";
			const f = run.finished;
			if (f && f.sessionId === sessionId) return f.reason === "error" ? "error" : "done";
			return "idle";
		}
		//#endregion
		//#region src/client/lib/model.ts
		/** 角色标识色调色板（与宿主半一致）。 */
		const PALETTE = [
			"#5b8def",
			"#22a06b",
			"#e8912d",
			"#c678dd",
			"#e05661",
			"#56b6c2",
			"#98c379",
			"#d19a66"
		];
		/** Host HTTP API 前缀。 */
		const API_PREFIX = "/api/group-chat";
		/** MarkdownText 渲染文案。 */
		const MD_LABELS = Object.freeze({
			code: {
				copyLabel: "复制",
				copiedLabel: "已复制"
			},
			footnotes: "脚注"
		});
		function roleById(s, id) {
			for (const r of s.roles) if (r.id === id) return r;
			return null;
		}
		function sessById(s, id) {
			for (const x of s.sessions) if (x.id === id) return x;
			return null;
		}
		function groupById(s, id) {
			for (const g of s.groups) if (g.id === id) return g;
			return null;
		}
		function escapeRegExp(v) {
			return String(v).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		}
		function firstLine(text) {
			const i = text.indexOf("\n");
			return i === -1 ? text : text.slice(0, i);
		}
		function latestLine(text) {
			const visible = text.trimEnd();
			const i = visible.lastIndexOf("\n");
			return i === -1 ? visible : visible.slice(i + 1);
		}
		/** 消息绝对时钟（对齐主会话 formatMessageClock / clock.md / clock.ymd zh 模板）：
		* 同日 → HH:mm；同年更早 → M月D日 HH:mm；跨年 → Y年M月D日 HH:mm。
		* 绝对时钟不随时间推移失真——Bubble 值比较 memo 冻结首渲字符串无害。 */
		function fmtClock(ts) {
			const d = new Date(ts);
			const pad = (n) => n < 10 ? "0" + n : "" + n;
			const clock = pad(d.getHours()) + ":" + pad(d.getMinutes());
			const now = /* @__PURE__ */ new Date();
			const sameYear = d.getFullYear() === now.getFullYear();
			if (sameYear && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()) return clock;
			const md = d.getMonth() + 1 + "月" + d.getDate() + "日";
			return sameYear ? md + " " + clock : d.getFullYear() + "年" + md + " " + clock;
		}
		/** 发言生成总耗时（对齐插件内 ToolRow 耗时语汇 + 轨道计时的分钟段）：
		* <1s → `800ms`；<60s → `3.2s`（一位小数）；≥60s → `1分58秒`（秒补零 2 位）。 */
		function fmtSpeakDuration(ms) {
			if (!Number.isFinite(ms) || ms <= 0) return "";
			if (ms < 1e3) return Math.round(ms) + "ms";
			if (ms < 6e4) return (ms / 1e3).toFixed(1) + "s";
			const total = Math.floor(ms / 1e3);
			const minutes = Math.floor(total / 60);
			const seconds = total % 60;
			const pad = (n) => n < 10 ? "0" + n : "" + n;
			return minutes + "分" + pad(seconds) + "秒";
		}
		function draftFromRole(role) {
			return {
				id: role.id,
				name: role.name,
				color: role.color ?? null,
				persona: role.persona,
				provider: role.provider,
				model: role.model,
				temperature: role.temperature,
				reasoningEffort: role.reasoningEffort || "default",
				enabled: role.enabled,
				thinking: role.thinking === true
			};
		}
		function blankDraft() {
			return {
				name: "",
				color: null,
				persona: "",
				provider: "",
				model: "",
				temperature: void 0,
				reasoningEffort: "default",
				enabled: true,
				thinking: false
			};
		}
		//#endregion
		//#region src/client/lib/api.ts
		/**
		* 浏览器半 transport：/api/group-chat/* 同源 JSON 端点。
		* @module dsh-group-chat/client/api
		*/
		async function readJson(fetchPromise) {
			const response = await fetchPromise;
			const body = await response.json();
			if (!response.ok) throw new Error(body && body.error ? body.error : "请求失败（HTTP " + response.status + "），请稍后重试");
			return body;
		}
		const api = {
			state: () => readJson(fetch(API_PREFIX + "/state", { cache: "no-store" })),
			action: (payload, signal) => readJson(fetch(API_PREFIX + "/action", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(payload),
				signal
			}))
		};
		//#endregion
		//#region src/client/components/RoleDrawer.tsx
		/**
		* 角色编辑抽屉（右侧滑出，不遮挡会话流阅读）。
		* @module dsh-group-chat/client/drawer
		*/
		function RoleDrawer(props) {
			const { draft, set, groupId } = props;
			const models = props.models;
			const providers = models && models.providers || [];
			const modelsOf = models && models.modelsByProvider && models.modelsByProvider[draft.provider] || [];
			const [closing, setClosing] = (0, react.useState)(false);
			const closingRef = (0, react.useRef)(false);
			const [formError, setFormError] = (0, react.useState)("");
			const [effortsInfo, setEffortsInfo] = (0, react.useState)(null);
			const close = () => {
				if (closingRef.current) return;
				closingRef.current = true;
				setClosing(true);
				window.setTimeout(() => props.onCancel(), 140);
			};
			const onProvider = (e) => {
				const p = e.target.value;
				const list = models && models.modelsByProvider && models.modelsByProvider[p] || [];
				set(Object.assign({}, draft, {
					provider: p,
					model: list.length ? list[0].id : "",
					reasoningEffort: "default"
				}));
			};
			/** 保存（校验在本地，落库经 mutate；失败文案与原实现逐字一致）。 */
			const save = async () => {
				if (!draft.name.trim()) {
					setFormError("角色名称不能为空");
					return;
				}
				if (!draft.provider || !draft.model) {
					setFormError("请选择角色绑定的模型");
					return;
				}
				const res = await props.mutate({
					op: "upsertRole",
					groupId,
					role: draft
				});
				if (res && res.ok && res.snapshot && !res.snapshot.error) props.onCancel();
			};
			(0, react.useEffect)(() => {
				const onKey = (e) => {
					if (e.key === "Escape") close();
				};
				document.addEventListener("keydown", onKey);
				return () => document.removeEventListener("keydown", onKey);
			}, []);
			(0, react.useEffect)(() => {
				let live = true;
				setEffortsInfo(null);
				if (!draft.provider || !draft.model) return;
				api.action({
					kind: "efforts",
					provider: draft.provider,
					model: draft.model
				}).then((res) => {
					if (!live) return;
					const r = res;
					if (r && r.ok) setEffortsInfo({
						ok: true,
						efforts: r.efforts || [],
						defaultEffort: r.defaultEffort
					});
					else setEffortsInfo({
						ok: false,
						efforts: [],
						defaultEffort: void 0,
						error: r && r.error || "查询失败"
					});
				}).catch((e) => {
					if (live) setEffortsInfo({
						ok: false,
						efforts: [],
						defaultEffort: void 0,
						error: String(e && e.message || e)
					});
				});
				return () => {
					live = false;
				};
			}, [draft.provider, draft.model]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsgc-drawer" + (closing ? " closing" : ""),
				role: "dialog",
				"aria-modal": "false",
				"aria-label": draft.id ? "编辑角色" : "添加角色",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsgc-drawerhead",
						children: [
							Icon(_deepseek_ai_dsh_client_ui_primitives.IconUserOutline16, 16),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsgc-drawertitle",
								children: draft.id ? "编辑角色" : "添加角色"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "ghost",
								size: "sm",
								onClick: close,
								"aria-label": "关闭",
								children: Icon(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutline16, 16)
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dsgc-drawerbody",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsgc-form",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsgc-field",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", { children: "名称" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										className: "dsgc-input",
										value: draft.name,
										autoFocus: !draft.id,
										onChange: (e) => {
											set(Object.assign({}, draft, { name: e.target.value }));
										},
										placeholder: "例如：产品经理"
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsgc-field",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", { children: "标识色" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dsgc-palette",
										children: PALETTE.map((c) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "dsgc-dot" + (draft.color === c ? " on" : ""),
											style: { background: c },
											onClick: () => {
												set(Object.assign({}, draft, { color: c }));
											},
											"aria-label": "选择标识色 " + c
										}, c))
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsgc-field",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", { children: "人设 / 角色设定" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
										className: "dsgc-textarea",
										rows: 4,
										value: draft.persona,
										onChange: (e) => {
											set(Object.assign({}, draft, { persona: e.target.value }));
										},
										placeholder: "性格、立场、说话风格、专业背景……"
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsgc-field",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", { children: "模型提供方" }), providers.length ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
										className: "dsgc-select",
										value: draft.provider,
										onChange: onProvider,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "",
											children: "选择提供方…"
										}), providers.map((p) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: p.id,
											children: p.name || p.id
										}, p.id))]
									}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dsgc-selhint",
										children: [(props.modelsError ? "模型目录加载失败：" + props.modelsError : "暂无可用 provider") + " ", /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
											variant: "outline",
											size: "sm",
											onClick: props.onRetryModels,
											children: "重试"
										})]
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsgc-field",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", { children: "模型" }), modelsOf.length ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
										className: "dsgc-select",
										value: draft.model,
										onChange: (e) => {
											set(Object.assign({}, draft, {
												model: e.target.value,
												reasoningEffort: "default"
											}));
										},
										children: modelsOf.map((m) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: m.id,
											children: m.name || m.id
										}, m.id))
									}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dsgc-selhint",
										children: "请先选择有可用模型的提供方"
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsgc-field",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", { children: "温度（可选）" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										className: "dsgc-input",
										type: "number",
										step: "0.1",
										min: "0",
										max: "2",
										value: draft.temperature == null ? "" : String(draft.temperature),
										onChange: (e) => {
											set(Object.assign({}, draft, { temperature: e.target.value === "" ? void 0 : Number(e.target.value) }));
										}
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsgc-field",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", { children: "深度思考" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											display: "flex",
											gap: 10,
											alignItems: "center"
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Switch, {
											checked: draft.thinking === true,
											onChange: (v) => {
												set(Object.assign({}, draft, { thinking: v }));
											},
											label: "深度思考"
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "dsgc-hint",
											children: "开启后角色发言前先思考（支持思考的模型）"
										})]
									})]
								}),
								draft.thinking === true ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsgc-field",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", { children: "推理级别" }), effortsInfo === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dsgc-selhint",
										children: "查询推理级别…"
									}) : !effortsInfo.ok ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dsgc-selhint",
										children: [
											"推理级别查询失败：",
											effortsInfo.error,
											"（若刚更新插件，请重启 dsh web 使 host 半生效）"
										]
									}) : (effortsInfo.efforts || []).length ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
										className: "dsgc-select",
										value: draft.reasoningEffort && draft.reasoningEffort !== "default" ? draft.reasoningEffort : "default",
										onChange: (e) => {
											set(Object.assign({}, draft, { reasoningEffort: e.target.value }));
										},
										title: "取自当前模型设置中的推理选项；默认 = 使用该模型的默认推理级别",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("option", {
											value: "default",
											children: ["默认", effortsInfo.defaultEffort ? "（当前默认：" + ((effortsInfo.efforts || []).find((x) => x.id === effortsInfo.defaultEffort) || { name: "" }).name + "）" : ""]
										}), (effortsInfo.efforts || []).map((e) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: e.id,
											title: e.description || "",
											children: e.name || e.id
										}, e.id))]
									}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dsgc-selhint",
										children: "当前模型未提供推理等级，将使用默认"
									})]
								}) : null,
								formError ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dsgc-formerr",
									children: formError
								}) : null
							]
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsgc-drawerfoot",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							onClick: close,
							children: "取消"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "primary",
							onClick: () => {
								save();
							},
							children: draft.id ? "保存" : "添加"
						})]
					})
				]
			});
		}
		//#endregion
		//#region src/client/components/ConfirmDelete.tsx
		/**
		* 原地确认删除按钮（RareUI Delete button 的插件习语重写）：点击垃圾桶掀盖，
		* 侧滑出「✓ 确认 / ✗ 取消」微面板；✓ 才执行删除，✗ / Esc / 点击外部收起。
		* 入场 .16s 到达曲线、退场 .12s ease-in（max-width + opacity 纯 CSS 双向动画，
		* 收起后经 visibility 延迟切断键盘焦点）；reduced-motion 由全局规则停用。
		* @module dsh-group-chat/client/ConfirmDelete
		*/
		/** 自绘垃圾桶（盖子独立分组，armed 态掀盖旋转；描边风格对齐宿主 Icon*Outline）。 */
		function TrashGlyph() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				width: "14",
				height: "14",
				viewBox: "0 0 16 16",
				fill: "none",
				"aria-hidden": "true",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("g", {
						className: "dsgc-cdel-lid",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
							d: "M2.4 4.4H13.6",
							stroke: "currentColor",
							strokeWidth: "1.4",
							strokeLinecap: "round"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
							d: "M6.4 4.4V3.1C6.4 2.77 6.67 2.5 7 2.5H9C9.33 2.5 9.6 2.77 9.6 3.1V4.4",
							stroke: "currentColor",
							strokeWidth: "1.4",
							strokeLinecap: "round"
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M4 4.4V13C4 13.33 4.27 13.6 4.6 13.6H11.4C11.73 13.6 12 13.33 12 13V4.4",
						stroke: "currentColor",
						strokeWidth: "1.4",
						strokeLinejoin: "round"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M6.6 7V11M9.4 7V11",
						stroke: "currentColor",
						strokeWidth: "1.4",
						strokeLinecap: "round"
					})
				]
			});
		}
		function ConfirmDelete(props) {
			const { label, confirmLabel = "确认删除", onConfirm } = props;
			const [armed, setArmed] = (0, react.useState)(false);
			const rootRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				if (!armed) return;
				const onKey = (e) => {
					if (e.key === "Escape") setArmed(false);
				};
				const onPointer = (e) => {
					if (rootRef.current && !rootRef.current.contains(e.target)) setArmed(false);
				};
				document.addEventListener("keydown", onKey);
				document.addEventListener("pointerdown", onPointer);
				return () => {
					document.removeEventListener("keydown", onKey);
					document.removeEventListener("pointerdown", onPointer);
				};
			}, [armed]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				ref: rootRef,
				className: "dsgc-cdel" + (armed ? " armed" : ""),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					className: "dsgc-cdel-panel",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "dsgc-cdel-yes",
						title: confirmLabel,
						"aria-label": confirmLabel,
						onClick: (e) => {
							e.stopPropagation();
							setArmed(false);
							onConfirm();
						},
						children: Icon(_deepseek_ai_dsh_client_ui_primitives.IconCheckOutline14, 14)
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "dsgc-cdel-no",
						title: "取消删除",
						"aria-label": "取消删除",
						onClick: (e) => {
							e.stopPropagation();
							setArmed(false);
						},
						children: Icon(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutline16, 14)
					})]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: "dsgc-cdel-bin",
					title: label,
					"aria-label": label,
					"aria-expanded": armed,
					onClick: (e) => {
						e.stopPropagation();
						setArmed(!armed);
					},
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TrashGlyph, {})
				})]
			});
		}
		//#endregion
		//#region src/client/components/HoverTip.tsx
		/**
		* 对齐宿主 Tooltip 的 hover 气泡：portal 到 document.body，躲开
		* `.dsgc-root` 的 container-type 把 position:fixed 按容器定位。
		* @module dsh-group-chat/client/components
		*/
		/**
		* @param props.label 气泡正文（pre-line）
		* @param props.side 默认 right（对齐侧栏会话行）；composer 轮数用 top
		* @param props.delayMs hover 延迟，默认 500；键盘 focus 立即出
		*/
		function HoverTip(props) {
			const { label, side = "right", delayMs = 500, maxWidth, className, children } = props;
			const anchorRef = (0, react.useRef)(null);
			const bubbleRef = (0, react.useRef)(null);
			const showTimer = (0, react.useRef)(null);
			const hover = (0, react.useRef)(false);
			const [pos, setPos] = (0, react.useState)(null);
			const [placement, setPlacement] = (0, react.useState)(side);
			const cancel = () => {
				if (showTimer.current === null) return;
				clearTimeout(showTimer.current);
				showTimer.current = null;
			};
			const show = () => {
				const el = anchorRef.current;
				if (!el || !label) return;
				const r = el.getBoundingClientRect();
				setPlacement(side);
				setPos({
					x: side === "right" ? r.right + 10 : r.left + r.width / 2,
					top: r.top,
					bottom: r.bottom
				});
			};
			const hideIfIdle = () => {
				if (!hover.current && !(anchorRef.current && anchorRef.current.contains(document.activeElement))) setPos(null);
			};
			(0, react.useEffect)(() => cancel, []);
			(0, react.useLayoutEffect)(() => {
				if (!pos) return;
				const fit = () => {
					const el = bubbleRef.current;
					if (!el) return;
					el.style.left = pos.x + "px";
					const r = el.getBoundingClientRect();
					let dx = 0;
					if (r.right > window.innerWidth - 12) dx = window.innerWidth - 12 - r.right;
					if (r.left + dx < 12) dx = 12 - r.left;
					el.style.left = pos.x + dx + "px";
					if (side === "right") return;
					const fitsBelow = pos.bottom + 8 + r.height <= window.innerHeight - 12;
					const fitsAbove = pos.top - 8 - r.height >= 12;
					if (placement === "bottom" && !fitsBelow && fitsAbove) setPlacement("top");
					if (placement === "top" && !fitsAbove && fitsBelow) setPlacement("bottom");
				};
				fit();
				window.addEventListener("resize", fit);
				return () => {
					window.removeEventListener("resize", fit);
				};
			}, [
				pos,
				placement,
				label,
				side
			]);
			const y = pos === null ? 0 : placement === "right" ? pos.top + (pos.bottom - pos.top) / 2 : placement === "top" ? pos.top - 8 : pos.bottom + 8;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				ref: anchorRef,
				className,
				onMouseEnter: () => {
					hover.current = true;
					cancel();
					if (delayMs <= 0) {
						show();
						return;
					}
					showTimer.current = setTimeout(() => {
						showTimer.current = null;
						show();
					}, delayMs);
				},
				onMouseLeave: () => {
					hover.current = false;
					cancel();
					hideIfIdle();
				},
				onFocus: () => {
					cancel();
					show();
				},
				onBlur: (e) => {
					const next = e.relatedTarget;
					if (next && anchorRef.current && anchorRef.current.contains(next)) return;
					cancel();
					hideIfIdle();
				},
				children
			}), pos ? (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				ref: bubbleRef,
				className: "dsgc-hovertip",
				"data-side": placement,
				role: "tooltip",
				style: {
					left: pos.x,
					top: y,
					...maxWidth ? { maxWidth } : {}
				},
				children: label
			}), document.body) : null] });
		}
		//#endregion
		//#region src/client/components/NavPanel.tsx
		/** 内联重命名输入（群组行/会话行同款）。 */
		function RenameField(props) {
			const { draft, set, commit, keyDown } = props;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
				className: "dsgc-rename",
				value: draft.value,
				autoFocus: true,
				onChange: (e) => {
					set({
						kind: draft.kind,
						id: draft.id,
						value: e.target.value
					});
				},
				onBlur: () => {
					commit();
				},
				onKeyDown: keyDown,
				onClick: (e) => {
					e.stopPropagation();
				}
			});
		}
		/** 行尾操作钮：重命名 + 原地确认删除（群组行/会话行同款）。 */
		function NodeOps(props) {
			const { renameLabel, deleteLabel, onRename, onDelete } = props;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: "dsgc-nodeops",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					className: "dsgc-opbtn",
					title: renameLabel,
					"aria-label": renameLabel,
					onClick: (e) => {
						e.stopPropagation();
						onRename();
					},
					children: Icon(_deepseek_ai_dsh_client_ui_primitives.IconEditOutline16, 14)
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ConfirmDelete, {
					label: deleteLabel,
					onConfirm: onDelete
				})]
			});
		}
		function NavPanel(props) {
			const { snap, search, setSearch, collapsedGroups, setCollapsedGroups, gid, sid, setGid, setSid, setPartsSel, renameDraft, setRenameDraft, mutate, navOpen } = props;
			const commitRename = async () => {
				if (!renameDraft) return;
				const d = renameDraft;
				setRenameDraft(null);
				const value = String(d.value || "").trim();
				if (!value) return;
				if (d.kind === "group") await mutate({
					op: "renameGroup",
					groupId: d.id,
					name: value
				});
				else await mutate({
					op: "renameSession",
					sessionId: d.id,
					name: value
				});
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
			const clearEdits = () => {
				setPartsSel(null);
				setRenameDraft(null);
			};
			const pickGroup = (id) => {
				setGid(id);
				clearEdits();
			};
			const pickSession = (gidToSet, sidToSet) => {
				setGid(gidToSet);
				setSid(sidToSet);
				clearEdits();
			};
			const q = search.trim().toLowerCase();
			const groupMatches = (g) => {
				if (!q) return {
					show: true,
					filterSessions: false
				};
				if (g.name.toLowerCase().includes(q)) return {
					show: true,
					filterSessions: false
				};
				return {
					show: g.sessionIds.map((id) => sessById(snap, id)).filter((s) => s && s.name.toLowerCase().includes(q)).length > 0,
					filterSessions: true
				};
			};
			const group = gid ? groupById(snap, gid) : null;
			const selected = sid ? sessById(snap, sid) : null;
			const treeNodes = [];
			for (const g of snap.groups) {
				const match = groupMatches(g);
				if (!match.show) continue;
				const expanded = q ? true : !collapsedGroups.has(g.id);
				const isRenameGroup = renameDraft && renameDraft.kind === "group" && renameDraft.id === g.id;
				const groupChildren = [];
				if (expanded) {
					for (const sessionId of g.sessionIds) {
						const s = sessById(snap, sessionId);
						if (!s) continue;
						if (match.filterSessions && !s.name.toLowerCase().includes(q)) continue;
						const isActive = selected && s.id === selected.id && g.id === group?.id;
						const isRenameSess = renameDraft && renameDraft.kind === "session" && renameDraft.id === s.id;
						const st = sessStatus(snap.run, s.id);
						groupChildren.push(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsgc-sess-row" + (isActive ? " on" : ""),
							role: "button",
							tabIndex: 0,
							onClick: () => {
								pickSession(g.id, s.id);
							},
							onKeyDown: (e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									pickSession(g.id, s.id);
								}
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsgc-sess-status",
									children: st !== "idle" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										role: "img",
										title: SESS_STATUS_LABEL[st],
										"aria-label": SESS_STATUS_LABEL[st],
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, {
											state: st,
											size: 8
										})
									}) : null
								}),
								isRenameSess ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RenameField, {
									draft: renameDraft,
									set: setRenameDraft,
									commit: () => {
										commitRename();
									},
									keyDown: renameKeyDown
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(HoverTip, {
									label: s.name,
									side: "right",
									delayMs: 500,
									className: "dsgc-sess-name",
									children: s.name
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NodeOps, {
									renameLabel: "重命名会话",
									deleteLabel: "删除会话",
									onRename: () => {
										setRenameDraft({
											kind: "session",
											id: s.id,
											value: s.name
										});
									},
									onDelete: () => {
										mutate({
											op: "deleteSession",
											sessionId: s.id
										});
									}
								})
							]
						}, s.id));
					}
					groupChildren.push(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						className: "dsgc-addsess",
						onClick: () => {
							mutate({
								op: "createSession",
								groupId: g.id
							});
						},
						children: [Icon(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutline16, 14), "新会话"]
					}, "__add"));
				}
				treeNodes.push(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsgc-gnode",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsgc-grow-row" + (g.id === group?.id ? " on" : ""),
						role: "button",
						tabIndex: 0,
						onClick: () => {
							pickGroup(g.id);
						},
						onKeyDown: (e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								pickGroup(g.id);
							}
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: "dsgc-twist" + (expanded ? "" : " closed"),
								title: expanded ? "收起" : "展开",
								"aria-label": expanded ? "收起" : "展开",
								onClick: (e) => {
									e.stopPropagation();
									setCollapsedGroups((prev) => {
										const next = new Set(prev);
										if (next.has(g.id)) next.delete(g.id);
										else next.add(g.id);
										return next;
									});
								},
								children: Icon(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, 14)
							}),
							isRenameGroup ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RenameField, {
								draft: renameDraft,
								set: setRenameDraft,
								commit: () => {
									commitRename();
								},
								keyDown: renameKeyDown
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsgc-gname",
								children: g.name
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NodeOps, {
								renameLabel: "重命名群组",
								deleteLabel: "删除群组",
								onRename: () => {
									setRenameDraft({
										kind: "group",
										id: g.id,
										value: g.name
									});
								},
								onDelete: () => {
									mutate({
										op: "deleteGroup",
										groupId: g.id
									});
								}
							})
						]
					}), expanded ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dsgc-sess-list",
						children: groupChildren
					}) : null]
				}, g.id));
			}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsgc-nav" + (navOpen ? "" : " closed"),
				"aria-hidden": navOpen ? void 0 : "true",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
						icon: Icon(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutline16, 16),
						className: "dsgc-search",
						placeholder: "搜索群组与会话…",
						value: search,
						onChange: (e) => setSearch(e.target.value)
					}),
					treeNodes.length ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dsgc-tree",
						children: treeNodes
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dsgc-hint",
						children: q ? "没有匹配「" + search.trim() + "」的群组或会话" : "暂无群组"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "outline",
						onClick: () => {
							mutate({ op: "createGroup" });
						},
						children: [Icon(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutline16, 16), "新建群组"]
					})
				]
			});
		}
		//#endregion
		//#region src/client/components/AsidePanel.tsx
		/**
		* 右侧成员与工作区栏组件。工作区目录编辑态（草稿、文件浏览器）为栏内自有状态。
		* @module dsh-group-chat/client/components
		*/
		function AsidePanel(props) {
			const { snap, group, asideOpen, mutate, openRoleEditor } = props;
			const [wsDraft, setWsDraft] = (0, react.useState)(null);
			const [fileBrowser, setFileBrowser] = (0, react.useState)(null);
			const commitWsDir = () => {
				if (wsDraft !== null && group && wsDraft !== (group.workspaceDir || "")) mutate({
					op: "setWorkspaceDir",
					groupId: group.id,
					path: wsDraft
				});
				setWsDraft(null);
			};
			const openBrowser = async (path) => {
				setFileBrowser({
					open: true,
					loading: true,
					list: null,
					error: ""
				});
				try {
					const res = await api.action({
						kind: "browse",
						path: path || ""
					});
					if (res && res.ok) setFileBrowser({
						open: true,
						loading: false,
						list: res,
						error: ""
					});
					else setFileBrowser({
						open: true,
						loading: false,
						list: null,
						error: res && res.error || "浏览失败"
					});
				} catch (e) {
					setFileBrowser({
						open: true,
						loading: false,
						list: null,
						error: String(e && e.message || e)
					});
				}
			};
			const selectCurrentDir = () => {
				if (!fileBrowser || !fileBrowser.list || !group) return;
				const path = fileBrowser.list.path;
				mutate({
					op: "setWorkspaceDir",
					groupId: group.id,
					path
				});
				setWsDraft(null);
				setFileBrowser(null);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsgc-aside" + (asideOpen ? "" : " closed"),
				"aria-hidden": asideOpen ? void 0 : "true",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsgc-sec",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsgc-sechead",
						children: [
							"群成员",
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "dsgc-secspacer" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsgc-seccount",
								children: group.roleIds.length ? group.roleIds.length + " 个" : ""
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "ghost",
								size: "sm",
								onClick: () => {
									openRoleEditor(null);
								},
								"aria-label": "添加角色",
								children: [Icon(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutline16, 14), "添加"]
							})
						]
					}), group.roleIds.length ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dsgc-roles",
						children: group.roleIds.map((rid) => {
							const r = roleById(snap, rid);
							if (!r) return null;
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dsgc-role" + (r.enabled ? "" : " off"),
								role: "button",
								tabIndex: 0,
								onClick: () => {
									openRoleEditor(r);
								},
								onKeyDown: (e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										openRoleEditor(r);
									}
								},
								title: "点击编辑角色",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dsgc-rolehead",
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: "dsgc-roledot",
												style: { background: r.color || "#888" }
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: "dsgc-rolename",
												children: r.name
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
												label: r.enabled ? "停用该角色" : "启用该角色",
												side: "top",
												delayMs: 300,
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													onClick: (e) => {
														e.stopPropagation();
													},
													onKeyDown: (e) => {
														e.stopPropagation();
													},
													style: {
														display: "inline-flex",
														flex: "none"
													},
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Switch, {
														checked: r.enabled,
														onChange: () => {
															mutate({
																op: "setRoleEnabled",
																roleId: r.id,
																enabled: !r.enabled
															});
														},
														label: r.enabled ? "停用该角色" : "启用该角色",
														"aria-label": (r.enabled ? "停用" : "启用") + "角色 " + r.name
													})
												})
											})
										]
									}),
									r.persona ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dsgc-rolepersona",
										title: r.persona,
										children: r.persona
									}) : null,
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dsgc-rolemenu",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: "dsgc-rolemeta",
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: "dsgc-rolemodel",
												title: r.provider + " / " + r.model + (r.thinking ? " · 深度思考" + (r.reasoningEffort && r.reasoningEffort !== "default" ? "（" + r.reasoningEffort + "）" : "") : ""),
												children: [
													r.provider,
													" / ",
													r.model
												]
											}), r.thinking ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: "dsgc-rolethink",
												title: "深度思考",
												children: Icon(_deepseek_ai_dsh_client_ui_primitives.IconThinkOutline14, 14)
											}) : null]
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: "dsgc-roleops",
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												className: "dsgc-opbtn",
												title: "编辑角色",
												"aria-label": "编辑角色",
												onClick: (e) => {
													e.stopPropagation();
													openRoleEditor(r);
												},
												children: Icon(_deepseek_ai_dsh_client_ui_primitives.IconEditOutline16, 14)
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ConfirmDelete, {
												label: "移除角色",
												onConfirm: () => {
													mutate({
														op: "deleteRole",
														roleId: r.id
													});
												}
											})]
										})]
									})
								]
							}, r.id);
						})
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dsgc-hint",
						children: "还没有角色。每个角色可绑定不同的 provider/model，在群内以独立身份发言。"
					})]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsgc-sec",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsgc-sechead",
							children: "工作区目录"
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsgc-field",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsgc-wsrow",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										className: "dsgc-input",
										value: wsDraft === null ? group.workspaceDir || "" : wsDraft,
										placeholder: "~/docs 或 /abs/dir",
										onChange: (e) => {
											setWsDraft(e.target.value);
										},
										onBlur: commitWsDir,
										onKeyDown: (e) => {
											if (e.key === "Enter") e.target.blur();
										}
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "outline",
										size: "sm",
										onClick: () => {
											openBrowser(wsDraft === null ? group.workspaceDir : wsDraft);
										},
										children: [Icon(_deepseek_ai_dsh_client_ui_primitives.IconFolderOpenOutline16, 14), "浏览"]
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dsgc-hint",
									children: "发送时读取目录内文本文件，注入本群全体角色上下文；角色也可用工具主动查看"
								}),
								group.workspaceDir === "~" || group.workspaceDir === "/" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dsgc-err",
									children: "工作区指向整个主目录/根目录：角色的只读工具将可读取该范围下的所有文件，请谨慎"
								}) : null
							]
						}),
						fileBrowser && fileBrowser.open ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsgc-fb",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsgc-fbhead",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dsgc-fbpath",
										title: fileBrowser.list ? fileBrowser.list.path : "",
										children: fileBrowser.loading ? "读取中…" : fileBrowser.list ? fileBrowser.list.path : ""
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										style: {
											display: "flex",
											gap: 4,
											alignItems: "center"
										},
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
												variant: "primary",
												size: "sm",
												disabled: !fileBrowser.list,
												onClick: selectCurrentDir,
												children: "选定此目录"
											}),
											fileBrowser.list ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
												variant: "outline",
												size: "sm",
												title: "上一级",
												"aria-label": "上一级",
												onClick: () => {
													openBrowser(fileBrowser.list.parent);
												},
												children: Icon(_deepseek_ai_dsh_client_ui_primitives.IconChevronUpOutline14, 14)
											}) : null,
											fileBrowser.list ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
												variant: "outline",
												size: "sm",
												title: "主目录",
												"aria-label": "主目录",
												onClick: () => {
													openBrowser(fileBrowser.list.home);
												},
												children: Icon(_deepseek_ai_dsh_client_ui_primitives.IconFolderClose16, 14)
											}) : null,
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
												variant: "ghost",
												size: "sm",
												onClick: () => {
													setFileBrowser(null);
												},
												"aria-label": "关闭浏览器",
												children: Icon(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutline16, 14)
											})
										]
									})]
								}),
								fileBrowser.error ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dsgc-err",
									children: fileBrowser.error
								}) : null,
								fileBrowser.list ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dsgc-fblist",
									children: (fileBrowser.list.entries || []).length ? (fileBrowser.list.entries || []).map((e) => e.type === "directory" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "dsgc-fbrow" + (e.hidden ? " dim" : "") + " dir",
										onClick: () => {
											openBrowser(e.path);
										},
										children: [Icon(e.hidden ? _deepseek_ai_dsh_client_ui_primitives.IconFolderClose16 : _deepseek_ai_dsh_client_ui_primitives.IconFolderOpenOutline16, 14), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: "dsgc-fbname",
											children: [e.name, "/"]
										})]
									}, e.path) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dsgc-fbrow dim file",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "dsgc-fbname",
											children: e.name
										}), e.size !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "dsgc-fbsize",
											children: _deepseek_ai_dsh_client_ui_primitives.fileSizeText(e.size)
										}) : null]
									}, e.path)) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dsgc-hint",
										children: "空目录"
									})
								}) : null
							]
						}) : null
					]
				})]
			});
		}
		//#endregion
		//#region src/core/json.ts
		/**
		* 宽容 JSON 提取（模型输出/供应商错误原文的统一解析入口）：
		* 取首个 { 至末个 } 的片段解析，仅接受普通对象；失败返回 null。
		* 代码围栏剥离由调用方按需先行处理（供应商错误原文不剥）。
		*/
		function looseJson(raw) {
			const start = raw.indexOf("{");
			const end = raw.lastIndexOf("}");
			if (start < 0 || end <= start) return null;
			try {
				const parsed = JSON.parse(raw.slice(start, end + 1));
				return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
			} catch {
				return null;
			}
		}
		//#endregion
		//#region src/core/types.ts
		/** 全部合法档位（展示顺序）。 */
		const PERMISSION_TIERS = [
			"view_only",
			"workspace_write",
			"full_access"
		];
		/** 档位安全化：合法字符串原样，其余 undefined。 */
		function asPermissionTier(value) {
			return typeof value === "string" && PERMISSION_TIERS.includes(value) ? value : void 0;
		}
		/** 消息表情回应白名单（用户标注用；单用户无计数，顺序即展示顺序）。 */
		const REACTION_EMOJIS = [
			"👍",
			"👎",
			"❤️",
			"😂",
			"🤔",
			"🎉"
		];
		//#endregion
		//#region src/core/constraints.ts
		const KIND_LABEL = {
			decided: "已定",
			rejected: "否决",
			open: "未决"
		};
		//#endregion
		//#region src/core/errors.ts
		const PREFIX = "模型输出异常终止: ";
		const LEGACY_ROLE = /^角色「([^」]+)」发言失败[:：]\s*/;
		/** 剥旧系统胶囊与引擎包装前缀，保留供应商原文。 */
		function unwrapSpeakFailure(raw) {
			const text = String(raw || "").trim();
			const legacy = parseLegacyRoleFailure(text);
			const body = legacy ? legacy.rest : text;
			return body.startsWith(PREFIX) ? body.slice(10).trim() : body;
		}
		/** 旧系统胶囊文案：角色「名」发言失败：原文。对不上则 null。 */
		function parseLegacyRoleFailure(text) {
			const m = LEGACY_ROLE.exec(String(text || ""));
			if (!m) return null;
			return {
				roleName: m[1],
				rest: String(text).slice(m[0].length)
			};
		}
		/** 发言失败卡：error 标记，或旧系统胶囊文案。 */
		function isSpeakFailure(m) {
			return !!m.error || !!parseLegacyRoleFailure(m.text);
		}
		/** 失败回合对应角色：failedRoleId / speaker / 旧文案里的角色名（恰好一名才命中）。 */
		function resolveFailedRole(m, roles) {
			const byId = (id) => {
				if (!id) return null;
				for (const r of roles) if (r.id === id) return r;
				return null;
			};
			const direct = byId(m.failedRoleId) || (m.speaker !== "user" && m.speaker !== "system" ? byId(m.speaker) : null);
			if (direct) return direct;
			const parsed = parseLegacyRoleFailure(m.text);
			if (!parsed) return null;
			const hits = roles.filter((r) => r.name === parsed.roleName);
			return hits.length === 1 ? hits[0] : null;
		}
		function httpStatus(text) {
			const m = text.match(/\b([1-5]\d{2})\b/);
			if (!m) return null;
			const n = Number(m[1]);
			return n >= 100 && n <= 599 ? n : null;
		}
		function resetHint(message) {
			const m = message.match(/reset at ([^.]+\S)/i) || message.match(/将在\s*([^\s。]+)\s*重置/);
			return m ? "将在 " + m[1] + " 重置" : void 0;
		}
		/**
		* 把供应商错误压成可扫描的标题 + 短因。
		* 未知形态回退为「发言失败」，原文仍可展开。
		*/
		function classifySpeakFailure(raw) {
			const source = unwrapSpeakFailure(raw);
			const blob = looseJson(source);
			const code = blob && typeof blob.code === "string" ? blob.code : "";
			const type = blob && typeof blob.type === "string" ? blob.type : "";
			const message = blob && typeof blob.message === "string" ? blob.message : source;
			const status = httpStatus(source);
			const joined = (code + " " + type + " " + message + " " + source).toLowerCase();
			if (/quota|accountquotaexceeded|exceeded the .*quota|额度|配额/.test(joined) || code === "AccountQuotaExceeded") return {
				title: "额度已用尽",
				detail: resetHint(message),
				raw: source
			};
			if (status === 429 || /too.?many.?requests|rate.?limit|限流/.test(joined) || type === "TooManyRequests") return {
				title: "请求过于频繁",
				detail: "稍后再试，或降低并发",
				raw: source
			};
			if (status === 401 || status === 403 || /unauthorized|forbidden|invalid.?api.?key|鉴权|未授权/.test(joined)) return {
				title: "模型鉴权失败",
				detail: "检查该角色绑定的提供方密钥",
				raw: source
			};
			if (status === 404 || /model.?not.?found|unknown.?model|模型不存在/.test(joined)) return {
				title: "模型不可用",
				detail: "该角色绑定的模型可能已下线",
				raw: source
			};
			if (/timeout|timed out|etimedout|超时/.test(joined)) return {
				title: "模型响应超时",
				raw: source
			};
			if (/network|econnreset|econnrefused|enotfound|fetch failed|网络/.test(joined)) return {
				title: "网络异常",
				detail: "检查网络后重试",
				raw: source
			};
			if (status !== null && status >= 500) return {
				title: "模型服务暂时不可用",
				detail: "HTTP " + status,
				raw: source
			};
			if (status !== null) return {
				title: "发言失败",
				detail: "HTTP " + status,
				raw: source
			};
			return {
				title: "发言失败",
				raw: source
			};
		}
		/** 失败卡默认复制内容：标题 + 短因 + 原文。 */
		function formatSpeakFailureCopy(view) {
			const lines = [view.title];
			if (view.detail) lines.push(view.detail);
			if (view.raw && view.raw !== view.title) lines.push(view.raw);
			return lines.join("\n");
		}
		//#endregion
		//#region src/client/components/Fold.tsx
		/**
		* 会话内折叠：高度 0fr→1fr + 溢出滚动遮罩。思考 / 工具 / 失败原文 / 结论备忘共用。
		* @module dsh-group-chat/client/components
		*/
		function Fold(props) {
			const { open, children, className } = props;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dsgc-fold" + (open ? " open" : "") + (className ? " " + className : ""),
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dsgc-fold-inner",
					children
				})
			});
		}
		function ClipWell(props) {
			const { children, maxHeight, className, watch } = props;
			const [clip, setClip] = (0, react.useState)({
				up: false,
				down: false
			});
			const ref = (0, react.useRef)(null);
			(0, react.useLayoutEffect)(() => {
				const el = ref.current;
				if (!el) return;
				const measure = () => {
					if (el.clientHeight < 2) {
						setClip((cur) => cur.up || cur.down ? {
							up: false,
							down: false
						} : cur);
						return;
					}
					const max = el.scrollHeight - el.clientHeight;
					const up = el.scrollTop > 1;
					const down = max > 1 && el.scrollTop < max - 1;
					setClip((cur) => cur.up === up && cur.down === down ? cur : {
						up,
						down
					});
				};
				measure();
				const ro = new ResizeObserver(measure);
				ro.observe(el);
				for (const child of el.children) ro.observe(child);
				el.addEventListener("scroll", measure, { passive: true });
				el.addEventListener("transitionend", measure);
				return () => {
					ro.disconnect();
					el.removeEventListener("scroll", measure);
					el.removeEventListener("transitionend", measure);
				};
			}, [watch]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dsgc-clip" + (clip.up ? " can-up" : "") + (clip.down ? " can-down" : ""),
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dsgc-clip-scroll" + (className ? " " + className : ""),
					ref,
					style: { maxHeight },
					children
				})
			});
		}
		//#endregion
		//#region src/client/components/ThinkRow.tsx
		/**
		* 思考折叠行（对标宿主 ReasoningRow：折叠摘要 / 展开全文）。
		* @module dsh-group-chat/client/ThinkRow
		*/
		function ThinkRow(props) {
			const text = props.text || "";
			const running = !!props.running;
			const [expanded, setExpanded] = (0, react.useState)(false);
			const plain = (line) => line.replace(/^(\s*#{1,6}\s+|\s*[-*+]\s+|\s*>\s*)+/, "").replace(/[*`_~]/g, "").replace(/\s+/g, " ").trim();
			const summary = plain(running ? latestLine(text) : firstLine(text));
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsgc-think",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.DisclosureRow, {
					rowClassName: "dsgc-thinkrow",
					icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconThinkOutline14, { size: 14 }),
					title: "思考",
					open: expanded,
					expandable: true,
					expandOnRowClick: true,
					onToggle: () => {
						setExpanded((v) => !v);
					},
					collapsedContent: text ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dsgc-thinksummary",
						children: summary
					}) : null
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Fold, {
					open: expanded,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ClipWell, {
						maxHeight: 320,
						watch: text,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsgc-thinkbody",
							children: text
						})
					})
				})]
			});
		}
		//#endregion
		//#region src/client/components/ToolRow.tsx
		/**
		* 工具调用折叠行（对标思考折叠：摘要行 / 展开输出）。
		* @module dsh-group-chat/client/ToolRow
		*/
		const TOOL_ICONS = {
			read_file: "IconBrowseOutline16",
			list_dir: "IconFolderOpenOutline16",
			run_command: "IconCodeOutline16"
		};
		function ToolRow(props) {
			const c = props.c;
			const [expanded, setExpanded] = (0, react.useState)(false);
			let brief = "";
			try {
				brief = JSON.stringify(c.args) || "";
			} catch {
				brief = "";
			}
			if (brief.length > 40) brief = brief.slice(0, 40) + "…";
			const IconOf = pickPrimitive(TOOL_ICONS[c.tool] || "IconCodeOutline16");
			const statusText = c.status === "ok" ? "成功" : c.status === "denied" ? "用户拒绝" : "失败";
			const StatusIcon = c.status === "ok" ? _deepseek_ai_dsh_client_ui_primitives.IconCheckOutline14 : c.status === "denied" ? _deepseek_ai_dsh_client_ui_primitives.IconCloseOutline16 : _deepseek_ai_dsh_client_ui_primitives.IconWarningOutline16;
			const dur = c.durationMs ? c.durationMs >= 1e3 ? (c.durationMs / 1e3).toFixed(1) + "s" : c.durationMs + "ms" : "";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsgc-tool",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.DisclosureRow, {
					rowClassName: "dsgc-toolrow",
					icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconOf, { size: 14 }),
					title: c.tool + (brief ? " " + brief : ""),
					open: expanded,
					expandable: true,
					expandOnRowClick: true,
					onToggle: () => {
						setExpanded((v) => !v);
					},
					collapsedContent: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: "dsgc-toolsummary",
						children: [Icon(StatusIcon, 12, {
							verticalAlign: "-2px",
							marginRight: 4,
							color: c.status === "ok" ? "var(--dsw-alias-label-tertiary,inherit)" : "var(--dsw-alias-state-error-primary,#e5484d)"
						}), statusText + (dur ? " · " + dur : "")]
					})
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Fold, {
					open: expanded,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ClipWell, {
						maxHeight: 260,
						watch: c.output,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsgc-toolbody",
							children: c.output || "（无输出）"
						})
					})
				})]
			});
		}
		//#endregion
		//#region src/client/components/FailCard.tsx
		/**
		* 角色发言失败卡：人话标题 + 可展开原文。操作条由 Bubble 放在气泡外下方。
		* @module dsh-group-chat/client/FailCard
		*/
		function FailCard(props) {
			const view = classifySpeakFailure(props.raw);
			const [open, setOpen] = (0, react.useState)(false);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsgc-fail",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsgc-failhead",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dsgc-failicon",
						"aria-hidden": "true",
						children: Icon(_deepseek_ai_dsh_client_ui_primitives.IconWarningOutline16, 14)
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsgc-failcopy",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsgc-failtitle",
							children: view.title
						}), view.detail ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsgc-faildetail",
							children: view.detail
						}) : null]
					})]
				}), view.raw ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: "dsgc-failmore" + (open ? " open" : ""),
					"aria-expanded": open,
					onClick: () => {
						setOpen((v) => !v);
					},
					children: open ? "收起原始错误" : "查看原始错误"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Fold, {
					open,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ClipWell, {
						maxHeight: 220,
						watch: open,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
							className: "dsgc-failraw",
							children: view.raw
						})
					})
				})] }) : null]
			});
		}
		//#endregion
		//#region src/client/components/ReactionPicker.tsx
		/**
		* 表情回应选择浮层（RareUI Emoji reaction 的插件习语重写）：portal 到
		* document.body（躲开 `.dsgc-root` 的 container-type 把 position:fixed 按容器
		* 定位），按触发钮 rect 固定定位、向上弹出（空间不足向下翻转）。
		* 6 个 Unicode emoji 候选（文本渲染，不引入图片资产）；键盘 ←→ 移动、
		* Enter/空格 选、Esc 关；已回应的候选高亮、再点为取消。出现 .16s + 4px 位移。
		* @module dsh-group-chat/client/ReactionPicker
		*/
		function ReactionPicker(props) {
			const { anchor, reactions, onPick, onClose } = props;
			const layerRef = (0, react.useRef)(null);
			const [box, setBox] = (0, react.useState)(null);
			const [idx, setIdx] = (0, react.useState)(0);
			(0, react.useLayoutEffect)(() => {
				const r = anchor.getBoundingClientRect();
				const fit = () => {
					const el = layerRef.current;
					if (!el) return;
					const h = el.offsetHeight;
					const w = el.offsetWidth;
					const top = r.top - 6 - h >= 8 ? r.top - 6 - h : r.bottom + 6;
					let left = r.left;
					if (left + w > window.innerWidth - 8) left = window.innerWidth - 8 - w;
					if (left < 8) left = 8;
					setBox({
						left,
						top
					});
				};
				fit();
			}, [anchor]);
			(0, react.useEffect)(() => {
				layerRef.current?.focus();
			}, []);
			(0, react.useEffect)(() => {
				const onKey = (e) => {
					if (e.key === "Escape") {
						e.preventDefault();
						onClose();
						return;
					}
					if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
						e.preventDefault();
						const d = e.key === "ArrowLeft" ? -1 : 1;
						setIdx((i) => (i + d + REACTION_EMOJIS.length) % REACTION_EMOJIS.length);
						return;
					}
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						onPick(REACTION_EMOJIS[idx]);
					}
				};
				const onPointer = (e) => {
					if (layerRef.current && !layerRef.current.contains(e.target) && !anchor.contains(e.target)) onClose();
				};
				document.addEventListener("keydown", onKey);
				document.addEventListener("pointerdown", onPointer);
				return () => {
					document.removeEventListener("keydown", onKey);
					document.removeEventListener("pointerdown", onPointer);
				};
			}, [
				anchor,
				idx,
				onClose,
				onPick
			]);
			return (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				ref: layerRef,
				className: "dsgc-repick",
				role: "listbox",
				"aria-label": "选择回应表情",
				tabIndex: -1,
				style: {
					left: box ? box.left : -9999,
					top: box ? box.top : -9999
				},
				children: REACTION_EMOJIS.map((emoji, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: "dsgc-repickitem" + (i === idx ? " on" : "") + (reactions.includes(emoji) ? " has" : ""),
					role: "option",
					"aria-selected": i === idx ? "true" : "false",
					title: reactions.includes(emoji) ? "取消回应 " + emoji : "回应 " + emoji,
					onMouseEnter: () => {
						setIdx(i);
					},
					onClick: (e) => {
						e.stopPropagation();
						onPick(emoji);
					},
					children: emoji
				}, emoji))
			}), document.body);
		}
		//#endregion
		//#region src/client/components/MsgActions.tsx
		/**
		* 消息操作条：贴在气泡外下方。用户/角色消息悬停出「复制」与「回应」；
		* 失败卡常驻「复制 / 重试」。回应 = RareUI Emoji reaction 的插件习语重写：
		* 触发钮弹出 ReactionPicker，选中后 5 份 emoji 副本从触发钮上浮飘散
		* （reduced-motion 直接跳过）；已回应以胶囊常驻展示，点击胶囊取消。
		* @module dsh-group-chat/client/MsgActions
		*/
		/** 微笑触发图标（描边风格对齐宿主 Icon*Outline；原语无表情类图标的内联回退）。 */
		function SmileGlyph() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				width: "14",
				height: "14",
				viewBox: "0 0 16 16",
				fill: "none",
				"aria-hidden": "true",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "8",
						cy: "8",
						r: "6.3",
						stroke: "currentColor",
						strokeWidth: "1.4"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "5.7",
						cy: "6.6",
						r: "0.85",
						fill: "currentColor"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "10.3",
						cy: "6.6",
						r: "0.85",
						fill: "currentColor"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M5.2 9.6C5.8 10.7 6.8 11.3 8 11.3C9.2 11.3 10.2 10.7 10.8 9.6",
						stroke: "currentColor",
						strokeWidth: "1.4",
						strokeLinecap: "round"
					})
				]
			});
		}
		let flySeq = 0;
		async function writeClipboard(text) {
			try {
				if (navigator.clipboard && navigator.clipboard.writeText) {
					await navigator.clipboard.writeText(text);
					return true;
				}
			} catch {}
			try {
				const el = document.createElement("textarea");
				el.value = text;
				el.setAttribute("readonly", "");
				el.style.position = "fixed";
				el.style.left = "-9999px";
				document.body.appendChild(el);
				el.select();
				const ok = document.execCommand("copy");
				document.body.removeChild(el);
				return ok;
			} catch {
				return false;
			}
		}
		function MsgActions(props) {
			const { copyText, onRetry, retryDisabled, retryTitle, always, reactions, onToggleReaction, durationMs } = props;
			const [copied, setCopied] = (0, react.useState)(false);
			const copiedTimer = (0, react.useRef)(null);
			(0, react.useEffect)(() => () => {
				if (copiedTimer.current) clearTimeout(copiedTimer.current);
			}, []);
			const [pickerOpen, setPickerOpen] = (0, react.useState)(false);
			const triggerRef = (0, react.useRef)(null);
			const [flies, setFlies] = (0, react.useState)([]);
			const copy = async () => {
				if (!copyText) return;
				if (!await writeClipboard(copyText)) return;
				setCopied(true);
				if (copiedTimer.current) clearTimeout(copiedTimer.current);
				copiedTimer.current = setTimeout(() => {
					setCopied(false);
				}, 1400);
			};
			const spawnFlies = (emoji) => {
				if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
				const batch = [];
				for (let i = 0; i < 5; i++) batch.push({
					key: ++flySeq,
					emoji,
					dx: Math.round((Math.random() - .5) * 36),
					fly: -(44 + Math.round(Math.random() * 24)),
					dur: .5 + Math.random() * .2,
					delay: i * 40
				});
				setFlies((f) => f.concat(batch));
			};
			const flyDone = (key) => {
				setFlies((f) => f.filter((x) => x.key !== key));
			};
			const pick = (emoji) => {
				setPickerOpen(false);
				if (!onToggleReaction) return;
				if (!(reactions || []).includes(emoji)) spawnFlies(emoji);
				onToggleReaction(emoji);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsgc-msgops" + (always ? " always" : ""),
				role: "group",
				"aria-label": "消息操作",
				children: [
					onToggleReaction ? (reactions || []).map((emoji) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "dsgc-repill",
						title: "点击取消回应",
						"aria-label": "取消回应 " + emoji,
						onClick: (e) => {
							e.stopPropagation();
							onToggleReaction(emoji);
						},
						children: emoji
					}, emoji)) : null,
					onToggleReaction ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: "dsgc-rewrap",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								ref: triggerRef,
								type: "button",
								className: "dsgc-msgop react",
								title: "添加表情回应",
								"aria-label": "添加表情回应",
								"aria-haspopup": "listbox",
								"aria-expanded": pickerOpen,
								onClick: (e) => {
									e.stopPropagation();
									setPickerOpen((v) => !v);
								},
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SmileGlyph, {})
							}),
							flies.map((f) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsgc-refly",
								style: {
									"--dx": f.dx + "px",
									"--fly": f.fly + "px",
									"--dur": f.dur + "s",
									animationDelay: f.delay + "ms"
								},
								onAnimationEnd: () => {
									flyDone(f.key);
								},
								children: f.emoji
							}, f.key)),
							pickerOpen && triggerRef.current ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ReactionPicker, {
								anchor: triggerRef.current,
								reactions: reactions || [],
								onPick: pick,
								onClose: () => {
									setPickerOpen(false);
								}
							}) : null
						]
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "dsgc-msgop" + (copied ? " done" : ""),
						title: copied ? "已复制" : "复制",
						"aria-label": copied ? "已复制" : "复制",
						onClick: (e) => {
							e.stopPropagation();
							copy();
						},
						children: [Icon(copied ? _deepseek_ai_dsh_client_ui_primitives.IconCheckOutline14 : _deepseek_ai_dsh_client_ui_primitives.IconCopyOutline16, 14), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copied ? "已复制" : "复制" })]
					}),
					onRetry ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "dsgc-msgop retry",
						title: retryTitle || "重试",
						"aria-label": retryTitle || "重试",
						disabled: retryDisabled,
						onClick: (e) => {
							e.stopPropagation();
							if (!retryDisabled) onRetry();
						},
						children: [Icon(_deepseek_ai_dsh_client_ui_primitives.IconRefreshOutline14, 14), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "重试" })]
					}) : null,
					durationMs && durationMs > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: "dsgc-msgdur",
						title: "本次发言生成总用时",
						children: ["耗时 ", fmtSpeakDuration(durationMs)]
					}) : null
				]
			});
		}
		//#endregion
		//#region src/client/components/Bubble.tsx
		/**
		* 聊天消息气泡（user / system / 角色发言）。
		*
		* 帧稳定 memo：SSE 全量快照（~65KB × 7fps）每帧重建全部消息对象 identity，
		* 但已完成消息在 host 侧 append 后不可变——按渲染相关字段做值比较，流式
		* 期间跳过已完成消息的重渲（每帧仅 live 行与派生列表变化），避免全量
		* MarkdownText 重新解析打满主线程导致「卡死后一次性蹦出」。
		* @module dsh-group-chat/client/Bubble
		*/
		function BubbleInner({ m, role, busy, onRetry, onToggleReaction }) {
			const isUser = m.speaker === "user";
			const isFail = isSpeakFailure(m);
			const isSys = m.speaker === "system" && !isFail && !role;
			const name = isUser ? "我" : role ? role.name : isSys ? "系统" : "成员";
			if (isSys) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dsgc-sysmsg",
				children: m.text
			});
			const retryTitle = !role ? "失败角色已不存在，无法重试" : !role.enabled ? "该角色已停用，无法重试" : busy ? "已有对话进行中，请先停止" : "重试该角色发言";
			const copyText = isFail ? formatSpeakFailureCopy(classifySpeakFailure(m.text)) : m.text || "";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsgc-msg" + (isUser ? " mine" : "") + (isFail ? " fail" : ""),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dsgc-avatar" + (isUser ? " mine" : ""),
					style: isUser || !role ? void 0 : { border: "2px solid " + (role.color || "#888") },
					children: name.slice(0, 1)
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsgc-msgbody",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsgc-msghead",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsgc-msgname",
									children: name
								}),
								m.model ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsgc-msgmodel",
									title: m.model,
									children: m.model
								}) : null,
								m.ts ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsgc-msgtime",
									children: fmtClock(m.ts)
								}) : null
							]
						}),
						isFail ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(FailCard, { raw: m.text }) : isUser ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsgc-msgtext",
							children: m.text
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsgc-msgtext",
							children: [
								m.reasoning ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ThinkRow, { text: m.reasoning }) : null,
								(Array.isArray(m.toolCalls) ? m.toolCalls : []).map((c, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ToolRow, { c }, "tc" + i)),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.MarkdownText, {
									text: m.text || "（无内容）",
									labels: MD_LABELS
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(MsgActions, {
							copyText,
							always: isFail,
							onRetry: isFail && onRetry ? () => {
								onRetry(m.id);
							} : void 0,
							retryDisabled: busy || !role || !role.enabled,
							retryTitle,
							reactions: m.reactions,
							onToggleReaction: !isFail && onToggleReaction ? (emoji) => {
								onToggleReaction(m.id, emoji);
							} : void 0,
							durationMs: !isUser ? m.durationMs : void 0
						})
					]
				})]
			});
		}
		/** 渲染相关字段的值比较（消息不可变；角色仅名/色参与渲染）。 */
		function bubblePropsEqual(a, b) {
			if (a.busy !== b.busy || a.onRetry == null !== (b.onRetry == null) || a.onToggleReaction == null !== (b.onToggleReaction == null)) return false;
			const x = a.m;
			const y = b.m;
			if (x !== y) {
				if (x.id !== y.id || x.speaker !== y.speaker || x.text !== y.text || x.reasoning !== y.reasoning || x.model !== y.model || x.error !== y.error || x.failedRoleId !== y.failedRoleId || x.ts !== y.ts || x.durationMs !== y.durationMs) return false;
				if ((Array.isArray(x.reactions) ? x.reactions.join("") : "") !== (Array.isArray(y.reactions) ? y.reactions.join("") : "")) return false;
				const ta = Array.isArray(x.toolCalls) ? x.toolCalls : [];
				const tb = Array.isArray(y.toolCalls) ? y.toolCalls : [];
				if (ta.length !== tb.length) return false;
				for (let i = 0; i < ta.length; i++) {
					const ca = ta[i];
					const cb = tb[i];
					if (ca !== cb && (ca.tool !== cb.tool || ca.status !== cb.status || ca.output !== cb.output || ca.durationMs !== cb.durationMs || JSON.stringify(ca.args) !== JSON.stringify(cb.args))) return false;
				}
			}
			const ra = a.role;
			const rb = b.role;
			return (ra ? ra.id + "\0" + ra.name + "\0" + (ra.color || "") + "\0" + (ra.enabled ? "1" : "0") : "") === (rb ? rb.id + "\0" + rb.name + "\0" + (rb.color || "") + "\0" + (rb.enabled ? "1" : "0") : "");
		}
		const Bubble = (0, react.memo)(BubbleInner, bubblePropsEqual);
		//#endregion
		//#region src/client/components/RollingNumber.tsx
		const DIGIT_STRIP = [
			0,
			1,
			2,
			3,
			4,
			5,
			6,
			7,
			8,
			9
		];
		function RollingNumber(props) {
			const { value, className, pad } = props;
			if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className,
				children: String(value)
			});
			const chars = (pad && pad > 1 ? String(value).padStart(pad, "0") : String(value)).split("");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: "dsgc-roll" + (className ? " " + className : ""),
				role: "group",
				"aria-label": String(value),
				children: chars.map((ch, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "dsgc-roll-col",
					"aria-hidden": "true",
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dsgc-roll-strip",
						style: { transform: "translateY(" + -Number(ch) + "em)" },
						children: DIGIT_STRIP.map((n) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dsgc-roll-d",
							children: n
						}, n))
					})
				}, chars.length - i))
			});
		}
		//#endregion
		//#region src/client/components/ConstraintList.tsx
		/**
		* 会话流折点处：只读结论备忘卡（超过 4 条默认露 3 条）。
		* @module dsh-group-chat/client/components
		*/
		function ConstraintRow(props) {
			const { item } = props;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsgc-constraint",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "dsgc-ckind " + item.kind,
					children: KIND_LABEL[item.kind]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "dsgc-ctext",
					children: item.text
				})]
			});
		}
		function ConstraintList(props) {
			const { items } = props;
			const [open, setOpen] = (0, react.useState)(false);
			if (!items.length) return null;
			const overflow = items.length > 4;
			const head = overflow ? items.slice(0, 3) : items;
			const extra = overflow ? items.slice(3) : [];
			const rest = items.length - 3;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: "dsgc-constraints",
				"aria-labelledby": "dsgc-constraints-title",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsgc-chead",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
							id: "dsgc-constraints-title",
							className: "dsgc-ctitle",
							children: "结论备忘"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "dsgc-cdesc",
							children: "窗口外消息折成的已定 / 否决 / 未决，供后续角色接着用。"
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(ClipWell, {
						maxHeight: 160,
						className: "dsgc-clist",
						watch: open,
						children: [head.map((c, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ConstraintRow, { item: c }, i)), overflow ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Fold, {
							open,
							children: extra.map((c, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ConstraintRow, { item: c }, i + 3))
						}) : null]
					}),
					overflow ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "dsgc-cmore",
						onClick: () => {
							setOpen(!open);
						},
						"aria-expanded": open,
						children: open ? "收起" : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
							"还有 ",
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RollingNumber, { value: rest }),
							" 条约束"
						] })
					}) : null
				]
			});
		}
		//#endregion
		//#region src/client/components/SpeakerOrb.tsx
		/**
		* 发言人执行态点阵光球（live 行头像内容）：角色色单色点阵 Canvas 2D 动画。
		* thinking（轨道热斑游走＝等待首字节/推理中）与 listening（向外涟漪＝正文
		* 流出）两态间弹簧缩放 + 权重交叉淡入；裁掉参考实现 MatrixOrb 的 label、
		* level 与 idle 态（本场景只有执行中一种挂载时机），尺寸钉死为头像内容盒。
		* @module dsh-group-chat/client/SpeakerOrb
		*/
		const TAU = Math.PI * 2;
		const STATES = ["thinking", "listening"];
		/** 头像内容盒：28px 外框减 2px 描边 ×2；圆形轮廓由 d 截断近似。 */
		const SIZE = 24;
		const GRID = 7;
		/** 点阵铺开比例：外圈点贴近描边又不被 border-radius 裁切。 */
		const SPREAD = .86;
		const SCALE = {
			thinking: .94,
			listening: 1
		};
		const DAMPING = 26;
		const ATTACK = .22;
		const RELEASE = .08;
		/** thinking 态热斑轨道（点阵归一化坐标）。 */
		const ORBITERS = [
			{
				radius: .62,
				speed: 2.2,
				phase: 0,
				spread: .42
			},
			{
				radius: .4,
				speed: -1.7,
				phase: 2.1,
				spread: .36
			},
			{
				radius: .8,
				speed: 1.15,
				phase: 4,
				spread: .34
			}
		];
		function envelope(t) {
			const slow = .5 + .5 * Math.sin(t * .62 + .4);
			const fast = .5 + .5 * Math.sin(t * 1.9 + 1.1);
			return .22 + .78 * (.45 + .55 * slow) * fast;
		}
		function intensityOf(state, d, nx, ny, t, amplitude) {
			if (state === "listening") return .32 + amplitude * (.34 + .38 * (.5 + .5 * Math.sin(d * 4.2 - t * 3)));
			let heat = 0;
			for (const o of ORBITERS) {
				const a = t * o.speed + o.phase;
				const dx = nx - Math.cos(a) * o.radius;
				const dy = ny - Math.sin(a) * o.radius;
				heat += Math.exp(-(dx * dx + dy * dy) / (o.spread * o.spread));
			}
			return .26 + .8 * Math.min(1, heat);
		}
		function subscribeToZoom(onChange) {
			window.addEventListener("resize", onChange);
			return () => window.removeEventListener("resize", onChange);
		}
		function useDevicePixelRatio() {
			return (0, react.useSyncExternalStore)(subscribeToZoom, () => Math.min(window.devicePixelRatio || 1, 4), () => 1);
		}
		function SpeakerOrb(props) {
			const { state, color } = props;
			const canvasRef = (0, react.useRef)(null);
			const stateRef = (0, react.useRef)(state);
			const redrawRef = (0, react.useRef)(null);
			const dpr = useDevicePixelRatio();
			(0, react.useEffect)(() => {
				stateRef.current = state;
			}, [state]);
			(0, react.useEffect)(() => {
				const canvas = canvasRef.current;
				const ctx = canvas?.getContext("2d");
				if (!canvas || !ctx) return;
				const buffer = Math.round(SIZE * dpr);
				canvas.width = canvas.height = buffer;
				ctx.scale(buffer / SIZE, buffer / SIZE);
				ctx.fillStyle = color;
				const half = 3;
				const spacing = SIZE * SPREAD / 6;
				const maxRadius = spacing * .6;
				const center = SIZE / 2;
				const weights = {
					thinking: 0,
					listening: 0
				};
				weights[stateRef.current] = 1;
				const draw = (t, amplitude, scale) => {
					ctx.clearRect(0, 0, SIZE, SIZE);
					for (let iy = 0; iy < GRID; iy++) for (let ix = 0; ix < GRID; ix++) {
						const nx = (ix - half) / half;
						const ny = (iy - half) / half;
						const d = Math.hypot(nx, ny);
						if (d > 1.12) continue;
						let blended = 0;
						for (const s of STATES) {
							if (weights[s] < .001) continue;
							blended += weights[s] * intensityOf(s, d, nx, ny, t, amplitude);
						}
						const intensity = Math.min(1, Math.max(0, blended));
						const radius = maxRadius * Math.exp(-d * d * 1.7) * intensity * scale;
						if (radius * dpr < .5) continue;
						ctx.beginPath();
						ctx.arc(center + (ix - half) * spacing * scale, center + (iy - half) * spacing * scale, radius, 0, TAU);
						ctx.fill();
					}
				};
				if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
					redrawRef.current = () => {
						const current = stateRef.current;
						for (const s of STATES) weights[s] = s === current ? 1 : 0;
						draw(0, envelope(0), SCALE[current]);
					};
					redrawRef.current();
					return () => {
						redrawRef.current = null;
					};
				}
				let t = 0;
				let amplitude = 0;
				let scale = SCALE[stateRef.current];
				let velocity = 0;
				let last = performance.now();
				let raf = 0;
				const frame = (now) => {
					const dt = Math.min((now - last) / 1e3, .05);
					last = now;
					t += dt;
					const current = stateRef.current;
					const target = envelope(t);
					const rate = target > amplitude ? ATTACK : RELEASE;
					amplitude += (target - amplitude) * (1 - Math.pow(1 - rate, dt * 60));
					const step = 1 - Math.pow(.84, dt * 60);
					for (const s of STATES) weights[s] += ((s === current ? 1 : 0) - weights[s]) * step;
					velocity += (-180 * (scale - SCALE[current]) - DAMPING * velocity) * dt;
					scale += velocity * dt;
					draw(t, amplitude, scale);
					raf = requestAnimationFrame(frame);
				};
				raf = requestAnimationFrame(frame);
				return () => cancelAnimationFrame(raf);
			}, [color, dpr]);
			(0, react.useEffect)(() => {
				redrawRef.current?.();
			}, [state]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				"aria-hidden": true,
				className: "dsgc-orb",
				style: {
					width: SIZE,
					height: SIZE
				}
			});
		}
		//#endregion
		//#region src/client/components/MessageFlow.tsx
		function MessageFlow(props) {
			const { snap, sess, busyNow, msgById, action, onRetrySpeak, onToggleReaction } = props;
			const bubbles = [];
			const replaceId = busyNow ? snap.run.replaceMessageId : null;
			const replaceMsg = replaceId ? msgById[replaceId] : null;
			const liveRoleId = snap.run.currentRoleId || replaceMsg && (replaceMsg.failedRoleId || replaceMsg.speaker) || null;
			const lr = busyNow && liveRoleId ? roleById(snap, liveRoleId) : null;
			const liveColor = lr ? lr.color || "#888" : "#888";
			const orbState = snap.run.partial ? "listening" : "thinking";
			const live = lr ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsgc-msg live",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dsgc-avatar",
					style: { border: "2px solid " + liveColor },
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SpeakerOrb, {
						state: orbState,
						color: liveColor
					})
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsgc-msgbody",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsgc-msghead",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsgc-msgname",
								children: lr.name
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: "dsgc-msgmodel",
								children: [
									lr.provider,
									" / ",
									lr.model
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsgc-msgtime dsgc-typing",
								children: "深度求索..."
							})
						]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsgc-msgtext live",
						children: [
							snap.run.partialReasoning ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ThinkRow, {
								text: snap.run.partialReasoning,
								running: true
							}) : null,
							snap.run.partial ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.MarkdownText, {
								text: snap.run.partial,
								streaming: true,
								labels: MD_LABELS
							}) : null,
							!snap.run.partial && !snap.run.partialReasoning ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dsgc-pending",
								children: [
									Icon(_deepseek_ai_dsh_client_ui_primitives.IconThinkOutline14, 14),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "思考中" }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: "dsgc-pendingdots",
										"aria-hidden": "true",
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {})
										]
									})
								]
							}) : null
						]
					})]
				})]
			}, "__live") : null;
			const pc = busyNow && snap.run.pendingConfirm && sess && snap.run.sessionId === sess.id ? snap.run.pendingConfirm : null;
			const confirm = pc ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsgc-confirm",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsgc-confirmtitle",
						children: [Icon(_deepseek_ai_dsh_client_ui_primitives.IconWarningOutline16, 14), (lr ? lr.name : "角色") + " 请求执行命令（工作区内）"]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dsgc-confirmcmd",
						children: String(pc.args && pc.args.command || "")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dsgc-hint",
						children: "允许后将在工作区目录执行；拒绝后角色将继续纯文本讨论"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsgc-confirmops",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "primary",
							size: "sm",
							onClick: () => {
								action({
									kind: "confirmCommand",
									toolCallId: pc.toolCallId,
									allow: true
								});
							},
							children: "允许"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							size: "sm",
							onClick: () => {
								action({
									kind: "confirmCommand",
									toolCallId: pc.toolCallId,
									allow: false
								});
							},
							children: "拒绝"
						})]
					})
				]
			}, "__confirm") : null;
			let livePlaced = false;
			if (sess) {
				const groupRoles = snap.roles.filter((r) => r.groupId === sess.groupId);
				const ids = sess.messageIds;
				const memo = sess.constraints && sess.constraints.length ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ConstraintList, { items: sess.constraints }, sess.id + "-constraints") : null;
				const foldAt = memo && ids.length > 40 ? ids.length - 40 : 0;
				if (memo && foldAt === 0) bubbles.push(memo);
				for (let i = 0; i < ids.length; i++) {
					if (memo && foldAt > 0 && i === foldAt) bubbles.push(memo);
					const m = msgById[ids[i]];
					if (!m) continue;
					const role = resolveFailedRole(m, groupRoles) || (m.speaker !== "user" && m.speaker !== "system" ? roleById(snap, m.speaker) : null);
					if (replaceId && m.id === replaceId) {
						if (live) bubbles.push(live);
						if (confirm) bubbles.push(confirm);
						livePlaced = true;
						continue;
					}
					bubbles.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Bubble, {
						m,
						role,
						busy: !!snap.run.running,
						onRetry: onRetrySpeak,
						onToggleReaction
					}, m.id));
				}
			}
			if (live && !livePlaced) bubbles.push(live);
			if (confirm && !livePlaced) bubbles.push(confirm);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: bubbles });
		}
		//#endregion
		//#region src/client/components/PermissionSelect.tsx
		/**
		* 群组权限档位选择器（对齐主会话 composer 左下角的 /permission 选择器）：
		* 触发芯片（盾形图标 + 档位名 + chevron）+ Menu 上弹三档 + 完全权限风险
		* 确认弹窗（与主会话同款 RiskConfirmation 原语与文案）。
		* @module dsh-group-chat/client/permission-select
		*/
		/** 档位展示名（与主会话中文标签一致）。 */
		const TIER_LABELS = {
			view_only: "仅可查看",
			workspace_write: "工作区内修改",
			full_access: "完全权限"
		};
		/** 档位悬停说明（群聊语境下的真实约束）。 */
		const TIER_DESCRIPTIONS = {
			view_only: "角色只能读取工作区文件，不能执行命令",
			workspace_write: "角色可执行命令（cwd 固定在工作区），每条命令需你在会话中确认",
			full_access: "角色可免确认直接执行命令，存在风险"
		};
		/** 完全权限风险确认文案（与主会话逐字一致）。 */
		const CONFIRM_TEXT = {
			title: "确认启用完全权限？",
			description: "启用完全权限后，智能体将减少确认步骤，并且可以直接执行更多操作，包括敏感操作、文件修改或外部命令。仅建议在你信任当前任务时使用。",
			acknowledge: "我已了解风险，并愿意继续",
			cancel: "取消",
			enable: "启用完全权限"
		};
		const SHIELD_OUTLINE = "M8.20554 0.899994L14.7901 3.36857V7.01026C14.7901 12 11.0466 14.2103 8.20554 15.3C5.36446 14.2103 1.62012 12 1.62012 7.01026V3.36857L8.20554 0.899994Z";
		function GlyphViewOnly() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				width: "16",
				height: "16",
				viewBox: "0 0 16 16",
				fill: "none",
				"aria-hidden": true,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: SHIELD_OUTLINE,
					stroke: "currentColor",
					strokeWidth: "1.31831",
					strokeLinejoin: "round"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M12.1654 5.7552L8.9447 9.41475C8.73044 9.65816 8.53628 9.8804 8.35774 10.0423C8.1713 10.2114 7.94235 10.3717 7.64016 10.4254C7.48207 10.4535 7.32 10.4552 7.16151 10.4294C6.85843 10.3801 6.62728 10.2223 6.43836 10.0559C6.25752 9.89653 6.06037 9.67732 5.84264 9.43705L4.72925 8.20897L5.63557 7.38707L6.74897 8.61594C6.98603 8.87755 7.12974 9.03533 7.24673 9.13839C7.31033 9.19443 7.34485 9.21476 7.35823 9.22122C7.38068 9.22484 7.40352 9.22515 7.42593 9.22122C7.40522 9.22502 7.42893 9.23294 7.53583 9.136C7.65132 9.03126 7.79316 8.87139 8.02643 8.60638L11.2479 4.94763L12.1654 5.7552Z",
					fill: "currentColor"
				})]
			});
		}
		function GlyphWorkspaceWrite() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				width: "16",
				height: "16",
				viewBox: "0 0 16 16",
				fill: "none",
				"aria-hidden": true,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M8.08887 0.251709C8.20479 0.23085 8.32486 0.241168 8.43652 0.282959L15.0215 2.75171C15.2787 2.84819 15.4492 3.09414 15.4492 3.3689V7.0105C15.4492 7.10986 15.4441 7.2081 15.4414 7.30542C15.0285 7.07175 14.5905 6.87695 14.1309 6.73022V3.82495L8.20508 1.60327L2.2793 3.82495V7.0105C2.27936 9.7171 3.4745 11.5379 5.02734 12.7947C5.01025 12.9942 5 13.1962 5 13.4001C5.00001 13.7617 5.02722 14.1169 5.08008 14.4636C2.91555 13.0393 0.961014 10.752 0.960938 7.0105V3.3689C0.960938 3.09417 1.13146 2.84821 1.38867 2.75171L7.97461 0.282959L8.08887 0.251709Z",
						fill: "currentColor"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M11.3525 5.64688V6.85688H5V5.64688H11.3525Z",
						fill: "currentColor"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M9.5824 8.29376V9.50376H5V8.29376H9.5824Z",
						fill: "currentColor"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M14.6647 15.6852H10.0338C10.3878 15.3751 10.7567 15.0517 11.0772 14.7706C11.2531 14.6164 11.4144 14.4746 11.5511 14.3547H14.6647V15.6852Z",
						fill: "currentColor"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M8.14852 14.1308L7.33925 15.4976C7.22458 15.6912 7.42245 15.9194 7.63037 15.8333L9.09785 15.2254L15.0399 10.0719L14.0905 8.97733L8.14852 14.1308Z",
						fill: "currentColor"
					})
				]
			});
		}
		function GlyphFullAccess() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				width: "16",
				height: "16",
				viewBox: "0 0 16 16",
				fill: "none",
				"aria-hidden": true,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: SHIELD_OUTLINE,
						stroke: "currentColor",
						strokeWidth: "1.31831",
						strokeLinejoin: "round"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M9.10094 4.5V8.75939H7.59888V4.5H9.10094Z",
						fill: "currentColor"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M9.10094 9.8114V11.5H7.59888V9.8114Z",
						fill: "currentColor"
					})
				]
			});
		}
		const TIER_GLYPHS = {
			view_only: GlyphViewOnly,
			workspace_write: GlyphWorkspaceWrite,
			full_access: GlyphFullAccess
		};
		function PermissionSelect(props) {
			const [open, setOpen] = (0, react.useState)(false);
			const [confirming, setConfirming] = (0, react.useState)(false);
			const [acknowledged, setAcknowledged] = (0, react.useState)(false);
			const tier = asPermissionTier(props.tier) ?? "view_only";
			(0, react.useEffect)(() => {
				setOpen(false);
				setAcknowledged(false);
				setConfirming(false);
			}, [tier]);
			const choose = (id) => {
				setOpen(false);
				if (id === tier) return;
				if (id === "full_access") {
					setAcknowledged(false);
					setConfirming(true);
					return;
				}
				props.onSelect(id);
			};
			const closeConfirm = () => {
				setAcknowledged(false);
				setConfirming(false);
			};
			const confirmFullAccess = () => {
				if (!acknowledged) return;
				closeConfirm();
				props.onSelect("full_access");
			};
			const items = PERMISSION_TIERS.map((t) => ({
				id: t,
				label: TIER_LABELS[t],
				icon: TIER_GLYPHS[t]()
			}));
			const Glyph = TIER_GLYPHS[tier] ?? GlyphViewOnly;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
				open,
				items,
				selectedId: tier,
				onSelect: choose,
				onClose: () => {
					setOpen(false);
				},
				side: "top",
				anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "dsgc-permtrigger",
					"aria-label": "权限模式：" + TIER_LABELS[tier],
					title: TIER_DESCRIPTIONS[tier],
					disabled: confirming,
					onClick: () => {
						setOpen(!open);
					},
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dsgc-permicon",
							"aria-hidden": true,
							children: Glyph()
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dsgc-permlabel",
							children: TIER_LABELS[tier]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dsgc-permchevron" + (open ? " open" : ""),
							"aria-hidden": true,
							children: Icon(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, 14)
						})
					]
				})
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.RiskConfirmation, {
				open: confirming,
				title: CONFIRM_TEXT.title,
				description: CONFIRM_TEXT.description,
				acknowledgeLabel: CONFIRM_TEXT.acknowledge,
				cancelLabel: CONFIRM_TEXT.cancel,
				closeLabel: "关闭",
				confirmLabel: CONFIRM_TEXT.enable,
				acknowledged,
				onAcknowledgedChange: setAcknowledged,
				onCancel: closeConfirm,
				onConfirm: confirmFullAccess
			})] });
		}
		//#endregion
		//#region src/client/components/Composer.tsx
		/** 轮数控件 hover：宿主 Tooltip 三行说明（pre-line）。 */
		const ROUNDS_HINT = "一轮 = 参与角色各说一次。\n要他们自己互相反驳、你不插话时再加轮。\n要边看边插话，就留 1，再点发送。";
		function Composer(props) {
			const { snap, sess, group, enabledRoles, participants, mentionedRoles, busyNow, input, mention, mentionCandidates, mentionIdxC, fileCandidates, fileSearchError, fileSearchLoading, rounds, err, atBottom, bubblesLength, inputRef, scrollRef, setMentionIdx, setRounds, togglePart, onInputCE, onInputKeyDown, onPasteCE, onDropCE, onDragOverCE, insertChip, insertFileChip, sendMsg, stopRun, mutate, setMention } = props;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsgc-composer",
				children: [
					!atBottom && bubblesLength ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dsgc-tobottom",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "dsgc-tobtn",
							onClick: () => {
								const el = scrollRef.current;
								if (el) el.scrollTo({
									top: el.scrollHeight,
									behavior: "smooth"
								});
							},
							children: [Icon(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, 14), "回到底部"]
						})
					}) : null,
					err ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dsgc-err",
						children: err
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsgc-parts",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dsgc-partslabel",
							children: "参与角色"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsgc-partlist",
							children: mentionedRoles.length ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: "dsgc-partslabel",
								children: [
									"已 @ ",
									mentionedRoles.map((r) => r.name).join("、"),
									"（本轮仅被点名成员发言）"
								]
							}) : enabledRoles.length ? enabledRoles.map((r) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "dsgc-partchip" + (participants.includes(r.id) ? " on" : ""),
								onClick: () => togglePart(r.id),
								disabled: busyNow,
								title: busyNow ? "对话进行中，暂停调整" : "点击切换本轮是否参与",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsgc-chipdot",
									style: { background: r.color || "#888" }
								}), r.name]
							}, r.id)) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsgc-hint",
								children: "还没有启用的角色，请在右侧添加"
							})
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsgc-card",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsgc-mentionwrap",
							children: [
								mention !== null && mention.query === "" && mentionCandidates.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsgc-mention",
									role: "listbox",
									children: [mentionCandidates.map((r, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "dsgc-mentionitem" + (i === mentionIdxC ? " on" : ""),
										role: "option",
										"aria-selected": i === mentionIdxC ? "true" : "false",
										onMouseDown: (e) => {
											e.preventDefault();
										},
										onClick: () => {
											insertChip(r);
										},
										onMouseEnter: () => setMentionIdx(i),
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: "dsgc-chipdot",
												style: { background: r.color || "#888" }
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: "dsgc-mentionname",
												children: r.name
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: "dsgc-mentionmodel",
												children: [
													r.provider,
													" / ",
													r.model
												]
											})
										]
									}, r.id)), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dsgc-mentionhint",
										children: "↑↓ 选择 · Enter/Tab 插入"
									})]
								}) : mention !== null && mention.query !== "" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsgc-mention dsgc-mention-file",
									role: "listbox",
									children: [fileCandidates.length ? fileCandidates.map((item, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "dsgc-mentionitem" + (i === mentionIdxC ? " on" : ""),
										role: "option",
										"aria-selected": i === mentionIdxC ? "true" : "false",
										onMouseDown: (e) => {
											e.preventDefault();
										},
										onClick: () => {
											insertFileChip(item.path, item.isDir ? "directory" : "file");
										},
										onMouseEnter: () => setMentionIdx(i),
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: "dsgc-fileglyph" + (item.isDir ? " dir" : " file"),
												"aria-hidden": "true",
												children: item.isDir ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.FileTypeIcon, {
													kind: "folder",
													size: 16
												}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.FileTypeIcon, {
													path: item.path,
													size: 16
												})
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: "dsgc-mentionname",
												children: item.path
											}),
											item.isDir ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: "dsgc-filedrill",
												children: Icon(_deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14, 12)
											}) : null
										]
									}, item.path)) : fileSearchLoading ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dsgc-mentionitem dsgc-hint",
										children: "检索中…"
									}) : fileSearchError ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dsgc-mentionitem dsgc-hint",
										children: fileSearchError
									}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dsgc-mentionitem dsgc-hint",
										children: "无匹配文件"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dsgc-mentionhint",
										children: fileSearchLoading && fileCandidates.length ? "检索中…" : fileCandidates.some((f) => f.isDir) ? "↑↓ 选择 · Enter 插入 · Tab 进入目录 · Esc 关闭" : "↑↓ 选择 · Enter 插入 · Esc 关闭"
									})]
								}) : null,
								!input.trim() ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dsgc-ph",
									"aria-hidden": "true",
									children: "发消息给全群，@成员 点名让其回应…"
								}) : null,
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dsgc-edit",
									ref: inputRef,
									contentEditable: true,
									suppressContentEditableWarning: true,
									role: "textbox",
									"aria-multiline": "true",
									"aria-label": "群聊消息输入框",
									onInput: onInputCE,
									onKeyDown: onInputKeyDown,
									onPaste: onPasteCE,
									onDrop: onDropCE,
									onDragOver: onDragOverCE,
									onBlur: () => {
										setMention(null);
									}
								})
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsgc-sendrow",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(PermissionSelect, {
									tier: group.permissionTier,
									onSelect: (tier) => {
										mutate({
											op: "setPermissionTier",
											groupId: group.id,
											tier
										});
									}
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { style: { flex: 1 } }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(HoverTip, {
									label: ROUNDS_HINT,
									side: "top",
									delayMs: 500,
									maxWidth: 280,
									className: "dsgc-rounds",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "dsgc-roundbtn",
											"aria-label": "减少轮数",
											disabled: rounds <= 1,
											onClick: () => {
												setRounds(Math.max(1, rounds - 1));
											},
											children: Icon(_deepseek_ai_dsh_client_ui_primitives.IconChevronLeftOutline14, 12)
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "dsgc-roundnum",
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RollingNumber, { value: rounds })
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "dsgc-roundbtn",
											"aria-label": "增加轮数",
											disabled: rounds >= 10,
											onClick: () => {
												setRounds(Math.min(10, rounds + 1));
											},
											children: Icon(_deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14, 12)
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											style: { padding: "0 6px 0 2px" },
											children: "轮"
										})
									]
								}),
								busyNow ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									variant: "outline",
									className: "dsgc-stopbtn",
									onClick: () => {
										stopRun();
									},
									children: [Icon(_deepseek_ai_dsh_client_ui_primitives.IconStopFill16, 16), "停止"]
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									variant: "primary",
									onClick: () => {
										sendMsg();
									},
									disabled: !input.trim() || !participants.length && !mentionedRoles.length || !sess,
									children: [Icon(_deepseek_ai_dsh_client_ui_primitives.IconSendOutline16, 16), "发送"]
								})
							]
						})]
					})
				]
			});
		}
		//#endregion
		//#region src/client/components/RoundTrack.tsx
		/**
		* 多轮进度轨道（RareUI Step player 的插件习语重写）：把本次 run 的发言计划
		* （queue：轮次 × 参与角色顺序展开）渲染为步点序列——已完成 = 角色色实心点、
		* 当前 = 拉伸小条 + 角色色微光扫动填充（静态淡底会被感知为卡住：深度思考
		* 模型首字节可等数十秒，扫动是「仍在进行」的常驻信号）、未开始 = 空心点；
		* 轮与轮之间加大间距。轨道尾部为当前发言人的运行计时（对齐主会话 TurnStatus
		* 时钟：锚定回话开始、1s tick、≥15s 才显示、`N秒`/`M分SS秒` 格式，数字走
		* RollingNumber 滚轮）。run 结束随组件卸载（临时态，不占常驻布局）。
		* 无播放/暂停控件（停止按钮在 composer），步点不可点。
		* @module dsh-group-chat/client/RoundTrack
		*/
		/** 主会话 TurnStatus 的显示门槛：计时 ≥15s 才出时钟（降低短回合噪音）。 */
		const SHOW_CLOCK_AFTER_MS = 15e3;
		/** 当前发言人运行计时（对齐主会话 formatRunDuration：`{seconds}秒` / `{minutes}分{seconds 补零2}秒`）。 */
		function TurnElapsed(props) {
			const { startedAt } = props;
			const [now, setNow] = (0, react.useState)(() => Date.now());
			(0, react.useEffect)(() => {
				const id = setInterval(() => {
					setNow(Date.now());
				}, 1e3);
				return () => {
					clearInterval(id);
				};
			}, []);
			const elapsed = Math.max(0, now - startedAt);
			if (elapsed < SHOW_CLOCK_AFTER_MS) return null;
			const total = Math.floor(elapsed / 1e3);
			const minutes = Math.floor(total / 60);
			const seconds = total % 60;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: "dsgc-rtrack-elapsed",
				title: "当前发言人已运行",
				children: minutes > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RollingNumber, { value: minutes }),
					"分",
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RollingNumber, {
						value: seconds,
						pad: 2
					}),
					"秒"
				] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RollingNumber, { value: seconds }), "秒"] })
			});
		}
		function RoundTrack(props) {
			const { snap } = props;
			const run = snap.run;
			const plan = run.queue;
			if (!plan.length) return null;
			const second = plan.indexOf(plan[0], 1);
			const perRound = second === -1 ? plan.length : second;
			const curIdx = run.currentRoleId ? run.queueIndex - 1 : -1;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsgc-rtrack",
				"aria-hidden": "true",
				children: [plan.map((roleId, i) => {
					const role = roleById(snap, roleId);
					const state = i === curIdx ? "cur" : i < run.queueIndex ? "done" : "todo";
					const title = "第 " + (i + 1) + " / " + plan.length + " 位：" + (role ? role.name : "未知角色") + (i === curIdx ? "（发言中）" : i < run.queueIndex ? "" : "（待发言）");
					return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dsgc-rtrack-step " + state + (perRound < plan.length && i > 0 && i % perRound === 0 ? " roundsep" : ""),
						style: { "--role-color": role && role.color || "#888" },
						title
					}, i);
				}), curIdx >= 0 && run.turnStartedAt !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TurnElapsed, { startedAt: run.turnStartedAt }) : null]
			});
		}
		//#endregion
		//#region src/client/components/ChatPanel.tsx
		function ChatPanel(props) {
			const { snap, sess, group, enabledRoles, participants, mentionedRoles, busyNow, input, mention, mentionCandidates, mentionIdxC, fileCandidates, fileSearchError, fileSearchLoading, rounds, err, atBottom, topicDraft, msgById, navOpen, asideOpen, inputRef, scrollRef, setTopicDraft, setConfirmClear, setMentionIdx, setRounds, setNavOpen, setAsideOpen, togglePart, onMsgsScroll, onInputCE, onInputKeyDown, onPasteCE, onDropCE, onDragOverCE, insertChip, insertFileChip, sendMsg, stopRun, action, mutate, setMention, onRetrySpeak, onToggleReaction } = props;
			const commitTopic = () => {
				if (topicDraft !== null && sess && topicDraft !== sess.topic) mutate({
					op: "setTopic",
					sessionId: sess.id,
					topic: topicDraft
				});
				setTopicDraft(null);
			};
			const bubbles = /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MessageFlow, {
				snap,
				sess,
				busyNow,
				msgById,
				action,
				onRetrySpeak,
				onToggleReaction
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: "dsgc-chat",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "dsgc-seambtn left" + (navOpen ? "" : " closed"),
						"aria-label": navOpen ? "收起群组导航栏" : "展开群组导航栏",
						title: navOpen ? "收起群组导航栏" : "展开群组导航栏",
						"aria-expanded": navOpen,
						onClick: () => {
							setNavOpen(!navOpen);
						},
						children: Icon(navOpen ? _deepseek_ai_dsh_client_ui_primitives.IconChevronLeftOutline14 : _deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14, 16)
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "dsgc-seambtn right" + (asideOpen ? "" : " closed"),
						"aria-label": asideOpen ? "收起成员与工作区栏" : "展开成员与工作区栏",
						title: asideOpen ? "收起成员与工作区栏" : "展开成员与工作区栏",
						"aria-expanded": asideOpen,
						onClick: () => {
							setAsideOpen(!asideOpen);
						},
						children: Icon(asideOpen ? _deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14 : _deepseek_ai_dsh_client_ui_primitives.IconChevronLeftOutline14, 16)
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dsgc-chathead",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsgc-chathead-row",
							children: [
								sess ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsgc-sess-title",
									title: "当前会话：" + sess.name,
									children: sess.name
								}) : null,
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									className: "dsgc-topic",
									value: topicDraft === null ? sess ? sess.topic : "" : topicDraft,
									placeholder: "设置本会话主题（可选）…",
									onChange: (e) => {
										setTopicDraft(e.target.value);
									},
									onBlur: commitTopic,
									onKeyDown: (e) => {
										if (e.key === "Enter") e.target.blur();
									}
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									variant: "ghost",
									size: "sm",
									className: "dsgc-clearbtn",
									title: "清空当前会话的消息记录",
									onClick: () => {
										if (sess) setConfirmClear(true);
									},
									children: "清空"
								})
							]
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dsgc-msgs",
						ref: scrollRef,
						onScroll: onMsgsScroll,
						children: sess && sess.messageIds.length > 0 ? bubbles : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsgc-empty",
							children: [
								Icon(_deepseek_ai_dsh_client_ui_primitives.IconSparkle16, 20),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dsgc-emptytitle",
									children: sess && sess.topic ? "「" + sess.topic + "」" : "会话已就绪"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dsgc-hint",
									children: enabledRoles.length ? "发送消息开始讨论；@成员 点名让其优先回应——每轮全体参与角色按顺序各发言一次，可用右下角轮数控制（1–10 轮）" : "先在右侧添加角色（每个角色可绑定不同模型），再回到这里发起讨论。"
								})
							]
						})
					}),
					busyNow && snap.run.queue.length ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RoundTrack, { snap }) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Composer, {
						snap,
						sess,
						group,
						enabledRoles,
						participants,
						mentionedRoles,
						busyNow,
						input,
						mention,
						mentionCandidates,
						mentionIdxC,
						fileCandidates,
						fileSearchError,
						fileSearchLoading,
						rounds,
						err,
						atBottom,
						bubblesLength: sess?.messageIds.length || 0,
						inputRef,
						scrollRef,
						setMentionIdx,
						setRounds,
						togglePart,
						onInputCE,
						onInputKeyDown,
						onPasteCE,
						onDropCE,
						onDragOverCE,
						insertChip,
						insertFileChip,
						sendMsg,
						stopRun,
						mutate,
						setMention
					})
				]
			});
		}
		//#endregion
		//#region src/client/lib/composer-draft.ts
		const LIMIT = 32;
		const drafts = /* @__PURE__ */ new Map();
		const empty = () => ({
			html: "",
			text: ""
		});
		/** 读指定会话草稿；命中则提到 LRU 最近端。 */
		function readComposerDraft(sessionId) {
			if (!sessionId) return empty();
			const hit = drafts.get(sessionId);
			if (!hit) return empty();
			drafts.delete(sessionId);
			drafts.set(sessionId, hit);
			return hit;
		}
		/** 写入；空草稿删槽。超出上限淘汰最旧槽。 */
		function writeComposerDraft(sessionId, html, text) {
			if (!sessionId) return;
			drafts.delete(sessionId);
			if (!html && !text) return;
			drafts.set(sessionId, {
				html,
				text
			});
			if (drafts.size > LIMIT) {
				const oldest = drafts.keys().next().value;
				if (oldest !== void 0) drafts.delete(oldest);
			}
		}
		/** 发送成功或明确丢弃时摘槽。 */
		function clearComposerDraft(sessionId) {
			if (sessionId) drafts.delete(sessionId);
		}
		//#endregion
		//#region src/client/hooks/useGroupChatState.ts
		/**
		* 群聊面板核心状态管理 hook
		* @module dsh-group-chat/client/hooks
		*/
		/**
		* 面板切换缓存（模块级，跨挂载存活）：main 为 keyed 槽，主会话⇄群聊切换会
		* 整体卸载重挂面板组件；缓存最近快照、选中项与按会话分槽的未发送草稿，
		* 让重挂载瞬时恢复上次视图。挂载后的 state 拉取 / SSE 首帧再行校正。
		*/
		let cachedSnap = null;
		let cachedGid = null;
		let cachedSid = null;
		function useGroupChatState() {
			const [snap, setSnap] = (0, react.useState)(() => cachedSnap);
			const [gid, setGid] = (0, react.useState)(() => cachedGid);
			const [sid, setSid] = (0, react.useState)(() => cachedSid);
			/** 已应用过的 lastCreated 会话标记：只在标记变化（真正的新建）时跟随选中，
			而不是每帧都把视图拽回「最近创建的会话」（流式期间每 120ms 一帧）。 */
			const appliedCreatedRef = (0, react.useRef)(cachedSnap?.lastCreated?.sessionId ?? null);
			/** 快照落地统一口：写状态 + 写切换缓存。 */
			const applySnap = (0, react.useCallback)((s) => {
				cachedSnap = s;
				setSnap(s);
			}, []);
			/** 选中项统一口：写状态 + 写切换缓存（重挂载恢复到用户离开时的位置）。 */
			const selectGroup = (0, react.useCallback)((v) => {
				cachedGid = v;
				setGid(v);
			}, []);
			const selectSession = (0, react.useCallback)((v) => {
				cachedSid = v;
				setSid(v);
			}, []);
			const [search, setSearch] = (0, react.useState)("");
			const [collapsedGroups, setCollapsedGroups] = (0, react.useState)(() => /* @__PURE__ */ new Set());
			const [asideOpen, setAsideOpen] = (0, react.useState)(true);
			const [navOpen, setNavOpen] = (0, react.useState)(true);
			const [atBottom, setAtBottom] = (0, react.useState)(true);
			const [renameDraft, setRenameDraft] = (0, react.useState)(null);
			const [confirmClear, setConfirmClear] = (0, react.useState)(false);
			const [topicDraft, setTopicDraft] = (0, react.useState)(null);
			const [roleDraft, setRoleDraft] = (0, react.useState)(null);
			const [models, setModels] = (0, react.useState)(null);
			const [modelsError, setModelsError] = (0, react.useState)(null);
			const [partsSel, setPartsSel] = (0, react.useState)(null);
			const [rounds, setRounds] = (0, react.useState)(1);
			const [input, setInput] = (0, react.useState)(() => readComposerDraft(cachedSid).text);
			const [mention, setMention] = (0, react.useState)(null);
			const [mentionIdx, setMentionIdx] = (0, react.useState)(0);
			const [err, setErr] = (0, react.useState)("");
			const inputRef = (0, react.useRef)(null);
			const sendingRef = (0, react.useRef)(false);
			const scrollRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				let live = true;
				api.state().then((s) => {
					if (live && s && s.ok) applySnap(s);
				}).catch(() => {});
				const events = new EventSource("/api/group-chat/events");
				events.onmessage = (message) => {
					try {
						const s = JSON.parse(message.data);
						if (!live || !s || !s.ok) return;
						if (s.lastCreated && s.lastCreated.sessionId && s.lastCreated.sessionId !== appliedCreatedRef.current) {
							appliedCreatedRef.current = s.lastCreated.sessionId;
							selectGroup(s.lastCreated.groupId);
							selectSession(s.lastCreated.sessionId);
							setPartsSel(null);
						}
						applySnap(s);
					} catch {}
				};
				return () => {
					live = false;
					events.close();
				};
			}, [
				applySnap,
				selectGroup,
				selectSession
			]);
			const action = (0, react.useCallback)(async (payload) => {
				try {
					return await api.action(payload);
				} catch (e) {
					setErr(String(e && e.message || e));
					return null;
				}
			}, []);
			const mutate = async (args) => {
				setErr("");
				const res = await action(Object.assign({ kind: "mutate" }, args));
				if (res && res.ok && res.snapshot) {
					if (res.lastCreated && res.lastCreated.sessionId && res.lastCreated.sessionId !== appliedCreatedRef.current) {
						appliedCreatedRef.current = res.lastCreated.sessionId;
						selectGroup(res.lastCreated.groupId);
						selectSession(res.lastCreated.sessionId);
						setPartsSel(null);
					}
					applySnap(res.snapshot);
					if (res.snapshot.error) setErr(res.snapshot.error);
				}
				return res;
			};
			return {
				snap,
				setSnap: applySnap,
				gid,
				setGid: selectGroup,
				sid,
				setSid: selectSession,
				search,
				setSearch,
				collapsedGroups,
				setCollapsedGroups,
				renameDraft,
				setRenameDraft,
				confirmClear,
				setConfirmClear,
				roleDraft,
				setRoleDraft,
				models,
				setModels,
				modelsError,
				setModelsError,
				partsSel,
				setPartsSel,
				rounds,
				setRounds,
				input,
				setInput,
				err,
				setErr,
				topicDraft,
				setTopicDraft,
				mention,
				setMention,
				mentionIdx,
				setMentionIdx,
				asideOpen,
				setAsideOpen,
				navOpen,
				setNavOpen,
				atBottom,
				setAtBottom,
				inputRef,
				sendingRef,
				scrollRef,
				action,
				mutate
			};
		}
		//#endregion
		//#region src/shared/file-mention-grammar.ts
		/**
		* Extract active @token at cursor position.
		* Matches @ at word boundary (line start or after whitespace).
		*
		* @param line - Current line text
		* @param cursor - Cursor offset in line
		* @returns Token or undefined if no active @token at cursor
		*/
		function activeAtToken(line, cursor) {
			const before = line.slice(0, cursor);
			const quotedMatch = /(?:^|\s)@"([^"]*)$/.exec(before);
			if (quotedMatch) return {
				prefix: quotedMatch[0].trimStart(),
				query: quotedMatch[1],
				quoted: true
			};
			const plainMatch = /(?:^|\s)@([^\s@]*)$/.exec(before);
			if (plainMatch) return {
				prefix: plainMatch[0].trimStart(),
				query: plainMatch[1],
				quoted: false
			};
		}
		//#endregion
		//#region src/client/utils/utils.ts
		/**
		* 通用工具函数
		* @module dsh-group-chat/client/utils
		*/
		/** HTML 转义（芯片以 execCommand('insertHTML') 注入，角色名需转义）。 */
		function escapeHtml(v) {
			return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
		}
		let execCommandFn;
		function execCommand(commandId, value) {
			execCommandFn ??= document.execCommand;
			return execCommandFn.call(document, commandId, false, value);
		}
		/**
		* contenteditable 输入区 → 纯文本序列化（发送/参与判定的唯一事实源）：
		* 文本节点原样；<br> → 换行；角色芯片（.dsgc-chipin[data-role-id]）展开回「@名字␠」；
		* 文件芯片（.dsgc-chipin[data-kind=file]）展开回「@path」或「@"path with spaces"」；
		* DIV/P 块前补换行（防粘贴残留的块级包裹）。
		*/
		function serializeInput(root) {
			const walk = (node) => {
				if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || "";
				if (node.nodeType !== Node.ELEMENT_NODE) return "";
				const el = node;
				if (el.tagName === "BR") return "\n";
				if (el.classList.contains("dsgc-chipin")) {
					if (el.dataset.roleId) return "@" + (el.dataset.name || "") + " ";
					if (el.dataset.kind === "file") {
						const path = el.dataset.path || "";
						return /\s/.test(path) ? `@"${path}"` : `@${path}`;
					}
				}
				return (/^(DIV|P)$/.test(el.tagName) ? "\n" : "") + Array.from(el.childNodes).map(walk).join("");
			};
			return Array.from(root.childNodes).map(walk).join("");
		}
		/** @角色芯片的 HTML（原子元素：contenteditable=false + draggable，退格整删；fresh=插入后需营救选区，加 data-new 标记）。 */
		function chipHtml(role, fresh = false) {
			const c = escapeHtml(role.color || "#888");
			return "<span class=\"dsgc-chipin\"" + (fresh ? " data-new=\"\"" : "") + " data-role-id=\"" + escapeHtml(role.id) + "\" data-name=\"" + escapeHtml(role.name) + "\" style=\"--role-color:" + c + "\" contenteditable=\"false\" draggable=\"true\"><span class=\"dsgc-chipdot\" style=\"background:" + c + "\"></span>" + escapeHtml(role.name) + "</span>";
		}
		/** 把宿主 FileTypeIcon 渲成静态 SVG，再塞进 insertHTML（与检索列表同一套字形）。 */
		function fileTypeIconMarkup(path, kind) {
			if (typeof document === "undefined") return "";
			const host = document.createElement("span");
			const root = (0, react_dom_client.createRoot)(host);
			try {
				(0, react_dom.flushSync)(() => {
					root.render(kind === "directory" ? (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.FileTypeIcon, {
						kind: "folder",
						size: 14
					}) : (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.FileTypeIcon, {
						path,
						size: 14
					}));
				});
				return host.innerHTML;
			} finally {
				root.unmount();
			}
		}
		/** @文件芯片的 HTML（原子元素：contenteditable=false + draggable，退格整删；fresh 同 chipHtml）。 */
		function fileChipHtml(path, kind, fresh = false) {
			const basename = path.split("/").pop() || path;
			return "<span class=\"dsgc-chipin dsgc-chipin-file\"" + (fresh ? " data-new=\"\"" : "") + " data-kind=\"file\"" + (kind === "directory" ? " data-dir=\"1\"" : "") + " data-path=\"" + escapeHtml(path) + "\" contenteditable=\"false\" draggable=\"true\"><span class=\"dsgc-chipglyph\" aria-hidden=\"true\">" + fileTypeIconMarkup(path, kind) + "</span>" + escapeHtml(basename) + "</span>";
		}
		/**
		* 光标前的活跃 @token（角色或文件弹层触发判定）。
		* 
		* @returns AtToken 对象，包含 prefix/query/quoted；无返回 null
		*/
		function queryAtCaret() {
			const sel = window.getSelection();
			if (!sel || !sel.isCollapsed || sel.rangeCount === 0) return null;
			const node = sel.anchorNode;
			if (!node || node.nodeType !== Node.TEXT_NODE) return null;
			const before = (node.nodeValue || "").slice(0, sel.anchorOffset);
			return activeAtToken(before, before.length) || null;
		}
		//#endregion
		//#region src/client/hooks/useComposer.ts
		/**
		* 消息输入相关 hooks
		* @module dsh-group-chat/client/hooks
		*/
		function useComposerEffects(inputRef, scrollRef, input, atBottom, snap) {
			const onMsgsScroll = (0, react.useCallback)(() => {
				const el = scrollRef.current;
				if (!el) return;
				return el.scrollHeight - el.scrollTop - el.clientHeight < 60;
			}, [scrollRef]);
			(0, react.useEffect)(() => {
				const el = scrollRef.current;
				if (el && atBottom) el.scrollTop = el.scrollHeight;
			}, [
				snap,
				atBottom,
				scrollRef
			]);
			(0, react.useEffect)(() => {
				const el = inputRef.current;
				if (!el) return;
				el.style.height = "auto";
				el.style.height = Math.min(180, Math.max(36, el.scrollHeight)) + "px";
			}, [input, inputRef]);
			return { onMsgsScroll };
		}
		function useComposerInput(inputRef, setInput, setMention, setMentionIdx, sessionId) {
			const sessionIdRef = (0, react.useRef)(sessionId);
			sessionIdRef.current = sessionId;
			/** 从 DOM 同步 input 状态（序列化），并写入当前会话草稿槽。 */
			const syncFromDOM = (0, react.useCallback)(() => {
				const el = inputRef.current;
				if (!el) return;
				const text = serializeInput(el);
				setInput(text);
				writeComposerDraft(sessionIdRef.current, el.innerHTML, text);
			}, [inputRef, setInput]);
			return {
				syncFromDOM,
				onInputCE: (0, react.useCallback)(() => {
					syncFromDOM();
					setMention(queryAtCaret());
					setMentionIdx(0);
				}, [
					syncFromDOM,
					setMention,
					setMentionIdx
				]),
				onPasteCE: (0, react.useCallback)((e) => {
					e.preventDefault();
					const text = e.clipboardData.getData("text/plain");
					if (text) execCommand("insertText", text);
				}, []),
				onDragOverCE: (0, react.useCallback)((e) => {
					e.preventDefault();
				}, []),
				onDropCE: (0, react.useCallback)((e) => {
					e.preventDefault();
					const text = e.dataTransfer.getData("text/plain");
					if (text) execCommand("insertText", text);
				}, [])
			};
		}
		/**
		* 按会话恢复草稿：切会话时先把当前 HTML 写入旧槽，再灌入新槽；
		* 面板重挂载（主会话⇄群聊）时 editor 是新节点，从模块缓存灌回。
		*/
		function useComposerDraft(sessionId, inputRef, setInput, setMention) {
			const prevIdRef = (0, react.useRef)(null);
			(0, react.useLayoutEffect)(() => {
				const el = inputRef.current;
				const prev = prevIdRef.current;
				const next = sessionId || null;
				if (el && prev && prev !== next) writeComposerDraft(prev, el.innerHTML, serializeInput(el));
				prevIdRef.current = next;
				if (!next) return;
				const draft = readComposerDraft(next);
				if (el) el.innerHTML = draft.html;
				setInput(draft.text);
				setMention(null);
				return () => {
					const node = inputRef.current;
					const id = prevIdRef.current;
					if (node && id) writeComposerDraft(id, node.innerHTML, serializeInput(node));
				};
			}, [
				sessionId,
				inputRef,
				setInput,
				setMention
			]);
		}
		function useMentionChip(inputRef, setMention, setMentionIdx, syncFromDOM) {
			/** 弹层候选 → 删掉光标前的 @词、插入带 data-new 标记的芯片 + 尾随空格。 */
			const insertChipHtml = (0, react.useCallback)((html) => {
				const el = inputRef.current;
				const sel = window.getSelection();
				if (!el || !sel) return;
				if (!sel.anchorNode || !el.contains(sel.anchorNode)) return;
				el.focus({ preventScroll: true });
				const node = sel.anchorNode;
				if (node.nodeType === Node.TEXT_NODE) {
					const text = node.nodeValue || "";
					const off = sel.anchorOffset;
					const before = text.slice(0, off);
					const m = /(?:^|\s)@("?)([^"\s@]*)$/.exec(before);
					if (m) {
						const prefixLen = m[1] ? 2 : 1;
						const queryLen = m[2].length;
						const start = off - prefixLen - queryLen;
						if (start >= 0) {
							const range = document.createRange();
							range.setStart(node, start);
							range.setEnd(node, off);
							sel.removeAllRanges();
							sel.addRange(range);
							execCommand("delete");
						}
					}
				}
				execCommand("insertHTML", html);
				const chip = el.querySelector(".dsgc-chipin[data-new]");
				if (!chip) return;
				const after = document.createRange();
				after.setStartAfter(chip);
				after.collapse(true);
				sel.removeAllRanges();
				sel.addRange(after);
				execCommand("insertText", " ");
				chip.removeAttribute("data-new");
				setMention(null);
				setMentionIdx(0);
				syncFromDOM();
			}, [
				inputRef,
				setMention,
				setMentionIdx,
				syncFromDOM
			]);
			return {
				insertChip: (0, react.useCallback)((role) => {
					insertChipHtml(chipHtml(role, true));
				}, [insertChipHtml]),
				insertFileChip: (0, react.useCallback)((path, kind) => {
					insertChipHtml(fileChipHtml(path, kind, true));
				}, [insertChipHtml])
			};
		}
		function useInputKeyboard(mention, mentionCandidates, mentionIdxC, setMentionIdx, insertChip, insertFileChip, fileCandidates, setMention, sendMsg) {
			return { onInputKeyDown: (0, react.useCallback)((e) => {
				if (e.nativeEvent.isComposing || e.keyCode === 229) return;
				if (mention !== null && mention.query === "" && mentionCandidates.length) {
					if (e.key === "ArrowDown") {
						e.preventDefault();
						setMentionIdx((mentionIdxC + 1) % mentionCandidates.length);
						return;
					}
					if (e.key === "ArrowUp") {
						e.preventDefault();
						setMentionIdx((mentionIdxC - 1 + mentionCandidates.length) % mentionCandidates.length);
						return;
					}
					if (e.key === "Enter" && !e.shiftKey || e.key === "Tab") {
						e.preventDefault();
						insertChip(mentionCandidates[mentionIdxC]);
						return;
					}
				}
				if (mention !== null && mention.query !== "" && fileCandidates.length) {
					if (e.key === "ArrowDown") {
						e.preventDefault();
						setMentionIdx((mentionIdxC + 1) % fileCandidates.length);
						return;
					}
					if (e.key === "ArrowUp") {
						e.preventDefault();
						setMentionIdx((mentionIdxC - 1 + fileCandidates.length) % fileCandidates.length);
						return;
					}
					const selectedItem = fileCandidates[mentionIdxC];
					if (selectedItem) {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							insertFileChip(selectedItem.path, selectedItem.isDir ? "directory" : "file");
							return;
						}
						if (e.key === "Tab" && selectedItem.isDir) {
							e.preventDefault();
							insertFileChip(selectedItem.path, "directory");
							return;
						}
					}
					if (e.key === "Escape") {
						e.preventDefault();
						setMention(null);
						return;
					}
				}
				if (e.key === "Enter" && e.shiftKey) {
					e.preventDefault();
					execCommand("insertLineBreak");
					return;
				}
				if (e.key === "Enter" && !e.shiftKey) {
					e.preventDefault();
					sendMsg();
				}
			}, [
				mention,
				mentionCandidates,
				mentionIdxC,
				fileCandidates,
				setMentionIdx,
				insertChip,
				insertFileChip,
				setMention,
				sendMsg
			]) };
		}
		//#endregion
		//#region src/client/hooks/useFileSearch.ts
		/**
		* 文件搜索 hook：防抖 + 取消过期请求 + 短缓存。
		* @module dsh-group-chat/client/hooks
		*/
		const DEBOUNCE_MS = 180;
		const CACHE_LIMIT = 20;
		const cache = /* @__PURE__ */ new Map();
		function cacheGet(key) {
			const hit = cache.get(key);
			if (!hit) return void 0;
			cache.delete(key);
			cache.set(key, hit);
			return hit;
		}
		function cacheSet(key, value) {
			cache.delete(key);
			cache.set(key, value);
			if (cache.size > CACHE_LIMIT) {
				const oldest = cache.keys().next().value;
				if (oldest !== void 0) cache.delete(oldest);
			}
		}
		function isAbort(err) {
			return !!err && typeof err === "object" && "name" in err && err.name === "AbortError";
		}
		/**
		* 文件搜索：query 变化 180ms 内合并；过期 fetch 真正 abort；
		* 命中短缓存立刻出结果。离开文件模式才清空列表，避免每个按键闪「检索中」。
		*/
		function useFileSearch(mention, groupId) {
			const [fileCandidates, setFileCandidates] = (0, react.useState)([]);
			const [fileSearchError, setFileSearchError] = (0, react.useState)(null);
			const [fileSearchLoading, setFileSearchLoading] = (0, react.useState)(false);
			const query = mention && mention.query !== "" ? mention.query : null;
			(0, react.useEffect)(() => {
				if (query === null || !groupId) {
					setFileCandidates([]);
					setFileSearchError(null);
					setFileSearchLoading(false);
					return;
				}
				const key = groupId + "\0" + query;
				const hit = cacheGet(key);
				if (hit) {
					setFileCandidates(hit);
					setFileSearchError(null);
					setFileSearchLoading(false);
					return;
				}
				const controller = new AbortController();
				setFileSearchLoading(true);
				const timer = window.setTimeout(() => {
					const run = async () => {
						try {
							const res = await api.action({
								kind: "fileSearch",
								groupId,
								query
							}, controller.signal);
							if (controller.signal.aborted) return;
							if (res.ok) {
								const next = res.candidates || [];
								cacheSet(key, next);
								setFileCandidates(next);
								setFileSearchError(null);
							} else {
								setFileCandidates([]);
								setFileSearchError(res.error || "文件检索失败");
							}
						} catch (err) {
							if (controller.signal.aborted || isAbort(err)) return;
							setFileCandidates([]);
							setFileSearchError(String(err));
						} finally {
							if (!controller.signal.aborted) setFileSearchLoading(false);
						}
					};
					run();
				}, DEBOUNCE_MS);
				return () => {
					window.clearTimeout(timer);
					controller.abort();
				};
			}, [query, groupId]);
			return {
				fileCandidates,
				fileSearchError,
				fileSearchLoading
			};
		}
		//#endregion
		//#region src/client/hooks/useMentionState.ts
		/**
		* 提及状态 hook：封装角色/文件提及相关的派生状态计算
		* @module dsh-group-chat/client/hooks
		*/
		/**
		* 计算角色提及候选列表
		* @param mention - 当前 @ token 状态
		* @param enabledRoles - 启用的角色列表
		* @returns 角色候选列表（仅在角色模式且 query 为空时返回）
		*/
		function useMentionCandidates(mention, enabledRoles) {
			return (0, react.useMemo)(() => {
				return mention !== null && mention.query === "" ? enabledRoles : [];
			}, [mention, enabledRoles]);
		}
		/**
		* 检测输入文本中被 @ 的角色
		* @param input - 输入文本
		* @param enabledRoles - 启用的角色列表
		* @returns 被提及的角色列表
		*/
		function useMentionedRoles(input, enabledRoles) {
			return (0, react.useMemo)(() => {
				return enabledRoles.filter((r) => new RegExp("(^|\\s)@" + escapeRegExp(r.name) + "(?=\\s|$)").test(input));
			}, [input, enabledRoles]);
		}
		/**
		* 计算安全的候选索引（确保不越界）
		* @param candidatesLength - 候选列表长度
		* @param currentIndex - 当前索引
		* @returns 安全的索引值
		*/
		function useSafeMentionIndex(candidatesLength, currentIndex) {
			return (0, react.useMemo)(() => {
				return candidatesLength ? Math.min(currentIndex, candidatesLength - 1) : 0;
			}, [candidatesLength, currentIndex]);
		}
		//#endregion
		//#region src/client/GroupChatPanel.tsx
		/**
		* 主面板：三区工作台——左导航栏（搜索 + 群组→会话目录树）、中央会话流
		* （@成员 点名 + markdown 渲染 + 思考折叠）、右上下文栏（群成员角色卡 +
		* 工作区目录），右栏可收起，角色编辑走右侧滑出抽屉。
		*
		* 面板数据走 /api/group-chat/*（fetch + SSE），Host 半持有全部状态。
		* @module dsh-group-chat/client/panel
		*/
		function GroupChatPanel() {
			const { snap, gid, setGid, sid, setSid, search, setSearch, collapsedGroups, setCollapsedGroups, renameDraft, setRenameDraft, confirmClear, setConfirmClear, roleDraft, setRoleDraft, models, setModels, modelsError, setModelsError, partsSel, setPartsSel, rounds, setRounds, input, setInput, err, setErr, topicDraft, setTopicDraft, mention, setMention, mentionIdx, setMentionIdx, asideOpen, setAsideOpen, navOpen, setNavOpen, atBottom, setAtBottom, inputRef, sendingRef, scrollRef, action, mutate } = useGroupChatState();
			const [toast, setToast] = (0, react.useState)(null);
			const { onMsgsScroll } = useComposerEffects(inputRef, scrollRef, input, atBottom, snap);
			let group = snap && gid ? groupById(snap, gid) : null;
			if (!group && snap && snap.groups.length) group = snap.groups[0];
			let sess = snap && sid ? sessById(snap, sid) : null;
			if ((!sess || sess.groupId !== group?.id) && group && snap) sess = group.sessionIds.length ? sessById(snap, group.sessionIds[group.sessionIds.length - 1]) : null;
			const { syncFromDOM, onInputCE, onPasteCE, onDragOverCE, onDropCE } = useComposerInput(inputRef, setInput, setMention, setMentionIdx, sess ? sess.id : null);
			useComposerDraft(sess ? sess.id : null, inputRef, setInput, setMention);
			const enabledRoles = group ? group.roleIds.map((id) => roleById(snap, id)).filter((r) => !!r && r.enabled) : [];
			const participants = partsSel || enabledRoles.map((r) => r.id);
			const busyNow = !!(sess && snap && snap.run.running && snap.run.sessionId === sess.id);
			const finishedRun = snap ? snap.run.finished : null;
			(0, react.useEffect)(() => {
				if (finishedRun && sess && finishedRun.sessionId === sess.id) mutate({ op: "ackFinish" });
			}, [finishedRun, sess]);
			const mentionCandidates = useMentionCandidates(mention, enabledRoles);
			const { fileCandidates, fileSearchError, fileSearchLoading } = useFileSearch(mention, group?.id);
			const mentionIdxC = useSafeMentionIndex(mentionCandidates.length || fileCandidates.length, mentionIdx);
			const mentionedRoles = useMentionedRoles(input, enabledRoles);
			const { insertChip, insertFileChip } = useMentionChip(inputRef, setMention, setMentionIdx, syncFromDOM);
			const sendMsg = (0, react.useCallback)(async () => {
				if (busyNow || !sess || sendingRef.current) return;
				if (!input.trim()) return;
				sendingRef.current = true;
				try {
					if (!participants.length && !mentionedRoles.length) {
						setErr("请至少选择一个参与角色（或在消息中 @成员）");
						return;
					}
					const parts = mentionedRoles.length ? mentionedRoles.map((r) => r.id) : participants;
					const res = await action({
						kind: "send",
						sessionId: sess.id,
						text: input,
						participantRoleIds: parts,
						rounds
					});
					if (res && !res.ok && res.error) setErr(res.error);
					else if (res && res.ok) {
						const el = inputRef.current;
						if (el) el.innerHTML = "";
						setInput("");
						setMention(null);
						setErr("");
						setAtBottom(true);
						clearComposerDraft(sess.id);
						syncFromDOM();
					}
				} finally {
					sendingRef.current = false;
				}
			}, [
				busyNow,
				sess,
				sendingRef,
				mentionedRoles,
				participants,
				action,
				rounds,
				input,
				inputRef,
				setInput,
				setMention,
				setErr,
				setAtBottom,
				syncFromDOM
			]);
			const { onInputKeyDown } = useInputKeyboard(mention, mentionCandidates, mentionIdxC, setMentionIdx, insertChip, insertFileChip, fileCandidates, setMention, sendMsg);
			if (!snap) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dsgc-root",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsgc-loading",
					children: [Icon(_deepseek_ai_dsh_client_ui_primitives.IconLoadingOutline16, 16), "加载中…"]
				})
			});
			if (!group) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dsgc-root",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dsgc-loading",
					children: "暂无群组"
				})
			});
			const msgById = {};
			for (const m of snap.messages) msgById[m.id] = m;
			const togglePart = (rid) => {
				const has = participants.includes(rid);
				setPartsSel(has ? participants.filter((x) => x !== rid) : participants.concat([rid]));
			};
			const retrySpeak = async (messageId) => {
				if (!sess) return;
				if (busyNow || snap && snap.run.running) {
					setToast({
						text: "已有对话进行中，请先停止",
						seq: Date.now()
					});
					return;
				}
				const res = await action({
					kind: "retrySpeak",
					sessionId: sess.id,
					messageId
				});
				if (res && !res.ok && res.error) setToast({
					text: res.error,
					seq: Date.now()
				});
			};
			const toggleReaction = (messageId, emoji) => {
				mutate({
					op: "reactMessage",
					messageId,
					emoji
				});
			};
			const doClear = async () => {
				if (!sess) return;
				if (busyNow) {
					setToast({
						text: "对话进行中，需先停止才能清空",
						seq: Date.now()
					});
					return;
				}
				const res = await mutate({
					op: "clearMessages",
					sessionId: sess.id
				});
				if (res && res.ok && res.snapshot && !res.snapshot.error) setConfirmClear(false);
				else if (res && res.snapshot && res.snapshot.error) {
					setErr("");
					setToast({
						text: res.snapshot.error,
						seq: Date.now()
					});
				}
			};
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
					setModelsError(String(e && e.message || e));
				}
			};
			const openRoleEditor = async (role) => {
				setErr("");
				if (!models || modelsError) await fetchModels();
				setRoleDraft(role ? draftFromRole(role) : blankDraft());
			};
			const stopRun = async () => {
				await action({
					kind: "stop",
					sessionId: sess.id
				});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsgc-root",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(NavPanel, {
						snap,
						search,
						setSearch,
						collapsedGroups,
						setCollapsedGroups,
						gid: group.id,
						sid: sess ? sess.id : sid,
						setGid,
						setSid,
						setPartsSel,
						renameDraft,
						setRenameDraft,
						mutate,
						navOpen
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ChatPanel, {
						snap,
						sess,
						group,
						enabledRoles,
						participants,
						mentionedRoles,
						busyNow,
						input,
						mention,
						mentionCandidates,
						mentionIdxC,
						fileCandidates,
						fileSearchError,
						fileSearchLoading,
						rounds,
						err,
						atBottom,
						topicDraft,
						msgById,
						navOpen,
						asideOpen,
						inputRef,
						scrollRef,
						setTopicDraft,
						setConfirmClear,
						setMentionIdx,
						setRounds,
						setNavOpen,
						setAsideOpen,
						togglePart,
						onMsgsScroll: () => {
							const isBottom = onMsgsScroll();
							if (isBottom !== void 0) setAtBottom(isBottom);
						},
						onInputCE,
						onInputKeyDown,
						onPasteCE,
						onDropCE,
						onDragOverCE,
						insertChip,
						insertFileChip,
						sendMsg,
						stopRun,
						action,
						mutate,
						setMention,
						onRetrySpeak: (messageId) => {
							retrySpeak(messageId);
						},
						onToggleReaction: toggleReaction
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(AsidePanel, {
						snap,
						group,
						asideOpen,
						mutate,
						openRoleEditor
					}),
					sess && confirmClear ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: true,
						onClose: () => {
							setConfirmClear(false);
						},
						title: "清空本会话的消息记录？",
						closeLabel: "关闭",
						description: "会话「" + sess.name + "」的全部 " + sess.messageIds.length + " 条消息将被永久删除",
						footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							size: "sm",
							onClick: () => {
								setConfirmClear(false);
							},
							children: "取消"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							size: "sm",
							className: "dsgc-stopbtn",
							onClick: () => {
								doClear();
							},
							children: "清空"
						})] }),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("ul", {
							className: "dsgc-clearnotes",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: "删除内容：本会话的用户消息与角色发言（含思考、工具调用记录）以及本会话结论/约束备忘，确认后立即落盘" }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: "不可恢复：此操作没有回收站，也没有撤销" }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: "不受影响：会话本身与主题、群成员角色、工作区目录、权限档位" })
							]
						})
					}) : null,
					toast ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Toast, {
						text: toast.text,
						icon: Icon(_deepseek_ai_dsh_client_ui_primitives.IconWarningOutline16, 16),
						anchor: inputRef.current,
						onDone: () => {
							setToast(null);
						}
					}, toast.seq) : null,
					roleDraft ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RoleDrawer, {
						draft: roleDraft,
						set: setRoleDraft,
						groupId: group.id,
						models,
						modelsError,
						onRetryModels: () => {
							fetchModels();
						},
						mutate,
						onCancel: () => {
							setRoleDraft(null);
						}
					}) : null
				]
			});
		}
		//#endregion
		//#region src/client/components/GroupChatSettingsSection.tsx
		/**
		* 设置页：启停开关（settings.section 插槽）。写 host 的 group-chat 设置
		* 命名空间（settings.yaml 持久化）。
		* @module dsh-group-chat/client/settings
		*/
		function GroupChatSettingsSection(props) {
			const scope = props.settingsScope;
			const [snap, setSnap] = (0, react.useState)(null);
			const [pending, setPending] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				let live = true;
				const read = () => {
					if (!live) return;
					try {
						setSnap(scope.getSnapshot());
					} catch {}
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
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dgcs-page",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dgcs-head",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
						className: "dgcs-title",
						children: "模型群聊"
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "dgcs-desc",
						children: "多模型角色群组对话面板：每个角色绑定不同的 provider/model；群组内多会话目录树管理，群内共享对话记录与工作区目录；消息以 markdown 渲染、支持思考折叠；输入框支持 @成员 / @文件。数据持久化于 ~/.dsh/storages/group-chat/，重启 dsh web 后恢复。"
					})]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dgcs-card",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dgcs-cardtext",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dgcs-cardtitle",
							children: enabled ? "已启用" : "已停用"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dgcs-cardhint",
							children: writable ? enabled ? "关闭后侧边栏将不再显示「群聊」入口，进行中的对话会被中止。" : "开启后侧边栏显示「群聊」入口。" : "当前设置不可写（可能被配置文件覆盖）。"
						})]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Switch, {
						checked: enabled,
						onChange: () => {
							toggle();
						},
						disabled: !writable || pending,
						label: "模型群聊启停",
						title: pending ? "正在写入…" : enabled ? "点击停用" : "点击启用"
					})]
				})]
			});
		}
		//#endregion
		//#region src/client/components/Glyph.tsx
		function Glyph(props) {
			const size = props && props.size || 18;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: "dsgc-entryOverlay newSession",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "dsgc-entryIcon",
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
						width: size,
						height: size,
						viewBox: "0 0 24 24",
						fill: "none",
						stroke: "currentColor",
						strokeWidth: 1.8,
						strokeLinecap: "round",
						strokeLinejoin: "round",
						"aria-hidden": "true",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
								cx: 9,
								cy: 7,
								r: 4
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M23 21v-2a4 4 0 0 0-3-3.87" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })
						]
					})
				})
			});
		}
		//#endregion
		//#region src/client/index.ts
		const SETTINGS_NAMESPACE = "group-chat";
		/** Client plugin id. */
		const name = "group-chat-client";
		/** Required services. */
		const inject = ["slots", "settingsScope"];
		/**
		* 客户端插件体：设置页常驻注册 + 启用门控挂载侧边栏入口与主面板。
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			injectStyles();
			const scope = ctx.settingsScope.bind({ namespace: SETTINGS_NAMESPACE });
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "dsh-group-chat",
				order: 60,
				label: () => "模型群聊",
				inject: () => ({ settingsScope: scope })
			}, (props) => (0, react.createElement)(GroupChatSettingsSection, props)));
			let uiDisposer;
			const mountUi = () => {
				if (uiDisposer !== void 0) return;
				const disposers = [];
				try {
					disposers.push(ctx.slots.inject("main", () => ctx.slots.register({
						name: "main",
						key: "group-chat"
					}, () => (0, react.createElement)(GroupChatPanel, null))));
					disposers.push(ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
						name: "sidebar.panellist",
						id: "group-chat",
						order: 50,
						label: "群聊"
					}, (props) => (0, react.createElement)(Glyph, props))));
				} catch (e) {
					console.error("[dsh-group-chat] mount failed:", e);
				}
				uiDisposer = () => {
					uiDisposer = void 0;
					for (const dispose of disposers.splice(0)) dispose();
				};
			};
			const syncEnabled = () => {
				const snapshot = scope.getSnapshot();
				if (snapshot.status === "ready" ? (snapshot.value && snapshot.value.enabled) !== false : snapshot.status === "unavailable") mountUi();
				else if (uiDisposer !== void 0) uiDisposer();
			};
			scope.subscribe(syncEnabled);
			syncEnabled();
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map