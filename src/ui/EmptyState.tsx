import { useFileOperations } from '@/hooks/useFileOperations'
import { useFilterStore } from '@/store/filterStore'
import { SAMPLES, type Sample } from '@/samples'

export function EmptyState() {
  const { openFile, loadSample } = useFileOperations()
  const addBlock = useFilterStore((s) => s.addBlock)
  const selectBlock = useFilterStore((s) => s.selectBlock)

  const openSample = async (sample: Sample) => {
    loadSample(await sample.load())
  }

  const startBlank = () => {
    // Seed one rule so there's something to edit — a 0-block document is
    // indistinguishable from "no filter" and would just bounce back here.
    const id = addBlock('Show')
    selectBlock(id)
  }

  return (
    <div className="flex-1 h-full flex items-center justify-center p-8 bg-[#0b0d10]">
      <div className="w-full max-w-md text-center">
        <div className="text-lg font-semibold text-[#c8a94e] mb-1">
          No filter open
        </div>
        <div className="text-xs text-slate-500 mb-6">
          Open one of your own <code className="text-slate-400">.filter</code>{' '}
          files, or load a sample to explore.
        </div>

        <button
          onClick={() => void openFile()}
          className="w-full px-3 py-2 text-xs bg-[#1a1d22] text-slate-200 rounded border border-[#2a2d32] hover:bg-[#252830] hover:border-[#3a3f48] transition-colors"
        >
          Open .filter…
        </button>

        {SAMPLES.length > 0 && (
          <>
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-[#1d2128]" />
              <span className="text-[10px] uppercase tracking-wider text-slate-600">
                or load a sample
              </span>
              <div className="flex-1 h-px bg-[#1d2128]" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {SAMPLES.map((sample) => (
                <SampleButton
                  key={sample.id}
                  onClick={() => void openSample(sample)}
                  name={sample.name}
                  blurb={sample.blurb}
                />
              ))}
            </div>
          </>
        )}

        <button
          onClick={startBlank}
          className="mt-6 text-[11px] text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors"
        >
          Start with a blank filter
        </button>
      </div>
    </div>
  )
}

function SampleButton({
  onClick,
  name,
  blurb,
}: {
  onClick: () => void
  name: string
  blurb: string
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 px-3 py-2.5 rounded border border-[#2a2d32] bg-[#12161a] hover:bg-[#1a1f25] hover:border-[#3a3f48] transition-colors text-left"
    >
      <div className="text-xs font-medium text-slate-200">{name}</div>
      {blurb && (
        <div className="text-[10px] text-slate-500 mt-0.5">{blurb}</div>
      )}
    </button>
  )
}
