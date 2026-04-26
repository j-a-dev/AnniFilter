import type {
  BooleanConditionKeyword,
  Condition,
  NumericConditionKeyword,
  StringListConditionKeyword,
} from '@/engine/types'

export type ConditionKeyword =
  | 'Rarity'
  | 'Tier'
  | NumericConditionKeyword
  | BooleanConditionKeyword
  | StringListConditionKeyword

export const CONDITION_GROUPS: ReadonlyArray<{
  label: string
  keywords: ConditionKeyword[]
}> = [
  {
    label: 'Item',
    keywords: ['ItemType', 'ItemName', 'HasAffix'],
  },
  {
    label: 'Rarity & tier',
    keywords: ['Rarity', 'Tier'],
  },
  {
    label: 'Numeric',
    keywords: [
      'ItemLevel',
      'AreaLevel',
      'PlayerLevel',
      'Sockets',
      'ImplicitTier',
      'RiftstoneTier',
      'AffixTier',
      'AffixCount',
      'PrefixTier',
      'SuffixTier',
      'Stack',
      'Width',
      'Height',
    ],
  },
  {
    label: 'Boolean',
    keywords: [
      'Ethereal',
      'Identified',
      'Spectral',
      'Runeword',
      'Warped',
      'QuestItem',
    ],
  },
]

const NUMERIC = new Set<string>([
  'ItemLevel',
  'AreaLevel',
  'PlayerLevel',
  'Sockets',
  'ImplicitTier',
  'RiftstoneTier',
  'AffixTier',
  'AffixCount',
  'PrefixTier',
  'SuffixTier',
  'Stack',
  'Width',
  'Height',
])

const BOOLEAN = new Set<string>([
  'Ethereal',
  'Identified',
  'Spectral',
  'Runeword',
  'Warped',
  'QuestItem',
])

const STRING_LIST = new Set<string>(['ItemType', 'ItemName', 'HasAffix'])

export function defaultConditionFor(keyword: ConditionKeyword): Condition {
  if (keyword === 'Rarity') {
    return { keyword: 'Rarity', op: '==', value: 'Rare' }
  }
  if (keyword === 'Tier') {
    return { keyword: 'Tier', op: '==', value: 'Normal' }
  }
  if (NUMERIC.has(keyword)) {
    return {
      keyword: keyword as NumericConditionKeyword,
      op: '>=',
      value: 0,
    }
  }
  if (BOOLEAN.has(keyword)) {
    return {
      keyword: keyword as BooleanConditionKeyword,
      op: '==',
      value: true,
    }
  }
  if (STRING_LIST.has(keyword)) {
    return {
      keyword: keyword as StringListConditionKeyword,
      values: [],
    }
  }
  // Unreachable for known keywords
  return { keyword: 'Unknown', raw: keyword }
}
