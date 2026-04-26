import type {
  FilterDocument,
  FilterBlock,
  Condition,
  Action,
  BlockKind,
  ValidationIssue,
  ComparisonOp,
  NumericConditionKeyword,
  BooleanConditionKeyword,
  StringListConditionKeyword,
} from './types'

export type ParseResult = {
  document: FilterDocument
  issues: ValidationIssue[]
}

const NUMERIC_CONDITIONS: ReadonlySet<NumericConditionKeyword> = new Set([
  'Sockets',
  'ItemLevel',
  'AreaLevel',
  'PlayerLevel',
  'ImplicitTier',
  'AffixTier',
  'RiftstoneTier',
  'Stack',
  'Width',
  'Height',
  'AffixCount',
  'PrefixTier',
  'SuffixTier',
])

const BOOLEAN_CONDITIONS: ReadonlySet<BooleanConditionKeyword> = new Set([
  'Ethereal',
  'Identified',
  'Spectral',
  'Runeword',
  'Warped',
  'QuestItem',
])

const STRING_LIST_CONDITIONS: ReadonlySet<StringListConditionKeyword> = new Set([
  'ItemType',
  'ItemName',
  'HasAffix',
])

// Order matters: longer ops first so `>=` doesn't match as `>` then `=`.
const COMPARISON_OPS: ComparisonOp[] = ['==', '!=', '>=', '<=', '>', '<']

const BLOCK_HEADER_RE = /^\s*(Show|Hide|Style)\b\s*(?:#(.*))?$/
const DISABLED_HEADER_RE = /^\s*#\s*(Show|Hide|Style)\b\s*(?:#(.*))?$/
const COMMENT_LINE_RE = /^\s*#(.*)$/

export function parse(text: string): ParseResult {
  const issues: ValidationIssue[] = []
  const lines = text.split(/\r?\n/)
  const blocks: FilterBlock[] = []
  const preamble: string[] = []
  const trailingComments: string[] = []

  let i = 0
  let blockIndex = 0

  // 1) Preamble: comment/blank lines until first block header (or disabled block start).
  while (i < lines.length) {
    const line = lines[i] ?? ''
    if (isBlockStart(line) || isDisabledBlockStart(line)) break
    if (line.trim().length > 0) {
      const cm = line.match(COMMENT_LINE_RE)
      if (cm) preamble.push((cm[1] ?? '').trim())
    }
    i++
  }

  // 2) Blocks
  while (i < lines.length) {
    const line = lines[i] ?? ''
    if (line.trim().length === 0) {
      i++
      continue
    }

    const enabledHeaderMatch = line.match(BLOCK_HEADER_RE)
    const disabledHeaderMatch = line.match(DISABLED_HEADER_RE)

    if (enabledHeaderMatch) {
      const block: FilterBlock = {
        id: `parsed-${blockIndex++}`,
        kind: enabledHeaderMatch[1] as BlockKind,
        enabled: true,
        label: cleanLabel(enabledHeaderMatch[2]),
        conditions: [],
        actions: [],
        intraBlockComments: [],
      }
      i = parseBlockBody(lines, i + 1, block, false, issues)
      blocks.push(block)
      continue
    }

    if (disabledHeaderMatch) {
      const block: FilterBlock = {
        id: `parsed-${blockIndex++}`,
        kind: disabledHeaderMatch[1] as BlockKind,
        enabled: false,
        label: cleanLabel(disabledHeaderMatch[2]),
        conditions: [],
        actions: [],
        intraBlockComments: [],
      }
      i = parseBlockBody(lines, i + 1, block, true, issues)
      blocks.push(block)
      continue
    }

    // Comment line outside any block — accumulate as a trailing comment for now.
    // If another block follows, this will be reclassified by the next iteration.
    const cm = line.match(COMMENT_LINE_RE)
    if (cm) trailingComments.push((cm[1] ?? '').trim())
    i++
  }

  return {
    document: {
      blocks,
      presets: [],
      preamble,
      trailingComments,
    },
    issues,
  }
}

function isBlockStart(line: string): boolean {
  return BLOCK_HEADER_RE.test(line)
}

function isDisabledBlockStart(line: string): boolean {
  return DISABLED_HEADER_RE.test(line)
}

function cleanLabel(raw: string | undefined): string | undefined {
  if (raw == null) return undefined
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

/**
 * Parse the body of a block starting at line `start`. Returns the index of the
 * line after the block ends (next block header, disabled block, or EOF — blank
 * lines are tolerated within or between body lines for enabled blocks; disabled
 * blocks end as soon as a non-`# `-prefixed line is encountered).
 */
function parseBlockBody(
  lines: string[],
  start: number,
  block: FilterBlock,
  disabled: boolean,
  issues: ValidationIssue[],
): number {
  let i = start
  while (i < lines.length) {
    const line = lines[i] ?? ''
    const trimmed = line.trim()

    // Disabled-block boundary: any non-`# ` line ends it.
    if (disabled) {
      if (!isDisabledBodyLine(line)) break
      const stripped = stripDisabledPrefix(line)
      if (isBlockStart(stripped) || isDisabledBlockStart(stripped)) {
        // Two disabled blocks back-to-back — let outer loop pick this up.
        break
      }
      consumeBodyLine(stripped, block, issues)
      i++
      continue
    }

    // Enabled block: any blank line ends the body. Real shipped filters never
    // put blank lines inside a block, and treating blank-as-terminator avoids
    // ambiguity over whether trailing comments belong to the last block or to
    // the document's trailingComments[].
    if (trimmed.length === 0) {
      return skipBlanks(lines, i)
    }

    if (isBlockStart(line) || isDisabledBlockStart(line)) {
      return i
    }

    consumeBodyLine(line, block, issues)
    i++
  }
  return i
}

function skipBlanks(lines: string[], from: number): number {
  let k = from
  while (k < lines.length && (lines[k] ?? '').trim().length === 0) k++
  return k
}

function isDisabledBodyLine(line: string): boolean {
  // Disabled body lines start with `#` (with optional leading whitespace).
  return /^\s*#/.test(line)
}

function stripDisabledPrefix(line: string): string {
  // Remove leading whitespace + `#` + one optional space, preserve the rest.
  return line.replace(/^(\s*)#\s?/, '$1')
}

function consumeBodyLine(
  line: string,
  block: FilterBlock,
  issues: ValidationIssue[],
): void {
  const trimmed = line.trim()

  // Pure comment line inside a block — strip leading `#` and stash.
  const cm = trimmed.match(/^#(.*)$/)
  if (cm) {
    block.intraBlockComments.push((cm[1] ?? '').trim())
    return
  }

  // Strip trailing comment on the line if any (`SetTextColor White # important`).
  const { code, trailingComment } = splitTrailingComment(trimmed)
  if (trailingComment != null) {
    block.intraBlockComments.push(trailingComment)
  }

  // Recognize keyword + rest.
  const m = code.match(/^(\w+)\s*(.*)$/)
  if (!m) {
    block.actions.push({ keyword: 'Unknown', raw: code })
    return
  }
  const keyword = m[1] ?? ''
  const rest = (m[2] ?? '').trim()

  // Try condition first, fall back to action.
  const cond = tryParseCondition(keyword, rest, block, issues)
  if (cond) {
    block.conditions.push(cond)
    return
  }

  const act = tryParseAction(keyword, rest, block, issues)
  if (act) {
    block.actions.push(act)
    return
  }

  // Unknown keyword — preserve as opaque action passthrough.
  block.actions.push({ keyword: 'Unknown', raw: code })
  issues.push({
    level: 'warning',
    blockId: block.id,
    code: 'unknown-keyword',
    message: `Unknown keyword: ${keyword}`,
  })
}

function splitTrailingComment(line: string): {
  code: string
  trailingComment: string | null
} {
  // Walk through the string respecting quotes — `#` inside a string is not a comment.
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuote = !inQuote
    } else if (ch === '#' && !inQuote) {
      return {
        code: line.slice(0, i).trimEnd(),
        trailingComment: line.slice(i + 1).trim(),
      }
    }
  }
  return { code: line, trailingComment: null }
}

function tryParseCondition(
  keyword: string,
  rest: string,
  _block: FilterBlock,
  _issues: ValidationIssue[],
): Condition | null {
  if (keyword === 'Rarity') {
    const parts = parseOpAndValue(rest)
    if (!parts) return null
    return { keyword: 'Rarity', op: parts.op, value: stripQuotes(parts.value) }
  }
  if (keyword === 'Tier') {
    const parts = parseOpAndValue(rest)
    if (!parts) return null
    const v = stripQuotes(parts.value)
    if (v === 'Normal' || v === 'Exceptional' || v === 'Elite') {
      return { keyword: 'Tier', op: parts.op, value: v }
    }
    return null
  }
  if (NUMERIC_CONDITIONS.has(keyword as NumericConditionKeyword)) {
    const parts = parseOpAndValue(rest)
    if (!parts) return null
    const n = Number(stripQuotes(parts.value))
    if (!Number.isFinite(n)) return null
    return {
      keyword: keyword as NumericConditionKeyword,
      op: parts.op,
      value: n,
    }
  }
  if (BOOLEAN_CONDITIONS.has(keyword as BooleanConditionKeyword)) {
    const parts = parseOpAndValue(rest)
    if (!parts) return null
    if (parts.op !== '==' && parts.op !== '!=') return null
    const v = stripQuotes(parts.value).toLowerCase()
    if (v !== 'true' && v !== 'false') return null
    return {
      keyword: keyword as BooleanConditionKeyword,
      op: parts.op,
      value: v === 'true',
    }
  }
  if (STRING_LIST_CONDITIONS.has(keyword as StringListConditionKeyword)) {
    const values = tokenizeArgList(rest)
    return { keyword: keyword as StringListConditionKeyword, values }
  }
  return null
}

function parseOpAndValue(
  rest: string,
): { op: ComparisonOp; value: string } | null {
  const trimmed = rest.trimStart()
  for (const op of COMPARISON_OPS) {
    if (trimmed.startsWith(op)) {
      const value = trimmed.slice(op.length).trim()
      return { op, value }
    }
  }
  return null
}

function stripQuotes(s: string): string {
  const t = s.trim()
  if (t.length >= 2 && t.startsWith('"')) {
    const end = t.endsWith('"') ? t.length - 1 : t.length
    return t.slice(1, end)
  }
  return t
}

/** Tokenize a remainder string into a list of args. Quoted args may contain spaces. */
function tokenizeArgList(rest: string): string[] {
  const out: string[] = []
  let i = 0
  const n = rest.length
  while (i < n) {
    while (i < n && rest[i] === ' ') i++
    if (i >= n) break
    if (rest[i] === '"') {
      let j = i + 1
      while (j < n && rest[j] !== '"') j++
      out.push(rest.slice(i + 1, j))
      i = j < n ? j + 1 : j
    } else {
      let j = i
      while (j < n && rest[j] !== ' ') j++
      out.push(rest.slice(i, j))
      i = j
    }
  }
  return out
}

function tryParseAction(
  keyword: string,
  rest: string,
  block: FilterBlock,
  issues: ValidationIssue[],
): Action | null {
  switch (keyword) {
    case 'SetBorderColor':
    case 'SetBackgroundColor': {
      const rgb = parseRGB(rest)
      if (!rgb) return null
      return { keyword, r: rgb.r, g: rgb.g, b: rgb.b }
    }
    case 'SetTextColor': {
      const v = stripQuotes(rest.trim())
      return { keyword: 'SetTextColor', color: v }
    }
    case 'SetFont': {
      const v = stripQuotes(rest.trim())
      return { keyword: 'SetFont', font: v }
    }
    case 'SetBlendMode': {
      const v = stripQuotes(rest.trim())
      return { keyword: 'SetBlendMode', mode: v }
    }
    case 'SetItemName':
    case 'AppendText':
    case 'PrependText':
    case 'ChatNotification': {
      return { keyword, template: parseTemplate(rest, block, issues) }
    }
    case 'PlayAlertSound': {
      const n = Number(stripQuotes(rest.trim()))
      if (!Number.isFinite(n)) return null
      return { keyword: 'PlayAlertSound', soundId: n }
    }
    case 'MinimapIcon': {
      const args = tokenizeArgList(rest)
      if (args.length < 4) return null
      const [size, r, g, b] = args.map((a) => Number(a))
      if (
        !Number.isFinite(size) ||
        !Number.isFinite(r) ||
        !Number.isFinite(g) ||
        !Number.isFinite(b)
      ) {
        return null
      }
      return {
        keyword: 'MinimapIcon',
        size: size as number,
        r: r as number,
        g: g as number,
        b: b as number,
      }
    }
    default:
      return null
  }
}

function parseRGB(
  rest: string,
): { r: number; g: number; b: number } | null {
  const args = tokenizeArgList(rest)
  if (args.length < 3) return null
  const [r, g, b] = args.map((a) => Number(stripQuotes(a)))
  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) {
    return null
  }
  return { r: r as number, g: g as number, b: b as number }
}

function parseTemplate(
  rest: string,
  block: FilterBlock,
  issues: ValidationIssue[],
): string {
  const t = rest.trim()
  if (t.length === 0) return ''
  if (t.startsWith('"')) {
    const end = t.lastIndexOf('"')
    if (end <= 0) {
      // Unterminated quoted string — game accepts; we warn and consume rest of line.
      issues.push({
        level: 'warning',
        blockId: block.id,
        code: 'unterminated-string',
        message: `Unterminated string in template`,
      })
      return t.slice(1)
    }
    return t.slice(1, end)
  }
  return t
}
