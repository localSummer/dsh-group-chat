window.__ModuleLoader__.load({
	id: "dsh-group-chat",
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
		//#region src/client/styles.ts
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
			".dsgc-loading{padding:24px;color:var(--dsw-alias-label-tertiary,inherit);display:flex;gap:8px;align-items:center}",
			".dsgc-loading svg{animation:dsgc-spin 1s linear infinite}",
			"@keyframes dsgc-spin{to{transform:rotate(360deg)}}",
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
			".dsgc-tool{margin:2px 0}",
			".dsgc-tool .dsgc-toolrow{font-size:12px;color:var(--dsw-alias-label-secondary,inherit);border-radius:8px;padding:3px 8px;transition:background-color .12s}",
			".dsgc-tool .dsgc-toolrow:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.1))}",
			".dsgc-tool .dsgc-toolsummary{color:var(--dsw-alias-label-tertiary,inherit);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:40ch;font-size:11.5px;margin-left:6px}",
			".dsgc-tool .dsgc-toolbody{font-size:12px;line-height:1.6;color:var(--dsw-alias-label-secondary,inherit);white-space:pre-wrap;word-break:break-word;border-left:2px solid var(--dsw-alias-border-l2,rgba(128,128,128,.25));margin:2px 0 4px;padding:2px 0 2px 10px;max-height:260px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent}",
			".dsgc-confirm{border:1px solid var(--dsw-alias-state-business-primary,#4f6ef7);border-radius:12px;background:var(--dsw-alias-bg-layer-3,rgba(128,128,128,.06));padding:10px 12px;display:flex;flex-direction:column;gap:8px;max-width:76%;animation:dsgc-fade-in .18s ease-out}",
			".dsgc-confirmtitle{font-size:12px;font-weight:600;color:var(--dsw-alias-label-primary,inherit);display:flex;align-items:center;gap:6px}",
			".dsgc-confirmcmd{font-size:12px;line-height:1.6;white-space:pre-wrap;word-break:break-word;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));border-radius:8px;padding:8px 10px;background:var(--dsw-alias-bg-layer-2,transparent);color:var(--dsw-alias-label-primary,inherit);max-height:240px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent}",
			".dsgc-confirmops{display:flex;gap:8px;justify-content:flex-end}",
			".dsgc-sysmsg.err{color:var(--dsw-alias-state-error-primary,#e5484d)}",
			".dsgc-err{font-size:12px;color:var(--dsw-alias-state-error-primary,#e5484d);animation:dsgc-fade-in .18s ease-out}",
			".dsgc-empty{margin:auto;display:flex;flex-direction:column;align-items:center;gap:10px;color:var(--dsw-alias-label-tertiary,inherit);text-align:center;max-width:40ch;padding:24px;animation:dsgc-fade-in .3s ease-out}",
			".dsgc-empty svg{opacity:.5}",
			".dsgc-empty .dsgc-emptytitle{font-size:13px;font-weight:600;color:var(--dsw-alias-label-secondary,inherit)}",
			".dsgc-empty .dsgc-hint{text-wrap:balance}",
			".dsgc-tobottom{position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);z-index:12;animation:dsgc-rise-in .18s cubic-bezier(.16,1,.3,1)}",
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
			".dsgc-mentionwrap{position:relative}",
			".dsgc-mention{animation:dsgc-pop-in .16s cubic-bezier(.16,1,.3,1);position:absolute;left:0;right:0;bottom:calc(100% + 6px);background:var(--dsw-alias-bg-layer-3,#fff);border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));border-radius:10px;box-shadow:var(--dsw-shadow-lv3,0 8px 24px rgba(0,0,0,.18));max-height:220px;overflow-y:auto;padding:4px;z-index:30;display:flex;flex-direction:column;gap:2px;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,rgba(128,128,128,.35)) transparent}",
			".dsgc-mentionitem{display:flex;align-items:center;gap:8px;border:none;background:none;color:var(--dsw-alias-label-secondary,inherit);font:inherit;font-size:12.5px;text-align:left;cursor:pointer;padding:6px 8px;border-radius:6px;transition:background-color .12s,color .12s}",
			".dsgc-mentionitem.on,.dsgc-mentionitem:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.15));color:var(--dsw-alias-label-primary,inherit)}",
			".dsgc-mentionname{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}",
			".dsgc-mentionmodel{font-size:11px;color:var(--dsw-alias-label-tertiary,inherit)}",
			".dsgc-mentionhint{font-size:11px;color:var(--dsw-alias-label-tertiary,inherit);padding:2px 8px 1px}",
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
			"@keyframes dsgc-think-in{from{opacity:0;transform:translateY(-3px)}}",
			"@keyframes dsgc-pop-in{from{opacity:0;transform:translateY(4px)}}",
			"@keyframes dsgc-rise-in{from{opacity:0;transform:translate(-50%,6px)}}",
			"@keyframes dsgc-fade-in{from{opacity:0}}",
			"@keyframes dsgc-presence{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--role-color,#4f6ef7) 0%,transparent)}50%{box-shadow:0 0 0 4px var(--presence-ring)}}",
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
			".dsgc-partchip:focus-visible,.dsgc-mentionitem:focus-visible,.dsgc-dot:focus-visible,.dsgc-opbtn:focus-visible,.dsgc-twist:focus-visible,.dsgc-addsess:focus-visible,.dsgc-grow-row:focus-visible,.dsgc-sess-row:focus-visible,.dsgc-rename:focus-visible,.dsgc-fbrow:focus-visible,.dsgc-role:focus-visible,.dsgc-roundbtn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,var(--dsw-alias-state-business-primary,#4f6ef7));outline-offset:1px}",
			"@container (max-width: 880px){.dsgc-aside{position:absolute;top:0;right:0;bottom:0;z-index:15;width:min(304px,88%);box-shadow:-12px 0 32px rgba(0,0,0,.16);border-left:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));transition:transform .3s cubic-bezier(.16,1,.3,1),opacity .2s ease}.dsgc-aside>*{width:auto}.dsgc-aside.closed{width:min(304px,88%);padding-left:12px;padding-right:12px;border-left-width:1px;transform:translateX(calc(100% + 14px));opacity:0;transition:transform .26s ease-in,opacity .18s ease-in,visibility 0s .24s}}",
			"@container (max-width: 640px){.dsgc-nav{width:200px}.dsgc-msgbody{max-width:88%}}",
			"[class*=\"panelList\"]:has(.dsgc-entryOverlay){margin-top:4px}",
			"[class*=\"panelRow\"]:has(.dsgc-entryOverlay){position:relative;box-sizing:border-box;height:36px;min-height:36px;padding:0 10px;font-size:13px}",
			"[class*=\"panelRow\"][class*=\"panelActive\"]:has(.dsgc-entryOverlay){font-weight:600}",
			"[class*=\"panelRow\"]:has(.dsgc-entryOverlay) > [class*=\"panelTitle\"]{padding-left:24px}",
			".dsgc-entryOverlay{position:absolute;inset:0;display:flex;align-items:center;padding:0 10px;box-sizing:border-box}",
			".dsgc-entryIcon{flex:none;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center}",
			".dsgc-entryIcon svg{width:18px;height:18px;display:block}",
			"[data-sidebar-collapsed] .dsgc-entryOverlay,[class*=\"collapsed\"] .dsgc-entryOverlay{justify-content:center;padding:0}",
			"[data-sidebar-collapsed] [class*=\"panelRow\"]:has(.dsgc-entryOverlay),[class*=\"collapsed\"] [class*=\"panelRow\"]:has(.dsgc-entryOverlay){margin:0 auto}",
			"@media (prefers-reduced-motion:reduce){.dsgc-dot,.dsgc-partchip,.dsgc-mentionitem,.dsgc-grow-row,.dsgc-sess-row,.dsgc-opbtn,.dsgc-addsess,.dsgc-topic,.dsgc-role,.dsgc-rename,.dsgc-input,.dsgc-select,.dsgc-textarea,.dsgc-fbrow,.dsgc-twist svg,.dsgc-roleops,.dsgc-roundbtn,.dsgc-aside,.dsgc-aside.closed{transition:none}.dsgc-dot:hover{transform:none}.dsgc-drawer,.dsgc-msg,.dsgc-sysmsg,.dsgc-mention,.dsgc-tobottom,.dsgc-err,.dsgc-empty,.dsgc-fb,.dsgc-think .dsgc-thinkbody,.dsgc-msg.live .dsgc-avatar,.dsgc-loading svg{animation:none}}",
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
				tag.dataset.plugin = "dsh-group-chat";
				tag.dataset.pluginCss = TAG_ID;
				tag.textContent = CSS;
				document.head.appendChild(tag);
			}
		}
		//#endregion
		//#region src/client/ui.ts
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
		//#region src/client/model.ts
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
		function fmtTime(ts) {
			const delta = Math.max(0, Date.now() - ts);
			if (delta < 6e4) return "刚刚";
			if (delta < 36e5) return Math.floor(delta / 6e4) + " 分钟前";
			if (delta < 864e5) return Math.floor(delta / 36e5) + " 小时前";
			const d = new Date(ts);
			return d.getFullYear() === (/* @__PURE__ */ new Date()).getFullYear() ? d.getMonth() + 1 + "月" + d.getDate() + "日" : d.getFullYear() + "/" + (d.getMonth() + 1) + "/" + d.getDate();
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
		//#region src/client/api.ts
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
			action: (payload) => readJson(fetch(API_PREFIX + "/action", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(payload)
			}))
		};
		//#endregion
		//#region src/client/ThinkRow.tsx
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
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dsgc-think",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.DisclosureRow, {
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
					}) : null,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dsgc-thinkbody",
						children: text
					})
				})
			});
		}
		//#endregion
		//#region src/client/ToolRow.tsx
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
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dsgc-tool",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.DisclosureRow, {
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
					}),
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dsgc-toolbody",
						children: c.output || "（无输出）"
					})
				})
			});
		}
		//#endregion
		//#region src/client/Bubble.tsx
		function Bubble(props) {
			const { snap, m } = props;
			const isUser = m.speaker === "user";
			const isSys = m.speaker === "system";
			const role = !isUser && !isSys ? roleById(snap, m.speaker) : null;
			const name = isUser ? "我" : isSys ? "系统" : role ? role.name : "成员";
			if (isSys) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dsgc-sysmsg" + (m.error ? " err" : ""),
				children: m.text
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsgc-msg" + (isUser ? " mine" : ""),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dsgc-avatar" + (isUser ? " mine" : ""),
					style: isUser || !role ? void 0 : { border: "2px solid " + (role.color || "#888") },
					children: name.slice(0, 1)
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsgc-msgbody",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
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
								children: fmtTime(m.ts)
							}) : null
						]
					}), isUser ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
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
					})]
				})]
			});
		}
		//#endregion
		//#region src/client/RoleDrawer.tsx
		/**
		* 角色编辑抽屉（右侧滑出，不遮挡会话流阅读）。
		* @module dsh-group-chat/client/drawer
		*/
		function RoleDrawer(props) {
			const { draft, set } = props;
			const models = props.models;
			const providers = models && models.providers || [];
			const modelsOf = models && models.modelsByProvider && models.modelsByProvider[draft.provider] || [];
			const [closing, setClosing] = (0, react.useState)(false);
			const [effortsInfo, setEffortsInfo] = (0, react.useState)(null);
			const close = () => {
				if (closing) return;
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
								props.formError ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dsgc-formerr",
									children: props.formError
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
							onClick: props.onSave,
							children: draft.id ? "保存" : "添加"
						})]
					})
				]
			});
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
		/** 群组目录树节点的收合状态存取（hook 局部）。 */
		function useToggle() {
			return (0, react.useState)(() => /* @__PURE__ */ new Set());
		}
		function GroupChatPanel() {
			const [snap, setSnap] = (0, react.useState)(null);
			const [gid, setGid] = (0, react.useState)(null);
			const [sid, setSid] = (0, react.useState)(null);
			const [search, setSearch] = (0, react.useState)("");
			const [collapsedGroups, setCollapsedGroups] = useToggle();
			const [renameDraft, setRenameDraft] = (0, react.useState)(null);
			const [confirmDel, setConfirmDel] = (0, react.useState)(null);
			const [roleDraft, setRoleDraft] = (0, react.useState)(null);
			const [roleFormError, setRoleFormError] = (0, react.useState)("");
			const [models, setModels] = (0, react.useState)(null);
			const [modelsError, setModelsError] = (0, react.useState)(null);
			const [fileBrowser, setFileBrowser] = (0, react.useState)(null);
			const [wsDraft, setWsDraft] = (0, react.useState)(null);
			const [partsSel, setPartsSel] = (0, react.useState)(null);
			const [rounds, setRounds] = (0, react.useState)(1);
			const [input, setInput] = (0, react.useState)("");
			const [err, setErr] = (0, react.useState)("");
			const [topicDraft, setTopicDraft] = (0, react.useState)(null);
			const [mention, setMention] = (0, react.useState)(null);
			const [mentionIdx, setMentionIdx] = (0, react.useState)(0);
			const [asideOpen, setAsideOpen] = (0, react.useState)(true);
			const [atBottom, setAtBottom] = (0, react.useState)(true);
			const inputRef = (0, react.useRef)(null);
			const scrollRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				let live = true;
				api.state().then((s) => {
					if (live && s && s.ok) setSnap(s);
				}).catch(() => {});
				const events = new EventSource("/api/group-chat/events");
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
					} catch {}
				};
				return () => {
					live = false;
					events.close();
				};
			}, []);
			const onMsgsScroll = (0, react.useCallback)(() => {
				const el = scrollRef.current;
				if (!el) return;
				setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 60);
			}, []);
			(0, react.useEffect)(() => {
				const el = scrollRef.current;
				if (el && atBottom) el.scrollTop = el.scrollHeight;
			}, [snap]);
			(0, react.useEffect)(() => {
				const el = inputRef.current;
				if (!el) return;
				el.style.height = "auto";
				el.style.height = Math.min(180, Math.max(40, el.scrollHeight)) + "px";
			}, [input]);
			const action = async (payload) => {
				try {
					return await api.action(payload);
				} catch (e) {
					setErr(String(e && e.message || e));
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
			if (!snap) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dsgc-root",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsgc-loading",
					children: [Icon(_deepseek_ai_dsh_client_ui_primitives.IconLoadingOutline16, 16), "加载中…"]
				})
			});
			let group = gid ? groupById(snap, gid) : null;
			if (!group && snap.groups.length) group = snap.groups[0];
			if (!group) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dsgc-root",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dsgc-loading",
					children: "暂无群组"
				})
			});
			let sess = sid ? sessById(snap, sid) : null;
			if (!sess || sess.groupId !== group.id) sess = group.sessionIds.length ? sessById(snap, group.sessionIds[group.sessionIds.length - 1]) : null;
			const msgById = {};
			for (const m of snap.messages) msgById[m.id] = m;
			const enabledRoles = group.roleIds.map((id) => roleById(snap, id)).filter((r) => !!r && r.enabled);
			const participants = partsSel || enabledRoles.map((r) => r.id);
			const busyNow = !!(sess && snap.run.running && snap.run.sessionId === sess.id);
			const togglePart = (rid) => {
				const has = participants.includes(rid);
				setPartsSel(has ? participants.filter((x) => x !== rid) : participants.concat([rid]));
			};
			const mentionCandidates = mention ? enabledRoles.filter((r) => r.name.toLowerCase().includes((mention.query || "").toLowerCase())) : [];
			const onInputChange = (e) => {
				const v = e.target.value;
				const caret = e.selectionStart == null ? v.length : e.selectionStart;
				setInput(v);
				const before = v.slice(0, caret);
				const m = /(?:^|\s)@([^\s@]*)$/.exec(before);
				setMention(m ? {
					query: m[1],
					caret
				} : null);
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
			const sendMsg = async () => {
				if (busyNow) return;
				const parts = mentionedRoles.length ? mentionedRoles.map((r) => r.id) : participants;
				if (!parts.length) {
					setErr(mentionedRoles.length ? "" : "请至少选择一个参与角色（或在消息中 @成员）");
					if (!mentionedRoles.length) return;
				}
				const res = await action({
					kind: "send",
					sessionId: sess.id,
					text: input,
					participantRoleIds: parts,
					rounds
				});
				if (res && !res.ok && res.error) setErr(res.error);
				else if (res && res.ok) {
					setInput("");
					setMention(null);
					setErr("");
					setAtBottom(true);
				}
			};
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
				setRoleFormError("");
				if (!models || modelsError) await fetchModels();
				setRoleDraft(role ? draftFromRole(role) : blankDraft());
			};
			const saveRole = async () => {
				if (!roleDraft) return;
				if (!roleDraft.name.trim()) {
					setRoleFormError("角色名称不能为空");
					return;
				}
				if (!roleDraft.provider || !roleDraft.model) {
					setRoleFormError("请选择角色绑定的模型");
					return;
				}
				const res = await mutate({
					op: "upsertRole",
					groupId: group.id,
					role: roleDraft
				});
				if (res && res.ok && res.snapshot && !res.snapshot.error) {
					setRoleDraft(null);
					setRoleFormError("");
				}
			};
			const stopRun = async () => {
				await action({
					kind: "stop",
					sessionId: sess.id
				});
			};
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
			const doDelete = async () => {
				if (!confirmDel) return;
				const d = confirmDel;
				setConfirmDel(null);
				if (d.kind === "group") await mutate({
					op: "deleteGroup",
					groupId: d.id
				});
				else await mutate({
					op: "deleteSession",
					sessionId: d.id
				});
			};
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
			const commitTopic = () => {
				if (topicDraft !== null && sess && topicDraft !== sess.topic) mutate({
					op: "setTopic",
					sessionId: sess.id,
					topic: topicDraft
				});
				setTopicDraft(null);
			};
			const bubbles = [];
			if (sess) for (const mid of sess.messageIds) {
				const m = msgById[mid];
				if (m) bubbles.push(/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Bubble, {
					snap,
					m
				}, m.id));
			}
			if (busyNow && snap.run.currentRoleId) {
				const lr = roleById(snap, snap.run.currentRoleId);
				if (lr) bubbles.push(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsgc-msg live",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dsgc-avatar",
						style: {
							border: "2px solid " + (lr.color || "#888"),
							"--role-color": lr.color || "#888"
						},
						children: lr.name.slice(0, 1)
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
									className: "dsgc-msgtime",
									children: "正在输入…"
								})
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsgc-msgtext live",
							children: [snap.run.partialReasoning ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ThinkRow, {
								text: snap.run.partialReasoning,
								running: true
							}) : null, snap.run.partial ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.MarkdownText, {
								text: snap.run.partial,
								streaming: true,
								labels: MD_LABELS
							}) : null]
						})]
					})]
				}, "__live"));
			}
			const pc = busyNow && snap.run.pendingConfirm && sess && snap.run.sessionId === sess.id ? snap.run.pendingConfirm : null;
			if (pc) {
				const lr = roleById(snap, snap.run.currentRoleId);
				bubbles.push(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
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
				}, "__confirm"));
			}
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
						groupChildren.push(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsgc-sess-row" + (isActive ? " on" : ""),
							role: "button",
							tabIndex: 0,
							onClick: () => {
								setGid(g.id);
								setSid(s.id);
								setPartsSel(null);
								setConfirmDel(null);
								setRenameDraft(null);
							},
							onKeyDown: (e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									setGid(g.id);
									setSid(s.id);
									setPartsSel(null);
									setConfirmDel(null);
									setRenameDraft(null);
								}
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "dsgc-sess-dot" }),
								isRenameSess ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									className: "dsgc-rename",
									value: renameDraft.value,
									autoFocus: true,
									onChange: (e) => {
										setRenameDraft({
											kind: "session",
											id: s.id,
											value: e.target.value
										});
									},
									onBlur: () => {
										commitRename();
									},
									onKeyDown: renameKeyDown,
									onClick: (e) => {
										e.stopPropagation();
									}
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsgc-sess-name",
									children: s.name
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "dsgc-nodeops",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										className: "dsgc-opbtn",
										title: "重命名会话",
										"aria-label": "重命名会话",
										onClick: (e) => {
											e.stopPropagation();
											setRenameDraft({
												kind: "session",
												id: s.id,
												value: s.name
											});
										},
										children: Icon(_deepseek_ai_dsh_client_ui_primitives.IconEditOutline16, 14)
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										className: "dsgc-opbtn" + (isConfirm ? " danger" : ""),
										title: isConfirm ? "再次点击确认删除" : "删除会话",
										"aria-label": "删除会话",
										onClick: (e) => {
											e.stopPropagation();
											if (isConfirm) doDelete();
											else setConfirmDel({
												kind: "session",
												id: s.id
											});
										},
										children: Icon(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, 14)
									})]
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
						className: "dsgc-grow-row" + (g.id === group.id ? " on" : ""),
						role: "button",
						tabIndex: 0,
						onClick: () => {
							setGid(g.id);
							setPartsSel(null);
							setConfirmDel(null);
							setRenameDraft(null);
						},
						onKeyDown: (e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								setGid(g.id);
								setPartsSel(null);
								setConfirmDel(null);
								setRenameDraft(null);
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
							isRenameGroup ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								className: "dsgc-rename",
								value: renameDraft.value,
								autoFocus: true,
								onChange: (e) => {
									setRenameDraft({
										kind: "group",
										id: g.id,
										value: e.target.value
									});
								},
								onBlur: () => {
									commitRename();
								},
								onKeyDown: renameKeyDown,
								onClick: (e) => {
									e.stopPropagation();
								}
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsgc-gname",
								children: g.name
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: "dsgc-nodeops",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									className: "dsgc-opbtn",
									title: "重命名群组",
									"aria-label": "重命名群组",
									onClick: (e) => {
										e.stopPropagation();
										setRenameDraft({
											kind: "group",
											id: g.id,
											value: g.name
										});
									},
									children: Icon(_deepseek_ai_dsh_client_ui_primitives.IconEditOutline16, 14)
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									className: "dsgc-opbtn" + (isConfirmGroup ? " danger" : ""),
									title: isConfirmGroup ? "再次点击确认删除" : "删除群组",
									"aria-label": "删除群组",
									onClick: (e) => {
										e.stopPropagation();
										if (isConfirmGroup) doDelete();
										else setConfirmDel({
											kind: "group",
											id: g.id
										});
									},
									children: Icon(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, 14)
								})]
							})
						]
					}), expanded ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dsgc-sess-list",
						children: groupChildren
					}) : null]
				}, g.id));
			}
			const navPanel = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsgc-nav",
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
			const asidePanel = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
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
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: "dsgc-rolemodel",
												title: r.provider + " / " + r.model + (r.thinking ? " · 深度思考" + (r.reasoningEffort && r.reasoningEffort !== "default" ? "（" + r.reasoningEffort + "）" : "") : ""),
												children: [
													r.provider,
													" / ",
													r.model
												]
											}),
											r.thinking ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												title: "深度思考",
												style: {
													display: "inline-flex",
													alignItems: "center",
													color: "var(--dsw-alias-label-tertiary,inherit)"
												},
												children: Icon(_deepseek_ai_dsh_client_ui_primitives.IconThinkOutline14, 14)
											}) : null,
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
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
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													className: "dsgc-opbtn danger",
													title: "移除角色",
													"aria-label": "移除角色",
													onClick: (e) => {
														e.stopPropagation();
														mutate({
															op: "deleteRole",
															roleId: r.id
														});
													},
													children: Icon(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, 14)
												})]
											})
										]
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
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsgc-field",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dsgc-wsrow",
								style: { alignItems: "center" },
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: {
										flex: 1,
										minWidth: 0,
										fontSize: 12,
										color: "var(--dsw-alias-label-secondary,inherit)"
									},
									title: "开启后角色可请求在工作区目录内执行 shell 命令（如运行测试），每条命令需你在会话中逐条确认",
									children: "允许角色执行命令（逐条确认）"
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Switch, {
									checked: group.allowCommands === true,
									onChange: (v) => {
										mutate({
											op: "setAllowCommands",
											groupId: group.id,
											allowed: v === true
										});
									},
									label: "允许角色执行命令",
									"aria-label": "允许角色执行命令"
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dsgc-hint",
								children: group.allowCommands === true ? "角色可请求在工作区内执行 shell 命令（cwd 固定为工作区）；每条命令执行前需在会话中确认，超时 120 秒" : "开启后角色可在讨论中请求运行测试等命令；默认关闭"
							})]
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
			const chatPanel = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: "dsgc-chat",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsgc-chathead",
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
								title: "清空当前会话的消息记录",
								onClick: () => {
									if (sess) mutate({
										op: "clearMessages",
										sessionId: sess.id
									});
								},
								children: "清空"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "ghost",
								size: "sm",
								title: asideOpen ? "收起成员与工作区栏" : "展开成员与工作区栏",
								"aria-label": asideOpen ? "收起上下文栏" : "展开上下文栏",
								onClick: () => {
									setAsideOpen(!asideOpen);
								},
								style: { transform: "scaleX(-1)" },
								children: Icon(_deepseek_ai_dsh_client_ui_primitives.IconPanelLeftOutline16, 16)
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dsgc-msgs",
						ref: scrollRef,
						onScroll: onMsgsScroll,
						children: bubbles.length ? bubbles : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsgc-empty",
							children: [
								Icon(_deepseek_ai_dsh_client_ui_primitives.IconSparkle16, 20),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dsgc-emptytitle",
									children: sess && sess.topic ? "「" + sess.topic + "」" : "会话已就绪"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dsgc-hint",
									children: enabledRoles.length ? "发送消息开始讨论；@成员 点名让其优先回应；留空直接发送可让角色自由讨论——每轮全体参与角色按顺序各发言一次，可用右下角轮数控制（1–10 轮）" : "先在右侧添加角色（每个角色可绑定不同模型），再回到这里发起讨论。"
								})
							]
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsgc-composer",
						children: [
							!atBottom && bubbles.length ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dsgc-tobottom",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									variant: "outline",
									size: "sm",
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
								}), mentionedRoles.length ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
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
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dsgc-mentionwrap",
								children: [mention && mentionCandidates.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsgc-mention",
									role: "listbox",
									children: [mentionCandidates.map((r, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "dsgc-mentionitem" + (i === mentionIdx ? " on" : ""),
										role: "option",
										"aria-selected": i === mentionIdx ? "true" : "false",
										onClick: () => applyMention(r),
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
										children: "↑↓ 选择 · Enter/Tab 插入 · Esc 关闭"
									})]
								}) : null, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
									className: "dsgc-textarea",
									ref: inputRef,
									rows: 2,
									placeholder: "发消息给全群，@成员 点名让其回应（留空则让角色自由讨论）…",
									value: input,
									onChange: onInputChange,
									onKeyDown: onInputKeyDown,
									style: {
										resize: "none",
										minHeight: "40px",
										maxHeight: "180px",
										boxSizing: "border-box"
									}
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dsgc-sendrow",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { style: { flex: 1 } }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dsgc-rounds",
										title: "自由讨论的轮数（1–10）：一轮 = 全体参与角色按顺序各发言一次",
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
												title: "轮数",
												children: rounds
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
										disabled: !participants.length && !mentionedRoles.length || !sess,
										children: [Icon(_deepseek_ai_dsh_client_ui_primitives.IconSendOutline16, 16), "发送"]
									})
								]
							})
						]
					})
				]
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsgc-root",
				children: [
					navPanel,
					chatPanel,
					asidePanel,
					roleDraft ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RoleDrawer, {
						draft: roleDraft,
						set: setRoleDraft,
						models,
						modelsError,
						onRetryModels: () => {
							fetchModels();
						},
						onSave: () => {
							saveRole();
						},
						onCancel: () => {
							setRoleDraft(null);
							setRoleFormError("");
						},
						formError: roleFormError
					}) : null
				]
			});
		}
		//#endregion
		//#region src/client/GroupChatSettingsSection.tsx
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
						children: "多模型角色群组对话面板：每个角色绑定不同的 provider/model；群组内多会话目录树管理，群内共享对话记录与资料空间；消息以 markdown 渲染、支持思考折叠；输入框支持 @成员 点名。数据持久化于 ~/.dsh/storages/group-chat/，重启 dsh web 后恢复。"
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
		//#region src/client/Glyph.tsx
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