/**
 * 资料读取与路径解析：群组工作区目录 → 注入文件清单 + 目录浏览器。
 * 路径解析顺序：~ 展开到 home；绝对路径直用；相对路径先试各工作区根，
 * 再试 dsh web 进程 cwd。目录浏览器与资料读取共用同一套解析。
 * @module dsh-group-chat/host/materials
 */

import { homedir } from 'node:os'
import { dirname, isAbsolute, join } from 'node:path'
import type { BrowseResult, GroupRecord } from '../../core/types.ts'
import type { HostState } from '../state.ts'

// 群组工作区目录 → 注入文件清单：目录内文本文件（白名单扩展名、跳过隐藏项，
// 最多 20 个），单文件 16k、总量 48k 截断由 materialBlock 执行。
const TEXT_EXTS = new Set(['.md', '.markdown', '.txt', '.json', '.yml', '.yaml', '.csv', '.tsv', '.toml', '.ini', '.conf', '.env', '.properties', '.log', '.xml', '.html', '.css', '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.c', '.h', '.cpp', '.sql', '.sh'])
const MAX_WS_FILES = 20

/** 资料面。 */
export interface Materials {
  /** 群组工作区目录 → 注入文件清单（dir 为解析后的展示路径）。 */
  loadWorkspaceFiles: (g: GroupRecord) => Promise<{ dir: string, parts: { name: string, content: string, error?: string }[] }>
  /** 文件清单 → system 提示词内的「共享资料」块（单文件 16k / 总量 48k 截断）。 */
  materialBlock: (parts: { name: string, content: string, error?: string }[], dir: string) => string
  /** 目录浏览：返回文件+目录条目（绝对路径由 Host 解析，客户端不拼路径）。 */
  browse: (args: { path?: string } | undefined) => Promise<BrowseResult>
}

/** 创建资料面。 */
export function createMaterials(core: HostState): Materials {
  const { ctx, fs } = core
  const HOME = homedir()
  let workspacePathsCache = { at: 0, paths: [] as string[] }
  const workspacePaths = async (): Promise<string[]> => {
    const now = Date.now()
    if (now - workspacePathsCache.at < 5000) return workspacePathsCache.paths
    try {
      const list = await ctx.workspaceRegistry.list()
      workspacePathsCache = { at: now, paths: list.map((w) => w.path).filter(Boolean) }
    } catch {
      workspacePathsCache = { at: now, paths: workspacePathsCache.paths }
    }
    return workspacePathsCache.paths
  }

  const candidatePaths = async (raw: unknown): Promise<string[]> => {
    const p = String(raw || '').trim()
    if (p === '' || p === '~') return [HOME]
    if (p.startsWith('~/')) return [join(HOME, p.slice(2))]
    if (isAbsolute(p)) return [p]
    const roots = [...(await workspacePaths()), process.cwd()]
    return roots.map((root) => join(root, p))
  }

  /** 逐候选 stat，返回第一个存在的目标；都不存在时返回首候选与全部尝试。 */
  const resolveMaterialTarget = async (raw: unknown) => {
    const candidates = await candidatePaths(raw)
    let first: { target: import('@deepseek-ai/dsh-fs').FsTarget, path: string } | undefined
    for (const c of candidates) {
      const target = await fs.resolve(c)
      if (first === undefined) first = { target, path: c }
      const info = await fs.stat(target)
      if (info !== undefined) return { target, path: c, info, tried: candidates }
    }
    return { target: first!.target, path: first!.path, info: undefined, tried: candidates }
  }

  const loadWorkspaceFiles = async (g: GroupRecord) => {
    if (!g.workspaceDir) return { dir: '', parts: [] as { name: string, content: string, error?: string }[] }
    const res = await resolveMaterialTarget(g.workspaceDir)
    if (res.info === undefined) throw new Error('工作区目录不存在（尝试过：' + res.tried.join('；') + '）')
    if (res.info.type !== 'directory') throw new Error('工作区目录不是目录：' + res.path)
    const entries = await fs.listDir(res.target)
    const parts: { name: string, content: string, error?: string }[] = []
    for (const e of entries) {
      if (parts.length >= MAX_WS_FILES) break
      if (e.type !== 'file' || e.name.startsWith('.')) continue
      const dot = e.name.lastIndexOf('.')
      const ext = dot === -1 ? '' : e.name.slice(dot).toLowerCase()
      if (!TEXT_EXTS.has(ext)) continue
      try {
        const text = await fs.readText(e.target)
        parts.push({ name: e.name, content: text })
      } catch (err) {
        parts.push({ name: e.name, content: '', error: String((err && (err as Error).message) || err) })
      }
    }
    return { dir: res.path, parts }
  }

  const materialBlock = (parts: { name: string, content: string, error?: string }[], dir: string): string => {
    if (!parts.length) return ''
    let total = 0
    const lines: string[] = []
    for (const p of parts) {
      if (p.error) {
        lines.push('### ' + p.name + '\n[读取失败] ' + p.error)
        continue
      }
      let c = p.content || ''
      if (c.length > 16000) c = c.slice(0, 16000) + '\n…(已截断)'
      if (total + c.length > 48000) c = c.slice(0, Math.max(0, 48000 - total)) + '\n…(总量超限截断)'
      total += c.length
      lines.push('### ' + p.name + '\n' + c)
    }
    return '\n# 共享资料（来自群组工作区目录' + (dir ? ' ' + dir : '') + '，群内所有成员可见）\n' + lines.join('\n\n')
  }

  const browse = async (args: { path?: string } | undefined): Promise<BrowseResult> => {
    try {
      const raw = String((args && args.path) || '').trim()
      const res = await resolveMaterialTarget(raw === '' ? HOME : raw)
      if (res.info === undefined) return { ok: false, error: '路径不存在，尝试过：' + res.tried.join('；') }
      let dirPath = res.path
      let target = res.target
      if (res.info.type !== 'directory') {
        dirPath = dirname(dirPath)
        target = await fs.resolve(dirPath)
      }
      const entries = await fs.listDir(target)
      const sorted = [...entries].sort((a, b) => (a.type === 'directory' ? 0 : 1) - (b.type === 'directory' ? 0 : 1) || a.name.localeCompare(b.name))
      return {
        ok: true,
        path: dirPath,
        home: HOME,
        parent: dirname(dirPath),
        entries: sorted.map((e) => ({ name: e.name, type: e.type, path: fs.processPath(e.target), size: e.size, hidden: e.name.startsWith('.') })),
      }
    } catch (e) {
      return { ok: false, error: String((e && (e as Error).message) || e) }
    }
  }

  return { loadWorkspaceFiles, materialBlock, browse }
}
