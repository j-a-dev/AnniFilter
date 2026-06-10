import type { FilterBlock } from './types'

/**
 * Whether a block targets Runeword Patterns (`ItemType "Runeword Pattern"`).
 * `Rarity` comparisons use a different ordering in this context, so the
 * matcher, synthesizer, and validator all need to detect it the same way.
 */
export function isRunewordContext(block: FilterBlock): boolean {
  return block.conditions.some(
    (c) => c.keyword === 'ItemType' && c.values.includes('Runeword Pattern'),
  )
}
