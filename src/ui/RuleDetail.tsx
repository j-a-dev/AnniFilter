import { useMemo } from 'react'
import { useFilterStore } from '@/store/filterStore'
import { useSelectedBlock } from '@/store/selectors'
import { previewActionsForBlock } from '@/engine/preview'
import { RuleDetailHeader } from './RuleDetailHeader'
import { ConditionRow } from './ConditionRow'
import { ConditionAddButton } from './ConditionAddButton'
import { ActionRow } from './ActionRow'
import { SoundActionList } from './SoundActionList'
import { ItemPreview } from './ItemPreview'
import { ChatMessagePreview } from './ChatMessagePreview'
import {
  DISPLAY_ACTION_KEYWORDS,
  TEXT_ACTION_KEYWORDS,
} from './actionDefaults'

export function RuleDetail() {
  const block = useSelectedBlock()
  const document = useFilterStore((s) => s.document)

  const cascadedActions = useMemo(
    () => (block ? previewActionsForBlock(document, block.id) : []),
    [document, block?.id],
  )

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

      <div className="px-4 py-3 border-t border-[#1d2128] flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 w-24">
            Preview (cascaded)
          </span>
          <ItemPreview actions={cascadedActions} label={block.label} />
        </div>
        <div className="flex items-center gap-4 opacity-60">
          <span
            className="text-[10px] uppercase tracking-wider text-slate-500 w-24"
            title="Just this rule's own actions, ignoring earlier matching Style decorators"
          >
            Rule alone
          </span>
          <ItemPreview actions={block.actions} label={block.label} />
        </div>
        {(() => {
          const cascadedChat = cascadedActions.find(
            (a) => a.keyword === 'ChatNotification',
          )
          if (!cascadedChat || cascadedChat.keyword !== 'ChatNotification')
            return null
          return (
            <div className="flex items-center gap-4 pt-1 mt-1 border-t border-[#1a1d22]">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 w-24">
                Chat
              </span>
              <ChatMessagePreview
                template={cascadedChat.template}
                label={block.label}
              />
            </div>
          )
        })()}
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
