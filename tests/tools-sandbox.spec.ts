/**
 * 工具沙箱边界（经 executeTool 公开面）：realpath 硬边界、分隔符比较
 * （/ws/foo 不得放行 /ws-evil）、软链越界、绝对路径注入、权限档位闸门。
 * run_command 经 ctx.shell 桩（tests/shell-stub.ts）验证档位映射与输出
 * 格式化；沙箱 policy 传递由 service 冒烟与运行时覆盖。
 */
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { READ_FILE_MAX_BYTES } from '../src/core/tools.ts'
import { createTools } from '../src/host/tools/tools.ts'
import type { GroupRecord, PermissionTier, RunState, ToolExecution } from '../src/core/types.ts'
import type { HostState } from '../src/host/state.ts'
import { fakeShell } from './shell-stub.ts'

/** createTools 只消费 core.run 与 core.shell；测试用最小容器。 */
function fakeCore(): HostState {
  const run: RunState = { running: false, sessionId: null, currentRoleId: null, partial: '', partialReasoning: '', stopping: false, queue: [], pendingConfirm: null, confirmSignal: null, commandAbort: null, finished: null, replaceMessageId: null }
  return { run, shell: fakeShell() } as unknown as HostState
}

function group(tier: PermissionTier): GroupRecord {
  return { id: 'g1', name: 'G', workspaceDir: '', permissionTier: tier, roleIds: [], sessionIds: [] }
}

let root = ''
let outsideDir = ''

beforeAll(() => {
  const tmp = mkdtempSync(join(tmpdir(), 'dsgc-sbx-'))
  root = join(tmp, 'ws')
  outsideDir = join(tmp, 'outside')
  mkdirSync(root)
  mkdirSync(outsideDir)
  writeFileSync(join(root, 'a.md'), 'hello')
  writeFileSync(join(outsideDir, 'secret.txt'), 'secret')
  // 前缀巧合：tmp/ws 与 tmp/ws-evil（无分隔符比较时 startsWith 会误放行）
  const evilDir = join(tmp, 'ws-evil')
  mkdirSync(evilDir)
  writeFileSync(join(evilDir, 'file.txt'), 'evil')
  // 软链越界：链在工作区内、目标在工作区外（realpath 解析后必须拒绝）
  symlinkSync(join(outsideDir, 'secret.txt'), join(root, 'link.md'))
})

async function exec(g: GroupRecord, name: string, args: Record<string, unknown>): Promise<ToolExecution> {
  const tools = createTools(fakeCore(), () => {})
  return tools.executeTool(g, root, { id: 'c1', name, args: JSON.stringify(args) })
}

describe('read_file / list_dir 沙箱边界', () => {
  it('工作区内文件可读', async () => {
    const res = await exec(group('workspace_write'), 'read_file', { path: 'a.md' })
    expect(res.status).toBe('ok')
    expect(res.output).toBe('hello')
  })

  it('../ 相对路径逃逸到工作区外被拒', async () => {
    const res = await exec(group('workspace_write'), 'read_file', { path: '../outside/secret.txt' })
    expect(res.status).toBe('error')
    expect(res.output).toContain('超出群组工作区范围')
  })

  it('前缀巧合目录（ws vs ws-evil）被分隔符比较拒绝', async () => {
    const res = await exec(group('workspace_write'), 'read_file', { path: '../ws-evil/file.txt' })
    expect(res.status).toBe('error')
    expect(res.output).toContain('超出群组工作区范围')
  })

  it('软链越界被 realpath 拒绝（链在内、目标在外）', async () => {
    const res = await exec(group('workspace_write'), 'read_file', { path: 'link.md' })
    expect(res.status).toBe('error')
    expect(res.output).toContain('超出群组工作区范围')
  })

  it('绝对路径直指工作区外文件被拒', async () => {
    const res = await exec(group('workspace_write'), 'read_file', { path: join(outsideDir, 'secret.txt') })
    expect(res.status).toBe('error')
    expect(res.output).toContain('超出群组工作区范围')
  })

  it('不存在的路径报错且不越界', async () => {
    const res = await exec(group('workspace_write'), 'read_file', { path: 'missing.md' })
    expect(res.status).toBe('error')
    expect(res.output).toContain('路径不存在')
  })

  it('超过 100KB 的文件被截断', async () => {
    const big = join(root, 'big.txt')
    writeFileSync(big, 'x'.repeat(READ_FILE_MAX_BYTES + 100))
    const res = await exec(group('workspace_write'), 'read_file', { path: 'big.txt' })
    expect(res.status).toBe('ok')
    expect(res.output.length).toBeLessThanOrEqual(READ_FILE_MAX_BYTES + 30)
    expect(res.output).toContain('已截断')
  })

  it('list_dir 列工作区内条目', async () => {
    const res = await exec(group('workspace_write'), 'list_dir', {})
    expect(res.status).toBe('ok')
    expect(res.output).toContain('a.md')
  })
})

describe('run_command 权限档位闸门', () => {
  it('view_only：schema 剔除 run_command，直接执行也被拒', async () => {
    const core = fakeCore()
    const tools = createTools(core, () => {})
    const g = group('view_only')
    g.workspaceDir = root
    expect(tools.buildToolSchemas(g).map((t) => t.name)).toEqual(['read_file', 'list_dir'])
    const res = await tools.executeTool(g, root, { id: 'c1', name: 'run_command', args: JSON.stringify({ command: 'echo hi' }) })
    expect(res.status).toBe('error')
    expect(res.output).toContain('仅可查看')
  })

  it('workspace_write：置 pendingConfirm 等待确认；唤醒拒绝 → denied', async () => {
    const core = fakeCore()
    const tools = createTools(core, () => {})
    const g = group('workspace_write')
    const pending = tools.executeTool(g, root, { id: 'cmd-1', name: 'run_command', args: JSON.stringify({ command: 'echo hi' }) })
    await new Promise((r) => setTimeout(r, 10))
    expect(core.run.pendingConfirm).toMatchObject({ toolCallId: 'cmd-1', tool: 'run_command' })
    expect((core.run.pendingConfirm!.args as { command?: string }).command).toBe('echo hi')
    tools.wakeConfirm()
    const res = await pending
    expect(res.status).toBe('denied')
    expect(res.output).toContain('用户拒绝')
  })

  it('full_access：免确认直接执行', async () => {
    const res = await exec(group('full_access'), 'run_command', { command: 'printf ok' })
    expect(res.status).toBe('ok')
    expect(res.output).toBe('ok')
  })

  it('未知工具报错', async () => {
    const res = await exec(group('full_access'), 'hack_tool', { path: 'a.md' })
    expect(res.status).toBe('error')
    expect(res.output).toContain('未知工具')
  })

  it('未设置工作区目录时无任何工具 schema', () => {
    const tools = createTools(fakeCore(), () => {})
    expect(tools.buildToolSchemas(group('full_access'))).toEqual([])
  })
})
