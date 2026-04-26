/**
 * Authoritative enumerated values from `docs/wiki/Item_Filter.md` and
 * `docs/wiki/extensions_observed.md`. Per CONCEPT.md operating principle:
 * the union of those two documents IS the spec.
 */

// ──────────────────────────────────────────────────────────────────────
// ItemTypes — wiki-enumerated, no extensions observed in shipped filters.
// ──────────────────────────────────────────────────────────────────────

export const ITEM_TYPES_ARMORS = [
  'Belts',
  'Body Armors',
  'Boots',
  'Circlets',
  'Cloaks',
  'Gloves',
  'Helmets',
  'Shields',
] as const

export const ITEM_TYPES_CLASS_SPECIFIC = [
  'Amazon Bows',
  'Amazon Javelins',
  'Amazon Spears',
  'Auric Shields',
  'Hand to Hand',
  'Orbs',
  'Pelts',
  'Primal Helmets',
  'Voodoo Heads',
] as const

export const ITEM_TYPES_MELEE_WEAPONS = [
  'Axes',
  'Blunt Weapons',
  'Clubs',
  'Hammers',
  'Knives',
  'Maces',
  'One Handed Weapons',
  'Polearms',
  'Scepters',
  'Spears',
  'Staves',
  'Swords',
  'Two Handed Weapons',
  'Wands',
] as const

export const ITEM_TYPES_RANGED_WEAPONS = [
  'Bows',
  'Crossbow',
  'Javelins',
  'Throwing Axes',
  'Throwing Knives',
] as const

export const ITEM_TYPES_GENERIC = [
  'Amazon Items',
  'Any Armor',
  'Any Shield',
  'Any Weapon',
  'Assassin Items',
  'Barbarian Items',
  'Class Specific',
  'Druid Items',
  'Necromancer Items',
  'Paladin Items',
  'Sorceress Items',
] as const

export const ITEM_TYPES_MISC = [
  'Amulets',
  'Bow Quivers',
  'Crossbow Quivers',
  'Greater Souls',
  'High Runes',
  'Jewelry',
  'Jewels',
  'Potions',
  'Rift Energies',
  'Rift Particles',
  'Riftstone',
  'Rings',
  'Runes',
  'Runeword Pattern',
] as const

export const ITEM_TYPES = [
  ...ITEM_TYPES_ARMORS,
  ...ITEM_TYPES_CLASS_SPECIFIC,
  ...ITEM_TYPES_MELEE_WEAPONS,
  ...ITEM_TYPES_RANGED_WEAPONS,
  ...ITEM_TYPES_GENERIC,
  ...ITEM_TYPES_MISC,
] as const

export const ITEM_TYPES_SET: ReadonlySet<string> = new Set(ITEM_TYPES)

// ──────────────────────────────────────────────────────────────────────
// Rarities — two namespaces.
// ──────────────────────────────────────────────────────────────────────

export const BASE_RARITIES = [
  'Normal',
  'Magic',
  'Rare',
  'Set',
  'Unique',
] as const

export const BASE_RARITY_ORDER: ReadonlyMap<string, number> = new Map([
  ['Normal', 0],
  ['Magic', 1],
  ['Rare', 2],
  ['Set', 3],
  ['Unique', 4],
])

/** For ItemType "Runeword Pattern". `Rare` overlaps with the base set. */
export const RUNEWORD_RARITIES = [
  'Common',
  'Uncommon',
  'Rare',
  'Epic',
  'Legendary',
  'Mythic',
] as const

export const RUNEWORD_RARITY_ORDER: ReadonlyMap<string, number> = new Map([
  ['Common', 0],
  ['Uncommon', 1],
  ['Rare', 2],
  ['Epic', 3],
  ['Legendary', 4],
  ['Mythic', 5],
])

export const ALL_RARITIES_SET: ReadonlySet<string> = new Set([
  ...BASE_RARITIES,
  ...RUNEWORD_RARITIES,
])

// ──────────────────────────────────────────────────────────────────────
// Tiers (base item progression).
// ──────────────────────────────────────────────────────────────────────

export const TIERS = ['Normal', 'Exceptional', 'Elite'] as const

export const TIER_ORDER: ReadonlyMap<string, number> = new Map([
  ['Normal', 0],
  ['Exceptional', 1],
  ['Elite', 2],
])

// ──────────────────────────────────────────────────────────────────────
// Text colors — palette names accepted by SetTextColor and the
// {<ColorName>} placeholder in template strings.
// ──────────────────────────────────────────────────────────────────────

export const TEXT_COLORS = [
  'White',
  'Red',
  'LightGreen',
  'Blue',
  'DarkGold',
  'Grey',
  'Black',
  'Gold',
  'Orange',
  'Yellow',
  'DarkGreen',
  'Purple',
  'Green',
  'White2',
  'Black2',
  'DarkWhite',
] as const

export const TEXT_COLORS_SET: ReadonlySet<string> = new Set(TEXT_COLORS)

// ──────────────────────────────────────────────────────────────────────
// Fonts — accepted by SetFont.
// ──────────────────────────────────────────────────────────────────────

export const FONTS = [
  'Font6',
  'Font8',
  'Font16',
  'Font24',
  'Font30',
  'Font42',
  'FontFormal10',
  'FontFormal11',
  'FontFormal12',
  'FontExocet8',
  'FontExocet10',
  'FontRidiculous',
  'ReallyTheLastSucker',
  'FontInGameChat',
] as const

export const FONTS_SET: ReadonlySet<string> = new Set(FONTS)

// ──────────────────────────────────────────────────────────────────────
// Blend modes — accepted by SetBlendMode.
// ──────────────────────────────────────────────────────────────────────

export const BLEND_MODES = [
  'Alpha25',
  'Alpha25Bright',
  'Alpha50',
  'Alpha50Bright',
  'Alpha75',
  'Bright',
  'Inverted',
  'Normal',
] as const

export const BLEND_MODES_SET: ReadonlySet<string> = new Set(BLEND_MODES)

// ──────────────────────────────────────────────────────────────────────
// Drop sounds — wiki Drop Sounds table, values 0–20. Note: 2 and 5 are
// both "thump" per the source; preserved verbatim.
// ──────────────────────────────────────────────────────────────────────

export type DropSound = { id: number; label: string }

export const DROP_SOUNDS: readonly DropSound[] = [
  { id: 0, label: 'very soft click' },
  { id: 1, label: 'select hammer sound' },
  { id: 2, label: 'thump' },
  { id: 3, label: 'throw' },
  { id: 4, label: 'soft click' },
  { id: 5, label: 'thump' },
  { id: 6, label: 'level up' },
  { id: 7, label: 'merc level up' },
  { id: 8, label: 'item breaking' },
  { id: 9, label: 'eerie whir' },
  { id: 10, label: 'cube' },
  { id: 11, label: 'higher pitched whir' },
  { id: 12, label: 'scroll identify' },
  { id: 13, label: 'quest complete' },
  { id: 14, label: 'repair' },
  { id: 15, label: 'hostile' },
  { id: 16, label: 'low woosh' },
  { id: 17, label: 'high woosh 1' },
  { id: 18, label: 'high woosh 2' },
  { id: 19, label: 'high woosh 3' },
  { id: 20, label: 'gold' },
]

export const DROP_SOUND_IDS_SET: ReadonlySet<number> = new Set(
  DROP_SOUNDS.map((s) => s.id),
)

// ──────────────────────────────────────────────────────────────────────
// Template placeholders — for SetItemName / AppendText / PrependText /
// ChatNotification. {<ColorName>} is a separate per-color shortcut and
// is enumerated by TEXT_COLORS above.
// ──────────────────────────────────────────────────────────────────────

export const TEMPLATE_PLACEHOLDERS = [
  'Break',
  'Original',
  'OriginalInline',
  'ItemName',
  'Runeword',
  'ItemLevel',
  'Sockets',
  'ImplicitTier',
  'RiftstoneTier',
  'BaseItemName',
  'ShortItemName', // extension (used in ChatNotification)
] as const

export const TEMPLATE_PLACEHOLDERS_SET: ReadonlySet<string> = new Set(
  TEMPLATE_PLACEHOLDERS,
)

// ──────────────────────────────────────────────────────────────────────
// Bootstrap catalogs from shipped filters (HasAffix, ItemName helpers).
// Treat as suggestion sources for autocomplete, NOT validation.
// ──────────────────────────────────────────────────────────────────────

export const RIFT_ENERGY_PREFIXES = [
  'Brilliant',
  'Cosmic',
  'Ephemeral',
  'Fractured',
  'Immense',
  'Luminous',
  'Mysterious',
  'Potent',
  'Radiant',
  'Spectral',
  'Temporal',
  'Transient',
  'Umbral',
  'Unstable',
  'Veiled',
  'Voided',
] as const

export const RUNE_NAMES = [
  'El', 'Eld', 'Tir', 'Nef', 'Eth', 'Ith', 'Tal', 'Ral', 'Ort', 'Thul',
  'Amn', 'Sol', 'Shael', 'Dol', 'Hel', 'Io', 'Lum', 'Ko', 'Fal', 'Lem',
  'Pul', 'Um', 'Mal', 'Ist', 'Gul', 'Vex', 'Ohm', 'Lo', 'Sur', 'Ber',
  'Jah', 'Cham', 'Zod', 'Tor',
] as const

export const HIGH_RUNES_SET: ReadonlySet<string> = new Set([
  'Pul', 'Um', 'Mal', 'Ist', 'Gul', 'Vex', 'Ohm', 'Lo', 'Sur', 'Ber',
  'Jah', 'Cham', 'Zod',
])

export const QUEST_ITEM_NAMES = [
  'Horadric Cube',
  'Book of Skill',
  "Khalim's Eye",
  'A Jade Figurine',
  "Khalim's Brain",
  "Khalim's Heart",
  "Mephisto's Soulstone",
  'Potion of Life',
  "Lam Esen's Tome",
  'Scroll Of Inifuss',
  'The Golden Bird',
  'Scroll of Inifuss',
  'Horadric Malus',
  'Horadric Scroll',
  'Key to the Cairn Stones',
  'Token of Absolution',
  'Token of Soul Grid',
] as const

export const UBER_KEYS = [
  'Key of Anguish',
  'Key of Pain',
  'Key of Hate',
  'Key of Terror',
  'Key of Destruction',
] as const

export const HAS_AFFIX_PREFIXES = [
  'Adroit', 'Cabalistic', "Caretaker's", 'Cerulean', 'Citrine',
  "Combatant's", "Dueler's", 'Electrifying', 'Enlivening', 'Esoteric',
  'Fierce', 'Fiery', 'Flaming', 'Freezing', 'Glacial',
  "Gladiator's", "Grandmaster's", 'Invigorating', "Keeper's",
  "Marksman's", 'Maroon', "Master's", 'Mystical', "Occultist's",
  'Ocher', 'Otherwordly', 'Proficient', 'Relentless',
  "Sharpshooter's", 'Shocking', "Sniper's", "Sorcerer's",
  "Spellcaster's", 'Steadiness', 'Toxic', "Trainer's", 'Viridian',
  "Witch's", "Wizard's",
] as const

export const HAS_AFFIX_SUFFIXES = [
  'of Acceleration', 'of Assimilation', 'of Endowment', 'of Haste',
  'of Inertia', 'of Might', 'of Pacing', 'of Scintillation',
  'of Skill', 'of Speed', 'of Steadiness', 'of the Mammoth',
  'of the Mind', 'of the Wolf',
] as const
