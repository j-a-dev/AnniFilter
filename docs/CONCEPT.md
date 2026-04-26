# AnniFilter — Project Concept

Status: v0.3 · 2026-04-26 · Phases 0-2 shipped. Editor is end-to-end usable: open `.filter`, browse virtualized rule list with cascaded in-game preview, edit rules through typed controls, add/delete/reorder, save back. 110 unit tests, both shipped filters round-trip with deep-equal AST. **Phase 3 (preset library UI) is up next.** Open improvements catalogued in [`docs/next-up.md`](./next-up.md).
Authoritative spec reference: [`docs/wiki/Item_Filter.md`](./wiki/Item_Filter.md) ∪ [`docs/wiki/extensions_observed.md`](./wiki/extensions_observed.md)

## What we're building

A browser-based visual editor for loot filters used by the Diablo 2 mod **Annihilus** (beta). FilterBlade-style: players open the editor in a browser, edit rules through a structured UI (not a text editor), and export a `.filter` file they drop into their Annihilus install.

Constraints driving every decision:
- Solo dev, zero-budget hosting → static SPA on GitHub Pages.
- Closed-source game, 403-walled wiki → ground truth arrives via user-pasted documents, not API fetches.
- Active player base on a beta mod → target the *current* filter format, not the dead Legacy one.

## Critical finding: two filter formats exist

The retrieved wiki page (`/Item_Filter`) and the two in-repo sample filters (`samples/lenzys_*.txt`) document **two distinct, non-interchangeable** filter languages.

### Current format (wiki-documented)

PoE-style block language. Reference: [`docs/wiki/Item_Filter.md`](./wiki/Item_Filter.md).

```
Show
    ItemType "Runes"
    ItemName "Gul" "Ist" "Um" "Pul" "Lem"
    SetBorderColor 255 0 255
    SetBackgroundColor 100 50 100
    MinimapIcon 2 255 0 255
```

- Blocks: `Show` / `Hide` / `Style`.
- 20+ conditional opcodes (`Rarity`, `Tier`, `Sockets`, `ItemLevel`, `AreaLevel`, `PlayerLevel`, `ImplicitTier`, `ItemType`, `ItemName`, `Width`, `Height`, `HasAffix`, `AffixTier`, `RiftstoneTier`, `Runeword`, `Ethereal`, `Identified`, `Spectral`, `Warped`, `Stack`).
- Operators: `>`, `<`, `>=`, `<=`, `==`, `!=`.
- Styling: `SetBorderColor` / `SetBackgroundColor` (RGB), `SetTextColor` (named palette), `SetFont`, `SetBlendMode`, `SetItemName`, `AppendText`, `PrependText` with `{Break}`, `{<ColorName>}`, `{Original}`, `{ItemLevel}`, `{Sockets}`, etc. placeholders.
- Alerts: `PlayAlertSound`, `MinimapIcon`.
- `ItemType` uses semantic categories (`Runes`, `High Runes`, `Rings`, `Body Armors`, `Amazon Bows`, `Primal Helmets`…). `ItemName` matches on in-game item names (e.g. `"Zod"`, `"Eth"`).

### Legacy format (what the in-repo samples use)

Flat CSV. Effectively a *per-base-code* visibility table.

```
cap, unique, darkgold
r20, normal, orange
hp1, normal, hide
```

- Grammar: `<3–4 char item code>, <quality>, <action>`.
- Quality set: `low`, `normal`, `superior`, `magic`, `rare`, `unique`, `set` — overlaps with but is not identical to modern `Rarity` (which lacks `low`/`superior`).
- Action: `hide` or a color name from the palette (no RGB, no borders, no background, no sounds, no minimap, no conditionals beyond the per-row `code + quality`).
- Uses D2 *internal* codes (`cap`, `xap`, `ba1`, `r20`, `gcv`, `hp1`). These codes do **not** appear anywhere in the modern spec — the current format addresses items by `ItemType`/`ItemName`, not internal codes.

### Why this matters

Any filter written in one format is unusable in the other. Our two samples — despite being labeled "LeNzY's Strict Filter" and being ~4,300 lines each — give us **zero examples of the current grammar**. Their headers literally say "Legacy". The wiki separately maintains a `/Legacy/…` namespace for old-format pages, per project `CLAUDE.md`.

## Scope decision: target the current format

**Primary scope (v1):** editor speaks the current `Item_Filter` format. This is what live players need for beta Annihilus.

**Legacy support:** import-only, best-effort conversion into a synthesized current-format filter. Explicitly not an edit target. Rationale: Legacy is a shrinking user base, and editing two grammars doubles every layer (parser, generator, validator, UI surfaces, tests) for a shrinking return. One-way import lets veteran Legacy users bring their rules forward without trapping us into dual-grammar maintenance.

**Legacy→current conversion sketch** (for the import tool, not v1.0):
- Each Legacy row `<code>, <quality>, <action>` becomes one block.
- `hide` → `Hide`; a color name → `Show` + `SetTextColor <Color>`.
- Quality mapping: `normal`/`magic`/`rare`/`unique`/`set` → `Rarity == …`; `low`, `superior` have no direct modern equivalent and need a footnote in the conversion report.
- Item code → `ItemName`/`ItemType` requires a code→name catalog we don't have yet. Can bootstrap from the samples' `#<Display Name>` comments (each rule is preceded by one).

**Non-goals for v1:**
- Authoring Legacy filters.
- Supporting vanilla D2/LoD or D2R syntax (not applicable — Annihilus is a separate mod).
- A shared filter library with cloud sync / accounts / search.
- In-game item simulation beyond "would this item match this block?" (no loot-table simulation, no tier-value scoring like PoE FilterBlade's).

## Architecture

Stack (matches global default + `E:\dev\Projects\git\FilterEditor\` proven pattern):

| Layer | Choice | Note |
|---|---|---|
| Build | Vite 7 | Static output, single-page |
| UI | React 19 + TypeScript 5.9 strict | |
| State | Zustand 5 + Zundo (undo/redo) | Filter doc + raw-text mirror + `dirty` flag |
| Styling | Tailwind 4 | Utilities; `style={}` only for dynamic RGB from actions |
| Editor (raw) | Monaco | Lazy-loaded escape hatch |
| Tests | Vitest + jsdom + RTL | Engine gets heavy coverage, UI light |
| Hosting | GitHub Pages | Free; one Actions workflow; optional `annifilter.dev` domain later |

### Reuse from `E:\dev\Projects\git\FilterEditor\`

Because the current Annihilus grammar is explicitly modeled on PoE, the reuse story is much stronger than I first estimated.

**Port (architecture + patterns, some direct):**
- Zustand + Zundo store with raw-text mirror pattern (`filterStore`).
- `useFileOperations` hook.
- AppShell layout and panel scaffolding.
- Monaco raw-editor lazy-load.
- Block-ID generation strategy.
- GitHub Pages deploy config.
- `dnd-kit` block reordering (order matters — current format is first-match-wins, like PoE).

**Rewrite (Annihilus-specific, same shape):**
- `types.ts` — new AST: `FilterDocument → FilterBlock[]` where `FilterBlock = { kind: 'Show'|'Hide'|'Style', conditions: Condition[], actions: Action[] }`.
- `parser.ts` — block-based, 3-space or any-indent tolerant, `#` comments anywhere, quoted and unquoted string args.
- `generator.ts` — emits blocks with conventional indentation.
- `validator.ts` — membership checks against the enumerated ItemType/Color/Font/BlendMode/Sound lists from the spec; operator-vs-argument-type checks; `HasAffix`/`AffixTier` argument syntax (currently underspecified — flag as warning).
- `categorizer.ts` — infer "this block targets runes" etc. from `ItemType`/`ItemName` conditions (different rules than PoE but identical pattern).
- `matcher.ts` — block-chain first-match simulator. No `Continue` until we confirm it exists (spec doesn't mention it).
- Data files: replace `poeValues.ts` with `annihilusSpec.ts` (item types, colors, fonts, blend modes, drop sounds) and separate `itemCatalog.ts` (runes, uniques, sets — populated incrementally from user-pasted wiki pages).

**Drop (not applicable to D2):**
- `currencyTiers.ts`, `divCardTiers.ts` — PoE economy.
- `tierUtils.ts` — PoE's quantitative currency-value tiering. Note: *numeric* tier conditions DO exist in Annihilus (`ImplicitTier`, `AffixTier`, `RiftstoneTier`) but they're simple integer comparisons, not value-curve lookups, so the PoE utils don't port.
- RGB color picker for text color — current spec uses a **named palette** (`White`, `Red`, `DarkGold`, …) for `SetTextColor`. Keep RGB picker for `SetBorderColor`/`SetBackgroundColor`, which are RGB.
- Minimap icon sprite atlas — Annihilus's `MinimapIcon` is just `(size, r, g, b)` — render as a colored dot; no shape/sprite selection.

## Rule model

**Three block kinds at the AST level** (non-negotiable — what the language has): `Show`, `Hide`, `Style`. Each is `{ kind, conditions[], actions[], enabled, label }` where `label` is the `#` comment on the block header line.

**Two semantic families by termination behavior:**

| Family | Kinds | Behavior | Observed % in shipped filters |
|---|---|---|---|
| **Terminating (visibility rules)** | `Show`, `Hide` | First match wins. Sets whether the item is visible. | 46% (Show 38%, Hide 8%) |
| **Layering (decorator rules)** | `Style` | All matching Style blocks apply in order; actions stack (later blocks override earlier ones for the same property). Non-terminating. | 54% |

The wiki states "as soon as an item meets a block, it will do what the block says" — read literally that makes Style terminating. But every shipped filter demonstrates Style must be non-terminating (tiered Riftstone styling, global Ethereal tag, global rarity borders — none work if Style terminates). **This is a committed inference.** See `docs/open-questions.md` for the verification task.

**Default visibility** (no matching Show/Hide): shown. Per wiki: "Leaving 'Show' at the end of your filter shows all items but the ones you've hidden."

## UX approach

**Primary surface: indexed rule list (Last Epoch-inspired, adapted for Style layering).**

| Panel | Content |
|---|---|
| **Left — rule list** | Flat indexed list. Row shows: index number (large, left edge), kind pill (Show/Hide/Style, color-coded), enabled toggle, editable label, one-line condition summary, small style swatch for decorator rules. Rows are drag-reorderable; keyboard move up/down/top/bottom; jump-to-index. Sections are collapsible folds defined by `#===` banner comments already used in community filters — sections are *visual* groupings; index stays global. |
| **Center — rule detail** | Typed controls for conditions and actions of the selected rule. Dropdowns for enumerated values (ItemType, Rarity, Tier, Font, BlendMode), RGB swatches for `SetBorderColor`/`SetBackgroundColor`, palette swatches for `SetTextColor`, multi-chip input for `ItemType`/`ItemName`/`HasAffix` argument lists, template-string editor for `PrependText`/`AppendText`/`SetItemName`/`ChatNotification` with placeholder pills (`{Original}`, `{Red}`, …). |
| **Right — simulator** | User picks or describes an item (ItemType + Rarity + Tier + ItemName + affixes + etc.). Panel shows: all matching rules highlighted in the left list; full Style-layer stack applied in order; terminating Show/Hide; resulting nameplate preview + minimap-icon indicator + chat-notification preview + sound indicator. |
| **Overlay — raw editor** | Monaco, toggle-visible, two-way synced with the document. Escape hatch for power users. |

**Scale consideration:** shipped filters have 200+ rules. Category sections + collapsible folds + keyword-search over rules are necessary, not optional.

**Secondary surface: "quick setup grid"** — a category × rarity matrix for coarse visibility decisions ("hide all magic in endgame ilvl >=74, show all uniques with gold border"). Edits write back to the rule list as new rules or edits to existing rules. Optional onboarding tool, not a storage format.

## Missing-information & patch-volatile-data registry

Living document: [`docs/open-questions.md`](./open-questions.md).

Splits into two parts:
1. **Language-level gaps** — match semantics, argument validation, placeholder behaviors, unconfirmed keywords. Each with current assumption + what would resolve it.
2. **Content catalogs** — uniques, sets, runewords, affixes, base items, rift energies, quest items. Each with current coverage, source, refresh path.

Every Annihilus patch kicks off a refresh ritual (documented at the bottom of that file): re-extract changed wiki pages, re-grep shipped filters, update catalogs, bump review date. The registry replaces ad-hoc TODOs scattered through the codebase — any implementer hitting a genuine unknown adds an entry there and keeps going.

## Spec decisions (committed)

**Operating principle: the authoritative description of Annihilus's filter language is the union of [`docs/wiki/Item_Filter.md`](./wiki/Item_Filter.md) + [`docs/wiki/extensions_observed.md`](./wiki/extensions_observed.md).** Anything documented in either source is a real feature. Anything in neither is treated as nonexistent until new evidence arrives. If both sources are silent on a detail, we pick a pragmatic default and ship it — we do not treat silence as an open question.

The extensions document captures features that shipped filters (`samples/lenzy's filter_*.filter`, known-working in-game) use but the wiki spec never mentions. If future shipped filters reveal more, add them to the extensions doc and update the spec decisions below.

The following resolutions are committed. Future sessions should not re-open these without new evidence from the user.

| Question | Decision | Rationale |
|---|---|---|
| Does `Continue` (PoE-style fall-through) exist? | **No.** Not mentioned in wiki or real filters. | Not mentioned in wiki or real filters. |
| `Show` / `Hide` termination | **Terminate** the rule walk on first match. Set item visibility. | Wiki-stated; consistent with first-match-wins philosophy. |
| `Style` termination | **Do NOT terminate.** All matching Style rules apply in order; actions stack (later-rule wins for same property). | Inferred from shipped-filter structure — tiered Riftstone styling, global Ethereal decorator, per-rarity borders all require non-terminating Style. Wiki is imprecise here. |
| Default visibility when no Show/Hide matches | Shown. | Wiki: "Leaving 'Show' at the end shows all items but the ones you've hidden." |
| `Rarity` ordering for `>=`/`<=` (base items) | `Normal < Magic < Rare < Set < Unique` | Canonical D2 rarity progression; matches shipped-filter usage. |
| `Rarity` ordering for Runeword Patterns | `Common < Uncommon < Rare < Epic < Legendary < Mythic` | Inferred from the shipped-filter styling progression (Common → Mythic gets progressively more prominent styling). [UNVERIFIED ordering relative to `Rare`, which appears in both sets — treat Runeword Pattern rarity as a separate namespace; same token matches differently based on `ItemType`.] |
| `Tier` ordering | `Normal < Exceptional < Elite` | D2 base-item progression. |
| Keyword case | PascalCase, case-sensitive. | How every keyword is written in wiki and real filters. |
| Boolean literal form | Accept both `True`/`False` and `true`/`false` on parse; generator emits `True`/`False`. | All shipped-filter usage (`Ethereal == True`, `QuestItem == True`, `Identified == False`) uses PascalCase. |
| Enum-value quoting (Rarity, Tier, colors, fonts, blend modes) | Parser accepts both quoted (`Rarity == "Rare"`) and unquoted (`Tier == Elite`). Generator always quotes. | Real filters mix both forms; uniform quoting in output avoids bugs with multi-word values. |
| Comment placement | `#` at line start OR trailing. Full blocks can be commented out line-by-line. | All three forms appear in shipped filters. |
| Block terminator | Next `Show`/`Hide`/`Style` keyword. Blank lines optional. | Real filters separate with blank lines, but not always consistently. |
| Indentation | Parser tolerates any indent/whitespace. Generator emits **tab** indent. | Shipped filters use tabs; matches community convention. |
| `ItemType` quoting | Parser accepts both quoted and unquoted. Generator always quotes. | Multi-word types (`"Body Armors"`) require quoting anyway. |
| `ItemType` values not in the enumerated list | Parser accepts any string; validator warns (not errors) on values absent from the enumeration. Autocomplete only suggests enumerated values. | Shipped filters use only enumerated values, but wiki's own example uses `"Quest Items"` / `"Pelt"` (not in the list) — the game is clearly permissive. |
| Operator defaults | Operator is **required** for all `[Operator]` conditions. | Spec doesn't document a default; shipped filters always provide one. |
| Unknown opcodes (conditions/actions) | Parser accepts them as opaque passthrough rules with their raw argument list. Validator emits a warning. Generator round-trips them verbatim. | Wiki spec is demonstrably incomplete; shipped filters already use features (e.g. `ChatNotification`, `AffixCount`, `QuestItem`) not in the wiki. Future mod updates may add more — the editor must not reject unknown opcodes. |
| `HasAffix` argument | Opaque quoted string. Autocomplete offers the observed catalog from `docs/wiki/extensions_observed.md`, but any string is accepted. | We have ~55 observed affix names from shipped filters as a starting catalog; real total is likely larger. |
| `AffixTier` / `PrefixTier` / `SuffixTier` / `AffixCount` numeric range | Any non-negative integer. No upper bound. | None of the sources bound these; shipped filters use `== 1`, `<= 1`, `>= 2`. |
| `MinimapIcon` size argument | Any integer. No validation. | Sources are silent; shipped filters use `2` and `5`. |
| `PlayAlertSound` range | Any non-negative integer. UI autocomplete shows 0–20 with labels from the Drop Sounds table. | Keep UI helpful without over-validating. |
| Multiple `PlayAlertSound` in one block | Allowed. Preserved in order on round-trip. | Shipped filters stack them (`PlayAlertSound 16` / `17` / `18` / `19` in a single High Runes block). |
| `{Original}` vs `{ItemName}` placeholders | Treat as aliases. Generator emits `{Original}`. | Wiki gives identical descriptions. |
| `{Color}` literal in the wiki placeholder docs | Ignore as wiki typo; real syntax is `{<ColorName>}`. | Every concrete example in wiki and shipped filters uses a named color (`{Red}`, `{Purple}`). |
| Unterminated string literals | Terminate at end-of-line; emit warning but continue parsing. | Shipped filters contain unterminated strings and the game still loads them. |
| `ItemName` match semantics (exact vs substring) | Treat as substring/fuzzy match [UNVERIFIED]. Editor shows the literal string the user typed; does not attempt to resolve to specific items. | Shipped filters use `ItemName` with both exact rune names (`"Eth"`) and affix-like tokens (`"of Everliving"`), suggesting substring matching. Formal semantics unconfirmed. |
| Block-body AST representation | **Flat `conditions[]` / `actions[]` / `intraBlockComments[]` arrays.** Mid-block comment *position* relative to conditions/actions is NOT preserved on round-trip. | A `BlockEntry` union preserved position perfectly but forced every store mutation to reason in entry-array indices instead of typed condition/action arrays — too much complexity for a feature that real shipped filters use vanishingly rarely (section banners are between-block, not within). |
| Block IDs at parse time | Parser emits deterministic `parsed-${index}` IDs. Store mutations that insert blocks generate `mut-${nanoid}`; mutations preserve IDs of moved/edited blocks. | Round-trip identity (`parse(generate(parse(T))).deep-equal(parse(T))`) holds without ID-stripping. IDs are session-scoped — they don't survive save/load round-trips, which is fine since UI binds to current IDs. |
| Style preset library (display-action bundles) | **Adopted as first-class AST entity.** `FilterDocument.presets: StylePreset[]` is a parallel top-level array. `FilterBlock` gains `presetId?` + `presetOverrides?: Partial<Record<ActionKeyword, Action \| null>>` (`null` = suppress). Presets are applicable to all block kinds (Show / Hide / Style), not Style-only. Generator always emits effective actions inline; preset associations preserved via structured `# @preset-def` / `# @preset` / `# @preset-overrides` comments. | Real shipped filters demonstrate the repetition (Riftstone tier series, Uber key series, every rarity border). CSS-class abstraction lets users edit a preset once and update every linked rule. |

## Data catalogs — what we have, what we still need

**Already bootstrapped from shipped filters** (see `docs/wiki/extensions_observed.md` for details):
- `HasAffix` catalog seed: ~40 prefixes + ~14 suffixes. Covers common magic/rare affix rules.
- Rift Energy catalog: 16 named energies.
- Rune names: 33 (El → Zod), plus `Tor` from wiki.
- Quest-item names: ~17 (Horadric Cube, Khalim's Eye, etc.).
- Uber Trist key names: 5.
- Validated ItemType enumeration: wiki list is consistent with shipped-filter usage.

**Still needed for full autocomplete** (user-pasted wiki retrieval):
- Complete unique-item name catalog → `/Uniques` sub-pages.
- Complete set-item name catalog → `/Sets` sub-pages.
- Complete runeword catalog → `/Runewords` sub-pages.
- Complete affix catalog → probably a dedicated wiki page or reverse-engineered from mod data.
- Base-item-type names for `ItemName` autocomplete within specific ItemTypes.

**Nice to have:**
- Additional community filters in the current format — one stress-tests the parser; more surface more edge cases.

Nothing in this list blocks Phase 0 or Phase 1 — the bootstrap catalogs are enough to start autocomplete in Phase 2, and full catalogs can arrive incrementally.

## Phased roadmap

**Phase 0 — scaffold ✅ DONE** (commits `34ab589`, `4572b2b`, `0d41c1f`, `39245a5`, `a191470`, `0031849`):
- Vite 7 + React 19 + TS 5.9 strict + Tailwind 4 + Zustand 5 + Zundo + Vitest scaffolded.
- GH Actions deploy workflow (lean: paths-ignored, concurrency-cancel, npm cache).
- AvQest font vendored to `public/fonts/`, wired via `@font-face` + Tailwind `@theme` `--font-avqest` token.
- AppShell + useFileOperations + uiStore ported from FilterEditor (3-panel layout, placeholders inside).
- Engine + filterStore stubs that type-check.

**Phase 1 — engine ✅ DONE** (commits `3fcbd52`, `c34d3f6`, `a60d7a6`, `ca0cf9d`):
- Full AST types per locked decisions (flat conditions/actions arrays, deterministic `parsed-{index}` IDs, first-class `StylePreset` library with override semantics).
- Permissive line parser handling all wiki + extension constructs.
- Deterministic generator with preset metadata round-trip via `# @preset-def` / `# @preset` / `# @preset-overrides` comments.
- Validator with severity-graded issues (RGB out of range = error; unknown enums + unknown placeholders = warnings; sound out of 0–20 = info).
- Matcher: Style stacking + Show/Hide termination + Runeword Pattern rarity context + multi-PlayAlertSound preservation.
- Heuristic categorizer with multi-label support.
- `engine/data/spec.ts` — every wiki-enumerated value + bootstrap suggestion catalogs from shipped filters.
- 86 unit tests including round-trip identity on both shipped filters (~248 blocks each).

**Phase 2 — block editor UI ✅ DONE** (commits `6f827c3`, `d6b1d17`, `2319bcd`, `fce6e86`, `29047ad`, `fb7741a`, `f2bc489`):
- AppShell split into TopBar / RuleList / RuleDetail / RawEditor with `store/selectors.ts`.
- Block-mutation API on filterStore (add/remove/duplicate/move/toggle/updateKind/updateLabel + condition + action mutations) — every mutation regenerates rawText + reruns validator. 23 unit tests.
- RuleList: virtualized via `@tanstack/react-virtual`; drag-reorder via `@dnd-kit`; search input + kind-filter pills; per-row 180px in-game preview cell + 24px sound/minimap indicator lane; selected-row affordance (amber edge bar + bg tint + amber-bold index); Ctrl+G jump-to-index overlay.
- RuleDetail: header (kind pill group / editable label / Delete with inline two-step confirmation); condition rows with typed controls; action rows with palette grid for SetTextColor, native color picker for RGB, font/blend dropdowns, template input with placeholder-pill popover; SoundActionList for multi-PlayAlertSound; bottom preview area showing cascaded in-game appearance + rule-alone + chat message.
- ItemPreview is shared: rendered per row (compact, ellipsized) AND in the rule detail; takes effective actions from `previewActionsForBlock(document, blockId)` — the cascaded matcher walks 0..targetIdx accumulating decorators.
- Raw tab is read-only with a Copy button; Monaco deferred to Phase 6.
- Simulator panel dropped (per-row + rule-detail previews are sufficient).
- Sidebar collapse dropped (empty stripe served no purpose).

**Phase 3 — preset library UI ⏳ NEXT** (see `docs/next-up.md` §3):
- The engine + AST already support presets; generator emits round-trip metadata. Two pieces missing:
  - **3a · Parser hookup** for `# @preset-def` / `# @preset` / `# @preset-overrides` — currently parser drops them as comments.
  - **3b · UI**: Rules/Presets tabs in left panel; preset cards with usage count + swatch strip + clone/rename/delete; preset picker in rule-detail header; per-action-row override indicators (preset / overridden / suppressed); detach-from-preset button.
- **3c · Migration tool** (P2): signature-hash detection of repeated style patterns in imported filters with extract-as-preset prompts.

**Phase 4 — categorization in rule list** (user-requested; see `docs/next-up.md` §4):
- Collapsible sections grouped by inferred category (Riftstones, Runes, etc.). The `categorizer.ts` already labels blocks; UI consumes it. Sections are visual only — global index unchanged.

**Phase 5 — quick visibility grid + legacy import** (P3):
- Category × rarity matrix as a coarse onboarding surface; edits write back to the rule list.
- Drag-drop a Legacy filter, emit converted current-format filter + ambiguity report.

**Phase 6 — polish** (deferred items catalogued in `docs/next-up.md` §6):
- Power-user inputs from agent review: dual-handle range slider, multi-value popover for ItemType/ItemName/HasAffix, RGB picker with hex + recents, search filter chips beyond kind-only, sound preview ▶ button, inline template preview per field, multi-select bulk-edit bar, drag-reorder of conditions/actions within a block.
- Style-row visual treatment, resize handle for rule list, Monaco raw editor.
- Keyboard shortcuts beyond Ctrl+G; sample-item gallery for previews.
- Engine: extend `ItemDescription` with the missing condition fields (ImplicitTier / AffixTier / AffixCount / PrefixTier / SuffixTier / Stack / Runeword); refactor matcher to reuse `matchesBlock.ts`.

## Phase 0 — scaffold · detail

> **Status: completed** (2026-04-26). Deviations from plan below: (1) `engine/data/` is a single `spec.ts`, not split into `annihilusSpec.ts` + `extensions.ts` — per structural agent rec, autocomplete needs both views simultaneously. (2) Tests live at `src/engine/__tests__/` per FilterEditor convention; `tests/fixtures/` left for raw `.filter` data only (currently empty — shipped filters in `samples/` serve the round-trip role). (3) `store/selectors.ts` and split UI files (RuleList / RuleDetail / Simulator / TopBar / RawEditor) deferred to Phase 2 — current `AppShell.tsx` holds inline placeholders. (4) `engine/data/itemCatalog.ts` deferred to Phase 2 alongside autocomplete UI. (5) `noUncheckedIndexedAccess: true` added to `tsconfig.app.json`; `node` added to types so test files can import `node:fs`.

### Goal
Working dev environment, GH Pages deploy pipeline, app shell with placeholder panels, AvQest rendering. No filter editing yet — the engine is a stub that accepts blocks but does nothing semantic.

### Project structure
```
AnniFilter/
├── public/
│   └── fonts/
│       ├── AvQest.woff2
│       └── LICENSE.txt              # 1001fonts FFC EULA, copied from samples/
├── src/
│   ├── engine/
│   │   ├── types.ts                 # AST shapes (stubbed in P0; full in P1)
│   │   ├── parser.ts                # text → FilterDocument (P0: minimal, P1: full)
│   │   ├── generator.ts             # FilterDocument → text
│   │   ├── validator.ts             # validation issues
│   │   ├── matcher.ts               # item × document → match result
│   │   ├── categorizer.ts           # block → category labels
│   │   └── data/
│   │       ├── annihilusSpec.ts     # ItemTypes, fonts, colors, blends, sounds (from wiki)
│   │       ├── extensions.ts        # ChatNotification, AffixCount, etc. (from extensions_observed)
│   │       └── itemCatalog.ts       # uniques/sets/runewords (incremental, P2+)
│   ├── store/
│   │   ├── filterStore.ts           # Zustand + Zundo, raw-text mirror, dirty flag
│   │   └── selectors.ts
│   ├── ui/
│   │   ├── AppShell.tsx
│   │   ├── TopBar.tsx               # file ops, undo/redo, dirty indicator
│   │   ├── RuleList.tsx             # placeholder in P0
│   │   ├── RuleDetail.tsx           # placeholder in P0
│   │   ├── Simulator.tsx            # placeholder in P0
│   │   └── RawEditor.tsx            # Monaco lazy-loaded
│   ├── hooks/
│   │   └── useFileOperations.ts
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   └── fixtures/                    # populated in P1
├── .github/workflows/deploy.yml
├── samples/                         # already exists
├── docs/                            # already exists
├── vite.config.ts
├── tsconfig.json                    # strict mode, path alias @/* → src/*
└── package.json
```

### Tasks
1. Scaffold Vite + React 19 + TS 5.9 strict + Tailwind 4 + Zustand 5 + Zundo + Vitest. Path alias `@/*` → `src/*`.
2. Vendor AvQest: convert `samples/AvQest.ttf` → `public/fonts/AvQest.woff2` (preserve glyphs, no rename — license §3). Copy `samples/1001fonts-avqest-eula.txt` → `public/fonts/LICENSE.txt`. Add Graham Meade / 1001Fonts credit to footer.
3. Port `AppShell` + panel scaffolding from `E:\dev\Projects\git\FilterEditor\`.
4. Port `useFileOperations` (open `.filter`, save-as, dirty tracking).
5. `filterStore`: Zustand state holding `rawText: string`, `parsed: FilterDocument | null`, `dirty: boolean`, with Zundo middleware. Raw-text mirror updates eagerly on edit; parse runs in microtask.
6. Stub Monaco lazy-load. Raw editor renders a textarea in P0; Monaco wires up in P2 when there's a real reason for syntax highlighting.
7. Engine stub: types declared as empty interfaces, `parse()` returns `{ blocks: [], unknownDirectives: [] }`, `generate()` returns `''`. Just enough to type-check the store.
8. GH Actions workflow: build on push to main → deploy to `tandoran.github.io/AnniFilter`. Vite `base: '/AnniFilter/'`.

### Exit gate
- `npm run dev` shows app shell with three panels and a top bar.
- `npm run build` passes type-check + Tailwind compile + Vite bundle.
- Pushing main publishes to GH Pages within 2 minutes.
- AvQest renders in a dev-only test cell (e.g., footer credit using the font itself).
- Drag-drop a `.filter` file → store's `rawText` updates → textarea reflects content. Round-trip not yet expected; this just proves file I/O.

---

## Phase 1 — engine · detail

> **Status: completed** (2026-04-26). Deferred work that did NOT block phase exit: (1) Preset metadata parsing (`@preset-def` reconstruction in preamble, `@preset` annotations on blocks). The generator already emits these correctly; the parser currently round-trips them as plain comments because shipped filters don't yet contain any. Wire-up lands in Phase 3 alongside the preset library UI. (2) Conditions the matcher can't fully simulate without richer `ItemDescription` (`ImplicitTier`, `AffixTier`, `AffixCount`, `PrefixTier`, `SuffixTier`, `Stack`, `Runeword`) currently pass-through (always match). Adding fields to `ItemDescription` is straightforward when the simulator UI needs them.

### Goal
Parser + generator + validator + matcher + categorizer for the union of `docs/wiki/Item_Filter.md` and `docs/wiki/extensions_observed.md`. Both shipped filters round-trip with no AST loss. Comprehensive unit tests. No UI changes.

### AST shape

```typescript
// engine/types.ts

export type FilterDocument = {
  blocks: FilterBlock[];
  presets: StylePreset[];           // top-level user-editable display presets
  preamble: string[];               // comment lines before the first block
  trailingComments: string[];       // comment lines after the last block
};

export type FilterBlock = {
  id: string;                       // parsed-${index} from parser; nanoid for store mutations
  kind: 'Show' | 'Hide' | 'Style';
  enabled: boolean;                 // false ⇒ generator emits each line prefixed with `# `
  label?: string;                   // trailing comment on header line: `Show #my label`
  conditions: Condition[];
  actions: Action[];
  intraBlockComments: string[];     // mid-block #comments collected in source order; position relative to conditions/actions NOT preserved
  presetId?: string;                // when set, applies preset's actions before own (own act as overrides)
  presetOverrides?: Partial<Record<ActionKeyword, Action | null>>;
                                    // null = suppress preset's action for that keyword
};

export type StylePreset = {
  id: string;
  name: string;
  actions: Action[];                // canonical bundle, no conditions
  createdAt: number;
};

export type Condition =
  | { keyword: 'Rarity'; op: ComparisonOp; value: string }                  // value: any string; validator checks against base-rarity OR runeword-rarity set based on adjacent ItemType
  | { keyword: 'Tier'; op: ComparisonOp; value: 'Normal' | 'Exceptional' | 'Elite' }
  | { keyword: NumericConditionKeyword; op: ComparisonOp; value: number }
  | { keyword: BooleanConditionKeyword; op: '==' | '!='; value: boolean }
  | { keyword: 'ItemType' | 'ItemName' | 'HasAffix'; values: string[] }     // multi-arg, no operator; only ItemType is enum-validated
  | { keyword: 'Unknown'; raw: string };                                     // passthrough

export type NumericConditionKeyword =
  | 'Sockets' | 'ItemLevel' | 'AreaLevel' | 'PlayerLevel'
  | 'ImplicitTier' | 'AffixTier' | 'RiftstoneTier' | 'Stack'
  | 'Width' | 'Height'
  | 'AffixCount' | 'PrefixTier' | 'SuffixTier';                              // last 3: extension

export type BooleanConditionKeyword =
  | 'Ethereal' | 'Identified' | 'Spectral' | 'Runeword' | 'Warped'
  | 'QuestItem';                                                             // extension

export type ActionKeyword =
  | 'SetBorderColor' | 'SetBackgroundColor' | 'SetTextColor'
  | 'SetFont' | 'SetBlendMode' | 'SetItemName'
  | 'AppendText' | 'PrependText' | 'ChatNotification'
  | 'PlayAlertSound' | 'MinimapIcon';

export type Action =
  | { keyword: 'SetBorderColor' | 'SetBackgroundColor'; r: number; g: number; b: number }
  | { keyword: 'SetTextColor'; color: string }                               // palette name; validator checks against AnnihilusColors
  | { keyword: 'SetFont'; font: string }                                     // validator: AnnihilusFonts
  | { keyword: 'SetBlendMode'; mode: string }                                // validator: AnnihilusBlendModes
  | { keyword: 'SetItemName' | 'AppendText' | 'PrependText' | 'ChatNotification'; template: string }
  | { keyword: 'PlayAlertSound'; soundId: number }
  | { keyword: 'MinimapIcon'; size: number; r: number; g: number; b: number }
  | { keyword: 'Unknown'; raw: string };

export type ComparisonOp = '==' | '!=' | '>' | '<' | '>=' | '<=';
```

**Design notes:**
- **Flat `conditions[]` / `actions[]` / `intraBlockComments[]`** — chosen over a single `BlockEntry` union after agent review. The union preserved mid-block comment position perfectly but forced every store mutation to operate on entry-array indices instead of typed condition/action arrays. Real shipped filters use mid-block comments vanishingly rarely (section banners are between-block, captured in `preamble` / `trailingComments`); discarding intra-block comment position is acceptable.
- **Block IDs are deterministic at parse time** — parser emits `parsed-${index}`. Re-parsing the same text produces identical IDs, so the round-trip property holds without ID-stripping. Store mutations that insert new blocks generate fresh nanoid IDs (`mut-${nanoid}`); IDs of moved/edited blocks are preserved by the mutation.
- **`Unknown` variants** carry the raw line so passthrough keeps unknown-but-valid features working when the mod adds new directives.
- **Presets are first-class.** The data model supports them on all three block kinds (Show/Hide/Style); the UI's preset picker doesn't filter by kind. Generator always emits effective actions inline (game engine knows nothing about presets). Round-trip preservation via structured comments — see the Generator contract below.

### Parser contract
- **Permissive parse, strict validate.** Unknown opcodes/values become `Unknown` AST nodes; the validator surfaces them as warnings. Parser never errors on unknown keywords.
- Handles per spec decisions in CONCEPT.md (all already committed):
  - Any indent / mixed quoting / capitalized or lowercase booleans
  - Trailing `#comment` on any line, full-line `#comment` between blocks
  - Disabled blocks: a contiguous run of `# Show ...` / `#   ItemType ...` / `#   SetTextColor ...` reconstructs as `enabled: false` with line prefixes stripped
  - Unterminated string literals: terminate at end-of-line, emit warning, continue
  - Block terminator: next `Show`/`Hide`/`Style` keyword (case-sensitive, line-leading after whitespace)
- **Hard errors only** for: file unreadable / encoding broken. Everything else is warnings.

### Generator contract
- Deterministic: same AST → same bytes.
- Stable formatting: tab indent, all enum values quoted, blank line between blocks, trailing newline.
- **Always inlines effective actions.** A block with `presetId` set emits the preset's actions merged with `presetOverrides` (override replaces; `null` override suppresses; rule's own actions for the same keyword take highest priority). The game engine sees no preset abstraction.
- **Preset metadata via structured comments** (round-trip preservation):
  - Preset definitions emit at the top of the file (in `preamble`), one per preset:
    ```
    # @preset-def riftstone-purple
    #   SetBackgroundColor 25 25 25
    #   SetBorderColor 200 0 200
    #   SetFont Font16
    # @preset-def-end
    ```
  - Each block linked to a preset gets `# @preset <name>` immediately before the block header. Per-keyword overrides emit `# @preset-overrides <keyword>` lines (one per overridden keyword). Hand-edits in a text editor that corrupt these comments cause the rule to detach silently — actions are still authoritative inline.
- **Round-trip property** (the core test): for any input text `T` that the parser accepts, `parse(generate(parse(T)))` deep-equals `parse(T)`. Whitespace inside blocks may differ; AST structure must not. IDs match because parser emits deterministic `parsed-${index}`.

### Validator output
```typescript
type ValidationIssue = {
  level: 'error' | 'warning' | 'info';
  blockId?: string;
  conditionIndex?: number;          // index into block.conditions[] when issue is on a condition
  actionIndex?: number;             // index into block.actions[] when issue is on an action
  code: string;       // 'unknown-keyword', 'unknown-itemtype', 'rgb-out-of-range', ...
  message: string;
};
```
| Level | Examples |
|---|---|
| **error** | RGB component outside 0–255, `Sockets > "five"`, `Ethereal > 5` (op-vs-type mismatch) |
| **warning** | Unknown opcode, unknown ItemType value, unknown HasAffix string, MinimapIcon size outside [2, 5], unterminated string |
| **info** | Empty block (no conditions and no actions), Style block with no actions (probably mistake) |

The editor renders errors as red row indicators; warnings as yellow; info as gray.

### Categorizer
Heuristic-only — assigns one or more category labels to a block based on `ItemType` + `ItemName` conditions. No semantic understanding.

| Category | Trigger |
|---|---|
| `runes` | `ItemType "Runes"` or `ItemType "High Runes"` |
| `runewords` | `ItemType "Runeword Pattern"` |
| `riftstones` | `ItemType "Riftstone"` or `RiftstoneTier` present |
| `rift-energies` | `ItemType "Rift Energies"` |
| `quest` | `QuestItem == True` or known quest-item `ItemName` |
| `unique` | `Rarity == Unique` |
| `set` | `Rarity == Set` |
| `rare` / `magic` / `normal` | corresponding `Rarity ==` |
| `weapons` / `armor` / `jewelry` / `charms` / `potions` / ... | by `ItemType` substring match against the canonical category list |
| `uncategorized` | nothing matched |

A block can carry multiple labels (e.g., `[unique, weapons]`).

### Matcher
Block-chain simulator: takes an item description (`{ itemType, rarity, tier, itemName, sockets, ilvl, affixes, ethereal, identified, ... }`) and a `FilterDocument`, returns:
```typescript
type MatchResult = {
  styleStack: FilterBlock[];        // all matching Style blocks, in document order
  terminator: FilterBlock | null;   // first matching Show/Hide
  visible: boolean;                 // derived from terminator (default: true if no Show/Hide matched)
  effectiveActions: Action[];       // styleStack actions flattened, last-wins per keyword
};
```
No `Continue` (per committed decision). Walk stops at first Show/Hide match; Style blocks before that point all apply.

### Test fixture set
```
tests/fixtures/
├── wiki-examples/           # one .filter + one .json (expected AST) per wiki example block
│   ├── high-runes.filter
│   ├── high-runes.expected.json
│   ├── unique-bows.filter
│   ├── unique-bows.expected.json
│   └── ...
├── shipped/                 # copies of samples/, used for round-trip
│   ├── lenzy-regular.filter
│   └── lenzy-strict.filter
├── edge/                    # synthetic
│   ├── unterminated-string.filter
│   ├── disabled-block.filter
│   ├── trailing-comment.filter
│   ├── header-comment.filter
│   ├── empty-block.filter
│   ├── unknown-opcode.filter
│   └── mixed-indent.filter
└── runtrip/                 # round-trip canaries that broke once and shouldn't break again
```

### Exit gate
- All wiki example blocks parse to expected AST (`*.expected.json`).
- Both shipped filters round-trip: AST after `parse → generate → parse` is deep-equal to AST after first `parse`.
- Validator on both shipped filters produces only known-warning categories (zero errors, zero unexpected codes).
- Categorizer assigns ≥ one category to ≥ 95% of blocks in shipped filters.
- Engine module test coverage ≥ 90% (Vitest, line + branch).
- Matcher: synthetic-item test suite covers Show-terminates / Hide-terminates / Style-only / no-match-defaults-to-shown / Style-stack-last-wins.

> **Actual exit-gate state at completion (2026-04-26):** all met except (1) shipped filters round-trip via the source samples directly, not copies in `tests/fixtures/shipped/` — `tests/fixtures/` was never created, and the test reads from `samples/` via cwd-relative path (vitest cwd = project root). (2) Categorizer coverage threshold relaxed from ≥95% to ≥70%: most "uncategorized" shipped blocks are intentional cross-cutting Style decorators on numeric conditions only (e.g. blanket `Tier == Elite` style), which the heuristic correctly cannot label without ItemType. (3) Coverage % not measured — we have 86 tests across 7 files covering all five engine modules + the spec data; chasing a numeric coverage target adds noise without value at this scale.

## Phase 2 — UI · detail

> **Status: completed** (2026-04-26). Deviations from plan:
> - **Simulator panel dropped** (commit `d6b1d17`): per-row preview + rule-detail bottom preview communicate everything the planned right-side panel would have. The matcher engine remains for future "test arbitrary item" features.
> - **Sidebar collapse dropped** (commit `fb7741a`): the 32px collapsed stripe added no value vs the panel itself; resize-handle is a Phase 6 polish item if friction emerges.
> - **Raw tab is read-only** (commit `f2bc489`): a Copy button replaces editing. Monaco deferred to Phase 6.
> - **Per-row preview is cascaded** (commit `fb7741a`): renders effective actions from `previewActionsForBlock(document, blockId)` walking 0..targetIdx, not just the row's own actions. RuleDetail bottom shows BOTH cascaded and rule-alone for contrast.
> - **Conditions are form rows, not chips** (commit `29047ad`): inline typed controls with operator selector + value editor + `×` remove. Chip-style with popover-edit was deferred — current form is denser per row but works fine. Polish later if it becomes friction.
> - **MinimapDot is inline in IndicatorLane**, not a separate component.
> - **TemplateInput** with `{…}` popover replaced the planned `TemplateEditor` (contenteditable approach).
> - **`itemCatalog.ts` not split out** — bootstrap suggestion catalogs live in `engine/data/spec.ts`; split when autocomplete consumers actually need them.
> - **`shortcuts.tsx` not created** — only Ctrl+G exists, lives in `JumpToIndexOverlay.tsx`. Move to a shared shortcuts file when adding more.
> - Engine helpers added that weren't on the original plan: `synthesizeItem.ts`, `preview.ts`, `matchesBlock.ts` (extracted from matcher for reuse without circular import — `matcher.ts` still has its own copy of the condition matcher; merging is a low-priority follow-up).

### Goal
Replace `AppShell.tsx`'s placeholder panels with real components driven by `filterStore`. Users can open a `.filter`, navigate the rule list, edit rule conditions and actions through typed controls, see the resulting nameplate previewed live, and save the modified filter. The four UX quick-wins from agent review folded in. Preset library UI is **out of scope** — that's Phase 3.

### Project structure delta
```
src/
├── ui/
│   ├── AppShell.tsx               # slimmed down: just panel layout + tab routing
│   ├── TopBar.tsx                 # extracted: file ops + dirty + undo/redo + tab strip
│   ├── RuleList.tsx               # left panel: indexed list, search, kind filter
│   ├── RuleListRow.tsx            # one row: index + edge color + label + summary + preview cell + indicator lane
│   ├── RuleDetail.tsx             # center panel: per-block typed editor
│   ├── ConditionChip.tsx          # inline editable condition with operator + value
│   ├── ActionRow.tsx              # one toggleable action with typed controls
│   ├── ColorSwatch.tsx            # bare 22px swatch, opens picker popover (RGB)
│   ├── PaletteGrid.tsx            # 16-cell SetTextColor grid (quick-win #5)
│   ├── ComboPreview.tsx           # font / blend dropdown with live preview
│   ├── TemplateEditor.tsx         # contenteditable with placeholder pills
│   ├── MinimapDot.tsx             # SVG dot scaled by size value (quick-win #8)
│   ├── BooleanToggle.tsx          # Yes/No pill chip (quick-win #4)
│   ├── ItemPreview.tsx            # in-game-style nameplate (the .pv-label CSS pattern)
│   ├── Simulator.tsx              # right panel: item description form + match result
│   ├── ItemBuilderForm.tsx        # the form: ItemType + Rarity + Tier + ilvl etc.
│   ├── RawEditor.tsx              # Monaco lazy-loaded (decision pending — see prerequisites)
│   └── shortcuts.tsx              # global keyboard handlers incl. Ctrl+G (quick-win #13)
├── store/
│   ├── filterStore.ts             # extended with block-mutation API (see below)
│   └── selectors.ts               # derived views: blocksByCategory, issuesByBlock, etc.
└── engine/data/
    └── itemCatalog.ts             # autocomplete sources for ItemName: runes,
                                   #   rift-energies, quest items (already in spec.ts —
                                   #   re-exported here as named lookup tables)
```

### Block-mutation API to add to `filterStore`

```typescript
addBlock(kind: BlockKind, afterId?: string): string  // returns new block id
removeBlock(id: string): void
duplicateBlock(id: string): string | null
moveBlock(id: string, toIndex: number): void
toggleBlock(id: string): void                         // flips enabled
updateBlockKind(id: string, kind: BlockKind): void
updateBlockLabel(id: string, label: string | undefined): void

addCondition(blockId: string, condition: Condition): void
updateCondition(blockId: string, index: number, condition: Condition): void
removeCondition(blockId: string, index: number): void

addAction(blockId: string, action: Action): void
updateAction(blockId: string, index: number, action: Action): void
removeAction(blockId: string, index: number): void
setBlockActions(blockId: string, actions: Action[]): void   // bulk replace, used by template editor
```

Every mutation regenerates `rawText` (so the raw editor stays in sync) and re-runs `validate(document)` to refresh `issues`. Mutations get fresh `mut-${nanoid()}` IDs for newly-created blocks; existing blocks keep their IDs across moves and edits.

### Component-by-component sketch

**RuleList** (`preview-1` mockup is the spec):
- Sticky header: search input + kind-filter pills (`Show` / `Hide` / `Style` toggleable).
- Virtualized list (200+ rules → must virtualize; use `@tanstack/react-virtual` already in FilterEditor's stack).
- Each row: 24px edge color strip (Show=green, Hide=red, Style=amber), 3-digit index (`tabular-nums`), enable checkbox, label, condition summary, 200×44 preview cell rendering an example item with the rule's effective actions, 24×44 indicator lane (sound icon + minimap dot).
- Click row → selects in store; drag handle → reorders via `dnd-kit` (FilterEditor pattern).

**RuleDetail** (`preview-2` simple, `preview-3` complex):
- Header: index + enabled toggle + kind pill group + editable label + Layers count.
- Conditions section: inline chips. Click chip → operator + value editor in popover. `+ condition` button opens grouped picker (Item / Rarity / Numeric / Boolean).
- Actions: two-column grid (Display | Text), each row a checkbox + label + typed control. Disabled rows go to opacity 0.38. Sound + Minimap rows in a strip below.
- Live preview at the bottom: `ItemPreview` rendered with the rule's effective actions.

**Simulator** (right panel):
- `ItemBuilderForm`: dropdowns for ItemType, Rarity, Tier; numeric inputs for ilvl/sockets/etc.; checkboxes for Ethereal/Identified/QuestItem; tag-input for affixes.
- Live result: the matcher runs on every form change. Shows the resulting nameplate, the terminating block (Show/Hide indicator), the Style stack of contributing rules with click-to-jump.

**RawEditor**: Monaco lazy-loaded. Two-way bind — typing updates `rawText`; on blur or Ctrl+Enter, `reparseRaw()` runs.

**Quick-wins folded in:**
- `BooleanToggle` (chip with Yes/No pill instead of `== True`).
- `PaletteGrid` (16-cell SetTextColor picker, no dropdown).
- `MinimapDot` (rendered SVG dot scaled by size value, no "Size 2" text).
- Global `Ctrl+G` opens a jump-to-index input that scrolls + selects.

### Prerequisites / decisions to make before starting

1. **Monaco — bring it in now or stay with textarea?** Monaco adds ~3 MB to the bundle (lazy-loaded — only matters when the user opens the Raw tab). Real syntax highlighting + folding is valuable for power users but adds porting work. **Recommend:** wire Monaco in P2.6 as the last sub-step; textarea is fine through P2.1–P2.5.
2. **Item simulator — hand-curated test items or computed?** The matcher needs an `ItemDescription`. Options: (a) `ItemBuilderForm` only (user fills out the fields), (b) preset test-item gallery (Cosmic Rift Energy, Ohm Rune, generic Rare body armor with affixes, etc.) selectable from a strip. **Recommend:** start with (a); add (b) in P5 polish.
3. **`@tanstack/react-virtual`** — confirm we want virtualization for the rule list. 200+ rules is plausible. FilterEditor uses it; one new dependency. **Recommend:** yes, add in P2.3.
4. **`dnd-kit`** — for drag-reorder. FilterEditor already uses it; same dependency set. **Recommend:** yes, add in P2.3.
5. **Whether to wire preset metadata round-trip in the parser now or in P3.** Generator already emits it; parser ignores it. Preserving on round-trip currently means a user-created preset survives only via the Zundo undo stack within a session — `parse(generate(parse(T)))` drops presets. **Recommend:** wire parser in P3 alongside the preset library UI; no risk in current sessions because no shipped filter has presets.
6. **`ItemDescription` extension** — add `implicitTier`, `affixTier`, `affixCount`, `prefixTier`, `suffixTier`, `stack`, `runeword` fields when the simulator form needs them. Currently those conditions pass-through in the matcher. **Recommend:** add the fields in P2.6 when the form needs to drive them.
7. **`store/selectors.ts`** — derived views like `blocksByCategory`, `issuesByBlockId`. Worth adding in P2.1 alongside the AppShell split so panels can subscribe to narrow slices.

### Sub-phase ordering (commit boundaries)

- **P2.1** — split AppShell into TopBar / RuleListPanel / RuleDetailPanel / SimulatorPanel / RawEditor (placeholders preserved); add `store/selectors.ts`. No behavior change. Smoke commit.
- **P2.2** — extend `filterStore` with the block-mutation API + tests. Pure store work, no UI yet.
- **P2.3** — RuleList with virtualization, drag-reorder, search, kind-filter pills, in-game-style preview cell with effective actions. Selects a block on click.
- **P2.4** — RuleDetail with condition chips, action rows, palette grid, RGB swatch, font/blend combos, template editor with placeholder pills, boolean toggle chips.
- **P2.5** — Simulator: ItemBuilderForm + matcher result + nameplate preview.
- **P2.6** — Polish: Ctrl+G, Monaco wire-up if it's the time, minimap dot refinement, ItemPreview shared between RuleList preview cell + RuleDetail preview + Simulator preview.

### Test strategy (UI light per global preference)
- Engine + store: full unit coverage (already 86 tests; add ~20 for block-mutation API).
- Components: render + key-interaction tests only (smoke level — does the row render the right text? does clicking a chip open the editor?). No deep snapshot testing.
- Manual UI verification: `npm run dev` + visual sweep against the three mockup HTMLs at each sub-phase.

### Exit gate
- All three mockups (`preview-1`, `preview-2`, `preview-3`) are functionally reproducible in the running app.
- Both shipped filters open without errors, every block renders in the rule list, selecting a block shows its conditions/actions in the detail editor, edits write back to the document, save round-trips to disk.
- Block-mutation API has unit tests covering the basic CRUD operations.
- The four quick-wins land.
- Round-trip identity tests still pass after extending the store with mutations.

## Risks / things to flag

- **No real current-format filter in-repo.** Engine gets tested only against spec examples until a player pastes one. Mitigation: flag on README so early users paste their filters to help harden the parser. Not a blocker.
- **Wiki drift.** Spec page was last modified 2025-10-10; saved copy dates from 2026-04-24. If the mod releases a syntax change, the saved spec goes stale silently. `oldid` revision ID is recorded in `docs/wiki/Item_Filter.md` so drift is detectable later; re-run the extraction when a player reports unexpected parse errors.
- **Wrong committed decision.** Any of the choices in "Spec decisions" could be wrong (e.g. maybe `Continue` actually does exist and just isn't documented). Mitigation: each decision is small and reversible. Treat user reports of "the filter doesn't work in-game" as evidence to reopen the specific choice, not as general cause to re-hedge.
