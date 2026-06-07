import { describe, it, expect } from 'vitest'
import { parse } from '@/engine/parser'
import { validate } from '@/engine/validator'

function validateText(text: string) {
  return validate(parse(text).document)
}

describe('validator — option sets', () => {
  it('warns when an option gates no rules', () => {
    const issues = validateText('@Option "unused" "x" true\nShow')
    expect(issues.some((i) => i.code === 'option-declared-unused')).toBe(true)
  })

  it('does not warn when an option gates at least one rule', () => {
    const issues = validateText(
      [
        '@Option "used" "x" true',
        '@OptionBegin "used"',
        'Show',
        '@OptionEnd',
      ].join('\n'),
    )
    expect(issues.filter((i) => i.code === 'option-declared-unused')).toEqual([])
  })

  it('warns when a category contains no options', () => {
    // "free" is uncategorized (declared before the category); "Empty" follows
    // with no options under it.
    const issues = validateText(
      '@Option "free" "x" true\n@Category "Empty"\nShow',
    )
    expect(issues.some((i) => i.code === 'category-empty')).toBe(true)
  })

  it('does not warn for a category that has options', () => {
    const issues = validateText(
      '@Category "Full"\n@Option "g1" "x" true\n@OptionBegin "g1"\nShow\n@OptionEnd',
    )
    expect(issues.filter((i) => i.code === 'category-empty')).toEqual([])
  })
})
