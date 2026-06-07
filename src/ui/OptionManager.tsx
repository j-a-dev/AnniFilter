import { useEffect, useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { FilterOption, OptionCategory } from '@/engine/types'
import { useFilterStore } from '@/store/filterStore'

const textClass =
  'flex-1 min-w-0 bg-transparent text-xs text-slate-200 placeholder:text-slate-500 placeholder:italic px-2 py-1 rounded border border-transparent hover:border-[#2a2f38] focus:border-amber-500/50 focus:bg-[#0a0a0f] outline-none'

const handleClass =
  'shrink-0 px-1 text-slate-600 hover:text-slate-300 cursor-grab active:cursor-grabbing select-none'

const removeClass =
  'shrink-0 px-1.5 py-1 text-[11px] text-slate-600 hover:text-rose-300 hover:bg-rose-500/10 rounded border border-transparent hover:border-rose-500/30 transition-colors'

function uniqueId(existing: ReadonlySet<string>, base: string): string {
  let n = existing.size + 1
  while (existing.has(`${base}${n}`)) n++
  return `${base}${n}`
}

/** Return `base` if free, else `base 2`, `base 3`, … — for human-facing text. */
function uniqueText(existing: ReadonlySet<string>, base: string): string {
  if (!existing.has(base)) return base
  let n = 2
  while (existing.has(`${base} ${n}`)) n++
  return `${base} ${n}`
}

/**
 * Enforce unique category names and option labels (duplicates can break or
 * confuse the in-game menu). Returns adjusted arrays if anything changed, else
 * null. Option ids are intentionally left alone — renaming one would orphan the
 * blocks that gate by it, and they're already auto-unique.
 */
function enforceUnique(
  options: FilterOption[],
  categories: OptionCategory[],
): { options: FilterOption[]; categories: OptionCategory[] } | null {
  let changed = false

  const seenCat = new Set<string>()
  const newCategories = categories.map((c) => {
    let name = c.name
    if (name === '' || seenCat.has(name)) {
      name = uniqueText(seenCat, name || 'Category')
      changed = true
    }
    seenCat.add(name)
    return name === c.name ? c : { name }
  })

  const seenLabel = new Set<string>()
  const newOptions = options.map((o) => {
    let label = o.label
    if (label === '' || seenLabel.has(label)) {
      label = uniqueText(seenLabel, label || 'Option')
      changed = true
    }
    seenLabel.add(label)
    return label === o.label ? o : { ...o, label }
  })

  return changed ? { options: newOptions, categories: newCategories } : null
}

type FlatItem =
  | { key: string; kind: 'category'; cat: OptionCategory }
  | { key: string; kind: 'option'; opt: FilterOption }

const optKey = (id: string) => `opt:${id}`
const catKey = (name: string) => `cat:${name}`

/** Linearize the model the way the filter file is laid out: uncategorized
 * options first (the implicit root), then each category header followed by its
 * member options. */
function flatten(
  options: FilterOption[],
  categories: OptionCategory[],
): FlatItem[] {
  const flat: FlatItem[] = []
  for (const opt of options)
    if (opt.categoryName === undefined)
      flat.push({ key: optKey(opt.id), kind: 'option', opt })
  for (const cat of categories) {
    flat.push({ key: catKey(cat.name), kind: 'category', cat })
    for (const opt of options)
      if (opt.categoryName === cat.name)
        flat.push({ key: optKey(opt.id), kind: 'option', opt })
  }
  return flat
}

/**
 * Document-level option + category editor (shown via "Filter info"). A single
 * drag-and-drop tree: uncategorized options sit under an implicit root at top;
 * each category is a container. Dropping an option below a category header puts
 * it in that category; dropping it above all headers makes it uncategorized.
 * Dragging a category reorders the categories. Option ids are auto-generated
 * stable keys (edit raw for custom ids).
 */
export function OptionManager() {
  const options = useFilterStore((s) => s.document.options)
  const categories = useFilterStore((s) => s.document.optionCategories)
  const setOptions = useFilterStore((s) => s.setOptions)
  const setOptionCategories = useFilterStore((s) => s.setOptionCategories)
  const setOptionLayout = useFilterStore((s) => s.setOptionLayout)
  const removeOption = useFilterStore((s) => s.removeOption)
  const renameCategory = useFilterStore((s) => s.renameCategory)
  const removeCategory = useFilterStore((s) => s.removeCategory)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

  // On leaving the filter-info panel, dedupe any duplicate category names /
  // option labels that were typed in, so they can't break the in-game menu.
  useEffect(() => {
    return () => {
      const st = useFilterStore.getState()
      const fixed = enforceUnique(st.document.options, st.document.optionCategories)
      if (fixed) st.setOptionLayout(fixed.options, fixed.categories)
    }
  }, [])

  const flat = flatten(options, categories)
  const ids = new Set(options.map((o) => o.id))
  const categoryNames = new Set(categories.map((c) => c.name))

  const patchOption = (id: string, patch: Partial<FilterOption>) =>
    setOptions(options.map((o) => (o.id === id ? { ...o, ...patch } : o)))

  const addOption = () =>
    setOptions([
      ...options,
      {
        id: uniqueId(ids, 'option-'),
        label: uniqueText(new Set(options.map((o) => o.label)), 'New option'),
        defaultOn: true,
      },
    ])

  const addCategory = () =>
    setOptionCategories([
      ...categories,
      { name: uniqueId(categoryNames, 'Category ') },
    ])

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = flat.findIndex((i) => i.key === active.id)
    const overIndex = flat.findIndex((i) => i.key === over.id)
    if (oldIndex < 0 || overIndex < 0) return
    const activeItem = flat[oldIndex]
    if (!activeItem) return

    if (activeItem.kind === 'option') {
      // Reorder in the flat list; the option's new category is the nearest
      // category header above its landing spot (or root if none).
      const newFlat = arrayMove(flat, oldIndex, overIndex)
      const pos = newFlat.findIndex((i) => i.key === active.id)
      let cat: string | undefined
      for (let j = pos - 1; j >= 0; j--) {
        const it = newFlat[j]
        if (it && it.kind === 'category') {
          cat = it.cat.name
          break
        }
      }
      const newOptions = newFlat
        .filter((i): i is Extract<FlatItem, { kind: 'option' }> => i.kind === 'option')
        .map((i) => {
          if (i.opt.id !== activeItem.opt.id) return i.opt
          const o = { ...i.opt }
          if (cat === undefined) delete o.categoryName
          else o.categoryName = cat
          return o
        })
      setOptionLayout(newOptions, categories)
    } else {
      // Category drag: reorder the categories (root stays at top regardless).
      const overItem = flat[overIndex]
      const toName =
        overItem?.kind === 'category' ? overItem.cat.name : overItem?.opt.categoryName
      const from = categories.findIndex((c) => c.name === activeItem.cat.name)
      let to = toName === undefined ? 0 : categories.findIndex((c) => c.name === toName)
      if (to < 0) to = 0
      if (from < 0 || from === to) return
      setOptionCategories(arrayMove(categories, from, to))
    }
  }

  return (
    <div className="px-4 py-3 border-t border-[#1d2128]">
      <div className="flex items-center justify-between mb-2 max-w-xl">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          Options &amp; categories
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={addOption}
            className="text-[11px] text-slate-400 hover:text-amber-300 px-2 py-0.5 rounded border border-[#2a2d32] hover:border-amber-500/40 transition-colors"
          >
            + Add option
          </button>
          <button
            onClick={addCategory}
            className="text-[11px] text-slate-400 hover:text-amber-300 px-2 py-0.5 rounded border border-[#2a2d32] hover:border-amber-500/40 transition-colors"
          >
            + Add category
          </button>
        </div>
      </div>

      <div className="max-w-xl">
        {flat.length === 0 ? (
          <p className="text-[11px] text-slate-600 italic">
            Add an option (gate a rule by it from the rule's header), and group
            options under categories by dragging them below a category.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={flat.map((i) => i.key)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {flat.map((item) =>
                  item.kind === 'category' ? (
                    <SortableCategoryRow
                      key={item.key}
                      id={item.key}
                      cat={item.cat}
                      taken={categoryNames}
                      onRename={renameCategory}
                      onRemove={removeCategory}
                    />
                  ) : (
                    <SortableOptionRow
                      key={item.key}
                      id={item.key}
                      opt={item.opt}
                      indented={item.opt.categoryName !== undefined}
                      onPatch={patchOption}
                      onRemove={removeOption}
                    />
                  ),
                )}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}

function SortableOptionRow({
  id,
  opt,
  indented,
  onPatch,
  onRemove,
}: {
  id: string
  opt: FilterOption
  indented: boolean
  onPatch: (id: string, patch: Partial<FilterOption>) => void
  onRemove: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 ${indented ? 'ml-5' : ''}`}
    >
      <button {...attributes} {...listeners} className={handleClass} aria-label="Drag to reorder">
        ⋮⋮
      </button>
      <input
        type="text"
        value={opt.label}
        onChange={(e) => onPatch(opt.id, { label: e.target.value })}
        placeholder="Option name"
        spellCheck={false}
        className={textClass}
      />
      <label
        className="flex items-center gap-1 text-[10px] text-slate-500 shrink-0"
        title="On by default?"
      >
        <input
          type="checkbox"
          checked={opt.defaultOn}
          onChange={(e) => onPatch(opt.id, { defaultOn: e.target.checked })}
          className="w-3.5 h-3.5"
        />
        on
      </label>
      <button onClick={() => onRemove(opt.id)} title="Remove option" className={removeClass}>
        ✕
      </button>
    </div>
  )
}

function SortableCategoryRow({
  id,
  cat,
  taken,
  onRename,
  onRemove,
}: {
  id: string
  cat: OptionCategory
  taken: ReadonlySet<string>
  onRename: (oldName: string, newName: string) => void
  onRemove: (name: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1 mt-1.5 border-t border-[#161a1f] pt-1.5"
    >
      <button {...attributes} {...listeners} className={handleClass} aria-label="Drag to reorder">
        ⋮⋮
      </button>
      <span className="text-slate-500" aria-hidden>
        ▸
      </span>
      <CommitInput
        value={cat.name}
        onCommit={(next) => {
          if (next && next !== cat.name && !taken.has(next)) onRename(cat.name, next)
        }}
        placeholder="Category name"
        className={`${textClass} font-semibold uppercase tracking-wider text-[11px] text-slate-300`}
      />
      <button onClick={() => onRemove(cat.name)} title="Remove category" className={removeClass}>
        ✕
      </button>
    </div>
  )
}

/** Text input that commits only on blur / Enter, so a key field isn't rewritten
 * on every keystroke. */
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
