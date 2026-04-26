import { describe, it, expect } from 'vitest'
import { parse } from '@/engine/parser'
import { validate } from '@/engine/validator'

function validateText(text: string) {
  return validate(parse(text).document)
}

describe('validator', () => {
  describe('rarity', () => {
    it('accepts base rarities', () => {
      const issues = validateText(
        `Show\n    Rarity == Rare\n    Rarity == Normal\n`,
      )
      expect(issues.filter((i) => i.code === 'unknown-rarity')).toEqual([])
    })

    it('accepts runeword rarities only inside Runeword Pattern context', () => {
      const okText = `Show\n    ItemType "Runeword Pattern"\n    Rarity == Mythic\n`
      expect(validateText(okText).filter((i) => i.code === 'unknown-rarity')).toEqual([])

      const badText = `Show\n    Rarity == Mythic\n`
      const bad = validateText(badText)
      expect(bad.filter((i) => i.code === 'unknown-rarity').length).toBeGreaterThan(0)
    })

    it('flags unknown rarity tokens', () => {
      const issues = validateText(`Show\n    Rarity == Bogus\n`)
      expect(issues.find((i) => i.code === 'unknown-rarity')).toBeDefined()
    })
  })

  describe('itemtype', () => {
    it('accepts all wiki-listed types', () => {
      const issues = validateText(
        `Show\n    ItemType "Body Armors" "Helmets" "Runes" "Riftstone"\n`,
      )
      expect(issues.filter((i) => i.code === 'unknown-itemtype')).toEqual([])
    })

    it('warns on unknown type', () => {
      const issues = validateText(`Show\n    ItemType "MagicalArtifact"\n`)
      expect(issues.find((i) => i.code === 'unknown-itemtype')).toBeDefined()
    })
  })

  describe('palette / font / blend', () => {
    it('accepts wiki palette colors', () => {
      const issues = validateText(`Show\n    SetTextColor White\n`)
      expect(issues.filter((i) => i.code === 'unknown-color')).toEqual([])
    })

    it('warns on unknown palette color', () => {
      const issues = validateText(`Show\n    SetTextColor Fuchsia\n`)
      expect(issues.find((i) => i.code === 'unknown-color')).toBeDefined()
    })

    it('warns on unknown font', () => {
      const issues = validateText(`Show\n    SetFont Helvetica\n`)
      expect(issues.find((i) => i.code === 'unknown-font')).toBeDefined()
    })

    it('warns on unknown blend mode', () => {
      const issues = validateText(`Show\n    SetBlendMode Wibble\n`)
      expect(issues.find((i) => i.code === 'unknown-blend-mode')).toBeDefined()
    })
  })

  describe('rgb', () => {
    it('errors on out-of-range RGB', () => {
      const issues = validateText(`Show\n    SetBorderColor 300 0 0\n`)
      const err = issues.find((i) => i.code === 'rgb-out-of-range')
      expect(err).toBeDefined()
      expect(err?.level).toBe('error')
    })

    it('accepts in-range RGB', () => {
      const issues = validateText(`Show\n    SetBorderColor 200 0 200\n`)
      expect(issues.filter((i) => i.code === 'rgb-out-of-range')).toEqual([])
    })
  })

  describe('templates', () => {
    it('warns on unknown placeholders', () => {
      const issues = validateText(
        `Show\n    PrependText "{Bogus}{Original}"\n`,
      )
      expect(issues.find((i) => i.code === 'unknown-placeholder')).toBeDefined()
    })

    it('accepts color and standard placeholders', () => {
      const issues = validateText(
        `Show\n    PrependText "{Red}[T1] {Original} {Break}"\n`,
      )
      expect(
        issues.filter((i) => i.code === 'unknown-placeholder'),
      ).toEqual([])
    })

    it('accepts ShortItemName extension placeholder', () => {
      const issues = validateText(
        `Show\n    ChatNotification "{Gold}{ShortItemName}"\n`,
      )
      expect(
        issues.filter((i) => i.code === 'unknown-placeholder'),
      ).toEqual([])
    })
  })

  describe('alert sound', () => {
    it('flags out-of-range sound id as info-level', () => {
      const issues = validateText(`Show\n    PlayAlertSound 99\n`)
      const i = issues.find((x) => x.code === 'sound-out-of-range')
      expect(i?.level).toBe('info')
    })

    it('accepts 0–20 without warning', () => {
      const issues = validateText(`Show\n    PlayAlertSound 11\n`)
      expect(
        issues.filter((i) => i.code === 'sound-out-of-range'),
      ).toEqual([])
    })
  })
})
