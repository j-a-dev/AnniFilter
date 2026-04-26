import { describe, it, expect } from 'vitest'
import { parse } from '@/engine/parser'
import { match } from '@/engine/matcher'
import type { ItemDescription } from '@/engine/types'

function fixture(text: string) {
  return parse(text).document
}

describe('matcher', () => {
  describe('Show / Hide termination', () => {
    it('first matching Show terminates', () => {
      const doc = fixture(
        `Show\n    ItemType "Runes"\nShow\n    ItemType "Riftstone"\n`,
      )
      const res = match(doc, { itemType: 'Runes' } satisfies ItemDescription)
      expect(res.terminator?.kind).toBe('Show')
      expect(res.visible).toBe(true)
    })

    it('first matching Hide terminates and sets visible=false', () => {
      const doc = fixture(
        `Hide\n    Rarity == Normal\n    Tier == Normal\nShow\n`,
      )
      const res = match(doc, { rarity: 'Normal', tier: 'Normal' })
      expect(res.terminator?.kind).toBe('Hide')
      expect(res.visible).toBe(false)
    })

    it('default visibility is true when nothing matches', () => {
      const doc = fixture(`Hide\n    Rarity == Unique\n`)
      const res = match(doc, { rarity: 'Normal' })
      expect(res.terminator).toBeNull()
      expect(res.visible).toBe(true)
    })

    it('disabled blocks are skipped', () => {
      const doc = fixture(
        `# Hide\n#     ItemType "Runes"\nShow\n    ItemType "Runes"\n`,
      )
      const res = match(doc, { itemType: 'Runes' })
      expect(res.terminator?.kind).toBe('Show')
    })
  })

  describe('Style stacking', () => {
    it('all matching Style blocks accumulate, last-wins per keyword', () => {
      const text = [
        'Style',
        '    Rarity == Rare',
        '    SetBorderColor 255 255 0',
        'Style',
        '    ItemLevel >= 75',
        '    SetBorderColor 0 255 0',
        'Show',
        '    Rarity == Rare',
        '',
      ].join('\n')
      const doc = fixture(text)
      const res = match(doc, { rarity: 'Rare', itemLevel: 80 })
      expect(res.styleStack.length).toBe(2)
      expect(res.terminator?.kind).toBe('Show')
      // Last-wins: green wins over yellow
      const border = res.effectiveActions.find(
        (a) => a.keyword === 'SetBorderColor',
      )
      expect(border).toEqual({
        keyword: 'SetBorderColor',
        r: 0,
        g: 255,
        b: 0,
      })
    })

    it('PlayAlertSound is preserved as multi-value (all entries kept in order)', () => {
      const text = [
        'Show',
        '    ItemType "High Runes"',
        '    PlayAlertSound 16',
        '    PlayAlertSound 17',
        '    PlayAlertSound 18',
        '',
      ].join('\n')
      const doc = fixture(text)
      const res = match(doc, { itemType: 'High Runes' })
      const sounds = res.effectiveActions.filter(
        (a) => a.keyword === 'PlayAlertSound',
      )
      expect(sounds).toHaveLength(3)
      expect(sounds.map((s) => (s.keyword === 'PlayAlertSound' ? s.soundId : -1))).toEqual([16, 17, 18])
    })
  })

  describe('condition evaluation', () => {
    it('evaluates Rarity ordering with base rarities', () => {
      const doc = fixture(`Show\n    Rarity >= Rare\n`)
      expect(match(doc, { rarity: 'Rare' }).terminator).not.toBeNull()
      expect(match(doc, { rarity: 'Unique' }).terminator).not.toBeNull()
      expect(match(doc, { rarity: 'Magic' }).terminator).toBeNull()
    })

    it('evaluates Rarity ordering with Runeword Pattern context', () => {
      const doc = fixture(
        `Show\n    ItemType "Runeword Pattern"\n    Rarity >= Epic\n`,
      )
      expect(
        match(doc, { itemType: 'Runeword Pattern', rarity: 'Mythic' }).terminator,
      ).not.toBeNull()
      expect(
        match(doc, { itemType: 'Runeword Pattern', rarity: 'Common' }).terminator,
      ).toBeNull()
    })

    it('evaluates Tier ordering', () => {
      const doc = fixture(`Show\n    Tier > Normal\n`)
      expect(match(doc, { tier: 'Elite' }).terminator).not.toBeNull()
      expect(match(doc, { tier: 'Normal' }).terminator).toBeNull()
    })

    it('evaluates numeric conditions', () => {
      const doc = fixture(`Show\n    ItemLevel >= 75\n    Sockets == 6\n`)
      expect(match(doc, { itemLevel: 80, sockets: 6 }).terminator).not.toBeNull()
      expect(match(doc, { itemLevel: 50, sockets: 6 }).terminator).toBeNull()
      expect(match(doc, { itemLevel: 80, sockets: 5 }).terminator).toBeNull()
    })

    it('evaluates boolean conditions', () => {
      const doc = fixture(`Show\n    Ethereal == True\n`)
      expect(match(doc, { ethereal: true }).terminator).not.toBeNull()
      expect(match(doc, { ethereal: false }).terminator).toBeNull()
    })

    it('evaluates ItemType membership', () => {
      const doc = fixture(`Show\n    ItemType "Runes" "Riftstone"\n`)
      expect(match(doc, { itemType: 'Runes' }).terminator).not.toBeNull()
      expect(match(doc, { itemType: 'Riftstone' }).terminator).not.toBeNull()
      expect(match(doc, { itemType: 'Helmets' }).terminator).toBeNull()
    })

    it('evaluates ItemName as substring', () => {
      const doc = fixture(`Show\n    ItemName "Eth"\n`)
      expect(match(doc, { itemName: 'Eth' }).terminator).not.toBeNull()
      expect(match(doc, { itemName: 'Ethereal Sword' }).terminator).not.toBeNull()
      expect(match(doc, { itemName: 'Zod' }).terminator).toBeNull()
    })

    it('evaluates HasAffix', () => {
      const doc = fixture(`Show\n    HasAffix "Maroon"\n`)
      expect(match(doc, { affixes: ['Maroon'] }).terminator).not.toBeNull()
      expect(match(doc, { affixes: ['of the Wolf'] }).terminator).toBeNull()
    })
  })
})
