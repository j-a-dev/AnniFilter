import type { Action, ActionKeyword, FilterBlock } from '@/engine/types'
import { useFilterStore } from '@/store/filterStore'
import { BLEND_MODES, DROP_SOUNDS, FONTS } from '@/engine/data/spec'
import { ColorSwatch } from './ColorSwatch'
import { PaletteGrid } from './PaletteGrid'
import { TemplateInput } from './TemplateInput'
import { ACTION_LABELS, defaultActionFor } from './actionDefaults'

type Props = {
  block: FilterBlock
  keyword: ActionKeyword
}

export function ActionRow({ block, keyword }: Props) {
  const addAction = useFilterStore((s) => s.addAction)
  const updateAction = useFilterStore((s) => s.updateAction)
  const removeAction = useFilterStore((s) => s.removeAction)

  const index = block.actions.findIndex((a) => a.keyword === keyword)
  const action = index >= 0 ? block.actions[index] : undefined
  const enabled = !!action

  const handleToggle = () => {
    if (enabled && index >= 0) {
      removeAction(block.id, index)
    } else {
      addAction(block.id, defaultActionFor(keyword))
    }
  }

  const update = (next: Action) => {
    if (index >= 0) updateAction(block.id, index, next)
  }

  return (
    <div
      className={`flex items-center gap-2 py-1 ${enabled ? '' : 'opacity-40'}`}
    >
      <input
        type="checkbox"
        checked={enabled}
        onChange={handleToggle}
        className="w-3.5 h-3.5 shrink-0"
      />
      <span className="text-[11px] text-slate-400 w-16 shrink-0">
        {ACTION_LABELS[keyword]}
      </span>
      {enabled && action ? (
        <Editor action={action} onChange={update} />
      ) : (
        <span className="text-[10px] text-slate-600 italic">disabled</span>
      )}
    </div>
  )
}

function Editor({
  action,
  onChange,
}: {
  action: Action
  onChange: (next: Action) => void
}) {
  switch (action.keyword) {
    case 'SetBorderColor':
    case 'SetBackgroundColor':
      return (
        <ColorSwatch
          r={action.r}
          g={action.g}
          b={action.b}
          onChange={(r, g, b) => onChange({ ...action, r, g, b })}
        />
      )
    case 'SetTextColor':
      return (
        <PaletteGrid
          value={action.color}
          onChange={(color) => onChange({ ...action, color })}
        />
      )
    case 'SetFont':
      return (
        <select
          value={action.font}
          onChange={(e) => onChange({ ...action, font: e.target.value })}
          className="bg-[#0a0a0f] text-slate-200 text-[11px] px-1.5 py-0.5 rounded border border-[#1d2128]"
        >
          {FONTS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      )
    case 'SetBlendMode':
      return (
        <select
          value={action.mode}
          onChange={(e) => onChange({ ...action, mode: e.target.value })}
          className="bg-[#0a0a0f] text-slate-200 text-[11px] px-1.5 py-0.5 rounded border border-[#1d2128]"
        >
          {BLEND_MODES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      )
    case 'SetItemName':
    case 'AppendText':
    case 'PrependText':
    case 'ChatNotification':
      return (
        <TemplateInput
          value={action.template}
          onChange={(template) => onChange({ ...action, template })}
          placeholder="e.g. {Red}[T1] {Original}"
        />
      )
    case 'PlayAlertSound':
      return (
        <select
          value={action.soundId}
          onChange={(e) =>
            onChange({ ...action, soundId: Number(e.target.value) })
          }
          className="bg-[#0a0a0f] text-slate-200 text-[11px] px-1.5 py-0.5 rounded border border-[#1d2128] flex-1"
        >
          {DROP_SOUNDS.map((ds) => (
            <option key={ds.id} value={ds.id}>
              {ds.id} - {ds.label}
            </option>
          ))}
        </select>
      )
    case 'MinimapIcon':
      return (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={action.size}
            min={0}
            onChange={(e) =>
              onChange({ ...action, size: Number(e.target.value) })
            }
            className="w-12 bg-[#0a0a0f] text-slate-200 text-[11px] tabular-nums px-2 py-0.5 rounded border border-[#1d2128]"
            title="Size"
          />
          <ColorSwatch
            r={action.r}
            g={action.g}
            b={action.b}
            onChange={(r, g, b) => onChange({ ...action, r, g, b })}
          />
        </div>
      )
    case 'Unknown':
      return (
        <span className="text-[11px] text-slate-500 italic font-mono flex-1">
          {action.raw}
        </span>
      )
  }
}
