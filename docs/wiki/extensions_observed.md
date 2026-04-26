# Filter extensions observed in shipped filters

> **Provenance**
> - Source: the two current-format filters at `samples/lenzy's filter_regular.filter` (1,729 lines) and `samples/lenzy's filter_strict.filter` (1,860 lines).
> - Filter header: `LeNzY's Annihilus Filter`, version `0.5.4-beta`, patch 2025-12-25, TYPE `Regular` / `Strict`.
> - Extracted on 2026-04-24.
> - Companion document to [`Item_Filter.md`](./Item_Filter.md).

## Why this document exists

The wiki spec at [`Item_Filter.md`](./Item_Filter.md) is incomplete. These shipped filters are known-working against the Annihilus game engine (they ship with the mod's launcher-distributed community filters) and exercise features the wiki never documents. For our editor, "what the game accepts" is the union of (wiki spec) + (features demonstrably used by shipped filters).

The project stance per `docs/CONCEPT.md` was previously "wiki is canonical." This document extends that stance: **wiki + shipped filters are canonical.** Anything in either source is a real feature. Anything in neither is treated as nonexistent until new evidence arrives.

## Extensions

### Conditions not in wiki spec

| Opcode | Signature | Notes / observed usage |
|---|---|---|
| `AffixCount` | `AffixCount [Operator] [Number]` | Total count of affixes on the item. Seen with `>=`, `==`. |
| `PrefixTier` | `PrefixTier [Operator] [Number]` | Tier of the highest-tier prefix. Seen with `==`, `<=`. |
| `SuffixTier` | `SuffixTier [Operator] [Number]` | Tier of the highest-tier suffix. Seen with `==`, `<=`. |
| `QuestItem` | `QuestItem [Operator] [true/false]` | Whether the item is a quest item. Only seen with `== True`. |

### Actions not in wiki spec

| Opcode | Signature | Notes |
|---|---|---|
| `ChatNotification` | `ChatNotification "<template>"` | Prints a message to chat when the item drops. Template supports the same placeholder language as `SetItemName` / `PrependText` / `AppendText` (`{Break}`, `{<ColorName>}`, `{Original}`, `{ShortItemName}` etc.). Example: `ChatNotification "{Purple}*** {Gold}[Elite] {ShortItemName} {Purple}***"`. |

### Placeholders not in wiki spec

| Placeholder | Notes |
|---|---|
| `{ShortItemName}` | Used inside `ChatNotification` templates, typically alongside `{Original}` in other contexts — suggests it returns a more compact representation of the item name (base name without affixes, or name without modifiers). Exact semantics [UNVERIFIED]; treat as opaque placeholder. |

### Extended Rarity values for Runeword Patterns

The wiki lists `Rarity` values as `Normal | Magic | Rare | Set | Unique`. Shipped filters additionally use:

| Value | Observed context |
|---|---|
| `Common` | `ItemType "Runeword Pattern"` + `Rarity == "Common"` |
| `Uncommon` | `ItemType "Runeword Pattern"` + `Rarity == "Uncommon"` |
| `Epic` | `ItemType "Runeword Pattern"` + `Rarity == "Epic"` |
| `Legendary` | `ItemType "Runeword Pattern"` + `Rarity == "Legendary"` |
| `Mythic` | `ItemType "Runeword Pattern"` + `Rarity == "Mythic"` |

These appear only on `Runeword Pattern` items — it's a parallel rarity dimension, not a replacement. Our type system needs to represent this: `Rarity` on normal items takes the wiki set, `Rarity` on Runeword Patterns takes this extended set.

### Quoting and case behavior (empirically confirmed)

The wiki is ambiguous about quoting and case. Real filters demonstrate:

- **Enum values (Rarity, Tier, colors, fonts, blend modes):** accepted both quoted and unquoted in the same filter (e.g. `Tier == "Normal"` and `Tier == Normal` both appear). Parser must accept both; generator always quotes for safety.
- **Booleans:** uppercase `True` / `False` are used in filters (e.g. `Ethereal == True`, `QuestItem == True`, `Identified == False`). The spec prose writes `[true/false]` lowercase in signatures. Parser should accept both; generator emits `True` / `False` to match real filters.
- **Strings (ItemType, ItemName, HasAffix, SetFont argument, etc.):** always quoted in real filters (including single-word values like `SetFont "Font16"`). Parser should accept unquoted single-word values per the spec example, but generator always quotes.

### Multi-value `PlayAlertSound`

Shipped filters stack `PlayAlertSound` multiple times in a single block:

```text
Show #High Runes
    ItemType "High Runes"
    PlayAlertSound 16
    PlayAlertSound 17
    PlayAlertSound 18
    PlayAlertSound 19
    MinimapIcon 5 255 165 000
```

Semantics [UNVERIFIED] — most likely only the last one actually plays, or they play sequentially. Our type system should allow multiple `PlayAlertSound` actions in one block without erroring, and preserve order on round-trip.

### Indentation

Shipped filters use **tab indentation** (not the 3-space indent shown in the wiki example). Parser tolerates any indent; generator emits tab indent to match community convention.

### String-parsing tolerance

The `lenzy's filter_regular.filter` contains at least two unterminated string literals (e.g. line 476 `AppendText " {Red}[T1 %fire res]` with no closing quote; line 1271 `ItemName "Cosmic` without closing quote). The game still loads and runs the filter, suggesting the engine terminates string tokens at end-of-line when a closing quote is missing.

Parser decision: accept unterminated strings by treating newline as an implicit terminator. Emit a warning but don't fail the parse.

## Data catalogs extractable from the filters

The shipped filters let us bootstrap several lookup catalogs that the wiki alone would not give us:

### Partial affix catalog (from `HasAffix` usages in regular filter)

**Prefixes (~40):** `Adroit`, `Cabalistic`, `Caretaker's`, `Cerulean`, `Citrine`, `Combatant's`, `Dueler's`, `Electrifying`, `Enlivening`, `Esoteric`, `Fierce`, `Fiery`, `Flaming`, `Freezing`, `Glacial`, `Gladiator's`, `Grandmaster's`, `Invigorating`, `Keeper's`, `Marksman's`, `Maroon`, `Master's`, `Mystical`, `Occultist's`, `Ocher`, `Otherwordly` (sic), `Proficient`, `Relentless`, `Sharpshooter's`, `Shocking`, `Sniper's`, `Sorcerer's`, `Spellcaster's`, `Steadiness`, `Toxic`, `Trainer's`, `Viridian`, `Witch's`, `Wizard's`.

**Suffixes (~14):** `of Acceleration`, `of Assimilation`, `of Endowment`, `of Haste`, `of Inertia`, `of Might`, `of Pacing`, `of Scintillation`, `of Skill`, `of Speed`, `of Steadiness`, `of the Mammoth`, `of the Mind`, `of the Wolf`.

This is enough for meaningful `HasAffix` autocomplete. The complete catalog probably includes hundreds more; treat this set as *suggestions*, not *validation*.

### Rift Energy item-name catalog

From `ItemName` usages on `ItemType "Rift Energies"`: `Brilliant`, `Cosmic`, `Ephemeral`, `Fractured`, `Immense`, `Luminous`, `Mysterious`, `Potent`, `Radiant`, `Spectral`, `Temporal`, `Transient`, `Umbral`, `Unstable`, `Veiled`, `Voided`. Full in-game names appear to be `<Prefix> Rift Energy`.

### Rune names

Filter references runes by their D2 name (`El`, `Eld`, `Tir`, `Nef`, `Eth`, `Ith`, `Tal`, `Ral`, `Ort`, `Thul`, `Amn`, `Sol`, `Shael`, `Dol`, `Hel`, `Io`, `Lum`, `Ko`, `Fal`, `Lem`, `Pul`, `Um`, `Mal`, `Ist`, `Gul`, `Vex`, `Ohm`, `Lo`, `Sur`, `Ber`, `Jah`, `Cham`, `Zod` + spec mentions `Tor`). The distinction between `ItemType "Runes"` and `ItemType "High Runes"` is made at the ItemType level; `ItemName` picks out specific runes within either tier.

### Quest-item and special-item names

`Horadric Cube`, `Book of Skill`, `Khalim's Eye`, `A Jade Figurine`, `Khalim's Brain`, `Khalim's Heart`, `Mephisto's Soulstone`, `Potion of Life`, `Lam Esen's Tome`, `Scroll Of Inifuss`, `The Golden Bird`, `Scroll of Inifuss`, `Horadric Malus`, `Horadric Scroll`, `Key to the Cairn Stones`, `Token of Absolution`, `Token of Soul Grid`.

**Uber Trist keys:** `Key of Anguish`, `Key of Pain`, `Key of Hate`, `Key of Terror`, `Key of Destruction`.

### ItemType enumeration validation

Every ItemType referenced in the shipped filters is present in the wiki's enumerated list. The filters do NOT use any ItemType outside the wiki enumeration (no `"Quest Items"`, no `"Pelt"` singular — those only appear in the wiki's own example). **The wiki's ItemType list is consistent with the authoritative filter corpus.**

## Diff between `regular` and `strict`

The `strict` variant is a superset of `regular`:
- Header changes `TYPE` from `Regular` to `Strict`.
- Two `ChatNotification "{Original}"` lines are commented out (less chat noise).
- Adds ~10 additional `Hide` blocks gated on `PlayerLevel >= 85` / `>= 90` that auto-hide leveling-tier items in endgame.

**No new syntax features.** Everything discoverable from `strict` is also discoverable from `regular`.
