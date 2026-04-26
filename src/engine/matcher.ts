import type { FilterDocument, ItemDescription, MatchResult } from './types'

export function match(
  _document: FilterDocument,
  _item: ItemDescription,
): MatchResult {
  return {
    styleStack: [],
    terminator: null,
    visible: true,
    effectiveActions: [],
  }
}
