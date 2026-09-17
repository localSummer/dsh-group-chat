/**
 * 浏览器半 transport：/api/group-chat/* 同源 JSON 端点。
 * @module dsh-group-chat/client/api
 */
export declare const api: {
    state: () => Promise<unknown>;
    action: (payload: Record<string, unknown>) => Promise<unknown>;
};
