/**
 * 工具执行（TOOLS.md §2：沙箱 / §3：确认闸门）：read_file / list_dir /
 * run_command 三件套；realpath 硬边界 + 分隔符比较；run_command 按群组
 * 权限档位走逐条确认或直接执行。
 * @module dsh-group-chat/host/tools
 */

import { spawn, type ChildProcess } from 'node:child_process'
import { closeSync, openSync, readSync, readdirSync, realpathSync, statSync } from 'node:fs'
import { isAbsolute, join, sep } from 'node:path'
import { CMD_CAPTURE_MAX_BYTES, CMD_OUTPUT_MAX_CHARS, READ_FILE_MAX_BYTES, RUN_CMD_TIMEOUT_MS, TOOL_SCHEMAS } from '../../core/tools.ts'
import type { GroupRecord, PendingConfirm, ToolExecution } from '../../core/types.ts'
import type { HostState } from '../state.ts'

/** 工具面。 */
export interface Tools {
  /** 执行一次工具调用（args 解析 + 分发 + 计时；确认闸门在 run_command 内）。 */
  executeTool: (g: GroupRecord, root: string, tc: { id: string, name: string, args: string }) => Promise<ToolExecution>
  /** 工具 schema（view_only 档剔除 run_command）。 */
  buildToolSchemas: (g: GroupRecord) => (typeof TOOL_SCHEMAS)[number][]
  /** 置 pendingConfirm 后无限等待，confirmCommand/stop/dispose 唤醒。 */
  requestConfirmation: (toolCallId: string, args: Record<string, unknown>) => Promise<boolean>
  /** 唤醒确认等待（以拒绝放行；置空 pendingConfirm）。 */
  wakeConfirm: () => void
  /** kill 正在执行的命令子进程。 */
  killChild: () => void
}

/** 创建工具面。 */
export function createTools(core: HostState, touch: () => void): Tools {
  const { run } = core

  /** realpath 硬边界：目标必须在群组工作区内（带分隔符比较，防 /ws/foo 放行 /ws/foobar）。 */
  const resolveInWorkspace = (root: string, rawPath: unknown): { ok: true, target: string } | { ok: false, error: string } => {
    const p = rawPath === undefined || rawPath === null || String(rawPath).trim() === '' ? '.' : String(rawPath)
    let target: string
    try {
      target = realpathSync(isAbsolute(p) ? p : join(root, p))
    } catch {
      return { ok: false, error: '路径不存在：' + p }
    }
    if (target !== root && !target.startsWith(root + sep)) {
      return { ok: false, error: '路径超出群组工作区范围：' + p }
    }
    return { ok: true, target }
  }

  const toolReadFile = (root: string, args: Record<string, unknown>): { status: 'ok' | 'error', output: string } => {
    const r = resolveInWorkspace(root, args.path)
    if (!r.ok) return { status: 'error', output: r.error }
    let fd: number | undefined
    try {
      const st = statSync(r.target)
      if (!st.isFile()) return { status: 'error', output: '不是文件：' + String(args.path) }
      fd = openSync(r.target, 'r')
      const buf = Buffer.alloc(READ_FILE_MAX_BYTES + 1)
      const n = readSync(fd, buf, 0, buf.length, 0)
      let text = buf.subarray(0, Math.min(n, READ_FILE_MAX_BYTES)).toString('utf8')
      if (n > READ_FILE_MAX_BYTES) text += '\n…(文件超过 100KB，已截断)'
      return { status: 'ok', output: text || '（空文件）' }
    } catch (e) {
      return { status: 'error', output: '读取失败：' + String((e && (e as Error).message) || e) }
    } finally {
      if (fd !== undefined) {
        try {
          closeSync(fd)
        } catch {}
      }
    }
  }

  const toolListDir = (root: string, args: Record<string, unknown>): { status: 'ok' | 'error', output: string } => {
    const r = resolveInWorkspace(root, args.path)
    if (!r.ok) return { status: 'error', output: r.error }
    try {
      const st = statSync(r.target)
      if (!st.isDirectory()) return { status: 'error', output: '不是目录：' + String(args.path) }
      const entries = readdirSync(r.target, { withFileTypes: true }).sort((a, b) => (a.isDirectory() ? 0 : 1) - (b.isDirectory() ? 0 : 1) || a.name.localeCompare(b.name))
      const lines = entries.slice(0, 500).map((e) => {
        if (e.isDirectory()) return e.name + '/'
        try {
          return e.name + ' (' + statSync(join(r.target, e.name)).size + ' B)'
        } catch {
          return e.name
        }
      })
      if (entries.length > 500) lines.push('…(共 ' + entries.length + ' 项，仅显示前 500)')
      const out = lines.join('\n') || '（空目录）'
      return { status: 'ok', output: out.length > CMD_OUTPUT_MAX_CHARS ? out.slice(0, CMD_OUTPUT_MAX_CHARS) + '\n…(已截断)' : out }
    } catch (e) {
      return { status: 'error', output: '列出失败：' + String((e && (e as Error).message) || e) }
    }
  }

  const runCommandTool = (root: string, command: string): Promise<{ status: 'ok' | 'error', output: string }> => new Promise((resolve) => {
    let child: ChildProcess
    try {
      child = spawn('bash', ['-c', command], { cwd: root })
    } catch (e) {
      resolve({ status: 'error', output: '无法启动命令：' + String((e && (e as Error).message) || e) })
      return
    }
    run.childProc = child
    let out = ''
    let dropped = 0
    let timedOut = false
    const onChunk = (chunk: Buffer) => {
      if (out.length < CMD_CAPTURE_MAX_BYTES) out += chunk.toString('utf8')
      else dropped += chunk.length
    }
    child.stdout?.on('data', onChunk)
    child.stderr?.on('data', onChunk)
    const timer = setTimeout(() => {
      timedOut = true
      try {
        child.kill('SIGKILL')
      } catch {}
    }, RUN_CMD_TIMEOUT_MS)
    const finish = (result: { status: 'ok' | 'error', output: string }) => {
      clearTimeout(timer)
      if (run.childProc === child) run.childProc = null
      resolve(result)
    }
    child.on('error', (e) => finish({ status: 'error', output: '执行失败：' + String((e && e.message) || e) }))
    child.on('close', (code) => {
      let text = out.length > CMD_CAPTURE_MAX_BYTES ? out.slice(0, CMD_CAPTURE_MAX_BYTES) : out
      if (dropped > 0) text += '\n[输出采集超限，已丢弃 ' + dropped + ' 字节]'
      if (timedOut) text += '\n[执行超时（' + Math.round(RUN_CMD_TIMEOUT_MS / 1000) + 's），已强制终止]'
      if (code !== 0 && code !== null && !timedOut) text += '\n[退出码 ' + code + ']'
      if (text.length > CMD_OUTPUT_MAX_CHARS) text = text.slice(0, CMD_OUTPUT_MAX_CHARS) + '\n…(输出超长，已截断)'
      finish({ status: code === 0 ? 'ok' : 'error', output: text || '（无输出）' })
    })
  })

  /** run_command 确认闸门：置 pendingConfirm 后无限等待，confirmCommand/stop/dispose 唤醒。 */
  const requestConfirmation = (toolCallId: string, args: Record<string, unknown>): Promise<boolean> => new Promise((resolve) => {
    run.pendingConfirm = { toolCallId, tool: 'run_command', args: args as PendingConfirm['args'] }
    run.confirmSignal = { resolve }
    touch()
  })

  const wakeConfirm = (): void => {
    const signal = run.confirmSignal
    run.pendingConfirm = null
    run.confirmSignal = null
    if (signal) {
      try {
        signal.resolve(false)
      } catch {}
    }
  }

  const killChild = (): void => {
    if (run.childProc) {
      try {
        run.childProc.kill('SIGKILL')
      } catch {}
    }
  }

  const executeTool = async (g: GroupRecord, root: string, tc: { id: string, name: string, args: string }): Promise<ToolExecution> => {
    let args: Record<string, unknown> = {}
    try {
      const parsed = JSON.parse(tc.args)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) args = parsed as Record<string, unknown>
    } catch {}
    const started = Date.now()
    let res: { status: 'ok' | 'error' | 'denied', output: string }
    if (tc.name === 'read_file') res = toolReadFile(root, args)
    else if (tc.name === 'list_dir') res = toolListDir(root, args)
    else if (tc.name === 'run_command') {
      if (g.permissionTier === 'view_only') {
        res = { status: 'error', output: '群组权限为「仅可查看」，该命令未被运行' }
      } else if (g.permissionTier === 'workspace_write') {
        const allowed = await requestConfirmation(tc.id, args)
        if (run.stopping) res = { status: 'error', output: '对话已被用户停止，命令未执行' }
        else if (!allowed) res = { status: 'denied', output: '用户拒绝了这次命令执行' }
        else res = await runCommandTool(root, String(args.command || ''))
      } else {
        res = await runCommandTool(root, String(args.command || ''))
      }
    } else {
      res = { status: 'error', output: '未知工具：' + tc.name }
    }
    return { status: res.status, output: res.output, args, durationMs: Date.now() - started }
  }

  const buildToolSchemas = (g: GroupRecord) => {
    if (!g.workspaceDir) return []
    return TOOL_SCHEMAS.filter((t) => t.name !== 'run_command' || g.permissionTier !== 'view_only')
  }

  return { executeTool, buildToolSchemas, requestConfirmation, wakeConfirm, killChild }
}
