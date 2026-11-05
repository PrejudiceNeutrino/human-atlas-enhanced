# Gallery and flashcard handoff — 2026-11-04

This records every change since **`a21d4fc`**, the previous local `main` commit. Delivery is a local commit only: no push, deployment or upload of course images. Detailed behavior/setup is in [Gallery](../gallery.md) and [Study Tools](../study-tools.md).

## Gallery

- Added Gallery inside Learn → Digestive, immediately before Study Tools. The seven-tab order retains the existing Who Cares? label and enabled Study Tools rather than reverting to the attached prompt's older Why Is This Cool?/Quizzes labels. Learn chooser, reading arrows, Section guide and navigation counts use the shared registry. The empty Coming Soon guide group is omitted.
- Integrated all **30 figures and 30 supplied WebP thumbnails** in stable `a01`–`a15`, `p01`–`p15` source order. No conversions, replacement images, new crops or caption rewrites. The authoritative metadata and its source/rights fields remain in the private imported collection.
- Added a responsive grid, All/four-category filters with counts, title/description/tag search, visible empty/error states and lazy thumbnails with reserved dimensions and contain sizing. Categories contain 9 Anatomical Models, 8 Anatomical Diagrams, 7 Histology and 6 Physiology Diagrams. Category selection bypasses inherited color transitions and generic hover styles so the selected state appears immediately.
- Added an accessible dialog inspector with full-size image display, filtered previous/next navigation, keyboard shortcuts, wheel/button zoom, pointer dragging, pinch/pan, Fit and Actual size. Zoom is capped at native useful resolution; controls/captions stay outside the figure. Sources include the exact deck/slides, including `p08` slides 27–29. Pan updates the image transform without rerendering the collection.
- Added lazy loading and an error boundary. A synchronous one-viewport loading slot prevents Gallery's brief loading/empty states from collapsing the scroll container toward the page top. Existing shared tab-switch scrolling remains intact.

## Local asset boundary

- `scripts/import-local-gallery.py` validates the complete ZIP collection and copies the original bytes to ignored **`.local-gallery/digestive/`**. It decodes with already-installed Pillow for verification only and adds **`HUMAN_ATLAS_LOCAL_GALLERY=1`** to ignored **`.env.local`**, preserving unrelated settings. No runtime/image-conversion dependency was added.
- Local development serves only the manifest and 60 known WebPs through `/__local-gallery/digestive/`. Direct private-folder/filesystem requests, unrelated files/methods and path escapes are refused. Existing Vite environment/certificate/Git filesystem protections remain and include the private collection.
- Build/preview/production force the client Gallery feature flag off even with the local opt-in set. Private assets are outside `public/` and module imports; production shows a local-study availability notice. The build contains neither the imported files nor their manifest records.
- The private manifest, image binaries, thumbnails, contact sheet, source README/reference HTML, external ZIP, `.env.local` and ignored `work/` evidence are **not committed**. Source/infrastructure is committed normally. A fresh checkout needs the original ZIP imported locally; see the setup command in `docs/gallery.md`.
- Public publication still requires the recorded rights/third-party-credit review, required attribution and an intentional reviewed publishing configuration. This commit adds no public publishing switch.

## Flashcards

- Added a continuous list view with authored questions, answers and reading links. The single **List view** button opens it; All cards and Needs Review filter the list within the selected topic. It follows the current practice filter initially and leaves saved ratings, deck order, card position and face unchanged. Back to cards restores practice. Card shortcuts pause in list mode so normal scrolling remains available.
- Added clearer front/back differentiation: neutral front and stronger theme-aware answer tint. Removed normal-mode card borders, shadow and focus ring; forced-color mode retains a keyboard outline. Other controls keep their focus indicators.
- Fixed the card height with internal overflow for longer text, reset internal scroll on navigation/flip, removed single-card reading-link rows and made rating announcements screen-reader-only to prevent controls shifting. Reading links remain in list view.
- Made shortcuts active across the entire open modal rather than requiring focus inside the card region. Text fields, editable text, foreign dialogs, modifiers and repeat/composition events remain guarded; checkbox/button Space/Enter activation stays native.
- Fixed the subsequent arrow-key failure: Base UI stops composite keys at the popup, so the modal listener now uses capture before that boundary and removes the matching listener on close/unmount. Escape and modal dismissal remain owned by Base UI. The bottom shortcut guide describes the active-modal behavior.

## Complete file inventory

| Files | Change |
|---|---|
| `.gitignore`, `vite.config.ts` | Ignore private assets; explicit local flag, development middleware and raw-file deny rules |
| `app/learn/gallery/model.ts` | Structured metadata validation, category labels, search/filter and slide formatting |
| `app/learn/gallery/page.tsx` | Gallery grid/filter/search, loading/disabled/error states and inspection dialog |
| `app/learn/gallery/zoom-figure.tsx` | Bounded zoom, pan, pointer/pinch and inspection keyboard controls |
| `app/learn/gallery/loader.tsx`, `gallery.css` | Lazy/error boundary, stable loading slot and responsive theme styles |
| `app/learn/subjects.ts`, `subject-tabs.tsx`, `section-guide.tsx`, `learn.css` | Gallery registry/tab/guide integration and reserved loading height |
| `app/learn/study-tools/flashcards.tsx`, `study-tools.css` | List modes, scoped capture shortcuts, card colors and stable layout |
| `scripts/import-local-gallery.py`, `scripts/local-gallery-plugin.ts` | Exact ZIP import/validation and private development asset serving |
| `scripts/learn.test.mjs` | Seven-tab/order/guide/chooser expectations |
| `scripts/study-tools-ui.test.mjs` | Gallery coexistence, list-button selector and targeted modal-arrow regression |
| `README.md`, `docs/learn.md`, `docs/gallery.md`, `docs/study-tools.md` | Current feature descriptions, setup, boundaries, behavior and validation limits |
| `docs/integration/GALLERY_FLASHCARDS_HANDOFF_2026_11_04.md` | This cumulative handoff |

No educational reading/study source JSON, anatomy geometry, Notes storage, package dependency or lockfile changed in this commit.

## Verification state

| Check | Actual coverage |
|---|---|
| Import integrity | All 60 WebPs decoded; all 30 full-size dimensions/hashes match; 30 distinct figure hashes and original ID/order preserved |
| Local serving boundary | Manifest plus all 60 endpoints returned exact bytes/MIME; source-only and raw private paths refused; production mode rejected the manifest despite local opt-in |
| Build exclusion | Final Gallery implementation build contained none of the 64 supplied private files or any of the 30 source image hash records |
| TypeScript/build | Passed during Gallery implementation; latest build at that point completed in 16.96s, with existing chunk-size/plugin-timing warnings |
| Modal arrow regression | One targeted DOM check passed for all four arrows, field/list guards and releasing control on close; broader suites were not run |
| Final follow-ups | Filter-button styling, Gallery loading-height fix, final flashcard layout/color refinements and all-cards list extension were source-reviewed. Build/type checks and the targeted test were not rerun after every follow-up; the final list-button selector was updated without execution |
| Live UI | No connected browser surfaces were available. Desktop/mobile visuals, native focus/scroll behavior and pinch ergonomics remain unverified in a live browser |

The short-lived local-serving verifier logged a dependency-scan shutdown warning when closed; its endpoint/boundary assertions passed. Commit preparation is limited to documentation, whitespace, ignore/index and branch-state checks. No routine tests/builds are rerun for this commit, following the user's preference.

## Local delivery

At preparation, `main` is **two commits ahead** of cached `origin/main` and none behind. This requested local commit adds one more. No fetch was performed, so divergence describes the cached tracking ref, not a live remote comparison. No push or deployment is authorized. The final response reports the resulting commit ID and worktree state.
