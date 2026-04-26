import { create } from 'zustand'
import { temporal } from 'zundo'
import type { FilterDocument, ValidationIssue } from '@/engine/types'
import { parse } from '@/engine/parser'
import { generate } from '@/engine/generator'
import { validate } from '@/engine/validator'

type FilterState = {
  document: FilterDocument
  rawText: string
  filePath: string | null
  dirty: boolean
  issues: ValidationIssue[]
  selectedBlockId: string | null

  loadFromText: (text: string) => void
  setRawText: (text: string) => void
  reparseRaw: () => void
  toText: () => string
  setFilePath: (path: string | null) => void
  setDirty: (dirty: boolean) => void
  selectBlock: (id: string | null) => void
}

const emptyDocument: FilterDocument = {
  blocks: [],
  presets: [],
  preamble: [],
  trailingComments: [],
}

export const useFilterStore = create<FilterState>()(
  temporal(
    (set, get) => ({
      document: emptyDocument,
      rawText: '',
      filePath: null,
      dirty: false,
      issues: [],
      selectedBlockId: null,

      loadFromText: (text) => {
        const result = parse(text)
        const issues = [...result.issues, ...validate(result.document)]
        set({
          document: result.document,
          rawText: text,
          issues,
          dirty: false,
          selectedBlockId: null,
        })
      },

      setRawText: (text) => {
        set({ rawText: text, dirty: true })
      },

      reparseRaw: () => {
        const result = parse(get().rawText)
        const issues = [...result.issues, ...validate(result.document)]
        set({ document: result.document, issues })
      },

      toText: () => generate(get().document),

      setFilePath: (path) => set({ filePath: path }),

      setDirty: (dirty) => set({ dirty }),

      selectBlock: (id) => set({ selectedBlockId: id }),
    }),
    {
      partialize: (state) => ({
        document: state.document,
        rawText: state.rawText,
      }),
    },
  ),
)
