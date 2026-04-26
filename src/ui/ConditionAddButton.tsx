import { useState } from 'react'
import type { FilterBlock } from '@/engine/types'
import { useFilterStore } from '@/store/filterStore'
import {
  CONDITION_GROUPS,
  defaultConditionFor,
  type ConditionKeyword,
} from './conditionDefaults'

export function ConditionAddButton({ block }: { block: FilterBlock }) {
  const [open, setOpen] = useState(false)
  const addCondition = useFilterStore((s) => s.addCondition)

  const handlePick = (k: ConditionKeyword) => {
    addCondition(block.id, defaultConditionFor(k))
    setOpen(false)
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-[11px] text-slate-500 hover:text-slate-200 border border-dashed border-[#2a2d32] hover:border-[#3a4050] rounded px-2 py-0.5"
      >
        + condition
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 left-0 mt-1 bg-[#0e1014] border border-[#2a2d32] rounded shadow-lg p-2 min-w-[280px]">
            {CONDITION_GROUPS.map((group) => (
              <div key={group.label} className="mb-2 last:mb-0">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                  {group.label}
                </div>
                <div className="grid grid-cols-2 gap-0.5">
                  {group.keywords.map((k) => (
                    <button
                      key={k}
                      onClick={() => handlePick(k)}
                      className="text-[11px] text-left px-2 py-1 rounded text-slate-300 hover:bg-[#1a1d22] hover:text-slate-100"
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
