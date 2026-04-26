import { describe, it, expect } from 'vitest'
import { parse } from '@/engine/parser'
import { categorize } from '@/engine/categorizer'
import type { FilterBlock } from '@/engine/types'
import { readFileSync } from 'node:fs'

function block(text: string): FilterBlock {
  const doc = parse(text).document
  if (!doc.blocks[0]) throw new Error('no block parsed')
  return doc.blocks[0]
}

describe('categorizer', () => {
  it('labels Runes / High Runes', () => {
    expect(categorize(block(`Show\n    ItemType "Runes"\n`))).toContain('runes')
    expect(categorize(block(`Show\n    ItemType "High Runes"\n`))).toContain('runes')
  })

  it('labels Runeword Pattern', () => {
    expect(
      categorize(block(`Show\n    ItemType "Runeword Pattern"\n`)),
    ).toContain('runewords')
  })

  it('labels Riftstones via type or RiftstoneTier', () => {
    expect(categorize(block(`Show\n    ItemType "Riftstone"\n`))).toContain('riftstones')
    expect(categorize(block(`Show\n    RiftstoneTier == 1\n`))).toContain('riftstones')
  })

  it('labels Rift Energies', () => {
    expect(
      categorize(block(`Show\n    ItemType "Rift Energies"\n`)),
    ).toContain('rift-energies')
  })

  it('labels Quest items by QuestItem condition or known name', () => {
    expect(
      categorize(block(`Show\n    QuestItem == True\n`)),
    ).toContain('quest')
    expect(
      categorize(block(`Show\n    ItemName "Horadric Cube"\n`)),
    ).toContain('quest')
  })

  it('labels by Rarity', () => {
    expect(categorize(block(`Show\n    Rarity == Unique\n`))).toContain('unique')
    expect(categorize(block(`Show\n    Rarity == Set\n`))).toContain('set')
    expect(categorize(block(`Show\n    Rarity == Rare\n`))).toContain('rare')
  })

  it('labels armor / weapons / jewelry', () => {
    expect(
      categorize(block(`Show\n    ItemType "Body Armors" "Helmets"\n`)),
    ).toContain('armor')
    expect(
      categorize(block(`Show\n    ItemType "Swords" "Bows"\n`)),
    ).toContain('weapons')
    expect(
      categorize(block(`Show\n    ItemType "Amulets" "Rings"\n`)),
    ).toContain('jewelry')
  })

  it('returns uncategorized for blocks with no recognized markers', () => {
    expect(categorize(block(`Show\n    ItemLevel >= 75\n`))).toEqual(['uncategorized'])
  })

  it('produces multiple labels when applicable (Rarity + ItemType)', () => {
    const labels = categorize(
      block(`Show\n    Rarity == Unique\n    ItemType "Body Armors"\n`),
    )
    expect(labels).toContain('unique')
    expect(labels).toContain('armor')
  })
})

describe('categorizer: shipped filter coverage', () => {
  it('lenzy regular: most blocks get a non-uncategorized label', () => {
    const text = readFileSync(
      "samples/lenzy's filter_regular.filter",
      'utf8',
    )
    const doc = parse(text).document
    let labeled = 0
    for (const b of doc.blocks) {
      const labels = categorize(b)
      if (!(labels.length === 1 && labels[0] === 'uncategorized')) labeled++
    }
    const ratio = labeled / doc.blocks.length
    // Threshold reflects real categorizer reach: many shipped Style blocks
    // condition only on non-ItemType keywords (e.g. RiftstoneTier alone, or
    // Rarity-only style decorators) which produce labels, while pure
    // condition-by-numeric blocks (ItemLevel only, Tier only, etc.) land in
    // 'uncategorized' by design — they're cross-cutting decorators.
    expect(ratio).toBeGreaterThanOrEqual(0.7)
  })
})
