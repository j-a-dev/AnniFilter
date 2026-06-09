import type {
  Action,
  ActionKeyword,
  Condition,
  FilterBlock,
  FilterDocument,
  FilterOption,
  StylePreset,
} from './types'
import { resolveEffectiveActions } from './cascade'

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

  // 0) Preamble — the leading comment block, emitted at the very top.
  const preambleLines: string[] = []
  for (const line of document.preamble) {
    preambleLines.push(`# ${line}`)
  }
  if (document.preamble.length > 0) preambleLines.push('')
  out.push(...preambleLines)
  advance(preambleLines)

  // 1) Intro directives (metadata, options grouped by category, unknown
  //    passthrough) — after the preamble so they sit between the leading
  //    comment block and the first rule.
  const introLines = emitIntro(document)
  if (introLines.length > 0) introLines.push('')
  out.push(...introLines)
  advance(introLines)

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

  // 3) Blocks, with `@OptionBegin`/`@OptionEnd` reconstructed by coalescing
  //    consecutive same-`optionId` blocks into a single region.
  const pushLine = (line: string) => {
    out.push(line)
    advance([line])
  }
  let prevOptionId: string | undefined
  let blockEmitted = false
  for (let bi = 0; bi < document.blocks.length; bi++) {
    const block = document.blocks[bi]
    if (!block) continue

    if (block.optionId !== prevOptionId) {
      // Close the region that was open, if any.
      if (prevOptionId !== undefined) pushLine('@OptionEnd')
      if (blockEmitted) pushLine('')
      // Open the new region, if entering one.
      if (block.optionId !== undefined) pushLine(`@OptionBegin ${quoteArg(block.optionId)}`)
    } else if (blockEmitted) {
      pushLine('')
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

    blockEmitted = true
    prevOptionId = block.optionId
  }
  // Close a region still open after the last block.
  if (prevOptionId !== undefined) pushLine('@OptionEnd')

  const text = out.join('\n') + '\n'
  return { text, blockRanges }
}

/**
 * Emit the intro `@`-directives in canonical order: metadata, then uncategorized
 * options, then each declared category with its members (preserving empty
 * categories and the dev's uncategorized-first layout), then any unrecognized
 * directives verbatim. Quoting mirrors the dev example: Name/Description/Option/
 * Category args are quoted; Author/Version are bare single tokens.
 */
function emitIntro(document: FilterDocument): string[] {
  const lines: string[] = []
  const { metadata } = document
  if (metadata.name !== undefined) lines.push(`@Name ${quoteArg(metadata.name)}`)
  if (metadata.author !== undefined) lines.push(`@Author ${metadata.author}`)
  if (metadata.version !== undefined) lines.push(`@Version ${metadata.version}`)
  for (const d of metadata.descriptions) lines.push(`@Description ${quoteArg(d)}`)

  for (const opt of document.options) {
    if (opt.categoryName === undefined) lines.push(emitOption(opt))
  }
  for (const cat of document.optionCategories) {
    lines.push(`@Category ${quoteArg(cat.name)}`)
    for (const opt of document.options) {
      if (opt.categoryName === cat.name) lines.push(emitOption(opt))
    }
  }

  for (const raw of document.unknownDirectives) lines.push(raw)
  return lines
}

function emitOption(opt: FilterOption): string {
  return `@Option ${quoteArg(opt.id)} ${quoteArg(opt.label)} ${opt.defaultOn ? 'true' : 'false'}`
}

function quoteArg(s: string): string {
  return `"${s}"`
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
