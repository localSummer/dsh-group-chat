/**
 * 群聊宿主半对外门面（对齐浏览器半 src/client/index.ts 的入口角色）：
 * 插件入口（src/index.ts）只从这里取宿主面的装配件。
 * @module dsh-group-chat/host
 */

export { createGroupChatService } from './service.ts'
export type { GroupChatService } from './service.ts'
export { makeGroupChatRoutes } from './api/routes.ts'
