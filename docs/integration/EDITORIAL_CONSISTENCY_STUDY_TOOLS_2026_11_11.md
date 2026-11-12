# Editorial consistency and Study Tools integration — November 11, 2026

The authored Respiratory and Lymphoid readings and targeted Study Tools revisions from `human-atlas-editorial-consistency-and-study-tools.zip` are integrated. Existing renderers, tabs, routes, Notes storage, progress stores, Gallery assets and Visualize components are retained.

## Content and reconciliation

All 16 packaged baseline reading/study files matched current local main at the parsed JSON level. Both Quick Scan files also matched the previously imported bytes. No newer local editorial revisions required reconciliation. All supplied `SHA256SUMS.txt` entries were checked before import. The archive hash, file inventory, installed-file hashes and protected-content hashes are recorded in `editorial-consistency-source/archive-inventory.json`.

Eight readings were replaced byte-for-byte from the package: General Overview, Deep Dive, How It Connects and Who Cares? for Respiratory and Lymphoid. All article/section IDs, titles, ordering, source files, slide references and other non-prose metadata are unchanged. No scientific content was generated or rewritten during integration.

| Subject | Overview sections | Deep Dive sections | Connected sections | Stories | MC records / revised | Flashcards / revised |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Digestive | unchanged | unchanged | unchanged | unchanged | 111 / 17 | 101 / 2 |
| Respiratory | 8 | 23 | 11 | 3 | 106 / 14 | 114 / 2 |
| Lymphoid | 8 | 19 | 10 | 3 | 104 / 22 | 117 / 2 |

The six complete MC/flashcard files are exact supplied replacements. Only the 53 listed distractor sets and six listed flashcards differ from the baselines. All IDs, MC correct-choice IDs/text, stems, explanations, topics, sources and references remain stable. The other Study Tools datasets and manifests are unchanged, as are all Digestive readings. The existing per-subject progress keys and progress-loading code were not modified or reset.

Packaged originals under `review-baseline/` are retained solely as review/test fixtures in this documentation directory; they are not imported into the app. Preview HTML, preview screenshots and readable Markdown remain in the ignored extraction directory `work/editorial-consistency-source/`. The supplied screenshots were inspected as editorial references. No preview UI was embedded or used to replace the site's readers or quizzes.

## Exam Cram and Notes

The previous dual-mode implementation is reused. Quick Scan is now the default when no valid explicit preference exists, including unavailable browser storage. Per-subject saved choices are still respected. Canonical bookmarks, Study Tools references and Detailed Review notes continue opening the original Detailed Review text.

Each subject still has one Exam Cram tab with 18 stable section destinations. The Quick Scan files were renamed to the package's `*-system-exam-cram-quick-scan.json` filenames; imports and integrity checks were updated. Their bytes and content IDs did not change, so existing Quick Scan note identities remain valid. Detailed Review files retain their existing repository bytes and canonical annotation sources.

Editorial prose changes use the existing conservative annotation resolver: uniquely and safely matched passages reanchor; passages that cannot be matched become **Unresolved highlight**, retaining their original excerpt and personal note. No Notes database is cleared or migrated. Users with notes on rewritten paragraphs may see unresolved records; stable section IDs alone do not guarantee text-offset recovery. The source-dataset tests exercise real baseline-to-revision heading reanchoring and changed-paragraph retention. Quick/Detailed note isolation and correct-mode reopening remain covered by the Exam Cram suite.

The updated Lymphoid fc-025 teaches the supplied B-cell/marrow and T-cell/thymus distinction. The unresolved instructor hormone question remains documented in the unchanged Detailed Review and curriculum sources. The previous test that required the retired flashcard wording was updated to the exact supplied revision and retained caveat.

## Validation

| Check | Result |
| --- | --- |
| Archive checksums and baseline comparison | Passed |
| `npm.cmd run test:editorial-content` | 6 passed |
| `npm.cmd run test:exam-cram` | 11 passed |
| `npm.cmd run check` | Passed |
| `npm.cmd run build` | Passed; Vite retains its large-chunk advisory |
| `npm.cmd run test:learn` | 27 passed |
| `npm.cmd run test:study-tools` | 22 passed |
| `npm.cmd run test:annotations` | 30 passed |
| `npm.cmd run test:respiratory` | 9 passed |
| `npm.cmd run test:lymphoid` | 9 passed after the obsolete flashcard assertion was updated |
| `git diff --check` | Passed |

Total final test coverage: 114 passing tests. Reading tests compare all rendered section text with the authored JSON; content checks preserve non-prose metadata and correct answers. Mode tests cover Quick Scan defaults, explicit preference persistence, canonical source links, section-position retention, refresh-equivalent remounting, isolated old/new notes and in-place mode restoration. Existing subject tests retain ordinary Gallery, context-menu and CPU Visualize behavior checks; they do not certify WebGL rendering.

Unavailable: live browser/viewport, touch, physical-device and screen-reader acceptance. The connected computer-use inventory exposes no browser or app. DOM accessibility checks exclude color-contrast measurement; supplied preview screenshots are not evidence of the integrated site's visual layout. No live deployment has been inspected or changed.

Implementation was prepared on `feature/editorial-consistency-study-tools` from local main. Delivery is a local commit on main, continuing the established local-only workflow. Nothing was pushed or deployed. The separate Gallery Label Practice feature commit is not part of this content update.

## Changed files

The complete tracked-file list is recorded below; Quick Scan removals/additions are unchanged-content renames.

- `.gitattributes`
- `app/learn/exam-cram-content.ts`
- `app/learn/exam-cram-mode.ts`
- `data/learn/digestive-study-tools/flashcards.json`
- `data/learn/digestive-study-tools/multiple-choice.json`
- `data/learn/lymphoid-study-tools/flashcards.json`
- `data/learn/lymphoid-study-tools/multiple-choice.json`
- `data/learn/lymphoid-system-deep-dive.json`
- `data/learn/lymphoid-system-exam-cram-quick-scan.json`
- `data/learn/lymphoid-system-general-overview.json`
- `data/learn/lymphoid-system-how-it-connects.json`
- `data/learn/lymphoid-system-why-is-this-cool.json`
- `data/learn/respiratory-study-tools/flashcards.json`
- `data/learn/respiratory-study-tools/multiple-choice.json`
- `data/learn/respiratory-system-deep-dive.json`
- `data/learn/respiratory-system-exam-cram-quick-scan.json`
- `data/learn/respiratory-system-general-overview.json`
- `data/learn/respiratory-system-how-it-connects.json`
- `data/learn/respiratory-system-why-is-this-cool.json`
- `docs/integration/EDITORIAL_CONSISTENCY_STUDY_TOOLS_2026_11_11.md`
- `docs/integration/editorial-consistency-source/CODEX-INTEGRATION-PROMPT.txt`
- `docs/integration/editorial-consistency-source/EDITORIAL-NOTES.md`
- `docs/integration/editorial-consistency-source/README.md`
- `docs/integration/editorial-consistency-source/SHA256SUMS.txt`
- `docs/integration/editorial-consistency-source/STUDY-TOOLS-CHANGELOG.json`
- `docs/integration/editorial-consistency-source/VALIDATION.json`
- `docs/integration/editorial-consistency-source/archive-inventory.json`
- `docs/integration/editorial-consistency-source/review-baseline/digestive/study-tools/flashcards.json`
- `docs/integration/editorial-consistency-source/review-baseline/digestive/study-tools/multiple-choice.json`
- `docs/integration/editorial-consistency-source/review-baseline/lymphoid/deep-dive.json`
- `docs/integration/editorial-consistency-source/review-baseline/lymphoid/exam-cram.json`
- `docs/integration/editorial-consistency-source/review-baseline/lymphoid/general-overview.json`
- `docs/integration/editorial-consistency-source/review-baseline/lymphoid/how-it-connects.json`
- `docs/integration/editorial-consistency-source/review-baseline/lymphoid/study-tools/flashcards.json`
- `docs/integration/editorial-consistency-source/review-baseline/lymphoid/study-tools/multiple-choice.json`
- `docs/integration/editorial-consistency-source/review-baseline/lymphoid/why-is-this-cool.json`
- `docs/integration/editorial-consistency-source/review-baseline/respiratory/deep-dive.json`
- `docs/integration/editorial-consistency-source/review-baseline/respiratory/exam-cram.json`
- `docs/integration/editorial-consistency-source/review-baseline/respiratory/general-overview.json`
- `docs/integration/editorial-consistency-source/review-baseline/respiratory/how-it-connects.json`
- `docs/integration/editorial-consistency-source/review-baseline/respiratory/study-tools/flashcards.json`
- `docs/integration/editorial-consistency-source/review-baseline/respiratory/study-tools/multiple-choice.json`
- `docs/integration/editorial-consistency-source/review-baseline/respiratory/why-is-this-cool.json`
- `package.json`
- `scripts/editorial-content.test.mjs`
- `scripts/exam-cram.test.mjs`
- `scripts/lymphoid.test.mjs`
- `scripts/respiratory.test.mjs`
- `scripts/study-tools.test.mjs`
