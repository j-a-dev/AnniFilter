import { create } from 'zustand'
import { temporal } from 'zundo'
import type {
  Action,
  BlockKind,
  Condition,
  FilterBlock,
  FilterDocument,
  FilterMetadata,
  FilterOption,
  OptionCategory,
  ValidationIssue,
} from '@/engine/types'
import { parse } from '@/engine/parser'
import { generate, generateWithRanges, type BlockRange } from '@/engine/generator'
import { validate } from '@/engine/validator'
import { useUIStore } from './uiStore'

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
  /** Set when a load was refused due to a fatal structural error; null when the last load succeeded. */
  loadError: string | null

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

  // Option-set mutations
  updateMetadata: (patch: Partial<FilterMetadata>) => void
  /** Replace the leading comment block (one entry per line), edited as "Notes". */
  setPreamble: (lines: string[]) => void
  setOptions: (options: FilterOption[]) => void
  setOptionCategories: (categories: OptionCategory[]) => void
  /** Replace options and categories together in one step (drag-to-reorder/regroup). */
  setOptionLayout: (options: FilterOption[], categories: OptionCategory[]) => void
  setBlockOptionId: (blockId: string, optionId: string | undefined) => void
  /** Remove an option and clear it from any blocks that referenced it. */
  removeOption: (id: string) => void
  /** Rename a category, updating member options that point at it. */
  renameCategory: (oldName: string, newName: string) => void
  /** Remove a category and un-group its member options. */
  removeCategory: (name: string) => void
}

const emptyDocument: FilterDocument = {
  blocks: [],
  presets: [],
  preamble: [],
  metadata: { descriptions: [] },
  options: [],
  optionCategories: [],
  unknownDirectives: [],
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
        loadError: null,

        // ─── I/O ──────────────────────────────────────────────
        loadFromText: (text) => {
          const result = parse(text)
          // A fatal structural error refuses the load: keep the current
          // document untouched and surface the located message instead.
          if (result.fatalError) {
            set({
              loadError: `Line ${result.fatalError.line}: ${result.fatalError.message}`,
            })
            return
          }
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
            loadError: null,
          })
          // Loading a filter is an I/O boundary, not an edit: you should never
          // be able to undo across a load back into the previous filter (or into
          // the empty startup document on session restore). Drop the history so
          // the freshly loaded filter is the clean baseline, and resume tracking:
          // a load can land mid-edit (drop/sample/restore) while useUndoGroup has
          // zundo paused, which would otherwise leave tracking suspended so later
          // edits record no undo history.
          const temporal = useFilterStore.temporal.getState()
          temporal.clear()
          temporal.resume()
          // Simulation toggles are transient and filter-specific — clear them
          // so a freshly loaded filter starts from its declared option defaults.
          useUIStore.getState().resetOptionStates()
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

        // ─── Option-set mutations ─────────────────────────────
        updateMetadata: (patch) => {
          applyDocPatch((doc) => ({
            ...doc,
            metadata: { ...doc.metadata, ...patch },
          }))
        },

        setPreamble: (lines) => {
          applyDocPatch((doc) => ({ ...doc, preamble: lines }))
        },

        setOptions: (options) => {
          applyDocPatch((doc) => ({ ...doc, options }))
        },

        setOptionCategories: (categories) => {
          applyDocPatch((doc) => ({ ...doc, optionCategories: categories }))
        },

        setOptionLayout: (options, categories) => {
          applyDocPatch((doc) => ({
            ...doc,
            options,
            optionCategories: categories,
          }))
        },

        setBlockOptionId: (blockId, optionId) => {
          applyDocPatch((doc) =>
            updateBlockInPlace(doc, blockId, (b) => {
              const next = { ...b }
              if (optionId === undefined) delete next.optionId
              else next.optionId = optionId
              return next
            }),
          )
        },

        removeOption: (id) => {
          applyDocPatch((doc) => ({
            ...doc,
            options: doc.options.filter((o) => o.id !== id),
            blocks: doc.blocks.map((b) => {
              if (b.optionId !== id) return b
              const { optionId: _drop, ...rest } = b
              return rest
            }),
          }))
        },

        renameCategory: (oldName, newName) => {
          applyDocPatch((doc) => ({
            ...doc,
            optionCategories: doc.optionCategories.map((c) =>
              c.name === oldName ? { name: newName } : c,
            ),
            options: doc.options.map((o) =>
              o.categoryName === oldName ? { ...o, categoryName: newName } : o,
            ),
          }))
        },

        removeCategory: (name) => {
          applyDocPatch((doc) => ({
            ...doc,
            optionCategories: doc.optionCategories.filter((c) => c.name !== name),
            options: doc.options.map((o) => {
              if (o.categoryName !== name) return o
              const { categoryName: _drop, ...rest } = o
              return rest
            }),
          }))
        },
      }
    },
    {
      // Cap history so a long editing session can't grow memory without bound;
      // 100 steps is far more undo depth than this editor needs in practice.
      limit: 100,
      // document/rawText/blockRanges are snapshotted together so undo restores a
      // self-consistent triple (rawText + blockRanges must match the document, or
      // the raw-view segment mapping desyncs). rawText also backs `equality`.
      partialize: (state) => ({
        document: state.document,
        rawText: state.rawText,
        blockRanges: state.blockRanges,
      }),
      // zundo records on every set() unless told the state is unchanged. rawText
      // is regenerated from the document on every edit, so it's a faithful proxy
      // for the undoable state — comparing it skips no-op entries from sets that
      // don't alter the filter (selectBlock, setDirty, setFilePath, loadError).
      equality: (a, b) => a.rawText === b.rawText,
    },
  ),
)
