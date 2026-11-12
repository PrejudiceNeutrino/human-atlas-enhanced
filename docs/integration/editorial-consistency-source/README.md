# Human Atlas — Editorial Consistency Pass (Respiratory, Lymphoid, and Study Tools)

This is a **Codex-ready replacement-content package**, prepared against the current Human Atlas multi-subject reading/study-tool schema. It is not a standalone site, and it has **not** been committed to GitHub.

## Review first

Open `previews/readings-comparison.html` to compare the original and revised reading content, section by section. It also compares the new Respiratory and Lymphoid **Quick Scan** text with the current **Detailed Review** text. Open `previews/study-tools-comparison.html` for every changed multiple-choice distractor and flashcard.

Both previews are self-contained HTML and can be opened without a server, provided your browser permits local files. The study preview only shows **changed** records.

## Apply via Codex

Send Codex this ZIP together with `CODEX-INTEGRATION-PROMPT.txt`, which is already included in the archive. Only the files inside `data/learn/` should be installed as content. The `review-baseline/` directory is **for comparison or rollback only**. The previews are not the application's UI.

## What changed

### Revised readings

Respiratory: `general-overview`, `deep-dive`, `how-it-connects`, `why-is-this-cool`.

Lymphoid: `general-overview`, `deep-dive`, `how-it-connects`, `why-is-this-cool`.

The two existing `exam-cram.json` articles are included unchanged as **Detailed Review**. Two independently authored `exam-cram-quick-scan.json` articles are included for the additional **Quick Scan** mode.

General Overviews are shorter and structured like Digestive, with direct terms, concise pathways, and fewer early tangents. Deep Dives retain their mechanisms, scientific qualifications, and completeness but no longer repeatedly tell the reader what the slides/professor say. How It Connects keeps the science and narration, reduces heavy bolding, and improves paragraph rhythm. Who Cares? retains the hooks and expanded mechanisms while removing editorial attribution and restoring science-focused conclusions.

**All existing article IDs, section IDs, section order, and slide references are preserved.** Some paragraphs have changed, so previously stored text-offset annotations should be tested and reanchored where possible; this is not guaranteed by matching section IDs alone.

### Targeted Study Tools revisions

The complete `multiple-choice.json` and `flashcards.json` are supplied for each subject. The **correct answer IDs, correct choice text, question stems, explanations, topics, source references, item IDs, and record counts are unchanged**. Only 53 multiple-choice records have more plausible wrong answers, and six flashcard records have more direct student-facing prompts and/or answers. These are **targeted** repairs, not an independent item-by-item scientific re-verification of all 1,433 Study Tools records. The glossary and fill-in-the-blank datasets remain unchanged; they did not exhibit the same editorial problem.

| Subject | Multiple choice revised | Flashcards revised |
|---|---:|---:|
| Digestive | 17 | 2 |
| Respiratory | 14 | 2 |
| Lymphoid | 22 | 2 |

### Excluded from this revision

No gallery assets, image manifests, anatomical meshes/references, Study Tools component code, actual UI components, or original lecture files have been altered. Public gallery deployment behavior is unchanged. Digestive's existing concise Exam Cram stays untouched; no new Detailed Review for Digestive is invented.

## Integrity

`VALIDATION.json` records structural checks against the original source content. `STUDY-TOOLS-CHANGELOG.json` provides an exact before/after view of every changed question or flashcard. The checks validate identity, references, answer IDs, and shapes; they are not a claim that the integrated website has been smoke-tested.

The source readings were the previously completed Respiratory Phase 5 and Lymphoid Phases 1–5 packages used for integration. If the GitHub `main` branch has received later editorial changes, Codex must reconcile them, not blindly overwrite them. The original detailed Exam Cram content is included exactly as previously authored.
