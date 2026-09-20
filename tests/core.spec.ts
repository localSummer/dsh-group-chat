/**
 * core 纯逻辑冒烟测试：JSON 序列化契约、参数安全化与会话状态派生。
 */
import { describe, expect, it } from 'vitest'
import { classifySpeakFailure, formatSpeakFailureCopy, isSpeakFailure, parseLegacyRoleFailure, repairFailedMessage, resolveFailedRole, unwrapSpeakFailure } from '../src/core/errors.ts'
import { messageJson, roleJson } from '../src/core/json.ts'
import { asEffort, asNumber, asPermissionTier, migrateTier, PERMISSION_TIERS } from '../src/core/types.ts'
import { TOOL_SCHEMAS } from '../src/core/tools.ts'
import { SESS_STATUS_LABEL, sessStatus } from '../src/core/status.ts'

describe('messageJson', () => {
  it('必填字段齐全且可选字段缺省时省略', () => {
    const o = messageJson({ id: 'm1', speaker: 'user', text: 'hi', seq: 3, ts: 1000 })
    expect(o).toEqual({ id: 'm1', speaker: 'user', text: 'hi', seq: 3, ts: 1000 })
    expect('reasoning' in o!).toBe(false)
    expect('toolCalls' in o!).toBe(false)
  })

  it('可选字段存在时写入；ts/seq 缺省时兜底', () => {
    const o = messageJson({ id: 'm2', speaker: 'role-1', text: '', model: 'p / m', reasoning: 'r', toolCalls: [{ tool: 'read_file', args: {}, status: 'ok', output: 'x' }] })
    expect(o!.model).toBe('p / m')
    expect(o!.reasoning).toBe('r')
    expect(o!.toolCalls).toHaveLength(1)
    expect(typeof o!.ts).toBe('number')
    expect(o!.seq).toBe(0)
  })

  it('无 id 返回 null', () => {
    expect(messageJson({ speaker: 'user', text: 'x' })).toBeNull()
    expect(messageJson(undefined)).toBeNull()
  })

  it('error / failedRoleId 有则写入，空串省略', () => {
    const o = messageJson({ id: 'm3', speaker: 'role-1', text: 'raw', error: true, failedRoleId: 'role-1', seq: 1, ts: 1 })
    expect(o!.error).toBe(true)
    expect(o!.failedRoleId).toBe('role-1')
    const o2 = messageJson({ id: 'm4', speaker: 'role-1', text: 'x', failedRoleId: '', seq: 1, ts: 1 })
    expect('failedRoleId' in o2!).toBe(false)
  })
})

const quota = '角色「产品经理」发言失败：模型输出异常终止: 429: {"code":"AccountQuotaExceeded","message":"You have exceeded the weekly usage quota. It will reset at 2026-09-21 00:00:00 +0800 CST.","type":"TooManyRequests"}'

describe('classifySpeakFailure', () => {

  it('配额 429 压成人话标题 + 重置时间', () => {
    const v = classifySpeakFailure(quota)
    expect(v.title).toBe('额度已用尽')
    expect(v.detail).toContain('2026-09-21')
    expect(v.raw).toContain('AccountQuotaExceeded')
    expect(v.raw.startsWith('模型输出异常终止')).toBe(false)
  })

  it('unwrap 剥引擎前缀', () => {
    expect(unwrapSpeakFailure('模型输出异常终止: boom')).toBe('boom')
    expect(unwrapSpeakFailure('网络断开')).toBe('网络断开')
  })

  it('复制文案含标题与原文', () => {
    const text = formatSpeakFailureCopy(classifySpeakFailure(quota))
    expect(text).toContain('额度已用尽')
    expect(text).toContain('AccountQuotaExceeded')
  })

  it('未知错误回退为发言失败', () => {
    const v = classifySpeakFailure('something went sideways')
    expect(v.title).toBe('发言失败')
    expect(v.raw).toBe('something went sideways')
  })

  it('unwrap 剥旧系统胶囊前缀', () => {
    expect(unwrapSpeakFailure(quota)).toContain('AccountQuotaExceeded')
    expect(unwrapSpeakFailure(quota).startsWith('角色「')).toBe(false)
  })
})

describe('repairFailedMessage', () => {
  const roles = [{ id: 'role-pm', name: '产品经理', provider: 'p', model: 'm' }]

  it('系统胶囊按角色名迁到该角色并剥前缀', () => {
    const m = { speaker: 'system', text: quota, error: true as boolean | undefined, failedRoleId: undefined as string | undefined, model: undefined as string | undefined }
    expect(parseLegacyRoleFailure(m.text)?.roleName).toBe('产品经理')
    expect(isSpeakFailure(m)).toBe(true)
    expect(repairFailedMessage(m, roles)).toBe(true)
    expect(m.speaker).toBe('role-pm')
    expect(m.failedRoleId).toBe('role-pm')
    expect(m.text.startsWith('角色「')).toBe(false)
    expect(m.text).toContain('AccountQuotaExceeded')
    expect(m.model).toBe('p / m')
    expect(resolveFailedRole(m, roles)?.id).toBe('role-pm')
  })

  it('无 error 标记但文案是旧胶囊，客户端仍能解析角色', () => {
    const m = { speaker: 'system', text: quota }
    expect(isSpeakFailure(m)).toBe(true)
    expect(resolveFailedRole(m, roles)?.id).toBe('role-pm')
  })

  it('重名则不迁', () => {
    const m = { speaker: 'system', text: quota, error: true as boolean | undefined, failedRoleId: undefined as string | undefined, model: undefined as string | undefined }
    expect(repairFailedMessage(m, [roles[0], { id: 'role-pm-2', name: '产品经理' }])).toBe(false)
    expect(m.speaker).toBe('system')
    expect(resolveFailedRole(m, [roles[0], { id: 'role-pm-2', name: '产品经理' }])).toBeNull()
  })
})

describe('roleJson', () => {
  it('默认值兜底：名称/人设/provider/model 空串安全化', () => {
    const o = roleJson({ id: 'r1' })
    expect(o).toEqual({ id: 'r1', name: '成员', persona: '', provider: '', model: '', enabled: true, thinking: false })
  })

  it('color/temperature/reasoningEffort 仅在有效时写入', () => {
    const o = roleJson({ id: 'r2', name: 'A', color: '#fff', temperature: 0.7, reasoningEffort: 'high' })
    expect(o.color).toBe('#fff')
    expect(o.temperature).toBe(0.7)
    expect(o.reasoningEffort).toBe('high')
    const o2 = roleJson({ id: 'r3', reasoningEffort: 'default', temperature: Number.NaN })
    expect('reasoningEffort' in o2).toBe(false)
    expect('temperature' in o2).toBe(false)
  })
})

describe('参数安全化', () => {
  it('asNumber：数字原样、NaN/其它类型 undefined', () => {
    expect(asNumber(0.7)).toBe(0.7)
    expect(asNumber(Number.NaN)).toBeUndefined()
    expect(asNumber('0.7')).toBeUndefined()
  })

  it('asEffort：非 default 的非空字符串原样，其余 undefined', () => {
    expect(asEffort('high')).toBe('high')
    expect(asEffort('default')).toBeUndefined()
    expect(asEffort('')).toBeUndefined()
    expect(asEffort(1)).toBeUndefined()
  })
})

describe('工具 schema', () => {
  it('三个工具齐备且 run_command 需要 command 参数', () => {
    expect(TOOL_SCHEMAS.map((t) => t.name)).toEqual(['read_file', 'list_dir', 'run_command'])
    expect(TOOL_SCHEMAS[2].parameters.required).toContain('command')
  })
})

describe('权限档位', () => {
  it('asPermissionTier：三档合法值原样，其余 undefined', () => {
    for (const tier of PERMISSION_TIERS) expect(asPermissionTier(tier)).toBe(tier)
    expect(asPermissionTier('full')).toBeUndefined()
    expect(asPermissionTier('')).toBeUndefined()
    expect(asPermissionTier(1)).toBeUndefined()
    expect(asPermissionTier(undefined)).toBeUndefined()
  })

  it('migrateTier：显式 permissionTier 优先；缺失时按 v2 布尔迁移（true→工作区内修改，false/无→仅可查看）', () => {
    expect(migrateTier('full_access', true)).toBe('full_access')
    expect(migrateTier('view_only', true)).toBe('view_only')
    expect(migrateTier(undefined, true)).toBe('workspace_write')
    expect(migrateTier(undefined, false)).toBe('view_only')
    expect(migrateTier(undefined, undefined)).toBe('view_only')
    expect(migrateTier('bogus', true)).toBe('workspace_write')
    expect(migrateTier('bogus', undefined)).toBe('view_only')
  })
})

describe('会话状态派生（sessStatus）', () => {
  /** run 视图的最小构造（sessStatus 只读 running/sessionId/pendingConfirm/finished）。 */
  const run = (o: Partial<import('../src/core/types.ts').Snapshot['run']>): import('../src/core/types.ts').Snapshot['run'] => ({
    running: false, sessionId: null, currentRoleId: null, partial: '', partialReasoning: '', queue: [], queueIndex: 0, pendingConfirm: null, finished: null, replaceMessageId: null, ...o,
  })

  it('优先级：等待确认 > 进行中 > 已完成/已出错 > 默认无点', () => {
    // run 会话：确认闸门挂起 → warning；否则 → ongoing
    expect(sessStatus(run({ running: true, sessionId: 's1', pendingConfirm: { toolCallId: 'c1', tool: 'run_command', args: { command: 'x' } } }), 's1')).toBe('warning')
    expect(sessStatus(run({ running: true, sessionId: 's1' }), 's1')).toBe('ongoing')
    // 结束标记：ok → done，error → error
    expect(sessStatus(run({ finished: { sessionId: 's1', reason: 'ok' } }), 's1')).toBe('done')
    expect(sessStatus(run({ finished: { sessionId: 's1', reason: 'error' } }), 's1')).toBe('error')
    // 无任何活动 → idle
    expect(sessStatus(run({}), 's1')).toBe('idle')
  })

  it('状态只落在对应会话上：其他会话不受 run/finished 影响', () => {
    expect(sessStatus(run({ running: true, sessionId: 's1' }), 's2')).toBe('idle')
    expect(sessStatus(run({ finished: { sessionId: 's1', reason: 'ok' } }), 's2')).toBe('idle')
  })

  it('文案齐全（idle 无点无文案，其余四态有悬停文案）', () => {
    expect(SESS_STATUS_LABEL.idle).toBe('')
    expect(SESS_STATUS_LABEL.ongoing).toBe('进行中')
    expect(SESS_STATUS_LABEL.warning).toBe('等待确认')
    expect(SESS_STATUS_LABEL.done).toBe('已完成')
    expect(SESS_STATUS_LABEL.error).toBe('已出错')
  })
})
