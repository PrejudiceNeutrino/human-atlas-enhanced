# Human Atlas — Respiratory System: Phase 2 (readings)

The eight-section **General Overview** (951 words approximately) and 23-section **Deep Dive** (7,918 words approximately) are complete drafts patterned after the Digestive System's article schema.

## Contents

- `respiratory-system-general-overview.json` and `.md` — accessible reading (8 sections).
- `respiratory-system-deep-dive.json` and `.md` — mechanism-rich detailed reading (23 sections).
- `respiratory-stage2-preview.html` — offline searchable reading and editorial review interface.
- `study-guide-stage2-coverage.json` — maps 29 guide questions plus 11 terms to actual section IDs.
- `scientific-review-notes.json` — the 15 Phase 1 scientific review issues.
- `manifest.json` — section and source metadata.
- `build_stage2.py` — reproducible packaging script.

## Source treatment

Authoritative course priorities come from the supplied Chapter 23 study guide and 42-slide physiology and 19-slide model lecture decks. The instructor's vocabulary is preserved, and additional physiological clarification is signposted as a distinction or extension. The slide-reference fields in JSON link to the lecture source context; they are not claims of exact quotation.

The site JSON follows the same keys as the existing Digestive System article files (`id`, `title`, `subject`, `subtitle`, `introMarkdown`, `sections` with `id`, `title`, `markdown`, `slideReferences`, and `sourceFiles`). No repository integration has been performed.

## Workflow

Phase 1 and Phase 2 are both included in the cumulative master ZIP. Phase 3 will add How It Connects, Who Cares?, and Exam Cram. Phase 4 will add Study Tools content. Phase 5 will add the WebP gallery and anatomical model audit.

## Scientific cautions

The major clarifications include: bicarbonate rather than carbonic acid as the major transported CO₂ product; actual venous blood is red rather than blue; specific roles of respiratory bronchioles, laryngeal protection, and brainstem networks; and proper use of Boyle's and Henry's laws.
