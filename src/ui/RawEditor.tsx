import { useState } from 'react'
import { useFilterStore } from '@/store/filterStore'

/**
 * Read-only filter source view. The user can read or copy the generated
 * `.filter` text but cannot edit it here — all editing happens through the
 * structured rule editor and propagates back to this view automatically.
 */
export function RawEditor() {
  const rawText = useFilterStore((s) => s.rawText)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard access may fail in non-secure contexts. No-op.
    }
  }

  return (
    <div className="relative h-full">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-3 z-10 px-2.5 py-1 text-[11px] bg-[#1a1d22] text-slate-300 rounded border border-[#2a2d32] hover:bg-[#252830] hover:border-[#3a3f48] transition-colors"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <textarea
        readOnly
        value={rawText}
        className="w-full h-full bg-[#0a0a0f] text-slate-300 font-mono text-xs p-4 pr-20 outline-none resize-none border-0 selection:bg-amber-500/30"
        spellCheck={false}
      />
    </div>
  )
}
