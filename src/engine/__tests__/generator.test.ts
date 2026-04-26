import { describe, it, expect } from 'vitest'
import { parse } from '@/engine/parser'
import { generate } from '@/engine/generator'
import type { FilterDocument } from '@/engine/types'

function roundtrip(text: string): FilterDocument {
  const first = parse(text).document
  const regenerated = generate(first)
  const second = parse(regenerated).document
  return second
}

describe('generator', () => {
  describe('basic emission', () => {
    it('emits a Show block with conditions and actions', () => {
      const doc: FilterDocument = {
        blocks: [
          {
            id: 'parsed-0',
            kind: 'Show',
            enabled: true,
            conditions: [{ keyword: 'ItemType', values: ['Runes'] }],
            actions: [{ keyword: 'SetTextColor', color: 'White' }],
            intraBlockComments: [],
          },
        ],
        presets: [],
        preamble: [],
        trailingComments: [],
      }
      const text = generate(doc)
      expect(text).toContain('Show')
      expect(text).toContain('ItemType "Runes"')
      expect(text).toContain('SetTextColor "White"')
      expect(text.endsWith('\n')).toBe(true)
    })

    it('emits header label as #label', () => {
      const doc: FilterDocument = {
        blocks: [
          {
            id: 'parsed-0',
            kind: 'Style',
            enabled: true,
            label: 'rare item border',
            conditions: [],
            actions: [],
            intraBlockComments: [],
          },
        ],
        presets: [],
        preamble: [],
        trailingComments: [],
      }
      expect(generate(doc)).toContain('Style #rare item border')
    })

    it('emits disabled blocks with #-prefixed lines', () => {
      const doc: FilterDocument = {
        blocks: [
          {
            id: 'parsed-0',
            kind: 'Show',
            enabled: false,
            conditions: [{ keyword: 'ItemType', values: ['Test'] }],
            actions: [{ keyword: 'SetTextColor', color: 'Red' }],
            intraBlockComments: [],
          },
        ],
        presets: [],
        preamble: [],
        trailingComments: [],
      }
      const text = generate(doc)
      expect(text).toContain('# Show')
      expect(text).toContain('# \tItemType "Test"')
      expect(text).toContain('# \tSetTextColor "Red"')
    })

    it('emits tab indent for body lines', () => {
      const doc: FilterDocument = {
        blocks: [
          {
            id: 'parsed-0',
            kind: 'Show',
            enabled: true,
            conditions: [{ keyword: 'ItemType', values: ['Runes'] }],
            actions: [],
            intraBlockComments: [],
          },
        ],
        presets: [],
        preamble: [],
        trailingComments: [],
      }
      expect(generate(doc)).toContain('\tItemType "Runes"')
    })
  })

  describe('round-trip identity', () => {
    it('round-trips a simple Show block', () => {
      const text = `Show\n    ItemType "Runes"\n    SetTextColor White\n`
      const a = parse(text).document
      const b = roundtrip(text)
      expect(b).toEqual(a)
    })

    it('round-trips multiple blocks separated by blank lines', () => {
      const text = `Show\n    ItemType "Runes"\n\nHide\n    Rarity == Normal\n`
      const a = parse(text).document
      const b = roundtrip(text)
      expect(b).toEqual(a)
    })

    it('round-trips a complex block with all action types', () => {
      const text = [
        'Show #my label',
        '    ItemType "Body Armors" "Helmets"',
        '    Rarity == Rare',
        '    ItemLevel >= 75',
        '    SetBorderColor 255 255 0',
        '    SetBackgroundColor 25 25 25',
        '    SetTextColor White',
        '    SetFont Font24',
        '    SetBlendMode Alpha75',
        '    SetItemName "{Purple}{Original}"',
        '    PrependText "[T1] "',
        '    AppendText " #"',
        '    PlayAlertSound 11',
        '    MinimapIcon 2 200 0 200',
        '    ChatNotification "{Gold}{Original}"',
        '',
      ].join('\n')
      const a = parse(text).document
      const b = roundtrip(text)
      expect(b).toEqual(a)
    })

    it('round-trips boolean conditions', () => {
      const text = `Show\n    Ethereal == True\n    Identified == False\n    QuestItem == True\n`
      const a = parse(text).document
      const b = roundtrip(text)
      expect(b).toEqual(a)
    })

    it('round-trips disabled blocks', () => {
      const text = `# Show #commented\n#     ItemType "Test"\n#     SetTextColor Red\n`
      const a = parse(text).document
      const b = roundtrip(text)
      expect(b).toEqual(a)
    })

    it('round-trips preamble + trailing comments', () => {
      const text = `# Header note\n# Author: lenzy\nShow\n    ItemType "Runes"\n\n# Trailing note\n`
      const a = parse(text).document
      const b = roundtrip(text)
      expect(b).toEqual(a)
    })

    it('round-trips intra-block comments (positions discarded but content preserved)', () => {
      const text = `Show\n    # note one\n    ItemType "Runes"\n    # note two\n    SetTextColor White\n`
      const a = parse(text).document
      const b = roundtrip(text)
      expect(b).toEqual(a)
    })

    it('round-trips unknown keywords as opaque passthrough', () => {
      const text = `Show\n    NewMagicKeyword foo bar\n    AnotherUnknown 1 2 3\n`
      const a = parse(text).document
      const b = roundtrip(text)
      expect(b.blocks[0]?.actions).toEqual(a.blocks[0]?.actions)
    })
  })
})
