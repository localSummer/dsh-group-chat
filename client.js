/**
 * dsh-group-chat — 浏览器半（web 客户端模块）。
 *
 * 经 window.__ModuleLoader__.load 注册；factory 返回 Cordis 客户端插件：
 *  - 「模型群聊」设置页（settings.section）：启停开关，写 host 的 group-chat
 *    设置命名空间（settings.yaml 持久化）
 *  - 启用时挂载：侧边栏「群聊」入口（sidebar.panellist）+ 中央主面板（main）
 *  - 面板数据走 /api/group-chat/*（fetch + SSE），Host 半持有全部状态
 *
 * 侧边栏入口整行命中层携带 “newSession” 类名：任务看板等 DOM 注入式面板
 * 用 [class*="newSession"] 识别“侧边栏导航点击”并自动收起自己，与点击
 * “新建会话”行为一致。
 */
window.__ModuleLoader__.load({
  id: "dsh-group-chat",
  factory: (require) => {
    const React = require("react");
    const { useState, useEffect, useRef } = React;
    const h = React.createElement;

    const PALETTE = ["#5b8def", "#22a06b", "#e8912d", "#c678dd", "#e05661", "#56b6c2", "#98c379", "#d19a66"];
    const API_PREFIX = "/api/group-chat";

    // ---------- 样式 ----------
    const CSS = [
      ".dsgc-root{display:flex;height:100%;min-height:0;background:var(--dsw-alias-bg-base,transparent);color:var(--dsw-alias-label-primary,inherit);font-size:var(--dsh-content-font-size,14px)}",
      ".dsgc-loading{padding:24px;color:var(--dsw-alias-label-tertiary,inherit)}",
      ".dsgc-side{width:272px;flex:none;display:flex;flex-direction:column;gap:8px;border-right:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2));padding:10px;overflow-y:auto;min-height:0}",
      ".dsgc-mats{width:264px;flex:none;display:flex;flex-direction:column;gap:8px;border-left:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2));padding:10px;overflow-y:auto;min-height:0}",
      ".dsgc-chat{flex:1;display:flex;flex-direction:column;min-width:0;min-height:0}",
      ".dsgc-sidehead{display:flex;flex-direction:column;gap:8px}",
      ".dsgc-chathead{display:flex;gap:8px;align-items:center;padding:10px 12px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2))}",
      ".dsgc-topic{flex:1;background:transparent;border:none;color:inherit;font:inherit;outline:none;min-width:0}",
      ".dsgc-msgs{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:12px;min-height:0}",
      ".dsgc-composer{border-top:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2));padding:10px 12px;display:flex;flex-direction:column;gap:8px}",
      ".dsgc-msg{display:flex;gap:8px;align-items:flex-start}",
      ".dsgc-msg.mine{flex-direction:row-reverse}",
      ".dsgc-avatar{width:26px;height:26px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;flex:none}",
      ".dsgc-msgbody{max-width:72%;display:flex;flex-direction:column;gap:3px}",
      ".dsgc-msg.mine .dsgc-msgbody{align-items:flex-end}",
      ".dsgc-msghead{display:flex;gap:6px;align-items:baseline;font-size:12px;color:var(--dsw-alias-label-caption,var(--dsw-alias-label-tertiary,inherit))}",
      ".dsgc-msgname{font-weight:600}",
      ".dsgc-msgmodel{color:var(--dsw-alias-label-tertiary,inherit)}",
      ".dsgc-msgtext{white-space:pre-wrap;word-break:break-word;background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12));padding:8px 10px;border-radius:8px;line-height:1.55;text-align:left}",
      ".dsgc-msg.mine .dsgc-msgtext{background:var(--dsw-alias-state-business-primary,#4f6ef7);color:#fff}",
      ".dsgc-msgtext.live{opacity:.85;font-style:italic}",
      ".dsgc-sysmsg{align-self:center;font-size:12px;color:var(--dsw-alias-label-tertiary,inherit);background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.1));border-radius:10px;padding:3px 10px;text-align:center}",
      ".dsgc-sysmsg.err{color:var(--dsw-alias-state-error-primary,#e5484d)}",
      ".dsgc-err{font-size:12px;color:var(--dsw-alias-state-error-primary,#e5484d)}",
      ".dsgc-row{display:flex;gap:6px;align-items:center;flex-wrap:wrap}",
      ".dsgc-field{display:flex;flex-direction:column;gap:4px}",
      ".dsgc-field>label{font-size:12px;color:var(--dsw-alias-label-secondary,inherit)}",
      ".dsgc-input,.dsgc-select,.dsgc-textarea{background:transparent;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));color:inherit;font:inherit;border-radius:6px;padding:5px 8px;width:100%;box-sizing:border-box;outline:none}",
      ".dsgc-textarea{resize:vertical}",
      ".dsgc-btn{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12));color:inherit;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.25));border-radius:6px;padding:5px 10px;font:inherit;cursor:pointer}",
      ".dsgc-btn:hover{filter:brightness(1.15)}",
      ".dsgc-btn.primary{background:var(--dsw-alias-state-business-primary,#4f6ef7);border-color:transparent;color:#fff}",
      ".dsgc-btn.danger{background:var(--dsw-alias-state-error-primary,#e5484d);border-color:transparent;color:#fff}",
      ".dsgc-btn.sm{padding:3px 8px;font-size:12px}",
      ".dsgc-btn:disabled{opacity:.5;cursor:not-allowed}",
      ".dsgc-iconbtn{background:none;border:none;cursor:pointer;color:inherit;padding:0 2px;font-size:12px}",
      ".dsgc-iconbtn.off{opacity:.4}",
      ".dsgc-roles{display:flex;flex-direction:column;gap:8px}",
      ".dsgc-role{border:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2));border-radius:8px;padding:8px;display:flex;flex-direction:column;gap:6px}",
      ".dsgc-rolehead{display:flex;gap:6px;align-items:center}",
      ".dsgc-rolename{font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".dsgc-rolemodel{font-size:11px;color:var(--dsw-alias-label-tertiary,inherit);word-break:break-all}",
      ".dsgc-chipdot{width:8px;height:8px;border-radius:50%;flex:none;display:inline-block}",
      ".dsgc-editor{border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:8px}",
      ".dsgc-palette{display:flex;gap:6px;flex-wrap:wrap}",
      ".dsgc-dot{width:18px;height:18px;border-radius:50%;border:2px solid transparent;cursor:pointer;padding:0}",
      ".dsgc-dot.on{border-color:var(--dsw-alias-label-primary,#fff)}",
      ".dsgc-parts{display:flex;gap:6px;flex-wrap:wrap;align-items:center}",
      ".dsgc-partslabel{font-size:12px;color:var(--dsw-alias-label-secondary,inherit)}",
      ".dsgc-chip{display:inline-flex;gap:5px;align-items:center;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));background:transparent;color:inherit;border-radius:999px;padding:3px 9px;font-size:12px;cursor:pointer}",
      ".dsgc-chip.on{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.15))}",
      ".dsgc-sendrow{display:flex;gap:6px;align-items:center}",
      ".dsgc-rounds{display:flex;gap:4px;align-items:center;font-size:12px;color:var(--dsw-alias-label-secondary,inherit);flex:none}",
      ".dsgc-rounds input{width:52px}",
      ".dsgc-matshead{display:flex;justify-content:space-between;align-items:center}",
      ".dsgc-sideTitle{font-weight:600}",
      ".dsgc-mat{border:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2));border-radius:8px;padding:8px;display:flex;flex-direction:column;gap:5px}",
      ".dsgc-matkind{font-size:10px;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));border-radius:4px;padding:1px 4px;color:var(--dsw-alias-label-tertiary,inherit);flex:none}",
      ".dsgc-matpath{font-size:11px;color:var(--dsw-alias-label-tertiary,inherit);word-break:break-all}",
      ".dsgc-preview{font-size:11px;max-height:160px;overflow:auto;white-space:pre-wrap;word-break:break-word;border:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.2));border-radius:6px;padding:6px;margin:0}",
      ".dsgc-preview.err{color:var(--dsw-alias-state-error-primary,#e5484d)}",
      ".dsgc-hint{font-size:12px;color:var(--dsw-alias-label-tertiary,inherit);line-height:1.5}",
      "/* 侧边栏入口对齐：外壳将插槽内容包在 panelGlyph span 内，必须用后代 :has 而非直接子代选择器 */",
      '[class*="panelList"]:has(.dsgc-entryOverlay){margin-top:4px}',
      '[class*="panelRow"]:has(.dsgc-entryOverlay){position:relative;box-sizing:border-box;height:36px;min-height:36px;padding:0 10px;font-size:13px}',
      '[class*="panelRow"][class*="panelActive"]:has(.dsgc-entryOverlay){font-weight:600}',
      '[class*="panelRow"]:has(.dsgc-entryOverlay) > [class*="panelTitle"]{padding-left:24px}',
      ".dsgc-entryOverlay{position:absolute;inset:0;display:flex;align-items:center;padding:0 10px;box-sizing:border-box}",
      ".dsgc-entryIcon{flex:none;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center}",
      ".dsgc-entryIcon svg{width:18px;height:18px;display:block}",
      '[data-sidebar-collapsed] .dsgc-entryOverlay,[class*="collapsed"] .dsgc-entryOverlay{justify-content:center;padding:0}',
      '[data-sidebar-collapsed] [class*="panelRow"]:has(.dsgc-entryOverlay),[class*="collapsed"] [class*="panelRow"]:has(.dsgc-entryOverlay){margin:0 auto}',
      "/* 设置页 */",
      ".dgcs-page{display:flex;flex-direction:column;gap:14px;padding:4px 0}",
      ".dgcs-head{display:flex;flex-direction:column;gap:6px}",
      ".dgcs-title{margin:0;font-size:16px;font-weight:700;color:var(--dsw-alias-label-primary,inherit)}",
      ".dgcs-desc{margin:0;font-size:13px;line-height:1.6;color:var(--dsw-alias-label-secondary,inherit)}",
      ".dgcs-card{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.3));border-radius:12px;padding:14px 16px}",
      ".dgcs-cardtext{display:flex;flex-direction:column;gap:3px;min-width:0}",
      ".dgcs-cardtitle{font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary,inherit)}",
      ".dgcs-cardhint{font-size:12px;color:var(--dsw-alias-label-tertiary,inherit)}",
      ".dgcs-switch{flex:none;width:44px;height:24px;border-radius:999px;border:none;background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.25));cursor:pointer;position:relative;transition:background .15s;padding:0}",
      ".dgcs-switch.on{background:var(--dsw-alias-state-business-primary,#4f6ef7)}",
      ".dgcs-switch:disabled{opacity:.5;cursor:not-allowed}",
      ".dgcs-knob{position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .15s;box-shadow:0 1px 3px rgba(0,0,0,.25)}",
      ".dgcs-switch.on .dgcs-knob{left:22px}",
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
    async function readJson(response) {
      const body = await response.json();
      if (!response.ok) throw new Error(body && body.error ? body.error : "group-chat request failed: " + response.status);
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

    const roleById = (s, id) => {
      for (const r of s.roles) if (r.id === id) return r;
      return null;
    };

    // ---------- 聊天气泡 ----------
    function Bubble(props) {
      const snap = props.snap;
      const m = props.m;
      const isUser = m.speaker === "user";
      const isSys = m.speaker === "system";
      const role = !isUser && !isSys ? roleById(snap, m.speaker) : null;
      const name = isUser ? "用户" : isSys ? "系统" : role ? role.name : "成员";
      if (isSys) return h("div", { className: "dsgc-sysmsg" + (m.error ? " err" : "") }, m.text);
      return h("div", { className: "dsgc-msg" + (isUser ? " mine" : "") },
        h("div", { className: "dsgc-avatar", style: { background: isUser ? "var(--dsw-alias-state-business-primary,#4f6ef7)" : role ? role.color || "#888" : "#888" } }, name.slice(0, 1)),
        h("div", { className: "dsgc-msgbody" },
          h("div", { className: "dsgc-msghead" },
            h("span", { className: "dsgc-msgname" }, name),
            m.model ? h("span", { className: "dsgc-msgmodel" }, m.model) : null),
          h("div", { className: "dsgc-msgtext" }, m.text)));
    }

    // ---------- 角色编辑器（角色-模型绑定配置） ----------
    function RoleEditor(props) {
      const draft = props.draft;
      const set = props.set;
      const models = props.models;
      const providers = (models && models.providers) || [];
      const modelsOf = (models && models.modelsByProvider && models.modelsByProvider[draft.provider]) || [];
      const onProvider = (e) => {
        const p = e.target.value;
        const list = (models && models.modelsByProvider && models.modelsByProvider[p]) || [];
        set(Object.assign({}, draft, { provider: p, model: list.length ? list[0].id : "" }));
      };
      return h("div", { className: "dsgc-editor" },
        h("div", { className: "dsgc-field" },
          h("label", null, "名称"),
          h("input", { className: "dsgc-input", value: draft.name, onChange: (e) => set(Object.assign({}, draft, { name: e.target.value })), placeholder: "例如：产品经理" })),
        h("div", { className: "dsgc-field" },
          h("label", null, "标识色"),
          h("div", { className: "dsgc-palette" }, PALETTE.map((c) => h("button", {
            key: c, type: "button", className: "dsgc-dot" + (draft.color === c ? " on" : ""),
            style: { background: c }, onClick: () => set(Object.assign({}, draft, { color: c })),
          })))),
        h("div", { className: "dsgc-field" },
          h("label", null, "人设 / 角色设定"),
          h("textarea", { className: "dsgc-textarea", rows: 4, value: draft.persona, onChange: (e) => set(Object.assign({}, draft, { persona: e.target.value })), placeholder: "性格、立场、说话风格、专业背景……" })),
        h("div", { className: "dsgc-field" },
          h("label", null, "模型提供方"),
          providers.length
            ? h("select", { className: "dsgc-select", value: draft.provider, onChange: onProvider },
                h("option", { value: "" }, "选择 provider…"),
                providers.map((p) => h("option", { key: p.id, value: p.id }, p.name || p.id)))
            : h("div", { className: "dsgc-hint" }, "暂无可用 provider")),
        h("div", { className: "dsgc-field" },
          h("label", null, "模型"),
          modelsOf.length
            ? h("select", { className: "dsgc-select", value: draft.model, onChange: (e) => set(Object.assign({}, draft, { model: e.target.value })) },
                modelsOf.map((m) => h("option", { key: m.id, value: m.id }, m.name || m.id)))
            : h("div", { className: "dsgc-hint" }, "请先选择有可用模型的 provider")),
        h("div", { className: "dsgc-field" },
          h("label", null, "Temperature（可选）"),
          h("input", { className: "dsgc-input", type: "number", step: "0.1", min: "0", max: "2", value: draft.temperature == null ? "" : String(draft.temperature), onChange: (e) => set(Object.assign({}, draft, { temperature: e.target.value === "" ? undefined : Number(e.target.value) })) })),
        h("div", { className: "dsgc-row" },
          h("button", { className: "dsgc-btn primary", onClick: props.onSave }, "保存"),
          h("button", { className: "dsgc-btn", onClick: props.onCancel }, "取消")));
    }

    // ---------- 主面板 ----------
    function GroupChatPanel(props) {
      const uiWorkspace = props.uiWorkspace;
      const [snap, setSnap] = useState(null);
      const [gid, setGid] = useState(null);
      const [roleDraft, setRoleDraft] = useState(null);
      const [models, setModels] = useState(null);
      const [matDraft, setMatDraft] = useState(null);
      const [preview, setPreview] = useState(null);
      const [partsSel, setPartsSel] = useState(null);
      const [rounds, setRounds] = useState(1);
      const [input, setInput] = useState("");
      const [err, setErr] = useState("");
      const [delG, setDelG] = useState(false);
      const [topicDraft, setTopicDraft] = useState(null);
      const scrollRef = useRef(null);

      // 初始加载 + SSE 订阅（Host 状态变化时推送全量快照）
      useEffect(() => {
        let live = true;
        api.state().then((s) => {
          if (live && s && s.ok) setSnap(s);
        }).catch(() => { /* SSE 会重试 */ });
        const events = new EventSource(API_PREFIX + "/events");
        events.onmessage = (message) => {
          try {
            const s = JSON.parse(message.data);
            if (live && s && s.ok) setSnap(s);
          } catch (e) { /* ignore malformed frame */ }
        };
        return () => {
          live = false;
          events.close();
        };
      }, []);

      useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      }, [snap]);

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
          setSnap(res.snapshot);
          if (res.snapshot.error) setErr(res.snapshot.error);
        }
        return res;
      };

      if (!snap) return h("div", { className: "dsgc-root" }, h("div", { className: "dsgc-loading" }, "加载中…"));

      let group = null;
      for (const g of snap.groups) {
        if (g.id === gid) {
          group = g;
          break;
        }
      }
      if (!group && snap.groups.length) group = snap.groups[0];
      if (!group) return h("div", { className: "dsgc-root" }, h("div", { className: "dsgc-loading" }, "暂无群组"));

      const msgById = {};
      for (const m of snap.messages) msgById[m.id] = m;
      const matById = {};
      for (const m of snap.materials) matById[m.id] = m;

      const enabledRoles = group.roleIds.map((id) => roleById(snap, id)).filter((r) => r && r.enabled);
      const participants = partsSel || enabledRoles.map((r) => r.id);
      const busy = !!(snap.run.running && snap.run.groupId === group.id);

      const togglePart = (rid) => {
        const has = participants.includes(rid);
        setPartsSel(has ? participants.filter((x) => x !== rid) : participants.concat([rid]));
      };

      const openRoleEditor = async (role) => {
        setErr("");
        try {
          const m = await api.action({ kind: "models" });
          setModels(m && m.ok ? m : { providers: [], modelsByProvider: {} });
        } catch (e) {
          setModels({ providers: [], modelsByProvider: {} });
        }
        setRoleDraft(role
          ? { id: role.id, name: role.name, color: role.color, persona: role.persona, provider: role.provider, model: role.model, temperature: role.temperature, enabled: role.enabled }
          : { name: "", color: null, persona: "", provider: "", model: "", temperature: undefined, enabled: true });
      };
      const saveRole = async () => {
        if (!roleDraft.name.trim()) {
          setErr("角色名称不能为空");
          return;
        }
        if (!roleDraft.provider || !roleDraft.model) {
          setErr("请选择角色绑定的模型");
          return;
        }
        const res = await mutate({ op: "upsertRole", groupId: group.id, role: roleDraft });
        if (res && res.ok && res.snapshot && !res.snapshot.error) setRoleDraft(null);
      };

      const sendMsg = async () => {
        if (busy) return;
        if (!participants.length) {
          setErr("请至少选择一个参与角色");
          return;
        }
        const res = await action({ kind: "send", groupId: group.id, text: input, participantRoleIds: participants, rounds: rounds });
        if (res && !res.ok && res.error) setErr(res.error);
        else if (res && res.ok) {
          setInput("");
          setErr("");
        }
      };
      const stopRun = async () => {
        await action({ kind: "stop", groupId: group.id });
      };

      const saveMaterial = async () => {
        if (!matDraft.name.trim()) {
          setErr("资料名称不能为空");
          return;
        }
        if (matDraft.kind === "file" && !matDraft.path.trim()) {
          setErr("请填写文件路径");
          return;
        }
        if (matDraft.kind === "text" && !matDraft.content.trim()) {
          setErr("资料内容不能为空");
          return;
        }
        const res = await mutate({ op: "upsertMaterial", groupId: group.id, material: matDraft });
        if (res && res.ok && res.snapshot && !res.snapshot.error) setMatDraft(null);
      };
      const pickDir = async () => {
        if (!uiWorkspace) return;
        try {
          const dir = await uiWorkspace.pickDirectory();
          if (dir) setMatDraft(Object.assign({}, matDraft, { path: typeof dir === "string" ? dir : "" }));
        } catch (e) { /* user cancelled */ }
      };
      const doPreview = async (m) => {
        const res = await action({ kind: "preview", path: m.path });
        if (res) setPreview({ key: m.id, ok: !!res.ok, text: res.preview || "", error: res.error || "" });
      };

      const commitTopic = () => {
        if (topicDraft !== null && topicDraft !== group.topic) mutate({ op: "setTopic", groupId: group.id, topic: topicDraft });
        setTopicDraft(null);
      };

      const bubbles = [];
      for (const mid of group.messageIds) {
        const m = msgById[mid];
        if (m) bubbles.push(h(Bubble, { key: m.id, snap: snap, m: m }));
      }
      if (busy && snap.run.currentRoleId) {
        const lr = roleById(snap, snap.run.currentRoleId);
        if (lr) bubbles.push(h("div", { key: "__live", className: "dsgc-msg" },
          h("div", { className: "dsgc-avatar", style: { background: lr.color || "#888" } }, lr.name.slice(0, 1)),
          h("div", { className: "dsgc-msgbody" },
            h("div", { className: "dsgc-msghead" },
              h("span", { className: "dsgc-msgname" }, lr.name),
              h("span", { className: "dsgc-msgmodel" }, lr.provider + " / " + lr.model + " · 正在输入")),
            h("div", { className: "dsgc-msgtext live" }, (snap.run.partial || "") + "▍"))));
      }

      const sidePanel = h("div", { className: "dsgc-side" },
        h("div", { className: "dsgc-sidehead" },
          h("select", { className: "dsgc-select", value: group.id, onChange: (e) => { setGid(e.target.value); setPartsSel(null); setDelG(false); setRoleDraft(null); setMatDraft(null); } },
            snap.groups.map((g) => h("option", { key: g.id, value: g.id }, g.name))),
          h("div", { className: "dsgc-row" },
            h("button", { className: "dsgc-btn sm", onClick: () => mutate({ op: "createGroup" }) }, "新建群组"),
            delG
              ? h("button", { className: "dsgc-btn sm danger", onClick: async () => { const res = await mutate({ op: "deleteGroup", groupId: group.id }); if (res && res.ok && res.snapshot && !res.snapshot.error) { setDelG(false); setPartsSel(null); } } }, "确认删除")
              : h("button", { className: "dsgc-btn sm", onClick: () => setDelG(true) }, "删除"))),
        roleDraft
          ? h(RoleEditor, { draft: roleDraft, set: setRoleDraft, models: models, onSave: saveRole, onCancel: () => setRoleDraft(null) })
          : h("div", { className: "dsgc-roles" },
              group.roleIds.length
                ? group.roleIds.map((rid) => {
                    const r = roleById(snap, rid);
                    if (!r) return null;
                    return h("div", { key: r.id, className: "dsgc-role" },
                      h("div", { className: "dsgc-rolehead" },
                        h("span", { className: "dsgc-chipdot", style: { background: r.color || "#888" } }),
                        h("span", { className: "dsgc-rolename" }, r.name),
                        h("button", { className: "dsgc-iconbtn" + (r.enabled ? "" : " off"), title: r.enabled ? "点击停用该角色" : "点击启用该角色", onClick: () => mutate({ op: "setRoleEnabled", roleId: r.id, enabled: !r.enabled }) }, r.enabled ? "●" : "○")),
                      h("div", { className: "dsgc-rolemodel" }, r.provider + " / " + r.model),
                      h("div", { className: "dsgc-row" },
                        h("button", { className: "dsgc-btn sm", onClick: () => openRoleEditor(r) }, "编辑"),
                        h("button", { className: "dsgc-btn sm", onClick: () => mutate({ op: "deleteRole", roleId: r.id }) }, "移除")));
                  })
                : h("div", { className: "dsgc-hint" }, "还没有角色，点击下方按钮添加。每个角色可绑定不同的模型。"),
              h("button", { className: "dsgc-btn", onClick: () => openRoleEditor(null) }, "+ 添加角色")));

      const chatPanel = h("section", { className: "dsgc-chat" },
        h("div", { className: "dsgc-chathead" },
          h("input", { className: "dsgc-topic", value: topicDraft === null ? group.topic : topicDraft, placeholder: "群主题（可选）：例如「讨论新产品的定价策略」", onChange: (e) => setTopicDraft(e.target.value), onBlur: commitTopic, onKeyDown: (e) => { if (e.key === "Enter") e.target.blur(); } }),
          h("button", { className: "dsgc-btn sm", title: "清空当前群的消息记录", onClick: () => mutate({ op: "clearMessages", groupId: group.id }) }, "清空")),
        h("div", { className: "dsgc-msgs", ref: scrollRef }, bubbles.length ? bubbles : h("div", { className: "dsgc-hint" }, "暂无消息。发送消息或让角色自由讨论开始群聊。")),
        h("div", { className: "dsgc-composer" },
          err ? h("div", { className: "dsgc-err" }, err) : null,
          h("div", { className: "dsgc-parts" },
            h("span", { className: "dsgc-partslabel" }, "参与角色："),
            enabledRoles.length
              ? enabledRoles.map((r) => h("button", { key: r.id, type: "button", className: "dsgc-chip" + (participants.includes(r.id) ? " on" : ""), onClick: () => togglePart(r.id) },
                  h("span", { className: "dsgc-chipdot", style: { background: r.color || "#888" } }), r.name))
              : h("span", { className: "dsgc-hint" }, "还没有启用的角色，请在左侧添加")),
          h("div", { className: "dsgc-sendrow" },
            h("input", { className: "dsgc-input", placeholder: "发消息给全群（留空则让角色自由讨论）…", value: input, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => { if (e.key === "Enter") { e.preventDefault(); sendMsg(); } } }),
            h("label", { className: "dsgc-rounds" }, "轮数",
              h("input", { type: "number", min: 1, max: 10, value: String(rounds), onChange: (e) => setRounds(Math.max(1, Math.min(10, Number(e.target.value) || 1))) })),
            busy
              ? h("button", { className: "dsgc-btn danger", onClick: stopRun }, "停止")
              : h("button", { className: "dsgc-btn primary", onClick: sendMsg, disabled: !participants.length }, "发送"))));

      const matsPanel = h("div", { className: "dsgc-mats" },
        h("div", { className: "dsgc-matshead" },
          h("span", { className: "dsgc-sideTitle" }, "共享资料"),
          h("div", { className: "dsgc-row" },
            h("button", { className: "dsgc-btn sm", onClick: () => setMatDraft({ kind: "text", name: "", content: "", path: "" }) }, "+ 笔记"),
            h("button", { className: "dsgc-btn sm", onClick: () => setMatDraft({ kind: "file", name: "", content: "", path: "" }) }, "+ 文件"))),
        matDraft
          ? h("div", { className: "dsgc-editor" },
              h("div", { className: "dsgc-field" },
                h("label", null, "名称"),
                h("input", { className: "dsgc-input", value: matDraft.name, onChange: (e) => setMatDraft(Object.assign({}, matDraft, { name: e.target.value })), placeholder: matDraft.kind === "text" ? "例如：会议背景" : "例如：需求文档" })),
              matDraft.kind === "text"
                ? h("div", { className: "dsgc-field" },
                    h("label", null, "内容"),
                    h("textarea", { className: "dsgc-textarea", rows: 6, value: matDraft.content, onChange: (e) => setMatDraft(Object.assign({}, matDraft, { content: e.target.value })) }))
                : h("div", { className: "dsgc-field" },
                    h("label", null, "文件路径（工作区内或绝对路径）"),
                    h("div", { className: "dsgc-row" },
                      h("input", { className: "dsgc-input", value: matDraft.path, onChange: (e) => setMatDraft(Object.assign({}, matDraft, { path: e.target.value })), placeholder: "例如 docs/brief.md" }),
                      uiWorkspace ? h("button", { className: "dsgc-btn sm", onClick: pickDir }, "选目录") : null),
                    h("div", { className: "dsgc-hint" }, "发送时会读取最新文件内容注入全体角色上下文")),
              h("div", { className: "dsgc-row" },
                h("button", { className: "dsgc-btn primary", onClick: saveMaterial }, "保存"),
                h("button", { className: "dsgc-btn", onClick: () => setMatDraft(null) }, "取消")))
          : null,
        group.materialIds.length
          ? group.materialIds.map((mid) => {
              const m = matById[mid];
              if (!m) return null;
              return h("div", { key: m.id, className: "dsgc-mat" },
                h("div", { className: "dsgc-rolehead" },
                  h("span", { className: "dsgc-matkind" }, m.kind === "text" ? "笔记" : "文件"),
                  h("span", { className: "dsgc-rolename" }, m.name)),
                h("div", { className: "dsgc-matpath" }, m.kind === "file" ? m.path : (m.content || "").slice(0, 80) + ((m.content || "").length > 80 ? "…" : "")),
                h("div", { className: "dsgc-row" },
                  m.kind === "file" ? h("button", { className: "dsgc-btn sm", onClick: () => doPreview(m) }, "预览") : null,
                  h("button", { className: "dsgc-btn sm", onClick: () => mutate({ op: "deleteMaterial", materialId: m.id }) }, "移除")),
                preview && preview.key === m.id
                  ? h("pre", { className: "dsgc-preview" + (preview.ok ? "" : " err") }, preview.ok ? preview.text : "读取失败：" + preview.error)
                  : null);
            })
          : h("div", { className: "dsgc-hint" }, "添加文本笔记或文件路径，作为全群角色的共享资料空间。"));

      return h("div", { className: "dsgc-root" }, sidePanel, chatPanel, matsPanel);
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
          h("p", { className: "dgcs-desc" }, "多模型角色群组对话面板：每个角色绑定不同的 provider/model，群内共享对话记录与资料空间（文本笔记 + 文件路径）。数据保留在进程内存中，重启后清空。")),
        h("div", { className: "dgcs-card" },
          h("div", { className: "dgcs-cardtext" },
            h("div", { className: "dgcs-cardtitle" }, enabled ? "已启用" : "已停用"),
            h("div", { className: "dgcs-cardhint" }, writable ? (enabled ? "关闭后侧边栏将不再显示「群聊」入口。" : "开启后侧边栏显示「群聊」入口。") : "当前设置不可写（可能被配置文件覆盖）。")),
          h("button", {
            type: "button", className: "dgcs-switch" + (enabled ? " on" : ""), role: "switch",
            "aria-checked": enabled ? "true" : "false", disabled: !writable || pending, onClick: toggle,
          }, h("span", { className: "dgcs-knob" }))));
    }

    // ---------- 插件 ----------
    return {
      name: "group-chat-client",
      inject: ["slots", "settingsScope"],
      apply(ctx) {
        const scope = ctx.settingsScope.bind({ namespace: "group-chat" });
        const uiWorkspace = typeof ctx.get === "function" ? ctx.get("uiWorkspace") : undefined;

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
              ctx.slots.register({ name: "main", key: "group-chat" }, () => h(GroupChatPanel, { uiWorkspace }))));
            disposers.push(ctx.slots.inject("sidebar.panellist", () =>
              ctx.slots.register({ name: "sidebar.panellist", id: "group-chat", order: 50, label: "群聊" }, (props) => h(Glyph, props))));
          } catch (e) {
            console.error("[dsh-group-chat] mount failed:", e);
          }
          uiDisposer = () => {
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
