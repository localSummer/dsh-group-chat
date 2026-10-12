/**
 * 浏览器半 transport：/api/group-chat/* 同源 JSON 端点。
 * @module dsh-group-chat/client/api
 */
export declare const api: {
    state: () => Promise<unknown>;
    action: (payload: Record<string, unknown>, signal?: AbortSignal) => Promise<unknown>;
    /** 图片上传：base64 → durable 引用（独立端点，避开 action 的请求体上限）。 */
    upload: (payload: {
        data: string;
        mediaType: string;
        name?: string;
    }) => Promise<unknown>;
    /** 图片字节 URL（durable 引用 → <img src>）。 */
    imageUrl: (attachmentId: string) => string;
};
