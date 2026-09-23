import type { Action } from '@/engine/types'
import { findFirst } from './actionLookup'

/**
 * Beam indicator modeled on the in-game look: a straight column with a
 * near-white core and a colored glow falling off to both sides, a bright spot
 * at the bottom where the item lies, and a fade only over the top part.
 * Always takes its slot so rows without a beam keep the columns to the right
 * aligned.
 */
export function BeamColumn({
  actions,
  className = 'h-11',
}: {
  actions: Action[]
  className?: string
}) {
  const beam = findFirst(actions, 'Beam')
  const rgb = beam ? `${beam.r}, ${beam.g}, ${beam.b}` : ''
  // The core is the beam color pushed most of the way to white.
  const core = beam
    ? [beam.r, beam.g, beam.b].map((c) => Math.round(c + (255 - c) * 0.6)).join(', ')
    : ''
  const topFade = 'linear-gradient(to top, #000 0%, #000 60%, transparent 100%)'

  return (
    <div className={`w-3 shrink-0 flex justify-center ${className}`}>
      {beam && (
        <span
          className="w-full h-full"
          style={{
            background: [
              `radial-gradient(ellipse 100% 10% at 50% 100%, rgba(${core}, 0.9), transparent)`,
              `linear-gradient(to right, rgba(${rgb}, 0) 0%, rgba(${rgb}, 0.5) 30%, rgba(${core}, 1) 50%, rgba(${rgb}, 0.5) 70%, rgba(${rgb}, 0) 100%)`,
            ].join(', '),
            maskImage: topFade,
            WebkitMaskImage: topFade,
          }}
          title={`Beam ${beam.r} ${beam.g} ${beam.b}`}
          data-testid="beam"
        />
      )}
    </div>
  )
}
