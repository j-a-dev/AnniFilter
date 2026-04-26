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

export type ActionKeyword =
  | 'SetBorderColor'
  | 'SetBackgroundColor'
  | 'SetTextColor'
  | 'SetFont'
  | 'SetBlendMode'
  | 'SetItemName'
  | 'AppendText'
  | 'PrependText'
  | 'ChatNotification'
  | 'PlayAlertSound'
  | 'MinimapIcon'

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

export type BlockKind = 'Show' | 'Hide' | 'Style'

export type FilterBlock = {
  /**
   * Stable id. Parser emits `parsed-${index}`; store mutations use nanoid.
   * Round-trip identity holds because deterministic parsed-{i} match across re-parses.
   */
  id: string
  kind: BlockKind
  enabled: boolean
  label?: string
  conditions: Condition[]
  actions: Action[]
  /** Mid-block `#comments` collected here in source order; position relative to conditions/actions is not preserved (acceptable: mid-block comments are vanishingly rare in real filters). */
  intraBlockComments: string[]
  /** When set, the block applies the named preset's actions before its own (own actions act as overrides for that keyword). */
  presetId?: string
  /**
   * Per-action-keyword override map. `Action` value replaces the preset's
   * action for that keyword; `null` suppresses the preset's action entirely.
   * Keywords absent from this map use the preset's value.
   */
  presetOverrides?: Partial<Record<ActionKeyword, Action | null>>
}

export type StylePreset = {
  id: string
  name: string
  actions: Action[]
  createdAt: number
}

export type FilterDocument = {
  blocks: FilterBlock[]
  presets: StylePreset[]
  preamble: string[]
  trailingComments: string[]
}

export type ValidationIssue = {
  level: 'error' | 'warning' | 'info'
  blockId?: string
  /** Index into the block's conditions[] array, when the issue is on a condition. */
  conditionIndex?: number
  /** Index into the block's actions[] array, when the issue is on an action. */
  actionIndex?: number
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
