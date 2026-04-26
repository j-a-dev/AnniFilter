import { TEXT_COLORS } from '@/engine/data/spec'

/** Approximate visual hex for each named palette color. The actual in-game
 *  rendering is determined by the engine; these are best-effort previews. */
const PALETTE_HEX: Record<string, string> = {
  White: '#e0e0e0',
  Red: '#cc2c2c',
  LightGreen: '#7fe08a',
  Blue: '#3a78d4',
  DarkGold: '#a08036',
  Grey: '#7a7a7a',
  Black: '#0a0a0a',
  Gold: '#d4b048',
  Orange: '#e08a3a',
  Yellow: '#e8d038',
  DarkGreen: '#3a7a3a',
  Purple: '#a040a8',
  Green: '#48a848',
  White2: '#e8e8e8',
  Black2: '#080808',
  DarkWhite: '#b0b0b0',
}

type Props = {
  value: string
  onChange: (color: string) => void
}

export function PaletteGrid({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-8 gap-0.5 p-0.5 bg-[#0a0a0f] rounded border border-[#1d2128] inline-block">
      {TEXT_COLORS.map((name) => (
        <button
          key={name}
          onClick={() => onChange(name)}
          title={name}
          className={`w-5 h-5 rounded-sm border ${
            value === name
              ? 'border-amber-300'
              : 'border-[#1a1d22] hover:border-[#3a4050]'
          }`}
          style={{ backgroundColor: PALETTE_HEX[name] ?? '#888' }}
        />
      ))}
    </div>
  )
}
