import { useEffect } from 'react'
import { AppShell } from '@/ui/AppShell'
import { useFilterStore } from '@/store/filterStore'
import { clearSession, loadSession } from '@/lib/sessionStore'

export function App() {
  useEffect(() => {
    // Restore the last saved filter so a reload doesn't drop the user on a
    // blank editor. Only when nothing is loaded yet (guards HMR re-mounts).
    const state = useFilterStore.getState()
    if (state.document.blocks.length > 0 || state.rawText !== '') return
    const session = loadSession()
    if (!session) return
    state.loadFromText(session.rawText)
    // If the snapshot no longer parses (parser change, corrupted storage),
    // loadFromText refuses it and leaves the document empty. Don't attach the
    // saved file path to that empty doc — a later Save would overwrite the real
    // file with nothing. Discard the unusable snapshot instead.
    if (useFilterStore.getState().loadError) {
      clearSession()
      return
    }
    state.setFilePath(session.filePath)
  }, [])

  return <AppShell />
}
