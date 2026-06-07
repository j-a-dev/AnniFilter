import type {
  Action,
  ActionKeyword,
  FilterBlock,
  StylePreset,
} from './types'

/**
 * Compute the effective inline actions for a block given its (optional) preset.
 * Order of precedence per keyword: presetOverrides > preset.actions > block.actions.
 * - Preset action with `presetOverrides[k]` === Action: use override
 * - Preset action with `presetOverrides[k]` === null: suppressed
 * - Preset action with no override: emit as-is
 * - block.actions[]: appended after preset actions, regardless of keyword (extras)
 */
export function resolveEffectiveActions(
  block: FilterBlock,
  preset: StylePreset | undefined,
): Action[] {
  if (!preset) return block.actions
  const out: Action[] = []
  const overrides = block.presetOverrides ?? {}
  for (const action of preset.actions) {
    const k = action.keyword as ActionKeyword
    if (k in overrides) {
      const override = overrides[k]
      if (override === null) continue
      if (override !== undefined) {
        out.push(override)
        continue
      }
    }
    out.push(action)
  }
  for (const a of block.actions) out.push(a)
  return out
}

/**
 * Layer one block's effective actions onto the running cascade.
 * Single-valued keywords are last-write-wins via `map`; PlayAlertSound entries
 * accumulate in `multiSounds` in document order.
 */
export function layerBlockActions(
  block: FilterBlock,
  presetById: Map<string, StylePreset>,
  map: Map<ActionKeyword | 'Unknown', Action>,
  multiSounds: Action[],
): void {
  const preset = block.presetId ? presetById.get(block.presetId) : undefined
  const actions = resolveEffectiveActions(block, preset)
  for (const a of actions) {
    if (a.keyword === 'PlayAlertSound') {
      multiSounds.push(a)
    } else {
      map.set(a.keyword, a)
    }
  }
}
