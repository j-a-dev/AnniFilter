import { describe, it, expect } from 'vitest'
import { parse } from '@/engine/parser'
import { match } from '@/engine/matcher'

function fixture(text: string) {
  return parse(text).document
}

describe('matcher — option gating', () => {
  // A Hide gated by option "h"; a fallback Show. With "h" on, the item is
  // hidden; with "h" off, the Hide is skipped and the Show wins.
  const doc = fixture(
    [
      '@Option "h" "Hide runes" true',
      '@OptionBegin "h"',
      'Hide',
      '    ItemType "Runes"',
      '@OptionEnd',
      'Show',
    ].join('\n'),
  )

  it('uses the declared default (on) when no states are given', () => {
    const res = match(doc, { itemType: 'Runes' })
    expect(res.terminator?.kind).toBe('Hide')
    expect(res.visible).toBe(false)
  })

  it('skips the gated block when its option is toggled off', () => {
    const res = match(doc, { itemType: 'Runes' }, new Map([['h', false]]))
    expect(res.terminator?.kind).toBe('Show')
    expect(res.visible).toBe(true)
  })

  it('keeps the gated block when its option is explicitly on', () => {
    const res = match(doc, { itemType: 'Runes' }, new Map([['h', true]]))
    expect(res.terminator?.kind).toBe('Hide')
  })

  it('respects a default-off option without any state override', () => {
    const offByDefault = fixture(
      [
        '@Option "h" "Hide runes" false',
        '@OptionBegin "h"',
        'Hide',
        '    ItemType "Runes"',
        '@OptionEnd',
        'Show',
      ].join('\n'),
    )
    const res = match(offByDefault, { itemType: 'Runes' })
    expect(res.terminator?.kind).toBe('Show')
  })

  it('ANDs gating with the block enabled flag (disabled stays skipped)', () => {
    const disabledGated = fixture(
      [
        '@Option "h" "x" true',
        '@OptionBegin "h"',
        '# Hide',
        '#     ItemType "Runes"',
        '@OptionEnd',
        'Show',
      ].join('\n'),
    )
    // Even with the option on, the block is disabled → skipped.
    const res = match(disabledGated, { itemType: 'Runes' }, new Map([['h', true]]))
    expect(res.terminator?.kind).toBe('Show')
  })

  it('leaves ungated blocks unaffected by option states', () => {
    const ungated = fixture('Hide\n    ItemType "Runes"\nShow')
    const res = match(ungated, { itemType: 'Runes' }, new Map([['h', false]]))
    expect(res.terminator?.kind).toBe('Hide')
  })
})
