import { useEffect, useState } from 'react'
import type {
  ComparisonOp,
  Condition,
  FilterBlock,
} from '@/engine/types'
import { useFilterStore } from '@/store/filterStore'
import {
  BASE_RARITIES,
  RUNEWORD_RARITIES,
  TIERS,
} from '@/engine/data/spec'

const COMPARISON_OPS: ComparisonOp[] = ['==', '!=', '>', '<', '>=', '<=']
const PRETTY_OP: Record<ComparisonOp, string> = {
  '==': '=',
  '!=': '≠',
  '>': '>',
  '<': '<',
  '>=': '≥',
  '<=': '≤',
}

type Props = {
  block: FilterBlock
  index: number
  condition: Condition
}

export function ConditionRow({ block, index, condition }: Props) {
  const updateCondition = useFilterStore((s) => s.updateCondition)
  const removeCondition = useFilterStore((s) => s.removeCondition)

  const update = (next: Condition) => updateCondition(block.id, index, next)

  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-[10px] uppercase tracking-wider text-slate-500 w-20 shrink-0">
        {condition.keyword}
      </span>
      <ConditionValueEditor
        block={block}
        condition={condition}
        onChange={update}
      />
      <button
        onClick={() => removeCondition(block.id, index)}
        className="ml-auto text-slate-500 hover:text-rose-400 text-xs px-1"
        title="Remove condition"
      >
        ×
      </button>
    </div>
  )
}

function OpSelect({
  value,
  onChange,
  allowed = COMPARISON_OPS,
}: {
  value: ComparisonOp
  onChange: (op: ComparisonOp) => void
  allowed?: ReadonlyArray<ComparisonOp>
}) {
  return (
    <div className="flex bg-[#0a0a0f] rounded border border-[#1d2128] p-0.5">
      {allowed.map((op) => (
        <button
          key={op}
          onClick={() => onChange(op)}
          className={`px-1.5 text-[11px] tabular-nums rounded ${
            value === op
              ? 'bg-[#1a1d22] text-slate-100'
              : 'text-slate-500 hover:text-slate-200'
          }`}
        >
          {PRETTY_OP[op]}
        </button>
      ))}
    </div>
  )
}

function ConditionValueEditor({
  block,
  condition,
  onChange,
}: {
  block: FilterBlock
  condition: Condition
  onChange: (next: Condition) => void
}) {
  switch (condition.keyword) {
    case 'Rarity': {
      const isRunewordCtx = block.conditions.some(
        (c) =>
          c.keyword === 'ItemType' && c.values.includes('Runeword Pattern'),
      )
      const options = isRunewordCtx
        ? [...new Set([...BASE_RARITIES, ...RUNEWORD_RARITIES])]
        : BASE_RARITIES
      return (
        <>
          <OpSelect
            value={condition.op}
            onChange={(op) => onChange({ ...condition, op })}
          />
          <select
            value={condition.value}
            onChange={(e) => onChange({ ...condition, value: e.target.value })}
            className="bg-[#0a0a0f] text-slate-200 text-[11px] px-1.5 py-0.5 rounded border border-[#1d2128]"
          >
            {options.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </>
      )
    }
    case 'Tier':
      return (
        <>
          <OpSelect
            value={condition.op}
            onChange={(op) => onChange({ ...condition, op })}
          />
          <select
            value={condition.value}
            onChange={(e) =>
              onChange({
                ...condition,
                value: e.target.value as 'Normal' | 'Exceptional' | 'Elite',
              })
            }
            className="bg-[#0a0a0f] text-slate-200 text-[11px] px-1.5 py-0.5 rounded border border-[#1d2128]"
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </>
      )
    case 'ItemType':
    case 'ItemName':
    case 'HasAffix':
      return (
        <MultiValueTextInput
          values={condition.values}
          onChange={(values) => onChange({ ...condition, values })}
          placeholder='comma-separated, e.g. "Runes", "Riftstone"'
        />
      )
    case 'Unknown':
      return (
        <span className="text-[11px] text-slate-500 italic flex-1">
          {condition.raw}
        </span>
      )
    default: {
      // Numeric or boolean
      if (typeof condition.value === 'boolean') {
        return (
          <>
            <OpSelect
              value={condition.op}
              onChange={(op) =>
                onChange({ ...condition, op: op as '==' | '!=' })
              }
              allowed={['==', '!=']}
            />
            <button
              onClick={() => onChange({ ...condition, value: !condition.value })}
              className={`text-[11px] uppercase tracking-wider px-2 py-0.5 rounded border transition-colors ${
                condition.value
                  ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
                  : 'border-rose-500/40 text-rose-300 bg-rose-500/10'
              }`}
            >
              {condition.value ? 'True' : 'False'}
            </button>
          </>
        )
      }
      return (
        <>
          <OpSelect
            value={condition.op}
            onChange={(op) => onChange({ ...condition, op })}
          />
          <input
            type="number"
            value={condition.value}
            onChange={(e) =>
              onChange({
                ...condition,
                value: Number(e.target.value),
              })
            }
            className="w-20 bg-[#0a0a0f] text-slate-200 text-[11px] px-2 py-0.5 rounded border border-[#1d2128] focus:border-amber-500/50 outline-none tabular-nums"
          />
        </>
      )
    }
  }
}

const parseValues = (s: string) =>
  s
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0)

function MultiValueTextInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
}) {
  const [text, setText] = useState(() => values.join(', '))

  // Sync from props only when parent values diverge from what our text parses to
  // (e.g. undo/redo or programmatic change). Otherwise keep the user's raw text
  // so trailing commas, in-progress whitespace, etc. survive keystrokes.
  useEffect(() => {
    const parsed = parseValues(text)
    const same =
      parsed.length === values.length &&
      parsed.every((v, i) => v === values[i])
    if (!same) setText(values.join(', '))
  }, [values])

  return (
    <input
      type="text"
      value={text}
      onChange={(e) => {
        setText(e.target.value)
        onChange(parseValues(e.target.value))
      }}
      onBlur={() => setText(values.join(', '))}
      placeholder={placeholder}
      className="flex-1 bg-[#0a0a0f] text-slate-200 text-[11px] px-2 py-0.5 rounded border border-[#1d2128] focus:border-amber-500/50 outline-none"
    />
  )
}
