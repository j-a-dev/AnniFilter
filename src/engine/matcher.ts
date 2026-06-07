import type {
  Action,
  ActionKeyword,
  FilterBlock,
  FilterDocument,
  ItemDescription,
  MatchResult,
} from './types'
import { matchesBlock } from './matchesBlock'
import { layerBlockActions } from './cascade'
import { isBlockOptionOn, type OptionStates } from './optionGate'

/**
 * Walk the filter top-down. Style blocks that match are accumulated in styleStack
 * (do not terminate). The first matching Show or Hide terminates the walk.
 * Style actions stack last-write-wins per keyword in effectiveActions.
 *
 * `optionStates` simulates in-game toggles: a block gated by an off option is
 * skipped entirely (as if absent), AND-ed with the block's own `enabled` flag.
 */
export function match(
  document: FilterDocument,
  item: ItemDescription,
  optionStates?: OptionStates,
): MatchResult {
  const styleStack: FilterBlock[] = []
  let terminator: FilterBlock | null = null
  const presetById = new Map(document.presets.map((p) => [p.id, p]))

  for (const block of document.blocks) {
    if (!block.enabled) continue
    if (!isBlockOptionOn(block, document.options, optionStates)) continue
    if (!matchesBlock(block, item)) continue

    if (block.kind === 'Style') {
      styleStack.push(block)
      continue
    }
    // Show or Hide — terminate.
    terminator = block
    break
  }

  // Default visibility: shown unless a Hide block matched.
  const visible = terminator?.kind !== 'Hide'

  // Effective actions: walk style stack in order, last-write-wins per keyword,
  // then layer the terminating block's actions on top (also last-write-wins).
  const map = new Map<ActionKeyword | 'Unknown', Action>()
  const multiSounds: Action[] = [] // PlayAlertSound preserves all entries in order
  for (const block of styleStack) {
    layerBlockActions(block, presetById, map, multiSounds)
  }
  if (terminator && terminator.kind === 'Show') {
    layerBlockActions(terminator, presetById, map, multiSounds)
  }
  const effectiveActions: Action[] = [...multiSounds, ...map.values()]

  return {
    styleStack,
    terminator,
    visible,
    effectiveActions,
  }
}
