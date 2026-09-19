/** Platform modules (react-dom / client) have no @types in this plugin. */
declare module 'react-dom' {
  import type { ReactNode } from 'react'
  export function flushSync(fn: () => void): void
  export function createPortal(children: ReactNode, container: Element | DocumentFragment): ReactNode
}

declare module 'react-dom/client' {
  import type { ReactNode } from 'react'
  export interface Root {
    render(children: ReactNode): void
    unmount(): void
  }
  export function createRoot(container: Element | DocumentFragment): Root
}
