# Biology Exam 3 delivery · 2026-11-22

This handoff covers the changes since `d80874e`.

- Learn groups subjects under Anatomy and Biology in both the chooser and the landing page. The chooser updates in place, uses native radio controls, and gives the selected category a solid theme-colored fill. Anatomy retains Digestive, Respiratory, and Lymphoid.
- `/learn/biology-exam-3` uses the shared reading layout, navigation, section index, and Notes and Highlights. Its tabs are General Overview, Deep Dive, How It Connects, Who Cares?, Gallery, Exam Cram, Study Tools, and Campbell Extension.
- Twelve educational JSON files preserve the authored content and stable IDs. Who Cares? adapts the supplied groups to the existing fact renderer. Quick Scan and Detailed Review share section anchors and keep independent annotation identities. Campbell Extension has 17 sections and remains separate from the lecture-core review and activities.
- The lazy Biology Study Tools bank includes 140 glossary concepts, 105 multiple-choice questions, 75 fill-ins, 105 flashcards, and 15 topics. Progress uses the existing subject-scoped storage. Validation accepts the Biology article namespace and preserves case-sensitive genotype choices such as AA and aa. The authored distractors and answers are retained, including the documented editorial limitations.
- Biology Gallery remains selectable and displays “No images have been added yet.” Both the earlier folder-picker approach and the temporary bundled-image implementation were superseded. The Gallery manifest, images and thumbnails are absent from the project and build. Existing anatomy Galleries retain their established loading and Label Practice behavior.

## Files

- Learn registry, navigation and display in `app/learn/subjects.ts`, `subject-categories.tsx`, `subject-menu.tsx`, `subject-menu.css`, `page.tsx`, and `subject-tabs.tsx`.
- Reading and review registration in `app/learn/content.ts` and `exam-cram-content.ts`. Study registration and validation in `app/learn/study-tools/biology-data.ts`, `loader.tsx`, and `validation.ts`.
- Authored data in `data/learn/biology-exam-3-*.json` and `data/learn/biology-exam-3-study-tools/`, with byte-preservation rules in `.gitattributes`.
- Usage documentation in `docs/learn.md` and `docs/gallery.md`. Focused regression coverage in `scripts/learn.test.mjs`.

## Verification

The supplied ZIP validator passed before import, and the twelve educational JSON files matched the archive byte for byte. The final empty-Gallery revision passed the focused Biology Learn test and the production build. The built output was checked for the absence of Biology Gallery assets. On the preceding revision, TypeScript, three focused Learn tests, and desktop Chrome smoke coverage passed for category selection, routing, both Exam Cram modes, Study Tools counts, and Campbell Extension. The final empty state was verified by the focused test. Mobile and the full regression suite were outside the requested verification scope.
