import { describe, it, expect } from 'vitest'
import { activeAtToken, formatFileMention } from '../src/shared/file-mention-grammar'

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

describe('formatFileMention', () => {
  describe('plain file paths', () => {
    it('formats file without spaces', () => {
      expect(formatFileMention({ kind: 'file', path: 'src/foo.ts' }, false)).toBe(
        '@src/foo.ts',
      )
    })

    it('quotes file with spaces and closes quote', () => {
      expect(formatFileMention({ kind: 'file', path: 'my dir/foo.ts' }, false)).toBe(
        '@"my dir/foo.ts"',
      )
    })

    it('preserves quote when requested even without spaces', () => {
      expect(formatFileMention({ kind: 'file', path: 'src/foo.ts' }, true)).toBe(
        '@"src/foo.ts"',
      )
    })

    it('rejects path with control characters', () => {
      expect(formatFileMention({ kind: 'file', path: 'bad\u0000file' }, false)).toBeUndefined()
    })

    it('rejects path with embedded quotes', () => {
      expect(formatFileMention({ kind: 'file', path: 'bad"file.ts' }, false)).toBeUndefined()
    })

    it('handles .hidden files', () => {
      expect(formatFileMention({ kind: 'file', path: '.gitignore' }, false)).toBe(
        '@.gitignore',
      )
    })
  })

  describe('directory paths', () => {
    it('formats directory with trailing slash', () => {
      expect(formatFileMention({ kind: 'directory', path: 'src' }, false)).toBe('@src/')
    })

    it('quotes directory with spaces and keeps quote open', () => {
      expect(formatFileMention({ kind: 'directory', path: 'my dir' }, false)).toBe(
        '@"my dir/',
      )
    })

    it('preserves quote for directory without spaces (keeps open)', () => {
      expect(formatFileMention({ kind: 'directory', path: 'src' }, true)).toBe('@"src/')
    })

    it('rejects directory path with control characters', () => {
      expect(
        formatFileMention({ kind: 'directory', path: 'bad\u0001dir' }, false),
      ).toBeUndefined()
    })
  })

  describe('drill behavior', () => {
    it('directory with trailing slash and preserved quote stays open', () => {
      expect(formatFileMention({ kind: 'directory', path: 'docs' }, true)).toBe('@"docs/')
    })

    it('nested directory preserves quote for drilling', () => {
      expect(formatFileMention({ kind: 'directory', path: 'src/components' }, true)).toBe(
        '@"src/components/',
      )
    })
  })
})
