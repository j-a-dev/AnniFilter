import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFilterStore } from '@/store/filterStore'
import { useUndoGroup } from '@/hooks/useUndoGroup'

function temporal() {
  return useFilterStore.temporal.getState()
}

function metaName() {
  return useFilterStore.getState().document.metadata.name
}

describe('useUndoGroup', () => {
  beforeEach(() => {
    useFilterStore.getState().loadFromText('Show\n  SetTextColor White')
    temporal().clear()
  })

  it('collapses a continuous edit into a single undo step', () => {
    const { result } = renderHook(() => useUndoGroup())
    const { updateMetadata } = useFilterStore.getState()

    // Simulate typing "Name" one character at a time within one focus session.
    act(() => {
      for (const v of ['N', 'Na', 'Nam', 'Name']) {
        result.current.edit(() => updateMetadata({ name: v }))
      }
    })
    expect(metaName()).toBe('Name')
    // Tracking is paused mid-edit; only the baseline was recorded.
    expect(temporal().pastStates).toHaveLength(1)

    act(() => result.current.end())

    act(() => temporal().undo())
    // One undo returns to the pre-edit baseline (no name), not "Nam".
    expect(metaName()).toBeUndefined()
  })

  it('records separate entries for distinct edit sessions', () => {
    const { result } = renderHook(() => useUndoGroup())
    const { updateMetadata } = useFilterStore.getState()

    act(() => {
      result.current.edit(() => updateMetadata({ name: 'A' }))
      result.current.edit(() => updateMetadata({ name: 'AB' }))
      result.current.end()
    })
    act(() => {
      result.current.edit(() => updateMetadata({ author: 'X' }))
      result.current.edit(() => updateMetadata({ author: 'XY' }))
      result.current.end()
    })

    expect(temporal().pastStates).toHaveLength(2)
    act(() => temporal().undo())
    expect(useFilterStore.getState().document.metadata.author).toBeUndefined()
    expect(metaName()).toBe('AB')
  })

  it('resumes tracking after end so later actions are recorded normally', () => {
    const { result } = renderHook(() => useUndoGroup())
    const { updateMetadata, addBlock } = useFilterStore.getState()

    act(() => {
      result.current.edit(() => updateMetadata({ name: 'Foo' }))
      result.current.end()
    })
    act(() => {
      addBlock('Hide')
    })

    // The grouped edit + the discrete add are two independent undo steps.
    expect(temporal().pastStates).toHaveLength(2)
  })
})
