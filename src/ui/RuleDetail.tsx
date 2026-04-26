import { useSelectedBlock } from '@/store/selectors'
import { RuleDetailHeader } from './RuleDetailHeader'
import { ConditionRow } from './ConditionRow'
import { ConditionAddButton } from './ConditionAddButton'
import { ActionRow } from './ActionRow'
import { SoundActionList } from './SoundActionList'
import { ItemPreview } from './ItemPreview'
import {
  DISPLAY_ACTION_KEYWORDS,
  TEXT_ACTION_KEYWORDS,
} from './actionDefaults'

export function RuleDetail() {
  const block = useSelectedBlock()

  if (!block) {
    return (
      <div className="p-6 text-xs text-slate-500 italic">
        Select a rule from the list to edit it.
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <RuleDetailHeader block={block} />

      <Section title="Matches">
        <div className="space-y-0.5">
          {block.conditions.map((c, i) => (
            <ConditionRow
              key={`${block.id}-c-${i}`}
              block={block}
              index={i}
              condition={c}
            />
          ))}
          <div className="pt-1">
            <ConditionAddButton block={block} />
          </div>
        </div>
      </Section>

      <div className="grid grid-cols-2 gap-x-8 px-4 pb-3">
        <Column title="Display">
          {DISPLAY_ACTION_KEYWORDS.map((k) => (
            <ActionRow key={k} block={block} keyword={k} />
          ))}
        </Column>

        <Column title="Text">
          {TEXT_ACTION_KEYWORDS.map((k) => (
            <ActionRow key={k} block={block} keyword={k} />
          ))}
        </Column>
      </div>

      <div className="grid grid-cols-2 gap-x-8 px-4 pb-3 border-t border-[#1d2128] pt-3">
        <Column title="Sound">
          <SoundActionList block={block} />
        </Column>
        <Column title="Minimap icon">
          <ActionRow block={block} keyword="MinimapIcon" />
        </Column>
      </div>

      <div className="px-4 py-3 border-t border-[#1d2128] flex items-center gap-4">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          Preview
        </span>
        <ItemPreview block={block} />
      </div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="px-4 py-3 border-b border-[#1d2128]">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
        {title}
      </div>
      {children}
    </div>
  )
}

function Column({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 my-2">
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}
