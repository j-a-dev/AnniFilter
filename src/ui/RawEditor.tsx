import { useEffect, useMemo, useRef, useState } from 'react'
import { useFilterStore } from '@/store/filterStore'
import { KIND_COLOR } from './ruleListUtils'

/**
 * Read-only filter source view, rendered as a stack of segments. Each block
 * is its own clickable segment that selects the corresponding rule in the
 * left list. The user cannot edit text here — all editing flows through the
 * structured rule editor and propagates back into rawText.
 */
export function RawEditor() {
  const rawText = useFilterStore((s) => s.rawText)
  const blockRanges = useFilterStore((s) => s.blockRanges)
  const blocks = useFilterStore((s) => s.document.blocks)
  const selectedBlockId = useFilterStore((s) => s.selectedBlockId)
  const selectBlock = useFilterStore((s) => s.selectBlock)

  const [copied, setCopied] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard access may fail in non-secure contexts. No-op.
    }
  }

  const segments = useMemo(() => {
    type Segment =
      | { kind: 'static'; text: string }
      | {
          kind: 'block'
          id: string
          text: string
          label: string
          blockKind: 'Show' | 'Hide' | 'Style'
          index: number
        }
    const list: Segment[] = []

    if (blocks.length === 0) {
      if (rawText.length > 0) list.push({ kind: 'static', text: rawText })
      return list
    }

    const firstRange = blockRanges.get(blocks[0]!.id)
    if (firstRange && firstRange.charStart > 0) {
      list.push({ kind: 'static', text: rawText.slice(0, firstRange.charStart) })
    }

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i]!
      const range = blockRanges.get(block.id)
      if (!range) continue
      list.push({
        kind: 'block',
        id: block.id,
        text: rawText.slice(range.charStart, range.charEnd),
        label: block.label ?? '',
        blockKind: block.kind,
        index: i + 1,
      })
    }

    const lastBlock = blocks[blocks.length - 1]!
    const lastRange = blockRanges.get(lastBlock.id)
    if (lastRange && lastRange.charEnd < rawText.length) {
      const tail = rawText.slice(lastRange.charEnd, rawText.length)
      // Skip a tail that is just whitespace — the segments already provide
      // their own line breaks via CSS spacing.
      if (tail.trim().length > 0) list.push({ kind: 'static', text: tail })
    }

    return list
  }, [rawText, blockRanges, blocks])

  // Scroll the selected block into view when selection changes (or when this
  // editor mounts with an existing selection from the visual view).
  useEffect(() => {
    if (!selectedBlockId) return
    const el = containerRef.current?.querySelector(
      `[data-raw-block-id="${selectedBlockId}"]`,
    )
    if (el && 'scrollIntoView' in el) {
      ;(el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [selectedBlockId])

  return (
    <div className="relative h-full bg-[#0a0a0f]">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-3 z-10 px-2.5 py-1 text-[11px] bg-[#1a1d22] text-slate-300 rounded border border-[#2a2d32] hover:bg-[#252830] hover:border-[#3a3f48] transition-colors"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <div
        ref={containerRef}
        className="h-full overflow-y-auto p-4 pr-20 space-y-3 selection:bg-amber-500/30"
      >
        {segments.map((seg, i) => {
          if (seg.kind === 'static') {
            return (
              <pre
                key={`static-${i}`}
                className="font-mono text-xs text-slate-500 whitespace-pre-wrap m-0"
              >
                {seg.text}
              </pre>
            )
          }
          const selected = seg.id === selectedBlockId
          return (
            <div
              key={seg.id}
              data-raw-block-id={seg.id}
              className={`group rounded border transition-colors ${
                selected
                  ? 'border-amber-500/40 bg-amber-500/[0.06]'
                  : 'border-transparent hover:border-[#1d2128] hover:bg-[#0e1014]'
              }`}
            >
              <button
                type="button"
                onClick={() => selectBlock(seg.id)}
                title="Jump to this rule in the list"
                className="flex items-center gap-2 px-2 py-1 text-[10px] uppercase tracking-wider text-slate-500 hover:text-amber-300 w-full text-left"
              >
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${KIND_COLOR[seg.blockKind]}`}
                />
                <span className="tabular-nums">#{seg.index}</span>
                <span className="text-slate-400 normal-case tracking-normal truncate">
                  {seg.blockKind}
                  {seg.label ? ` · ${seg.label}` : ''}
                </span>
                <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                  ↗
                </span>
              </button>
              <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap m-0 px-2 pb-2">
                {seg.text}
              </pre>
            </div>
          )
        })}
      </div>
    </div>
  )
}
