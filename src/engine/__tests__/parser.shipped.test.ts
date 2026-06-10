import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parse } from '@/engine/parser'

// Resolve relative to this file, not process.cwd(), so the tests don't break
// if the runner is launched from a different directory.
const SAMPLES = join(dirname(fileURLToPath(import.meta.url)), '../../../samples')
const REGULAR = join(SAMPLES, "lenzy's filter_regular.filter")
const STRICT = join(SAMPLES, "lenzy's filter_strict.filter")

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

  it('preserves all 4 PlayAlertSound entries on the Show #High Runes block', () => {
    const text = readFileSync(REGULAR, 'utf8')
    const { document } = parse(text)
    const showHighRunes = document.blocks.find(
      (b) => b.kind === 'Show' && b.label === 'High Runes',
    )
    expect(showHighRunes).toBeDefined()
    const sounds = showHighRunes?.actions.filter(
      (a) => a.keyword === 'PlayAlertSound',
    )
    expect(sounds).toHaveLength(4)
    expect(sounds?.map((s) => (s.keyword === 'PlayAlertSound' ? s.soundId : -1))).toEqual([16, 17, 18, 19])
  })
})
