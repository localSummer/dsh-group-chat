/**
 * 群组权限档位选择器（对齐主会话 composer 左下角的 /permission 选择器）：
 * 触发芯片（盾形图标 + 档位名 + chevron）+ Menu 上弹三档 + 完全权限风险
 * 确认弹窗（与主会话同款 RiskConfirmation 原语与文案）。
 * @module dsh-group-chat/client/permission-select
 */

import { useEffect, useState, type ReactNode } from 'react'
import { Icon, P } from './ui.ts'
import type { PermissionTier } from '../core/types.ts'
import { asPermissionTier, PERMISSION_TIERS } from '../core/types.ts'

export interface PermissionSelectProps {
  tier: PermissionTier
  onSelect: (tier: PermissionTier) => void
}

/** 档位展示名（与主会话中文标签一致）。 */
const TIER_LABELS: Record<PermissionTier, string> = {
  view_only: '仅可查看',
  workspace_write: '工作区内修改',
  full_access: '完全权限',
}

/** 档位悬停说明（群聊语境下的真实约束）。 */
const TIER_DESCRIPTIONS: Record<PermissionTier, string> = {
  view_only: '角色只能读取工作区文件，不能执行命令',
  workspace_write: '角色可执行命令（cwd 固定在工作区），每条命令需你在会话中确认',
  full_access: '角色可免确认直接执行命令，存在风险',
}

/** 完全权限风险确认文案（与主会话逐字一致）。 */
const CONFIRM_TEXT = {
  title: '确认启用完全权限？',
  description: '启用完全权限后，智能体将减少确认步骤，并且可以直接执行更多操作，包括敏感操作、文件修改或外部命令。仅建议在你信任当前任务时使用。',
  acknowledge: '我已了解风险，并愿意继续',
  cancel: '取消',
  enable: '启用完全权限',
} as const

// ---- 盾形图标（路径取自主会话 PermissionSelect 的设计稿字形） ----

const SHIELD_OUTLINE = 'M8.20554 0.899994L14.7901 3.36857V7.01026C14.7901 12 11.0466 14.2103 8.20554 15.3C5.36446 14.2103 1.62012 12 1.62012 7.01026V3.36857L8.20554 0.899994Z'

function GlyphViewOnly(): ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d={SHIELD_OUTLINE} stroke="currentColor" strokeWidth="1.31831" strokeLinejoin="round" />
      <path d="M12.1654 5.7552L8.9447 9.41475C8.73044 9.65816 8.53628 9.8804 8.35774 10.0423C8.1713 10.2114 7.94235 10.3717 7.64016 10.4254C7.48207 10.4535 7.32 10.4552 7.16151 10.4294C6.85843 10.3801 6.62728 10.2223 6.43836 10.0559C6.25752 9.89653 6.06037 9.67732 5.84264 9.43705L4.72925 8.20897L5.63557 7.38707L6.74897 8.61594C6.98603 8.87755 7.12974 9.03533 7.24673 9.13839C7.31033 9.19443 7.34485 9.21476 7.35823 9.22122C7.38068 9.22484 7.40352 9.22515 7.42593 9.22122C7.40522 9.22502 7.42893 9.23294 7.53583 9.136C7.65132 9.03126 7.79316 8.87139 8.02643 8.60638L11.2479 4.94763L12.1654 5.7552Z" fill="currentColor" />
    </svg>
  )
}

function GlyphWorkspaceWrite(): ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8.08887 0.251709C8.20479 0.23085 8.32486 0.241168 8.43652 0.282959L15.0215 2.75171C15.2787 2.84819 15.4492 3.09414 15.4492 3.3689V7.0105C15.4492 7.10986 15.4441 7.2081 15.4414 7.30542C15.0285 7.07175 14.5905 6.87695 14.1309 6.73022V3.82495L8.20508 1.60327L2.2793 3.82495V7.0105C2.27936 9.7171 3.4745 11.5379 5.02734 12.7947C5.01025 12.9942 5 13.1962 5 13.4001C5.00001 13.7617 5.02722 14.1169 5.08008 14.4636C2.91555 13.0393 0.961014 10.752 0.960938 7.0105V3.3689C0.960938 3.09417 1.13146 2.84821 1.38867 2.75171L7.97461 0.282959L8.08887 0.251709Z" fill="currentColor" />
      <path d="M11.3525 5.64688V6.85688H5V5.64688H11.3525Z" fill="currentColor" />
      <path d="M9.5824 8.29376V9.50376H5V8.29376H9.5824Z" fill="currentColor" />
      <path d="M14.6647 15.6852H10.0338C10.3878 15.3751 10.7567 15.0517 11.0772 14.7706C11.2531 14.6164 11.4144 14.4746 11.5511 14.3547H14.6647V15.6852Z" fill="currentColor" />
      <path d="M8.14852 14.1308L7.33925 15.4976C7.22458 15.6912 7.42245 15.9194 7.63037 15.8333L9.09785 15.2254L15.0399 10.0719L14.0905 8.97733L8.14852 14.1308Z" fill="currentColor" />
    </svg>
  )
}

function GlyphFullAccess(): ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d={SHIELD_OUTLINE} stroke="currentColor" strokeWidth="1.31831" strokeLinejoin="round" />
      <path d="M9.10094 4.5V8.75939H7.59888V4.5H9.10094Z" fill="currentColor" />
      <path d="M9.10094 9.8114V11.5H7.59888V9.8114Z" fill="currentColor" />
    </svg>
  )
}

const TIER_GLYPHS: Record<PermissionTier, () => ReactNode> = {
  view_only: GlyphViewOnly,
  workspace_write: GlyphWorkspaceWrite,
  full_access: GlyphFullAccess,
}

export function PermissionSelect(props: PermissionSelectProps): ReactNode {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)
  // 版本错位兜底：旧 host 快照无 permissionTier（或值非法）时按最安全的仅可查看呈现，
  // 不让面板整体崩溃
  const tier = asPermissionTier(props.tier) ?? 'view_only'

  // 档位被外部改回（如迁移/其他端变更）时收起弹层与确认态
  useEffect(() => {
    setOpen(false)
    setAcknowledged(false)
    setConfirming(false)
  }, [tier])

  const choose = (id: string): void => {
    setOpen(false)
    if (id === tier) return
    if (id === 'full_access') {
      setAcknowledged(false)
      setConfirming(true)
      return
    }
    props.onSelect(id as PermissionTier)
  }
  const closeConfirm = (): void => {
    setAcknowledged(false)
    setConfirming(false)
  }
  const confirmFullAccess = (): void => {
    if (!acknowledged) return
    closeConfirm()
    props.onSelect('full_access')
  }

  const items = PERMISSION_TIERS.map((t) => ({ id: t, label: TIER_LABELS[t], icon: TIER_GLYPHS[t]() }))
  const Glyph = TIER_GLYPHS[tier] ?? GlyphViewOnly

  return (
    <>
      <P.Menu
        open={open}
        items={items}
        selectedId={tier}
        onSelect={choose}
        onClose={() => { setOpen(false) }}
        side="top"
        anchor={(
          <button
            type="button"
            className="dsgc-permtrigger"
            aria-label={'权限模式：' + TIER_LABELS[tier]}
            title={TIER_DESCRIPTIONS[tier]}
            disabled={confirming}
            onClick={() => { setOpen(!open) }}
          >
            <span className="dsgc-permicon" aria-hidden>{Glyph()}</span>
            <span className="dsgc-permlabel">{TIER_LABELS[tier]}</span>
            <span className={'dsgc-permchevron' + (open ? ' open' : '')} aria-hidden>{Icon(P.IconChevronDownOutline14, 14)}</span>
          </button>
        )}
      />
      <P.RiskConfirmation
        open={confirming}
        title={CONFIRM_TEXT.title}
        description={CONFIRM_TEXT.description}
        acknowledgeLabel={CONFIRM_TEXT.acknowledge}
        cancelLabel={CONFIRM_TEXT.cancel}
        closeLabel="关闭"
        confirmLabel={CONFIRM_TEXT.enable}
        acknowledged={acknowledged}
        onAcknowledgedChange={setAcknowledged}
        onCancel={closeConfirm}
        onConfirm={confirmFullAccess}
      />
    </>
  )
}
