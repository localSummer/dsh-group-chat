/**
 * Host HTTP 工具：回环信任栏（对齐 dsh-web shared/host/loopback.ts 语义 +
 * 浏览器同源标记栏）、有界 JSON 请求体读取、JSON 响应写出。
 * @module dsh-group-chat/host/api/http
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
/**
 * 请求级信任栏：浏览器同源标记（sec-fetch-site / Origin）必须存在且回环
 * socket + 回环 Host 全过；X-Forwarded-For 一律不信任。无任何同源标记的
 * 非浏览器请求（如裸 curl）一律拒绝。
 */
export declare function isTrustedRequest(req: IncomingMessage): boolean;
/** 读有界 JSON 请求体；超限抛 'body-too-large'（路由映射 413）。 */
export declare function readBody(req: IncomingMessage): Promise<unknown>;
/** 写 JSON 响应；调用方可追加/覆盖默认头。 */
export declare function writeJson(res: ServerResponse, status: number, body: unknown, headers?: Record<string, string | number>): void;
