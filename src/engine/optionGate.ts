import type { FilterBlock, FilterOption } from './types'

/**
 * Current on/off state of options, keyed by option id. An id absent from the
 * map falls back to the option's declared `defaultOn`. Used to simulate, in the
 * editor, what the player sees with a given set of in-game toggles.
 */
export type OptionStates = ReadonlyMap<string, boolean>

/**
 * Whether `block`'s gating option is currently on. Ungated blocks (no
 * `optionId`) are always on. A gated block uses `states` if it carries an entry
 * for the option, otherwise the option's declared `defaultOn`. (An id with no
 * matching declaration can't occur on a loaded document — undeclared
 * `@OptionBegin` is a fatal parse error — but defaults to on for safety.)
 */
export function isBlockOptionOn(
  block: FilterBlock,
  options: readonly FilterOption[],
  states?: OptionStates,
): boolean {
  const id = block.optionId
  if (id === undefined) return true
  if (states && states.has(id)) return states.get(id) as boolean
  const opt = options.find((o) => o.id === id)
  return opt ? opt.defaultOn : true
}
