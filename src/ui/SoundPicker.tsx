import { useId, useMemo } from 'react'
import type { Action } from '@/engine/types'
import { DROP_SOUNDS } from '@/engine/data/spec'
import { useFilterStore } from '@/store/filterStore'
import { useUndoGroup } from '@/hooks/useUndoGroup'
import { loadSoundHistory, rememberSoundFile } from '@/lib/soundHistory'

type SoundAction = Extract<Action, { keyword: 'PlayAlertSound' }>

const CUSTOM = 'custom'

/**
 * Built-in drop sound select with a "Custom .wav" choice. Custom shows a
 * filename input whose suggestions are names used in this filter plus names
 * remembered from earlier edits.
 */
export function SoundPicker({
  action,
  onChange,
}: {
  action: SoundAction
  onChange: (next: SoundAction) => void
}) {
  const listId = useId()
  const blocks = useFilterStore((s) => s.document.blocks)
  const { edit, end } = useUndoGroup()
  const isFile = 'file' in action

  const suggestions = useMemo(() => {
    if (!isFile) return []
    const names = new Set<string>()
    for (const b of blocks) {
      for (const a of b.actions) {
        if (a.keyword === 'PlayAlertSound' && 'file' in a && a.file.trim()) {
          names.add(a.file.trim())
        }
      }
    }
    for (const n of loadSoundHistory()) names.add(n)
    return [...names]
  }, [blocks, isFile])

  return (
    <div className="flex items-center gap-2 flex-1">
      <select
        value={isFile ? CUSTOM : action.soundId}
        onChange={(e) =>
          onChange(
            e.target.value === CUSTOM
              ? { keyword: 'PlayAlertSound', file: '' }
              : { keyword: 'PlayAlertSound', soundId: Number(e.target.value) },
          )
        }
        className="bg-[#0a0a0f] text-slate-200 text-[11px] px-1.5 py-0.5 rounded border border-[#1d2128] flex-1"
      >
        {DROP_SOUNDS.map((ds) => (
          <option key={ds.id} value={ds.id}>
            {ds.id} - {ds.label}
          </option>
        ))}
        <option value={CUSTOM}>Custom .wav…</option>
      </select>
      {isFile && (
        <>
          <input
            type="text"
            list={listId}
            value={action.file}
            onChange={(e) => {
              const file = e.target.value
              edit(() => onChange({ keyword: 'PlayAlertSound', file }))
            }}
            onBlur={() => {
              end()
              rememberSoundFile(action.file)
            }}
            placeholder="filename.wav"
            spellCheck={false}
            className="flex-1 bg-[#0a0a0f] text-slate-200 text-[11px] font-mono px-2 py-0.5 rounded border border-[#1d2128] focus:border-amber-500/50 outline-none"
          />
          <datalist id={listId}>
            {suggestions.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </>
      )}
    </div>
  )
}
