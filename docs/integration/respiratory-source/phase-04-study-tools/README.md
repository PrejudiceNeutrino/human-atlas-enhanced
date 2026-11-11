# Respiratory System — Study Tools (Phase 4)

Author-reviewed draft for the Chapter 23 respiratory system educational subject. Built from the supplied instructor study guide, physiology lecture, anatomy/model lecture, and the complete Phase 2 and 3 articles. It is meant to be checked editorially before integration.

## Content

- **192** glossary concepts (`concepts.json`)
- **106** multiple-choice questions (`multiple-choice.json`), each with four options and an explanation
- **67** fill-in-the-blank exercises (`fill-in-the-blank.json`), accepted answers, hints, and explanations
- **114** flashcards (`flashcards.json`), including 84 conceptual/pathway cards and 30 targeted definition cards
- **14** shared study topics (`manifest.json`)
- **30** mapped study-guide items (29 numbered guide questions plus the terminology checklist)

The files use the same `schemaVersion: 1` record architecture as the previously implemented Digestive and Lymphoid study tools. Source article references resolve to the readings in Phase 2/3. The article JSON files are in the cumulative master ZIP.

## Offline review

Open `respiratory-study-tools-preview.html` directly. It embeds all records, so the four study activities and Editorial Review do not require a server. The Editorial Review tab can flag content and export feedback as JSON. `answer-key.md` offers a second way to inspect every authored question.

## Data integrity

Run `python validate.py` in this directory. It checks counts, IDs, topic identity, concept references, source-section links, answer choice data, fill-in placeholders, and study-guide mapping. This validates structure, not all educational claims.

## Codex integration

Import the JSON unchanged and implement the UI using the site's reusable Study Tools components. Do not embed the standalone preview as an iframe. The authoring convention keeps the correct MC option as `c1`; **shuffle displayed answers**. Respect the source references as contextual pointers; they are not quote-level proof. Keep study progress separate from private Highlights/Notes and from inline Study Mode exercise IDs unless exact shared IDs can be established.

## Source and nuance

Read `scientific-review-notes.md` for the CO₂/bicarbonate, oxygen saturation, pons labels, epithelium, and other distinctions. For every new study subject, content should be reviewed for correctness rather than accepted solely because it passes the data validator.
