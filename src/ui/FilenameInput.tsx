import { useEffect, useState } from 'react'
import { useFilterStore } from '@/store/filterStore'

const FILTER_EXT = '.filter'

const stripExt = (path: string | null) => {
  if (!path) return ''
  return path.endsWith(FILTER_EXT) ? path.slice(0, -FILTER_EXT.length) : path
}

const ensureExt = (name: string): string | null => {
  const trimmed = name.trim()
  if (!trimmed) return null
  return trimmed.endsWith(FILTER_EXT) ? trimmed : trimmed + FILTER_EXT
}

export function FilenameInput() {
  const filePath = useFilterStore((s) => s.filePath)
  const setFilePath = useFilterStore((s) => s.setFilePath)
  const setDirty = useFilterStore((s) => s.setDirty)
  const dirty = useFilterStore((s) => s.dirty)
  const [text, setText] = useState(() => stripExt(filePath))

  // Sync from store only when local text would commit to a different
  // filePath (e.g. New cleared it, Open replaced it). If our text already
  // parses to the current filePath, leave it alone so partial edits survive.
  useEffect(() => {
    if (ensureExt(text) !== filePath) {
      setText(stripExt(filePath))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filePath])

  return (
    <div className="flex items-center gap-2 min-w-0">
      <label
        htmlFor="filter-name"
        className="text-[10px] uppercase tracking-wider text-slate-500 shrink-0"
      >
        Filter
      </label>
      <input
        id="filter-name"
        type="text"
        value={text}
        onChange={(e) => {
          const next = e.target.value
          setText(next)
          const committed = ensureExt(next)
          if (committed !== filePath) {
            setFilePath(committed)
            setDirty(true)
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Escape') {
            ;(e.target as HTMLInputElement).blur()
          }
        }}
        placeholder="Untitled"
        title="Filter name (.filter extension is added automatically)"
        spellCheck={false}
        className="flex-1 min-w-0 bg-[#0a0a0f] text-xs text-slate-300 placeholder:text-slate-500 placeholder:italic px-2 py-1 rounded border border-[#1d2128] hover:border-[#2a2f38] focus:border-amber-500/50 outline-none"
      />
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
          dirty ? 'bg-amber-500' : 'bg-transparent'
        }`}
        title={dirty ? 'Unsaved changes' : undefined}
      />
    </div>
  )
}
