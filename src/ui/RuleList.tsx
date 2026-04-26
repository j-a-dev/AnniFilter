import { useUIStore } from '@/store/uiStore'

export function RuleList() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggle = useUIStore((s) => s.toggleSidebar)

  return (
    <aside
      className="border-r border-[#1d2128] bg-[#0e1014] shrink-0 overflow-hidden transition-all duration-150"
      style={{ width: collapsed ? 32 : 360 }}
    >
      <div className="flex items-center justify-between px-3 h-9 border-b border-[#1d2128]">
        <span
          className={`text-[10px] uppercase tracking-wider text-slate-500 ${collapsed ? 'hidden' : ''}`}
        >
          Rules
        </span>
        <button
          onClick={toggle}
          className="text-slate-500 hover:text-slate-200 text-xs"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>
      {!collapsed && (
        <div className="p-6 text-xs text-slate-500 italic">
          Rule list — Phase 2.3
        </div>
      )}
    </aside>
  )
}
