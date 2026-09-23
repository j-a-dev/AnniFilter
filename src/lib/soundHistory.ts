// Remembers custom sound filenames the user has typed, so the input can offer
// them as suggestions across filters and sessions (browser-autofill style).
// Native form autofill only records on a real form submission, which this app
// never does, so the list lives in localStorage and feeds a <datalist>.

const KEY = 'annifilter:sound-files'
const MAX_ENTRIES = 50

export function loadSoundHistory(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === 'string')
      : []
  } catch {
    return []
  }
}

/** Most-recent first; re-using a name moves it to the front. */
export function rememberSoundFile(file: string): void {
  const name = file.trim()
  if (name === '') return
  try {
    const next = [name, ...loadSoundHistory().filter((n) => n !== name)]
    localStorage.setItem(KEY, JSON.stringify(next.slice(0, MAX_ENTRIES)))
  } catch {
    // best-effort, same as sessionStore
  }
}
