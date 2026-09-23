import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { BeamColumn } from '@/ui/BeamColumn'

describe('BeamColumn', () => {
  it('draws the beam in the Beam color', () => {
    const { getByTestId } = render(
      <BeamColumn actions={[{ keyword: 'Beam', r: 255, g: 120, b: 40 }]} />,
    )
    expect(getByTestId('beam').getAttribute('style')).toContain('255, 120, 40')
  })

  it('keeps an empty slot without a Beam action', () => {
    const { container, queryByTestId } = render(<BeamColumn actions={[]} />)
    expect(queryByTestId('beam')).toBeNull()
    expect(container.firstChild).not.toBeNull()
  })
})
