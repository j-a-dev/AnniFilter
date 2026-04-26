import type {
  ComparisonOp,
  Condition,
  FilterBlock,
  ItemDescription,
} from './types'
import { BASE_RARITY_ORDER, RUNEWORD_RARITY_ORDER, TIER_ORDER } from './data/spec'

const TIER_ORDER_INV = invert(TIER_ORDER)
const BASE_RARITY_ORDER_INV = invert(BASE_RARITY_ORDER)
const RUNEWORD_RARITY_ORDER_INV = invert(RUNEWORD_RARITY_ORDER)

function invert(m: ReadonlyMap<string, number>): Map<number, string> {
  const out = new Map<number, string>()
  for (const [k, v] of m) out.set(v, k)
  return out
}

/**
 * Build an ItemDescription that satisfies all of the given block's conditions
 * (so the block itself definitely matches). Used for per-row previews — the
 * matcher then runs against this synthesized item to produce the cascaded
 * in-game appearance including any earlier matching Style decorators.
 */
export function synthesizeItem(block: FilterBlock): ItemDescription {
  const item: ItemDescription = {}

  // First pass: detect Runeword Pattern context for rarity ordering.
  const inRunewordCtx = block.conditions.some(
    (c) =>
      c.keyword === 'ItemType' && c.values.includes('Runeword Pattern'),
  )

  for (const c of block.conditions) {
    applyCondition(c, item, inRunewordCtx)
  }

  return item
}

function applyCondition(
  c: Condition,
  item: ItemDescription,
  runewordCtx: boolean,
): void {
  switch (c.keyword) {
    case 'Rarity':
      item.rarity = pickOrdered(
        c.op,
        c.value,
        runewordCtx ? RUNEWORD_RARITY_ORDER : BASE_RARITY_ORDER,
        runewordCtx ? RUNEWORD_RARITY_ORDER_INV : BASE_RARITY_ORDER_INV,
      )
      break
    case 'Tier':
      item.tier = pickOrdered(c.op, c.value, TIER_ORDER, TIER_ORDER_INV) as
        | 'Normal'
        | 'Exceptional'
        | 'Elite'
      break
    case 'Sockets':
      item.sockets = pickNumeric(c.op, c.value)
      break
    case 'ItemLevel':
      item.itemLevel = pickNumeric(c.op, c.value)
      break
    case 'AreaLevel':
      item.areaLevel = pickNumeric(c.op, c.value)
      break
    case 'PlayerLevel':
      item.playerLevel = pickNumeric(c.op, c.value)
      break
    case 'RiftstoneTier':
      item.riftstoneTier = pickNumeric(c.op, c.value)
      break
    case 'Width':
      item.width = pickNumeric(c.op, c.value)
      break
    case 'Height':
      item.height = pickNumeric(c.op, c.value)
      break
    case 'Ethereal':
      if (c.op === '==') item.ethereal = c.value
      break
    case 'Identified':
      if (c.op === '==') item.identified = c.value
      break
    case 'Spectral':
      if (c.op === '==') item.spectral = c.value
      break
    case 'Warped':
      if (c.op === '==') item.warped = c.value
      break
    case 'QuestItem':
      if (c.op === '==') item.questItem = c.value
      break
    case 'ItemType':
      if (c.values.length > 0) item.itemType = c.values[0]
      break
    case 'ItemName':
      if (c.values.length > 0) item.itemName = c.values[0]
      break
    case 'HasAffix':
      if (c.values.length > 0) item.affixes = [...c.values]
      break
    // Conditions we can't simulate without ItemDescription extensions
    // (matcher passes them through). Skip silently.
    default:
      break
  }
}

function pickNumeric(op: ComparisonOp, v: number): number {
  switch (op) {
    case '==':
    case '>=':
    case '<=':
      return v
    case '!=':
      return v + 1
    case '>':
      return v + 1
    case '<':
      return Math.max(0, v - 1)
  }
}

function pickOrdered(
  op: ComparisonOp,
  v: string,
  order: ReadonlyMap<string, number>,
  inv: ReadonlyMap<number, string>,
): string {
  const pos = order.get(v)
  if (pos == null) return v
  switch (op) {
    case '==':
    case '>=':
    case '<=':
      return v
    case '>':
      return inv.get(pos + 1) ?? v
    case '<':
      return inv.get(pos - 1) ?? v
    case '!=':
      return inv.get(pos === 0 ? 1 : pos - 1) ?? v
  }
}
