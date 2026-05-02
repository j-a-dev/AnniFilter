# AnniFilter

Browser-based loot filter editor for the Diablo 2 mod [Annihilus](https://annihilus.net/). Edit rules visually for the current `Item_Filter` format — no hand-editing text needed.

**Live editor: https://j-a-dev.github.io/AnniFilter/**

## Status

Usable today: load an Annihilus `.filter`, edit rules with live in-game previews, save back to disk. Active development — the next planned feature is a preset library.

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
| `samples/` | Community filter fixtures (lenzy regular + strict, plus legacy-format `lenzys_*.txt` for reference). |
| `docs/wiki/` | Annihilus filter spec extracts ([`item-filter.md`](./docs/wiki/item-filter.md) + [`extensions-observed.md`](./docs/wiki/extensions-observed.md)) — usable as reference for any other Annihilus tooling. |

## Stack

React 19 · TypeScript 5.9 strict · Vite 7 · Zustand 5 · Zundo · Tailwind 4 · `@dnd-kit` · `@tanstack/react-virtual` · Vitest · jsdom · React Testing Library.

## License

**AvQest font** is by Graham Meade (GemFonts, 1998), bundled at `public/fonts/AvQest.ttf` for the in-game label preview. [Luc Devroye's typography index](https://luc.devroye.org/fonts-38219.html) documents Meade's catalogue as originally freeware/shareware; commercial titles later moved to his Typotheticals foundry, but AvQest stayed in the freeware bucket (not in the Typotheticals/MyFonts catalogue). Aggregators tag it variably ([Fontspace](https://www.fontspace.com/avqest-font-f4004): Freeware, [1001Fonts](https://www.1001fonts.com/avqest-font.html): FFC, [Abstract Fonts](https://www.abstractfonts.com/font/1958): personal-use), and Meade's original distribution site is gone, so no primary readme is currently reachable — the diligence is best-effort. The D2 modding community has redistributed AvQest in public mod packages and Git repos for ~25 years without challenge. If you are Graham Meade or his estate and want this removed, open an issue and we'll comply immediately.

## Contributing

Issues and PRs welcome.
