// Notes edit the leading comment block verbatim (full `#…` lines), so tab-aligned
// tables line up exactly as in Raw view and the exact prefix (`#`, `# `, `###`,
// `#====`) is preserved. The only adjustment: a non-empty line the user types
// without a leading `#` is turned into a comment, keeping the block valid.
//
// Kept out of MetadataPanel.tsx so that component module exports only its
// component — a non-component export there breaks React Fast Refresh.
export const notesToDisplay = (lines: string[]): string => lines.join('\n')
export const notesFromDisplay = (text: string): string[] =>
  text === ''
    ? []
    : text.split('\n').map((l) => (l === '' || /^\s*#/.test(l) ? l : `# ${l}`))
