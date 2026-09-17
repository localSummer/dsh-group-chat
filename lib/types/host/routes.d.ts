/**
 * HTTP 路由（经 webServer 暴露）：
 *   GET  /api/group-chat/state   全量快照
 *   POST /api/group-chat/action   { kind: mutate|send|stop|models|preview, ... }
 *   GET  /api/group-chat/events   SSE，状态变化时推送节流后的全量快照
 * @module dsh-group-chat/host/routes
 */
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver';
import type { GroupChatService } from './service.ts';
/** 构建群聊的三条 HTTP 路由。 */
export declare function makeGroupChatRoutes(service: GroupChatService): WebRoute[];
