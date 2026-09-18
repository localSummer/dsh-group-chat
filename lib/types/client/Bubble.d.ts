/**
 * 聊天消息气泡（user / system / 角色发言）。
 * @module dsh-group-chat/client/Bubble
 */
import type { ReactNode } from 'react';
import { type ClientSnapshot } from './model.ts';
export declare function Bubble(props: {
    snap: ClientSnapshot;
    m: ClientSnapshot['messages'][number];
}): ReactNode;
