import { useFilterStore } from '@/store/filterStore'

/**
 * Textarea-based raw editor stub. Monaco wires up in P2.6.
 * Edits update rawText eagerly (sets dirty); reparseRaw() must be called
 * explicitly to sync the document AST — wired up to a blur handler here so
 * each focus-out is a parse boundary.
 */
export function RawEditor() {
  const rawText = useFilterStore((s) => s.rawText)
  const setRawText = useFilterStore((s) => s.setRawText)
  const reparseRaw = useFilterStore((s) => s.reparseRaw)

  return (
    <textarea
      value={rawText}
      onChange={(e) => setRawText(e.target.value)}
      onBlur={() => reparseRaw()}
      placeholder="Paste or open a .filter file. Monaco editor wires up in Phase 2.6."
      className="w-full h-full bg-[#0a0a0f] text-slate-300 font-mono text-xs p-4 outline-none resize-none border-0"
      spellCheck={false}
    />
  )
}
