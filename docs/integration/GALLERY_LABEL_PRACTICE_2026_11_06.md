# Gallery Label Practice local delivery — November 6, 2026

This cumulative handoff covers the Gallery work after `5fed14cde56c7f451e10d2ca81dac1a3aaf117a2` on the user-selected `feature/gallery-label-practice` branch. The branch and fetched `origin/main` matched that baseline before implementation. Delivery is a local feature commit; no main merge, push, upload, or deployment is included. Compared with the local `origin/main` reference, the delivered branch is one commit ahead and zero behind.

## Delivered behavior

- Optional Label Practice reuses the full-size Gallery dialog. A compact toggle opens a secondary control strip with individual reveal/hide, Hide All, Reveal All, Reset, revealed counts, optional cover numbers, and a keyboard-accessible numbered list. Ordinary viewing remains the default.
- Opaque SVG rectangles/polygons and the original image share one transformed wrapper in the existing `ZoomFigure`. Normalized coordinates remain aligned through zoom, pan, pinch, Fit, 1:1, resizing, rotation, and navigation. A six-pixel drag threshold separates reveals from gestures; double-clicking a mask cannot also zoom.
- Optional Identify accepts only preferred terms or curated synonyms after case/whitespace normalization. Assisted reveals never become correct answers. Session state resets per figure and does not write to stars, Notes, or Study Tools progress.
- The versioned sidecar loader validates geometry and publication states, pins each figure to its manifest SHA-256, and disables stale masks. Missing/invalid sidecars preserve normal Gallery inspection. Original schemaVersion 1 manifest fields, image/thumbnail bytes, asset paths, sources, and rights metadata remain unchanged.
- A lazy development-only curator loads existing annotations, draws/moves/resizes rectangles in image space, groups regions, edits terms/synonyms/colors/review concerns, previews opaque covers, deletes regions/answers, and imports/exports durable complete JSON collections. Source-changing edits invalidate review. Export is a browser download; there is no backend or server write endpoint. The editor waits for annotation loading before allowing edits and is absent from the production JavaScript bundle.
- Cover numbers compensate for image aspect ratio, and hidden accessible names/alt text do not announce answers. Existing dialog focus, navigation, zoom shortcuts, Details, Starred filtering, and preference persistence remain in place.

## Source review and final coverage

All 30 actual source images were inspected. Opaque-mask proofs for every playable figure were compared with the originals, including repeated answer occurrences. The user then identified three missing edge callouts: **Sublingual Salivary Gland** (a05), **Round Ligament** (a12), and **Cystic Duct** (a13). Those covers now extend to the existing source boundary; no source crop was changed. Tight text edges received a small safety margin during proof review.

| Measure | Final count |
| --- | ---: |
| Source figures inspected | 30 |
| Eligible figures | 28 |
| Playable figures | 24 |
| Complete eligible callout coverage | 23 |
| Partial playable figures | 1 |
| Review candidates without published masks | 4 |
| No useful printed labels | 2 |
| Verified answer groups | 272 |
| Opaque mask regions | 294 |

Immediately playable: **a02–a06, a08–a15, p01–p02, p05–p07, p09–p14**. p13 is explicitly partial, with four reviewed answer groups and a notice in the practice strip. a07, p03, p08, and p15 retain candidate status because their repeated terms, cropped text, or narrative layout require further coordinated curation. a01 and p04 remain ordinary images. General figure titles, copyright, molded model numbers, and unrelated narrative text are not quiz answers. The [coverage report](../gallery-label-practice-coverage.md) records every figure and its review notes.

## Accepted verification

| Check | Result |
| --- | --- |
| `npm.cmd run check` | Passed after final application changes |
| `npm.cmd run test:label-practice` | All 16 schema, source-asset, Gallery UI, Identify, missing/stale sidecar, star persistence, and storage-isolation tests passed with the final 272-answer data |
| `npm.cmd run audit:label-practice` | Passed: all 30 image hashes, annotation validity, and generated report freshness |
| `npm.cmd run build` | Passed with final data; existing scene chunk-size and Vite plugin-timing warnings remain |
| `npm.cmd run test:label-practice:browser` | Passed in local Chromium against built preview and development server: multiple aspect ratios, fit/zoom/actual-size/pan alignment, click versus drag, keyboard/list controls, details/stars/navigation/focus return, touch/pinch, 390px portrait and landscape rotation, requested a05/a12/a13 covers, production editor exclusion, and curator draw/move/resize/multiple-region/delete/synonym/preview/export/import workflow |
| Production editor code inspection | No curator strings or editor chunk in generated JavaScript |
| Source image and screenshot review | All playable mask proofs and browser screenshots inspected; only separate annotation metadata added to the public collection |

The first unprivileged esbuild test attempt failed on sandbox ancestor-directory access. The authorized run outside that filesystem restriction passed. Intermediate browser runs exposed test-driver timing issues (dialog exit transition and first Vite development compilation); the final run waits for those existing lifecycle steps and passes. These earlier attempts are not counted as accepted coverage.

The React review checked conditional editor loading, stable figure keys, functional immutable state updates, abortable loading, observer/listener cleanup, keyboard editing boundaries, hidden-answer accessibility, and shared ref-based transforms. No unrelated redesign or dependency addition is included.

Broader WebGL/Explore suites were not rerun because their code was not changed. Chromium touch emulation does not certify physical mobile devices, other browsers, or a screen reader. The visual transcription/masking review does not add independent clinical validation or rights clearance. Unfinished candidate figures remain deliberately unavailable for practice.

## Future annotation and review artifacts

Follow the [curator guide](../gallery-label-practice.md): open the imported figure in development, draw and label its covers, preview them, mark the answers/figure reviewed, export JSON, replace the subject's sidecar, reload Gallery, and run the focused audit/tests. No per-image application code is required. Export before closing or navigating away; curator drafts are not autosaved.

Ignored local review artifacts live in `work/label-practice/`: source contact sheets, review grids, mask proofs, browser screenshots, and the final browser report. They are not public assets or committed evidence packages. The committed metadata and reproducible scripts are the durable delivery.
