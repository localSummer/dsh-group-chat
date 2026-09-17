/**
 * Wrap a cordis plugin apply so the package runs at most once per process.
 * The first mount registers normally and unmarks when its fiber disposes;
 * any later mount of the same package name is a no-op.
 * @param packageName - npm package identity shared by every install source.
 * @param fn - the original plugin apply.
 * @returns an apply of the same shape.
 */
export declare function mountOnce<T extends (...args: any[]) => unknown>(packageName: string, fn: T): T;
