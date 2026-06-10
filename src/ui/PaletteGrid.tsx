import { TEXT_COLORS } from '@/engine/data/spec'
import { PALETTE_HEX } from './templateRender'

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
