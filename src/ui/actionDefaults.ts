import type { Action, ActionKeyword } from '@/engine/types'

export const DISPLAY_ACTION_KEYWORDS: ActionKeyword[] = [
  'SetTextColor',
  'SetBorderColor',
  'SetBackgroundColor',
  'SetFont',
  'SetBlendMode',
]

export const TEXT_ACTION_KEYWORDS: ActionKeyword[] = [
  'SetItemName',
  'PrependText',
  'AppendText',
  'ChatNotification',
]

export const ALERT_ACTION_KEYWORDS: ActionKeyword[] = [
  'PlayAlertSound',
  'MinimapIcon',
]

const DEFAULTS: Record<ActionKeyword, Action> = {
  SetTextColor: { keyword: 'SetTextColor', color: 'White' },
  SetBorderColor: { keyword: 'SetBorderColor', r: 200, g: 0, b: 200 },
  SetBackgroundColor: { keyword: 'SetBackgroundColor', r: 25, g: 25, b: 25 },
  SetFont: { keyword: 'SetFont', font: 'Font16' },
  SetBlendMode: { keyword: 'SetBlendMode', mode: 'Normal' },
  SetItemName: { keyword: 'SetItemName', template: '{Original}' },
  PrependText: { keyword: 'PrependText', template: '' },
  AppendText: { keyword: 'AppendText', template: '' },
  ChatNotification: { keyword: 'ChatNotification', template: '{Original}' },
  PlayAlertSound: { keyword: 'PlayAlertSound', soundId: 11 },
  MinimapIcon: { keyword: 'MinimapIcon', size: 2, r: 200, g: 0, b: 200 },
}

export function defaultActionFor(keyword: ActionKeyword): Action {
  return DEFAULTS[keyword]
}

export const ACTION_LABELS: Record<ActionKeyword, string> = {
  SetTextColor: 'Text',
  SetBorderColor: 'Border',
  SetBackgroundColor: 'BG',
  SetFont: 'Font',
  SetBlendMode: 'Blend',
  SetItemName: 'Name',
  PrependText: 'Prepend',
  AppendText: 'Append',
  ChatNotification: 'Chat',
  PlayAlertSound: 'Alert',
  MinimapIcon: 'Icon',
}
