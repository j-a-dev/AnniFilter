import { describe, it, expect } from 'vitest'
import { parse } from '@/engine/parser'
import { generate } from '@/engine/generator'

/** parse → generate → parse; the second document must equal the first. */
function roundtrip(text: string) {
  const first = parse(text).document
  const regenerated = generate(first)
  const second = parse(regenerated).document
  return { first, regenerated, second }
}

describe('round-trip — option sets', () => {
  it('round-trips metadata + multiple descriptions', () => {
    const text = [
      '@Name "Cool Filter"',
      '@Author Lenzy',
      '@Version 1.0',
      '@Description "line one"',
      '@Description "line two"',
      'Show',
    ].join('\n')
    const { first, second } = roundtrip(text)
    expect(second.metadata).toEqual(first.metadata)
    expect(second.metadata).toEqual({
      name: 'Cool Filter',
      author: 'Lenzy',
      version: '1.0',
      descriptions: ['line one', 'line two'],
    })
  })

  it('round-trips options + categories (uncategorized first, then grouped)', () => {
    const text = [
      '@Option "free1" "Free 1" true',
      '@Option "free2" "Free 2" false',
      '@Category "Test1"',
      '@Option "g1" "Grouped 1" true',
      '@Category "Test2"',
      '@Option "g2" "Grouped 2" true',
      'Show',
    ].join('\n')
    const { first, second } = roundtrip(text)
    expect(second.options).toEqual(first.options)
    expect(second.optionCategories).toEqual(first.optionCategories)
  })

  it('round-trips gated regions and coalesces consecutive same-id blocks', () => {
    const text = [
      '@Option "opt1" "x" true',
      'Show #outside',
      '@OptionBegin "opt1"',
      'Show #inside1',
      'Hide #inside2',
      '@OptionEnd',
      'Show #after',
    ].join('\n')
    const { first, regenerated, second } = roundtrip(text)
    expect(second.blocks.map((b) => b.optionId)).toEqual(
      first.blocks.map((b) => b.optionId),
    )
    expect(second.blocks.map((b) => b.optionId)).toEqual([
      undefined,
      'opt1',
      'opt1',
      undefined,
    ])
    // The two inside blocks share ONE region (coalesced), not two.
    expect(regenerated.match(/@OptionBegin/g)).toHaveLength(1)
    expect(regenerated.match(/@OptionEnd/g)).toHaveLength(1)
  })

  it('coalesces multiple authored same-id regions into one on regenerate', () => {
    const text = [
      '@Option "opt1" "x" true',
      '@OptionBegin "opt1"',
      'Show',
      '@OptionEnd',
      '@OptionBegin "opt1"',
      'Hide',
      '@OptionEnd',
    ].join('\n')
    const { regenerated, second } = roundtrip(text)
    expect(second.blocks.map((b) => b.optionId)).toEqual(['opt1', 'opt1'])
    expect(regenerated.match(/@OptionBegin/g)).toHaveLength(1)
  })

  it('preserves an unknown @-directive through the round-trip', () => {
    const text = '@Foobar "keep me"\nShow'
    const { second } = roundtrip(text)
    expect(second.unknownDirectives).toContain('@Foobar "keep me"')
  })

  it('emits the dev example layout: Name/Description quoted, Author/Version bare', () => {
    const doc = parse('@Name "X"\n@Author Lenzy\n@Version 1.0\n@Description "hi"\nShow').document
    const text = generate(doc)
    expect(text).toContain('@Name "X"')
    expect(text).toContain('@Author Lenzy')
    expect(text).toContain('@Version 1.0')
    expect(text).toContain('@Description "hi"')
  })

  it('regenerated output is itself byte-stable (idempotent on second pass)', () => {
    const text = [
      '@Name "Filter"',
      '@Option "opt1" "x" true',
      '@Category "Cat"',
      '@Option "opt2" "y" false',
      '@OptionBegin "opt1"',
      'Show',
      '@OptionEnd',
    ].join('\n')
    const once = generate(parse(text).document)
    const twice = generate(parse(once).document)
    expect(twice).toBe(once)
  })
})
