# Open questions & patch-volatile data

Living document. Two sections:
- **Language-level gaps** — questions about filter syntax/semantics that are unresolved from the current sources. Update when new evidence appears (new wiki pages, new shipped filters, user reports).
- **Content catalogs** — data the language references whose contents change every mod patch. Update on every mod release.

Last full review: 2026-04-26 (Annihilus beta patch 0.5.4-beta, 2025-12-25). Engine work in Phase 1 made pragmatic assumptions for every gap below and shipped — the matcher's behavior on these is documented in code at `src/engine/matcher.ts` and `src/engine/matchesBlock.ts`. The Phase 2 UI (per-row cascaded previews) shows users the result of those assumptions in real time; re-validate when in-game evidence arrives.

For *feature*-level open work (UI improvements, new phases, polish), see [`next-up.md`](./next-up.md).

---

## Language-level gaps

Gaps that would affect parser, validator, matcher, or generator behavior. For each: current assumption (from `docs/CONCEPT.md` "Spec decisions" table), what's unknown, what would resolve it.

### Match semantics

- **`ItemName` matching: exact or substring?**
  - Assumption: substring / fuzzy match (based on shipped filters using `ItemName "Eth"` for the rune and `ItemName "of Everliving"` for what looks like an affix-like token).
  - Unknown: whether the match is case-sensitive, whole-word, or true substring.
  - Resolves via: user confirmation from mod source / Discord / side-by-side test in-game.

- **Multiple `PlayAlertSound` in one block: play all or play last?**
  - Assumption: preserve order in AST, don't try to simulate. Shipped filters stack 4 in a row on High Runes — could be intentional redundancy, sequential, or a community misconception where only the last actually fires.
  - Resolves via: user testing; unlikely to affect correctness of the editor either way.

- **`Style`-block layering order when two Style blocks set the same property**
  - Assumption: later blocks override earlier blocks for the same property (same-named action wins by position).
  - Unknown: whether the engine actually does last-write-wins, first-write-wins, or something property-specific.
  - Resolves via: in-game observation. Affects simulator preview accuracy.

- **Default visibility when no rule matches**
  - Assumption: shown (wiki states "Leaving 'Show' at the end of your filter shows all items but the ones you've hidden").
  - Unknown: is the default different if no trailing `Show` block exists?
  - Resolves via: in-game test.

### Placeholder semantics

- **`{ShortItemName}` vs `{Original}` vs `{ItemName}` vs `{BaseItemName}`**
  - Assumption: `{Original}` and `{ItemName}` are aliases (wiki says so). `{ShortItemName}` is a compressed form; `{BaseItemName}` is the base item type name without affixes.
  - Unknown: exact transformation rules for each. E.g., for a rare "Savage Blade of the Mammoth" — which token gives what?
  - Resolves via: in-game observation, ideally with a side-by-side test filter.

- **`{OriginalInline}` semantics**
  - Assumption: same as `{Original}` but forces single-line output (used to undo a `{Break}` earlier in the template).
  - Unknown: unconfirmed.

### Argument validation

- **`MinimapIcon` size scale**
  - Assumption: any non-negative integer accepted; no validation.
  - Evidence: shipped filters use `2` and `5` (`MinimapIcon 2 ...` for small, `MinimapIcon 5 ...` for big).
  - Unknown: whether the scale is `0..N` with hard cap, or discrete enum, or free-scaled.

- **`MinimapIcon` shape/variant**
  - Assumption: size is the only non-color parameter; no shape control.
  - Unknown: some engines have shape/icon selectors. If Annihilus ever adds one, our current `MinimapIcon` AST won't capture it — parser's passthrough mode will swallow it gracefully.

- **`Stack [Operator] [Number]` — which items stack?**
  - Assumption: the condition works on any item the game considers stackable (runes, gems, keys, scrolls, quivers, potions, rift pieces).
  - Unknown: formal stackable-items list.
  - Resolves via: wiki data page (none exists yet) or mod source.

- **`HasAffix` argument case-sensitivity**
  - Assumption: case-sensitive (strings are always quoted and casing matches observed filters).
  - Unknown: whether `HasAffix "maroon"` matches the `Maroon` affix.

### Unknown keywords we've seen hints of but not examples of

Some wiki-listed conditions appear in zero shipped filters — we can't validate our type/semantics against real usage:
- `Spectral [Operator] [true/false]`
- `Runeword [Operator] [true/false]`
- `AffixTier [Operator] [Number]` (distinct from the `PrefixTier`/`SuffixTier` we see in shipped filters)

Resolves via: more shipped filters that exercise these, or mod source.

### Rarity value ordering for Runeword Patterns

- **Assumption**: `Common < Uncommon < Rare < Epic < Legendary < Mythic` — inferred from shipped filter styling where Common is plain and Mythic gets Font30 + background + chat notification.
- **Unknown**: whether `Rare` in the Runeword Pattern context is the same token as `Rare` for normal items (and thus `Rarity == "Rare"` can match both), or a separate entry in an extended enum.
- **Affects**: UI validation, autocomplete grouping, simulator behavior.

---

## Content catalogs (update each patch)

Data referenced by the filter language. Each patch potentially adds/renames entries. Current coverage, source, and refresh path:

### Uniques (`ItemName` on unique items)

- **Current coverage**: none bootstrapped.
- **Source**: wiki `/Uniques` and sub-pages by base item type.
- **Refresh path**: save wiki pages locally, run extraction agent per the wiki retrieval workflow.
- **Scale**: D2 has ~380 uniques; Annihilus likely adds more.

### Sets (`ItemName` on set items)

- **Current coverage**: none bootstrapped.
- **Source**: wiki `/Sets` (if exists) or referenced pages.
- **Refresh path**: wiki retrieval workflow.

### Runewords

- **Current coverage**: none bootstrapped for names; Rarity namespace (Common/Uncommon/Rare/Epic/Legendary/Mythic) documented.
- **Source**: wiki `/Runewords` and sub-pages.
- **Refresh path**: wiki retrieval workflow.

### Runes

- **Current coverage**: 33 (`El` through `Zod`) + `Tor` (from wiki example) = 34.
- **Source**: canonical D2 rune list + anything Annihilus adds.
- **Stability**: rune names don't usually change between patches; the High Runes vs Runes boundary (`ItemType`) is stable.

### Base item types

- **Current coverage**: none bootstrapped for the `ItemName`-to-base lookup. We have the `ItemType` category enumeration (wiki-complete, validated against shipped filters).
- **Source**: wiki base-item pages, or mod source if available.
- **Use case**: when user writes `ItemName "Spiderweb Sash"`, autocomplete suggests the base item name.

### Affixes (`HasAffix`, `PrefixTier`/`SuffixTier`)

- **Current coverage**: 40 prefixes + 14 suffixes from shipped filter grep (in `docs/wiki/extensions_observed.md`).
- **Source**: no wiki page discovered yet. Best current evidence is shipped filters.
- **Refresh path**: grep new community filters as they're published to Discord; scan for `HasAffix` argument strings. Alternative: the mod likely has an `affixes.txt` data file players could share.
- **Stability**: mod balance patches may rename or add affixes.

### Rift Energy names

- **Current coverage**: 16 prefixes (Brilliant, Cosmic, Ephemeral, Fractured, Immense, Luminous, Mysterious, Potent, Radiant, Spectral, Temporal, Transient, Umbral, Unstable, Veiled, Voided).
- **Source**: shipped filter grep.
- **Refresh path**: wiki page for Rift Energies if one exists.

### Quest items & special items

- **Current coverage**: 17 quest items, 2 respec tokens, 5 Uber Trist keys.
- **Source**: shipped filter grep + D2 canon.
- **Stability**: Annihilus may add new quests/keys.

### Drop Sounds table

- **Current coverage**: 21 entries (0–20) from wiki.
- **Stability**: stable across patches unless mod audio changes.

### Fonts / Colors / Blend Modes

- **Current coverage**: complete enumeration from wiki (17 fonts, 17 colors, 8 blend modes).
- **Stability**: stable unless the mod adds UI features.

### Riftstone tiers

- **Current coverage**: tiers 1–5 observed; spec says `RiftstoneTier [Op] [Number]`.
- **Source**: shipped filters show 1–5.
- **Unknown**: whether 6+ ever appears.

---

## Refresh ritual (when a new Annihilus patch drops)

For each new mod patch:

1. **Scan for language changes**: if the mod update mentions filter syntax changes, re-fetch `docs/wiki/Item_Filter.md` (save HTML, run extraction agent) and diff against the existing version.
2. **Scan for new data**: look for new uniques, set items, runewords, affixes in the patch notes.
3. **Refresh catalogs from any new shipped filters**: if an updated LeNzY's (or other community filter) ships, re-run the `HasAffix` / `ItemName` extraction grep.
4. **Update this document**: tick off what was refreshed; add new gaps discovered.
5. **Bump the "Last full review" date at the top.**

## How to flag a new gap mid-development

When implementing and you hit something genuinely unknown (not covered by committed decisions in `docs/CONCEPT.md`):

1. Add an entry here under the appropriate section.
2. State the assumption you're making in code.
3. Keep going — don't block on it unless it's user-visible.
4. If the assumption turns out wrong later, update here + `docs/CONCEPT.md` together.
