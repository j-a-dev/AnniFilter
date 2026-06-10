import { describe, it, expect } from 'vitest'
import { parse } from '@/engine/parser'
import { synthesizeItem } from '@/engine/synthesizeItem'
import { matchesBlock } from '@/engine/matchesBlock'
import type { FilterBlock } from '@/engine/types'

const block = (text: string): FilterBlock => {
  const b = parse(text).document.blocks[0]
  if (!b) throw new Error('no block parsed from: ' + text)
  return b
}

describe('synthesizeItem', () => {
  describe('numeric picks', () => {
    it.each([
      ['ItemLevel >= 75', 75],
      ['ItemLevel <= 75', 75],
      ['ItemLevel == 75', 75],
      ['ItemLevel > 75', 76],
      ['ItemLevel != 75', 76],
      ['ItemLevel < 75', 74],
    ])('%s synthesizes a satisfying itemLevel', (cond, expected) => {
      const b = block(`Show\n    ${cond}\n`)
      expect(synthesizeItem(b).itemLevel).toBe(expected)
    })

    it('clamps `< 1` to a non-negative value', () => {
      expect(synthesizeItem(block('Show\n    Sockets < 1\n')).sockets).toBe(0)
    })
  })

  describe('ordered (rarity / tier) picks', () => {
    it.each([
      ['Rarity == Rare', 'Rare'],
      ['Rarity >= Rare', 'Rare'],
      ['Rarity <= Rare', 'Rare'],
      ['Rarity > Rare', 'Set'],
      ['Rarity < Rare', 'Magic'],
    ])('%s -> %s', (cond, expected) => {
      expect(synthesizeItem(block(`Show\n    ${cond}\n`)).rarity).toBe(expected)
    })

    it('`!=` picks a different value (never the excluded one)', () => {
      expect(synthesizeItem(block('Show\n    Rarity != Rare\n')).rarity).not.toBe(
        'Rare',
      )
      // Boundary value still resolves to a different neighbor.
      expect(
        synthesizeItem(block('Show\n    Rarity != Normal\n')).rarity,
      ).not.toBe('Normal')
    })

    it('uses the runeword-pattern rarity order in that context', () => {
      const b = block(
        'Show\n    ItemType "Runeword Pattern"\n    Rarity > Common\n',
      )
      // Common is the lowest runeword rarity; > Common -> Uncommon (not a base rarity).
      expect(synthesizeItem(b).rarity).toBe('Uncommon')
    })

    it('synthesizes tier', () => {
      expect(synthesizeItem(block('Show\n    Tier == Elite\n')).tier).toBe('Elite')
    })
  })

  describe('booleans and string lists', () => {
    it('sets booleans only for `==`', () => {
      expect(synthesizeItem(block('Show\n    Ethereal == True\n')).ethereal).toBe(
        true,
      )
      // `!=` is intentionally not synthesized (matcher passes it through).
      expect(
        synthesizeItem(block('Show\n    Ethereal != True\n')).ethereal,
      ).toBeUndefined()
    })

    it('takes the first value of ItemType / ItemName and all affixes', () => {
      const b = block(
        'Show\n    ItemType "Rings" "Amulets"\n    ItemName "Stone of Jordan"\n    HasAffix "of the Whale" "Cruel"\n',
      )
      const item = synthesizeItem(b)
      expect(item.itemType).toBe('Rings')
      expect(item.itemName).toBe('Stone of Jordan')
      expect(item.affixes).toEqual(['of the Whale', 'Cruel'])
    })
  })

  // The core invariant the per-row preview relies on: the synthesized item must
  // satisfy the very block it was built from, across every operator family.
  describe('synthesized item satisfies its source block', () => {
    it.each([
      'Show\n    Rarity == Unique\n    ItemType "Body Armors"\n',
      'Show\n    Rarity != Rare\n    Tier == Elite\n',
      'Show\n    Rarity > Magic\n    ItemLevel >= 75\n    Sockets < 4\n',
      'Show\n    ItemType "Runeword Pattern"\n    Rarity >= Epic\n',
      'Show\n    Ethereal == True\n    Identified == False\n    AreaLevel > 80\n',
      'Show\n    ItemName "Ber"\n    ItemType "High Runes"\n',
    ])('%s', (text) => {
      const b = block(text)
      expect(matchesBlock(b, synthesizeItem(b))).toBe(true)
    })
  })
})
