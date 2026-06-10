import { describe, it, expect } from 'vitest'
import { isBlockOptionOn } from '@/engine/optionGate'
import type { FilterBlock, FilterOption } from '@/engine/types'

const mkBlock = (optionId?: string): FilterBlock => ({
  id: 'b1',
  kind: 'Show',
  enabled: true,
  conditions: [],
  actions: [],
  intraBlockComments: [],
  optionId,
})

const opt = (id: string, defaultOn: boolean): FilterOption => ({
  id,
  label: id,
  defaultOn,
})

describe('isBlockOptionOn', () => {
  it('ungated blocks are always on', () => {
    expect(isBlockOptionOn(mkBlock(undefined), [], undefined)).toBe(true)
    // Even if some unrelated state exists.
    expect(isBlockOptionOn(mkBlock(undefined), [opt('x', false)])).toBe(true)
  })

  it('falls back to the option default when no state is provided', () => {
    const options = [opt('lootbeams', true), opt('chatspam', false)]
    expect(isBlockOptionOn(mkBlock('lootbeams'), options)).toBe(true)
    expect(isBlockOptionOn(mkBlock('chatspam'), options)).toBe(false)
  })

  it('a simulation state overrides the declared default', () => {
    const options = [opt('lootbeams', true)]
    const states = new Map([['lootbeams', false]])
    expect(isBlockOptionOn(mkBlock('lootbeams'), options, states)).toBe(false)
  })

  it('options not present in the state map still use their default', () => {
    const options = [opt('a', true), opt('b', false)]
    const states = new Map([['a', false]]) // only 'a' toggled
    expect(isBlockOptionOn(mkBlock('b'), options, states)).toBe(false)
  })

  it('defaults to on when the gating id has no declaration', () => {
    expect(isBlockOptionOn(mkBlock('ghost'), [], undefined)).toBe(true)
  })
})
