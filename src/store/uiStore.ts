import { create } from 'zustand'

export type ActiveTab = 'visual' | 'raw'

type UIState = {
  activeTab: ActiveTab
  setActiveTab: (tab: ActiveTab) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'visual',
  setActiveTab: (tab) => set({ activeTab: tab }),
}))
