/**
 * @file Tests for vendored @file token grammar.
 * @vitest-environment node
 */

import { describe, expect, it } from 'vitest'
import { activeAtToken, formatFileMention } from './file-mention-grammar.ts'

describe('activeAtToken', () => {
  it('extracts plain @path at cursor', () => {
    expect(activeAtToken('@fil', 4)).toEqual({ prefix: '@fil', query: 'fil', quoted: false })
    expect(activeAtToken('@src/', 5)).toEqual({ prefix: '@src/', query: 'src/', quoted: false })
    expect(activeAtToken('text @lib/index.ts', 18)).toEqual({ prefix: '@lib/index.ts', query: 'lib/index.ts', quoted: false })
  })

  it('extracts quoted @"path with spaces at cursor', () => {
    expect(activeAtToken('@"My Documents', 14)).toEqual({ prefix: '@"My Documents', query: 'My Documents', quoted: true })
    expect(activeAtToken('open @"src/my file.ts', 22)).toEqual({ prefix: '@"src/my file.ts', query: 'src/my file.ts', quoted: true })
  })

  it('returns undefined when @ is not at word boundary', () => {
    expect(activeAtToken('user@example.com', 16)).toBeUndefined()
    expect(activeAtToken('no@@', 4)).toBeUndefined()
  })

  it('returns undefined when cursor is not inside @token', () => {
    expect(activeAtToken('@file extra', 11)).toBeUndefined()
    expect(activeAtToken('before @file', 6)).toBeUndefined()
  })

  it('handles @ at line start', () => {
    expect(activeAtToken('@', 1)).toEqual({ prefix: '@', query: '', quoted: false })
    expect(activeAtToken('@"', 2)).toEqual({ prefix: '@"', query: '', quoted: true })
  })

  it('handles @ after whitespace', () => {
    expect(activeAtToken('  @qu', 5)).toEqual({ prefix: '@qu', query: 'qu', quoted: false })
    expect(activeAtToken('\t@"test', 7)).toEqual({ prefix: '@"test', query: 'test', quoted: true })
  })
})

describe('formatFileMention', () => {
  it('formats plain file without whitespace', () => {
    expect(formatFileMention({ kind: 'file', path: 'README.md' }, false)).toBe('@README.md')
    expect(formatFileMention({ kind: 'file', path: 'src/index.ts' }, false)).toBe('@src/index.ts')
  })

  it('formats plain directory with trailing slash', () => {
    expect(formatFileMention({ kind: 'directory', path: 'src' }, false)).toBe('@src/')
    expect(formatFileMention({ kind: 'directory', path: 'lib/utils' }, false)).toBe('@lib/utils/')
  })

  it('quotes file with whitespace and closes quote', () => {
    expect(formatFileMention({ kind: 'file', path: 'My Document.txt' }, false)).toBe('@"My Document.txt"')
    expect(formatFileMention({ kind: 'file', path: 'src/my file.ts' }, false)).toBe('@"src/my file.ts"')
  })

  it('quotes directory with whitespace but keeps quote open', () => {
    expect(formatFileMention({ kind: 'directory', path: 'My Folder' }, false)).toBe('@"My Folder/')
    expect(formatFileMention({ kind: 'directory', path: 'src/my lib' }, false)).toBe('@"src/my lib/')
  })

  it('preserves quote even when unnecessary', () => {
    expect(formatFileMention({ kind: 'file', path: 'plain.txt' }, true)).toBe('@"plain.txt"')
    expect(formatFileMention({ kind: 'directory', path: 'lib' }, true)).toBe('@"lib/')
  })

  it('rejects paths with control characters', () => {
    expect(formatFileMention({ kind: 'file', path: 'file\x00.txt' }, false)).toBeUndefined()
    expect(formatFileMention({ kind: 'file', path: 'file\n.txt' }, false)).toBeUndefined()
  })

  it('rejects paths with embedded quotes', () => {
    expect(formatFileMention({ kind: 'file', path: 'file"name.txt' }, false)).toBeUndefined()
    expect(formatFileMention({ kind: 'directory', path: 'dir"name' }, false)).toBeUndefined()
  })
})
