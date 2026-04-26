import { create } from 'zustand'

export type ActiveTab = 'visual' | 'raw'

type UIState = {
  activeTab: ActiveTab
  sidebarCollapsed: boolean

  setActiveTab: (tab: ActiveTab) => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'visual',
  sidebarCollapsed: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () =>
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}))
