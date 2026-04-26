import { useEffect, useState } from 'react'
import type { BlockKind, FilterBlock } from '@/engine/types'
import { useFilterStore } from '@/store/filterStore'
import { KIND_COLOR } from './ruleListUtils'

const KINDS: BlockKind[] = ['Hide', 'Show', 'Style']

export function RuleDetailHeader({ block }: { block: FilterBlock }) {
  const blocks = useFilterStore((s) => s.document.blocks)
  const updateBlockKind = useFilterStore((s) => s.updateBlockKind)
  const updateBlockLabel = useFilterStore((s) => s.updateBlockLabel)
  const toggleBlock = useFilterStore((s) => s.toggleBlock)
  const removeBlock = useFilterStore((s) => s.removeBlock)

  const index = blocks.findIndex((b) => b.id === block.id)

  // Two-step inline confirmation for delete: first click arms; second click
  // within the same selection commits. Switching to another rule auto-disarms.
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  useEffect(() => {
    setConfirmingDelete(false)
  }, [block.id])

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1d2128]">
      <div className="text-[10px] tabular-nums text-slate-500 w-9 text-right">
        #{String(index + 1).padStart(3, '0')}
      </div>
      <input
        type="checkbox"
        checked={block.enabled}
        onChange={() => toggleBlock(block.id)}
        title={block.enabled ? 'Disable rule' : 'Enable rule'}
        className="w-3.5 h-3.5"
      />
      <div className="flex gap-0.5 bg-[#0a0a0f] p-0.5 rounded">
        {KINDS.map((k) => (
          <button
            key={k}
            onClick={() => updateBlockKind(block.id, k)}
            className={`px-2.5 py-0.5 text-[10px] uppercase tracking-wider rounded transition-colors flex items-center gap-1.5 ${
              block.kind === k
                ? 'bg-[#1a1d22] text-slate-100'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${KIND_COLOR[k]}`}
            />
            {k}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={block.label ?? ''}
        onChange={(e) => updateBlockLabel(block.id, e.target.value || undefined)}
        placeholder="Click to add a rule label…"
        className="flex-1 bg-[#0a0a0f] text-[13px] text-slate-100 px-2 py-1 rounded border border-[#1d2128] hover:border-[#2a3144] focus:border-amber-500/50 focus:bg-[#12161a] outline-none"
      />
      {confirmingDelete ? (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setConfirmingDelete(false)}
            className="px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200 rounded border border-[#2a2d32] hover:border-[#3a4050] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => removeBlock(block.id)}
            autoFocus
            className="px-2 py-1 text-[11px] text-rose-200 bg-rose-500/15 hover:bg-rose-500/25 rounded border border-rose-500/40 transition-colors"
          >
            Confirm delete
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmingDelete(true)}
          title="Delete rule"
          className="px-2 py-1 text-[11px] text-slate-500 hover:text-rose-300 hover:bg-rose-500/10 rounded border border-transparent hover:border-rose-500/30 transition-colors"
        >
          Delete
        </button>
      )}
    </div>
  )
}
