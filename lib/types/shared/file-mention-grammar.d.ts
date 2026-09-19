/**
 * Vendored @file token grammar from dsh-file-reference (browser-safe, zero Node API).
 *
 * Sourced from @deepseek-ai/dsh-file-reference/lib/types/grammar.js
 * Cannot import directly due to client bundle purity gate (dsh-client-bundle-purity).
 *
 * @module dsh-group-chat/shared
 */
export interface AtToken {
    /** Full matched prefix including @ and optional quotes */
    prefix: string;
    /** Query fragment after @ (unquoted content) */
    query: string;
    /** Whether the token uses quoted form @"..." */
    quoted: boolean;
}
export interface FileCandidate {
    kind: 'file' | 'directory';
    path: string;
}
/**
 * Extract active @token at cursor position.
 * Matches @ at word boundary (line start or after whitespace).
 *
 * @param line - Current line text
 * @param cursor - Cursor offset in line
 * @returns Token or undefined if no active @token at cursor
 */
export declare function activeAtToken(line: string, cursor: number): AtToken | undefined;
/**
 * Format file/directory candidate as @mention text.
 *
 * @param candidate - File or directory to format
 * @param preserveQuote - Keep quotes even when unnecessary (for drill-down continuity)
 * @returns Formatted @path or undefined for invalid paths
 */
export declare function formatFileMention(candidate: FileCandidate, preserveQuote: boolean): string | undefined;
