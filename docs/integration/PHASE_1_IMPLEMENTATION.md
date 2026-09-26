# Phase 1 implementation: core contracts

Phase 1 preserves the wiiiimm viewer and its `/male` and `/female` routes. It adds model identity, canonical anatomical IDs, model-bound mesh representations, a versioned crosswalk, a pure visibility decision, and validators. No donor feature, UI choice, clinical text or geometry was imported. The three existing manifests and binary chunks are unchanged.

## Model registry

`app/model-registry.ts` is the typed registry. Each record has model/frame ID, source datasets, model type, scientific status, systems, geometry set, manifest and mapping revision. `app/identity-contracts.ts` defines the interoperable types.

| Stable ID | Manifest | Route | Frame | Status |
|---|---|---|---|---|
| `bp3d-male-4` | `/models/atlas.json` | `/male` | `bp3d-male-4-stage` | BodyParts3D 4.0 reference |
| `hra-female-v1.5` | `/models/atlas-female.json` | Internal only | `hra-female-v1.5-stage` | HRA female reference, partial coverage |
| `female-study-v3` | `/models/atlas-female-reconstructed.json` | `/female` | `female-study-v3-stage` | Experimental study; independent anatomy review unresolved |

The study model has one composite geometry set because its BP3D-derived and HRA-derived parts are packed together in the existing chunks. The set records both source datasets; per-part provenance remains in the source manifest. `web/main.tsx` resolves only the two existing routes. HRA is registered and validated without a new public route or selector.

## Canonical identity and crosswalk

`public/identity/core-crosswalk-v1.json` pins opaque `atlas:concept:NNNNNN` IDs. They were assigned in a deterministic initial pass over source concept IDs, **never English names**. Future generation reads the pinned file and reuses existing IDs; new IDs append. Original `FMA*`, `HRA:*`, `PART_FJ*`, `FJ*`, and `VH*` values remain untouched. Typed external IDs distinguish FMA, UBERON, BP3D part, HRA node, Z-Anatomy, MVMT and other namespaces. `data/identity/phase-1-baseline.json` records the three manifest hashes and expected counts.

The initial crosswalk has **5,386 canonical concept records**, **8,753 model/source concept mappings**, **5,367 model-specific part representations**, and **74,630 concept-to-representation links** derived from existing manifest `Concept.elements` arrays. A representation ID includes its model ID and source part ID, and stores only an in-memory view of the source part's chunk/offsets, side, frame and geometry set. No buffer layout is copied into the sidecar. One concept may resolve to zero, one or many model representations. A request for the wrong model returns zero; there is no spatial fallback.

Male ↔ female study identity is reused only when the same source concept ID retains at least one `FJ*` part ID. HRA reference ↔ study identity is reused only when the same HRA concept ID retains at least one `VH*` part ID. **15 FMA IDs** occur in male and study manifests without a retained shared part. They remain separate canonical IDs with candidate/unresolved links in `data/identity/mapping-audit.json`; identical names never assert equivalence. These are technical source-continuity mappings, **not** independent scientific review. `PART_FJ*` source concepts remain distinct from FMA hierarchy concepts because their granularity differs.

`app/identity-index.ts` adapts the sidecar plus an active manifest into a model-specific resolver. Its representation links classify direct source-part relationships as `exact`, broader manifest membership as `part-of`, and the 15 unresolved mappings as `candidate`. The current search and inspector continue to show source names/IDs. Search groups that exist only in `app/anatomy-search.ts` keep their existing verified part lists; they are not silently promoted to anatomical concepts.

## Visibility and model switching

`app/visibility.ts` returns three separate booleans: `displayed`, `pickable`, and `packingEligible`. Current precedence is: unavailable/unloaded or explicitly hidden → off; isolation → selected only; ordinary system and future navigation/depth filters → off when excluded; selection may reveal a system/chest-hidden structure; chest tissue/cutaway/muscle rules then apply; context geometry may display but is not pickable or packed. User hidden state wins over selection, although Phase 1 exposes no hide action and leaves the future dimensions neutral. Existing transparent body-surface picking preference is represented by `hasSolid`.

`app/anatomy.ts` re-exports the existing `partIsVisible` entry point through the pure resolver. `app/page.tsx` loads manifest and crosswalk together into one model-scoped state object and selects manifest concepts through the new representation resolver. A model switch invalidates the old loaded pair immediately; `app/scene.tsx` is keyed by model ID and releases its old renderer/chunks. Counts still derive from the active manifest. Scene display, hit selection and exploded packing now consult the visibility contract, while tested legacy wheel anchoring retains its wrapper. Routes, controls and visual styling are unchanged.

## Validation and rollback

`scripts/generate-core-contracts.mjs --check` detects drift against pinned sidecar/snapshot; `--write` is an explicit reviewed regeneration step. `scripts/validate-core-contracts.mjs` checks registry/geometry frames, manifest and chunk references, missing/duplicate IDs, exact-mapping conflicts, namespaces, orphans and candidates. `scripts/core-contracts.test.mjs` tests positive resolution and deliberate corruptions. The app's existing manifests remain the rollback path: revert the Phase 1 code/sidecar commit to restore the original manifest fetch and visibility code. No binary rollback or data migration is needed.

## Deviations and remaining risks

The Phase 0 interface sketch placed full labels/content in `AnatomicalConcept`. Phase 1 stores identity and evidence only; names stay in the existing manifests until a later cited knowledge dataset exists. The composite female study geometry set records both input datasets because the current chunks mix them. The HRA reference remains internal by explicit Phase 1 instruction. The 15 candidate FMA mappings need anatomical review before consolidation. The female study remains scientifically unready; this refactor does not alter that conclusion. Browser smoke covered initial rendering and selected interactions, but complete manual anatomy review and touch-device review remain separate work.
