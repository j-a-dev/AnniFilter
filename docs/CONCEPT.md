# AnniFilter — Project Concept

Status: draft, v0.1 · 2026-04-24
Authoritative spec reference: [`docs/wiki/Item_Filter.md`](./wiki/Item_Filter.md)

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

**Phase 0 — scaffold** (no wiki content needed):
- New Vite + React + TS + Tailwind + Zustand + Zundo project.
- GitHub Actions workflow deploying to `tandoran.github.io/AnniFilter`.
- Port AppShell, store skeleton, useFileOperations, Monaco raw-editor from FilterEditor.
- Stub types + parser that accepts `Show`/`Hide`/`Style` blocks with unknown conditions (permissive parse; strict validate later).

**Phase 1 — engine** (needs: spec page only — already have):
- Full `types.ts` matching the spec.
- Parser, generator, validator, matcher, categorizer.
- Unit tests round-tripping every example block in the spec.

**Phase 2 — block editor UI**:
- Condition/action row components, typed controls, color picker split (palette for text, RGB for border/bg).
- Left nav with inferred categorization.
- Right preview pane rendering the nameplate.

**Phase 3 — quick visibility grid**:
- Grid-edit surface generating/updating blocks.

**Phase 4 — legacy import** (needs: legacy syntax is already understood from samples):
- Drag-drop a Legacy filter, emit a converted current-format filter + a report of ambiguous mappings (`low`, `superior`, etc.).

**Phase 5 — polish**:
- Keyboard shortcuts, undo/redo visibility, sample-item library for preview, exportable snippets.

## Phase 0 — scaffold · detail

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
├── tailwind.config.ts
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

### Goal
Parser + generator + validator + matcher + categorizer for the union of `docs/wiki/Item_Filter.md` and `docs/wiki/extensions_observed.md`. Both shipped filters round-trip with no AST loss. Comprehensive unit tests. No UI changes.

### AST shape

```typescript
// engine/types.ts

export type FilterDocument = {
  blocks: FilterBlock[];
  preamble: string[];               // comment lines before the first block
  trailingComments: string[];       // comment lines after the last block
};

export type FilterBlock = {
  id: string;                       // stable, generated (nanoid or content-hash)
  kind: 'Show' | 'Hide' | 'Style';
  enabled: boolean;                 // false ⇒ generator emits each line prefixed with `# `
  label?: string;                   // trailing comment on header line: `Show #my label`
  entries: BlockEntry[];            // ordered: conditions, actions, intra-block comments
};

export type BlockEntry =
  | { kind: 'condition'; data: Condition }
  | { kind: 'action'; data: Action }
  | { kind: 'comment'; text: string };

export type Condition =
  | { keyword: 'Rarity'; op: ComparisonOp; value: string }                  // value: any string; validator checks against base-rarity OR runeword-rarity set based on adjacent ItemType
  | { keyword: 'Tier'; op: ComparisonOp; value: 'Normal' | 'Exceptional' | 'Elite' }
  | { keyword: NumericConditionKeyword; op: ComparisonOp; value: number }
  | { keyword: BooleanConditionKeyword; op: '==' | '!='; value: boolean }
  | { keyword: 'ItemType' | 'ItemName' | 'HasAffix'; values: string[] }     // multi-arg, no operator
  | { keyword: 'Unknown'; raw: string };                                     // passthrough

export type NumericConditionKeyword =
  | 'Sockets' | 'ItemLevel' | 'AreaLevel' | 'PlayerLevel'
  | 'ImplicitTier' | 'AffixTier' | 'RiftstoneTier' | 'Stack'
  | 'Width' | 'Height'
  | 'AffixCount' | 'PrefixTier' | 'SuffixTier';                              // last 3: extension

export type BooleanConditionKeyword =
  | 'Ethereal' | 'Identified' | 'Spectral' | 'Runeword' | 'Warped'
  | 'QuestItem';                                                             // extension

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
- `BlockEntry` union preserves intra-block comment positions for round-trip. UI selectors derive `conditions: Condition[]` and `actions: Action[]` views; `entries` is the persisted source-of-truth.
- `Unknown` variants carry the raw line so passthrough keeps unknown-but-valid features working when the mod adds new directives.
- Block IDs are generated, not derived from source lines, so reordering/deleting blocks doesn't shift IDs.
- No `rawSourceSpan` — round-trip is guaranteed via AST→generator, not by stashing source ranges.

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
- **Round-trip property** (the core test): for any input text `T` that the parser accepts, `parse(generate(parse(T)))` deep-equals `parse(T)`. Whitespace inside blocks may differ; AST structure must not.

### Validator output
```typescript
type ValidationIssue = {
  level: 'error' | 'warning' | 'info';
  blockId?: string;
  entryIndex?: number;
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

## Risks / things to flag

- **No real current-format filter in-repo.** Engine gets tested only against spec examples until a player pastes one. Mitigation: flag on README so early users paste their filters to help harden the parser. Not a blocker.
- **Wiki drift.** Spec page was last modified 2025-10-10; saved copy dates from 2026-04-24. If the mod releases a syntax change, the saved spec goes stale silently. `oldid` revision ID is recorded in `docs/wiki/Item_Filter.md` so drift is detectable later; re-run the extraction when a player reports unexpected parse errors.
- **Wrong committed decision.** Any of the choices in "Spec decisions" could be wrong (e.g. maybe `Continue` actually does exist and just isn't documented). Mitigation: each decision is small and reversible. Treat user reports of "the filter doesn't work in-game" as evidence to reopen the specific choice, not as general cause to re-hedge.
