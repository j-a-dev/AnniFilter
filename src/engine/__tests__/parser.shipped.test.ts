import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from '@/engine/parser'

const REGULAR = resolve(
  __dirname,
  '../../../samples/lenzy\'s filter_regular.filter',
)
const STRICT = resolve(
  __dirname,
  '../../../samples/lenzy\'s filter_strict.filter',
)

describe('parser: shipped filters smoke test', () => {
  it('parses lenzy\'s filter_regular.filter without throwing', () => {
    const text = readFileSync(REGULAR, 'utf8')
    const { document, issues } = parse(text)
    // Sanity: real filters have ~150+ blocks each
    expect(document.blocks.length).toBeGreaterThan(50)
    // Most issues should be unknown-keyword warnings (no errors)
    const errors = issues.filter((i) => i.level === 'error')
    expect(errors).toEqual([])
  })

  it('parses lenzy\'s filter_strict.filter without throwing', () => {
    const text = readFileSync(STRICT, 'utf8')
    const { document, issues } = parse(text)
    expect(document.blocks.length).toBeGreaterThan(50)
    const errors = issues.filter((i) => i.level === 'error')
    expect(errors).toEqual([])
  })

  it('produces only known warning categories on shipped filters', () => {
    const text = readFileSync(REGULAR, 'utf8')
    const { issues } = parse(text)
    const codes = new Set(issues.map((i) => i.code))
    const knownWarningCodes = new Set([
      'unknown-keyword',
      'unterminated-string',
    ])
    for (const c of codes) {
      expect(knownWarningCodes.has(c), `unexpected issue code: ${c}`).toBe(true)
    }
  })
})
