/**
 * 群工作区 @ 文件检索：空目录 / 禁根 / 模糊命中。
 */
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { createMaterials } from '../src/host/materials/materials.ts'
import type { GroupRecord } from '../src/core/types.ts'
import type { HostState } from '../src/host/state.ts'

function group(partial: Partial<GroupRecord> & { id: string }): GroupRecord {
  return {
    name: partial.name || partial.id,
    workspaceDir: partial.workspaceDir || '',
    permissionTier: 'view_only',
    roleIds: [],
    sessionIds: [],
    ...partial,
  }
}

function materialsFor(groups: GroupRecord[]) {
  const map = new Map(groups.map((g) => [g.id, g]))
  const fs = {
    resolve: async (p: string) => p,
    stat: async (p: string) => {
      const { stat } = await import('node:fs/promises')
      try {
        const info = await stat(p)
        return { type: info.isDirectory() ? 'directory' : 'file' }
      } catch {
        return undefined
      }
    },
    listDir: async () => [],
    readText: async () => '',
    processPath: (p: string) => p,
  }
  const core = {
    groups: map,
    fs,
    ctx: { workspaceRegistry: { list: async () => [] } },
  } as unknown as HostState
  return createMaterials(core)
}

describe('fileSearch', () => {
  const root = mkdtempSync(join(tmpdir(), 'dsgc-fs-'))
  mkdirSync(join(root, 'src'))
  writeFileSync(join(root, 'README.md'), '# hi')
  writeFileSync(join(root, 'src', 'composer.ts'), 'export {}')

  let mats = materialsFor([
    group({ id: 'empty', workspaceDir: '' }),
    group({ id: 'home', workspaceDir: '~' }),
    group({ id: 'slash', workspaceDir: '/' }),
    group({ id: 'ws', workspaceDir: root }),
  ])

  afterAll(() => { mats.disposeFileSearch() })

  it('未设置工作区返回明确空态', async () => {
    const res = await mats.fileSearch({ groupId: 'empty', query: 'readme' })
    expect(res.ok).toBe(false)
    expect(res.error).toBe('未设置群工作区，无法检索文件')
  })

  it('拒绝 ~ 与 / 作为检索根', async () => {
    expect((await mats.fileSearch({ groupId: 'home', query: 'a' })).error).toContain('~ 或 /')
    expect((await mats.fileSearch({ groupId: 'slash', query: 'a' })).error).toContain('~ 或 /')
  })

  it('群不存在时报错', async () => {
    const res = await mats.fileSearch({ groupId: 'nope', query: 'a' })
    expect(res.ok).toBe(false)
    expect(res.error).toBe('群组不存在')
  })

  it('模糊检索命中工作区内文件', async () => {
    const res = await mats.fileSearch({ groupId: 'ws', query: 'readme' })
    expect(res.ok).toBe(true)
    expect(res.candidates!.some((c) => c.path.toLowerCase().includes('readme'))).toBe(true)
  })
})
