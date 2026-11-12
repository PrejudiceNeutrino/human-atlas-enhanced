# Lymphoid System — Stage 3 editorial package

**Status:** Completed source-grounded drafts of **How It Connects**, **Who Cares?**, and **Exam Cram**, prepared for review. Not integrated into GitHub or the live Human Atlas website.

**Sources:** `22-Study Guide.docx` (28 objectives), `22-Lymphoid System-new.pptx` (51 slides), `Lymphoid - Copy.pptx` (20 slides), and the reviewed Stage 2 General Overview / Deep Dive drafts as supporting editorial context.

## Contents

- `lymphoid-system-how-it-connects.json` and `.md`: **10-section** first-principles narrative, *From a Scrape to Immune Memory*.
- `lymphoid-system-why-is-this-cool.json` and `.md`: **3** provocative introductory summaries with complete `More Info` explanations; the site tab is labeled **Who Cares?**.
- `lymphoid-system-exam-cram.json` and `.md`: **18-section** high-yield review covering all 28 guide objectives.
- `chapter22-stage3-exam-coverage.json`: Section-by-section mapping for all 28 study-guide questions, with an explicit instructor-clarification flag for SG-10.
- `lymphoid-stage3-preview.html`: Standalone offline review page with all three readings, working More Info expansion, section navigation, search and study-guide coverage.
- `scientific-review-notes.md`: Lecture limitations and scientifically important qualifications.
- `checksums.sha256`: Integrity hashes for the exported JSON and HTML.

## Style consistency with Digestive

- How It Connects is a chronological and mechanistic narrative, not an outline or article duplication.
- Who Cares? preserves the existing `id`, `title`, `sections[].summary`, `moreInfoLabel`, `moreInfoTitle`, and `moreInfoMarkdown` data contract used in Digestive's interesting-facts renderer.
- Exam Cram preserves the existing `id`, `title`, `subject`, `introMarkdown`, `sourceFiles`, and `sections[].id/title/markdown/slideReferences` contract used by the Digestive article renderer.
- Section IDs are deliberately stable for future Notes/Highlights source anchors; don't change them after publication without an annotation migration.

## Editorial cautions

The instructor's **six drainage inputs**, **three course-defined encapsulated organs**, **seven nonspecific defenses**, **four inflammatory signs** and **five immunoglobulin classes** are preserved. Scientific caveats are attached to simplified lecture descriptions; outside-context immunology is identifiable in Who Cares? The exact SG-10 B-cell hormone wording remains unresolved because the deck does not provide a definitive answer. This is an editorial draft, not an independent clinical/scientific audit.

**Next stage:** Prepare the concept and practice banks + four Study Tools experiences, with an interactive editorial preview, using these approved article IDs and slide references.
