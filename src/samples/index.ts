import manifest from './index.json'

/** A bundled sample filter, offered from the welcome screen. */
export type Sample = {
  /** Filename without extension; stable id / React key. */
  id: string
  /** Display label. */
  name: string
  /** Short description shown under the name; may be ''. */
  blurb: string
  /** Lazily fetch the raw `.filter` text (its own chunk, loaded on demand). */
  load: () => Promise<string>
}

type ManifestEntry = { file: string; name: string; blurb?: string }

// Lazy (no `eager`): each `.filter` becomes an on-demand import, so sample text
// stays out of the initial bundle and is fetched only when the user picks it.
const loaders = import.meta.glob('./*.filter', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>

// The welcome screen shows exactly what index.json lists, in that order. To add
// a sample: drop a `.filter` here and add a `{ file, name, blurb }` entry. To
// hide one: remove its entry. Entries pointing at a missing file are skipped.
// (Both require a rebuild — or a dev-server restart, since vite.config.ts
// excludes *.filter from the watcher.)
export const SAMPLES: Sample[] = (manifest as ManifestEntry[])
  .map((entry) => {
    const load = loaders[`./${entry.file}`]
    if (!load) return null
    return {
      id: entry.file.replace(/\.filter$/, ''),
      name: entry.name,
      blurb: entry.blurb ?? '',
      load,
    }
  })
  .filter((s): s is Sample => s !== null)
