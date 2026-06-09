import { useCallback, useRef } from 'react'
import { useFilterStore } from '@/store/filterStore'

/**
 * Collapse a continuous text-field edit into a single undo step.
 *
 * zundo records a history entry on every tracked `set()`, so a field bound
 * directly to the store grows one undo entry per keystroke. This hook lets the
 * first keystroke of an editing session record the pre-edit baseline, then
 * pauses zundo so the rest of the keystrokes update the document live (raw
 * preview keeps working) without piling up history. `end` — wired to `onBlur` —
 * resumes tracking. Net effect: one undo per field the user touched.
 *
 * One instance can be shared across the fields of a panel; only one field is
 * ever mid-edit at a time, and blur fires before the next field's focus.
 */
export function useUndoGroup() {
  const started = useRef(false)

  const edit = useCallback((mutate: () => void) => {
    const temporal = useFilterStore.temporal.getState()
    if (started.current) {
      // Coalesced into the in-progress entry: tracking is already paused.
      mutate()
    } else {
      started.current = true
      // Tracked: records the baseline (pre-edit state) as the undo target.
      mutate()
      temporal.pause()
    }
  }, [])

  const end = useCallback(() => {
    if (!started.current) return
    started.current = false
    useFilterStore.temporal.getState().resume()
  }, [])

  return { edit, end }
}
