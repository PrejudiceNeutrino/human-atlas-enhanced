# Human Atlas Exam Cram — Final Editorial Package

This package supersedes `human-atlas-exam-cram-three-subjects-detailed-review.zip` for the **Digestive Detailed Review**. The previous 3,500-word Digestive draft was overexpanded. The corrected version has **2158 words in 15 sections**, close to the **~145 words per section** of the two other subjects. It keeps mechanisms and definitions without padding.

## Changes

- Digestive **Quick Scan**: unchanged, provided under `reference/` for checking.
- Digestive **Detailed Review**: rewritten tightly. Install `content/data/learn/digestive-system-exam-cram-detailed-review.json`.
- Respiratory and Lymphoid **Detailed Reviews**: preserved from the existing polished package without new changes. Install only if not already in HEAD or when there is a genuine editorial difference.
- Respiratory and Lymphoid **Quick Scans**: unchanged, provided only for reference.
- Study Tools (including all flashcards), Gallery, Notes and 3D: no changes. The separate longer-answer Digestive flashcard draft is deliberately NOT part of this package.

## Counts

| Subject | Detailed review sections | Approx. words | Words/section |
| --- | ---: | ---: | ---: |
| Digestive | 15 | 2158 | 144 |
| Respiratory | 18 | 2607 | 145 |
| Lymphoid | 18 | 2495 | 139 |

## Source/identity contract

The new Digestive detailed article preserves its stable `id`, every original section `id`, section order, `sourceFiles`, and per-section `slideReferences`. JSON structure matches current `EducationalArticleData`. The other two polished reviews preserve their original IDs and source metadata. Since text changes can affect Notes anchoring, test it conservatively; never erase user annotations.

The ZIP contains a compact offline HTML preview, readable Markdown copies, source/reference JSON, and a self-contained Codex prompt. No repo changes or deployments are included.
