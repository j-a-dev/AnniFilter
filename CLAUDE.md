# AnniFilter

Filter editor for the Diablo 2 mod **Annihilus**.

## Data accuracy rule

Annihilus diverges from vanilla D2/LoD and D2R. The mod wiki explicitly states: *"This wiki is for BETA Annihilus only. Do not post vanilla Diablo II LoD information."* Do not fall back to vanilla D2 or D2R sources for verifying item names, base types, runewords, or class data.

## Sources

- **Wiki** — `annihilus.net/wiki/index.php`
  - `/Item_Filter` — filter syntax spec (the only one that exists).
  - `/Uniques`, `/Runewords`, `/Runes` — current item data (sub-pages enumerate by category).
  - `/Legacy/...` — legacy namespace, separate from current.
- **Discord** — `discord.com/invite/annihilus`. Wiki states community filters are distributed here; join required for deep links.

## Critical retrieval trap

`annihilus.net` returns **403 to WebFetch on every URL** (wiki pages, `?action=raw`, forum, archive paths). Google cache and Wayback Machine are also inaccessible from this agent.

**Implication:** Verifying any specific wiki content requires a browser or user-paste fallback. Do not infer wiki content from PoE filter docs even though Annihilus syntax is reportedly similar — ask the user to paste the relevant page when verification is needed.

## Confirmed absent

- No public source repository. The mod is closed-source, distributed via the official launcher (Patreon-funded). The GitHub repo `Necrolis/d2dx-annihilus` is an unrelated graphics-wrapper fork.
- No data-export endpoint or searchable API.

## Open questions (resolve before relying on them)

- Complete filter keyword list (operators, `Continue`, `AlertSound`/`PlayAlertSound`, any Annihilus-specific extensions beyond what PoE supports).
- Whether the class roster matches vanilla's five (Barbarian/Sorceress/Druid/Paladin/Necromancer) or includes additions.
- Raw text of community filters (e.g. `Nightshades_MMORPG_2024_V1.1.filter` exists at forum thread `t=57759` but is behind the 403 wall).

## Stack

React 19 + TypeScript 5.9 (strict) + Vite 7 + Zustand 5 + Zundo + Tailwind 4 + Vitest/jsdom + Testing Library. Path alias `@/*` → `src/*`. Scaffolded against `E:\dev\projects\git\FilterEditor\`'s proven setup; see `docs/CONCEPT.md` Phase 0 detail for the file layout.
