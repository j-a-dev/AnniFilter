# AnniFilter

Browser-based loot filter editor for the Diablo 2 mod [Annihilus](https://annihilus.net/). FilterBlade-style structured editor (no hand-editing text), targeting the current `Item_Filter` format.

## Status

Phases 0–2 shipped — engine + UI end-to-end usable. Open a `.filter`, browse the virtualized rule list with cascaded in-game previews, edit rules through typed controls, add / delete / reorder rules, save back to disk. 110 unit tests, both shipped community filters round-trip with deep-equal AST.

**Next: Phase 3** — preset library UI. The AST + generator already support presets; parser hookup and the UI itself are what's missing. See [`docs/next-up.md`](./docs/next-up.md) for the actionable open-task inventory.

## Quick start

```
npm install
npm run dev      # http://localhost:5173/AnniFilter/
npm run build    # tsc -b && vite build
npm test
```

Open the app, click **Open**, pick `samples/lenzy's filter_regular.filter` to populate the editor.

## Layout

| Path | What |
|---|---|
| `src/engine/` | Parser, generator, validator, matcher, categorizer, AST types, spec data. Pure functions, full test coverage. |
| `src/store/` | Zustand state (`filterStore`, `uiStore`) + memoized selectors. |
| `src/ui/` | React components. `AppShell` composes `TopBar` + `RuleList` + `RuleDetail` + `RawEditor`. |
| `src/engine/__tests__/` | Engine + round-trip tests. |
| `src/store/__tests__/` | Store-mutation tests. |
| `samples/` | Community filter fixtures (lenzy regular + strict) and the AvQest font + EULA. |
| `docs/CONCEPT.md` | Project plan, spec decisions, phased roadmap with completion notes. |
| `docs/next-up.md` | Open improvements with file pointers and acceptance hints. |
| `docs/open-questions.md` | Language-level questions where the engine currently makes pragmatic assumptions. |
| `docs/wiki/` | Extracted Annihilus wiki spec + extensions catalog from shipped filters. **Together = canonical spec.** |
| `docs/ui/` | Design mockups (rule list, rule detail, font comparison). Predate implementation; treat as historical. |
| `.github/workflows/deploy.yml` | Lean GH Pages deploy (paths-ignore on docs/samples, concurrency-cancel, npm cache). Untested in production. |

## Stack

React 19 · TypeScript 5.9 strict · Vite 7 · Zustand 5 · Zundo · Tailwind 4 · `@dnd-kit` · `@tanstack/react-virtual` · Vitest · jsdom · React Testing Library. Path alias `@/*` → `src/*`.

## Working with the project

- **Wiki is 403-walled.** `WebFetch` cannot read `annihilus.net` — re-extraction requires the user saving HTML and an agent processing it. See [`docs/CONCEPT.md`](./docs/CONCEPT.md) "Critical retrieval trap".
- **Round-trip identity is the engine's load-bearing invariant.** Both shipped filters parse → generate → parse to deep-equal AST. See `src/engine/__tests__/roundtrip.shipped.test.ts`. Any parser/generator change must preserve this.
- **Wiki + extensions = canonical.** `docs/wiki/Item_Filter.md` is what the wiki says; `docs/wiki/extensions_observed.md` adds features used in shipped community filters but undocumented (e.g. `ChatNotification`, `AffixCount`, the extended Runeword Pattern Rarity values). Their union is the spec.
- **AvQest font** is bundled under GemFonts' freeware distribution ([Fontspace listing](https://www.fontspace.com/avqest-font-f4004)). Credit goes to **GemFonts** (Graham Meade's foundry, 1998). Don't add a "download font" link in the UI — even under freeware terms, redirecting users to download the font from inside the editor isn't appropriate.

## Contributing

For agents picking up tasks, [`docs/next-up.md`](./docs/next-up.md) is the entry point — pick an item, follow its file pointers, satisfy its acceptance hint. CONCEPT.md is the strategic context behind why each phase exists.
