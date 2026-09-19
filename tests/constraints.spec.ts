/**
 * 会话约束备忘纯逻辑：挤出集、解析、降级、临时原文、注入块。
 */
import { describe, expect, it } from 'vitest'
import {
  CONSTRAINT_MAX_ITEMS,
  constraintBlock,
  downgradeWithoutUser,
  parseConstraints,
  sanitizeConstraints,
  FOLD_MAX_MESSAGES,
  squeezedMaxSeq,
  squeezedMessages,
  takeFoldBatch,
  tempTranscript,
  TEMP_MAX_MESSAGES,
  WINDOW_SIZE,
} from '../src/core/constraints.ts'
import { asConstraintKind } from '../src/core/types.ts'
import type { MessageRecord, SessionRecord } from '../src/core/types.ts'

const msg = (id: string, seq: number, speaker: string, text = id): MessageRecord => ({
  id, sessionId: 's', seq, speaker, text, ts: seq,
})

const sess = (ids: string[], extra?: Partial<SessionRecord>): SessionRecord => ({
  id: 's', groupId: 'g', name: 'S', topic: '', messageIds: ids, createdAt: 0, ...extra,
})

describe('asConstraintKind', () => {
  it('三档合法值原样，其余 undefined', () => {
    expect(asConstraintKind('decided')).toBe('decided')
    expect(asConstraintKind('rejected')).toBe('rejected')
    expect(asConstraintKind('open')).toBe('open')
    expect(asConstraintKind('pinned')).toBeUndefined()
    expect(asConstraintKind('')).toBeUndefined()
  })
})

describe('squeezedMessages', () => {
  it('窗口内不挤出；水位之后且不在末 40 才挤出', () => {
    const ids = Array.from({ length: 42 }, (_, i) => 'm' + (i + 1))
    const map = new Map(ids.map((id, i) => [id, msg(id, i + 1, 'user')]))
    const out = squeezedMessages(map, sess(ids, { constraintsUpToSeq: 0 }))
    expect(out.map((m) => m.id)).toEqual(['m1', 'm2'])
    const none = squeezedMessages(map, sess(ids, { constraintsUpToSeq: 2 }))
    expect(none).toEqual([])
  })

  it('系统行计入窗口，仍可被挤出集收录（takeFoldBatch 再丢掉）', () => {
    const ids = Array.from({ length: 41 }, (_, i) => 'm' + (i + 1))
    const map = new Map(ids.map((id, i) => [id, msg(id, i + 1, i === 0 ? 'system' : 'user')]))
    const out = squeezedMessages(map, sess(ids))
    expect(out).toHaveLength(1)
    expect(out[0].speaker).toBe('system')
  })

  it('不足 40 条时挤出为空', () => {
    const ids = ['m1', 'm2']
    const map = new Map(ids.map((id, i) => [id, msg(id, i + 1, 'user')]))
    expect(squeezedMessages(map, sess(ids))).toEqual([])
    expect(WINDOW_SIZE).toBe(40)
  })

  it('水位之后只扫窗口外前缀，不回头看窗口内', () => {
    const ids = Array.from({ length: 45 }, (_, i) => 'm' + (i + 1))
    const map = new Map(ids.map((id, i) => [id, msg(id, i + 1, 'user')]))
    expect(squeezedMessages(map, sess(ids, { constraintsUpToSeq: 3 })).map((m) => m.id)).toEqual(['m4', 'm5'])
  })
})

describe('takeFoldBatch / tempTranscript', () => {
  it('丢掉系统行并标记 hasUser / allSystem；系统行仍计入消耗', () => {
    const batch = [msg('s1', 1, 'system', 'err'), msg('u1', 2, 'user', '定了'), msg('r1', 3, 'role', '反对')]
    const withUser = takeFoldBatch(batch, (m) => m.speaker)
    expect(withUser.hasUser).toBe(true)
    expect(withUser.allSystem).toBe(false)
    expect(withUser.lines.join('\n')).not.toContain('err')
    expect(withUser.consumed.map((m) => m.id)).toEqual(['s1', 'u1', 'r1'])
    const sysOnly = takeFoldBatch([msg('s1', 1, 'system')], (m) => m.speaker)
    expect(sysOnly.allSystem).toBe(true)
    expect(sysOnly.lines).toEqual([])
    expect(sysOnly.consumed).toHaveLength(1)
  })

  it('临时原文超 20 条丢最旧', () => {
    const batch = Array.from({ length: 25 }, (_, i) => msg('m' + i, i + 1, 'user', 't' + i))
    const block = tempTranscript(batch, (m) => m.speaker)
    expect(block).not.toContain('t0')
    expect(block).toContain('t24')
    expect(block.split('\n\n')).toHaveLength(TEMP_MAX_MESSAGES)
  })

  it('单轮折叠只吃前缀 40 条，水位停在已消耗 max seq', () => {
    const batch = Array.from({ length: 50 }, (_, i) => msg('m' + i, i + 1, 'user', 't' + i))
    const taken = takeFoldBatch(batch, (m) => m.speaker)
    expect(taken.consumed).toHaveLength(FOLD_MAX_MESSAGES)
    expect(taken.consumed[0].id).toBe('m0')
    expect(taken.consumed[39].id).toBe('m39')
    expect(squeezedMaxSeq(taken.consumed)).toBe(40)
    expect(taken.lines[0]).toContain('t0')
    expect(taken.lines.at(-1)).toContain('t39')
  })

  it('单轮折叠超总长时停在已装下的前缀，不吃后面的条', () => {
    const fat = 'x'.repeat(9000)
    const batch = [msg('a', 1, 'user', fat), msg('b', 2, 'user', fat), msg('c', 3, 'user', 'tail')]
    const taken = takeFoldBatch(batch, (m) => m.speaker)
    expect(taken.consumed.map((m) => m.id)).toEqual(['a'])
    expect(taken.lines).toHaveLength(1)
    expect(squeezedMaxSeq(taken.consumed)).toBe(1)
  })
})

describe('parseConstraints / sanitizeConstraints', () => {
  it('围栏 JSON 解析成功；缺字段或非数组失败', () => {
    expect(parseConstraints('```json\n{"constraints":[{"kind":"decided","text":"用 Redis"}]}\n```')).toEqual([
      { kind: 'decided', text: '用 Redis' },
    ])
    expect(parseConstraints('{"constraints":[]}')).toEqual([])
    expect(parseConstraints('not json')).toBeNull()
    expect(parseConstraints('{"name":"x"}')).toBeNull()
    expect(parseConstraints('{"constraints":"nope"}')).toBeNull()
  })

  it('非法 kind / 空 text 丢条目；最多 12 条', () => {
    const raw = [
      { kind: 'pinned', text: 'x' },
      { kind: 'open', text: '  ' },
      { kind: 'open', text: 'ok' },
      ...Array.from({ length: 20 }, (_, i) => ({ kind: 'open', text: 'n' + i })),
    ]
    const out = sanitizeConstraints(raw)
    expect(out[0]).toEqual({ kind: 'open', text: 'ok' })
    expect(out).toHaveLength(CONSTRAINT_MAX_ITEMS)
  })
})

describe('downgradeWithoutUser / constraintBlock / squeezedMaxSeq', () => {
  it('无用户时已定/否决降为未决', () => {
    const list = [
      { kind: 'decided' as const, text: 'A' },
      { kind: 'rejected' as const, text: 'B' },
      { kind: 'open' as const, text: 'C' },
    ]
    expect(downgradeWithoutUser(list, true)).toEqual(list)
    expect(downgradeWithoutUser(list, false)).toEqual([
      { kind: 'open', text: 'A' },
      { kind: 'open', text: 'B' },
      { kind: 'open', text: 'C' },
    ])
  })

  it('注入块空则空串；水位取本批 max seq', () => {
    expect(constraintBlock(undefined)).toBe('')
    expect(constraintBlock([])).toBe('')
    expect(constraintBlock([{ kind: 'decided', text: '用 Redis' }])).toBe('\n# 已确认约束\n- 已定：用 Redis')
    expect(squeezedMaxSeq([msg('a', 3, 'user'), msg('b', 11, 'user')])).toBe(11)
    expect(squeezedMaxSeq([])).toBe(0)
  })
})
