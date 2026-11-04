# Anatomical knowledge, phase 6 (pilot)

This is a **candidate editorial knowledge layer**, not an independent anatomical certification. It deliberately leaves source geometry manifests, names, canonical IDs, and identity crosswalks unchanged. It keys reviewed content candidates to source FMA concept IDs, with conservative system checking, so that the same anatomical concept can be presented across model representations. Where the inspector chooses a group of multiple meshes, never automatically treat the first mesh as the group's exact anatomy.

## Content fields and rules

Use lower-case ordinary English anatomical terms in sentences and display names, except the initial word and proper nouns. Latin fields and aliases are separately recorded and should be independently checked against the current FIPAT TA2 official term and any term-specific reference identifier before the status changes from candidate to reviewed. A descriptive Latin translation is not automatically an official TA2 term. Do not promote Latin terms in this pilot as verified TA2 terminology.

Provide a concise **summary** for the selection inspector and a longer **definition**, **hierarchy**, **function**, **relationships**, **development**, **clinical** notes and source evidence for teaching expansion. Muscles should get **origin**, **insertion**, **innervation**, **blood supply** and action. Ducts should get drainage paths and confluences; arteries supply territory and branches; veins drain territory; nerves get roots, course, branches, motor/sensory territory; bones get landmarks, articulations and muscle attachments. Do not fabricate irrelevant fields or assert a structure is missing biologically when geometry is unavailable.

Distinguish **anatomy fact**, **source label**, **candidate terminology**, **visual representation** and **editorial review status**. Individual references currently support broad teaching statements rather than line-item verification; all records need specialized references and review before being labeled reviewed. Preserve FMA granularity, left/right side and BodyParts3D source IDs. Distinguish anatomy of the organism from incompleteness or experimental fitting of the female study model.

## Baseline

The current viewer has 3,432 named male concepts associated with 2,234 male meshes, with additional female source/study concept inventories. The prior implementation in `app/anatomy.ts` contained 11 exact-name descriptions and otherwise used system-wide fallback explanations. Pilot records are in `data/anatomy/knowledge/pilot-v1.json`. A production roll-out should audit the full source-concept inventory, group aliases, and hierarchy relation tables before generating thousands of entries.

## References

- [IFAA / FIPAT Terminologia Anatomica](https://ifaa.net/committees/anatomical-terminology-fipat/fipat-ifaa-terminologies/) — official names, term hierarchy and naming conventions.
- [NCBI Bookshelf: Biliary ducts](https://www.ncbi.nlm.nih.gov/books/NBK459246/) — branching, confluences and clinical context.
- [BodyParts3D source](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html) — source mesh/concept mapping, not necessarily official naming.
- [Project provenance audit](../integration/PROVENANCE_AND_LICENSES.md) — licensing and knowledge-text restrictions.

## Next production batches

Verify concepts and IDs against full current manifests and canonical crosswalk, with explicit coverage reporting. Build record-specific citations and licensed evidence. Address equivalent grouped structures and non-FMA concepts. Review all Latin terminology term-by-term, audit lateralization and names, then grow system-by-system with independent clinical/anatomical review and regression tests.
