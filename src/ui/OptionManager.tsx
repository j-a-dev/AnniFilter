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

/**
 * Document-level option + category editor (shown in the detail pane via the
 * "Filter info" button). Both lists are drag-to-reorder with inline-editable
 * text; "+ Add" appends a default-named item you edit in place. Option ids are
 * auto-generated stable keys (edit raw for custom ids); deletes keep block /
 * option references consistent via the store.
 */
export function OptionManager() {
  const options = useFilterStore((s) => s.document.options)
  const categories = useFilterStore((s) => s.document.optionCategories)
  const setOptions = useFilterStore((s) => s.setOptions)
  const setOptionCategories = useFilterStore((s) => s.setOptionCategories)
  const removeOption = useFilterStore((s) => s.removeOption)
  const renameCategory = useFilterStore((s) => s.renameCategory)
  const removeCategory = useFilterStore((s) => s.removeCategory)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

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
      { id: uniqueId(ids, 'option-'), label: 'New option', defaultOn: true },
    ])

  const addCategory = () =>
    setOptionCategories([
      ...categories,
      { name: uniqueId(categoryNames, 'Category ') },
    ])

  const onOptionDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = options.findIndex((o) => o.id === active.id)
    const to = options.findIndex((o) => o.id === over.id)
    if (from < 0 || to < 0) return
    setOptions(arrayMove(options, from, to))
  }

  const onCategoryDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = categories.findIndex((c) => c.name === active.id)
    const to = categories.findIndex((c) => c.name === over.id)
    if (from < 0 || to < 0) return
    setOptionCategories(arrayMove(categories, from, to))
  }

  return (
    <div className="px-4 py-3 border-t border-[#1d2128]">
      <SectionHeader title="Options" onAdd={addOption} addLabel="+ Add option" />
      <div className="max-w-xl">
        {options.length === 0 ? (
          <Empty>Add an option, then gate a rule by it from the rule's header.</Empty>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onOptionDragEnd}
          >
            <SortableContext
              items={options.map((o) => o.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {options.map((opt) => (
                  <SortableOptionRow
                    key={opt.id}
                    opt={opt}
                    categories={categories}
                    onPatch={patchOption}
                    onSetCategory={setOptionCategory}
                    onRemove={removeOption}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="mt-4">
        <SectionHeader
          title="Categories"
          onAdd={addCategory}
          addLabel="+ Add category"
        />
        <div className="max-w-xl">
          {categories.length === 0 ? (
            <Empty>Categories group options in the in-game menu (optional).</Empty>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onCategoryDragEnd}
            >
              <SortableContext
                items={categories.map((c) => c.name)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <SortableCategoryRow
                      key={cat.name}
                      cat={cat}
                      taken={categoryNames}
                      onRename={renameCategory}
                      onRemove={removeCategory}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  )
}

function SortableOptionRow({
  opt,
  categories,
  onPatch,
  onSetCategory,
  onRemove,
}: {
  opt: FilterOption
  categories: OptionCategory[]
  onPatch: (id: string, patch: Partial<FilterOption>) => void
  onSetCategory: (id: string, categoryName: string | undefined) => void
  onRemove: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: opt.id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1">
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
      <select
        value={opt.categoryName ?? ''}
        onChange={(e) => onSetCategory(opt.id, e.target.value || undefined)}
        title="Category"
        className="shrink-0 w-28 bg-[#0a0a0f] text-[11px] text-slate-300 px-1.5 py-1 rounded border border-[#1d2128] hover:border-[#2a3144] focus:border-amber-500/50 outline-none"
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
  cat,
  taken,
  onRename,
  onRemove,
}: {
  cat: OptionCategory
  taken: ReadonlySet<string>
  onRename: (oldName: string, newName: string) => void
  onRemove: (name: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cat.name })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1">
      <button {...attributes} {...listeners} className={handleClass} aria-label="Drag to reorder">
        ⋮⋮
      </button>
      <CommitInput
        value={cat.name}
        onCommit={(next) => {
          if (next && next !== cat.name && !taken.has(next)) onRename(cat.name, next)
        }}
        placeholder="Category name"
        className={textClass}
      />
      <button onClick={() => onRemove(cat.name)} title="Remove category" className={removeClass}>
        ✕
      </button>
    </div>
  )
}

function SectionHeader({
  title,
  onAdd,
  addLabel,
}: {
  title: string
  onAdd: () => void
  addLabel: string
}) {
  return (
    <div className="flex items-center justify-between mb-2 max-w-xl">
      <span className="text-[10px] uppercase tracking-wider text-slate-500">{title}</span>
      <button
        onClick={onAdd}
        className="text-[11px] text-slate-400 hover:text-amber-300 px-2 py-0.5 rounded border border-[#2a2d32] hover:border-amber-500/40 transition-colors"
      >
        {addLabel}
      </button>
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-slate-600 italic">{children}</p>
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
