import { useCallback } from 'react'
import { useFilterStore } from '@/store/filterStore'
import { useUIStore } from '@/store/uiStore'
import { useFileOperations } from '@/hooks/useFileOperations'

export function AppShell() {
  const dirty = useFilterStore((s) => s.dirty)
  const filePath = useFilterStore((s) => s.filePath)
  const loadFromText = useFilterStore((s) => s.loadFromText)
  const {
    activeTab,
    setActiveTab,
    sidebarCollapsed,
    toggleSidebar,
    simulatorCollapsed,
    toggleSimulator,
  } = useUIStore()

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
    <div className="min-h-screen h-screen flex flex-col bg-[#0a0a0f] text-slate-200">
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
          {(['visual', 'raw', 'simulator'] as const).map((tab) => (
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

      <div className="flex flex-1 overflow-hidden">
        <aside
          className="border-r border-[#1d2128] bg-[#0e1014] shrink-0 overflow-hidden transition-all duration-150"
          style={{ width: sidebarCollapsed ? 32 : 360 }}
        >
          <div className="flex items-center justify-between px-3 h-9 border-b border-[#1d2128]">
            <span
              className={`text-[10px] uppercase tracking-wider text-slate-500 ${sidebarCollapsed ? 'hidden' : ''}`}
            >
              Rules
            </span>
            <button
              onClick={toggleSidebar}
              className="text-slate-500 hover:text-slate-200 text-xs"
              title={sidebarCollapsed ? 'Expand' : 'Collapse'}
            >
              {sidebarCollapsed ? '▶' : '◀'}
            </button>
          </div>
          {!sidebarCollapsed && (
            <Placeholder>Rule list — Phase 2</Placeholder>
          )}
        </aside>

        <main className="flex-1 overflow-y-auto bg-[#0b0d10]">
          {activeTab === 'visual' && (
            <Placeholder>Rule detail editor — Phase 2</Placeholder>
          )}
          {activeTab === 'raw' && <RawEditorStub />}
          {activeTab === 'simulator' && (
            <Placeholder>Simulator — Phase 2</Placeholder>
          )}
        </main>

        <aside
          className="border-l border-[#1d2128] bg-[#0e1014] shrink-0 overflow-hidden transition-all duration-150"
          style={{ width: simulatorCollapsed ? 32 : 320 }}
        >
          <div className="flex items-center justify-between px-3 h-9 border-b border-[#1d2128]">
            <button
              onClick={toggleSimulator}
              className="text-slate-500 hover:text-slate-200 text-xs"
              title={simulatorCollapsed ? 'Expand' : 'Collapse'}
            >
              {simulatorCollapsed ? '◀' : '▶'}
            </button>
            <span
              className={`text-[10px] uppercase tracking-wider text-slate-500 ${simulatorCollapsed ? 'hidden' : ''}`}
            >
              Preview
            </span>
          </div>
          {!simulatorCollapsed && (
            <Placeholder>Live preview — Phase 2</Placeholder>
          )}
        </aside>
      </div>

      <footer className="text-[10px] text-slate-600 px-4 py-1.5 border-t border-[#1d2128] bg-[#0e1014]">
        Item label font: AvQest by Graham Meade / GemFonts. 1001Fonts FFC license.
      </footer>
    </div>
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

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6 text-xs text-slate-500 italic">{children}</div>
  )
}

function RawEditorStub() {
  const rawText = useFilterStore((s) => s.rawText)
  const setRawText = useFilterStore((s) => s.setRawText)
  return (
    <textarea
      value={rawText}
      onChange={(e) => setRawText(e.target.value)}
      placeholder="Paste or open a .filter file. Monaco editor wires up in Phase 2."
      className="w-full h-full bg-[#0a0a0f] text-slate-300 font-mono text-xs p-4 outline-none resize-none border-0"
      spellCheck={false}
    />
  )
}
