import { describe, it, expect } from 'vitest'
import { parse } from '@/engine/parser'

describe('parser', () => {
  describe('block headers', () => {
    it('recognizes Show / Hide / Style', () => {
      const text = `Show\nHide\nStyle\n`
      const { document } = parse(text)
      expect(document.blocks.map((b) => b.kind)).toEqual([
        'Show',
        'Hide',
        'Style',
      ])
    })

    it('extracts trailing-comment label on header', () => {
      const text = `Show #my custom rule\n    ItemType "Runes"\n`
      const { document } = parse(text)
      expect(document.blocks).toHaveLength(1)
      expect(document.blocks[0]?.label).toBe('my custom rule')
    })

    it('assigns deterministic parsed-{index} IDs', () => {
      const text = `Show\n\nHide\n\nStyle\n`
      const { document } = parse(text)
      expect(document.blocks.map((b) => b.id)).toEqual([
        'parsed-0',
        'parsed-1',
        'parsed-2',
      ])
    })

    it('produces identical IDs across re-parses (round-trip identity)', () => {
      const text = `Show\nHide\n`
      const a = parse(text).document
      const b = parse(text).document
      expect(a.blocks.map((x) => x.id)).toEqual(b.blocks.map((x) => x.id))
    })
  })

  describe('conditions', () => {
    it('parses Rarity with comparison operator', () => {
      const text = `Show\n    Rarity == Rare\n`
      const { document } = parse(text)
      const block = document.blocks[0]
      expect(block?.conditions).toEqual([
        { keyword: 'Rarity', op: '==', value: 'Rare' },
      ])
    })

    it('parses Rarity with quoted value and ordering operator', () => {
      const text = `Show\n    Rarity <= "Rare"\n`
      const { document } = parse(text)
      expect(document.blocks[0]?.conditions).toEqual([
        { keyword: 'Rarity', op: '<=', value: 'Rare' },
      ])
    })

    it('parses Tier with enum value', () => {
      const text = `Show\n    Tier == Elite\n`
      const { document } = parse(text)
      expect(document.blocks[0]?.conditions).toEqual([
        { keyword: 'Tier', op: '==', value: 'Elite' },
      ])
    })

    it('parses numeric conditions', () => {
      const text = `Show\n    ItemLevel >= 75\n    Sockets == 6\n`
      const { document } = parse(text)
      expect(document.blocks[0]?.conditions).toEqual([
        { keyword: 'ItemLevel', op: '>=', value: 75 },
        { keyword: 'Sockets', op: '==', value: 6 },
      ])
    })

    it('parses boolean conditions accepting True/false case variants', () => {
      const text = `Show\n    Ethereal == True\n    Identified == false\n`
      const { document } = parse(text)
      expect(document.blocks[0]?.conditions).toEqual([
        { keyword: 'Ethereal', op: '==', value: true },
        { keyword: 'Identified', op: '==', value: false },
      ])
    })

    it('parses extension conditions: AffixCount, PrefixTier, SuffixTier, QuestItem', () => {
      const text = `Show\n    AffixCount >= 2\n    PrefixTier == 1\n    SuffixTier <= 1\n    QuestItem == True\n`
      const { document } = parse(text)
      expect(document.blocks[0]?.conditions).toEqual([
        { keyword: 'AffixCount', op: '>=', value: 2 },
        { keyword: 'PrefixTier', op: '==', value: 1 },
        { keyword: 'SuffixTier', op: '<=', value: 1 },
        { keyword: 'QuestItem', op: '==', value: true },
      ])
    })

    it('parses ItemType with multiple quoted values', () => {
      const text = `Show\n    ItemType "Runes" "High Runes" "Riftstone"\n`
      const { document } = parse(text)
      expect(document.blocks[0]?.conditions).toEqual([
        { keyword: 'ItemType', values: ['Runes', 'High Runes', 'Riftstone'] },
      ])
    })

    it('parses ItemType with bare and mixed quoted values', () => {
      const text = `Show\n    ItemType Jewels "High Runes"\n`
      const { document } = parse(text)
      expect(document.blocks[0]?.conditions).toEqual([
        { keyword: 'ItemType', values: ['Jewels', 'High Runes'] },
      ])
    })

    it('parses ItemName with multiple values', () => {
      const text = `Show\n    ItemName "Eth" "Gul" "Ist"\n`
      const { document } = parse(text)
      expect(document.blocks[0]?.conditions).toEqual([
        { keyword: 'ItemName', values: ['Eth', 'Gul', 'Ist'] },
      ])
    })

    it('parses HasAffix', () => {
      const text = `Show\n    HasAffix "Maroon" "of Everliving"\n`
      const { document } = parse(text)
      expect(document.blocks[0]?.conditions).toEqual([
        {
          keyword: 'HasAffix',
          values: ['Maroon', 'of Everliving'],
        },
      ])
    })
  })

  describe('actions', () => {
    it('parses RGB colors', () => {
      const text = `Show\n    SetBorderColor 200 0 200\n    SetBackgroundColor 25 25 25\n`
      const { document } = parse(text)
      expect(document.blocks[0]?.actions).toEqual([
        { keyword: 'SetBorderColor', r: 200, g: 0, b: 200 },
        { keyword: 'SetBackgroundColor', r: 25, g: 25, b: 25 },
      ])
    })

    it('parses palette text color', () => {
      const text = `Show\n    SetTextColor White\n`
      const { document } = parse(text)
      expect(document.blocks[0]?.actions).toEqual([
        { keyword: 'SetTextColor', color: 'White' },
      ])
    })

    it('parses font and blend mode', () => {
      const text = `Show\n    SetFont Font24\n    SetBlendMode Alpha75\n`
      const { document } = parse(text)
      expect(document.blocks[0]?.actions).toEqual([
        { keyword: 'SetFont', font: 'Font24' },
        { keyword: 'SetBlendMode', mode: 'Alpha75' },
      ])
    })

    it('parses template-string actions with placeholders', () => {
      const text = `Show\n    PrependText "{Red}[T1] "\n    SetItemName "{Purple}{Original}"\n`
      const { document } = parse(text)
      expect(document.blocks[0]?.actions).toEqual([
        { keyword: 'PrependText', template: '{Red}[T1] ' },
        { keyword: 'SetItemName', template: '{Purple}{Original}' },
      ])
    })

    it('parses ChatNotification (extension)', () => {
      const text = `Show\n    ChatNotification "{Gold}{Original}"\n`
      const { document } = parse(text)
      expect(document.blocks[0]?.actions).toEqual([
        { keyword: 'ChatNotification', template: '{Gold}{Original}' },
      ])
    })

    it('parses PlayAlertSound', () => {
      const text = `Show\n    PlayAlertSound 11\n`
      const { document } = parse(text)
      expect(document.blocks[0]?.actions).toEqual([
        { keyword: 'PlayAlertSound', soundId: 11 },
      ])
    })

    it('parses MinimapIcon with size and color', () => {
      const text = `Show\n    MinimapIcon 2 200 0 200\n`
      const { document } = parse(text)
      expect(document.blocks[0]?.actions).toEqual([
        { keyword: 'MinimapIcon', size: 2, r: 200, g: 0, b: 200 },
      ])
    })

    it('warns and continues on unterminated template strings', () => {
      const text = `Show\n    AppendText " {Red}[T1 %fire res]\n`
      const { document, issues } = parse(text)
      expect(document.blocks[0]?.actions).toHaveLength(1)
      expect(issues.find((i) => i.code === 'unterminated-string')).toBeDefined()
    })
  })

  describe('comments and structure', () => {
    it('collects preamble comment lines', () => {
      const text = `# Filter for Annihilus\n# Author: lenzy\nShow\n    ItemType "Runes"\n`
      const { document } = parse(text)
      expect(document.preamble).toEqual([
        'Filter for Annihilus',
        'Author: lenzy',
      ])
      expect(document.blocks).toHaveLength(1)
    })

    it('collects intra-block comments without preserving position', () => {
      const text = `Show\n    # this is a note\n    ItemType "Runes"\n    # another note\n    SetTextColor White\n`
      const { document } = parse(text)
      const block = document.blocks[0]
      expect(block?.intraBlockComments).toEqual(['this is a note', 'another note'])
      expect(block?.conditions).toHaveLength(1)
      expect(block?.actions).toHaveLength(1)
    })

    it('separates multiple blocks by blank lines', () => {
      const text = `Show\n    ItemType "Runes"\n\nHide\n    Rarity == Normal\n`
      const { document } = parse(text)
      expect(document.blocks).toHaveLength(2)
      expect(document.blocks[0]?.kind).toBe('Show')
      expect(document.blocks[1]?.kind).toBe('Hide')
    })

    it('reconstructs disabled blocks as enabled: false', () => {
      const text = `# Show #commented out rule\n#     ItemType "Test"\n#     SetTextColor Red\n`
      const { document } = parse(text)
      expect(document.blocks).toHaveLength(1)
      const block = document.blocks[0]
      expect(block?.enabled).toBe(false)
      expect(block?.kind).toBe('Show')
      expect(block?.label).toBe('commented out rule')
      expect(block?.conditions).toEqual([
        { keyword: 'ItemType', values: ['Test'] },
      ])
      expect(block?.actions).toEqual([
        { keyword: 'SetTextColor', color: 'Red' },
      ])
    })
  })

  describe('edge cases', () => {
    it('returns empty document on empty input', () => {
      const { document } = parse('')
      expect(document.blocks).toEqual([])
      expect(document.preamble).toEqual([])
      expect(document.trailingComments).toEqual([])
      expect(document.presets).toEqual([])
    })

    it('preserves unknown keywords as Unknown actions with passthrough', () => {
      const text = `Show\n    NewMagicKeyword foo bar\n`
      const { document, issues } = parse(text)
      expect(document.blocks[0]?.actions).toEqual([
        { keyword: 'Unknown', raw: 'NewMagicKeyword foo bar' },
      ])
      expect(issues.find((i) => i.code === 'unknown-keyword')).toBeDefined()
    })

    it('tolerates any indentation', () => {
      const text = `Show\n\tItemType "Runes"\n      SetTextColor White\n  PlayAlertSound 11\n`
      const { document } = parse(text)
      expect(document.blocks[0]?.conditions).toHaveLength(1)
      expect(document.blocks[0]?.actions).toHaveLength(2)
    })
  })
})
