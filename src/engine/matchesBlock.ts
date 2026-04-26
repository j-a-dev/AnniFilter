import type {
  ComparisonOp,
  Condition,
  FilterBlock,
  ItemDescription,
} from './types'
import { BASE_RARITY_ORDER, RUNEWORD_RARITY_ORDER, TIER_ORDER } from './data/spec'

/**
 * Test whether `item` satisfies all of `block`'s conditions.
 * Extracted from matcher.ts so preview.ts can reuse without circular import.
 */
export function matchesBlock(
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
    case 'Tier':
      if (item.tier == null) return false
      return compareOrdered(item.tier, cond.op, cond.value, TIER_ORDER)
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
      if (item.itemName == null) return false
      return cond.values.some((v) => (item.itemName as string).includes(v))
    case 'HasAffix':
      if (item.affixes == null || item.affixes.length === 0) return false
      return cond.values.some((v) =>
        (item.affixes as string[]).some((a) => a.includes(v)),
      )
    case 'Stack':
    case 'ImplicitTier':
    case 'AffixTier':
    case 'AffixCount':
    case 'PrefixTier':
    case 'SuffixTier':
    case 'Runeword':
      return true
    case 'Unknown':
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
    case '==': return actual === expected
    case '!=': return actual !== expected
    case '>': return actual > expected
    case '<': return actual < expected
    case '>=': return actual >= expected
    case '<=': return actual <= expected
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
    case '>': return a > b
    case '<': return a < b
    case '>=': return a >= b
    case '<=': return a <= b
  }
  return false
}
