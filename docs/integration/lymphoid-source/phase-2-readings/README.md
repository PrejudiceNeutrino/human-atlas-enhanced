# Lymphoid System — Stage 2 editorial handoff

**Status:** Complete drafts of General Overview and Deep Dive. Not integrated into the website.

**Source basis:** `22-Study Guide.docx` (28 questions), `22-Lymphoid System-new.pptx` (51 slides), and `Lymphoid - Copy.pptx` (20 slides).

**Writing model:** Existing Digestive System General Overview and Deep Dive. Identical JSON fields (`id`, `title`, `subject`, `introMarkdown`, `sourceFiles`, `sections[]` with `id/title/markdown/slideReferences`).

## Deliverables

- `lymphoid-system-general-overview.json`: **8 sections**, approximately **987 words**, introductory and readable.
- `lymphoid-system-deep-dive.json`: **19 sections**, approximately **7,843 words**, explanatory and instructor-aligned, including anatomy/model terminology and scientific qualifications.
- Matching `.md` files for human editorial review.
- `chapter22-study-guide-coverage.json`: **28/28 mapped** study-guide prompts, with article-section cross-links and lecture slide numbers. A mapping means the topic is addressed, not that every answer is fully settled by the slides.
- `lymphoid-stage2-preview.html`: standalone offline preview with article navigation, search, study-guide coverage, and the scientific review queue.
- `checksums.sha256`: integrity hashes for the exported datasets.

## Editorial approach

- Instructor-specific lists have been retained: three primary encapsulated organs **as taught**, six contributions to the thoracic/cisterna chyli drainage schematic, seven nonspecific defenses, four signs of inflammation, and the five immunoglobulin classes.
- Where the course abbreviates a mechanism, the article explains the distinction: lymph flows through **node sinuses**, not literally B then T cell compartments; MHC I does not automatically mark cells abnormal; antibody binding does not itself always destroy pathogens.
- Modern context not explicit in the slide decks is clearly presented as additional scientific background when relevant, such as germinal-center affinity maturation, NK granzyme activity, endothelial glycocalyx, and passive antibody subclasses.
- The guide's **B-cell hormone** question cannot be definitively answered from these files; it remains a named instructor clarification issue.
- Raw instructor slides are not embedded in these reading packages. Gallery curation remains a later stage.

## Validation

- Both JSON files parse; section counts and section IDs exactly match the approved Stage 1 blueprint.
- All retained slide references are within the 51-slide and 20-slide source decks.
- All 28 study-guide objectives have at least one article destination in the mapping.
- Notes highlight anchoring should not be enabled until a new subject is registered and the canonical article content is approved. Treat the source text and IDs as stable after approval.

**Future stages:** 3. How It Connects / Who Cares? / Exam Cram; 4. Study Tools data/preview; 5. Gallery curation and 3D reference proposal; 6–9 Codex integration and review.
