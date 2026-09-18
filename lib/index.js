import z from "schemastery";
import { chmodSync, closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, readSync, readdirSync, realpathSync, renameSync, rmSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, join, sep } from "node:path";
import { spawn } from "node:child_process";
//#region src/mount-once.ts
/**
* Host single-instance guard shared by the plugin family. The family bundle
* (dsh-web-all / dsh-skins) namespaces every child row id (web-ui-*), so
* the loader accepts a standalone install of the same package side by side;
* without this guard the second instance would still re-register the same
* webserver routes, tools, settings namespaces, and system-prompt sections
* and fail the boot. mountOnce makes the second host apply a no-op for the
* lifetime of the first instance (the browser half is already deduped by
* package name in the client module host).
*
* The registry rides a global symbol so two module instances of the same
* package (npm copy vs repository link) still share one verdict. cordis
* `ctx.effect` runs its callback immediately and treats the callback's
* return value as the fiber disposer, so the unmarker is returned, not run.
*/
const MOUNTED = Symbol.for("dsh-web.mounted-plugins");
function mountedSet() {
	const registry = globalThis;
	return registry[MOUNTED] ??= /* @__PURE__ */ new Set();
}
/**
* Wrap a cordis plugin apply so the package runs at most once per process.
* The first mount registers normally and unmarks when its fiber disposes;
* any later mount of the same package name is a no-op.
* @param packageName - npm package identity shared by every install source.
* @param fn - the original plugin apply.
* @returns an apply of the same shape.
*/
function mountOnce(packageName, fn) {
	return ((...args) => {
		const mounted = mountedSet();
		if (mounted.has(packageName)) return;
		mounted.add(packageName);
		args[0]?.effect?.(() => () => {
			mounted.delete(packageName);
		});
		return fn(...args);
	});
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
/**
* ledger 行档位归一（v2→v3 兼容）：显式 permissionTier 优先；
* 缺失时按旧布尔迁移——allowCommands=true → workspace_write（今日语义即
* 「可执行命令但逐条确认」），false/无字段 → view_only。
*/
function migrateTier(permissionTier, allowCommands) {
	const tier = asPermissionTier(permissionTier);
	if (tier !== void 0) return tier;
	return allowCommands === true ? "workspace_write" : "view_only";
}
/** 可选数值参数安全化：数字则原样，否则 undefined。 */
function asNumber(value) {
	return typeof value === "number" && !Number.isNaN(value) ? value : void 0;
}
/** 可选字符串参数安全化：非 default 的非空字符串则原样，否则 undefined。 */
function asEffort(value) {
	return typeof value === "string" && value && value !== "default" ? value : void 0;
}
//#endregion
//#region src/host/state.ts
/**
* 群聊宿主服务共享状态容器：四张表 + run（对话进行时状态）+ 可变槽位
* （store / revision / idSeq / lastCreated）。各功能模块（persistence /
* broadcast / materials / tools / conversation / actions）以工厂装配到同一
* 容器上，模块间只经显式依赖传递；容器本身只含数据与稳定引用，不含行为。
* @module dsh-group-chat/host/state
*/
/** 角色标识色板（新增角色依序取色）。 */
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
/** 创建共享状态容器（仅数据与稳定引用，不含行为）。 */
function createHostState(ctx) {
	const core = {
		ctx,
		llm: ctx.llm,
		fs: ctx.fs,
		groups: /* @__PURE__ */ new Map(),
		sessions: /* @__PURE__ */ new Map(),
		roles: /* @__PURE__ */ new Map(),
		messages: /* @__PURE__ */ new Map(),
		run: {
			running: false,
			sessionId: null,
			currentRoleId: null,
			partial: "",
			partialReasoning: "",
			stopping: false,
			queue: [],
			pendingConfirm: null,
			confirmSignal: null,
			childProc: null,
			finished: null
		},
		store: null,
		revision: 1,
		idSeq: 1,
		nid: (p) => p + "-" + core.idSeq++,
		lastCreated: null,
		newSession: (groupId, name) => {
			let n = 0;
			for (const s of core.sessions.values()) if (s.groupId === groupId) n++;
			const s = {
				id: randomUUID(),
				groupId,
				name: name || "会话 " + (n + 1),
				topic: "",
				messageIds: [],
				createdAt: Date.now()
			};
			core.sessions.set(s.id, s);
			return s;
		}
	};
	return core;
}
//#endregion
//#region src/host/api/actions.ts
/**
* 动作分发（handleAction，POST /api/group-chat/action 的载荷）：
* mutate（12 种 CRUD/配置操作）| send | stop | confirmCommand | models | efforts。
* @module dsh-group-chat/host/api/actions
*/
/** 创建动作分发面。 */
function createActions(core, deps) {
	const { llm, groups, sessions, roles, messages, run } = core;
	const { touch, snapshot, schedulePersist, dropDirty, appendMessage, runLoop, wakeConfirm, killChild, browse } = deps;
	const mutate = (args) => {
		const op = args && args.op;
		if (op === "createGroup") {
			const g = {
				id: core.nid("grp"),
				name: String(args.name || "").trim() || "群组 " + (groups.size + 1),
				workspaceDir: "",
				permissionTier: "view_only",
				roleIds: [],
				sessionIds: []
			};
			groups.set(g.id, g);
			const sess = core.newSession(g.id);
			g.sessionIds.push(sess.id);
			core.lastCreated = {
				kind: "group",
				groupId: g.id,
				sessionId: sess.id
			};
			schedulePersist({
				ledger: true,
				session: sess.id
			});
			touch();
		} else if (op === "renameGroup") {
			const g = groups.get(args.groupId);
			if (g && String(args.name || "").trim()) {
				g.name = String(args.name).trim();
				schedulePersist({ ledger: true });
				touch();
			}
		} else if (op === "deleteGroup") {
			const g = groups.get(args.groupId);
			if (!g) return {
				...snapshot(),
				error: "群组不存在"
			};
			if (groups.size <= 1) return {
				...snapshot(),
				error: "至少保留一个群组"
			};
			if (run.running) {
				const runSession = sessions.get(run.sessionId);
				if (runSession && runSession.groupId === g.id) return {
					...snapshot(),
					error: "对话进行中，无法删除群组"
				};
			}
			for (const sid of g.sessionIds) {
				const sess = sessions.get(sid);
				if (sess) for (const mid of sess.messageIds) messages.delete(mid);
				sessions.delete(sid);
				dropDirty({ session: sid });
			}
			for (const rid of g.roleIds) roles.delete(rid);
			groups.delete(g.id);
			dropDirty({
				roles: g.id,
				workspace: g.id
			});
			if (core.store !== null) try {
				rmSync(core.store.groupDir(g.id), {
					recursive: true,
					force: true
				});
			} catch (e) {
				console.error("[dsh-group-chat] 群组目录清理失败：", e);
			}
			schedulePersist({ ledger: true });
			touch();
		} else if (op === "createSession") {
			const g = groups.get(args.groupId);
			if (!g) return {
				...snapshot(),
				error: "群组不存在"
			};
			const sess = core.newSession(g.id, String(args.name || "").trim() || void 0);
			g.sessionIds.push(sess.id);
			core.lastCreated = {
				kind: "session",
				groupId: g.id,
				sessionId: sess.id
			};
			schedulePersist({
				ledger: true,
				session: sess.id
			});
			touch();
		} else if (op === "renameSession") {
			const sess = sessions.get(args.sessionId);
			if (sess && String(args.name || "").trim()) {
				sess.name = String(args.name).trim();
				sess.namePinned = true;
				schedulePersist({ session: sess.id });
				touch();
			}
		} else if (op === "deleteSession") {
			const sess = sessions.get(args.sessionId);
			if (!sess) return {
				...snapshot(),
				error: "会话不存在"
			};
			const g = groups.get(sess.groupId);
			if (g && g.sessionIds.length <= 1) return {
				...snapshot(),
				error: "每个群组至少保留一个会话"
			};
			if (run.running && run.sessionId === sess.id) return {
				...snapshot(),
				error: "对话进行中，无法删除会话"
			};
			if (run.finished && run.finished.sessionId === sess.id) run.finished = null;
			for (const mid of sess.messageIds) messages.delete(mid);
			sessions.delete(sess.id);
			dropDirty({ session: sess.id });
			if (g) g.sessionIds = g.sessionIds.filter((x) => x !== sess.id);
			if (core.store !== null) try {
				unlinkSync(core.store.sessionFile(sess.groupId, sess.id));
			} catch {}
			schedulePersist({ ledger: true });
			touch();
		} else if (op === "setTopic") {
			const sess = sessions.get(args.sessionId);
			if (sess) {
				sess.topic = String(args.topic || "");
				sess.topicPinned = true;
				schedulePersist({ session: sess.id });
				touch();
			}
		} else if (op === "upsertRole") {
			const g = groups.get(args.groupId);
			const r = args.role || {};
			if (!g) return {
				...snapshot(),
				error: "群组不存在"
			};
			if (!r.name || !String(r.name).trim()) return {
				...snapshot(),
				error: "角色名称不能为空"
			};
			if (!r.provider || !r.model) return {
				...snapshot(),
				error: "请选择角色绑定的模型"
			};
			if (r.id && roles.get(r.id)) {
				const ex = roles.get(r.id);
				ex.name = String(r.name).trim();
				ex.color = r.color || ex.color;
				ex.persona = r.persona || "";
				ex.provider = r.provider;
				ex.model = r.model;
				ex.temperature = asNumber(r.temperature);
				ex.reasoningEffort = asEffort(r.reasoningEffort);
				ex.enabled = r.enabled !== false;
				ex.thinking = r.thinking === true;
				schedulePersist({ roles: g.id });
				touch();
			} else {
				const nr = {
					id: core.nid("role"),
					groupId: g.id,
					name: String(r.name).trim(),
					color: r.color || PALETTE[g.roleIds.length % PALETTE.length],
					persona: r.persona || "",
					provider: r.provider,
					model: r.model,
					temperature: asNumber(r.temperature),
					reasoningEffort: asEffort(r.reasoningEffort),
					enabled: true,
					thinking: r.thinking === true
				};
				roles.set(nr.id, nr);
				g.roleIds.push(nr.id);
				schedulePersist({ roles: g.id });
				touch();
			}
		} else if (op === "deleteRole") {
			const r = roles.get(args.roleId);
			if (r) {
				const gid = r.groupId;
				const g = groups.get(gid);
				if (g) g.roleIds = g.roleIds.filter((x) => x !== r.id);
				roles.delete(r.id);
				schedulePersist({ roles: gid });
				touch();
			}
		} else if (op === "setRoleEnabled") {
			const r = roles.get(args.roleId);
			if (r) {
				r.enabled = !!args.enabled;
				schedulePersist({ roles: r.groupId });
				touch();
			}
		} else if (op === "setWorkspaceDir") {
			const g = groups.get(args.groupId);
			if (g) {
				g.workspaceDir = String(args.path || "").trim();
				schedulePersist({ workspace: g.id });
				touch();
			}
		} else if (op === "setPermissionTier") {
			const tier = asPermissionTier(args.tier);
			if (!tier) return {
				...snapshot(),
				error: "未知权限档位"
			};
			const g = groups.get(args.groupId);
			if (g) {
				g.permissionTier = tier;
				if (tier === "view_only" && run.pendingConfirm) {
					const runSession = run.sessionId ? sessions.get(run.sessionId) : null;
					if (runSession && runSession.groupId === g.id) wakeConfirm();
				}
				schedulePersist({ ledger: true });
				touch();
			}
		} else if (op === "ackFinish") {
			if (run.finished) {
				run.finished = null;
				touch();
			}
		} else if (op === "clearMessages") {
			const sess = sessions.get(args.sessionId);
			if (sess) {
				if (run.running && run.sessionId === sess.id) return {
					...snapshot(),
					error: "对话进行中，无法清空"
				};
				for (const mid of sess.messageIds) messages.delete(mid);
				sess.messageIds = [];
				schedulePersist({ session: sess.id });
				touch();
			}
		}
		return snapshot();
	};
	const send = (args) => {
		const sess = sessions.get(args.sessionId);
		if (!sess) return {
			ok: false,
			error: "会话不存在"
		};
		const g = groups.get(sess.groupId);
		if (!g) return {
			ok: false,
			error: "群组不存在"
		};
		if (run.running) return {
			ok: false,
			error: "已有对话进行中，请先停止"
		};
		let parts = Array.isArray(args.participantRoleIds) ? args.participantRoleIds.slice() : [];
		parts = parts.filter((id) => {
			const r = roles.get(id);
			return r && r.groupId === g.id && r.enabled;
		});
		if (!parts.length) parts = g.roleIds.filter((id) => {
			const r = roles.get(id);
			return r && r.enabled;
		});
		if (!parts.length) return {
			ok: false,
			error: "群内还没有启用的角色，请先添加角色"
		};
		const rounds = Math.max(1, Math.min(10, Math.floor(Number(args.rounds) || 1)));
		const text = String(args.text || "").trim().slice(0, 32e3);
		if (text) appendMessage(sess, "user", text);
		const queue = [];
		for (let i = 0; i < rounds; i++) for (const rid of parts) queue.push(rid);
		run.running = true;
		run.sessionId = sess.id;
		run.queue = queue;
		run.stopping = false;
		run.finished = null;
		touch();
		runLoop(sess).catch((e) => console.error("group-chat run failed", e));
		return { ok: true };
	};
	const stop = (args) => {
		if (run.running && (!args || !args.sessionId || run.sessionId === args.sessionId)) {
			run.stopping = true;
			if (run.pendingConfirm) wakeConfirm();
			killChild();
			touch();
		}
		return { ok: true };
	};
	/** run_command 确认（TOOLS.md §4）：同步三查全过才置空放行，杜绝并发/伪造/stale 确认。 */
	const confirmCommand = (args) => {
		if (!run.running || !run.pendingConfirm || run.pendingConfirm.toolCallId !== (args && args.toolCallId)) return {
			ok: false,
			error: "确认请求不存在或已处理"
		};
		const signal = run.confirmSignal;
		run.pendingConfirm = null;
		run.confirmSignal = null;
		touch();
		if (signal) try {
			signal.resolve(!!(args && args.allow));
		} catch {}
		return { ok: true };
	};
	let modelCache = null;
	const models = async () => {
		const now = Date.now();
		if (modelCache && now - modelCache.at < 6e4) return modelCache;
		const providers = await llm.listProviders();
		const modelsByProvider = {};
		for (const p of providers) try {
			modelsByProvider[p.id] = await llm.listModels(p.id);
		} catch {
			modelsByProvider[p.id] = [];
		}
		modelCache = {
			at: now,
			providers: providers.map((p) => ({
				id: p.id,
				name: p.name || p.id
			})),
			modelsByProvider
		};
		return modelCache;
	};
	const effortCache = /* @__PURE__ */ new Map();
	const efforts = async (args) => {
		const provider = String(args && args.provider || "");
		const model = String(args && args.model || "");
		if (!provider || !model) return {
			ok: false,
			efforts: [],
			defaultEffort: void 0,
			error: "缺少 provider 或 model"
		};
		const key = provider + "|" + model;
		const hit = effortCache.get(key);
		if (hit && Date.now() - hit.at < 6e4) return {
			ok: true,
			...hit.data
		};
		let data;
		try {
			const info = await llm.resolveModelInfo(provider, model);
			const reasoning = info && info.reasoning;
			data = {
				efforts: (reasoning && Array.isArray(reasoning.efforts) ? reasoning.efforts : []).map((e) => ({
					id: e.id,
					name: e.name || e.id,
					description: e.description
				})),
				defaultEffort: reasoning && typeof reasoning.defaultEffort === "string" ? reasoning.defaultEffort : void 0
			};
		} catch (e) {
			data = {
				efforts: [],
				defaultEffort: void 0,
				error: String(e && e.message || e)
			};
		}
		effortCache.set(key, {
			at: Date.now(),
			data
		});
		return {
			ok: true,
			...data
		};
	};
	const handleAction = async (body) => {
		const kind = body && body.kind;
		if (kind === "mutate") return {
			ok: true,
			snapshot: mutate(body),
			lastCreated: core.lastCreated
		};
		if (kind === "send") return send(body);
		if (kind === "stop") return stop(body);
		if (kind === "confirmCommand") return confirmCommand(body);
		if (kind === "models") return {
			ok: true,
			...await models()
		};
		if (kind === "efforts") return efforts(body);
		if (kind === "browse") return browse(body);
		return {
			ok: false,
			error: "unknown-action"
		};
	};
	return { handleAction };
}
//#endregion
//#region src/host/api/http.ts
/** 请求体上限 1MB。 */
const BODY_LIMIT = 1048576;
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };
/** IPv4 127/8 谓词（四段十进制，首段 == 127）。 */
function isIPv4Loopback(v4) {
	const parts = v4.split(".");
	return parts.length === 4 && parts[0] === "127" && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}
/** socket 远端地址是否落在回环段（127/8、::1、IPv4-mapped）。 */
function isLoopbackAddress(address) {
	if (address === void 0) return false;
	const normalized = address.toLowerCase();
	if (normalized === "::1") return true;
	if (normalized.startsWith("::ffff:")) return isIPv4Loopback(normalized.slice(7));
	return isIPv4Loopback(normalized);
}
/** 归一化 URL 主机名是否为回环权威（localhost、[::1]、127/8）。 */
function isLoopbackHostname(hostname) {
	if (hostname === "localhost" || hostname === "[::1]") return true;
	return isIPv4Loopback(hostname);
}
/**
* 请求级信任栏：浏览器同源标记（sec-fetch-site / Origin）必须存在且回环
* socket + 回环 Host 全过；X-Forwarded-For 一律不信任。无任何同源标记的
* 非浏览器请求（如裸 curl）一律拒绝。
*/
function isTrustedRequest(req) {
	if (!(req.headers["sec-fetch-site"] === "same-origin" || typeof req.headers.origin === "string")) return false;
	if (!isLoopbackAddress(req.socket.remoteAddress)) return false;
	const host = req.headers.host;
	if (typeof host !== "string") return false;
	let hostUrl;
	try {
		hostUrl = new URL("http://" + host);
	} catch {
		return false;
	}
	if (!isLoopbackHostname(hostUrl.hostname)) return false;
	if (req.headers["sec-fetch-site"] === "cross-site") return false;
	const origin = req.headers.origin;
	if (origin === void 0) return true;
	try {
		return new URL(origin).host === hostUrl.host;
	} catch {
		return false;
	}
}
/** 读有界 JSON 请求体；超限抛 'body-too-large'（路由映射 413）。 */
async function readBody(req) {
	const chunks = [];
	let size = 0;
	for await (const chunk of req) {
		const buffer = chunk;
		size += buffer.length;
		if (size > BODY_LIMIT) throw new Error("body-too-large");
		chunks.push(buffer);
	}
	return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
/** 写 JSON 响应；调用方可追加/覆盖默认头。 */
function writeJson(res, status, body, headers = {}) {
	const payload = JSON.stringify(body);
	res.writeHead(status, {
		...JSON_HEADERS,
		...headers
	});
	res.end(payload);
}
//#endregion
//#region src/host/api/routes.ts
const API_PREFIX = "/api/group-chat";
/** SSE 心跳周期。 */
const HEARTBEAT_MS = 15e3;
/** 逐路由的信任栏 + 403。 */
function guard(req, res) {
	if (isTrustedRequest(req)) return true;
	writeJson(res, 403, {
		ok: false,
		error: "forbidden"
	}, { "cache-control": "no-store" });
	return false;
}
/** 构建群聊的三条 HTTP 路由。 */
function makeGroupChatRoutes(service) {
	return [
		{
			kind: "exact",
			path: API_PREFIX + "/state",
			handler: (req, res) => {
				if (req.method !== "GET") return writeJson(res, 405, {
					ok: false,
					error: "method-not-allowed"
				});
				if (!guard(req, res)) return;
				writeJson(res, 200, {
					ok: true,
					...service.snapshot()
				}, { "cache-control": "no-store" });
			}
		},
		{
			kind: "exact",
			path: API_PREFIX + "/action",
			handler: async (req, res) => {
				if (req.method !== "POST") return writeJson(res, 405, {
					ok: false,
					error: "method-not-allowed"
				});
				if (!guard(req, res)) return;
				if (!String(req.headers["content-type"] || "").toLowerCase().startsWith("application/json")) return writeJson(res, 415, {
					ok: false,
					error: "json-required"
				});
				try {
					const body = await readBody(req);
					writeJson(res, 200, await service.handleAction(body), { "cache-control": "no-store" });
				} catch (e) {
					const message = e instanceof Error ? e.message : String(e);
					writeJson(res, message === "body-too-large" ? 413 : 400, {
						ok: false,
						error: message
					});
				}
			}
		},
		{
			kind: "exact",
			path: API_PREFIX + "/events",
			handler: (req, res) => {
				if (req.method !== "GET") {
					res.writeHead(405);
					res.end();
					return;
				}
				if (!guard(req, res)) return;
				res.writeHead(200, {
					"content-type": "text/event-stream; charset=utf-8",
					"cache-control": "no-cache",
					connection: "keep-alive"
				});
				const push = () => {
					try {
						res.write("data: " + JSON.stringify({
							ok: true,
							...service.snapshot()
						}) + "\n\n");
					} catch {}
				};
				const unsubscribe = service.subscribePush(push);
				const heartbeat = setInterval(() => {
					try {
						res.write(": ping\n\n");
					} catch {}
				}, HEARTBEAT_MS);
				const close = () => {
					clearInterval(heartbeat);
					unsubscribe();
				};
				req.once("close", close);
				res.once("close", close);
				push();
			}
		}
	];
}
//#endregion
//#region src/host/broadcast.ts
/** SSE 推送节流。 */
const PUSH_THROTTLE_MS = 120;
/** 创建广播面。 */
function createBroadcast(core) {
	const subscribers = /* @__PURE__ */ new Set();
	let pushTimer = null;
	const broadcast = () => {
		if (pushTimer !== null) return;
		pushTimer = setTimeout(() => {
			pushTimer = null;
			for (const push of subscribers) push();
		}, PUSH_THROTTLE_MS);
	};
	const touch = () => {
		core.revision++;
		broadcast();
	};
	const snapshot = () => ({
		revision: core.revision,
		run: {
			running: core.run.running,
			sessionId: core.run.sessionId,
			currentRoleId: core.run.currentRoleId,
			partial: core.run.partial,
			partialReasoning: core.run.partialReasoning,
			pendingConfirm: core.run.pendingConfirm,
			finished: core.run.finished
		},
		lastCreated: core.lastCreated,
		groups: [...core.groups.values()].map((g) => ({
			id: g.id,
			name: g.name,
			workspaceDir: g.workspaceDir,
			permissionTier: g.permissionTier,
			roleIds: g.roleIds.slice(),
			sessionIds: g.sessionIds.slice()
		})),
		sessions: [...core.sessions.values()].map((s) => ({
			id: s.id,
			groupId: s.groupId,
			name: s.name,
			topic: s.topic,
			messageIds: s.messageIds.slice(),
			createdAt: s.createdAt
		})),
		roles: [...core.roles.values()].map((r) => ({
			id: r.id,
			groupId: r.groupId,
			name: r.name,
			color: r.color,
			persona: r.persona,
			provider: r.provider,
			model: r.model,
			temperature: r.temperature,
			reasoningEffort: r.reasoningEffort,
			enabled: r.enabled,
			thinking: r.thinking === true
		})),
		messages: [...core.messages.values()].map((m) => ({
			id: m.id,
			sessionId: m.sessionId,
			seq: m.seq,
			speaker: m.speaker,
			text: m.text,
			reasoning: m.reasoning,
			model: m.model,
			error: m.error,
			toolCalls: m.toolCalls,
			ts: m.ts
		}))
	});
	return {
		touch,
		snapshot,
		subscribePush(push) {
			subscribers.add(push);
			return () => {
				subscribers.delete(push);
			};
		},
		dispose() {
			if (pushTimer !== null) clearTimeout(pushTimer);
		}
	};
}
//#endregion
//#region src/core/tools.ts
/**
* 工具执行护栏常量与 schema（TOOLS.md §1/§5；core 层纯数据）。
* @module dsh-group-chat/core/tools
*/
/** run_command 超时。 */
const RUN_CMD_TIMEOUT_MS = 12e4;
/** read_file 单文件上限（超出截断）。 */
const READ_FILE_MAX_BYTES = 102400;
/** 单条工具输出回注截断。 */
const CMD_OUTPUT_MAX_CHARS = 8e3;
/** 命令输出采集内存上限（1MB，超出弃置仅计数）。 */
const CMD_CAPTURE_MAX_BYTES = 1 << 20;
/** 工具 schema（TOOLS.md §1）。 */
const TOOL_SCHEMAS = [
	{
		name: "read_file",
		description: "读取群组工作区目录内的一个文本文件内容（≤100KB，超出截断）",
		parameters: {
			type: "object",
			properties: { path: {
				type: "string",
				description: "相对工作区根的路径"
			} },
			required: ["path"]
		}
	},
	{
		name: "list_dir",
		description: "列出群组工作区目录内一个子目录的条目（名称/类型/大小）",
		parameters: {
			type: "object",
			properties: { path: {
				type: "string",
				description: "相对工作区根的路径，默认 \".\""
			} }
		}
	},
	{
		name: "run_command",
		description: "在群组工作区目录内执行 shell 命令（如运行测试、git 操作；超时 120 秒；是否需要确认取决于群组权限档位）",
		parameters: {
			type: "object",
			properties: { command: { type: "string" } },
			required: ["command"]
		}
	}
];
//#endregion
//#region src/host/engine/retitle.ts
/** DSH 默认模型（agentDefaultModel 服务缺位或未配置时返回 null，调用方静默跳过）。 */
const defaultModel = (core) => {
	try {
		const svc = core.ctx.reflect.get("agentDefaultModel");
		const sel = svc ? svc.currentSelection() : null;
		return sel && typeof sel.provider === "string" && typeof sel.model === "string" && sel.provider && sel.model ? {
			provider: sel.provider,
			model: sel.model
		} : null;
	} catch {
		return null;
	}
};
/** 命名输入：最近 40 条非系统消息的紧凑转写（每条 500 字符封顶，命名不需要全文）。 */
const titleTranscript = (core, sess) => {
	const out = [];
	for (const mid of sess.messageIds.slice(-40)) {
		const m = core.messages.get(mid);
		if (!m || m.speaker === "system" || !m.text) continue;
		const name = m.speaker === "user" ? "用户" : (core.roles.get(m.speaker) || { name: void 0 }).name || "成员";
		out.push("【" + name + "】" + m.text.replace(/\s+/g, " ").slice(0, 500));
	}
	return out.join("\n");
};
/** 宽容解析模型输出：剥代码围栏 → 取首个 { 至末个 } 的 JSON → 校验并封顶字段。 */
const parseRetitle = (raw) => {
	const body = raw.replace(/```(?:json)?/g, "");
	const l = body.indexOf("{");
	const r = body.lastIndexOf("}");
	if (l < 0 || r <= l) return {};
	try {
		const o = JSON.parse(body.slice(l, r + 1));
		const name = typeof o.name === "string" ? o.name.trim() : "";
		const topic = typeof o.topic === "string" ? o.topic.trim() : "";
		return {
			name: name ? name.slice(0, 24) : void 0,
			topic: topic ? topic.slice(0, 120) : void 0
		};
	} catch {
		return {};
	}
};
/**
* 每轮结束后根据聊天内容整理会话名称与主题：后台 fire-and-forget、不产生
* 消息、静默失败。名称 =「类别 emoji + 对象｜目标」（类别固定、对象稳定、
* 目标实质变化才改）；主题 = 演进式一句话摘要（对象+目标+当前焦点），注入
* 后续轮次的角色上下文。手动编辑过的字段永久跳过（隐式固定，apply 时复查）。
*/
function createRetitle(core, deps) {
	const { llm } = core;
	const { touch, schedulePersist } = deps;
	/** 进行中的命名会话集合（同会话并发去重）。 */
	const retitling = /* @__PURE__ */ new Set();
	return async (sess) => {
		if (retitling.has(sess.id)) return;
		const dm = defaultModel(core);
		if (!dm || sess.namePinned && sess.topicPinned) return;
		const transcript = titleTranscript(core, sess);
		if (!transcript) return;
		retitling.add(sess.id);
		try {
			const sys = [
				"你是群聊会话的命名助手。根据群聊记录为这个会话生成名称与主题。",
				"",
				"# 名称规则",
				"- 格式：「类别 emoji + 对象｜目标」，例如「🔎 缓存选型｜Redis 与本地 KV 对比」",
				"- 类别固定六选一：🔎 调研对比（多方案/多观点比较）、💡 头脑风暴（创意发散）、⚖️ 方案评审（评审已有方案或产物）、🛠️ 排查修复（定位与解决问题）、📝 方法整理（总结沉淀方法与知识）、🗣️ 通用讨论（其余兜底）",
				"- 对象在前且稳定：把辨识度最高的讨论对象放最前；省略群组名（外层已展示）；除非讨论对象实质变化，沿用当前名称里的对象名；「继续」「追问」等不改变主线",
				"- 目标 = 当前正在做的事，动宾短语，保持简洁",
				"- 名称总长不超过 16 个字",
				"",
				"# 主题规则",
				"- 一句话演进式摘要：讨论对象 + 当前目标 + 当前焦点/分歧点",
				"- 不超过 60 个字；供后续讨论作为上下文锚，跟随最新进展更新",
				"",
				"# 其他",
				"- 语言跟随用户消息的主要语言；保留产品名与技术名词",
				"- 只输出一行 JSON：{\"name\": \"…\", \"topic\": \"…\"}，不要输出其他内容",
				"",
				"当前名称：" + (sess.namePinned ? "（已手动固定，本次不要输出 name 字段）" : sess.name),
				"当前主题：" + (sess.topicPinned ? "（已手动固定，本次不要输出 topic 字段）" : sess.topic || "（空）")
			].join("\n");
			let acc = "";
			for await (const chunk of llm.stream({
				provider: dm.provider,
				model: dm.model,
				system: sys,
				purpose: "session-title",
				messages: [{
					id: "g" + core.revision + "-t0",
					role: "user",
					content: [{
						type: "text",
						text: "群聊记录（从旧到新）：\n\n" + transcript
					}],
					source: { kind: "user" }
				}]
			})) if (chunk.type === "text-delta") {
				acc += chunk.text;
				if (acc.length > 2e3) break;
			} else if (chunk.type === "finish") break;
			const parsed = parseRetitle(acc);
			let changed = false;
			if (parsed.name && !sess.namePinned) {
				sess.name = parsed.name;
				changed = true;
			}
			if (parsed.topic && !sess.topicPinned) {
				sess.topic = parsed.topic;
				changed = true;
			}
			if (changed) {
				schedulePersist({ session: sess.id });
				touch();
			}
		} catch (e) {
			console.error("[dsh-group-chat] 会话标题整理失败（跳过，不影响对话）：", e);
		} finally {
			retitling.delete(sess.id);
		}
	};
}
//#endregion
//#region src/host/engine/conversation.ts
/**
* 对话引擎：消息追加、群聊记录转写、角色发言（speak：prompt 构建 + 流式
* 轮次 + 工具回注循环）、多轮 runLoop（每轮结束触发 retitle 标题整理）。
* @module dsh-group-chat/host/engine/conversation
*/
/** 创建对话引擎。 */
function createConversation(core, deps) {
	const { llm, groups, roles, messages, run } = core;
	const { touch, schedulePersist, materials, tools } = deps;
	const retitle = createRetitle(core, {
		touch,
		schedulePersist
	});
	const appendMessage = (sess, speaker, text, extra) => {
		const msg = {
			id: core.nid("msg"),
			sessionId: sess.id,
			seq: sess.messageIds.length + 1,
			speaker,
			text,
			reasoning: void 0,
			model: void 0,
			error: void 0,
			ts: Date.now()
		};
		if (extra) {
			if (extra.reasoning !== void 0) msg.reasoning = extra.reasoning;
			if (extra.reasoningFull !== void 0) msg.reasoningFull = extra.reasoningFull;
			if (extra.thinkingSummary !== void 0) msg.thinkingSummary = extra.thinkingSummary;
			if (extra.model !== void 0) msg.model = extra.model;
			if (extra.error !== void 0) msg.error = extra.error;
			if (Array.isArray(extra.toolCalls) && extra.toolCalls.length > 0) msg.toolCalls = extra.toolCalls;
		}
		messages.set(msg.id, msg);
		sess.messageIds.push(msg.id);
		touch();
		schedulePersist({ session: sess.id });
		return msg;
	};
	/** 群聊记录 → 角色上下文块（最近 40 条、逐条 8k 截断、工具行压缩）。 */
	const transcriptBlock = (sess) => {
		const out = [];
		for (const mid of sess.messageIds) {
			const m = messages.get(mid);
			if (!m) continue;
			const name = m.speaker === "user" ? "用户" : m.speaker === "system" ? "系统" : (roles.get(m.speaker) || { name: void 0 }).name || "成员";
			let text = m.text || "";
			if (text.length > 8e3) text = text.slice(0, 8e3) + "…(已截断)";
			let line = "【" + name + "】" + text;
			if (Array.isArray(m.toolCalls)) for (const c of m.toolCalls) {
				if (!c || typeof c.tool !== "string") continue;
				let brief = "";
				try {
					brief = JSON.stringify(c.args) || "";
				} catch {
					brief = "";
				}
				if (brief.length > 60) brief = brief.slice(0, 60) + "…";
				const st = c.status === "ok" ? "成功" : c.status === "denied" ? "用户拒绝" : "失败";
				let ob = String(c.output || "");
				if (ob.length > 200) ob = ob.slice(0, 200) + "…";
				line += "\n  [工具] " + c.tool + " " + brief + " → " + st + (ob ? "（" + ob.replace(/\s+/g, " ") + "）" : "");
			}
			out.push(line);
		}
		return out.slice(-40).join("\n\n");
	};
	const speak = async (g, sess, role) => {
		const ws = await materials.loadWorkspaceFiles(g);
		const parts = ws.parts;
		const sys = [
			"你正在参与一个多角色群聊。你在群中的身份如下，请始终以该身份发言。",
			"",
			"# 你的角色",
			"- 名称：" + role.name,
			"- 人设：" + (role.persona ? role.persona : "（未填写，请以积极协作者的身份参与讨论）"),
			sess.topic ? "\n# 本会话主题\n" + sess.topic : "",
			materials.materialBlock(parts, ws.dir),
			ws.dir ? "\n# 可用工具\n你可以调用工具在群组工作区目录（" + ws.dir + "）内查看文件与目录" + (g.permissionTier === "workspace_write" ? "、执行 shell 命令（命令需用户逐条确认，请优先用于运行测试）" : g.permissionTier === "full_access" ? "、执行 shell 命令（命令将直接执行、无需确认，请谨慎并优先用于运行测试）" : "") + "。需要事实依据时优先用工具查看，不要凭空猜测。" : "",
			"\n# 发言要求",
			"- 直接输出「" + role.name + "」本轮的发言内容本身：不要输出名字前缀、引号、动作旁白或代码围栏",
			"- 回应群内最新讨论（消息中「@你的名字」表示用户点名要求你回应，被点名时请优先回应）；与其他成员自然对话；有不同观点可以提出并说明理由",
			"- 保持简洁，通常不超过 300 字"
		].filter((s) => s !== "").join("\n");
		const history = transcriptBlock(sess);
		const intro = history ? "以下是本会话的群聊记录（从旧到新）：\n\n" + history : "本会话刚刚开始，请围绕主题做简短开场发言。";
		let wsRoot = null;
		if (ws.dir) try {
			wsRoot = realpathSync(ws.dir);
		} catch {
			wsRoot = null;
		}
		const toolSchemas = wsRoot !== null ? tools.buildToolSchemas(g) : [];
		const baseOpts = {
			provider: role.provider,
			model: role.model,
			system: sys
		};
		if (typeof role.temperature === "number" && !Number.isNaN(role.temperature)) baseOpts.temperature = role.temperature;
		if (role.thinking === true) {
			const effort = asEffort(role.reasoningEffort);
			if (effort !== void 0) baseOpts.reasoningEffort = effort;
		}
		const msgs = [{
			id: "g" + core.revision + "-m0",
			role: "user",
			content: [{
				type: "text",
				text: intro
			}],
			source: { kind: "user" }
		}];
		const toolCalls = [];
		const texts = [];
		const reasonings = [];
		let budgetUsed = 0;
		let streak = 0;
		let lastSig = null;
		let toolsOff = false;
		const streamRound = async () => {
			let acc = "";
			let rAcc = "";
			let errorFinish = null;
			let maxTokens = false;
			const byIndex = /* @__PURE__ */ new Map();
			const roundTools = toolSchemas.length === 0 || toolsOff ? void 0 : toolSchemas;
			for await (const chunk of llm.stream({
				...baseOpts,
				tools: roundTools,
				messages: msgs
			})) {
				if (run.stopping) break;
				if (chunk.type === "text-delta") {
					acc += chunk.text;
					run.partial = acc;
					touch();
				} else if (chunk.type === "reasoning-delta") {
					rAcc += chunk.text;
					run.partialReasoning = rAcc;
					touch();
				} else if (chunk.type === "tool-call-delta") {
					const cur = byIndex.get(chunk.index);
					if (cur && cur.closed) continue;
					const entry = cur || {
						id: "call-" + chunk.index,
						name: "",
						args: "",
						closed: false
					};
					if (chunk.id !== void 0) entry.id = chunk.id;
					if (chunk.name !== void 0) entry.name = chunk.name;
					entry.args += chunk.argumentsDelta;
					byIndex.set(chunk.index, entry);
				} else if (chunk.type === "block-end" && chunk.block && chunk.block.type === "tool-call") {
					const entry = byIndex.get(chunk.index) || {
						id: "call-" + chunk.index,
						name: "",
						args: "",
						closed: false
					};
					entry.id = chunk.block.id;
					entry.name = chunk.block.name;
					entry.args = chunk.block.arguments;
					entry.closed = true;
					byIndex.set(chunk.index, entry);
				} else if (chunk.type === "finish") {
					const reason = chunk.reason || {};
					if (reason.kind === "error" || reason.kind === "aborted") errorFinish = reason;
					else if (reason.kind === "max-tokens") maxTokens = true;
				}
			}
			const tcs = [...byIndex.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => ({
				id: v.id,
				name: v.name,
				args: v.args
			}));
			return {
				acc,
				rAcc,
				errorFinish,
				maxTokens,
				tcs
			};
		};
		const wrapUp = (note) => {
			const lines = toolCalls.map((c) => {
				let brief = "";
				try {
					brief = JSON.stringify(c.args) || "";
				} catch {
					brief = "";
				}
				if (brief.length > 80) brief = brief.slice(0, 80) + "…";
				const ob = String(c.output || "");
				return "[工具] " + c.tool + " " + brief + " → " + c.status + (ob ? "：" + (ob.length > 200 ? ob.slice(0, 200) + "…" : ob) : "");
			});
			msgs.length = 1;
			msgs.push({
				id: "g" + core.revision + "-w" + msgs.length,
				role: "user",
				content: [{
					type: "text",
					text: (texts.length ? "你此前的发言草稿：\n" + texts.join("\n\n") + "\n\n" : "") + "你的工具执行记录（摘要）：\n" + lines.join("\n") + "\n\n" + note + "，请基于以上记录输出最终发言。"
				}],
				source: { kind: "user" }
			});
			toolsOff = true;
		};
		for (;;) {
			if (run.stopping) break;
			let round;
			try {
				round = await streamRound();
			} catch (e) {
				const m = String(e && e.message || e);
				if (baseOpts.reasoningEffort !== void 0 && m.includes("UNSUPPORTED_REASONING_EFFORT")) {
					delete baseOpts.reasoningEffort;
					continue;
				}
				throw e;
			}
			if (round.errorFinish) {
				const f = round.errorFinish.failure || {};
				const failureText = String(f.message || round.errorFinish.kind);
				if (!toolsOff && toolSchemas.length > 0 && /tool/i.test(failureText)) {
					toolsOff = true;
					continue;
				}
				throw new Error("模型输出异常终止: " + failureText);
			}
			if (round.acc.trim()) texts.push(round.acc.trim());
			if (round.rAcc.trim()) reasonings.push(round.rAcc.trim());
			if (round.maxTokens) break;
			if (run.stopping) break;
			if (round.tcs.length === 0) break;
			const assistantContent = [];
			if (round.acc.trim()) assistantContent.push({
				type: "text",
				text: round.acc
			});
			for (const tc of round.tcs) assistantContent.push({
				type: "tool-call",
				id: tc.id,
				name: tc.name,
				arguments: tc.args
			});
			msgs.push({
				id: "g" + core.revision + "-a" + msgs.length,
				role: "assistant",
				content: assistantContent,
				source: {
					kind: "model",
					provider: role.provider,
					model: role.model
				}
			});
			for (const tc of round.tcs) {
				if (run.stopping) break;
				const res = await tools.executeTool(g, wsRoot, tc);
				const output = String(res.output || "");
				toolCalls.push({
					tool: tc.name,
					args: res.args,
					status: res.status,
					output,
					durationMs: res.durationMs
				});
				budgetUsed += Math.max(output.length, 100);
				msgs.push({
					id: "g" + core.revision + "-t" + msgs.length,
					role: "user",
					content: [{
						type: "tool-result",
						toolCallId: tc.id,
						content: [{
							type: "text",
							text: output || "（无输出）"
						}],
						isError: res.status === "error"
					}],
					source: {
						kind: "tool",
						callId: tc.id
					}
				});
				const sig = tc.name + "|" + tc.args + "|" + output;
				streak = output === "" || lastSig !== null && sig === lastSig ? streak + 1 : 1;
				lastSig = sig;
			}
			if (budgetUsed >= 32e3) {
				wrapUp("已达工具结果累计上限");
				continue;
			}
			if (streak >= 6) {
				wrapUp("检测到重复或空输出的工具调用");
				continue;
			}
		}
		return {
			text: texts.join("\n\n").trim(),
			reasoning: reasonings.join("\n\n").trim() || void 0,
			toolCalls
		};
	};
	const runLoop = async (sess) => {
		const g = groups.get(sess.groupId);
		const startCount = sess.messageIds.length;
		let failed = false;
		try {
			while (run.queue.length > 0 && !run.stopping) {
				const roleId = run.queue.shift();
				const role = roles.get(roleId);
				run.currentRoleId = roleId;
				run.partial = "";
				run.partialReasoning = "";
				touch();
				if (!role) continue;
				try {
					const out = await speak(g, sess, role);
					if (!run.stopping && (out.text || Array.isArray(out.toolCalls) && out.toolCalls.length > 0)) appendMessage(sess, role.id, out.text, {
						model: role.provider + " / " + role.model,
						reasoning: out.reasoning,
						toolCalls: out.toolCalls
					});
				} catch (e) {
					failed = true;
					appendMessage(sess, "system", "角色「" + role.name + "」发言失败：" + String(e && e.message || e), { error: true });
					break;
				}
			}
			if (run.stopping) appendMessage(sess, "system", "已停止本次对话", {});
		} finally {
			run.finished = {
				sessionId: sess.id,
				reason: failed ? "error" : "ok"
			};
			run.running = false;
			run.sessionId = null;
			run.currentRoleId = null;
			run.partial = "";
			run.partialReasoning = "";
			run.queue = [];
			run.pendingConfirm = null;
			run.confirmSignal = null;
			run.childProc = null;
			run.stopping = false;
			touch();
		}
		if (sess.messageIds.length > startCount) retitle(sess);
	};
	return {
		appendMessage,
		runLoop
	};
}
//#endregion
//#region src/host/materials/materials.ts
/**
* 资料读取与路径解析：群组工作区目录 → 注入文件清单 + 目录浏览器。
* 路径解析顺序：~ 展开到 home；绝对路径直用；相对路径先试各工作区根，
* 再试 dsh web 进程 cwd。目录浏览器与资料读取共用同一套解析。
* @module dsh-group-chat/host/materials
*/
const TEXT_EXTS = /* @__PURE__ */ new Set([
	".md",
	".markdown",
	".txt",
	".json",
	".yml",
	".yaml",
	".csv",
	".tsv",
	".toml",
	".ini",
	".conf",
	".env",
	".properties",
	".log",
	".xml",
	".html",
	".css",
	".ts",
	".tsx",
	".js",
	".jsx",
	".py",
	".java",
	".go",
	".rs",
	".c",
	".h",
	".cpp",
	".sql",
	".sh"
]);
const MAX_WS_FILES = 20;
/** 创建资料面。 */
function createMaterials(core) {
	const { ctx, fs } = core;
	const HOME = homedir();
	let workspacePathsCache = {
		at: 0,
		paths: []
	};
	const workspacePaths = async () => {
		const now = Date.now();
		if (now - workspacePathsCache.at < 5e3) return workspacePathsCache.paths;
		try {
			workspacePathsCache = {
				at: now,
				paths: (await ctx.workspaceRegistry.list()).map((w) => w.path).filter(Boolean)
			};
		} catch {
			workspacePathsCache = {
				at: now,
				paths: workspacePathsCache.paths
			};
		}
		return workspacePathsCache.paths;
	};
	const candidatePaths = async (raw) => {
		const p = String(raw || "").trim();
		if (p === "" || p === "~") return [HOME];
		if (p.startsWith("~/")) return [join(HOME, p.slice(2))];
		if (isAbsolute(p)) return [p];
		return [...await workspacePaths(), process.cwd()].map((root) => join(root, p));
	};
	/** 逐候选 stat，返回第一个存在的目标；都不存在时返回首候选与全部尝试。 */
	const resolveMaterialTarget = async (raw) => {
		const candidates = await candidatePaths(raw);
		let first;
		for (const c of candidates) {
			const target = await fs.resolve(c);
			if (first === void 0) first = {
				target,
				path: c
			};
			const info = await fs.stat(target);
			if (info !== void 0) return {
				target,
				path: c,
				info,
				tried: candidates
			};
		}
		return {
			target: first.target,
			path: first.path,
			info: void 0,
			tried: candidates
		};
	};
	const loadWorkspaceFiles = async (g) => {
		if (!g.workspaceDir) return {
			dir: "",
			parts: []
		};
		const res = await resolveMaterialTarget(g.workspaceDir);
		if (res.info === void 0) throw new Error("工作区目录不存在（尝试过：" + res.tried.join("；") + "）");
		if (res.info.type !== "directory") throw new Error("工作区目录不是目录：" + res.path);
		const entries = await fs.listDir(res.target);
		const parts = [];
		for (const e of entries) {
			if (parts.length >= MAX_WS_FILES) break;
			if (e.type !== "file" || e.name.startsWith(".")) continue;
			const dot = e.name.lastIndexOf(".");
			const ext = dot === -1 ? "" : e.name.slice(dot).toLowerCase();
			if (!TEXT_EXTS.has(ext)) continue;
			try {
				const text = await fs.readText(e.target);
				parts.push({
					name: e.name,
					content: text
				});
			} catch (err) {
				parts.push({
					name: e.name,
					content: "",
					error: String(err && err.message || err)
				});
			}
		}
		return {
			dir: res.path,
			parts
		};
	};
	const materialBlock = (parts, dir) => {
		if (!parts.length) return "";
		let total = 0;
		const lines = [];
		for (const p of parts) {
			if (p.error) {
				lines.push("### " + p.name + "\n[读取失败] " + p.error);
				continue;
			}
			let c = p.content || "";
			if (c.length > 16e3) c = c.slice(0, 16e3) + "\n…(已截断)";
			if (total + c.length > 48e3) c = c.slice(0, Math.max(0, 48e3 - total)) + "\n…(总量超限截断)";
			total += c.length;
			lines.push("### " + p.name + "\n" + c);
		}
		return "\n# 共享资料（来自群组工作区目录" + (dir ? " " + dir : "") + "，群内所有成员可见）\n" + lines.join("\n\n");
	};
	const browse = async (args) => {
		try {
			const raw = String(args && args.path || "").trim();
			const res = await resolveMaterialTarget(raw === "" ? HOME : raw);
			if (res.info === void 0) return {
				ok: false,
				error: "路径不存在，尝试过：" + res.tried.join("；")
			};
			let dirPath = res.path;
			let target = res.target;
			if (res.info.type !== "directory") {
				dirPath = dirname(dirPath);
				target = await fs.resolve(dirPath);
			}
			const sorted = [...await fs.listDir(target)].sort((a, b) => (a.type === "directory" ? 0 : 1) - (b.type === "directory" ? 0 : 1) || a.name.localeCompare(b.name));
			return {
				ok: true,
				path: dirPath,
				home: HOME,
				parent: dirname(dirPath),
				entries: sorted.map((e) => ({
					name: e.name,
					type: e.type,
					path: fs.processPath(e.target),
					size: e.size,
					hidden: e.name.startsWith(".")
				}))
			};
		} catch (e) {
			return {
				ok: false,
				error: String(e && e.message || e)
			};
		}
	};
	return {
		loadWorkspaceFiles,
		materialBlock,
		browse
	};
}
//#endregion
//#region src/core/json.ts
/** 消息 → 落盘 JSON（可选字段无则省略；兼容保留 error）。 */
function messageJson(m) {
	if (!m || typeof m.id !== "string") return null;
	const o = {
		id: m.id,
		speaker: m.speaker,
		text: String(m.text || ""),
		ts: typeof m.ts === "number" ? m.ts : Date.now(),
		seq: typeof m.seq === "number" ? m.seq : 0
	};
	if (m.model !== void 0) o.model = m.model;
	if (m.reasoning !== void 0) o.reasoning = m.reasoning;
	if (m.reasoningFull !== void 0) o.reasoningFull = m.reasoningFull;
	if (m.thinkingSummary !== void 0) o.thinkingSummary = m.thinkingSummary;
	if (m.error !== void 0) o.error = m.error;
	if (Array.isArray(m.toolCalls) && m.toolCalls.length > 0) o.toolCalls = m.toolCalls;
	return o;
}
/** 角色 → 落盘 JSON（groupId 由目录归属，不再写入）。 */
function roleJson(r) {
	const o = {
		id: r.id,
		name: String(r.name || "成员"),
		persona: String(r.persona || ""),
		provider: String(r.provider || ""),
		model: String(r.model || ""),
		enabled: r.enabled !== false,
		thinking: r.thinking === true
	};
	if (r.color) o.color = r.color;
	if (typeof r.temperature === "number" && !Number.isNaN(r.temperature)) o.temperature = r.temperature;
	if (typeof r.reasoningEffort === "string" && r.reasoningEffort && r.reasoningEffort !== "default") o.reasoningEffort = r.reasoningEffort;
	return o;
}
//#endregion
//#region src/host/persistence/store.ts
/**
* 持久化（PERSISTENCE.md v2.1：会话级文件隔离）。
*
* 目录布局（每群组一目录，一会话一文件）：
*   <dir>/ledger.json                              群组/会话清单（schema 3，纯清单，pretty；群组含 permissionTier）
*   <dir>/<group-id>/workspaceDir                  工作区目录设置（纯文本一行）
*   <dir>/<group-id>/roles.json                    群组角色（schema 1，紧凑）
*   <dir>/<group-id>/sessions/session-<uuid>.json   会话（schema 1，自包含，紧凑）
*
* 原子写 tmp+fsync+rename（每目录一次 fsync）；单实例 .lock；损坏隔离重建；
* 写失败保留脏标记；v1 自动迁移。
* @module dsh-group-chat/host/persistence/store
*/
/** DSH 主目录；DSH_GROUP_CHAT_STORE 供测试覆盖存储位置。 */
const DSH_HOME = process.env.DSH_HOME || join(homedir(), ".dsh");
/** 存储根目录。 */
const STORE_DIR = process.env.DSH_GROUP_CHAT_STORE || join(DSH_HOME, "storages", "group-chat");
const processIsAlive = (pid) => {
	try {
		process.kill(pid, 0);
		return true;
	} catch (e) {
		return e.code === "EPERM";
	}
};
const SESSION_FILE_RE = /^session-(.+)\.json$/;
/** 会话文件名 → 会话 id。 */
function sessionFileMatch(name) {
	const m = SESSION_FILE_RE.exec(name);
	return m ? m[1] : null;
}
var Store = class {
	dir;
	ledgerFile;
	lockFile;
	lockFd;
	constructor(dir) {
		this.dir = dir;
		this.ledgerFile = join(dir, "ledger.json");
		this.lockFile = join(dir, ".lock");
		mkdirSync(dir, { recursive: true });
		this.lockFd = this.acquireLock();
	}
	groupDir(groupId) {
		return join(this.dir, groupId);
	}
	sessionsDir(groupId) {
		return join(this.groupDir(groupId), "sessions");
	}
	sessionFile(groupId, sessionId) {
		return join(this.sessionsDir(groupId), "session-" + sessionId + ".json");
	}
	rolesFile(groupId) {
		return join(this.groupDir(groupId), "roles.json");
	}
	workspaceFile(groupId) {
		return join(this.groupDir(groupId), "workspaceDir");
	}
	acquireLock() {
		for (let attempt = 0; attempt < 2; attempt++) try {
			const fd = openSync(this.lockFile, "wx", 384);
			writeFileSync(fd, JSON.stringify({
				pid: process.pid,
				token: randomUUID(),
				at: Date.now()
			}), "utf8");
			try {
				fsyncSync(fd);
			} catch {}
			try {
				chmodSync(this.lockFile, 384);
			} catch {}
			return fd;
		} catch (e) {
			if (e.code !== "EEXIST") throw e;
			let pid;
			try {
				pid = JSON.parse(readFileSync(this.lockFile, "utf8")).pid;
			} catch {
				throw new Error(`持久化锁不可读，如确认无其他 dsh web 在运行可手动删除 ${this.lockFile}`);
			}
			if (typeof pid === "number" && processIsAlive(pid)) throw new Error(`持久化锁被进程 ${pid} 持有`);
			try {
				unlinkSync(this.lockFile);
			} catch (ue) {
				if (ue.code !== "ENOENT") throw ue;
			}
		}
		throw new Error("持久化锁获取失败");
	}
	release() {
		if (this.lockFd !== void 0) {
			try {
				closeSync(this.lockFd);
			} catch {}
			try {
				unlinkSync(this.lockFile);
			} catch {}
			this.lockFd = void 0;
		}
	}
	fsyncDir(dir) {
		try {
			const fd = openSync(dir, "r");
			try {
				fsyncSync(fd);
			} finally {
				closeSync(fd);
			}
		} catch {}
	}
	/** 原子写：tmp+fsync+rename；目录 fsync 由调用方按 flush 批量执行（每目录一次）。 */
	atomicWrite(file, text) {
		mkdirSync(dirname(file), { recursive: true });
		const tmp = `${file}.tmp-${process.pid}`;
		let fd;
		try {
			fd = openSync(tmp, "w", 384);
			writeFileSync(fd, text, "utf8");
			fsyncSync(fd);
			closeSync(fd);
			fd = void 0;
			try {
				chmodSync(tmp, 384);
			} catch {}
			renameSync(tmp, file);
		} catch (e) {
			if (fd !== void 0) try {
				closeSync(fd);
			} catch {}
			try {
				unlinkSync(tmp);
			} catch {}
			throw e;
		}
	}
	quarantine(file) {
		try {
			renameSync(file, `${file}.corrupt-${Date.now()}-${process.pid}`);
		} catch {}
	}
	/** 读 JSON；缺失返回 null；损坏则隔离后返回 null。 */
	loadJson(file) {
		let raw;
		try {
			raw = readFileSync(file, "utf8");
		} catch (e) {
			if (e.code === "ENOENT") return null;
			throw e;
		}
		try {
			return JSON.parse(raw);
		} catch (e) {
			console.error(`[dsh-group-chat] ${basename(file)} 解析失败，已隔离并以空数据启动：`, e);
			this.quarantine(file);
			return null;
		}
	}
	readWorkspace(groupId) {
		try {
			return readFileSync(this.workspaceFile(groupId), "utf8").trim();
		} catch {
			return "";
		}
	}
	/** hydrate 残留清理：.tmp-* 删除；同前缀 .corrupt-* 只保留最近 1 份。 */
	cleanup() {
		const sweep = (dir) => {
			let entries;
			try {
				entries = readdirSync(dir, { withFileTypes: true });
			} catch {
				return;
			}
			const corrupt = /* @__PURE__ */ new Map();
			for (const e of entries) {
				if (!e.isFile()) continue;
				if (/\.tmp-\d+$/.test(e.name)) {
					try {
						unlinkSync(join(dir, e.name));
					} catch {}
					continue;
				}
				const m = /^(.+)\.corrupt-\d+-\d+$/.exec(e.name);
				if (m) {
					let mtime = 0;
					try {
						mtime = statSync(join(dir, e.name)).mtimeMs;
					} catch {}
					if (!corrupt.has(m[1])) corrupt.set(m[1], []);
					corrupt.get(m[1]).push({
						name: e.name,
						mtime
					});
				}
			}
			for (const list of corrupt.values()) {
				list.sort((a, b) => b.mtime - a.mtime);
				for (const item of list.slice(1)) try {
					unlinkSync(join(dir, item.name));
				} catch {}
			}
		};
		sweep(this.dir);
		let entries;
		try {
			entries = readdirSync(this.dir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const e of entries) {
			if (!e.isDirectory()) continue;
			const gdir = join(this.dir, e.name);
			sweep(gdir);
			sweep(join(gdir, "sessions"));
		}
	}
	/** v1（ledger+messages 双文件）→ v2 一次性迁移；幂等，messages.json 只归档从不删除。 */
	migrateV1() {
		const v1MessagesFile = join(this.dir, "messages.json");
		if (!existsSync(v1MessagesFile)) return;
		const v1Ledger = this.loadJson(this.ledgerFile);
		const archive = () => {
			try {
				renameSync(v1MessagesFile, `${v1MessagesFile}.migrated-${Date.now()}`);
			} catch {}
			this.fsyncDir(this.dir);
		};
		if (!v1Ledger || v1Ledger.schema === 2 || !Array.isArray(v1Ledger.groups)) {
			archive();
			return;
		}
		let dirs;
		try {
			dirs = readdirSync(this.dir, { withFileTypes: true });
		} catch {
			dirs = [];
		}
		for (const e of dirs) {
			if (!e.isDirectory()) continue;
			const gdir = join(this.dir, e.name);
			try {
				rmSync(join(gdir, "sessions"), {
					recursive: true,
					force: true
				});
			} catch {}
			for (const name of ["roles.json", "workspaceDir"]) try {
				unlinkSync(join(gdir, name));
			} catch {}
		}
		const groupsById = /* @__PURE__ */ new Map();
		for (const g of v1Ledger.groups) if (g && typeof g.id === "string") groupsById.set(g.id, g);
		const rolesByGroup = /* @__PURE__ */ new Map();
		for (const r of Array.isArray(v1Ledger.roles) ? v1Ledger.roles : []) if (r && typeof r.id === "string" && groupsById.has(r.groupId)) {
			if (!rolesByGroup.has(r.groupId)) rolesByGroup.set(r.groupId, []);
			rolesByGroup.get(r.groupId).push(r);
		}
		const v1Sessions = (Array.isArray(v1Ledger.sessions) ? v1Ledger.sessions : []).filter((s) => s && typeof s.id === "string" && groupsById.has(s.groupId));
		const sessionIds = new Set(v1Sessions.map((s) => s.id));
		const messagesDoc = this.loadJson(v1MessagesFile);
		const messagesBySession = /* @__PURE__ */ new Map();
		for (const m of messagesDoc && Array.isArray(messagesDoc.messages) ? messagesDoc.messages : []) if (m && typeof m.id === "string" && sessionIds.has(m.sessionId)) {
			if (!messagesBySession.has(m.sessionId)) messagesBySession.set(m.sessionId, []);
			messagesBySession.get(m.sessionId).push(m);
		}
		const fsyncDirs = /* @__PURE__ */ new Set();
		const uuidById = /* @__PURE__ */ new Map();
		for (const s of v1Sessions) {
			const uuid = randomUUID();
			uuidById.set(s.id, uuid);
			const doc = {
				schema: 1,
				savedAt: Date.now(),
				id: uuid,
				groupId: s.groupId,
				name: String(s.name || "会话"),
				topic: String(s.topic || ""),
				createdAt: typeof s.createdAt === "number" ? s.createdAt : Date.now(),
				messages: (messagesBySession.get(s.id) || []).map((m) => messageJson(m)).filter(Boolean)
			};
			this.atomicWrite(this.sessionFile(s.groupId, uuid), JSON.stringify(doc));
			fsyncDirs.add(this.sessionsDir(s.groupId));
		}
		for (const g of groupsById.values()) {
			this.atomicWrite(this.rolesFile(g.id), JSON.stringify({
				schema: 1,
				savedAt: Date.now(),
				roles: (rolesByGroup.get(g.id) || []).map((r) => roleJson(r))
			}));
			this.atomicWrite(this.workspaceFile(g.id), String(g.workspaceDir || "").trim() + "\n");
			fsyncDirs.add(this.groupDir(g.id));
		}
		this.atomicWrite(this.ledgerFile, JSON.stringify({
			schema: 2,
			savedAt: Date.now(),
			groups: [...groupsById.values()].map((g) => ({
				id: g.id,
				name: String(g.name || "群组")
			})),
			sessions: v1Sessions.map((s) => ({
				id: uuidById.get(s.id),
				groupId: s.groupId
			}))
		}, null, 2));
		fsyncDirs.add(this.dir);
		for (const d of fsyncDirs) this.fsyncDir(d);
		archive();
	}
};
/** 从磁盘目录回收群组 id 列表（ledger 缺失/损坏时的兜底路径）。 */
function scanGroupIds(dir) {
	let entries;
	try {
		entries = readdirSync(dir, { withFileTypes: true });
	} catch {
		return [];
	}
	return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}
/** 扫描群组目录下的会话文件（ledger 缺失/损坏时的兜底路径）。 */
function scanSessionIds(store, groupId) {
	let entries;
	try {
		entries = readdirSync(store.sessionsDir(groupId), { withFileTypes: true });
	} catch {
		return [];
	}
	const ids = [];
	for (const se of entries) {
		if (!se.isFile()) continue;
		const m = sessionFileMatch(se.name);
		if (m) ids.push(m);
	}
	return ids;
}
/** 空群组记录构造（hydrate 兜底路径用）。 */
function emptyGroup(id, name) {
	return {
		id,
		name,
		workspaceDir: "",
		permissionTier: "view_only",
		roleIds: [],
		sessionIds: []
	};
}
//#endregion
//#region src/host/persistence/persistence.ts
/**
* 持久化（PERSISTENCE.md v2.1）：事件驱动脏标记合并落盘 + 启动恢复。
* 锁失败/写失败时降级为内存态运行（console 告警）。
* @module dsh-group-chat/host/persistence
*/
/**
* 创建持久化面：构造即完成 store 初始化 + hydrate（v1 迁移 → 残留清理 →
* 清单 → 群组数据 → 会话文件；缺文件空重建；补建默认会话/群组立即落盘）。
*/
function createPersistence(core) {
	try {
		core.store = new Store(STORE_DIR);
	} catch (e) {
		console.error("[dsh-group-chat] 持久化不可用，本实例以内存态运行（重启后数据不保留）：", e);
		core.store = null;
	}
	const store = () => core.store;
	const dirtySessions = /* @__PURE__ */ new Set();
	const dirtyRoles = /* @__PURE__ */ new Set();
	const dirtyWorkspace = /* @__PURE__ */ new Set();
	let ledgerDirty = false;
	let flushScheduled = false;
	const ledgerDocument = () => ({
		schema: 3,
		savedAt: Date.now(),
		groups: [...core.groups.values()].map((g) => ({
			id: g.id,
			name: g.name,
			permissionTier: g.permissionTier
		})),
		sessions: [...core.groups.values()].flatMap((g) => g.sessionIds.map((sid) => ({
			id: sid,
			groupId: g.id
		})))
	});
	const sessionDocument = (s) => ({
		schema: 1,
		savedAt: Date.now(),
		id: s.id,
		name: s.name,
		groupId: s.groupId,
		topic: s.topic,
		...s.namePinned ? { namePinned: true } : {},
		...s.topicPinned ? { topicPinned: true } : {},
		createdAt: s.createdAt,
		messages: s.messageIds.map((mid) => core.messages.get(mid)).filter(Boolean).map((m) => messageJson(m)).filter(Boolean)
	});
	const rolesDocument = (g) => ({
		schema: 1,
		savedAt: Date.now(),
		roles: g.roleIds.map((rid) => core.roles.get(rid)).filter((r) => Boolean(r)).map((r) => roleJson(r))
	});
	/** 同步 flush：写全部脏文件；成功才清脏标记；每个实际发生 rename 的目录一次 fsync。 */
	const flushNow = () => {
		const s = store();
		if (s === null) return;
		const fsyncDirs = /* @__PURE__ */ new Set();
		for (const sid of [...dirtySessions]) {
			const sess = core.sessions.get(sid);
			if (!sess) {
				dirtySessions.delete(sid);
				continue;
			}
			try {
				s.atomicWrite(s.sessionFile(sess.groupId, sess.id), JSON.stringify(sessionDocument(sess)));
				dirtySessions.delete(sid);
				fsyncDirs.add(s.sessionsDir(sess.groupId));
			} catch (e) {
				console.error(`[dsh-group-chat] 会话 ${sid} 落盘失败（保留脏标记待重试）：`, e);
			}
		}
		for (const gid of [...dirtyRoles]) {
			const g = core.groups.get(gid);
			if (!g) {
				dirtyRoles.delete(gid);
				continue;
			}
			try {
				s.atomicWrite(s.rolesFile(gid), JSON.stringify(rolesDocument(g)));
				dirtyRoles.delete(gid);
				fsyncDirs.add(s.groupDir(gid));
			} catch (e) {
				console.error(`[dsh-group-chat] 群组 ${gid} roles.json 落盘失败（保留脏标记待重试）：`, e);
			}
		}
		for (const gid of [...dirtyWorkspace]) {
			const g = core.groups.get(gid);
			if (!g) {
				dirtyWorkspace.delete(gid);
				continue;
			}
			try {
				s.atomicWrite(s.workspaceFile(gid), (g.workspaceDir || "") + "\n");
				dirtyWorkspace.delete(gid);
				fsyncDirs.add(s.groupDir(gid));
			} catch (e) {
				console.error(`[dsh-group-chat] 群组 ${gid} workspaceDir 落盘失败（保留脏标记待重试）：`, e);
			}
		}
		if (ledgerDirty) try {
			s.atomicWrite(s.ledgerFile, JSON.stringify(ledgerDocument(), null, 2));
			ledgerDirty = false;
			fsyncDirs.add(s.dir);
		} catch (e) {
			console.error("[dsh-group-chat] ledger.json 落盘失败（保留脏标记待重试）：", e);
		}
		for (const d of fsyncDirs) s.fsyncDir(d);
	};
	/** 事件驱动落盘；同一 tick 内多次变更合并为一次写。 */
	const schedulePersist = ({ ledger = false, session = null, roles: roleGroup = null, workspace = null } = {}) => {
		if (store() === null) return;
		if (ledger) ledgerDirty = true;
		if (session) dirtySessions.add(session);
		if (roleGroup) dirtyRoles.add(roleGroup);
		if (workspace) dirtyWorkspace.add(workspace);
		if (flushScheduled) return;
		flushScheduled = true;
		Promise.resolve().then(() => {
			flushScheduled = false;
			flushNow();
		});
	};
	const dropDirty = ({ session = null, roles: roleGroup = null, workspace = null }) => {
		if (session) dirtySessions.delete(session);
		if (roleGroup) dirtyRoles.delete(roleGroup);
		if (workspace) dirtyWorkspace.delete(workspace);
	};
	const loadSession = (groupId, sid, noteMissing) => {
		if (core.sessions.has(sid)) return;
		const g = core.groups.get(groupId);
		if (!g) return;
		const sess = {
			id: sid,
			groupId,
			name: "会话",
			topic: "",
			messageIds: [],
			createdAt: Date.now()
		};
		let doc = null;
		const s = store();
		if (s) {
			const file = s.sessionFile(groupId, sid);
			if (noteMissing && !existsSync(file)) console.error(`[dsh-group-chat] 会话 ${sid} 文件缺失，按空消息重建`);
			doc = s.loadJson(file);
		}
		if (doc) {
			if (typeof doc.name === "string" && doc.name) sess.name = doc.name;
			if (typeof doc.topic === "string") sess.topic = doc.topic;
			if (doc.namePinned === true) sess.namePinned = true;
			if (doc.topicPinned === true) sess.topicPinned = true;
			if (typeof doc.createdAt === "number") sess.createdAt = doc.createdAt;
			let fallbackSeq = 0;
			for (const m of Array.isArray(doc.messages) ? doc.messages : []) {
				if (!m || typeof m.id !== "string" || core.messages.has(m.id)) continue;
				fallbackSeq++;
				core.messages.set(m.id, {
					id: m.id,
					sessionId: sid,
					seq: typeof m.seq === "number" ? m.seq : fallbackSeq,
					speaker: m.speaker ?? "",
					text: String(m.text || ""),
					reasoning: m.reasoning !== void 0 ? String(m.reasoning) : void 0,
					reasoningFull: m.reasoningFull !== void 0 ? String(m.reasoningFull) : void 0,
					thinkingSummary: m.thinkingSummary !== void 0 ? String(m.thinkingSummary) : void 0,
					model: m.model,
					error: m.error,
					toolCalls: Array.isArray(m.toolCalls) ? m.toolCalls : void 0,
					ts: typeof m.ts === "number" ? m.ts : Date.now()
				});
				sess.messageIds.push(m.id);
			}
		}
		core.sessions.set(sid, sess);
		g.sessionIds.push(sid);
	};
	const loadGroupData = (g) => {
		const s = store();
		if (!s) return;
		g.workspaceDir = s.readWorkspace(g.id);
		const doc = s.loadJson(s.rolesFile(g.id));
		if (doc && Array.isArray(doc.roles)) {
			for (const r of doc.roles) if (r && typeof r.id === "string" && !core.roles.has(r.id)) {
				core.roles.set(r.id, {
					id: r.id,
					groupId: g.id,
					name: String(r.name || "成员"),
					color: r.color || void 0,
					persona: String(r.persona || ""),
					provider: String(r.provider || ""),
					model: String(r.model || ""),
					temperature: asNumber(r.temperature),
					reasoningEffort: typeof r.reasoningEffort === "string" && r.reasoningEffort ? r.reasoningEffort : void 0,
					enabled: r.enabled !== false,
					thinking: r.thinking === true
				});
				g.roleIds.push(r.id);
			}
		}
	};
	const hydrate = () => {
		const s = store();
		if (s) {
			try {
				s.migrateV1();
			} catch (e) {
				console.error("[dsh-group-chat] v1 数据迁移失败，下次启动重试：", e);
			}
			try {
				s.cleanup();
			} catch {}
		}
		const ledger = s ? s.loadJson(s.ledgerFile) : null;
		if (ledger && Array.isArray(ledger.groups)) {
			for (const g of ledger.groups) if (g && typeof g.id === "string" && !core.groups.has(g.id)) core.groups.set(g.id, {
				id: g.id,
				name: String(g.name || "群组"),
				workspaceDir: "",
				permissionTier: migrateTier(g.permissionTier, g.allowCommands),
				roleIds: [],
				sessionIds: []
			});
			for (const g of core.groups.values()) loadGroupData(g);
			for (const item of Array.isArray(ledger.sessions) ? ledger.sessions : []) if (item && typeof item.id === "string" && core.groups.has(item.groupId)) loadSession(item.groupId, item.id, true);
		} else if (s) for (const gid of scanGroupIds(STORE_DIR)) {
			const g = emptyGroup(gid, "群组");
			core.groups.set(g.id, g);
			loadGroupData(g);
			for (const sid of scanSessionIds(s, gid)) loadSession(gid, sid, false);
		}
		const autoSessions = [];
		for (const g of core.groups.values()) if (g.sessionIds.length === 0) {
			const sess = core.newSession(g.id);
			g.sessionIds.push(sess.id);
			autoSessions.push(sess.id);
		}
		if (core.groups.size === 0) {
			const g = {
				id: core.nid("grp"),
				name: "默认群组",
				workspaceDir: "",
				permissionTier: "view_only",
				roleIds: [],
				sessionIds: []
			};
			core.groups.set(g.id, g);
			const sess = core.newSession(g.id, "会话 1");
			g.sessionIds.push(sess.id);
			autoSessions.push(sess.id);
		}
		let maxSeq = 0;
		for (const id of [
			...core.groups.keys(),
			...core.roles.keys(),
			...core.messages.keys()
		]) {
			const m = /-(\d+)$/.exec(id);
			if (m) maxSeq = Math.max(maxSeq, Number(m[1]));
		}
		core.idSeq = maxSeq + 1;
		if (autoSessions.length > 0) {
			schedulePersist({ ledger: true });
			for (const sid of autoSessions) schedulePersist({ session: sid });
		}
	};
	hydrate();
	return {
		schedulePersist,
		flushNow,
		dropDirty,
		release() {
			const s = store();
			if (s === null) return;
			try {
				flushNow();
			} catch {}
			try {
				s.release();
			} catch {}
			core.store = null;
		}
	};
}
//#endregion
//#region src/host/tools/tools.ts
/**
* 工具执行（TOOLS.md §2：沙箱 / §3：确认闸门）：read_file / list_dir /
* run_command 三件套；realpath 硬边界 + 分隔符比较；run_command 按群组
* 权限档位走逐条确认或直接执行。
* @module dsh-group-chat/host/tools
*/
/** 创建工具面。 */
function createTools(core, touch) {
	const { run } = core;
	/** realpath 硬边界：目标必须在群组工作区内（带分隔符比较，防 /ws/foo 放行 /ws/foobar）。 */
	const resolveInWorkspace = (root, rawPath) => {
		const p = rawPath === void 0 || rawPath === null || String(rawPath).trim() === "" ? "." : String(rawPath);
		let target;
		try {
			target = realpathSync(isAbsolute(p) ? p : join(root, p));
		} catch {
			return {
				ok: false,
				error: "路径不存在：" + p
			};
		}
		if (target !== root && !target.startsWith(root + sep)) return {
			ok: false,
			error: "路径超出群组工作区范围：" + p
		};
		return {
			ok: true,
			target
		};
	};
	const toolReadFile = (root, args) => {
		const r = resolveInWorkspace(root, args.path);
		if (!r.ok) return {
			status: "error",
			output: r.error
		};
		let fd;
		try {
			if (!statSync(r.target).isFile()) return {
				status: "error",
				output: "不是文件：" + String(args.path)
			};
			fd = openSync(r.target, "r");
			const buf = Buffer.alloc(102401);
			const n = readSync(fd, buf, 0, buf.length, 0);
			let text = buf.subarray(0, Math.min(n, READ_FILE_MAX_BYTES)).toString("utf8");
			if (n > 102400) text += "\n…(文件超过 100KB，已截断)";
			return {
				status: "ok",
				output: text || "（空文件）"
			};
		} catch (e) {
			return {
				status: "error",
				output: "读取失败：" + String(e && e.message || e)
			};
		} finally {
			if (fd !== void 0) try {
				closeSync(fd);
			} catch {}
		}
	};
	const toolListDir = (root, args) => {
		const r = resolveInWorkspace(root, args.path);
		if (!r.ok) return {
			status: "error",
			output: r.error
		};
		try {
			if (!statSync(r.target).isDirectory()) return {
				status: "error",
				output: "不是目录：" + String(args.path)
			};
			const entries = readdirSync(r.target, { withFileTypes: true }).sort((a, b) => (a.isDirectory() ? 0 : 1) - (b.isDirectory() ? 0 : 1) || a.name.localeCompare(b.name));
			const lines = entries.slice(0, 500).map((e) => {
				if (e.isDirectory()) return e.name + "/";
				try {
					return e.name + " (" + statSync(join(r.target, e.name)).size + " B)";
				} catch {
					return e.name;
				}
			});
			if (entries.length > 500) lines.push("…(共 " + entries.length + " 项，仅显示前 500)");
			const out = lines.join("\n") || "（空目录）";
			return {
				status: "ok",
				output: out.length > 8e3 ? out.slice(0, CMD_OUTPUT_MAX_CHARS) + "\n…(已截断)" : out
			};
		} catch (e) {
			return {
				status: "error",
				output: "列出失败：" + String(e && e.message || e)
			};
		}
	};
	const runCommandTool = (root, command) => new Promise((resolve) => {
		let child;
		try {
			child = spawn("bash", ["-c", command], { cwd: root });
		} catch (e) {
			resolve({
				status: "error",
				output: "无法启动命令：" + String(e && e.message || e)
			});
			return;
		}
		run.childProc = child;
		let out = "";
		let dropped = 0;
		let timedOut = false;
		const onChunk = (chunk) => {
			if (out.length < 1048576) out += chunk.toString("utf8");
			else dropped += chunk.length;
		};
		child.stdout?.on("data", onChunk);
		child.stderr?.on("data", onChunk);
		const timer = setTimeout(() => {
			timedOut = true;
			try {
				child.kill("SIGKILL");
			} catch {}
		}, RUN_CMD_TIMEOUT_MS);
		const finish = (result) => {
			clearTimeout(timer);
			if (run.childProc === child) run.childProc = null;
			resolve(result);
		};
		child.on("error", (e) => finish({
			status: "error",
			output: "执行失败：" + String(e && e.message || e)
		}));
		child.on("close", (code) => {
			let text = out.length > 1048576 ? out.slice(0, CMD_CAPTURE_MAX_BYTES) : out;
			if (dropped > 0) text += "\n[输出采集超限，已丢弃 " + dropped + " 字节]";
			if (timedOut) text += "\n[执行超时（" + Math.round(RUN_CMD_TIMEOUT_MS / 1e3) + "s），已强制终止]";
			if (code !== 0 && code !== null && !timedOut) text += "\n[退出码 " + code + "]";
			if (text.length > 8e3) text = text.slice(0, CMD_OUTPUT_MAX_CHARS) + "\n…(输出超长，已截断)";
			finish({
				status: code === 0 ? "ok" : "error",
				output: text || "（无输出）"
			});
		});
	});
	/** run_command 确认闸门：置 pendingConfirm 后无限等待，confirmCommand/stop/dispose 唤醒。 */
	const requestConfirmation = (toolCallId, args) => new Promise((resolve) => {
		run.pendingConfirm = {
			toolCallId,
			tool: "run_command",
			args
		};
		run.confirmSignal = { resolve };
		touch();
	});
	const wakeConfirm = () => {
		const signal = run.confirmSignal;
		run.pendingConfirm = null;
		run.confirmSignal = null;
		if (signal) try {
			signal.resolve(false);
		} catch {}
	};
	const killChild = () => {
		if (run.childProc) try {
			run.childProc.kill("SIGKILL");
		} catch {}
	};
	const executeTool = async (g, root, tc) => {
		let args = {};
		try {
			const parsed = JSON.parse(tc.args);
			if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) args = parsed;
		} catch {}
		const started = Date.now();
		let res;
		if (tc.name === "read_file") res = toolReadFile(root, args);
		else if (tc.name === "list_dir") res = toolListDir(root, args);
		else if (tc.name === "run_command") {
			if (g.permissionTier === "view_only") res = {
				status: "error",
				output: "群组权限为「仅可查看」，该命令未被运行"
			};
			else if (g.permissionTier === "workspace_write") {
				const allowed = await requestConfirmation(tc.id, args);
				if (run.stopping) res = {
					status: "error",
					output: "对话已被用户停止，命令未执行"
				};
				else if (!allowed) res = {
					status: "denied",
					output: "用户拒绝了这次命令执行"
				};
				else res = await runCommandTool(root, String(args.command || ""));
			} else res = await runCommandTool(root, String(args.command || ""));
		} else res = {
			status: "error",
			output: "未知工具：" + tc.name
		};
		return {
			status: res.status,
			output: res.output,
			args,
			durationMs: Date.now() - started
		};
	};
	const buildToolSchemas = (g) => {
		if (!g.workspaceDir) return [];
		return TOOL_SCHEMAS.filter((t) => t.name !== "run_command" || g.permissionTier !== "view_only");
	};
	return {
		executeTool,
		buildToolSchemas,
		requestConfirmation,
		wakeConfirm,
		killChild
	};
}
//#endregion
//#region src/host/service.ts
/**
* 创建群聊宿主服务（装配各模块；持久化锁失败时降级内存态运行）。
*/
function createGroupChatService(ctx) {
	const core = createHostState(ctx);
	const persist = createPersistence(core);
	const bus = createBroadcast(core);
	const materials = createMaterials(core);
	const tools = createTools(core, bus.touch);
	const conversation = createConversation(core, {
		touch: bus.touch,
		schedulePersist: persist.schedulePersist,
		materials,
		tools
	});
	const actions = createActions(core, {
		touch: bus.touch,
		snapshot: bus.snapshot,
		schedulePersist: persist.schedulePersist,
		dropDirty: persist.dropDirty,
		appendMessage: conversation.appendMessage,
		runLoop: conversation.runLoop,
		wakeConfirm: tools.wakeConfirm,
		killChild: tools.killChild,
		browse: materials.browse
	});
	return {
		snapshot: bus.snapshot,
		handleAction: actions.handleAction,
		subscribePush: bus.subscribePush,
		stopAll() {
			if (core.run.running) {
				core.run.stopping = true;
				bus.touch();
			}
		},
		dispose() {
			core.run.stopping = true;
			if (core.run.pendingConfirm) tools.wakeConfirm();
			tools.killChild();
			bus.dispose();
			persist.release();
		}
	};
}
//#endregion
//#region src/index.ts
const name = "group-chat";
const inject = [
	"llm",
	"fs",
	"webServer",
	"workspaceRegistry"
];
/** 设置命名空间；浏览器半拼写同一值，两边不共享代码。 */
const SETTINGS_NAMESPACE = "group-chat";
/** 设置 schema：目前只有启停一个开关。 */
const Config = z.object({ enabled: z.boolean().default(true) });
/**
* Host 半插件体：状态机服务 + HTTP 路由 + 设置接入。
* mountOnce 保证同名包每进程至多挂载一次（bundle 聚合与独立安装并存场景）。
*/
const apply = mountOnce("dsh-group-chat", (ctx, config) => {
	const service = createGroupChatService(ctx);
	ctx.effect(() => {
		const disposers = makeGroupChatRoutes(service).map((route) => ctx.webServer.register(route));
		return () => {
			for (const dispose of disposers) dispose();
		};
	}, "group-chat: host API routes");
	ctx.effect(() => () => {
		service.dispose();
	});
	let current = () => config ?? {};
	const sync = () => {
		if (!(current().enabled ?? true)) service.stopAll();
	};
	ctx.inject(["settings"], (settingsCtx) => {
		try {
			if (typeof settingsCtx.settings?.installSection === "function") settingsCtx.settings.installSection(ctx, SETTINGS_NAMESPACE, Config, config ?? {}, {
				setSource: (source) => {
					current = source;
				},
				onChange: sync
			});
			else if (typeof settingsCtx.settings?.register === "function") {
				const scope = settingsCtx.settings.register(SETTINGS_NAMESPACE, Config, { base: config ?? {} });
				current = () => scope?.get?.() ?? config ?? {};
				scope?.watch?.(() => {
					sync();
				});
			}
		} catch {}
	});
	sync();
});
//#endregion
export { Config, SETTINGS_NAMESPACE, apply, inject, name };
