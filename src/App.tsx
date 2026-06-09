import { useEffect } from 'react'
import { AppShell } from '@/ui/AppShell'
import { useFilterStore } from '@/store/filterStore'
import { loadSession } from '@/lib/sessionStore'

export function App() {
  useEffect(() => {
    // Restore the last saved filter so a reload doesn't drop the user on a
    // blank editor. Only when nothing is loaded yet (guards HMR re-mounts).
    const state = useFilterStore.getState()
    if (state.document.blocks.length > 0 || state.rawText !== '') return
    const session = loadSession()
    if (!session) return
    state.loadFromText(session.rawText)
    state.setFilePath(session.filePath)
  }, [])

  return <AppShell />
}
