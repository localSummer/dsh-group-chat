/**
 * @file Tests for vendored @file token grammar.
 * @vitest-environment node
 */

import { describe, expect, it } from 'vitest'
import { activeAtToken } from './file-mention-grammar.ts'

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
