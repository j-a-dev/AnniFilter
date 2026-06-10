import { useMemo } from 'react'
import type { FilterBlock, ValidationIssue } from '@/engine/types'
import { useFilterStore } from './filterStore'

/** Map of blockId → issues attached to that block. Document-level issues
 *  (no blockId) are excluded — they live on the global issues array. */
export function useIssuesByBlockId(): Map<string, ValidationIssue[]> {
  const issues = useFilterStore((s) => s.issues)
  return useMemo(() => {
    const map = new Map<string, ValidationIssue[]>()
    for (const issue of issues) {
      if (!issue.blockId) continue
      const list = map.get(issue.blockId)
      if (list) list.push(issue)
      else map.set(issue.blockId, [issue])
    }
    return map
  }, [issues])
}

/** The currently selected block, if any. */
export function useSelectedBlock(): FilterBlock | null {
  const id = useFilterStore((s) => s.selectedBlockId)
  const blocks = useFilterStore((s) => s.document.blocks)
  return useMemo(
    () => (id ? (blocks.find((b) => b.id === id) ?? null) : null),
    [id, blocks],
  )
}
