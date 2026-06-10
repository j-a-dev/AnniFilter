import { describe, it, expect } from 'vitest'
import { parse } from '@/engine/parser'
import { previewActionsForBlock } from '@/engine/preview'
import type { Action } from '@/engine/types'

const keywords = (actions: Action[]) => actions.map((a) => a.keyword)

describe('previewActionsForBlock', () => {
  it('includes a matching earlier Style block in the cascade', () => {
    const doc = parse(
      'Style\n    Rarity == Unique\n    SetBorderColor 255 215 0\n' +
        'Show\n    Rarity == Unique\n    ItemType "Body Armors"\n    SetTextColor Gold\n',
    ).document
    const target = doc.blocks[1]!
    const actions = previewActionsForBlock(doc, target.id)
    expect(keywords(actions)).toEqual(
      expect.arrayContaining(['SetBorderColor', 'SetTextColor']),
    )
  })

  it('excludes an earlier block that does not match the target item', () => {
    const doc = parse(
      'Style\n    Rarity == Normal\n    SetBorderColor 100 100 100\n' +
        'Show\n    Rarity == Unique\n    SetTextColor Gold\n',
    ).document
    const target = doc.blocks[1]!
    const actions = previewActionsForBlock(doc, target.id)
    expect(keywords(actions)).toEqual(['SetTextColor'])
  })

  it('skips disabled blocks', () => {
    const doc = parse(
      '# Style\n#     Rarity == Unique\n#     SetBorderColor 255 215 0\n' +
        'Show\n    Rarity == Unique\n    SetTextColor Gold\n',
    ).document
    const target = doc.blocks.find((b) => b.enabled)!
    expect(keywords(previewActionsForBlock(doc, target.id))).toEqual([
      'SetTextColor',
    ])
  })

  it('returns [] for an unknown target id', () => {
    const doc = parse('Show\n    Rarity == Unique\n').document
    expect(previewActionsForBlock(doc, 'nope')).toEqual([])
  })

  describe('option gating', () => {
    const doc = parse(
      '@Option "x" "X" true\n' +
        '@OptionBegin "x"\n' +
        'Style\n    Rarity == Unique\n    SetBorderColor 1 2 3\n' +
        '@OptionEnd\n' +
        'Show\n    Rarity == Unique\n    SetTextColor Gold\n',
    ).document
    const target = () => doc.blocks.find((b) => b.optionId === undefined)!

    it('includes a gated Style when its option is on (default)', () => {
      expect(keywords(previewActionsForBlock(doc, target().id))).toEqual(
        expect.arrayContaining(['SetBorderColor', 'SetTextColor']),
      )
    })

    it('excludes a gated Style when its option is toggled off', () => {
      const states = new Map([['x', false]])
      expect(
        keywords(previewActionsForBlock(doc, target().id, states)),
      ).toEqual(['SetTextColor'])
    })
  })
})
