# Open improvements

Actionable inventory for whoever picks up the project next. Each entry includes file pointers + acceptance hint so you can start without re-deriving context. Strategic context lives in [`CONCEPT.md`](./CONCEPT.md); language-level open questions live in [`open-questions.md`](./open-questions.md).

Last reviewed: 2026-04-26 (Phase 2 ship — `f2bc489`).

Priority legend: **P1** = next-milestone blocker · **P2** = useful soon · **P3** = polish.

---

## Phase 3 · preset library UI

The hardest semantic work is already done — the AST has `StylePreset` on `FilterDocument` and `presetId?` + `presetOverrides?` on `FilterBlock`, and the generator already emits `# @preset-def …`, `# @preset …`, `# @preset-overrides …` comment metadata. The two missing halves:

### 3a · Parser hookup for preset metadata · P1

**Why:** generator round-trips presets through structured comments, but the parser currently treats them as ordinary preamble/intra-block comments. Result: presets the user creates in-app don't survive `parse(generate(parse(T)))`.

**Where:**
- `src/engine/parser.ts` — preamble walk currently stuffs everything into `preamble: string[]`. Add a sub-pass that recognizes `# @preset-def NAME` … `# @preset-def-end` blocks and constructs `StylePreset[]` from the body lines.
- Same file — block-header walk currently consumes `# @preset NAME` lines as ordinary preamble comments. Detect them as a leading annotation on the next block and populate `block.presetId` (resolved by name → preset.id from the just-built table). `# @preset-overrides KEYWORD` lines accumulate into `block.presetOverrides`; the actual `Action` value comes from the inline action with that keyword — diff against the preset's value to detect divergence.

**Acceptance:**
- New tests in `src/engine/__tests__/` round-trip a synthetic document with presets through `parse → generate → parse` with deep-equal AST.
- Round-trip on shipped filters still passes (no preset metadata there → no behavior change).

**Effort:** S–M.

### 3b · Preset library UI · P1

**Why:** real shipped filters repeat the same display style across many rules (Riftstone tier series, Uber key series, every rarity border). Editing once, applying many times is the central productivity feature.

**Design source:** the Phase 3 UI proposal in agent output is the reference — see git log of conversation around 2026-04-26. Highlights:
- Tabs at the top of the left panel: `Rules` / `Presets`.
- Preset cards (in the Presets tab): name (editable inline), usage count, swatch strip showing the preset's primary colors, clone/delete/rename actions.
- Picker in `RuleDetailHeader.tsx`: dropdown showing all presets, with a swatch strip per option; selecting sets `block.presetId`.
- In `ActionRow.tsx`: when block has `presetId`, the row shows the preset's value pre-filled and dimmed; editing converts to an override (writes to `block.presetOverrides[keyword]`); unchecking suppresses (`presetOverrides[keyword] = null`); a small revert arrow restores.
- "Detach from preset" button in the rule detail header: copies effective actions inline and clears `presetId`.

**Where:**
- New: `src/ui/PresetsTab.tsx`, `src/ui/PresetCard.tsx`, `src/ui/PresetPicker.tsx`.
- Modify: `RuleList.tsx` (add tab strip), `RuleDetail.tsx` + `RuleDetailHeader.tsx` (preset picker + detach button), `ActionRow.tsx` (override indicators).
- New store mutations in `filterStore.ts`: `addPreset`, `removePreset`, `renamePreset`, `clonePreset`, `setBlockPreset(blockId, presetId | null)`, `setPresetOverride(blockId, keyword, action | null)`, `clearPresetOverride(blockId, keyword)`. Each follows the existing `applyDocPatch` pattern.

**Acceptance:**
- Create a preset, link rules to it, edit the preset → all linked rule previews update.
- Override one property on a single linked rule → that rule shows the override in its preview while siblings keep the preset value.
- Save → reload → presets and links survive (depends on 3a).

**Effort:** L. Probably 5+ commits like Phase 2 was.

### 3c · Preset extraction migration · P2

**Why:** an imported filter without preset metadata still benefits from preset extraction.

**Where:**
- New: `src/engine/extractPresets.ts` — group blocks by canonical action-set signature (sorted-by-keyword JSON). Groups of size ≥ 2 are candidates.
- New: `src/ui/ExtractPresetsModal.tsx` — list candidate groups (size descending), name suggestion based on shared rarity/itemtype, accept/skip per group. Accepted groups become presets; affected blocks get `presetId` set with empty `presetOverrides`.

**Acceptance:** running on shipped lenzy regular surfaces the Riftstone tier series and the Uber key series as candidates.

**Effort:** M.

---

## Phase 4 · categorization in rule list · P1

**Why:** user-requested. 200+ rules in a flat list is hard to navigate. The shipped filters already use `#===` banner comments to delineate sections; we should infer or honor them.

**Where:**
- `src/engine/categorizer.ts` already produces multi-label classifications per block. Use it to group adjacent blocks sharing a primary category into collapsible sections in `RuleList.tsx`.
- Section header: small bar showing the category name, count, and a chevron to collapse. Index stays global (collapsing doesn't renumber).
- Optional second-pass heuristic: detect `#===` banner-style preamble/trailing comments and use the banner text as the section name when present (more user-controlled than pure auto-categorization).

**Acceptance:**
- Loading shipped lenzy regular shows ~10–15 collapsible groups (Runes, Riftstones, Quest, Unique armors, etc.). Collapsed sections still count toward `Rules · N`.
- Search/filter pills work across collapsed sections (auto-expand or show match count when collapsed).

**Effort:** M.

---

## Phase 5 · quick visibility grid + legacy import · P3

Both lower-priority than 3 and 4. See CONCEPT.md "Phased roadmap" for sketch.

---

## Phase 6 · polish (deferred power-user inputs)

From the agent UX review during Phase 2 planning. Each item below was deferred — adopt as friction emerges or proactively when polishing.

### 6a · Operator segmented control inside numeric chips · P3
Today: `OpSelect` already renders a 6-segment toggle (`= ≠ > < ≥ ≤`) per condition row. Reasonable as-is; combine with chip-style conditions if/when those land.

### 6b · Dual-handle range slider · P3
For numeric conditions where a range is common (`ItemLevel 75-90`, `Sockets 4-6`), a dual-handle slider is faster than two separate condition rows. Would need parser/generator support to recognize "two adjacent numeric conditions on the same keyword with `>=` + `<=`" as a single UI control while still emitting two AST nodes.

### 6c · Multi-value popover for ItemType / ItemName / HasAffix · P2
Today: comma-separated text input (`ConditionRow.tsx` for the StringList branch). Better: anchored popover with category-grouped checkboxes for ItemType (~50 items in 6 wiki groups), tokenized tag-input with autocomplete for ItemName/HasAffix (suggestion sources: `RUNE_NAMES`, `RIFT_ENERGY_PREFIXES`, `QUEST_ITEM_NAMES`, `HAS_AFFIX_PREFIXES`, `HAS_AFFIX_SUFFIXES` in `engine/data/spec.ts`).

### 6d · RGB picker popover with hex + recents · P3
Today: `ColorSwatch.tsx` opens the browser's native color picker. Better: anchored popover with hue + saturation/brightness square, hex input field, R/G/B spinners, and a 6-cell "recently used" strip (recents tracked in `uiStore`). Power-user-accurate hex entry + cross-rule color matching.

### 6e · Search filter chips beyond kind-only · P3
Today: search input + Show/Hide/Style toggle pills. Better: a `▾` filter dropdown beside the search input adding filters like "has sound", "has minimap", "has ChatNotification", "uses preset X" (after Phase 3). Active filters render as removable chips inline.

### 6f · Sound preview button · P3 (asset-gated)
Today: sound dropdown shows `11 - higher pitched whir`. Better: a small ▶ button next to the dropdown plays the sample via the browser's `Audio` API. Requires bundling the 21 drop-sound clips as static assets — needs the user to source them (the mod's audio files aren't in `samples/`).

### 6g · Inline rendered preview per template field · P3
Today: a single combined preview at the bottom of the rule detail editor. Better: a per-field mini preview showing just the contribution of that one Prepend/Append/Name template, rendered when its input is focused. Good for editing long templates.

### 6h · Multi-select + bulk-edit bar · P3
Today: rules edit one at a time. Better: shift/ctrl-click rows to select multiple; a sticky bottom bar appears offering safe bulk operations (toggle enabled/disabled, change kind). Condition/action bulk-editing is harder and shouldn't be in v1 — incompatible types make partial edits confusing.

### 6i · Drag-reorder for conditions/actions within a block · P3
Today: conditions/actions stay in the order they were added (and parsed); reordering requires remove + re-add. Add `@dnd-kit` `Sortable` inside each section in `RuleDetail.tsx`. Order-of-actions matters less than order-of-blocks (game evaluates them as a set), but the editor UX benefits from manual ordering.

### 6j · Style row visual treatment · P3
Today: Style rows look like Show/Hide rows except for the amber edge stripe. User explicitly rejected auto-grouping with following rules (no real basis). A neutral approach: italicize the Style row label, show a small "Style" tag on the row, or stripe the edge differently. Keep visually clear-but-not-grouped.

### 6k · Resize handle for rule list panel · P3
Today: rule list panel is fixed at 560px. Add a draggable handle on its right edge that updates a CSS variable. State can stay local to `RuleList.tsx` (or move to `uiStore` to persist across sessions via storage middleware).

### 6l · Monaco raw editor · P3
Today: read-only `<textarea>` with a Copy button. If users want syntax highlighting + folding for hand-readability, lazy-load Monaco (already a dependency in FilterEditor's stack — copy the lazy-load shim). Keep it read-only since we removed editing intentionally.

### 6m · Keyboard shortcuts beyond Ctrl+G · P3
Today: only `Ctrl+G` (jump to index). Candidates: `Delete` to delete the selected rule (focus-sensitive — only when no input is focused), `Ctrl+N` add rule, `Ctrl+S` save, `↑/↓` navigate rules in the list, `Ctrl+/` open search. Centralize in a new `src/ui/shortcuts.tsx` (planned but never created).

---

## Engine extensions

### Extend `ItemDescription` for the missing condition keywords · P2

**Why:** `ImplicitTier`, `AffixTier`, `AffixCount`, `PrefixTier`, `SuffixTier`, `Stack`, `Runeword` conditions currently pass-through in `matcher.ts` (always match). The `synthesizeItem` helper also skips them. This means per-row previews for rules that depend ONLY on these conditions don't accurately reflect any cascading.

**Where:**
- `src/engine/types.ts` — extend `ItemDescription` with `implicitTier?`, `affixTier?`, `affixCount?`, `prefixTier?`, `suffixTier?`, `stack?`, `runeword?`.
- `src/engine/matcher.ts` — replace pass-through cases with real comparisons.
- `src/engine/synthesizeItem.ts` — add condition handlers analogous to existing numeric/boolean cases.
- New tests in `matcher.test.ts`.

**Acceptance:** rules using these conditions get cascaded previews that reflect them.

**Effort:** S.

### Refactor matcher to use the shared `matchesBlock.ts` · P3

**Why:** `src/engine/matcher.ts` and `src/engine/matchesBlock.ts` contain duplicate implementations of the condition-evaluation logic. The split was needed to avoid a circular import when adding `preview.ts`. Now that the dust has settled, fold the matcher's internal version to import from `matchesBlock.ts`.

**Where:** `src/engine/matcher.ts`. Delete the local `matchesAllConditions` + `matchesCondition` + helpers, import `matchesBlock` from `./matchesBlock`.

**Acceptance:** all 110 tests still pass.

**Effort:** XS.

---

## Deploy + ops

### Verify GitHub Pages deploy · P1 (do this once; one-time fix or it works)

**Why:** `.github/workflows/deploy.yml` exists but has never been exercised. First push to origin will reveal whether the workflow fires and whether GH Pages is configured for the repo.

**Steps:**
1. Push the branch to GitHub (`git push -u origin main`).
2. Repo Settings → Pages → Source = "GitHub Actions".
3. Watch the Actions tab; deploy job should produce a URL like `https://tandoran.github.io/AnniFilter/`.
4. Smoke-test the deployed site loads + AvQest renders + a sample filter opens (bundled 1.9 MB screenshot in `samples/` doesn't deploy because of `paths-ignore` — that's fine).

**Note on private repos:** GH Pages from a private repo historically needed GitHub Pro. Verify before locking in the privacy decision (CONCEPT.md "private repo" is the standing decision per session 2026-04-26).

### Bundle size watch · P3

**Why:** bundle has grown from 193 KB → 308 KB JS through Phase 2 (mostly from `@dnd-kit` + `@tanstack/react-virtual` in P2.3 and the action-control components in P2.4). Worth tracking; ~95 KB gzipped is fine for a desktop-grade editor but watch for ballooning.

**Where:** add a CI check that fails if `dist/assets/index-*.js` exceeds, say, 500 KB. The deploy workflow already builds; just inspect file size.

---

## Documentation gaps

### Document the `previewActionsForBlock` semantics in CONCEPT.md · P3

The cascaded-walk-up-to-and-including-target semantic is non-obvious. CONCEPT.md "Rule model" mentions Style stacking but doesn't explain the per-row preview's specific walk. Add a short subsection.

### Update `docs/ui/preview-1-rule-list.html` to match the shipped UI · P3

The mockup predates the implementation; the shipped layout differs in details (panel width, exact pixel sizes, indicator lane position). Either update the mockup to be a screenshot of reality or mark it `[historical reference — see app for current]`.

---

## Working notes for new agents

- The wiki at `annihilus.net` returns 403 to WebFetch on every URL. To re-extract spec content, the user saves HTML to `AnniWiki/`; an agent extracts to `docs/wiki/*.md`. Workflow described in the `reference_wiki_workflow.md` memory file.
- Memory directory: `C:\Users\Megaport\.claude\projects\E--dev-projects-git-AnniFilter\memory\` holds persistent context across sessions (project facts, feedback, references). `MEMORY.md` indexes the rest.
- Both shipped filters in `samples/lenzy's filter_*.filter` are the load-bearing test fixtures. Round-trip identity through them must be preserved by any parser/generator change. See `src/engine/__tests__/roundtrip.shipped.test.ts`.
- `samples/lenzys_*.txt` files use the **Legacy** filter format and are NOT parsed by the engine. They exist for the future legacy-import phase.
- AvQest font: 1001Fonts FFC license — bundled in `public/fonts/`, EULA at `public/fonts/LICENSE.txt`. Author/foundry credit is **GemFonts** (Graham Meade's outfit), not 1001Fonts. Do NOT add a "download font" link in the UI per license §6.
