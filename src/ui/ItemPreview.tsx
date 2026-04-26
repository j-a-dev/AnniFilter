import type { Action, FilterBlock } from '@/engine/types'

const PALETTE_HEX: Record<string, string> = {
  White: '#e0e0e0', Red: '#cc2c2c', LightGreen: '#7fe08a',
  Blue: '#3a78d4', DarkGold: '#a08036', Grey: '#7a7a7a',
  Black: '#0a0a0a', Gold: '#d4b048', Orange: '#e08a3a',
  Yellow: '#e8d038', DarkGreen: '#3a7a3a', Purple: '#a040a8',
  Green: '#48a848', White2: '#e8e8e8', Black2: '#080808',
  DarkWhite: '#b0b0b0',
}

const FONT_SIZE_PX: Record<string, number> = {
  Font6: 9,
  Font8: 11,
  Font16: 12,
  Font24: 14,
  Font30: 16,
  Font42: 19,
  FontFormal10: 12,
  FontFormal11: 12,
  FontFormal12: 13,
  FontExocet8: 11,
  FontExocet10: 12,
  FontInGameChat: 11,
  FontRidiculous: 22,
  ReallyTheLastSucker: 18,
}

type Token =
  | { kind: 'text'; text: string }
  | { kind: 'color'; color: string }
  | { kind: 'break' }
  | { kind: 'placeholder'; name: string }

const PLACEHOLDER_TEXT_TOKENS = new Set([
  'Original',
  'OriginalInline',
  'ItemName',
  'BaseItemName',
  'ShortItemName',
  'Runeword',
  'ItemLevel',
  'Sockets',
  'ImplicitTier',
  'RiftstoneTier',
])

/**
 * Tokenize a template string. {<ColorName>} is recognized against the wiki
 * palette; {Break} is a line break; everything else in {…} is a placeholder
 * token rendered as its substituted text (or the bracketed token verbatim
 * if unknown).
 */
function tokenize(template: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  let buf = ''
  while (i < template.length) {
    if (template[i] === '{') {
      const end = template.indexOf('}', i + 1)
      if (end < 0) {
        buf += template.slice(i)
        i = template.length
        break
      }
      if (buf) {
        tokens.push({ kind: 'text', text: buf })
        buf = ''
      }
      const name = template.slice(i + 1, end)
      if (name === 'Break') {
        tokens.push({ kind: 'break' })
      } else if (name in PALETTE_HEX) {
        tokens.push({ kind: 'color', color: name })
      } else if (PLACEHOLDER_TEXT_TOKENS.has(name)) {
        tokens.push({ kind: 'placeholder', name })
      } else {
        // Unknown — render literally
        tokens.push({ kind: 'text', text: `{${name}}` })
      }
      i = end + 1
    } else {
      buf += template[i]
      i++
    }
  }
  if (buf) tokens.push({ kind: 'text', text: buf })
  return tokens
}

function findFirst<K extends Action['keyword']>(
  actions: Action[],
  keyword: K,
): (Action & { keyword: K }) | undefined {
  return actions.find(
    (a): a is Action & { keyword: K } => a.keyword === keyword,
  )
}

function renderTemplate(
  template: string,
  defaultColorHex: string,
  itemNameSubstitution: string,
): React.ReactNode {
  const tokens = tokenize(template)
  const out: React.ReactNode[] = []
  let currentColor = defaultColorHex
  let key = 0
  for (const t of tokens) {
    if (t.kind === 'color') {
      currentColor = PALETTE_HEX[t.color] ?? defaultColorHex
    } else if (t.kind === 'break') {
      out.push(<br key={key++} />)
    } else if (t.kind === 'text') {
      out.push(
        <span key={key++} style={{ color: currentColor }}>
          {t.text}
        </span>,
      )
    } else if (t.kind === 'placeholder') {
      out.push(
        <span key={key++} style={{ color: currentColor }}>
          {itemNameSubstitution}
        </span>,
      )
    }
  }
  return out
}

export function ItemPreview({ block }: { block: FilterBlock }) {
  const actions = block.actions
  const setText = findFirst(actions, 'SetTextColor')
  const setBorder = findFirst(actions, 'SetBorderColor')
  const setBg = findFirst(actions, 'SetBackgroundColor')
  const setFont = findFirst(actions, 'SetFont')
  const prepend = findFirst(actions, 'PrependText')
  const append = findFirst(actions, 'AppendText')
  const setName = findFirst(actions, 'SetItemName')

  const defaultColor = setText
    ? (PALETTE_HEX[setText.color] ?? '#e0e0e0')
    : '#e0e0e0'

  const sampleName =
    block.label && block.label.length > 0 ? block.label : 'Sample Item'

  const style: Record<string, string | number> = {
    color: defaultColor,
    fontSize: setFont ? (FONT_SIZE_PX[setFont.font] ?? 12) : 12,
  }

  if (setBorder) {
    style['--border'] = `${setBorder.r}, ${setBorder.g}, ${setBorder.b}`
    style['--border-a'] = 1
  }
  if (setBg) {
    style['--bg'] = `${setBg.r}, ${setBg.g}, ${setBg.b}`
    style['--bg-a'] = 1
  }

  // Rendering order per the filter language:
  //   prepend + (custom-name-or-original) + append
  const namePart = setName
    ? renderTemplate(setName.template, defaultColor, sampleName)
    : sampleName

  return (
    <span className="pv-label" style={style as React.CSSProperties}>
      {prepend
        ? renderTemplate(prepend.template, defaultColor, sampleName)
        : null}
      {namePart}
      {append
        ? renderTemplate(append.template, defaultColor, sampleName)
        : null}
    </span>
  )
}
