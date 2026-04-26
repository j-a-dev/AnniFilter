import type { Action } from '@/engine/types'

function findFirst<K extends Action['keyword']>(
  actions: Action[],
  keyword: K,
): (Action & { keyword: K }) | undefined {
  return actions.find(
    (a): a is Action & { keyword: K } => a.keyword === keyword,
  )
}

export function IndicatorLane({ actions }: { actions: Action[] }) {
  const hasSound = actions.some((a) => a.keyword === 'PlayAlertSound')
  const minimap = findFirst(actions, 'MinimapIcon')

  return (
    <div className="grid grid-rows-2 w-6 h-11 shrink-0">
      <div className="flex items-center justify-center">
        {hasSound && <SoundIcon />}
      </div>
      <div className="flex items-center justify-center">
        {minimap && (
          <span
            className="rounded-full"
            style={{
              width: Math.max(6, Math.min(14, 6 + minimap.size * 1.2)),
              height: Math.max(6, Math.min(14, 6 + minimap.size * 1.2)),
              backgroundColor: `rgb(${minimap.r}, ${minimap.g}, ${minimap.b})`,
            }}
            title={`MinimapIcon size ${minimap.size}`}
          />
        )}
      </div>
    </div>
  )
}

function SoundIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#c8a94e]"
    >
      <path d="M3 6h2l3-2.5v9L5 10H3z" fill="currentColor" />
      <path d="M11 6c1 .5 1.5 1 1.5 2s-.5 1.5-1.5 2" />
    </svg>
  )
}
