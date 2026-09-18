/**
 * 主面板：三区工作台——左导航栏（搜索 + 群组→会话目录树）、中央会话流
 * （@成员 点名 + markdown 渲染 + 思考折叠）、右上下文栏（群成员角色卡 +
 * 工作区目录），右栏可收起，角色编辑走右侧滑出抽屉。
 *
 * 面板数据走 /api/group-chat/*（fetch + SSE），Host 半持有全部状态。
 * @module dsh-group-chat/client/panel
 */
import { type ReactNode } from 'react';
export declare function GroupChatPanel(): ReactNode;
