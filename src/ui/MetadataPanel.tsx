import { useFilterStore } from '@/store/filterStore'

const FILTER_EXT = '.filter'
const stripExt = (path: string | null) => {
  if (!path) return ''
  return path.endsWith(FILTER_EXT) ? path.slice(0, -FILTER_EXT.length) : path
}

const inputClass =
  'flex-1 min-w-0 bg-[#0a0a0f] text-xs text-slate-300 placeholder:text-slate-500 placeholder:italic px-2 py-1 rounded border border-[#1d2128] hover:border-[#2a2f38] focus:border-amber-500/50 outline-none'

/**
 * Document-level filter metadata (`@Name`/`@Author`/`@Version`/`@Description`),
 * shown in the detail pane when no rule is selected. The filename (file
 * identity) is edited separately in the top bar — this panel only governs the
 * in-game info text, previewed live as the game composes it.
 */
export function MetadataPanel() {
  const metadata = useFilterStore((s) => s.document.metadata)
  const filePath = useFilterStore((s) => s.filePath)
  const updateMetadata = useFilterStore((s) => s.updateMetadata)

  const fileName = stripExt(filePath) || 'Untitled'

  const setDescription = (index: number, value: string) => {
    const descriptions = [...metadata.descriptions]
    descriptions[index] = value
    updateMetadata({ descriptions })
  }
  const addDescription = () =>
    updateMetadata({ descriptions: [...metadata.descriptions, ''] })
  const removeDescription = (index: number) =>
    updateMetadata({
      descriptions: metadata.descriptions.filter((_, i) => i !== index),
    })

  return (
    <div className="flex flex-col">
      <div className="px-4 py-3 border-b border-[#1d2128]">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-3">
          Filter info
        </div>

        <div className="space-y-2 max-w-xl">
          <Field label="Name">
            <input
              type="text"
              value={metadata.name ?? ''}
              onChange={(e) => updateMetadata({ name: e.target.value || undefined })}
              placeholder="Filter display name"
              spellCheck={false}
              className={inputClass}
            />
          </Field>
          <Field label="Author">
            <input
              type="text"
              value={metadata.author ?? ''}
              onChange={(e) => updateMetadata({ author: e.target.value || undefined })}
              placeholder="Your name"
              spellCheck={false}
              className={inputClass}
            />
          </Field>
          <Field label="Version">
            <input
              type="text"
              value={metadata.version ?? ''}
              onChange={(e) => updateMetadata({ version: e.target.value || undefined })}
              placeholder="1.0"
              spellCheck={false}
              className={inputClass}
            />
          </Field>

          <Field label="Description" align="start">
            <div className="flex-1 space-y-1">
              {metadata.descriptions.map((d, i) => (
                <div key={i} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={d}
                    onChange={(e) => setDescription(i, e.target.value)}
                    placeholder="Description line"
                    spellCheck={false}
                    className={inputClass}
                  />
                  <button
                    onClick={() => removeDescription(i)}
                    title="Remove line"
                    className="px-1.5 py-1 text-[11px] text-slate-500 hover:text-rose-300 hover:bg-rose-500/10 rounded border border-transparent hover:border-rose-500/30 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={addDescription}
                className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded border border-[#2a2d32] hover:border-[#3a4050] transition-colors"
              >
                + Add line
              </button>
            </div>
          </Field>
        </div>
      </div>

      <InGamePreview
        fileName={fileName}
        name={metadata.name ?? ''}
        author={metadata.author ?? ''}
        version={metadata.version ?? ''}
        descriptions={metadata.descriptions}
      />
    </div>
  )
}

function Field({
  label,
  align = 'center',
  children,
}: {
  label: string
  align?: 'center' | 'start'
  children: React.ReactNode
}) {
  return (
    <div className={`flex gap-3 ${align === 'start' ? 'items-start' : 'items-center'}`}>
      <span
        className={`text-[10px] uppercase tracking-wider text-slate-500 w-20 shrink-0 ${
          align === 'start' ? 'pt-1.5' : ''
        }`}
      >
        {label}
      </span>
      {children}
    </div>
  )
}

/** Mirrors how the game presents a filter: a selection-grid row and an info box. */
function InGamePreview({
  fileName,
  name,
  author,
  version,
  descriptions,
}: {
  fileName: string
  name: string
  author: string
  version: string
  descriptions: string[]
}) {
  const headline = `${name} by ${author} ${version}`.replace(/\s+/g, ' ').trim()
  return (
    <div className="px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
        In-game preview
      </div>
      <div className="max-w-xl space-y-2">
        <div className="grid grid-cols-[2fr_1fr_1fr] gap-2 text-[11px] bg-[#0a0a0f] border border-[#1d2128] rounded px-2 py-1.5">
          <span className="text-slate-200 truncate" title={fileName}>
            {fileName}
          </span>
          <span className="text-slate-400 truncate">{author || '—'}</span>
          <span className="text-slate-400 truncate">{version || '—'}</span>
        </div>
        <div className="text-xs text-slate-300 bg-[#0a0a0f] border border-[#1d2128] rounded px-2 py-1.5 whitespace-pre-wrap leading-relaxed">
          {headline || <span className="text-slate-600 italic">No name set</span>}
          {descriptions.length > 0 && '\n'}
          {descriptions.join('\n')}
        </div>
      </div>
    </div>
  )
}
