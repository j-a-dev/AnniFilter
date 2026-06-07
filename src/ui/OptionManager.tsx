import { useEffect, useState } from 'react'
import type { FilterOption } from '@/engine/types'
import { useFilterStore } from '@/store/filterStore'

const inputClass =
  'bg-[#0a0a0f] text-xs text-slate-300 placeholder:text-slate-500 placeholder:italic px-2 py-1 rounded border border-[#1d2128] hover:border-[#2a2f38] focus:border-amber-500/50 outline-none'

function uniqueId(existing: ReadonlySet<string>, base: string): string {
  let n = existing.size + 1
  while (existing.has(`${base}${n}`)) n++
  return `${base}${n}`
}

/**
 * Document-level option + category editor, shown in the detail pane when no
 * rule is selected. Option ids are auto-generated stable keys (edit the raw
 * file for custom ids); label/default/category are edited here. Deleting an
 * option or category keeps block/option references consistent via the store.
 */
export function OptionManager() {
  const options = useFilterStore((s) => s.document.options)
  const categories = useFilterStore((s) => s.document.optionCategories)
  const setOptions = useFilterStore((s) => s.setOptions)
  const setOptionCategories = useFilterStore((s) => s.setOptionCategories)
  const removeOption = useFilterStore((s) => s.removeOption)
  const renameCategory = useFilterStore((s) => s.renameCategory)
  const removeCategory = useFilterStore((s) => s.removeCategory)

  const ids = new Set(options.map((o) => o.id))
  const categoryNames = new Set(categories.map((c) => c.name))

  const patchOption = (id: string, patch: Partial<FilterOption>) =>
    setOptions(options.map((o) => (o.id === id ? { ...o, ...patch } : o)))

  const setOptionCategory = (id: string, categoryName: string | undefined) =>
    setOptions(
      options.map((o) => {
        if (o.id !== id) return o
        const next = { ...o }
        if (categoryName === undefined) delete next.categoryName
        else next.categoryName = categoryName
        return next
      }),
    )

  const addOption = () =>
    setOptions([
      ...options,
      { id: uniqueId(ids, 'option-'), label: '', defaultOn: true },
    ])

  const addCategory = () =>
    setOptionCategories([
      ...categories,
      { name: uniqueId(categoryNames, 'Category ') },
    ])

  return (
    <div className="px-4 py-3 border-t border-[#1d2128]">
      <div className="flex items-center justify-between mb-3 max-w-xl">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          Options
        </span>
        <button
          onClick={addOption}
          className="text-[11px] text-slate-400 hover:text-amber-300 px-2 py-0.5 rounded border border-[#2a2d32] hover:border-amber-500/40 transition-colors"
        >
          + Add option
        </button>
      </div>

      <div className="space-y-1.5 max-w-xl">
        {options.length === 0 && (
          <p className="text-[11px] text-slate-600 italic">
            No options. Add one, then gate a rule by it from the rule's header.
          </p>
        )}
        {options.map((opt) => (
          <div key={opt.id} className="flex items-center gap-2">
            <code
              className="text-[10px] text-slate-500 w-24 shrink-0 truncate"
              title={opt.id}
            >
              {opt.id}
            </code>
            <input
              type="text"
              value={opt.label}
              onChange={(e) => patchOption(opt.id, { label: e.target.value })}
              placeholder="In-game label"
              spellCheck={false}
              className={`flex-1 min-w-0 ${inputClass}`}
            />
            <select
              value={opt.categoryName ?? ''}
              onChange={(e) =>
                setOptionCategory(opt.id, e.target.value || undefined)
              }
              title="Category"
              className={`${inputClass} w-28 shrink-0`}
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <label
              className="flex items-center gap-1 text-[10px] text-slate-500 shrink-0"
              title="Default on?"
            >
              <input
                type="checkbox"
                checked={opt.defaultOn}
                onChange={(e) => patchOption(opt.id, { defaultOn: e.target.checked })}
                className="w-3.5 h-3.5"
              />
              on
            </label>
            <button
              onClick={() => removeOption(opt.id)}
              title="Remove option"
              className="px-1.5 py-1 text-[11px] text-slate-500 hover:text-rose-300 hover:bg-rose-500/10 rounded border border-transparent hover:border-rose-500/30 transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 mb-2 max-w-xl">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          Categories
        </span>
        <button
          onClick={addCategory}
          className="text-[11px] text-slate-400 hover:text-amber-300 px-2 py-0.5 rounded border border-[#2a2d32] hover:border-amber-500/40 transition-colors"
        >
          + Add category
        </button>
      </div>

      <div className="space-y-1.5 max-w-xl">
        {categories.length === 0 && (
          <p className="text-[11px] text-slate-600 italic">
            Categories group options in the in-game menu (optional).
          </p>
        )}
        {categories.map((cat) => (
          <div key={cat.name} className="flex items-center gap-2">
            <CommitInput
              value={cat.name}
              onCommit={(next) => {
                if (next && next !== cat.name && !categoryNames.has(next)) {
                  renameCategory(cat.name, next)
                }
              }}
              placeholder="Category name"
              className={`flex-1 min-w-0 ${inputClass}`}
            />
            <button
              onClick={() => removeCategory(cat.name)}
              title="Remove category (ungroups its options)"
              className="px-1.5 py-1 text-[11px] text-slate-500 hover:text-rose-300 hover:bg-rose-500/10 rounded border border-transparent hover:border-rose-500/30 transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Text input that only commits its value on blur / Enter (so a key field
 * isn't rewritten on every keystroke). */
function CommitInput({
  value,
  onCommit,
  placeholder,
  className,
}: {
  value: string
  onCommit: (next: string) => void
  placeholder?: string
  className?: string
}) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  return (
    <input
      type="text"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        if (text !== value) onCommit(text.trim())
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        if (e.key === 'Escape') {
          setText(value)
          ;(e.target as HTMLInputElement).blur()
        }
      }}
      placeholder={placeholder}
      spellCheck={false}
      className={className}
    />
  )
}
