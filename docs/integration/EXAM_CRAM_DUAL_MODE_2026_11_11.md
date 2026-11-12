# Exam Cram reading modes — November 11, 2026

Respiratory and Lymphoid each retain their existing Exam Cram tab and now offer **Quick Scan | Detailed Review** inside the article. Quick Scan uses all 18 supplied sections, in order, with the exact authored Markdown. Detailed Review uses the original canonical article without modifying its JSON. Digestive remains single-mode and unchanged.

The two imported Quick Scan JSON files are byte-for-byte copies from `human-atlas-exam-cram-dual-mode-content.zip`. Its Detailed Review copies matched the canonical repository files by SHA-256, so they were not copied over them. The package README, instructions and manifest are archived in `exam-cram-source/`, alongside a complete file inventory and archive hash. The editorial HTML preview and other extraction files remain under ignored `work/exam-cram-source/`.

## Reading, navigation and Notes

- Native radio controls provide named, keyboard-accessible mode choices. Styling uses the existing theme/palette tokens, visible focus, compact Quick Scan spacing and a narrow-screen layout.
- Detailed Review is the safe default. An explicit choice is remembered per subject in `human-atlas-exam-cram:v1:<subject>`, separately from Notes, stars and Study Tools progress. Invalid or unavailable storage cannot prevent reading; a failed save displays a session-only notice.
- Canonical article, section, TOC and top-level tab IDs stay unchanged. Only one mode is mounted, preventing duplicate IDs. Switching modes preserves the visible section's offset when practical. Existing internal TOC navigation keeps the selected mode.
- Canonical bookmarks and Study Tools source links open Detailed Review, including when Quick Scan is the saved preference. A source jump does not overwrite that preference.
- Quick Scan supports Highlights and Notes through distinct `*-exam-cram-quick-scan/<section>` sources. Its records retain the canonical tab ID and use the existing Notes storage/export format. Reopening a note selects its recorded source's mode, including in-place revisits.
- Detailed Review source IDs, title/body blocks, fingerprints and offsets remain unchanged. Existing notes are not migrated, deleted or rewritten. Quick Scan notes never reuse detailed text offsets. The Notes catalog identifies Quick Scan records as `Exam Cram · Quick Scan`.

No science content was generated or revised. The supplied qualifications, including the unresolved Lymphoid B-cell hormone question, remain intact.

## Files

- `app/learn/exam-cram-content.ts` — authored variant registry, separate from top-level articles/tabs.
- `app/learn/exam-cram-mode.ts` — versioned per-subject preference and safe fallback.
- `app/learn/exam-cram-article.tsx` — mode controls and section-position retention.
- `app/learn/educational-article.tsx` — optional header controls and canonical DOM anchors separate from content identity.
- `app/learn/subject-tabs.tsx` — variant rendering, canonical reference handling and Notes mode restoration.
- `app/learn/learn.css` — themed segmented controls and responsive spacing.
- `app/notes/annotation-content.ts`, `app/notes/annotation-model.ts` — independent Quick Scan sources and reading-mode metadata.
- `data/learn/respiratory-exam-cram-quick-scan.json`, `data/learn/lymphoid-exam-cram-quick-scan.json` — exact imported content.
- `.gitattributes` — preserve the imported JSON and source-package bytes across checkouts.
- `scripts/exam-cram.test.mjs`, `package.json` — multi-subject regression checks and `test:exam-cram` command.
- `docs/integration/exam-cram-source/{README.md,manifest.json,codex-integration-instructions.txt,archive-inventory.json}` — package provenance and requirements.
- This handoff.

## Validation boundary

Before the user requested no further testing, TypeScript passed, the supplied content validator passed for both subjects, the new Exam Cram suite passed 11 tests, and the existing Learn (27), Notes (30), Respiratory (10) and Lymphoid (10) suites passed. Already-running context-menu (8) and Study Tools (22) suites also completed successfully. The new suite checked complete rendered text, source hashes, 18 matching section headings/slide references, mode changes, scoped preferences, source-link navigation, old/new annotation isolation and reopening, DOM accessibility, and native radio semantics. Its first run required scoping a mobile-index assertion to Exam Cram because the established facts panel remains mounted while hidden; the corrected run passed.

The user then explicitly waived further testing. No production build or live browser/layout acceptance was performed for this delivery. The connected computer-use inventory also exposed no browser or app. DOM checks do not certify real arrow-key behavior, mobile rendering, color contrast or screen-reader operation. Two additional test assertions for section-offset retention and in-place cross-mode note revisits were added after the last Exam Cram run and were not rerun following that waiver. No runtime edits followed that successful run.

The user requested a local commit on `main`. Only this Exam Cram change is included; the earlier Label Practice commit remains preserved on its feature branch. No push or deployment is included. The validation above ran before switching branches; further testing and the production build were waived by the user.
