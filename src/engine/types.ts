export type ComparisonOp = '==' | '!=' | '>' | '<' | '>=' | '<='

export type NumericConditionKeyword =
  | 'Sockets'
  | 'ItemLevel'
  | 'AreaLevel'
  | 'PlayerLevel'
  | 'ImplicitTier'
  | 'AffixTier'
  | 'RiftstoneTier'
  | 'Stack'
  | 'Width'
  | 'Height'
  | 'AffixCount'
  | 'PrefixTier'
  | 'SuffixTier'

export type BooleanConditionKeyword =
  | 'Ethereal'
  | 'Identified'
  | 'Spectral'
  | 'Runeword'
  | 'Warped'
  | 'QuestItem'

export type StringListConditionKeyword = 'ItemType' | 'ItemName' | 'HasAffix'

export type Condition =
  | { keyword: 'Rarity'; op: ComparisonOp; value: string }
  | {
      keyword: 'Tier'
      op: ComparisonOp
      value: 'Normal' | 'Exceptional' | 'Elite'
    }
  | { keyword: NumericConditionKeyword; op: ComparisonOp; value: number }
  | { keyword: BooleanConditionKeyword; op: '==' | '!='; value: boolean }
  | { keyword: StringListConditionKeyword; values: string[] }
  | { keyword: 'Unknown'; raw: string }

export type Action =
  | {
      keyword: 'SetBorderColor' | 'SetBackgroundColor'
      r: number
      g: number
      b: number
    }
  | { keyword: 'SetTextColor'; color: string }
  | { keyword: 'SetFont'; font: string }
  | { keyword: 'SetBlendMode'; mode: string }
  | {
      keyword:
        | 'SetItemName'
        | 'AppendText'
        | 'PrependText'
        | 'ChatNotification'
      template: string
    }
  | { keyword: 'PlayAlertSound'; soundId: number }
  | {
      keyword: 'MinimapIcon'
      size: number
      r: number
      g: number
      b: number
    }
  | { keyword: 'Unknown'; raw: string }

export type BlockEntry =
  | { kind: 'condition'; data: Condition }
  | { kind: 'action'; data: Action }
  | { kind: 'comment'; text: string }

export type BlockKind = 'Show' | 'Hide' | 'Style'

export type FilterBlock = {
  id: string
  kind: BlockKind
  enabled: boolean
  label?: string
  entries: BlockEntry[]
}

export type FilterDocument = {
  blocks: FilterBlock[]
  preamble: string[]
  trailingComments: string[]
}

export type ValidationIssue = {
  level: 'error' | 'warning' | 'info'
  blockId?: string
  entryIndex?: number
  code: string
  message: string
}

export type CategoryLabel =
  | 'runes'
  | 'runewords'
  | 'riftstones'
  | 'rift-energies'
  | 'quest'
  | 'unique'
  | 'set'
  | 'rare'
  | 'magic'
  | 'normal'
  | 'weapons'
  | 'armor'
  | 'jewelry'
  | 'charms'
  | 'potions'
  | 'gems'
  | 'uncategorized'

export type ItemDescription = {
  itemType?: string
  rarity?: string
  tier?: 'Normal' | 'Exceptional' | 'Elite'
  itemName?: string
  sockets?: number
  itemLevel?: number
  areaLevel?: number
  playerLevel?: number
  affixes?: string[]
  ethereal?: boolean
  identified?: boolean
  spectral?: boolean
  warped?: boolean
  questItem?: boolean
  riftstoneTier?: number
  width?: number
  height?: number
}

export type MatchResult = {
  styleStack: FilterBlock[]
  terminator: FilterBlock | null
  visible: boolean
  effectiveActions: Action[]
}
