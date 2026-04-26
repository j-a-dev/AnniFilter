# Item Filter

> **Provenance**
> - Source URL: `https://annihilus.net/wiki/index.php/Item_Filter`
> - Permanent link (revision id 3657): `https://annihilus.net/wiki/index.php?title=Item_Filter&oldid=3657`
> - Retrieved locally on: 2026-04-24 (from `AnniWiki/Item Filter - Annihilus Wiki.html`).
> - Page last modified on the wiki: 10 October 2025, at 02:17.
> - Wiki generator: MediaWiki 1.28.2.
> - On-page banners/notices: none on this page itself. Note: the wiki globally states *"This wiki is for BETA Annihilus only. Do not post vanilla Diablo II LoD information."* (per project CLAUDE.md).

## Contents

1. Item Filters
2. Installing a filter
3. Creating an Item Filter
4. An Example Filter
5. Operators
6. Opcodes
7. List of Item Types
8. List of Text Colors
9. List of Text Fonts
10. List of Blend Modes
11. List of Drop Sounds

## Item Filters

Annihilus provides a feature which allows players to customize what items they want to show, highlight, or hide with sets of customizable rules. Much of the rules, syntax and quirks of the system follow heavily with Path of Exile's item filtering system, as an attempt to allow players already familiar with that system to get started with this one.

## Installing a filter

To install a filter you have downloaded, just place it in your filter folder. To get to your filter folder, go to your annihilus folder, then to apps, then to annihilus again. Once the filter is in the filter folder, it will show up in your gameplay options in-game. Find it in the list of filters dropdown menu and select it.

Player made community item filters can be found in our Discord server.

## Creating an Item Filter

Creating your own filter requires the use of a text editor. Windows, like most operating systems, comes with a default tool for this, though the third party tool Notepad++ is recommended for text-heavy work where the default editors might fall short.

The system is composed of sets of blocks containing a single or multiple conditions. When a block is chosen by the item filtering system, that block's alert and styling rules will be applied to that item.

Blocks are chosen from the top down. As soon as an item successfully meets a block, it will do what the block says.

## An Example Filter

Hide

```text
   ItemType "Runes"
   ItemName "Eth" "Nef" "Tir" "Eld" "El"
```

Style # All rings with an implicit tier of 1 will show up with a prefix on the name

```text
   ImplicitTier == 1
   ItemType "Rings"
   PrependText "{Red}[T1] "
```

*(Preview: `[T1] Ring` — red `[T1] ` prefix followed by white item name on black background.)*

Style # This will make all rare items have a yellow border

```text
   Rarity == Rare
   SetBorderColor 255 255 000
```

*(Preview: `Dusk Shroud` rendered in yellow text with a yellow border on black background.)*

Show

```text
   Sockets >= 5
   SetBorderColor 0 0 255
```

*(Preview: `Colossus Blade (5)` rendered in grey text with a blue border on black background.)*

Show

```text
   ItemType "Runes" "Riftstone" "Rift Particles" "Rift Energies" "Quest Items"
```

Show

```text
   ItemType "High Runes"
   SetBorderColor 255 0 255
   MinimapIcon 2 255 0 255
```

*(Preview: `Zod Rune` rendered in orange text with a magenta border on black background.)*

Show

```text
   ItemType "Runes"
   ItemName "Gul" "Ist" "Um" "Pul" "Lem"
   SetBorderColor 255 0 255
   SetBackgroundColor 100 50 100
   MinimapIcon 2 255 0 255   
```

*(Preview: `Pul Rune` rendered in orange text with a magenta border on a purple background.)*

Show

```text
   ImplicitTier == 1
   Rarity >= Rare
   SetBorderColor 255 0 0
   MinimapIcon 2 255 0 0
```

Show

```text
   ItemType Jewels
   Rarity >= Magic
```

Show

```text
   Rarity == Set
   MinimapIcon 2 0 255 0
```

Show

```text
   Rarity == Unique
   MinimapIcon 2 255 200 0
```

Hide # Hides all magic and normal rarity items that are normal item bases if the ItemLevel is lower or equal to 60.

```text
   Rarity <= Magic
   Tier == Normal
   ItemLevel <= 60
```

Show

```text
   Tier == Elite
   Rarity == Normal
```

Hide

```text
   ItemType "Pelt" "Voodoo Heads" "Auric Shields" "Primal Helmets"
```

Show

```text
   ItemName "Leg"
```

Show # Leaving "Show" at the end of your filter shows all items but the ones you've hidden. Having "Hide" in the end does the opposite

## Operators

Here is a list of conditional operators that are currency accepted:

| Operator | Meaning |
| --- | --- |
| `>` | Greater than |
| `<` | Less than |
| `>=` | Greater than or Equal |
| `<=` | Less than or Equal |
| `==` | Equal to |
| `!=` | Not Equal to |

## Opcodes

### Block Opcodes

| Name | Description |
| --- | --- |
| `Show` | Used to start a block of conditional opcodes for things you want to show. |
| `Hide` | Used to start a block of conditional opcodes for things you want to hide. |
| `Style` | Used to start a block of conditional opcodes for things you want to stylize in a certain way. |

### Conditional Opcodes

| Name | Description |
| --- | --- |
| `Stack [Operator] [Number]` | A condition that checks if an item is stacked, and how many are in the stack. |
| `Rarity [Operator] [Rarity]` | A condition that checks the rarity of an item, including Normal, Magic, Rare, Set and Unique. |
| `Tier [Operator] [Tier]` | A condition that checks the tier of the item, including Normal, Exceptional and Elite. |
| `Sockets [Operator] [Number]` | A condition that checks the number of sockets of an item. |
| `ItemLevel [Operator] [Number]` | A condition that checks the item level of an item. |
| `AreaLevel [Operator] [Number]` | A condition that checks if the item was dropped in the specified area levels |
| `PlayerLevel [Operator] [Number]` | A condition that checks if the player is at a certain level when an item drops. |
| `Ethereal [Operator] [true/false]` | A condition that checks if an item is ethereal. |
| `Identified [Operator] [true/false]` | A condition that checks if an item is identified. |
| `Spectral [Operator] [true/false]` | A condition that checks if an item is spectral. |
| `ImplicitTier [Operator] [Number]` | A condition that checks the tier of an item's implicit modifier. |
| `ItemType [string]` | A condition that checks the type of the item, accepted ItemType strings are shown below. |
| `ItemName [string]` | A condition that checks the name of the item. |
| `Width [Operator] [Number]` | A condition that checks the inventory width of an item. |
| `Height [Operator] [Number]` | A condition that checks the inventory height of an item. |
| `HasAffix [string]` | A condition that checks if an item has a certain affix. Only works on identified items. |
| `AffixTier [Operator] [Number]` | A condition that checks if an item has a certain affix modifier tier and how many. Only works on identified items. |
| `RiftstoneTier [Operator] [Number]` | A condition that checks the tier of a riftstone item. |
| `Runeword [Operator] [true/false]` | A condition that checks the item has a runeword. |
| `Warped [Operator] [true/false]` | A condition that checks if an item is warped. |

### Style Opcodes

| Name | Description |
| --- | --- |
| `SetBorderColor [r:Number] [g:Number] [b:Number]` | A style condition that sets the border color for a block equal to the red, green and blue color codes that you pick. The 3 numbers must each be between 0 and 255. |
| `SetTextColor [Color]` | A style condition that sets the text color for a block. Accepted text colors are shown below. |
| `SetBackgroundColor [r:Number] [g:Number] [b:Number]` | A style condition that sets the background color for a block equal to the red, green and blue color codes that you pick. The 3 numbers must each be between 0 and 255. |
| `SetFont [Font]` | A style condition that sets the font for a block. Accepted fonts are shown below. |
| `SetBlendMode [BlendMode]` | A style condition that changes the blend mode for a block. Accepted blend modes are shown below. |
| `SetItemName [String]` | A style condition that changes the name an item shows up as. See below for examples. |
| `AppendText [String]` | A style condition that outputs the string to the end of the item. See below for examples. |
| `PrependText [String]` | A style condition that outputs the string to the start of the item. See below for examples. |

**Tip:**
For "SetItemName", "AppendText" and "PrependText" you can use the following strings:

- **{Break}** to break a line
- **{Color}** to colorize following text (Same colors that you can find further down on the page)
- **{Original}** to call back the original item name
- **{OriginalInline}** to call back the original item name in a single line.
- **{ItemName}** to call back the original item name
- **{Runeword}** to call the Runeword name
- **{ItemLevel}** to call the item level
- **{Sockets}** to call the socket count
- **{ImplicitTier}** to call the implicit tier
- **{RiftstoneTier}** to call the Riftstone tier
- **{BaseItemName}** to call the base item name

Example:

```text
Style
    Warped == True
    AppendText "{Break}{Red}Warped"
```

*(Preview: `Sacred Armor` in white on black, followed on a new line by `Warped` in red.)*

### Alert Opcodes

| Name | Description |
| --- | --- |
| `PlayAlertSound [Number]` | An alert condition that changes the sound when an item drops. |
| `MinimapIcon [size:Number] [r:Number] [g:Number] [b:Number]` | An alert condition that causes a block to show up on the minimap. |

## List of Item Types

### Armors

| | | | |
| --- | --- | --- | --- |
| Belts | Body Armors | Boots | Circlets |
| Cloaks | Gloves | Helmets | Shields |

### Class Specific

| | | | | |
| --- | --- | --- | --- | --- |
| Amazon Bows | Amazon Javelins | Amazon Spears | Auric Shields | Hand to Hand |
| Orbs | Pelts | Primal Helmets | Voodoo Heads | |

### Melee Weapons

| | | | | | | |
| --- | --- | --- | --- | --- | --- | --- |
| Axes | Blunt Weapons | Clubs | Hammers | Knives | Maces | One Handed Weapons |
| Polearms | Scepters | Spears | Staves | Swords | Two Handed Weapons | Wands |

### Ranged Weapons

| | | | | |
| --- | --- | --- | --- | --- |
| Bows | Crossbow | Javelins | Throwing Axes | Throwing Knives |

### Generic

| | | | | | |
| --- | --- | --- | --- | --- | --- |
| Amazon Items | Any Armor | Any Shield | Any Weapon | Assassin Items | Barbarian Items |
| Class Specific | Druid Items | Necromancer Items | Paladin Items | Sorceress Items | |

### Misc

| | | | | | | |
| --- | --- | --- | --- | --- | --- | --- |
| Amulets | Bow Quivers | Crossbow Quivers | Greater Souls | High Runes | Jewelry | Jewels |
| Potions | Rift Energies | Rift Particles | Riftstone | Rings | Runes | Runeword Pattern |

## List of Text Colors

| | | | | | | |
| --- | --- | --- | --- | --- | --- | --- |
| White | Red | LightGreen | Blue | DarkGold | Grey | Black |
| Gold | Orange | Yellow | DarkGreen | Purple | Green | White2 |
| Black2 | DarkWhite | | | | | |

## List of Text Fonts

| | | | | | | |
| --- | --- | --- | --- | --- | --- | --- |
| Font8 | Font16 | Font30 | Font42 | FontFormal10 | FontFormal12 | Font6 |
| Font24 | FontFormal11 | FontExocet10 | FontRidiculous | FontExocet8 | ReallyTheLastSucker | FontInGameChat |

## List of Blend Modes

| | | | | | | | |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Alpha25 | Alpha50 | Alpha75 | Alpha50Bright | Inverted | Normal | Alpha25Bright | Bright |

## List of Drop Sounds

| Value | Sound |
| --- | --- |
| 0 | very soft click |
| 1 | select hammer sound |
| 2 | thump |
| 3 | throw |
| 4 | soft click |
| 5 | thump |
| 6 | level up |
| 7 | merc level up |
| 8 | item breaking |
| 9 | eerie whir |
| 10 | cube |
| 11 | higher pitched whir |
| 12 | scroll identify |
| 13 | quest complete |
| 14 | repair |
| 15 | hostile |
| 16 | low woosh |
| 17 | high woosh 1 |
| 18 | high woosh 2 |
| 19 | high woosh 3 |
| 20 | gold |

*(Note: the source table is laid out in rows of 6 cells in a grid; it has been flattened here into a two-column value/sound table. The original value/label pairings are preserved verbatim, including the duplicate "thump" at both 2 and 5.)*

## Notes for implementers

The following observations are not part of the wiki source — they flag gaps, ambiguities, and discrepancies the spec page leaves open.

### Gaps in the spec itself

- **Grammar/structure unspecified.** The page describes blocks and conditions prose-wise ("sets of blocks containing a single or multiple conditions") but never formally states:
  - The required/optional whitespace or indentation rules (the examples use 3 spaces of indent; whether that's required is [UNCLEAR: whitespace significance]).
  - Whether comments (`#`) must start a line or can follow a statement — the examples show both (`Hide # Hides all magic and normal...` as a block header with trailing comment, and `Style # All rings with an implicit tier of 1...`).
  - Block terminators: the spec does not say how one block ends and the next begins (blank line? next `Show`/`Hide`/`Style` keyword? both work in practice per the examples).
  - Case sensitivity of keywords, colors, and values. The boolean example uses `True` (capitalised) in `Warped == True`, but the spec writes `[true/false]` in lowercase for the condition signatures — [UNCLEAR: canonical case for booleans].
- **`Continue` keyword is never mentioned.** Path of Exile filters — which this system is explicitly modelled on — use `Continue` to let a matched block fall through to subsequent blocks. The Annihilus wiki page does not include `Continue` anywhere. [UNCLEAR: whether Annihilus supports `Continue`.]
- **`ItemType` quoting rules are ambiguous.** The examples show both quoted (`ItemType "Runes" "Riftstone"`) and unquoted (`ItemType Jewels`) forms. The spec line says `ItemType [string]` without clarifying.
- **Operator defaults.** Where the signature shows `[Operator]` (e.g. `Rarity [Operator] [Rarity]`), the spec never says whether omitting the operator is allowed and what it defaults to (presumably `==`, but not stated).
- **`ItemType` list completeness.** The type list groups items into Armors / Class Specific / Melee Weapons / Ranged Weapons / Generic / Misc, but several categories apparently used by the example filter are not listed as item types. In particular, `"Quest Items"` appears in an example (`ItemType "Runes" "Riftstone" "Rift Particles" "Rift Energies" "Quest Items"`) but there is no `Quest Items` row in the List of Item Types section — [UNCLEAR: is "Quest Items" a valid ItemType, a synonym, or a spec oversight?]. Similarly, the example references `"Pelt"` (singular) while the Item Types table only lists `Pelts` (plural).
- **`Rarity` values include `Magic`**, per the spec prose. The ordering implied by `Rarity <= Magic` / `Rarity >= Rare` is not stated; presumably `Normal < Magic < Rare < Set < Unique` based on usage but this is not formally declared.
- **`Tier` values** are listed as `Normal`, `Exceptional`, `Elite` only. The example uses `Tier == Elite` and `Tier == Normal`, consistent with the spec.
- **`HasAffix` / `AffixTier` string argument format** is not defined (no list of affix strings, no link to one, no example). Both are noted as "Only works on identified items."
- **`PlayAlertSound` number range:** the List of Drop Sounds enumerates 0–20, but the spec does not explicitly bound the valid range for `PlayAlertSound` nor state whether sounds outside 0–20 are errors or silent.
- **`MinimapIcon` size parameter:** the size argument is named but its valid values/scale are not documented (the examples all use `2`).
- **Placeholder token list length.** The tip block lists these placeholders for `SetItemName`/`AppendText`/`PrependText`: `{Break}`, `{Color}`, `{Original}`, `{OriginalInline}`, `{ItemName}`, `{Runeword}`, `{ItemLevel}`, `{Sockets}`, `{ImplicitTier}`, `{RiftstoneTier}`, `{BaseItemName}`. Note that `{Original}` and `{ItemName}` are documented with identical descriptions ("to call back the original item name") — [UNCLEAR: whether they truly alias or differ subtly].
- **`{Color}` usage.** The tip says "`{Color}` to colorize following text (Same colors that you can find further down on the page)". The examples instead use the concrete color name directly in braces, e.g. `{Red}`, `{Break}{Red}Warped`. So the actual placeholder form is `{<ColorName>}` (substituting any color from the List of Text Colors) — this should be noted explicitly; the page's generic `{Color}` entry is misleading.
- **No list of stackable items** is provided for the `Stack` condition.
- **Drop sound 2 and 5 are both labelled "thump"** — preserved verbatim; may be intentional or a wiki error.
- **Text color names that look like duplicates:** `White`, `White2`, `DarkWhite`, `Black`, `Black2`. No explanation of how they differ visually.

### Discrepancy between this spec and the in-repo sample filters

The two sample filters at `E:/dev/projects/git/AnniFilter/samples/lenzys_strict_itemfilter.txt` and `.../lenzys_uberstrict_itemfilter.txt` **do not use the syntax documented on this page.** They are written in a comma-separated, legacy-style format:

```text
cap, low, hide
cap, unique, darkgold
r20, normal, orange
```

i.e. `<3-letter item code>, <quality>, <action-or-color>`. This is an entirely different grammar from the `Show` / `Hide` / `Style` block system described on the wiki page. Observations:

- The sample filters' own header says *"LeNzY's Strict Filter Legacy"*, suggesting this is a deprecated legacy format (consistent with the wiki's separate `/Legacy/` namespace noted in `CLAUDE.md`).
- Quality tokens in the samples (`low`, `normal`, `superior`, `magic`, `rare`, `unique`, `set`) partially overlap with the spec's `Rarity` values (`Normal`, `Magic`, `Rare`, `Set`, `Unique`) but add `low` and `superior`, which the spec page does not mention.
- Color tokens used as actions (`darkgold`, `lightgreen`, `orange`, `red`, `blue`, `yellow`, `white`) match names from the List of Text Colors — so the legacy format appears to implicitly combine "show" + "set text color" into one shorthand.
- None of the Opcodes documented here (`ItemType`, `ItemName`, `Rarity`, `SetBorderColor`, `MinimapIcon`, etc.) appear anywhere in the samples.
- The 3-letter codes (`cap`, `skp`, `hlm`, `fhl`, `r20`, `hp1`) are D2 internal item codes. The current `Item_Filter` spec does not document whether these codes are accepted by `ItemType` or `ItemName` in the modern syntax — [UNCLEAR: interop between legacy filter format and the `Item_Filter` format].

**Implication for the editor:** the two in-repo samples are not representative examples of the current `Item_Filter` spec. If the editor targets the current format, it will need independent example filters (the wiki points to Discord as the distribution channel for community filters in this format).

### Items the spec defers without providing a link

None. Every list the spec references ("accepted ItemType strings are shown below", "Accepted text colors are shown below", etc.) is included on this same page — there are no "see other page" forward references.
