/**
 * 面板内看图：盖住群聊三区，不新开标签，也不用确认弹窗。
 * @module dsh-group-chat/client/components
 */
import { type ReactNode } from 'react';
export declare function ImageLightbox(props: {
    src: string;
    name: string;
    onClose: () => void;
}): ReactNode;
