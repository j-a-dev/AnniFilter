import { useId } from 'react'

type Props = {
  r: number
  g: number
  b: number
  onChange: (r: number, g: number, b: number) => void
  title?: string
}

/** Bare 22px swatch. Click opens the browser's native color picker.
 *  RGB picker popover with hex + recents lands in P2.6 polish. */
export function ColorSwatch({ r, g, b, onChange, title }: Props) {
  const id = useId()
  const hex = rgbToHex(r, g, b)

  return (
    <div className="relative inline-block">
      <label
        htmlFor={id}
        className="block w-[22px] h-[22px] rounded border border-[#3a3f48] cursor-pointer shadow-inner"
        style={{ backgroundColor: hex }}
        title={title ?? `${r} ${g} ${b}`}
      />
      <input
        id={id}
        type="color"
        value={hex}
        onChange={(e) => {
          const next = hexToRgb(e.target.value)
          onChange(next.r, next.g, next.b)
        }}
        className="absolute opacity-0 inset-0 w-full h-full cursor-pointer"
      />
    </div>
  )
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)))
  return (
    '#' +
    [r, g, b]
      .map((n) => clamp(n).toString(16).padStart(2, '0'))
      .join('')
  )
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.startsWith('#') ? hex.slice(1) : hex
  const n = parseInt(h, 16)
  return {
    r: (n >> 16) & 0xff,
    g: (n >> 8) & 0xff,
    b: n & 0xff,
  }
}
