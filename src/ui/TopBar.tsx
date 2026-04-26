import { useCallback } from 'react'
import { useFilterStore } from '@/store/filterStore'
import { useUIStore } from '@/store/uiStore'
import { useFileOperations } from '@/hooks/useFileOperations'

export function TopBar() {
  const dirty = useFilterStore((s) => s.dirty)
  const filePath = useFilterStore((s) => s.filePath)
  const loadFromText = useFilterStore((s) => s.loadFromText)
  const activeTab = useUIStore((s) => s.activeTab)
  const setActiveTab = useUIStore((s) => s.setActiveTab)

  const undo = useFilterStore.temporal.getState().undo
  const redo = useFilterStore.temporal.getState().redo
  const { openFile, saveFile, saveFileAs, clearFileHandle } =
    useFileOperations()

  const confirmUnsaved = useCallback(() => {
    if (!dirty) return true
    return window.confirm('You have unsaved changes. Discard them?')
  }, [dirty])

  const handleNew = useCallback(() => {
    if (!confirmUnsaved()) return
    clearFileHandle()
    loadFromText('')
  }, [confirmUnsaved, clearFileHandle, loadFromText])

  const handleOpen = useCallback(async () => {
    if (!confirmUnsaved()) return
    await openFile()
  }, [confirmUnsaved, openFile])

  return (
    <header className="h-12 flex items-center px-4 border-b border-[#1d2128] bg-[#0e1014] shrink-0 gap-3">
      <h1 className="text-sm font-semibold text-[#c8a94e] tracking-wide">
        AnniFilter
      </h1>

      <div className="flex items-center gap-1">
        <ToolButton onClick={handleNew} label="New" />
        <ToolButton onClick={handleOpen} label="Open" />
        <ToolButton onClick={saveFile} label="Save" title="Ctrl+S" />
        <ToolButton onClick={saveFileAs} label="Save As" />
      </div>

      <div className="w-px h-5 bg-[#1d2128]" />

      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={`text-xs truncate ${filePath ? 'text-slate-300' : 'text-slate-500 italic'}`}
        >
          {filePath ?? 'Untitled'}
        </span>
        {dirty && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"
            title="Unsaved changes"
          />
        )}
      </div>

      <div className="w-px h-5 bg-[#1d2128]" />

      <div className="flex items-center gap-1">
        <ToolButton onClick={() => undo()} label="Undo" title="Ctrl+Z" />
        <ToolButton
          onClick={() => redo()}
          label="Redo"
          title="Ctrl+Shift+Z"
        />
      </div>

      <div className="w-px h-5 bg-[#1d2128]" />

      <div className="flex gap-0.5 bg-[#0a0a0f] p-0.5 rounded">
        {(['visual', 'raw'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 text-[11px] uppercase tracking-wider rounded transition-colors ${
              activeTab === tab
                ? 'bg-[#c8a94e] text-[#0a0a0f] font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1d22]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="ml-auto" />
    </header>
  )
}

function ToolButton({
  onClick,
  label,
  title,
}: {
  onClick: () => void
  label: string
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="px-2.5 py-1 text-[11px] bg-[#1a1d22] text-slate-300 rounded border border-[#2a2d32] hover:bg-[#252830] hover:border-[#3a3f48] transition-colors"
    >
      {label}
    </button>
  )
}
