// Persists the last *saved* filter state (not a live autosave) so a reload
// restores what the user last wrote to disk instead of a blank editor.
// Only the save paths in useFileOperations write here; restore happens once on
// app mount. rawText round-trips through the parser, so it's the whole snapshot.

const KEY = 'annifilter:last-saved'

export type SavedSession = {
  rawText: string
  filePath: string | null
}

export function saveSession(session: SavedSession): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(session))
  } catch {
    // localStorage can be unavailable (private mode, quota) — persistence is
    // best-effort, so a failure just means no restore next time.
  }
}

export function loadSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'rawText' in parsed &&
      typeof (parsed as SavedSession).rawText === 'string'
    ) {
      const s = parsed as SavedSession
      return { rawText: s.rawText, filePath: s.filePath ?? null }
    }
    return null
  } catch {
    return null
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // best-effort
  }
}
