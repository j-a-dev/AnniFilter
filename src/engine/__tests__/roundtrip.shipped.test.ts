import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { parse } from '@/engine/parser'
import { generate } from '@/engine/generator'

// Vitest runs with cwd = project root, so paths are project-relative.
const REGULAR = "samples/lenzy's filter_regular.filter"
const STRICT = "samples/lenzy's filter_strict.filter"

describe('round-trip identity on shipped filters', () => {
  it('lenzy\'s filter_regular: parse → generate → parse deep-equals first parse', () => {
    const text = readFileSync(REGULAR, 'utf8')
    const a = parse(text).document
    const regenerated = generate(a)
    const b = parse(regenerated).document
    expect(b).toEqual(a)
  })

  it('lenzy\'s filter_strict: parse → generate → parse deep-equals first parse', () => {
    const text = readFileSync(STRICT, 'utf8')
    const a = parse(text).document
    const regenerated = generate(a)
    const b = parse(regenerated).document
    expect(b).toEqual(a)
  })
})
