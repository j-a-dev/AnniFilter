import type { BlockKind, ComparisonOp, Condition, FilterBlock } from '@/engine/types'

const PRETTY_OP: Record<ComparisonOp, string> = {
  '==': '=',
  '!=': '≠',
  '>': '>',
  '<': '<',
  '>=': '≥',
  '<=': '≤',
}

export function formatConditionShort(cond: Condition): string {
  switch (cond.keyword) {
    case 'ItemType':
    case 'ItemName':
    case 'HasAffix': {
      const head = cond.values.slice(0, 3).join(', ')
      const more = cond.values.length > 3 ? ` +${cond.values.length - 3}` : ''
      return head + more
    }
    case 'Rarity':
      return `Rarity ${PRETTY_OP[cond.op]} ${cond.value}`
    case 'Tier':
      return `Tier ${PRETTY_OP[cond.op]} ${cond.value}`
    case 'Unknown':
      return cond.raw
    default: {
      if (typeof cond.value === 'boolean') {
        return cond.op === '!='
          ? `${cond.keyword} ≠ ${cond.value ? 'true' : 'false'}`
          : cond.value
            ? cond.keyword
            : `not ${cond.keyword}`
      }
      return `${cond.keyword} ${PRETTY_OP[cond.op]} ${cond.value}`
    }
  }
}

export function summarizeConditions(block: FilterBlock): string {
  if (block.conditions.length === 0) return '(no conditions — matches everything)'
  return block.conditions.map(formatConditionShort).join(' · ')
}

export const KIND_COLOR: Record<BlockKind, string> = {
  Show: 'bg-emerald-500/70',
  Hide: 'bg-rose-500/70',
  Style: 'bg-amber-500/70',
}

export const KIND_LABEL: Record<BlockKind, string> = {
  Show: 'Show',
  Hide: 'Hide',
  Style: 'Style',
}
