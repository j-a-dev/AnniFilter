import { useMemo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { FilterBlock } from '@/engine/types'
import { useFilterStore } from '@/store/filterStore'
import { previewActionsForBlock } from '@/engine/preview'
import { KIND_COLOR, summarizeConditions } from './ruleListUtils'
import { ItemPreview } from './ItemPreview'
import { IndicatorLane } from './IndicatorLane'

type Props = {
  block: FilterBlock
  index: number
  selected: boolean
}

export function RuleListRow({ block, index, selected }: Props) {
  const selectBlock = useFilterStore((s) => s.selectBlock)
  const toggleBlock = useFilterStore((s) => s.toggleBlock)
  const document = useFilterStore((s) => s.document)

  const previewActions = useMemo(
    () => previewActionsForBlock(document, block.id),
    [document, block.id],
  )

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : block.enabled ? 1 : 0.45,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => selectBlock(block.id)}
      className={`relative flex items-center gap-2 h-11 pr-2 cursor-pointer border-b border-[#161a1f] hover:bg-[#15181d] ${
        selected ? 'bg-[#1a2438] ring-1 ring-inset ring-amber-500/30' : ''
      }`}
    >
      {selected && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[2px] bg-amber-400"
          aria-hidden
        />
      )}
      <div className={`w-1 h-full ${KIND_COLOR[block.kind]}`} aria-hidden />

      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="w-3 h-full flex items-center justify-center text-slate-600 hover:text-slate-300 cursor-grab active:cursor-grabbing select-none"
        title="Drag to reorder"
        aria-label="Drag handle"
      >
        ⋮⋮
      </button>

      <input
        type="checkbox"
        checked={block.enabled}
        onChange={() => toggleBlock(block.id)}
        onClick={(e) => e.stopPropagation()}
        className="w-3.5 h-3.5"
        title={block.enabled ? 'Disable rule' : 'Enable rule'}
      />

      <div
        className={`text-[10px] tabular-nums w-7 text-right shrink-0 ${selected ? 'text-amber-300 font-semibold' : 'text-slate-500'}`}
      >
        {String(index + 1).padStart(3, '0')}
      </div>

      <div className="flex-1 min-w-0">
        <div
          className={`text-[12px] truncate leading-tight ${selected ? 'text-amber-200' : 'text-slate-100'}`}
        >
          {block.label ?? <span className="italic text-slate-500">(unnamed)</span>}
        </div>
        <div className="text-[10px] text-slate-500 truncate leading-tight">
          {summarizeConditions(block)}
        </div>
      </div>

      <div className="w-[180px] h-11 flex items-center justify-center shrink-0 overflow-hidden bg-gradient-to-r from-transparent via-[#07080b] to-transparent">
        <ItemPreview actions={previewActions} label={block.label} compact />
      </div>

      <IndicatorLane actions={previewActions} />
    </div>
  )
}
