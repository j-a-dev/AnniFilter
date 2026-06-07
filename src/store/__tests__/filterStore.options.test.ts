import { describe, it, expect, beforeEach } from 'vitest'
import { useFilterStore } from '@/store/filterStore'
import { useUIStore } from '@/store/uiStore'

function get() {
  return useFilterStore.getState()
}

describe('filterStore: option-set mutations', () => {
  beforeEach(() => {
    get().loadFromText('')
  })

  it('updateMetadata merges into document.metadata and marks dirty', () => {
    get().updateMetadata({ name: 'My Filter', author: 'Me' })
    expect(get().document.metadata.name).toBe('My Filter')
    expect(get().document.metadata.author).toBe('Me')
    expect(get().document.metadata.descriptions).toEqual([])
    expect(get().dirty).toBe(true)
    expect(get().rawText).toContain('@Name "My Filter"')
  })

  it('setOptions / setOptionCategories replace the arrays and regenerate', () => {
    get().setOptions([{ id: 'opt1', label: 'Cool', defaultOn: true }])
    get().setOptionCategories([{ name: 'Cat' }])
    expect(get().document.options).toHaveLength(1)
    expect(get().rawText).toContain('@Option "opt1" "Cool" true')
  })

  it('setBlockOptionId sets and clears a block gate, reflected in rawText', () => {
    get().setOptions([{ id: 'opt1', label: 'x', defaultOn: true }])
    const id = get().addBlock('Show')
    get().setBlockOptionId(id, 'opt1')
    expect(get().document.blocks[0]?.optionId).toBe('opt1')
    expect(get().rawText).toContain('@OptionBegin "opt1"')

    get().setBlockOptionId(id, undefined)
    expect(get().document.blocks[0]?.optionId).toBeUndefined()
    expect('optionId' in (get().document.blocks[0] ?? {})).toBe(false)
    expect(get().rawText).not.toContain('@OptionBegin')
  })
})

describe('filterStore: fatal load handling', () => {
  beforeEach(() => {
    get().loadFromText('')
  })

  it('refuses a structurally-broken filter, keeps the current document, sets loadError', () => {
    // Seed a known-good document first.
    get().loadFromText('Show\n    ItemType "Runes"')
    const before = get().document
    expect(get().loadError).toBeNull()

    // Now attempt to load a filter with an undeclared @OptionBegin.
    get().loadFromText('@OptionBegin "ghost"\nShow\n@OptionEnd')
    expect(get().loadError).toMatch(/Line \d+:/)
    // Document is untouched.
    expect(get().document).toBe(before)
  })

  it('clears loadError on the next successful load', () => {
    get().loadFromText('@OptionEnd')
    expect(get().loadError).not.toBeNull()
    get().loadFromText('Show')
    expect(get().loadError).toBeNull()
  })

  it('resets simulation option states on a successful load', () => {
    useUIStore.getState().setOptionState('stale', false)
    expect(useUIStore.getState().optionStates.size).toBe(1)
    get().loadFromText('Show')
    expect(useUIStore.getState().optionStates.size).toBe(0)
  })
})
