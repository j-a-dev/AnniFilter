import { describe, it, expect } from 'vitest'
import { resolveEffectiveActions, layerBlockActions } from '@/engine/cascade'
import type {
  Action,
  ActionKeyword,
  FilterBlock,
  StylePreset,
} from '@/engine/types'

const mkBlock = (over: Partial<FilterBlock> = {}): FilterBlock => ({
  id: 'b1',
  kind: 'Style',
  enabled: true,
  conditions: [],
  actions: [],
  intraBlockComments: [],
  ...over,
})

const text = (color: string): Action => ({ keyword: 'SetTextColor', color })
const border = (r: number, g: number, b: number): Action => ({
  keyword: 'SetBorderColor',
  r,
  g,
  b,
})
const sound = (soundId: number): Action => ({ keyword: 'PlayAlertSound', soundId })

describe('resolveEffectiveActions', () => {
  it('returns the block actions verbatim when there is no preset', () => {
    const actions = [text('Red'), sound(5)]
    expect(resolveEffectiveActions(mkBlock({ actions }), undefined)).toBe(actions)
  })

  const preset: StylePreset = {
    id: 'p1',
    name: 'gold',
    actions: [text('Gold'), border(200, 0, 200)],
    createdAt: 0,
  }

  it('emits the preset actions when there are no overrides', () => {
    expect(resolveEffectiveActions(mkBlock({ presetId: 'p1' }), preset)).toEqual([
      text('Gold'),
      border(200, 0, 200),
    ])
  })

  it('replaces a preset action with its override', () => {
    const block = mkBlock({
      presetId: 'p1',
      presetOverrides: { SetTextColor: text('White') },
    })
    expect(resolveEffectiveActions(block, preset)).toEqual([
      text('White'),
      border(200, 0, 200),
    ])
  })

  it('suppresses a preset action when the override is null', () => {
    const block = mkBlock({
      presetId: 'p1',
      presetOverrides: { SetBorderColor: null },
    })
    expect(resolveEffectiveActions(block, preset)).toEqual([text('Gold')])
  })

  it('appends the block own actions after the preset actions', () => {
    const block = mkBlock({ presetId: 'p1', actions: [sound(7)] })
    expect(resolveEffectiveActions(block, preset)).toEqual([
      text('Gold'),
      border(200, 0, 200),
      sound(7),
    ])
  })
})

describe('layerBlockActions', () => {
  const run = (...blocks: FilterBlock[]) => {
    const map = new Map<ActionKeyword | 'Unknown', Action>()
    const multiSounds: Action[] = []
    const presetById = new Map<string, StylePreset>()
    for (const b of blocks) layerBlockActions(b, presetById, map, multiSounds)
    return { map, multiSounds }
  }

  it('is last-write-wins per keyword across blocks', () => {
    const { map } = run(
      mkBlock({ id: 'a', actions: [text('Red')] }),
      mkBlock({ id: 'b', actions: [text('Gold')] }),
    )
    expect(map.get('SetTextColor')).toEqual(text('Gold'))
  })

  it('accumulates every PlayAlertSound in document order', () => {
    const { multiSounds } = run(
      mkBlock({ id: 'a', actions: [sound(1), sound(2)] }),
      mkBlock({ id: 'b', actions: [sound(3)] }),
    )
    expect(multiSounds.map((s) => (s as { soundId: number }).soundId)).toEqual([
      1, 2, 3,
    ])
  })

  it('resolves a preset before layering', () => {
    const presetById = new Map<string, StylePreset>([
      ['p1', { id: 'p1', name: 'g', actions: [text('Gold')], createdAt: 0 }],
    ])
    const map = new Map<ActionKeyword | 'Unknown', Action>()
    layerBlockActions(mkBlock({ presetId: 'p1' }), presetById, map, [])
    expect(map.get('SetTextColor')).toEqual(text('Gold'))
  })
})
