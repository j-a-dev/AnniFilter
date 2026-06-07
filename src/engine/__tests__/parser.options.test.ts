import { describe, it, expect } from 'vitest'
import { parse } from '@/engine/parser'

describe('parser — option sets', () => {
  describe('metadata directives', () => {
    it('parses @Name / @Author / @Version and multiple @Description', () => {
      const text = [
        '@Name "Lenzy\'s Filter (Regular)"',
        '@Author Lenzy',
        '@Version 1.0',
        '@Description "first line"',
        '@Description "second line"',
        'Show',
      ].join('\n')
      const { document, fatalError } = parse(text)
      expect(fatalError).toBeNull()
      expect(document.metadata).toEqual({
        name: "Lenzy's Filter (Regular)",
        author: 'Lenzy',
        version: '1.0',
        descriptions: ['first line', 'second line'],
      })
    })

    it('warns and last-wins on duplicate single-valued metadata', () => {
      const text = '@Name "first"\n@Name "second"\nShow'
      const { document, issues, fatalError } = parse(text)
      expect(fatalError).toBeNull()
      expect(document.metadata.name).toBe('second')
      expect(issues.some((x) => x.code === 'duplicate-metadata')).toBe(true)
    })
  })

  describe('option + category declarations', () => {
    it('parses @Option fields and lowercase boolean default', () => {
      const text = '@Option "opt1" "Cool option" true\n@Option "opt2" "Off one" false\nShow'
      const { document } = parse(text)
      expect(document.options).toEqual([
        { id: 'opt1', label: 'Cool option', defaultOn: true },
        { id: 'opt2', label: 'Off one', defaultOn: false },
      ])
    })

    it('groups options under the preceding @Category; leaves earlier ones uncategorized', () => {
      const text = [
        '@Option "free1" "Uncategorized" true',
        '@Category "Test1"',
        '@Option "g1" "Grouped" true',
        'Show',
      ].join('\n')
      const { document } = parse(text)
      expect(document.optionCategories).toEqual([{ name: 'Test1' }])
      expect(document.options).toEqual([
        { id: 'free1', label: 'Uncategorized', defaultOn: true },
        { id: 'g1', label: 'Grouped', defaultOn: true, categoryName: 'Test1' },
      ])
    })
  })

  describe('gate regions', () => {
    it('tags enclosed blocks with optionId, leaves outside blocks ungated', () => {
      const text = [
        '@Option "opt1" "x" true',
        'Show #outside',
        '@OptionBegin "opt1"',
        'Show #inside1',
        'Hide #inside2',
        '@OptionEnd',
        'Show #after',
      ].join('\n')
      const { document, fatalError } = parse(text)
      expect(fatalError).toBeNull()
      expect(document.blocks.map((b) => b.optionId)).toEqual([
        undefined,
        'opt1',
        'opt1',
        undefined,
      ])
    })

    it('allows the same option id to gate multiple separate regions', () => {
      const text = [
        '@Option "opt1" "x" true',
        '@OptionBegin "opt1"',
        'Show',
        '@OptionEnd',
        '@OptionBegin "opt1"',
        'Hide',
        '@OptionEnd',
      ].join('\n')
      const { document, fatalError } = parse(text)
      expect(fatalError).toBeNull()
      expect(document.blocks.map((b) => b.optionId)).toEqual(['opt1', 'opt1'])
    })

    it('gates a disabled (commented) block', () => {
      const text = [
        '@Option "opt1" "x" true',
        '@OptionBegin "opt1"',
        '# Show',
        '#     ItemType "Runes"',
        '@OptionEnd',
      ].join('\n')
      const { document, fatalError } = parse(text)
      expect(fatalError).toBeNull()
      expect(document.blocks).toHaveLength(1)
      expect(document.blocks[0]?.enabled).toBe(false)
      expect(document.blocks[0]?.optionId).toBe('opt1')
    })
  })

  describe('load-fatal structural rules', () => {
    it('fails on a nested @OptionBegin', () => {
      const text = [
        '@Option "a" "a" true',
        '@Option "b" "b" true',
        '@OptionBegin "a"',
        '@OptionBegin "b"',
        'Show',
        '@OptionEnd',
        '@OptionEnd',
      ].join('\n')
      const { fatalError } = parse(text)
      expect(fatalError?.code).toBe('option-region-nested')
    })

    it('fails on @OptionBegin referencing an undeclared option', () => {
      const text = '@OptionBegin "ghost"\nShow\n@OptionEnd'
      const { fatalError } = parse(text)
      expect(fatalError?.code).toBe('option-undeclared')
    })

    it('fails on @OptionEnd with no open region', () => {
      const text = 'Show\n@OptionEnd'
      const { fatalError } = parse(text)
      expect(fatalError?.code).toBe('option-end-unmatched')
    })

    it('fails on an unclosed region at EOF', () => {
      const text = '@Option "a" "a" true\n@OptionBegin "a"\nShow'
      const { fatalError } = parse(text)
      expect(fatalError?.code).toBe('option-region-unclosed')
    })

    it('fails on a duplicate @Option id', () => {
      const text = '@Option "dup" "first" true\n@Option "dup" "second" false\nShow'
      const { fatalError } = parse(text)
      expect(fatalError?.code).toBe('duplicate-option-id')
    })
  })

  describe('tolerated (non-fatal) cases', () => {
    it('preserves an unknown @-directive and warns', () => {
      const text = '@Foobar "whatever"\nShow'
      const { document, issues, fatalError } = parse(text)
      expect(fatalError).toBeNull()
      expect(document.unknownDirectives).toContain('@Foobar "whatever"')
      expect(issues.some((x) => x.code === 'unknown-directive')).toBe(true)
    })

    it('ignores a stray argument on @OptionEnd with a warning', () => {
      const text = '@Option "a" "a" true\n@OptionBegin "a"\nShow\n@OptionEnd extra junk'
      const { document, issues, fatalError } = parse(text)
      expect(fatalError).toBeNull()
      expect(document.blocks[0]?.optionId).toBe('a')
      expect(issues.some((x) => x.code === 'option-end-extra-arg')).toBe(true)
    })
  })
})
