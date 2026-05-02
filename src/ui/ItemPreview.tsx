import type { Action } from '@/engine/types'
import { PALETTE_HEX, renderTemplate } from './templateRender'

const FONT_SIZE_PX: Record<string, number> = {
  Font6: 12,
  Font8: 14,
  Font16: 15,
  Font24: 17,
  Font30: 19,
  Font42: 22,
  FontFormal10: 15,
  FontFormal11: 15,
  FontFormal12: 16,
  FontExocet8: 14,
  FontExocet10: 15,
  FontInGameChat: 14,
  FontRidiculous: 25,
  ReallyTheLastSucker: 21,
}

function findFirst<K extends Action['keyword']>(
  actions: Action[],
  keyword: K,
): (Action & { keyword: K }) | undefined {
  return actions.find(
    (a): a is Action & { keyword: K } => a.keyword === keyword,
  )
}

export function ItemPreview({
  actions,
  label,
  compact,
}: {
  actions: Action[]
  label?: string
  compact?: boolean
}) {
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

  const sampleName = label && label.length > 0 ? label : 'Sample Item'

  const rawFontSize = setFont ? (FONT_SIZE_PX[setFont.font] ?? 15) : 15
  const fontSize = compact ? Math.min(rawFontSize, 16) : rawFontSize

  const style: Record<string, string | number> = {
    color: defaultColor,
    fontSize,
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
    <span
      className={`pv-label ${compact ? 'pv-label-compact' : ''}`}
      style={style as React.CSSProperties}
    >
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
