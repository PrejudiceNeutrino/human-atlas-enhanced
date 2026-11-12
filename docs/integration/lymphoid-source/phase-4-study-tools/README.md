# Lymphoid System and Immunity — Stage 4 Study Tools

**Status:** complete editorial draft; no GitHub modifications. Derived from the instructor's Chapter 22 study guide and two lecture decks, and the full Stage 2/3 authored Learn articles.

## Content counts

- **206** glossary concepts
- **104** curated multiple-choice questions (four choices with an explanation)
- **66** authored fill-in-the-blank questions (hints, accepted answers, explanations)
- **117** flashcards (conceptual and terminology)
- **13** topics, grouped to match Chapter 22

## Review

Open `lymphoid-study-tools-preview.html` locally (no server or internet required). Use its **Editorial Review** tab to filter every record, see correct answers without taking every quiz, and attach review comments. Export review notes as JSON before moving browsers; they are stored only in the current browser/device.

The actual practice interfaces also work offline: multiple-choice, fill-in-the-blank, glossary and flashcards. The HTML bundles a copy of the exact supplied JSON content. It is a preview, not production React code.

## Intended integration

The JSON top-level schema matches the Digestive Study Tools implementation: `schemaVersion`, `subjectId`, and arrays `concepts`, `questions`, `cards` respectively. `manifest.json` provides topics and file mapping. All IDs are stable and subject-scoped; if reusing runtime persistence, namespace progress by subject. Maintain existing Learn source IDs and subject route after registering Lymphoid. **Do not have Codex regenerate the educational content.**

Related Learn articles: `lymphoid-system-deep-dive`, `lymphoid-system-exam-cram` (from Stage 2/3). `source-section-index.json` allows external validators to resolve those references without requiring the original article files. `chapter22-study-guide-alignment.json` maps all 28 guide objectives to course topics/reading sections.

## Scientific/editorial boundary

Source references on individual records identify relevant Learn sections and the lecture slide ranges already recorded on those sections. Some mechanistic detail (high endothelial venules, M cells, thymic selection, immunoglobulin classes) reflects explanatory depth introduced in Deep Dive, not a claim of exact professor-slide wording.

One explicit unresolved instructor question asks what hormone stimulates B-cell differentiation. No particular hormone is specified unambiguously by the provided material. We did **not** invent a scored hormone question. A flashcard explains the ambiguity, and the coverage map flags it.

The instructor's useful conceptual sequence through the lymph node should not be mistaken for literal lymph traveling through B cells then T cells; the bank tests the physical sinuses. Simplified splenic blood pathways are labeled as lecture-level rather than a complete microcirculatory map.

This is a substantial reviewed-for-structure editorial draft, not an independent external textbook/medical peer review. Check instructor emphasis and answer acceptance before classroom release.
