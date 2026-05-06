import type {
  Action,
  ActionKeyword,
  Condition,
  FilterBlock,
  FilterDocument,
  StylePreset,
} from './types'

export type BlockRange = { charStart: number; charEnd: number }

/** Generate the canonical `.filter` text for a document. Deterministic. */
export function generate(document: FilterDocument): string {
  return generateWithRanges(document).text
}

/**
 * Generate canonical `.filter` text plus per-block character offsets into
 * that text. Used by the raw view to map block selection ↔ rendered segments.
 * Offsets are inclusive-start, exclusive-end (substring-friendly), and do not
 * include the blank separator line that precedes the block in the joined text.
 */
export function generateWithRanges(document: FilterDocument): {
  text: string
  blockRanges: Map<string, BlockRange>
} {
  const out: string[] = []
  const presetById = new Map(document.presets.map((p) => [p.id, p]))
  const blockRanges = new Map<string, BlockRange>()

  // Tracks character offset that the *next* line in `out` will start at,
  // accounting for the '\n' joiners.
  let charCursor = 0
  const advance = (lines: string[]) => {
    for (const line of lines) {
      // Each pushed line contributes its length plus the '\n' separator that
      // joins it to the next line (or the final newline appended at the end).
      charCursor += line.length + 1
    }
  }

  // 1) Preamble.
  const preambleLines: string[] = []
  for (const line of document.preamble) {
    preambleLines.push(`# ${line}`)
  }
  if (document.preamble.length > 0) preambleLines.push('')
  out.push(...preambleLines)
  advance(preambleLines)

  // 2) Preset definitions.
  for (const preset of document.presets) {
    const lines: string[] = []
    lines.push(`# @preset-def ${preset.name}`)
    for (const action of preset.actions) {
      lines.push(`#   ${formatAction(action)}`)
    }
    lines.push(`# @preset-def-end`)
    lines.push('')
    out.push(...lines)
    advance(lines)
  }

  // 3) Blocks.
  for (let bi = 0; bi < document.blocks.length; bi++) {
    const block = document.blocks[bi]
    if (!block) continue

    if (bi > 0) {
      out.push('')
      advance([''])
    }

    const blockLines: string[] = []
    emitBlock(block, presetById, blockLines)
    const start = charCursor
    out.push(...blockLines)
    advance(blockLines)
    // charCursor now points to the position just past the trailing '\n' of
    // this block's last line — i.e. start of the next block's separator.
    // Use charCursor - 1 as exclusive end so we don't include that final '\n'.
    blockRanges.set(block.id, { charStart: start, charEnd: charCursor - 1 })
  }

  // 4) Trailing comments.
  if (document.trailingComments.length > 0) {
    const lines: string[] = ['']
    for (const line of document.trailingComments) {
      lines.push(`# ${line}`)
    }
    out.push(...lines)
    advance(lines)
  }

  const text = out.join('\n') + '\n'
  return { text, blockRanges }
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
