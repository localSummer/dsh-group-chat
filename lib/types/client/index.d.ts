/**
 * dsh-group-chat — 浏览器半（web 客户端模块）。
 *
 * 经 window.__ModuleLoader__.load 注册（由 tsdown 预设的 banner/footer 闭包
 * 工厂外壳生成）；factory 返回 Cordis 客户端插件：
 *  - 「模型群聊」设置页（settings.section）：启停开关，写 host 的 group-chat
 *    设置命名空间（settings.yaml 持久化）
 *  - 启用时挂载：侧边栏「群聊」入口（sidebar.panellist）+ 中央主面板（main）
 *  - 面板数据走 /api/group-chat/*（fetch + SSE），Host 半持有全部状态
 *  - DSW 原语（@deepseek-ai/dsh-client-ui-primitives，shell 静态种子模块）
 *    提供按钮/输入/开关/菜单/图标与 MarkdownText 渲染器
 *
 * 设计契约（impeccable direction contract；seed key 76db9e37，surface roll
 * 第 4/6/1 手中用户锁定 C「三区工作台」，代码先行）：
 * THESIS 三区工作台；FIRST VIEWPORT 左 232px 导航 + 中央会话流 + 右 304px
 * 上下文栏（窄容器覆盖式、可收起）。完整契约见 docs/DESIGN.md。
 *
 * @module dsh-group-chat/client
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis';
/** Client plugin id. */
export declare const name = "group-chat-client";
/** Required services. */
export declare const inject: string[];
/**
 * Shell 布局槽位的类型声明镜像（运行时由外壳的 layout/sidebar 包声明）：
 * 中央主面板为 keyed 槽（按 key 挂载），侧边栏面板列表为 list 槽
 * （id + order + label）。参照 dsh-web 家族外部包的自声明模式。
 */
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface SlotMap {
        /** 中央主面板：按 key 挂载一个面板组件。 */
        'main': {
            kind: 'keyed';
            scope: 'root';
            owner: Record<string, never>;
        };
        /** 侧边栏面板列表行：图标 + 标签入口。 */
        'sidebar.panellist': {
            kind: 'list';
            scope: 'root';
            owner: {
                size?: number;
            };
        };
    }
}
/**
 * 客户端插件体：设置页常驻注册 + 启用门控挂载侧边栏入口与主面板。
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
