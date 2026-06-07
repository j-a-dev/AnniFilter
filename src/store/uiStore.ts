import { create } from 'zustand'

export type ActiveTab = 'visual' | 'raw'

type UIState = {
  activeTab: ActiveTab
  setActiveTab: (tab: ActiveTab) => void
  /**
   * Transient in-game toggle simulation: option id → on/off. An id absent here
   * falls back to the option's declared default. Not part of the document and
   * not undoable; reset when a new filter is loaded.
   */
  optionStates: Map<string, boolean>
  setOptionState: (id: string, on: boolean) => void
  resetOptionStates: () => void
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'visual',
  setActiveTab: (tab) => set({ activeTab: tab }),
  optionStates: new Map(),
  setOptionState: (id, on) =>
    set((s) => {
      const next = new Map(s.optionStates)
      next.set(id, on)
      return { optionStates: next }
    }),
  resetOptionStates: () => set({ optionStates: new Map() }),
}))
