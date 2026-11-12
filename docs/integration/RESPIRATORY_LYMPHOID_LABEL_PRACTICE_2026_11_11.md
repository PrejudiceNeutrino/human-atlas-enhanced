# Respiratory and Lymphoid Gallery Label Practice — November 11, 2026

Both public galleries now use the existing Digestive Label Practice viewer. Opening a reviewed figure exposes the Label Practice control; enabling it covers the printed answers with normalized SVG masks. Reveal/hide, grouped repeated terms, optional Identify, reset, label list, keyboard controls, zoom, navigation, Details and stars retain their existing behavior. Practice outcomes remain session-only and do not modify Study Tools progress.

| Subject | Gallery figures | Playable figures | Complete | Partial | Ordinary inspection only | Answers | Mask regions |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Respiratory | 29 | 24 | 11 | 13 | 5 | 230 | 262 |
| Lymphoid | 35 | 31 | 18 | 13 | 4 | 263 | 331 |

Every figure has an explicit coverage decision. See the [Respiratory report](../respiratory-gallery-label-practice-coverage.md) and [Lymphoid report](../lymphoid-gallery-label-practice-coverage.md) for the individual labels' scope and remaining source limitations. Partial figures show the existing coverage notice. Explanatory diagrams without suitable independent callouts remain ordinary Gallery images. Lymphoid p18 also retains its scientific qualification and is excluded from identification practice because the source classification is misleading.

## Annotation review

All 64 supplied figures were inspected. Local Windows OCR supplied draft word measurements; terms, wrapped lines, repeated occurrences and masks were then checked visually against source images. Opaque-mask proof sheets were reviewed and corrected, including manual measurements where OCR missed text or returned skewed bounds. Proofs and intermediate authoring files remain ignored under `work/new-gallery-labels/`.

The source WebPs and thumbnails were not edited or regenerated. Reading and study data, gallery manifests, descriptions, attribution metadata and scientific cautions were not changed. The public additions are two `label-practice.json` sidecars; `gallery.labelPractice` is enabled for both subjects in the registry. No duplicate viewer, external image host, authentication requirement or local production flag was introduced. The development curator remains available through the existing workflow and excluded from production.

Each annotation includes the original figure ID and image SHA-256. A changed image disables its masks until review. Removing an annotation affects only that figure's practice availability. When removing a figure from a Gallery manifest, remove its matching annotation entry too: the shared parser intentionally rejects unknown figure IDs. Use the [authoring guide](../gallery-label-practice.md) for later edits; text/geometry edits in the curator invalidate review until checked again.

## Validation

Passed:

- `npm.cmd run check` — TypeScript.
- `npm.cmd run test:label-practice` — 20 tests, including the unchanged Digestive Gallery behavior plus both new sidecars, complete source hashes, bounds/schema, accepted answers, missing individual annotations and stale-image isolation.
- `npm.cmd run test:respiratory` — 10 tests.
- `npm.cmd run test:lymphoid` — 10 tests.
- Both subject suites verify original archive byte fidelity, existing reading/study integration, actual Gallery controls, lazy annotation fetching, reveal/hide/reset, correct and incorrect typed answers, per-figure navigation reset, unchanged stars/study storage, explicit partial coverage and ordinary inspection for excluded figures.
- `npm.cmd run audit:label-practice` — Digestive coverage unchanged; both new reports current and source hashes valid.
- `npm.cmd run build` — production output includes both public sidecars. Vite reports the existing large-chunk advisory.
- `npm.cmd run test:respiratory-build` and `npm.cmd run test:lymphoid-build` — both routes and sidecars return HTTP 200 from a Vite production preview. Sidecar response bytes match their curated source files. All 128 full-resolution/thumbnail WebP responses match the original archive hashes.
- Source-image/opaque-mask proof review and `git diff --check`.

The first expanded integration test runs exposed test-harness assumptions: SVG covers require a dispatched click in JSDOM, and Identify must follow Reset Practice when earlier reveals marked answers assisted. Those fixtures were corrected; the final runs above pass. No runtime behavior was changed to satisfy them.

Not run: live browser rendering, touch/viewport acceptance, physical-device or screen-reader checks. The connected computer-use inventory exposes no browser or app in this session. Static proof review and JSDOM tests do not certify those behaviors. The existing Digestive Chromium smoke script remains available but was not run or presented as new-subject browser coverage.

This delivery is local on `feature/respiratory-lymphoid-label-practice`; no new main merge, remote push or public deployment was performed. Production-preview HTTP success does not claim the live deployed site has these new annotations yet.
