import { useEffect, useState } from 'react'
import { useFilterStore } from '@/store/filterStore'
import { useUndoGroup } from '@/hooks/useUndoGroup'
import { notesToDisplay, notesFromDisplay } from './notesText'

const inputClass =
  'flex-1 min-w-0 bg-[#0a0a0f] text-xs text-slate-300 placeholder:text-slate-500 placeholder:italic px-2 py-1 rounded border border-[#1d2128] hover:border-[#2a2f38] focus:border-amber-500/50 outline-none'

/**
 * Document-level filter metadata (`@Name`/`@Author`/`@Version`/`@Description`),
 * shown in the detail pane when no rule is selected. The filename (file
 * identity) is edited separately in the top bar.
 */
export function MetadataPanel() {
  const metadata = useFilterStore((s) => s.document.metadata)
  const updateMetadata = useFilterStore((s) => s.updateMetadata)
  const preamble = useFilterStore((s) => s.document.preamble)
  const setPreamble = useFilterStore((s) => s.setPreamble)
  const { edit, end } = useUndoGroup()

  // Edit the comment block locally and commit on blur: auto-prefixing a bare
  // line would otherwise jump the cursor mid-keystroke, and a single commit is
  // naturally one undo step.
  const [notesText, setNotesText] = useState(() => notesToDisplay(preamble))
  useEffect(() => setNotesText(notesToDisplay(preamble)), [preamble])
  const commitNotes = () => {
    if (notesToDisplay(preamble) !== notesText) {
      setPreamble(notesFromDisplay(notesText))
    }
  }

  return (
    <div className="px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-3">
        Filter info
      </div>

      <div className="space-y-2 max-w-4xl">
        <Field label="Name">
          <input
            type="text"
            value={metadata.name ?? ''}
            onChange={(e) =>
              edit(() => updateMetadata({ name: e.target.value || undefined }))
            }
            onBlur={end}
            placeholder="Filter display name"
            spellCheck={false}
            className={inputClass}
          />
        </Field>
        <Field label="Author">
          <input
            type="text"
            value={metadata.author ?? ''}
            onChange={(e) =>
              edit(() => updateMetadata({ author: e.target.value || undefined }))
            }
            onBlur={end}
            placeholder="Your name"
            spellCheck={false}
            className={inputClass}
          />
        </Field>
        <Field label="Version">
          <input
            type="text"
            value={metadata.version ?? ''}
            onChange={(e) =>
              edit(() => updateMetadata({ version: e.target.value || undefined }))
            }
            onBlur={end}
            placeholder="1.0"
            spellCheck={false}
            className={inputClass}
          />
        </Field>
        <Field label="Description" align="start">
          <textarea
            value={metadata.descriptions.join('\n')}
            onChange={(e) => {
              const v = e.target.value
              // Each line becomes one @Description; empty input means none.
              edit(() =>
                updateMetadata({ descriptions: v === '' ? [] : v.split('\n') }),
              )
            }}
            onBlur={end}
            placeholder="One line per description line shown in-game"
            spellCheck={false}
            rows={5}
            className={`${inputClass} min-h-[4.5rem] resize-y leading-relaxed`}
          />
        </Field>
        <Field label="Notes" align="start">
          <textarea
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            onBlur={commitNotes}
            placeholder="# Comment block written at the top of the file (not shown in-game)"
            spellCheck={false}
            rows={15}
            className={`${inputClass} min-h-[6.5rem] resize-y font-mono text-[11px] leading-relaxed [tab-size:4]`}
          />
        </Field>
      </div>
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
