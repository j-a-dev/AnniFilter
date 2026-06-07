import { useState } from 'react'
import type { FilterOption } from '@/engine/types'
import { useFilterStore } from '@/store/filterStore'
import { useUIStore } from '@/store/uiStore'

/**
 * Collapsible panel to flip option toggles and preview gating live. Reflects
 * each option's effective state (override if set, else declared default) and
 * feeds `optionStates` into the cascade previews. Category headers bulk-toggle
 * their members. Hidden when the filter declares no options.
 */
export function OptionSimulator() {
  const options = useFilterStore((s) => s.document.options)
  const categories = useFilterStore((s) => s.document.optionCategories)
  const optionStates = useUIStore((s) => s.optionStates)
  const setOptionState = useUIStore((s) => s.setOptionState)
  const resetOptionStates = useUIStore((s) => s.resetOptionStates)
  const [open, setOpen] = useState(false)

  if (options.length === 0) return null

  const effective = (opt: FilterOption) =>
    optionStates.has(opt.id)
      ? (optionStates.get(opt.id) as boolean)
      : opt.defaultOn

  const overrideCount = options.filter(
    (o) => optionStates.has(o.id) && optionStates.get(o.id) !== o.defaultOn,
  ).length

  const setCategory = (name: string, on: boolean) => {
    for (const o of options) if (o.categoryName === name) setOptionState(o.id, on)
  }

  const uncategorized = options.filter((o) => o.categoryName === undefined)

  const Row = (opt: FilterOption) => (
    <label
      key={opt.id}
      className="flex items-center gap-2 py-0.5 cursor-pointer"
      title={`Default: ${opt.defaultOn ? 'on' : 'off'}`}
    >
      <input
        type="checkbox"
        checked={effective(opt)}
        onChange={(e) => setOptionState(opt.id, e.target.checked)}
        className="w-3.5 h-3.5"
      />
      <span className="text-[11px] text-slate-300 truncate">
        {opt.label || opt.id}
      </span>
    </label>
  )

  return (
    <div className="border-t border-[#1d2128] shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 h-8 text-[10px] uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
      >
        <span>
          Simulate options
          {overrideCount > 0 && (
            <span className="text-amber-400 normal-case"> · {overrideCount} changed</span>
          )}
        </span>
        <span>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="px-3 pb-2 max-h-56 overflow-y-auto">
          {overrideCount > 0 && (
            <button
              onClick={resetOptionStates}
              className="text-[10px] text-slate-400 hover:text-amber-300 mb-1"
            >
              Reset to defaults
            </button>
          )}
          {uncategorized.map(Row)}
          {categories.map((cat) => {
            const members = options.filter((o) => o.categoryName === cat.name)
            if (members.length === 0) return null
            return (
              <div key={cat.name} className="mt-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">
                    {cat.name}
                  </span>
                  <span className="flex gap-2">
                    <button
                      onClick={() => setCategory(cat.name, true)}
                      className="text-[9px] uppercase tracking-wider text-slate-500 hover:text-emerald-300"
                    >
                      all on
                    </button>
                    <button
                      onClick={() => setCategory(cat.name, false)}
                      className="text-[9px] uppercase tracking-wider text-slate-500 hover:text-rose-300"
                    >
                      all off
                    </button>
                  </span>
                </div>
                {members.map(Row)}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
