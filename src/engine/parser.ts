import type { FilterDocument, ValidationIssue } from './types'

export type ParseResult = {
  document: FilterDocument
  issues: ValidationIssue[]
}

export function parse(_text: string): ParseResult {
  return {
    document: {
      blocks: [],
      preamble: [],
      trailingComments: [],
    },
    issues: [],
  }
}
