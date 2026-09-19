import { describe, it, expect } from 'vitest'
import { activeAtToken } from '../src/shared/file-mention-grammar'

describe('activeAtToken', () => {
  describe('plain @path tokens', () => {
    it('extracts @path at line start', () => {
      expect(activeAtToken('@src/foo.ts', 11)).toEqual({
        prefix: '@src/foo.ts',
        query: 'src/foo.ts',
        quoted: false,
      })
    })

    it('extracts @path after space', () => {
      expect(activeAtToken('请看 @src/foo.ts', 15)).toEqual({
        prefix: '@src/foo.ts',
        query: 'src/foo.ts',
        quoted: false,
      })
    })

    it('extracts partial @path', () => {
      expect(activeAtToken('请看 @src', 8)).toEqual({
        prefix: '@src',
        query: 'src',
        quoted: false,
      })
    })

    it('extracts bare @ as empty query', () => {
      expect(activeAtToken('请看 @', 4)).toEqual({
        prefix: '@',
        query: '',
        quoted: false,
      })
    })

    it('returns undefined when cursor not in @token', () => {
      expect(activeAtToken('请看 @src/foo.ts 这里', 15)).toBeUndefined()
    })

    it('ignores @ in email addresses', () => {
      expect(activeAtToken('email: foo@bar.com', 18)).toBeUndefined()
    })

    it('allows @path with dots', () => {
      expect(activeAtToken('@.hidden', 8)).toEqual({
        prefix: '@.hidden',
        query: '.hidden',
        quoted: false,
      })
    })
  })

  describe('quoted @"path with spaces" tokens', () => {
    it('extracts quoted path', () => {
      expect(activeAtToken('@"my dir/file.ts', 16)).toEqual({
        prefix: '@"my dir/file.ts',
        query: 'my dir/file.ts',
        quoted: true,
      })
    })

    it('extracts bare @" as empty quoted query', () => {
      expect(activeAtToken('@"', 2)).toEqual({
        prefix: '@"',
        query: '',
        quoted: true,
      })
    })

    it('extracts @" with trailing space as non-empty query', () => {
      expect(activeAtToken('@" ', 3)).toEqual({
        prefix: '@" ',
        query: ' ',
        quoted: true,
      })
    })

    it('extracts quoted path after text', () => {
      expect(activeAtToken('请看 @"my dir', 12)).toEqual({
        prefix: '@"my dir',
        query: 'my dir',
        quoted: true,
      })
    })

    it('does not close quote until user types it', () => {
      expect(activeAtToken('@"src/', 6)).toEqual({
        prefix: '@"src/',
        query: 'src/',
        quoted: true,
      })
    })
  })

  describe('cursor position edge cases', () => {
    it('returns undefined when cursor before @', () => {
      expect(activeAtToken('foo @bar', 3)).toBeUndefined()
    })

    it('handles cursor at start of line with @', () => {
      expect(activeAtToken('@', 1)).toEqual({
        prefix: '@',
        query: '',
        quoted: false,
      })
    })

    it('handles multi-byte characters', () => {
      expect(activeAtToken('你好 @文件', 7)).toEqual({
        prefix: '@文件',
        query: '文件',
        quoted: false,
      })
    })
  })
})
