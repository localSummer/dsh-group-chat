/**
 * ctx.shell 测试桩：对齐 ShellExecutor 契约（resolve 透传补默认、run 跑
 * 本地 bash、超时/中止由 spawn signal 承担）。供 tools-sandbox / service
 * 冒烟在脱离沙箱栈的情况下验证档位映射与输出格式化。
 */
import { spawn } from 'node:child_process'
import type { ShellExecRequest, ShellExecSpec } from '@deepseek-ai/dsh-shell'
import type { HostState } from '../src/host/state.ts'

export function fakeShell(): NonNullable<HostState['shell']> {
  return {
    resolve: (request: ShellExecRequest): ShellExecSpec => ({ ...request }) as ShellExecSpec,
    run: (spec: ShellExecSpec) => new Promise((resolve) => {
      const child = spawn('bash', ['-c', spec.command], { cwd: spec.workdir, signal: spec.signal })
      let out = ''
      let err = ''
      child.stdout?.on('data', (c: Buffer) => { out += c.toString('utf8') })
      child.stderr?.on('data', (c: Buffer) => { err += c.toString('utf8') })
      const settled = (exitCode: number | null): void => resolve({
        exitCode,
        signal: null,
        timedOut: false,
        aborted: spec.signal?.aborted === true,
        timeoutMs: spec.timeoutMs,
        stdout: { text: out, truncated: false },
        stderr: { text: err, truncated: false },
      })
      child.on('error', (e) => { err += String(e); settled(null) })
      child.on('close', settled)
    }),
  } as unknown as NonNullable<HostState['shell']>
}
