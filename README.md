# AnniFilter

Browser-based loot filter editor for the Diablo 2 mod [Annihilus](https://annihilus.net/). Edit rules visually for the current `Item_Filter` format — no hand-editing text needed.

**Live editor: https://j-a-dev.github.io/AnniFilter/**

## What you can do

**Open & navigate** — load a `.filter` from disk, browse a virtualized indexed rule list that handles 200+ rules, search by text, filter by kind (Show / Hide / Style), and `Ctrl+G` to jump to a rule by index.

**Preview as the game would** — every rule row renders a live in-game-style nameplate using its *effective* styling (the cascade of all Style layers up to that rule, not just its own actions), with a minimap dot and drop-sound indicator. The rule detail shows the cascaded preview, the rule-alone preview, and the chat-notification message together.

**Edit through typed controls** — dropdowns for enumerated values, an operator selector (`= ≠ > < ≥ ≤`), multi-value inputs for `ItemType` / `ItemName` / `HasAffix`, Yes/No toggles for booleans; RGB swatches for border/background, a palette grid for `SetTextColor`, font/blend dropdowns with live preview, a template editor with placeholder pills (`{Original}`, `{Red}`, `{Break}`, …), and a list for stacked `PlayAlertSound`. Add, duplicate, delete, drag-reorder, enable/disable, and change the kind of rules, with full undo/redo.

**Author in-game option toggles** — define boolean options and categories (`@Option` / `@Category`) that gate regions of rules like feature flags, so one filter ships multiple player-selectable presets. Edit filter metadata (`@Name` / `@Author` / `@Version` / `@Description`) and the leading **Notes** block, and simulate option states to see which rules light up.

**Save & resume** — Save / Save As back to disk; your last *saved* filter is restored on reload; first run shows a welcome chooser (open a file, load a bundled **Regular** or **Strict** sample, or start blank). A validator flags issues inline (errors / warnings / info), and a read-only **Raw** view shows the generated text with one-click copy.

## Status

Usable end-to-end: load an Annihilus `.filter`, edit rules with live previews, author option toggles, and save back to disk. Both shipped community filters parse, render, and regenerate with a deep-equal AST (no data loss). Active development — next up is a **preset library** (edit one display style, apply to many rules) and **rule sections** (collapsible categorized grouping).

## Data accuracy

> **Annihilus is not vanilla D2.** Item names, base types, runewords, and class data diverge from Diablo II LoD and D2R, so vanilla/D2R data is **not** valid here — the mod wiki is the authoritative source. The wiki at `annihilus.net` returns 403 to automated fetches, so verifying specific syntax or item data needs a browser or a user-pasted page.

## Quick start

Use the hosted editor linked above for normal use. To run locally for development or offline use:

```
npm install
npm run dev      # http://localhost:5173/AnniFilter/
npm run build    # tsc -b && vite build
npm test
```

Once running, click **Open** in the app and pick `samples/lenzy's filter_regular.filter` to populate the editor with a real community filter.

## Layout

| Path | What |
|---|---|
| `src/engine/` | Parser, generator, validator, matcher, categorizer, AST types, spec data. |
| `src/store/` | Zustand state (`filterStore`, `uiStore`) + memoized selectors. |
| `src/ui/` | React components. |
| `src/samples/` | Bundled Regular / Strict filters loaded by the welcome chooser. |
| `samples/` | Community filter fixtures (lenzy regular + strict) used for round-trip tests. |
| `docs/wiki/` | Annihilus filter spec extracts ([`item-filter.md`](./docs/wiki/item-filter.md) + [`extensions-observed.md`](./docs/wiki/extensions-observed.md)) — usable as reference for any other Annihilus tooling. |

## Stack

React 19 · TypeScript 5.9 strict · Vite 7 · Zustand 5 · Zundo · Tailwind 4 · `@dnd-kit` · `@tanstack/react-virtual` · Vitest · jsdom · React Testing Library.

## License

**AvQest font** is by Graham Meade (GemFonts, 1998), bundled at `public/fonts/AvQest.ttf` for the in-game label preview. [Luc Devroye's typography index](https://luc.devroye.org/fonts-38219.html) documents Meade's catalogue as originally freeware/shareware; commercial titles later moved to his Typotheticals foundry, but AvQest stayed in the freeware bucket (not in the Typotheticals/MyFonts catalogue). Aggregators tag it variably ([Fontspace](https://www.fontspace.com/avqest-font-f4004): Freeware, [1001Fonts](https://www.1001fonts.com/avqest-font.html): FFC, [Abstract Fonts](https://www.abstractfonts.com/font/1958): personal-use), and Meade's original distribution site is gone, so no primary readme is currently reachable — the diligence is best-effort. The D2 modding community has redistributed AvQest in public mod packages and Git repos for ~25 years without challenge. If you are Graham Meade or his estate and want this removed, open an issue and we'll comply immediately.

## Contributing

Issues and PRs welcome.
