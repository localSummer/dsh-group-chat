/**
 * 浏览器半样式：CSS 以内联字符串承载（刻意不迁移 CSS Modules 管线——
 * 类名需保持原样，侧栏入口的 “newSession” 类名是任务看板等 DOM 注入式
 * 面板识别“侧边栏导航点击”的跨插件标记，哈希化会破坏该约定）。
 * 工厂执行时幂等注入 <style>，loader 卸载时按 data-plugin 摘除标签。
 * @module dsh-group-chat/client/styles
 */
export declare const CSS: string;
/** 工厂执行时幂等注入样式标签（loader 卸载时按 data-plugin 摘除）。 */
export declare function injectStyles(): void;
