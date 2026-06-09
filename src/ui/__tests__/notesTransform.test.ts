import { describe, it, expect } from 'vitest'
import { notesToDisplay, notesFromDisplay } from '@/ui/notesText'

describe('Notes comment-block transform', () => {
  it('shows the stored comment lines verbatim (so tab tables align like Raw)', () => {
    const lines = ['# LightGreen\tGreen', '# White\t\t\tWhite2']
    expect(notesToDisplay(lines)).toBe('# LightGreen\tGreen\n# White\t\t\tWhite2')
  })

  it('round-trips exact prefixes without normalizing them', () => {
    const lines = ['###', '#Text', '# Text', '#==========', '   # indented']
    expect(notesFromDisplay(notesToDisplay(lines))).toEqual(lines)
  })

  it('treats an empty editor as no preamble', () => {
    expect(notesFromDisplay('')).toEqual([])
    expect(notesToDisplay([])).toBe('')
  })

  it('turns a non-comment line into a comment so the block stays valid', () => {
    expect(notesFromDisplay('# kept\nbare note')).toEqual(['# kept', '# bare note'])
  })

  it('preserves blank lines as-is', () => {
    expect(notesFromDisplay('# a\n\n# b')).toEqual(['# a', '', '# b'])
  })
})
