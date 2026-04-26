import type {
  Action,
  Condition,
  FilterBlock,
  FilterDocument,
  ValidationIssue,
} from './types'
import {
  BASE_RARITIES,
  BLEND_MODES_SET,
  DROP_SOUND_IDS_SET,
  FONTS_SET,
  ITEM_TYPES_SET,
  RUNEWORD_RARITIES,
  TEMPLATE_PLACEHOLDERS_SET,
  TEXT_COLORS_SET,
} from './data/spec'

const BASE_RARITY_SET: ReadonlySet<string> = new Set(BASE_RARITIES)
const RUNEWORD_RARITY_SET: ReadonlySet<string> = new Set(RUNEWORD_RARITIES)

const PLACEHOLDER_RE = /\{([^{}]+)\}/g

export function validate(document: FilterDocument): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  for (const block of document.blocks) {
    validateBlock(block, issues)
  }

  return issues
}

function validateBlock(block: FilterBlock, issues: ValidationIssue[]): void {
  const inRunewordPatternContext = block.conditions.some(
    (c) =>
      c.keyword === 'ItemType' &&
      c.values.includes('Runeword Pattern'),
  )

  for (let i = 0; i < block.conditions.length; i++) {
    validateCondition(
      block.conditions[i] as Condition,
      i,
      block,
      inRunewordPatternContext,
      issues,
    )
  }
  for (let i = 0; i < block.actions.length; i++) {
    validateAction(block.actions[i] as Action, i, block, issues)
  }
}

function validateCondition(
  cond: Condition,
  index: number,
  block: FilterBlock,
  inRunewordPatternContext: boolean,
  issues: ValidationIssue[],
): void {
  switch (cond.keyword) {
    case 'Rarity': {
      const valid = inRunewordPatternContext
        ? RUNEWORD_RARITY_SET.has(cond.value) ||
          BASE_RARITY_SET.has(cond.value)
        : BASE_RARITY_SET.has(cond.value)
      if (!valid) {
        issues.push({
          level: 'warning',
          blockId: block.id,
          conditionIndex: index,
          code: 'unknown-rarity',
          message: `Unknown Rarity value: "${cond.value}"`,
        })
      }
      return
    }
    case 'ItemType': {
      for (const v of cond.values) {
        if (!ITEM_TYPES_SET.has(v)) {
          issues.push({
            level: 'warning',
            blockId: block.id,
            conditionIndex: index,
            code: 'unknown-itemtype',
            message: `Unknown ItemType value: "${v}"`,
          })
        }
      }
      return
    }
    case 'Unknown': {
      issues.push({
        level: 'warning',
        blockId: block.id,
        conditionIndex: index,
        code: 'unknown-condition',
        message: `Unknown condition: ${cond.raw}`,
      })
      return
    }
    default:
      return
  }
}

function validateAction(
  action: Action,
  index: number,
  block: FilterBlock,
  issues: ValidationIssue[],
): void {
  switch (action.keyword) {
    case 'SetBorderColor':
    case 'SetBackgroundColor':
      validateRGB(action.r, action.g, action.b, action.keyword, block, index, issues)
      return
    case 'SetTextColor':
      if (!TEXT_COLORS_SET.has(action.color)) {
        issues.push({
          level: 'warning',
          blockId: block.id,
          actionIndex: index,
          code: 'unknown-color',
          message: `Unknown SetTextColor palette value: "${action.color}"`,
        })
      }
      return
    case 'SetFont':
      if (!FONTS_SET.has(action.font)) {
        issues.push({
          level: 'warning',
          blockId: block.id,
          actionIndex: index,
          code: 'unknown-font',
          message: `Unknown SetFont value: "${action.font}"`,
        })
      }
      return
    case 'SetBlendMode':
      if (!BLEND_MODES_SET.has(action.mode)) {
        issues.push({
          level: 'warning',
          blockId: block.id,
          actionIndex: index,
          code: 'unknown-blend-mode',
          message: `Unknown SetBlendMode value: "${action.mode}"`,
        })
      }
      return
    case 'PlayAlertSound':
      if (!DROP_SOUND_IDS_SET.has(action.soundId)) {
        issues.push({
          level: 'info',
          blockId: block.id,
          actionIndex: index,
          code: 'sound-out-of-range',
          message: `PlayAlertSound id ${action.soundId} is outside the documented 0–20 range`,
        })
      }
      return
    case 'MinimapIcon':
      validateRGB(action.r, action.g, action.b, action.keyword, block, index, issues)
      if (action.size < 0) {
        issues.push({
          level: 'warning',
          blockId: block.id,
          actionIndex: index,
          code: 'minimap-size-negative',
          message: `MinimapIcon size must be non-negative; got ${action.size}`,
        })
      }
      return
    case 'SetItemName':
    case 'AppendText':
    case 'PrependText':
    case 'ChatNotification':
      validateTemplate(action.template, action.keyword, block, index, issues)
      return
    case 'Unknown':
      issues.push({
        level: 'warning',
        blockId: block.id,
        actionIndex: index,
        code: 'unknown-action',
        message: `Unknown action: ${action.raw}`,
      })
      return
  }
}

function validateRGB(
  r: number,
  g: number,
  b: number,
  keyword: string,
  block: FilterBlock,
  index: number,
  issues: ValidationIssue[],
): void {
  for (const [name, v] of [
    ['r', r],
    ['g', g],
    ['b', b],
  ] as const) {
    if (!Number.isFinite(v) || v < 0 || v > 255) {
      issues.push({
        level: 'error',
        blockId: block.id,
        actionIndex: index,
        code: 'rgb-out-of-range',
        message: `${keyword} ${name} component out of 0–255 range: ${v}`,
      })
    }
  }
}

function validateTemplate(
  template: string,
  keyword: string,
  block: FilterBlock,
  index: number,
  issues: ValidationIssue[],
): void {
  PLACEHOLDER_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = PLACEHOLDER_RE.exec(template)) !== null) {
    const token = m[1] ?? ''
    if (TEMPLATE_PLACEHOLDERS_SET.has(token)) continue
    if (TEXT_COLORS_SET.has(token)) continue
    issues.push({
      level: 'warning',
      blockId: block.id,
      actionIndex: index,
      code: 'unknown-placeholder',
      message: `Unknown template placeholder {${token}} in ${keyword}`,
    })
  }
}
