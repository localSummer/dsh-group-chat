/**
 * core 纯逻辑冒烟测试：JSON 序列化契约与参数安全化。
 */
import { describe, expect, it } from 'vitest'
import { messageJson, roleJson } from '../src/core/json.ts'
import { asEffort, asNumber, asPermissionTier, migrateTier, PERMISSION_TIERS } from '../src/core/types.ts'
import { TOOL_SCHEMAS } from '../src/core/tools.ts'

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
