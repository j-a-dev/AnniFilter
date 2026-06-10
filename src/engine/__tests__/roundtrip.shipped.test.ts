import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parse } from '@/engine/parser'
import { generate } from '@/engine/generator'

// Resolve relative to this file, not process.cwd(), so the tests don't break
// if the runner is launched from a different directory.
const SAMPLES = join(dirname(fileURLToPath(import.meta.url)), '../../../samples')
const REGULAR = join(SAMPLES, "lenzy's filter_regular.filter")
const STRICT = join(SAMPLES, "lenzy's filter_strict.filter")

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
