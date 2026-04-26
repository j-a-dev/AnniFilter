import type { FilterBlock } from '@/engine/types'
import { useFilterStore } from '@/store/filterStore'
import { DROP_SOUNDS } from '@/engine/data/spec'

export function SoundActionList({ block }: { block: FilterBlock }) {
  const addAction = useFilterStore((s) => s.addAction)
  const updateAction = useFilterStore((s) => s.updateAction)
  const removeAction = useFilterStore((s) => s.removeAction)

  const sounds: Array<{ index: number; soundId: number }> = []
  block.actions.forEach((a, i) => {
    if (a.keyword === 'PlayAlertSound') {
      sounds.push({ index: i, soundId: a.soundId })
    }
  })

  return (
    <div className="space-y-1">
      {sounds.length === 0 ? (
        <div className="flex items-center gap-2 opacity-60">
          <span className="text-[11px] text-slate-500 italic">no sound</span>
          <button
            onClick={() =>
              addAction(block.id, { keyword: 'PlayAlertSound', soundId: 11 })
            }
            className="text-[10px] text-amber-300/80 hover:text-amber-300 border border-dashed border-[#2a3144] rounded px-1.5 py-0.5"
          >
            + add sound
          </button>
        </div>
      ) : (
        sounds.map((s, slot) => (
          <div key={s.index} className="flex items-center gap-2">
            <span className="text-[10px] tabular-nums text-slate-500 w-4">
              {slot + 1}.
            </span>
            <select
              value={s.soundId}
              onChange={(e) =>
                updateAction(block.id, s.index, {
                  keyword: 'PlayAlertSound',
                  soundId: Number(e.target.value),
                })
              }
              className="bg-[#0a0a0f] text-slate-200 text-[11px] px-1.5 py-0.5 rounded border border-[#1d2128] flex-1"
            >
              {DROP_SOUNDS.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.id} - {ds.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => removeAction(block.id, s.index)}
              className="text-slate-500 hover:text-rose-400 text-xs px-1"
              title="Remove sound"
            >
              −
            </button>
          </div>
        ))
      )}
      {sounds.length > 0 && (
        <button
          onClick={() =>
            addAction(block.id, { keyword: 'PlayAlertSound', soundId: 11 })
          }
          className="text-[10px] text-slate-500 hover:text-amber-300 border border-dashed border-[#2a2d32] rounded px-1.5 py-0.5 ml-6"
        >
          + add another
        </button>
      )}
    </div>
  )
}
