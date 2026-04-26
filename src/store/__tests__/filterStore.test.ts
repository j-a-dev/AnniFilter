import { describe, it, expect, beforeEach } from 'vitest'
import { useFilterStore } from '@/store/filterStore'
import { parse } from '@/engine/parser'
import type { Action, Condition } from '@/engine/types'

function reset(text = '') {
  useFilterStore.getState().loadFromText(text)
}

function get() {
  return useFilterStore.getState()
}

describe('filterStore: block mutations', () => {
  beforeEach(() => {
    reset('')
  })

  describe('addBlock', () => {
    it('appends a new block to the end', () => {
      const id = get().addBlock('Show')
      expect(id).toMatch(/^mut-/)
      expect(get().document.blocks).toHaveLength(1)
      expect(get().document.blocks[0]?.id).toBe(id)
      expect(get().document.blocks[0]?.kind).toBe('Show')
      expect(get().dirty).toBe(true)
    })

    it('inserts after the given block id', () => {
      const a = get().addBlock('Show')
      const b = get().addBlock('Hide')
      const c = get().addBlock('Style', a)
      const ids = get().document.blocks.map((x) => x.id)
      expect(ids).toEqual([a, c, b])
    })

    it('regenerates rawText after each add', () => {
      get().addBlock('Show')
      expect(get().rawText.trim()).toContain('Show')
    })
  })

  describe('removeBlock', () => {
    it('removes by id', () => {
      const a = get().addBlock('Show')
      const b = get().addBlock('Hide')
      get().removeBlock(a)
      expect(get().document.blocks.map((x) => x.id)).toEqual([b])
    })

    it('clears selection if the removed block was selected', () => {
      const a = get().addBlock('Show')
      get().selectBlock(a)
      expect(get().selectedBlockId).toBe(a)
      get().removeBlock(a)
      expect(get().selectedBlockId).toBeNull()
    })

    it('keeps selection if a different block was selected', () => {
      const a = get().addBlock('Show')
      const b = get().addBlock('Hide')
      get().selectBlock(b)
      get().removeBlock(a)
      expect(get().selectedBlockId).toBe(b)
    })
  })

  describe('duplicateBlock', () => {
    it('duplicates conditions and actions; assigns a new id', () => {
      const id = get().addBlock('Show')
      get().addCondition(id, {
        keyword: 'ItemType',
        values: ['Runes'],
      })
      get().addAction(id, { keyword: 'SetTextColor', color: 'White' })
      const dupId = get().duplicateBlock(id)
      expect(dupId).not.toBeNull()
      expect(dupId).not.toBe(id)
      const dup = get().document.blocks.find((b) => b.id === dupId)
      expect(dup?.conditions).toEqual([{ keyword: 'ItemType', values: ['Runes'] }])
      expect(dup?.actions).toEqual([{ keyword: 'SetTextColor', color: 'White' }])
    })

    it('places the duplicate immediately after the source', () => {
      const a = get().addBlock('Show')
      const b = get().addBlock('Hide')
      const dup = get().duplicateBlock(a)
      const ids = get().document.blocks.map((x) => x.id)
      expect(ids).toEqual([a, dup, b])
    })

    it('returns null on unknown id', () => {
      expect(get().duplicateBlock('nope')).toBeNull()
    })
  })

  describe('moveBlock', () => {
    it('reorders to the requested index, preserving ids', () => {
      const a = get().addBlock('Show')
      const b = get().addBlock('Hide')
      const c = get().addBlock('Style')
      get().moveBlock(c, 0)
      expect(get().document.blocks.map((x) => x.id)).toEqual([c, a, b])
    })

    it('clamps to valid range', () => {
      const a = get().addBlock('Show')
      const b = get().addBlock('Hide')
      get().moveBlock(a, 999)
      expect(get().document.blocks.map((x) => x.id)).toEqual([b, a])
    })

    it('is a no-op for unknown id', () => {
      const a = get().addBlock('Show')
      const b = get().addBlock('Hide')
      get().moveBlock('nope', 0)
      expect(get().document.blocks.map((x) => x.id)).toEqual([a, b])
    })
  })

  describe('toggleBlock', () => {
    it('flips enabled', () => {
      const id = get().addBlock('Show')
      expect(get().document.blocks[0]?.enabled).toBe(true)
      get().toggleBlock(id)
      expect(get().document.blocks[0]?.enabled).toBe(false)
      get().toggleBlock(id)
      expect(get().document.blocks[0]?.enabled).toBe(true)
    })
  })

  describe('updateBlockKind / updateBlockLabel', () => {
    it('changes kind', () => {
      const id = get().addBlock('Show')
      get().updateBlockKind(id, 'Style')
      expect(get().document.blocks[0]?.kind).toBe('Style')
    })

    it('sets and clears label', () => {
      const id = get().addBlock('Show')
      get().updateBlockLabel(id, 'rare item border')
      expect(get().document.blocks[0]?.label).toBe('rare item border')
      get().updateBlockLabel(id, undefined)
      expect(get().document.blocks[0]?.label).toBeUndefined()
    })
  })
})

describe('filterStore: condition mutations', () => {
  beforeEach(() => {
    reset('')
  })

  it('adds, updates, and removes conditions in order', () => {
    const id = get().addBlock('Show')
    const c1: Condition = { keyword: 'Rarity', op: '==', value: 'Rare' }
    const c2: Condition = { keyword: 'ItemLevel', op: '>=', value: 75 }
    get().addCondition(id, c1)
    get().addCondition(id, c2)
    expect(get().document.blocks[0]?.conditions).toEqual([c1, c2])

    const c1b: Condition = { keyword: 'Rarity', op: '==', value: 'Unique' }
    get().updateCondition(id, 0, c1b)
    expect(get().document.blocks[0]?.conditions).toEqual([c1b, c2])

    get().removeCondition(id, 0)
    expect(get().document.blocks[0]?.conditions).toEqual([c2])
  })

  it('updateCondition is a no-op for out-of-range index', () => {
    const id = get().addBlock('Show')
    get().addCondition(id, { keyword: 'Rarity', op: '==', value: 'Rare' })
    get().updateCondition(id, 99, {
      keyword: 'Rarity',
      op: '==',
      value: 'Unique',
    })
    expect(get().document.blocks[0]?.conditions).toEqual([
      { keyword: 'Rarity', op: '==', value: 'Rare' },
    ])
  })
})

describe('filterStore: action mutations', () => {
  beforeEach(() => {
    reset('')
  })

  it('adds, updates, and removes actions in order', () => {
    const id = get().addBlock('Show')
    const a1: Action = { keyword: 'SetTextColor', color: 'White' }
    const a2: Action = { keyword: 'SetBorderColor', r: 200, g: 0, b: 200 }
    get().addAction(id, a1)
    get().addAction(id, a2)
    expect(get().document.blocks[0]?.actions).toEqual([a1, a2])

    const a2b: Action = { keyword: 'SetBorderColor', r: 0, g: 255, b: 0 }
    get().updateAction(id, 1, a2b)
    expect(get().document.blocks[0]?.actions).toEqual([a1, a2b])

    get().removeAction(id, 0)
    expect(get().document.blocks[0]?.actions).toEqual([a2b])
  })

  it('setBlockActions replaces the entire actions array', () => {
    const id = get().addBlock('Show')
    get().addAction(id, { keyword: 'SetTextColor', color: 'White' })
    const next: Action[] = [
      { keyword: 'SetBorderColor', r: 1, g: 2, b: 3 },
      { keyword: 'PlayAlertSound', soundId: 11 },
    ]
    get().setBlockActions(id, next)
    expect(get().document.blocks[0]?.actions).toEqual(next)
  })
})

describe('filterStore: post-mutation invariants', () => {
  beforeEach(() => {
    reset('')
  })

  it('every mutation regenerates rawText to match document', () => {
    const id = get().addBlock('Show')
    get().addCondition(id, { keyword: 'ItemType', values: ['Runes'] })
    get().addAction(id, { keyword: 'SetTextColor', color: 'White' })
    const text = get().rawText
    const reparsed = parse(text).document
    expect(reparsed.blocks).toHaveLength(1)
    expect(reparsed.blocks[0]?.kind).toBe('Show')
    expect(reparsed.blocks[0]?.conditions).toEqual([
      { keyword: 'ItemType', values: ['Runes'] },
    ])
    expect(reparsed.blocks[0]?.actions).toEqual([
      { keyword: 'SetTextColor', color: 'White' },
    ])
  })

  it('every mutation refreshes validation issues', () => {
    const id = get().addBlock('Show')
    get().addAction(id, { keyword: 'SetBorderColor', r: 999, g: 0, b: 0 })
    const errors = get().issues.filter((i) => i.code === 'rgb-out-of-range')
    expect(errors.length).toBeGreaterThan(0)
  })

  it('every mutation sets dirty=true', () => {
    expect(get().dirty).toBe(false)
    get().addBlock('Show')
    expect(get().dirty).toBe(true)
  })

  it('round-trips after a sequence of mutations', () => {
    const id = get().addBlock('Show')
    get().updateBlockLabel(id, 'rune block')
    get().addCondition(id, { keyword: 'ItemType', values: ['High Runes'] })
    get().addAction(id, { keyword: 'SetBorderColor', r: 255, g: 0, b: 255 })
    get().addAction(id, { keyword: 'MinimapIcon', size: 2, r: 255, g: 0, b: 255 })

    const before = get().document
    const reparsed = parse(get().rawText).document
    expect(reparsed.blocks[0]?.kind).toBe(before.blocks[0]?.kind)
    expect(reparsed.blocks[0]?.label).toBe(before.blocks[0]?.label)
    expect(reparsed.blocks[0]?.conditions).toEqual(before.blocks[0]?.conditions)
    expect(reparsed.blocks[0]?.actions).toEqual(before.blocks[0]?.actions)
  })
})
