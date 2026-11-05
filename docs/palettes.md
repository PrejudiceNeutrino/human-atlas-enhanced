# Human Atlas UI palettes

Human Atlas now offers **Classic**, **Ignition**, **Ultraviolet**, and **Iris & Ember**, independently of its existing Light/Dark preference. Classic remains the default and continues using the original Atlas light/dark colors. Engineering Club's Classic, fonts, layouts, background effects, cursors, seasonal features and brand animations were not imported.

## Controls and persistence

- Explore: open the existing **Display settings** panel and choose a Color palette. Brightness, contrast, floor and Reset display keep their existing behavior; resetting display does not reset the palette.
- Learn, Visualize, Gallery, Study Tools and Notes: use the new **Appearance settings** palette icon. The compact menu contains Light/Dark as well as palettes; the redundant separate header mode button was removed from Learn and Notes.
- Four native radio choices show palette names, two-color swatches, descriptions and the current selection. Native radio keyboard navigation and label-sized touch targets are retained. Menus bound internal scrolling to the viewport.
- `human-atlas-palette` stores only the selected UI palette. It never writes Engineering Club keys, the existing `human-atlas-theme` key, model state, display settings or study/Notes data. Invalid/missing values default to Classic, while blocked storage still permits session selection.
- Palette changes synchronize through localStorage events across open tabs. The existing Light/Dark controller and its synchronization behavior are unchanged. An early inline bootstrap restores the validated palette and existing Light/Dark setting before the application/styles paint, without inline background overrides that could mask the palette.

## Source and semantic mapping

The three new palettes use the current local `PrejudiceNeutrino/engineering-club` checkout at **`2f50060351506c3f36654958f59890941bc49b0f`**. The inspected source files were clean: `src/app/palette-themes.css`, `src/lib/appearance.ts`, and `src/components/appearance.tsx`. Only the requested palette definitions/names were adapted; the donor menu/runtime was not copied.

| Palette / mode | Paper | Ink | Main accent | Secondary detail |
|---|---|---|---|---|
| Ignition Light | `#f7f4ed` | `#19232d` | `#b93c28` | `#edb454` |
| Ignition Dark | `#101419` | `#f4f0e8` | `#ff866b` | `#ebc174` |
| Ultraviolet Light | `#f5f3fa` | `#241e36` | `#6339c2` | `#d9ef72` |
| Ultraviolet Dark | `#12101d` | `#f4f0fc` | `#c2a8ff` | `#ddf17b` |
| Iris & Ember Light | `#f8f6f1` | `#241e31` | `#5c3cb8` | `#efad9d` |
| Iris & Ember Dark | `#161320` | `#f5f0e9` | `#bda7ff` | `#e28b70` |

Iris & Ember also retains the source editorial vermilion (`#b73d31` light / `#e28b70` dark) for restrained eyebrow/breadcrumb details. The source acid-yellow/gold/ember secondary role remains a UI detail, never a success/status or anatomical classification color.

All palette values live in **`app/palette-themes.css`**. Selectors require a non-Classic palette and the appropriate mode; no Classic color rules were replaced.

| Engineering Club role | Human Atlas tokens |
|---|---|
| paper / ink / panel | `--background`, `--foreground`, `--card[-foreground]`, `--popover[-foreground]` |
| accent / accent-hover / on-accent | `--primary`, `--primary-hover`, `--primary-foreground`, `--ui-link`, `--switch-active`, UI badge/slider accents |
| lime / on-lime | `--secondary`, `--secondary-foreground`, `--palette-detail` |
| surface-soft / hover / active | `--muted`, `--control-input`, `--accent`, `--selected-control` |
| muted / ink / paper | `--muted-foreground`, `--ui-muted`, `--ui-faint`; readable mixed `--ui-secondary` |
| line / input-line / focus | `--border`, `--input`, `--ring`, `--focus` |
| panel | glass `--panel` and `--control` surfaces |
| selection-bg / selection-ink | `--text-selection-background`, `--text-selection-foreground` |
| scroll-thumb | `--scrollbar` |
| editorial-accent | `--palette-editorial` |

Existing semantic components inherit these tokens: headers/navigation, tabs, reading text, guides, cards, dialog/popover portals, forms/search, Notes controls, Study Tools, glossary, flashcards and Gallery UI. Persisted personal highlight colors and scientific figures are not recolored. Study success/error colors, destructive meaning and the anatomical `SYSTEMS` inventory remain unchanged. No fonts, spacing or motion settings were imported from the donor.

## Strict 3D separation

The palette store changes **only `document.documentElement.dataset.palette`** and notifies its own UI subscribers. It does not call the theme/display controllers, subscribe the atlas to palette state, modify canvas styles or pass palette values into `AnatomyScene`. The existing mode-only `SCENE_THEMES` mapping is untouched.

Neutral CSS staging variables (`--scene-background`, foreground/popover/border/muted) are keyed only by Light/Dark. Non-Classic UI palettes explicitly keep Explore's `.studio`, Visualize/companion canvas staging, scene captions/lines and source hover labels at their previous mode colors. Canvas clearing, anatomical materials, lighting/environment, floor/grid/markers, selection highlighting, brightness/contrast and camera behavior remain owned by their existing scene code. Ordinary toolbars, selectors, panels, buttons and popovers around the canvas receive the UI palette.

Pre/post source hashes confirmed that `app/globals.css`, `theme.ts`, `theme-store.ts`, `scene.tsx`, `scene-floor.ts`, `scene-floor-presets.ts`, `anatomy.ts`, `display.ts` and `context-reveal-renderer.ts` were unchanged **relative to the start of the palette task**. Earlier uncommitted Visualize/Companion work is retained; comparison is to that working state, not an assertion that every scene file matches the older Git commit.

## Files and validation

Added `app/palette.ts`, `palette-store.ts`, `palette-themes.css`, `appearance-controls.tsx`, `appearance-controls.css`, `scripts/palette.test.mjs`, `scripts/palette-ui.test.mjs` and this document. Updated `app/display-controls.tsx`, `app/learn/page.tsx`, `app/notes/page.tsx`, `web/main.tsx`, `web/index.html`, `package.json` and README. No educational datasets, anatomy assets, dependencies or lockfile were changed for palettes.

- Four palette/controller/CSS/bootstrap checks passed: all six source palette/mode definitions, token coverage, readable foreground/button/muted-text contrast, independent theme state, persistence, invalid/blocked storage, refresh synchronization, prepaint restoration and exclusion of Classic/scene overrides.
- Before the final header cleanup, two focused DOM checks passed: actual Learn and Notes appearance menus and the then-present header mode toggles, four radio labels/swatches, selected state, cross-tab palette events, accessibility checks, and actual Explore Display controls. Switching every palette left the scene subscriber mounted without a rerender, preserved scene-mode input identity and kept display settings unchanged. No anatomy/image requests were made by these interactions.
- Final TypeScript check and production build passed (**20.01s**). Existing Vite large-chunk/plugin-timing warnings remain. No full repository suite was run.
- The connected computer-use inventory had no browser surfaces. Live GPU pixel comparisons, native mobile radio-key defaults, touch layouts and route-by-route screenshots were not performed. Gallery/Study Tools/Visualize palette coverage was reviewed through the shared token/scene-boundary rules; the focused DOM route checks covered Learn, Notes and Explore Display. This is not a claim of exhaustive browser certification.

The final header cleanup removes duplicate Light/Dark buttons and their unused imports/subscriptions from Learn and Notes. The focused test expectations were updated to use the existing menu mode buttons. This small cleanup and the subsequent tab reorder were not retested, following the user's limited-testing preference.

Run the focused checks with `npm.cmd run test:palettes`. Local delivery is recorded in the [cumulative handoff](integration/VISUALIZE_PALETTES_HANDOFF_2026_11_04.md). No push or deployment is included.
