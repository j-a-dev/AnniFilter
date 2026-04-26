import { useUIStore } from '@/store/uiStore'

export function Simulator() {
  const collapsed = useUIStore((s) => s.simulatorCollapsed)
  const toggle = useUIStore((s) => s.toggleSimulator)

  return (
    <aside
      className="border-l border-[#1d2128] bg-[#0e1014] shrink-0 overflow-hidden transition-all duration-150"
      style={{ width: collapsed ? 32 : 320 }}
    >
      <div className="flex items-center justify-between px-3 h-9 border-b border-[#1d2128]">
        <button
          onClick={toggle}
          className="text-slate-500 hover:text-slate-200 text-xs"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '◀' : '▶'}
        </button>
        <span
          className={`text-[10px] uppercase tracking-wider text-slate-500 ${collapsed ? 'hidden' : ''}`}
        >
          Preview
        </span>
      </div>
      {!collapsed && (
        <div className="p-6 text-xs text-slate-500 italic">
          Live preview — Phase 2.5
        </div>
      )}
    </aside>
  )
}
