import type {
  Action,
  ActionKeyword,
  ComparisonOp,
  Condition,
  FilterBlock,
  FilterDocument,
  ItemDescription,
  MatchResult,
  StylePreset,
} from './types'
import { BASE_RARITY_ORDER, RUNEWORD_RARITY_ORDER, TIER_ORDER } from './data/spec'

/**
 * Walk the filter top-down. Style blocks that match are accumulated in styleStack
 * (do not terminate). The first matching Show or Hide terminates the walk.
 * Style actions stack last-write-wins per keyword in effectiveActions.
 */
export function match(
  document: FilterDocument,
  item: ItemDescription,
): MatchResult {
  const styleStack: FilterBlock[] = []
  let terminator: FilterBlock | null = null
  const presetById = new Map(document.presets.map((p) => [p.id, p]))

  for (const block of document.blocks) {
    if (!block.enabled) continue
    if (!matchesAllConditions(block, item)) continue

    if (block.kind === 'Style') {
      styleStack.push(block)
      continue
    }
    // Show or Hide — terminate.
    terminator = block
    break
  }

  // Default visibility: shown unless a Hide block matched.
  const visible = terminator?.kind !== 'Hide'

  // Effective actions: walk style stack in order, last-write-wins per keyword,
  // then layer the terminating block's actions on top (also last-write-wins).
  const map = new Map<ActionKeyword | 'Unknown', Action>()
  const multivalueOrdered: Action[] = [] // PlayAlertSound preserves all entries in order
  for (const block of styleStack) {
    layerBlockActions(block, presetById, map, multivalueOrdered)
  }
  if (terminator && terminator.kind === 'Show') {
    layerBlockActions(terminator, presetById, map, multivalueOrdered)
  }
  const effectiveActions: Action[] = [
    ...multivalueOrdered,
    ...Array.from(map.values()),
  ]

  return {
    styleStack,
    terminator,
    visible,
    effectiveActions,
  }
}

function layerBlockActions(
  block: FilterBlock,
  presetById: Map<string, StylePreset>,
  map: Map<ActionKeyword | 'Unknown', Action>,
  multivalueOrdered: Action[],
): void {
  const preset = block.presetId ? presetById.get(block.presetId) : undefined
  const actions = resolveEffectiveActions(block, preset)
  for (const a of actions) {
    if (a.keyword === 'PlayAlertSound') {
      multivalueOrdered.push(a)
    } else {
      map.set(a.keyword, a)
    }
  }
}

function resolveEffectiveActions(
  block: FilterBlock,
  preset: StylePreset | undefined,
): Action[] {
  if (!preset) return block.actions
  const out: Action[] = []
  const overrides = block.presetOverrides ?? {}
  for (const action of preset.actions) {
    const k = action.keyword as ActionKeyword
    if (k in overrides) {
      const override = overrides[k]
      if (override === null) continue
      if (override !== undefined) {
        out.push(override)
        continue
      }
    }
    out.push(action)
  }
  for (const a of block.actions) out.push(a)
  return out
}

function matchesAllConditions(
  block: FilterBlock,
  item: ItemDescription,
): boolean {
  for (const cond of block.conditions) {
    if (!matchesCondition(cond, item, block)) return false
  }
  return true
}

function matchesCondition(
  cond: Condition,
  item: ItemDescription,
  block: FilterBlock,
): boolean {
  switch (cond.keyword) {
    case 'Rarity': {
      if (item.rarity == null) return false
      const isRunewordContext = block.conditions.some(
        (c) =>
          c.keyword === 'ItemType' &&
          c.values.includes('Runeword Pattern'),
      )
      const order = isRunewordContext ? RUNEWORD_RARITY_ORDER : BASE_RARITY_ORDER
      return compareOrdered(item.rarity, cond.op, cond.value, order)
    }
    case 'Tier': {
      if (item.tier == null) return false
      return compareOrdered(item.tier, cond.op, cond.value, TIER_ORDER)
    }
    case 'Sockets':
      return compareNumeric(item.sockets, cond.op, cond.value)
    case 'ItemLevel':
      return compareNumeric(item.itemLevel, cond.op, cond.value)
    case 'AreaLevel':
      return compareNumeric(item.areaLevel, cond.op, cond.value)
    case 'PlayerLevel':
      return compareNumeric(item.playerLevel, cond.op, cond.value)
    case 'RiftstoneTier':
      return compareNumeric(item.riftstoneTier, cond.op, cond.value)
    case 'Width':
      return compareNumeric(item.width, cond.op, cond.value)
    case 'Height':
      return compareNumeric(item.height, cond.op, cond.value)
    case 'Ethereal':
      return compareBoolean(item.ethereal, cond.op, cond.value)
    case 'Identified':
      return compareBoolean(item.identified, cond.op, cond.value)
    case 'Spectral':
      return compareBoolean(item.spectral, cond.op, cond.value)
    case 'Warped':
      return compareBoolean(item.warped, cond.op, cond.value)
    case 'QuestItem':
      return compareBoolean(item.questItem, cond.op, cond.value)
    case 'ItemType':
      return item.itemType != null && cond.values.includes(item.itemType)
    case 'ItemName':
      // Substring match per CONCEPT.md spec decision (UNVERIFIED but consistent
      // with how `ItemName "Eth"` matches the Eth rune and `ItemName "of Everliving"`
      // matches an affix-like token).
      if (item.itemName == null) return false
      return cond.values.some((v) =>
        (item.itemName as string).includes(v),
      )
    case 'HasAffix':
      if (item.affixes == null || item.affixes.length === 0) return false
      return cond.values.some((v) =>
        (item.affixes as string[]).some((a) => a.includes(v)),
      )
    // Conditions we can't simulate without a richer ItemDescription:
    case 'Stack':
    case 'ImplicitTier':
    case 'AffixTier':
    case 'AffixCount':
    case 'PrefixTier':
    case 'SuffixTier':
    case 'Runeword':
      return true
    case 'Unknown':
      // Pass-through — we don't know the semantics, don't filter on it.
      return true
  }
}

function compareNumeric(
  actual: number | undefined,
  op: ComparisonOp,
  expected: number,
): boolean {
  if (actual == null) return false
  switch (op) {
    case '==':
      return actual === expected
    case '!=':
      return actual !== expected
    case '>':
      return actual > expected
    case '<':
      return actual < expected
    case '>=':
      return actual >= expected
    case '<=':
      return actual <= expected
  }
}

function compareBoolean(
  actual: boolean | undefined,
  op: '==' | '!=',
  expected: boolean,
): boolean {
  if (actual == null) return false
  return op === '==' ? actual === expected : actual !== expected
}

function compareOrdered(
  actualName: string,
  op: ComparisonOp,
  expectedName: string,
  order: ReadonlyMap<string, number>,
): boolean {
  if (op === '==') return actualName === expectedName
  if (op === '!=') return actualName !== expectedName
  const a = order.get(actualName)
  const b = order.get(expectedName)
  if (a == null || b == null) return false
  switch (op) {
    case '>':
      return a > b
    case '<':
      return a < b
    case '>=':
      return a >= b
    case '<=':
      return a <= b
  }
}
