import { useEffect, useMemo, useRef, useState } from 'react'
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
} from '@dnd-kit/sortable'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { BlockKind } from '@/engine/types'
import { useFilterStore } from '@/store/filterStore'
import { RuleListRow } from './RuleListRow'
import { FilenameInput } from './FilenameInput'
import { summarizeConditions, KIND_COLOR } from './ruleListUtils'

const ROW_HEIGHT = 44

const ALL_KINDS: BlockKind[] = ['Show', 'Hide', 'Style']

export function RuleList() {
  const blocks = useFilterStore((s) => s.document.blocks)
  const selectedId = useFilterStore((s) => s.selectedBlockId)
  const moveBlock = useFilterStore((s) => s.moveBlock)
  const addBlock = useFilterStore((s) => s.addBlock)
  const selectBlock = useFilterStore((s) => s.selectBlock)

  const handleAdd = () => {
    const newId = addBlock('Show', selectedId ?? undefined)
    selectBlock(newId)
  }

  const [search, setSearch] = useState('')
  const [kindFilter, setKindFilter] = useState<Set<BlockKind>>(new Set())

  const visible = useMemo(() => {
    return blocks.filter((b) => {
      if (kindFilter.size > 0 && !kindFilter.has(b.kind)) return false
      if (!search) return true
      const haystack = (b.label ?? '') + ' ' + summarizeConditions(b)
      return haystack.toLowerCase().includes(search.toLowerCase())
    })
  }, [blocks, search, kindFilter])

  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: visible.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  })

  // Scroll the selected block into view whenever selection changes.
  useEffect(() => {
    if (!selectedId) return
    const idx = visible.findIndex((b) => b.id === selectedId)
    if (idx >= 0) {
      virtualizer.scrollToIndex(idx, { align: 'center' })
    }
    // virtualizer is recreated on visible-length change; only re-run on
    // selection change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const target = blocks.findIndex((b) => b.id === over.id)
    if (target < 0) return
    moveBlock(active.id as string, target)
  }

  const toggleKind = (k: BlockKind) => {
    setKindFilter((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  }

  return (
    <aside className="w-[560px] border-r border-[#1d2128] bg-[#0e1014] shrink-0 overflow-hidden flex flex-col">
      <div className="px-3 py-2 border-b border-[#1d2128] shrink-0">
        <FilenameInput />
      </div>
      <div className="flex items-center justify-between px-3 h-9 border-b border-[#1d2128] shrink-0">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          Rules · {blocks.length}
        </span>
        <button
          onClick={handleAdd}
          title={
            selectedId
              ? 'Add a new Show rule after the selected one'
              : 'Add a new Show rule at the end'
          }
          className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-[#2a2d32] text-slate-400 hover:text-amber-300 hover:border-amber-500/40 transition-colors"
        >
          + Add rule
        </button>
      </div>

      <div className="px-3 py-2 border-b border-[#1d2128] shrink-0 space-y-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search labels and conditions…"
              className="w-full bg-[#0a0a0f] text-slate-300 text-[11px] px-2 py-1 rounded border border-[#2a2d32] focus:border-amber-500/50 outline-none"
            />
            <div className="flex gap-1">
              {ALL_KINDS.map((k) => {
                const active = kindFilter.has(k)
                return (
                  <button
                    key={k}
                    onClick={() => toggleKind(k)}
                    className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border transition-colors ${
                      active
                        ? 'border-[#3a4050] text-slate-200 bg-[#1a1d22]'
                        : 'border-[#1d2128] text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${KIND_COLOR[k]}`}
                    />
                    {k}
                  </button>
                )
              })}
              {kindFilter.size > 0 && (
                <button
                  onClick={() => setKindFilter(new Set())}
                  className="text-[10px] text-slate-500 hover:text-slate-300 ml-auto"
                  title="Clear filters"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div ref={parentRef} className="flex-1 overflow-y-auto">
            {visible.length === 0 ? (
              <div className="p-6 text-xs text-slate-500 italic">
                {blocks.length === 0
                  ? 'No rules. Open a .filter or click "+ Add rule".'
                  : 'No rules match the current filter.'}
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={visible.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div
                    style={{
                      height: virtualizer.getTotalSize(),
                      position: 'relative',
                    }}
                  >
                    {virtualizer.getVirtualItems().map((vRow) => {
                      const block = visible[vRow.index]
                      if (!block) return null
                      const trueIndex = blocks.findIndex(
                        (b) => b.id === block.id,
                      )
                      return (
                        <div
                          key={block.id}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            transform: `translateY(${vRow.start}px)`,
                          }}
                        >
                          <RuleListRow
                            block={block}
                            index={trueIndex}
                            selected={selectedId === block.id}
                          />
                        </div>
                      )
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
    </aside>
  )
}
