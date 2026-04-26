import type { ReactNode } from 'react'

export const PALETTE_HEX: Record<string, string> = {
  White: '#e0e0e0', Red: '#cc2c2c', LightGreen: '#7fe08a',
  Blue: '#3a78d4', DarkGold: '#a08036', Grey: '#7a7a7a',
  Black: '#0a0a0a', Gold: '#d4b048', Orange: '#e08a3a',
  Yellow: '#e8d038', DarkGreen: '#3a7a3a', Purple: '#a040a8',
  Green: '#48a848', White2: '#e8e8e8', Black2: '#080808',
  DarkWhite: '#b0b0b0',
}

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

type Token =
  | { kind: 'text'; text: string }
  | { kind: 'color'; color: string }
  | { kind: 'break' }
  | { kind: 'placeholder'; name: string }

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

export function renderTemplate(
  template: string,
  defaultColorHex: string,
  itemNameSubstitution: string,
): ReactNode {
  const tokens = tokenize(template)
  const out: ReactNode[] = []
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
