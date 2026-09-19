/** Platform modules (react-dom / client) have no @types in this plugin. */
declare module 'react-dom' {
  export function flushSync(fn: () => void): void
}

declare module 'react-dom/client' {
  import type { ReactNode } from 'react'
  export interface Root {
    render(children: ReactNode): void
    unmount(): void
  }
  export function createRoot(container: Element | DocumentFragment): Root
}
