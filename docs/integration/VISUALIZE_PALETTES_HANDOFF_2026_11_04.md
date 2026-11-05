# Visualize, palettes and navigation handoff - 2026-11-04

This records all changes since local `main` commit **`503e6b3`** (Gallery and flashcard review). Delivery is a local commit on `main` only. No push, deployment, fetch or private course-image upload is included. At preparation, cached `origin/main` was three commits behind local `main`, with no remote-only commits; the new commit adds one more local commit. Remote state was not refreshed.

## Interactive digestive anatomy

- Added a dedicated **Visualize** tab with a large digestive model, model and structure selectors, orbit/zoom, camera presets, Reset View, surrounding context, selection details and Open in Explore. General Overview remains a reading page.
- Added eight explicit canonical View in 3D actions in Deep Dive, opening a collapsible/dismissible Anatomy Companion. Desktop uses a sticky adjacent column; narrower screens use an inline panel. Closing returns focus to the initiating action. Existing reading text and Notes anchors remain intact; controls and model content are excluded from annotations and atlas-wide shortcuts.
- Reused `AnatomyScene`, the existing model registry, identity resolver, region index, selection shader, context renderer, theme and display preferences. Added opt-in embedded fitting, grounding, zoom and offscreen/document-hidden frame suspension, retaining fullscreen Explore defaults and renderer teardown.
- Scoped geometry construction to actual digestive representations and optional surrounding context. Model-specific validation rejects unavailable/candidate/foreign-model targets. Binary loading remains at existing chunk granularity, with no new streaming format or geometry pipeline.
- Added explicit canonical Learn-to-Explore query handling using the current model's resolver. Existing normal Explore navigation is retained.
- Model mappings, payload sizes, female-study disclosure, lifecycle and deferred features are detailed in [Visualize and Anatomy Companion](../anatomy-companion.md).

## UI palettes and header controls

- Added **Classic**, **Ignition**, **Ultraviolet**, and **Iris & Ember**, each using the existing independent Light/Dark mode. Classic remains the original Atlas appearance and default. The three additional palette definitions come from the verified local Engineering Club source commit recorded in [Palettes](../palettes.md).
- Added native radio swatches in Explore's existing Display settings and a compact Appearance palette menu in Learn and Notes. The final refinement removes the redundant standalone Light/Dark header buttons from Learn and Notes; both mode choices remain inside Appearance. Explore's existing mode control is retained.
- Added independent `human-atlas-palette` persistence, cross-tab palette synchronization, validated fallback for missing/invalid/blocked storage, and early restoration before paint. Existing theme, Notes and study-progress storage contracts are unchanged.
- Adapted palette values to shared interface tokens without donor typography, layouts, effects or dependencies. Scientific images, persisted highlight colors, anatomical classifications and semantic success/error colors remain unchanged.
- Kept actual WebGL colors, materials, lighting, floor/grid/markers, camera and display controls independent of UI palettes. Mode-only CSS staging colors preserve the original neutral scene surroundings. Palette switching does not update scene mode inputs or subscribe the scene to palette state.

## Final navigation

The shared registry now orders tabs exactly as follows:

**General Overview → Deep Dive → How It Connects → Who Cares? → Visualize → Gallery → Exam Cram → Study Tools**

Visualize is directly left of Gallery; Exam Cram is directly left of Study Tools. The Learn chooser, Section guide and previous/next reading navigation derive from this registry. Bookmark IDs, route identities and content are retained. README, current Learn/Gallery docs and navigation test expectations reflect the final order; older dated handoffs remain historical records.

## Complete file inventory

Added:

- `app/learn/anatomy-companion/companion.css`, `learning-viewer.tsx`, `model.ts`, `references.ts`, `viewer.tsx`, `visualize-page.tsx`.
- `data/learn/digestive-anatomy-references.json`.
- `app/palette.ts`, `palette-store.ts`, `palette-themes.css`, `appearance-controls.tsx`, `appearance-controls.css`.
- `scripts/anatomy-companion.test.mjs`, `palette.test.mjs`, `palette-ui.test.mjs`.
- `docs/anatomy-companion.md`, `docs/palettes.md`, and this handoff.

Modified:

- `app/learn/educational-article.tsx`, `page.tsx`, `subject-tabs.tsx`, `subjects.ts` for companion integration, Visualize, final order and Appearance-only header controls.
- `app/notes/page.tsx` for the Appearance-only header control.
- `app/display-controls.tsx` for palette choices in Display settings.
- `app/page.tsx`, `app/viewer-interaction.ts` for explicit canonical Explore requests.
- `app/scene.tsx` for opt-in embedded scene behavior, not palette-driven rendering changes.
- `web/index.html`, `web/main.tsx` for early palette restoration/store/CSS initialization.
- `package.json` for focused companion/palette check commands; no dependency or lockfile changes.
- `scripts/learn.test.mjs`, `scripts/reset-camera.test.mjs` for new anatomy entry points, final tab order, Appearance mode controls and optional embedded camera fixture fields.
- `README.md`, `docs/learn.md`, `docs/gallery.md` for current feature/navigation documentation.

No supplied article JSON, original anatomy geometry/manifests/crosswalk, private Gallery assets, `.env.local`, or ignored `work/` artifacts are included as changes in this delivery. Existing Gallery/flashcard features from the baseline commit are preserved.

## Validation status and limits

- Earlier anatomy implementation: **40 focused checks passed** (3 mapping/scope, 2 Learn DOM, 17 Context Reveal, 18 real-camera/scene-frame checks). TypeScript check and production build passed; that build completed in 16.80s.
- Later palette implementation: **6 focused checks passed** (4 controller/token/contrast/bootstrap and 2 actual UI DOM/scene-subscriber checks). TypeScript check and production build passed; that build completed in 20.01s. Existing Vite large-chunk/plugin-timing warnings remain.
- Source hashes during the palette task confirmed that original Classic/theme, scene/floor, anatomy/display and Context Reveal sources were unchanged relative to the pre-palette working state, which already contained the companion additions. This does not assert all renderer files match the older baseline commit.
- The final tab reorder and removal of duplicate header mode buttons have updated test expectations but **were not retested**. No suites, typecheck or build were rerun for this documentation/commit pass, following the user's request to avoid unnecessary test usage. Whitespace/staged-file review is performed for the local commit.
- Connected browser surfaces were unavailable. Live GPU pixel comparison, native desktop/mobile rendering, touch ergonomics, long-running GPU-memory behavior and exhaustive route-by-route browser checks remain unverified. Focused DOM probes are not actual GPU certification. The full repository suites were not run.
- Gallery remains a local-study collection with its existing private-asset/production boundary; a fresh checkout still needs the separately supplied ZIP imported locally. The female study model remains an adapted, experimental reference with estimated proportions, not independently validated female geometry.

See the feature-specific documents for exact source provenance, mappings, constraints and focused check commands. No remaining implementation work is claimed for deferred features.
