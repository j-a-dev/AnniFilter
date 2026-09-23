import { beforeEach, describe, expect, it } from 'vitest'
import { loadSoundHistory, rememberSoundFile } from '@/lib/soundHistory'

describe('soundHistory', () => {
  beforeEach(() => localStorage.clear())

  it('remembers names most-recent first without duplicates', () => {
    rememberSoundFile('a.wav')
    rememberSoundFile('b.wav')
    rememberSoundFile(' a.wav ')
    expect(loadSoundHistory()).toEqual(['a.wav', 'b.wav'])
  })

  it('ignores empty names', () => {
    rememberSoundFile('   ')
    expect(loadSoundHistory()).toEqual([])
  })

  it('survives corrupt storage', () => {
    localStorage.setItem('annifilter:sound-files', '{not json')
    expect(loadSoundHistory()).toEqual([])
  })
})
