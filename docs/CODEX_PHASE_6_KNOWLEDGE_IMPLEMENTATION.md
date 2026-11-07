# Codex implementation brief — Phase 6 anatomical knowledge POC v2

Work on the existing `phase-6/anatomical-knowledge` branch of `PrejudiceNeutrino/human-atlas-enhanced`, associated with draft pull request #1. Do not create a new independent anatomy database or rewrite the 3D system. Read `docs/anatomical-knowledge.md`, `docs/integration/DATA_MODEL.md`, `app/identity-index.ts`, `app/identity-contracts.ts`, `app/page.tsx`, `app/anatomy-discovery.ts`, `app/anatomy-search.ts`, `data/anatomy/knowledge/poc-v2.json`, and `app/anatomy-knowledge-v2.ts` first.

## Objective

Implement a working, polished, scientifically honest anatomy inspector that replaces the generic system-overview display for the **curated proof-of-concept records only**, without breaking existing viewer interactions. Use the canonical ID knowledge graph already committed to the branch. The user will inspect the result before scaling content creation. Preserve compact, readable presentation and useful navigation.

## Non-negotiable rules

1. All knowledge records, related anatomy, hierarchy, navigation and inheritance are keyed by `atlas:concept:...` IDs. The right hepatic biliary tree has source ID `FMA71857` → canonical ID `atlas:concept:002797`. Do not use name-based matching, lowercase-name lookup, first-mesh inheritance, or geometry part IDs as knowledge identity.
2. The active model's `IdentityIndex` is authoritative for any rendering, highlight, isolation, or selection. Do not use a female/male geometry fallback. A text-only concept must remain readable without 3D geometry.
3. Keep the existing source geometry manifests, core crosswalk, chunks and model selection behavior unchanged. The female study model remains marked experimental.
4. Keep original data fields and candidate scientific review statuses visible. No fictional precise citations, no unverified claim that Latin text has been officially TA2-reviewed, and no fake source-derived content.
5. Do not create thousands of generated descriptions now. Only implement/polish the POC, verifying it technically.
6. Clinical facts belong in a future separate dataset: leave `clinicalLinks` extensible but do not turn anatomical entries into treatment articles.

## Technical implementation

Build a small focused set of UI components around the graph in `app/anatomy-knowledge-v2.ts`. Extend types and selectors if needed, using strict TypeScript; handle `inheritsFrom` without dropping sided overrides or changing canonical identity. Show source name, candidate English display name, aliases, proposed Latin terminology (label clearly as unverified where applicable), summary, definition, kind-specific details, related anatomy, citations and review state. A muscle should show origins, insertions, action, innervation and arterial supply; a nerve roots, course and distribution; a bone landmarks, articulations and attachments; an artery origin, course and supplied territory; an organ internal organization and physiology; a duct drainage and branches; a group members. Hide irrelevant fields instead of displaying empty headings.

Add related-anatomy links for the graph's outgoing and incoming relations. Labels must be understandable (e.g. `innervated by`, `innervates` for the incoming nerve perspective) and must not imply an unverified inverse where none is defined. Link actions must resolve target IDs to active model representations; navigate to and visually select the actual concept if available, preserving existing isolation/selection/camera semantics where appropriate. If the target has no geometry, open a text-only inspector state without changing model or pointing at arbitrary neighboring geometry. Provide a clear return/back affordance. For a target with multiple represented pieces, select the appropriate complete concept, not an arbitrary single part.

Add a way to open knowledge-only records by canonical ID (at minimum through clicking related structure links). They may have no corresponding item in the active geometry manifest. In this POC the suprascapular nerve and rotator cuff group are intentionally text-only, with temporary prototype-reserved canonical IDs `atlas:concept:005387` and `atlas:concept:005388`. Do not insert them into the source mesh crosswalk or treat prototype IDs as permanent allocations. Document a future persistent identifier registry separately.

Provide a compact readable layout consistent with existing website styles, preferably responsive sections inside the current inspector instead of an enormous wall of unstyled prose. Treat the supplied supraspinatus example in `docs/anatomical-knowledge.md` as a content/UX reference, not literal copy. Keep name and concise definition above the fold; use legible field labels and clear related-structure links. Preserve accessibility: keyboard operability, focus management, reasonable click targets, semantic headings and screen-reader text for unavailable geometry.

For concepts lacking a curated knowledge record, keep the legacy system-level explanation as a clearly marked generic overview, not as the selected structure's expert-reviewed description. Search and Browse should use curated display names/aliases where canonical matches exist, without breaking source ID search or the generated scope indices. Do not globally change original mesh names.

## Required acceptance scenarios

- Select **right supraspinatus** and see its sided title, shared muscle attachments/actions/innervation, evidence/review status, and canonical links to the right scapula, right humerus, right suprascapular artery and suprascapular nerve.
- Click **suprascapular nerve** and get a navigable nerve inspector with **no 3D geometry in this model** messaging; incoming links include right supraspinatus and right infraspinatus; navigate back by clicking either.
- Click bone/artery links and observe appropriately specialized data fields. No origin/insertion muscle sections in a bone.
- Select **right hepatic biliary tree**, not a similarly named tributary, and display its true concept-specific bile drainage description. Follow its **right hepatic duct** then **common hepatic duct** links.
- Switch from male to experimental female study on a shared concept and confirm canonical knowledge persists while model-specific meshes and warning status behave correctly.
- Select ordinary uncovered anatomy and confirm existing functionality plus explicit generic fallback label.
- Test no-result, text-only, grouped concept, inherited laterality and missing/unresolved target cases.

## Validation and deliverables

Run `npm run test:knowledge-v2`, `npm run check`, `npm run build`, plus the relevant identity, search, discovery, selection, isolation and browser-smoke suites. Add automated regression tests for graph navigation, reverse links, text-only state and sourced fields, including a check that all link endpoints resolve. Existing tests should pass without weakening unrelated assertions. Report any tests not runnable, with reasons and exact errors; do not claim success without running them.

Provide an implementation summary, concise mapping of files changed, remaining scientific issues/unsupported claims, any source URL or licensing uncertainties, and a human test checklist. Leave draft PR #1 unmerged for review. No automatic production deploy, no changes to main.
