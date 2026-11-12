# Human Atlas — Exam Cram Quick Scan + Detailed Review

**Scope:** New Quick Scan content for Respiratory and Lymphoid. The existing Exam Crams are carried in this package unchanged as the initial Detailed Review source.

**Editorial reference:** Digestive Exam Cram. Quick Scan uses dense, visually scannable **term: meaning** bullets, short ordered pathways, equations and high-yield contrasts. Detailed Review retains the original more explanatory articles and nuanced scientific qualifications.

## Files
- `respiratory-exam-cram-quick-scan.json` / `.md`: newly authored Quick Scan, 18 matching sections.
- `lymphoid-exam-cram-quick-scan.json` / `.md`: newly authored Quick Scan, 18 matching sections.
- `respiratory-detailed-original.json`, `lymphoid-detailed-original.json`: unmodified originals from the five-phase source archives. These are **not** proposed replacements.
- `exam-cram-modes-preview.html`: self-contained editorial comparison and notes export (open directly in browser).
- `manifest.json`, `validate.py`: mappings and validation.
- `codex-integration-instructions.txt`: implementation handoff.

## Integration rules
- Keep one `Exam Cram` top-level tab for each subject. Add `Quick Scan | Detailed Review` control within that tab.
- Preserve canonical article/tab IDs (`respiratory-system-exam-cram`, `lymphoid-system-exam-cram`) and **all 18 existing section IDs, headings, and source-slide metadata**.
- The Quick Scan JSON uses a separate variant ID ending `-quick-scan` and points to its detailed article through `variantOf`; do not register it as a new top-level Learn tab.
- Existing Detailed Review text/section IDs must remain byte-for-byte unchanged on initial integration; do not auto-summarize.
- Carefully handle Notes: existing Detailed Review annotation targets and text offsets must not change; Quick Scan needs distinct annotation-source IDs if highlighting is supported. Never anchor both modes to the same mutable source text. Existing Study Tools source links must continue to resolve to canonical Exam Cram article sections.
- Preserve the user's mode preference separately per subject; do not write notes or progress into the preference key.
- In Digestive, the current Exam Cram already serves as the intended Quick Scan reference. Do not fabricate a Digestive Detailed Review in this package.

## Scientific/editorial conventions
- Every Quick Scan statement comes from the authored Detailed Review or its supported lecture/study-guide framing; no extra research was added.
- Keep instructor-specific lists and the appropriate caveats where a shorthand could be misleading.
- Lymphoid B-cell differentiation hormone question remains unresolved because the supplied sources do not identify a single hormone; do not insert a guessed answer.
- This is an authored editorial version, not a comprehensive independent clinical/scientific peer review.

## Validation
Run `python validate.py`. The 18 section IDs, titles, source-slide metadata and original source-file lists match exactly, and every quick section has authored text. Review the complete content visually in the HTML preview before integration.
