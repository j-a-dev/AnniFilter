import { create } from 'zustand'

export type ActiveTab = 'visual' | 'raw' | 'simulator'

type UIState = {
  activeTab: ActiveTab
  sidebarCollapsed: boolean
  simulatorCollapsed: boolean

  setActiveTab: (tab: ActiveTab) => void
  toggleSidebar: () => void
  toggleSimulator: () => void
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'visual',
  sidebarCollapsed: false,
  simulatorCollapsed: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () =>
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleSimulator: () =>
    set((s) => ({ simulatorCollapsed: !s.simulatorCollapsed })),
}))
