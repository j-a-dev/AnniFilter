import { useEffect, useState, type FormEvent } from 'react'
import { useFilterStore } from '@/store/filterStore'

export function JumpToIndexOverlay() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const blocks = useFilterStore((s) => s.document.blocks)
  const selectBlock = useFilterStore((s) => s.selectBlock)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+G / Cmd+G — open the overlay (preempts the browser's
      // "Find Next" which is rarely useful in this app).
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        setOpen(true)
        setValue('')
      } else if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const n = Number(value)
    if (Number.isFinite(n) && n >= 1 && n <= blocks.length) {
      const block = blocks[n - 1]
      if (block) selectBlock(block.id)
    }
    setOpen(false)
    setValue('')
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/30"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-[#0e1014] border border-[#2a2d32] rounded shadow-xl p-3 w-72"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">
            Jump to rule
          </label>
          <input
            type="number"
            min={1}
            max={blocks.length}
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`1 - ${blocks.length}`}
            className="w-full bg-[#0a0a0f] text-slate-200 text-sm px-2 py-1.5 rounded border border-[#2a2d32] focus:border-amber-500/50 outline-none tabular-nums"
          />
          <div className="text-[10px] text-slate-600 mt-2 flex justify-between">
            <span>Enter to jump</span>
            <span>Esc to cancel</span>
          </div>
        </form>
      </div>
    </div>
  )
}
