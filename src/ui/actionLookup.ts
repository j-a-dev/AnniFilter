import type { Action } from '@/engine/types'

/** Find the first action of a given keyword, narrowed to that action's type. */
export function findFirst<K extends Action['keyword']>(
  actions: Action[],
  keyword: K,
): (Action & { keyword: K }) | undefined {
  return actions.find(
    (a): a is Action & { keyword: K } => a.keyword === keyword,
  )
}
