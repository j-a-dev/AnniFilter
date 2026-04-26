import type {
  Action,
  ActionKeyword,
  FilterBlock,
  FilterDocument,
  StylePreset,
} from './types'
import { synthesizeItem } from './synthesizeItem'
import { matchesBlock } from './matchesBlock'

/**
 * Compute the cascaded "in-game appearance" actions for a target block.
 *
 * Walks the document from the start up to AND INCLUDING the target block,
 * synthesizing an item from the target's conditions. Every earlier (and the
 * target) block whose conditions also match contributes its actions to the
 * effective set, last-write-wins per ActionKeyword. PlayAlertSound entries
 * are preserved as a multi-list in document order.
 *
 * Notably this does NOT terminate at the first matching Show/Hide before the
 * target — we want to show "what this row contributes in-game even when it's
 * shadowed by an earlier rule." If the target is itself shadowed in real
 * play, the per-row preview still shows the cascade up to it; users can spot
 * that by seeing the preview content in earlier rule rows too.
 */
export function previewActionsForBlock(
  document: FilterDocument,
  targetId: string,
): Action[] {
  const targetIdx = document.blocks.findIndex((b) => b.id === targetId)
  if (targetIdx < 0) return []
  const target = document.blocks[targetIdx]
  if (!target) return []

  const item = synthesizeItem(target)
  const presetById = new Map(document.presets.map((p) => [p.id, p]))
  const map = new Map<ActionKeyword | 'Unknown', Action>()
  const multiSounds: Action[] = []

  for (let i = 0; i <= targetIdx; i++) {
    const block = document.blocks[i]
    if (!block || !block.enabled) continue
    if (!matchesBlock(block, item)) continue
    layerBlockActions(block, presetById, map, multiSounds)
  }

  return [...multiSounds, ...map.values()]
}

function layerBlockActions(
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

function resolveEffectiveActions(
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
