import type { CategoryLabel, FilterBlock } from './types'
import {
  ITEM_TYPES_ARMORS,
  ITEM_TYPES_MELEE_WEAPONS,
  ITEM_TYPES_RANGED_WEAPONS,
  QUEST_ITEM_NAMES,
  UBER_KEYS,
} from './data/spec'

const ARMOR_ITEMTYPES = new Set<string>(ITEM_TYPES_ARMORS)
const WEAPON_ITEMTYPES = new Set<string>([
  ...ITEM_TYPES_MELEE_WEAPONS,
  ...ITEM_TYPES_RANGED_WEAPONS,
  'Any Weapon',
])
const JEWELRY_ITEMTYPES = new Set(['Amulets', 'Rings', 'Jewelry'])
const QUEST_NAMES = new Set<string>([...QUEST_ITEM_NAMES, ...UBER_KEYS])

/**
 * Heuristic ItemType + condition labeler. A block can carry multiple labels.
 * If nothing matches, returns ['uncategorized'].
 */
export function categorize(block: FilterBlock): CategoryLabel[] {
  const labels = new Set<CategoryLabel>()

  // Quest detection: explicit QuestItem condition or known item-name
  if (
    block.conditions.some(
      (c) => c.keyword === 'QuestItem' && c.value === true,
    )
  ) {
    labels.add('quest')
  }
  for (const cond of block.conditions) {
    if (cond.keyword === 'ItemName') {
      for (const v of cond.values) {
        if (QUEST_NAMES.has(v)) {
          labels.add('quest')
          break
        }
      }
    }
  }

  // Rarity-based labels
  for (const cond of block.conditions) {
    if (cond.keyword !== 'Rarity') continue
    if (cond.op !== '==') continue
    switch (cond.value) {
      case 'Unique':
        labels.add('unique')
        break
      case 'Set':
        labels.add('set')
        break
      case 'Rare':
        labels.add('rare')
        break
      case 'Magic':
        labels.add('magic')
        break
      case 'Normal':
        labels.add('normal')
        break
    }
  }

  // ItemType-based labels
  for (const cond of block.conditions) {
    if (cond.keyword !== 'ItemType') continue
    for (const v of cond.values) {
      if (v === 'Runes' || v === 'High Runes') labels.add('runes')
      if (v === 'Runeword Pattern') labels.add('runewords')
      if (v === 'Riftstone') labels.add('riftstones')
      if (v === 'Rift Energies' || v === 'Rift Particles') {
        labels.add('rift-energies')
      }
      if (v === 'Potions') labels.add('potions')
      if (v === 'Jewels') labels.add('gems')
      if (v === 'Greater Souls') labels.add('gems')
      if (ARMOR_ITEMTYPES.has(v) || v === 'Any Armor') labels.add('armor')
      if (WEAPON_ITEMTYPES.has(v)) labels.add('weapons')
      if (JEWELRY_ITEMTYPES.has(v)) labels.add('jewelry')
    }
  }

  // RiftstoneTier presence implies riftstones context
  if (block.conditions.some((c) => c.keyword === 'RiftstoneTier')) {
    labels.add('riftstones')
  }

  if (labels.size === 0) labels.add('uncategorized')
  return [...labels]
}
