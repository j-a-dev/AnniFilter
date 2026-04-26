import type {
  Action,
  ActionKeyword,
  Condition,
  FilterBlock,
  FilterDocument,
  StylePreset,
} from './types'

/** Generate the canonical `.filter` text for a document. Deterministic. */
export function generate(document: FilterDocument): string {
  const out: string[] = []
  const presetById = new Map(document.presets.map((p) => [p.id, p]))

  // 1) Preamble (free-form comments). Emitted as-is.
  for (const line of document.preamble) {
    out.push(`# ${line}`)
  }
  if (document.preamble.length > 0) out.push('')

  // 2) Preset definitions in the preamble area. One block per preset.
  for (const preset of document.presets) {
    out.push(`# @preset-def ${preset.name}`)
    for (const action of preset.actions) {
      out.push(`#   ${formatAction(action)}`)
    }
    out.push(`# @preset-def-end`)
    out.push('')
  }

  // 3) Blocks.
  for (let bi = 0; bi < document.blocks.length; bi++) {
    const block = document.blocks[bi]
    if (!block) continue

    if (bi > 0) out.push('')

    emitBlock(block, presetById, out)
  }

  // 4) Trailing comments.
  if (document.trailingComments.length > 0) {
    out.push('')
    for (const line of document.trailingComments) {
      out.push(`# ${line}`)
    }
  }

  // Final newline.
  return out.join('\n') + '\n'
}

function emitBlock(
  block: FilterBlock,
  presetById: Map<string, StylePreset>,
  out: string[],
): void {
  const linesForBlock: string[] = []

  // Preset annotations live above the header line.
  if (block.presetId) {
    const preset = presetById.get(block.presetId)
    const presetName = preset?.name ?? block.presetId
    linesForBlock.push(`# @preset ${presetName}`)
    if (block.presetOverrides) {
      for (const keyword of Object.keys(block.presetOverrides) as ActionKeyword[]) {
        linesForBlock.push(`# @preset-overrides ${keyword}`)
      }
    }
  }

  const header = block.label
    ? `${block.kind} #${block.label}`
    : block.kind
  linesForBlock.push(header)

  for (const cond of block.conditions) {
    linesForBlock.push(`\t${formatCondition(cond)}`)
  }

  // Resolve effective actions: preset's actions (with overrides applied) + block's own actions.
  const preset = block.presetId ? presetById.get(block.presetId) : undefined
  const effective = resolveEffectiveActions(block, preset)
  for (const action of effective) {
    linesForBlock.push(`\t${formatAction(action)}`)
  }

  // Mid-block comments (position not preserved — appended at end of block).
  for (const c of block.intraBlockComments) {
    linesForBlock.push(`\t# ${c}`)
  }

  if (block.enabled) {
    out.push(...linesForBlock)
  } else {
    // Disabled — prefix each line with '# '.
    for (const line of linesForBlock) {
      out.push(line.length > 0 ? `# ${line}` : '#')
    }
  }
}

/**
 * Compute the effective inline actions for a block given its (optional) preset.
 * Order of precedence per keyword: presetOverrides > preset.actions > block.actions.
 * - Preset action with `presetOverrides[k]` === Action: use override
 * - Preset action with `presetOverrides[k]` === null: suppressed
 * - Preset action with no override: emit as-is
 * - Block.actions[]: appended after preset actions, regardless of keyword (extras)
 */
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
  // Append block's own actions (don't dedupe; preset+actions for same keyword
  // requires explicit overrides, not silent merging).
  for (const a of block.actions) {
    out.push(a)
  }
  return out
}

function formatCondition(cond: Condition): string {
  switch (cond.keyword) {
    case 'Rarity':
      return `Rarity ${cond.op} "${cond.value}"`
    case 'Tier':
      return `Tier ${cond.op} "${cond.value}"`
    case 'ItemType':
    case 'ItemName':
    case 'HasAffix':
      return `${cond.keyword} ${cond.values.map((v) => `"${v}"`).join(' ')}`
    case 'Unknown':
      return cond.raw
    default: {
      // Numeric or boolean condition.
      if (typeof cond.value === 'boolean') {
        return `${cond.keyword} ${cond.op} ${cond.value ? 'True' : 'False'}`
      }
      return `${cond.keyword} ${cond.op} ${cond.value}`
    }
  }
}

function formatAction(action: Action): string {
  switch (action.keyword) {
    case 'SetBorderColor':
    case 'SetBackgroundColor':
      return `${action.keyword} ${action.r} ${action.g} ${action.b}`
    case 'SetTextColor':
      return `SetTextColor "${action.color}"`
    case 'SetFont':
      return `SetFont "${action.font}"`
    case 'SetBlendMode':
      return `SetBlendMode "${action.mode}"`
    case 'SetItemName':
    case 'AppendText':
    case 'PrependText':
    case 'ChatNotification':
      return `${action.keyword} "${action.template}"`
    case 'PlayAlertSound':
      return `PlayAlertSound ${action.soundId}`
    case 'MinimapIcon':
      return `MinimapIcon ${action.size} ${action.r} ${action.g} ${action.b}`
    case 'Unknown':
      return action.raw
  }
}
