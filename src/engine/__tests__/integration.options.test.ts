import { describe, it, expect } from 'vitest'
import { parse } from '@/engine/parser'
import { generate } from '@/engine/generator'
import { match } from '@/engine/matcher'
import { validate } from '@/engine/validator'

// A realistic filter shaped like the dev example: metadata, uncategorized +
// grouped options, and a region gating a Hide rule behind one option.
const FILTER = [
  '@Name "Demo Filter"',
  '@Author Lenzy',
  '@Version 1.0',
  '@Description "A demo"',
  '@Option "show-all" "Show everything" true',
  '@Category "Cleanup"',
  '@Option "hide-normals" "Hide normal items" true',
  '',
  '@OptionBegin "hide-normals"',
  'Hide',
  '    Rarity == Normal',
  '@OptionEnd',
  'Show',
].join('\n')

describe('option sets — full-stack integration', () => {
  it('parses the whole document structure with no fatal error', () => {
    const { document, fatalError } = parse(FILTER)
    expect(fatalError).toBeNull()
    expect(document.metadata).toEqual({
      name: 'Demo Filter',
      author: 'Lenzy',
      version: '1.0',
      descriptions: ['A demo'],
    })
    expect(document.options).toEqual([
      { id: 'show-all', label: 'Show everything', defaultOn: true },
      {
        id: 'hide-normals',
        label: 'Hide normal items',
        defaultOn: true,
        categoryName: 'Cleanup',
      },
    ])
    expect(document.optionCategories).toEqual([{ name: 'Cleanup' }])
    // The Hide block is gated; the trailing Show is not.
    expect(document.blocks.map((b) => b.optionId)).toEqual(['hide-normals', undefined])
  })

  it('regenerates idempotently and preserves directive order', () => {
    const doc = parse(FILTER).document
    const once = generate(doc)
    const twice = generate(parse(once).document)
    expect(twice).toBe(once)
    // Canonical layout: metadata, uncategorized option, category + its option.
    expect(once.indexOf('@Name')).toBeLessThan(once.indexOf('@Option "show-all"'))
    expect(once.indexOf('@Option "show-all"')).toBeLessThan(once.indexOf('@Category'))
    expect(once.indexOf('@Category "Cleanup"')).toBeLessThan(
      once.indexOf('@Option "hide-normals"'),
    )
    expect(once).toContain('@OptionBegin "hide-normals"')
    expect(once).toContain('@OptionEnd')
  })

  it('gating changes match outcome when the option is toggled', () => {
    const doc = parse(FILTER).document
    const normalItem = { rarity: 'Normal' as const, tier: 'Normal' as const }

    // Default (hide-normals on): the Normal item is hidden.
    expect(match(doc, normalItem).visible).toBe(false)

    // Toggle hide-normals off: the Hide is skipped, the Show wins → visible.
    expect(match(doc, normalItem, new Map([['hide-normals', false]])).visible).toBe(true)
  })

  it('flags the unused option but raises no errors', () => {
    const issues = validate(parse(FILTER).document)
    expect(issues.some((i) => i.code === 'option-declared-unused')).toBe(true) // show-all
    expect(issues.filter((i) => i.level === 'error')).toEqual([])
  })
})
