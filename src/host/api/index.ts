/**
 * API 层统一导出：HTTP 传输（护栏 + 路由）与动作分发。
 * @module dsh-group-chat/host/api
 */

export { createActions } from './actions.ts'
export type { Actions } from './actions.ts'
export { makeGroupChatRoutes } from './routes.ts'
