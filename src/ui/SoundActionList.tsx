import type { Action, FilterBlock } from '@/engine/types'
import { useFilterStore } from '@/store/filterStore'
import { defaultActionFor } from './actionDefaults'
import { SoundPicker } from './SoundPicker'

export function SoundActionList({ block }: { block: FilterBlock }) {
  const addAction = useFilterStore((s) => s.addAction)
  const updateAction = useFilterStore((s) => s.updateAction)
  const removeAction = useFilterStore((s) => s.removeAction)

  const sounds: Array<{
    index: number
    action: Extract<Action, { keyword: 'PlayAlertSound' }>
  }> = []
  block.actions.forEach((a, i) => {
    if (a.keyword === 'PlayAlertSound') {
      sounds.push({ index: i, action: a })
    }
  })

  return (
    <div className="space-y-1">
      {sounds.length === 0 ? (
        <div className="flex items-center gap-2 opacity-60">
          <span className="text-[11px] text-slate-500 italic">no sound</span>
          <button
            onClick={() =>
              addAction(block.id, defaultActionFor('PlayAlertSound'))
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
            <SoundPicker
              action={s.action}
              onChange={(next) => updateAction(block.id, s.index, next)}
            />
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
