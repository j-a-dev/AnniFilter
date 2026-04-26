import { useRef, useState } from 'react'
import { TEMPLATE_PLACEHOLDERS, TEXT_COLORS } from '@/engine/data/spec'

const PALETTE_HEX: Record<string, string> = {
  White: '#e0e0e0', Red: '#cc2c2c', LightGreen: '#7fe08a',
  Blue: '#3a78d4', DarkGold: '#a08036', Grey: '#7a7a7a',
  Black: '#0a0a0a', Gold: '#d4b048', Orange: '#e08a3a',
  Yellow: '#e8d038', DarkGreen: '#3a7a3a', Purple: '#a040a8',
  Green: '#48a848', White2: '#e8e8e8', Black2: '#080808',
  DarkWhite: '#b0b0b0',
}

type Props = {
  value: string
  onChange: (next: string) => void
  placeholder?: string
}

/**
 * Template-string input with a placeholder-pill popover (quick-win #9).
 * Click the {…} button → palette + token pickers. Picking inserts at cursor.
 */
export function TemplateInput({ value, onChange, placeholder }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)

  const insert = (token: string) => {
    const el = inputRef.current
    const insertion = `{${token}}`
    if (el && el.selectionStart != null && el.selectionEnd != null) {
      const start = el.selectionStart
      const end = el.selectionEnd
      const next = value.slice(0, start) + insertion + value.slice(end)
      onChange(next)
      // Restore cursor after insertion (after React rerender).
      requestAnimationFrame(() => {
        el.focus()
        const pos = start + insertion.length
        el.setSelectionRange(pos, pos)
      })
    } else {
      onChange(value + insertion)
    }
  }

  return (
    <div className="flex-1 flex items-center gap-1 relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'template'}
        className="flex-1 bg-[#0a0a0f] text-slate-200 text-[11px] font-mono px-2 py-0.5 rounded border border-[#1d2128] focus:border-amber-500/50 outline-none"
      />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[10px] text-slate-400 hover:text-amber-300 border border-[#2a2d32] hover:border-[#3a4050] rounded px-1.5 py-0.5"
        title="Insert color or placeholder token"
      >
        {'{…}'}
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-20 right-0 top-full mt-1 bg-[#0e1014] border border-[#2a2d32] rounded shadow-lg p-2 w-[240px]">
            <div className="text-[9px] uppercase tracking-wider text-slate-500 mb-1">
              Color
            </div>
            <div className="grid grid-cols-8 gap-0.5 mb-2">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    insert(c)
                    setOpen(false)
                  }}
                  title={`{${c}}`}
                  className="w-5 h-5 rounded-sm border border-[#1a1d22] hover:border-amber-300"
                  style={{ backgroundColor: PALETTE_HEX[c] ?? '#888' }}
                />
              ))}
            </div>
            <div className="text-[9px] uppercase tracking-wider text-slate-500 mb-1">
              Placeholder
            </div>
            <div className="grid grid-cols-2 gap-0.5">
              {TEMPLATE_PLACEHOLDERS.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    insert(t)
                    setOpen(false)
                  }}
                  className="text-[10px] text-left px-1.5 py-0.5 rounded text-slate-300 hover:bg-[#1a1d22] hover:text-slate-100 font-mono"
                >
                  {`{${t}}`}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
