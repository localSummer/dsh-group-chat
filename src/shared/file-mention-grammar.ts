/**
 * Vendored @file token grammar from dsh-file-reference (browser-safe, zero Node API).
 *
 * Sourced from @deepseek-ai/dsh-file-reference/lib/types/grammar.js
 * Cannot import directly due to client bundle purity gate (dsh-client-bundle-purity).
 *
 * 只保留输入侧的 @token 识别（activeAtToken）；候选的文本化（formatFileMention）
 * 未被本插件采用——目录钻入走「插入整颗芯片」语义，见 docs/DESIGN.md Composer 契约。
 *
 * @module dsh-group-chat/shared
 */

export interface AtToken {
  /** Full matched prefix including @ and optional quotes */
  prefix: string
  /** Query fragment after @ (unquoted content) */
  query: string
  /** Whether the token uses quoted form @"..." */
  quoted: boolean
}

/**
 * Extract active @token at cursor position.
 * Matches @ at word boundary (line start or after whitespace).
 *
 * @param line - Current line text
 * @param cursor - Cursor offset in line
 * @returns Token or undefined if no active @token at cursor
 */
export function activeAtToken(line: string, cursor: number): AtToken | undefined {
  const before = line.slice(0, cursor)

  // Try quoted @"... first (more specific)
  const quotedMatch = /(?:^|\s)@"([^"]*)$/.exec(before)
  if (quotedMatch) {
    const prefix = quotedMatch[0].trimStart()
    return {
      prefix,
      query: quotedMatch[1],
      quoted: true,
    }
  }

  // Then try plain @...
  const plainMatch = /(?:^|\s)@([^\s@]*)$/.exec(before)
  if (plainMatch) {
    const prefix = plainMatch[0].trimStart()
    return {
      prefix,
      query: plainMatch[1],
      quoted: false,
    }
  }

  return undefined
}
