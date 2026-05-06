import { create } from 'zustand'
import { temporal } from 'zundo'
import type {
  Action,
  BlockKind,
  Condition,
  FilterBlock,
  FilterDocument,
  ValidationIssue,
} from '@/engine/types'
import { parse } from '@/engine/parser'
import { generate, generateWithRanges, type BlockRange } from '@/engine/generator'
import { validate } from '@/engine/validator'

let mutCounter = 0
function nextMutId(): string {
  return `mut-${Date.now()}-${++mutCounter}`
}

function emptyBlock(kind: BlockKind, id: string): FilterBlock {
  return {
    id,
    kind,
    enabled: true,
    conditions: [],
    actions: [],
    intraBlockComments: [],
  }
}

function updateBlockInPlace(
  doc: FilterDocument,
  id: string,
  updater: (block: FilterBlock) => FilterBlock,
): FilterDocument {
  return {
    ...doc,
    blocks: doc.blocks.map((b) => (b.id === id ? updater(b) : b)),
  }
}

type FilterState = {
  document: FilterDocument
  rawText: string
  blockRanges: Map<string, BlockRange>
  filePath: string | null
  dirty: boolean
  issues: ValidationIssue[]
  selectedBlockId: string | null

  // I/O
  loadFromText: (text: string) => void
  toText: () => string
  setFilePath: (path: string | null) => void
  setDirty: (dirty: boolean) => void
  selectBlock: (id: string | null) => void

  // Block mutations
  addBlock: (kind: BlockKind, afterId?: string) => string
  removeBlock: (id: string) => void
  duplicateBlock: (id: string) => string | null
  moveBlock: (id: string, toIndex: number) => void
  toggleBlock: (id: string) => void
  updateBlockKind: (id: string, kind: BlockKind) => void
  updateBlockLabel: (id: string, label: string | undefined) => void

  // Condition mutations
  addCondition: (blockId: string, condition: Condition) => void
  updateCondition: (blockId: string, index: number, condition: Condition) => void
  removeCondition: (blockId: string, index: number) => void

  // Action mutations
  addAction: (blockId: string, action: Action) => void
  updateAction: (blockId: string, index: number, action: Action) => void
  removeAction: (blockId: string, index: number) => void
  setBlockActions: (blockId: string, actions: Action[]) => void
}

const emptyDocument: FilterDocument = {
  blocks: [],
  presets: [],
  preamble: [],
  trailingComments: [],
}

export const useFilterStore = create<FilterState>()(
  temporal(
    (set, get) => {
      // Apply a transform to the document and sync rawText + issues + dirty.
      const applyDocPatch = (
        transform: (doc: FilterDocument) => FilterDocument,
      ): void => {
        const document = transform(get().document)
        const { text, blockRanges } = generateWithRanges(document)
        set({
          document,
          rawText: text,
          blockRanges,
          issues: validate(document),
          dirty: true,
        })
      }

      return {
        document: emptyDocument,
        rawText: '',
        blockRanges: new Map(),
        filePath: null,
        dirty: false,
        issues: [],
        selectedBlockId: null,

        // ─── I/O ──────────────────────────────────────────────
        loadFromText: (text) => {
          const result = parse(text)
          // Use the regenerated text so rawText and blockRanges agree on
          // offsets. Comments-in-block position isn't preserved by the
          // round-trip anyway, so showing the canonical form on load is
          // consistent with what edits would produce.
          const { text: rawText, blockRanges } = generateWithRanges(
            result.document,
          )
          const issues = [...result.issues, ...validate(result.document)]
          set({
            document: result.document,
            rawText,
            blockRanges,
            issues,
            dirty: false,
            selectedBlockId: null,
          })
        },

        toText: () => generate(get().document),

        setFilePath: (path) => set({ filePath: path }),

        setDirty: (dirty) => set({ dirty }),

        selectBlock: (id) => set({ selectedBlockId: id }),

        // ─── Block mutations ──────────────────────────────────
        addBlock: (kind, afterId) => {
          const id = nextMutId()
          applyDocPatch((doc) => {
            const blocks = [...doc.blocks]
            const block = emptyBlock(kind, id)
            if (afterId) {
              const i = blocks.findIndex((b) => b.id === afterId)
              if (i >= 0) {
                blocks.splice(i + 1, 0, block)
              } else {
                blocks.push(block)
              }
            } else {
              blocks.push(block)
            }
            return { ...doc, blocks }
          })
          return id
        },

        removeBlock: (id) => {
          applyDocPatch((doc) => ({
            ...doc,
            blocks: doc.blocks.filter((b) => b.id !== id),
          }))
          if (get().selectedBlockId === id) {
            set({ selectedBlockId: null })
          }
        },

        duplicateBlock: (id) => {
          const source = get().document.blocks.find((b) => b.id === id)
          if (!source) return null
          const newId = nextMutId()
          applyDocPatch((doc) => {
            const blocks = [...doc.blocks]
            const i = blocks.findIndex((b) => b.id === id)
            const dup: FilterBlock = {
              ...source,
              id: newId,
              conditions: source.conditions.map((c) => ({ ...c })),
              actions: source.actions.map((a) => ({ ...a })),
              intraBlockComments: [...source.intraBlockComments],
              presetOverrides: source.presetOverrides
                ? { ...source.presetOverrides }
                : undefined,
            }
            blocks.splice(i + 1, 0, dup)
            return { ...doc, blocks }
          })
          return newId
        },

        moveBlock: (id, toIndex) => {
          applyDocPatch((doc) => {
            const blocks = [...doc.blocks]
            const fromIndex = blocks.findIndex((b) => b.id === id)
            if (fromIndex < 0) return doc
            const clamped = Math.max(0, Math.min(blocks.length - 1, toIndex))
            if (fromIndex === clamped) return doc
            const [block] = blocks.splice(fromIndex, 1)
            if (block) blocks.splice(clamped, 0, block)
            return { ...doc, blocks }
          })
        },

        toggleBlock: (id) => {
          applyDocPatch((doc) =>
            updateBlockInPlace(doc, id, (b) => ({ ...b, enabled: !b.enabled })),
          )
        },

        updateBlockKind: (id, kind) => {
          applyDocPatch((doc) =>
            updateBlockInPlace(doc, id, (b) => ({ ...b, kind })),
          )
        },

        updateBlockLabel: (id, label) => {
          applyDocPatch((doc) =>
            updateBlockInPlace(doc, id, (b) => ({ ...b, label })),
          )
        },

        // ─── Condition mutations ──────────────────────────────
        addCondition: (blockId, condition) => {
          applyDocPatch((doc) =>
            updateBlockInPlace(doc, blockId, (b) => ({
              ...b,
              conditions: [...b.conditions, condition],
            })),
          )
        },

        updateCondition: (blockId, index, condition) => {
          applyDocPatch((doc) =>
            updateBlockInPlace(doc, blockId, (b) => {
              const conditions = [...b.conditions]
              if (index >= 0 && index < conditions.length) {
                conditions[index] = condition
              }
              return { ...b, conditions }
            }),
          )
        },

        removeCondition: (blockId, index) => {
          applyDocPatch((doc) =>
            updateBlockInPlace(doc, blockId, (b) => ({
              ...b,
              conditions: b.conditions.filter((_, i) => i !== index),
            })),
          )
        },

        // ─── Action mutations ─────────────────────────────────
        addAction: (blockId, action) => {
          applyDocPatch((doc) =>
            updateBlockInPlace(doc, blockId, (b) => ({
              ...b,
              actions: [...b.actions, action],
            })),
          )
        },

        updateAction: (blockId, index, action) => {
          applyDocPatch((doc) =>
            updateBlockInPlace(doc, blockId, (b) => {
              const actions = [...b.actions]
              if (index >= 0 && index < actions.length) {
                actions[index] = action
              }
              return { ...b, actions }
            }),
          )
        },

        removeAction: (blockId, index) => {
          applyDocPatch((doc) =>
            updateBlockInPlace(doc, blockId, (b) => ({
              ...b,
              actions: b.actions.filter((_, i) => i !== index),
            })),
          )
        },

        setBlockActions: (blockId, actions) => {
          applyDocPatch((doc) =>
            updateBlockInPlace(doc, blockId, (b) => ({ ...b, actions })),
          )
        },
      }
    },
    {
      partialize: (state) => ({
        document: state.document,
        rawText: state.rawText,
        blockRanges: state.blockRanges,
      }),
    },
  ),
)
