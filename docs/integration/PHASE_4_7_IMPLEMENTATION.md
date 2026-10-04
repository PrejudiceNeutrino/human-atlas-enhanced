# Phase 4.7 implementation: Teaching Area representation scoping

Started 2026-10-04 on clean `phase-4.7/area-granularity` at `6ef6570e6787da3fda4d314a0726e4257bc419b0`, the Phase 4.6 endpoint. Local main, origin/main and the live remote main/Phase 4.7 heads matched. Integration records and current identity, Area, Region, visibility, viewer and generation implementations were inspected. Phase 4.6 was accepted under its documented user waiver for unfinished final visual checks; this phase runs the existing browser regressions again.

## Root cause and independent authorities

Phase 3 canonical memberships correctly record educational relevance. Its display API resolved their complete Phase 1 concept closure. A source concept can contain many parts beyond the frozen donor station selection. Lung roots had eight semantic concepts, eleven matched parts and 187 resolved male representations. Identity resolution remains correct; display inclusion was too broad.

Canonical semantic authority remains the byte-identical `public/areas/canonical-areas-v1.json`: 17 stations, 616 memberships and 590 distinct concepts. Explicit display authority is now `public/areas/area-representation-scopes-v1.json`. No membership, affiliation or menu grouping changes.

## Contract and runtime behavior

`app/area-scope-contracts.ts` defines `AreaRepresentationScopeDataset` (schema 1, revision `area-representation-scopes-v1`, canonical Area/identity revisions, frozen donor metadata) and `AreaRepresentationScope` (AreaId, ModelId, explicit RepresentationId array, derivation method, provenance, source-derived review). Raw part IDs exist only in offline evidence/audit, never as runtime scope authority.

`app/area-scopes.ts` validates pinned dataset/Area/identity revisions and donor metadata; Area/model references; unique Area/model pairs and representations; canonical ID encoding; model partition; availability and existence in supplied model indexes; derivation and pinned provenance/review. Runtime validates the active loaded model; offline validation supplies all three registered indexes and also verifies exact generated artifacts. Empty scopes and absent scopes are valid conservative zero geometry.

`createAreaIndex(dataset, sidecar, regions, identity, scopes?)` preserves all semantic/navigation methods. `conceptsForArea()` is unchanged. `conceptRepresentationsForArea()` explicitly exposes historical semantic closure for audit/knowledge. `representationsForArea()` reads only the cached explicit scope, returns zero for unknown Area/model, foreign model or absent scope, and never calls concept resolution as fallback. Existing Phase 1 links/source-part metadata are attached to the explicit IDs during index construction; those links do not determine display inclusion.

The optional scopes argument supports semantic-only consumers and historical generation without silently restoring old display behavior. Phase 3 generator coverage/expansion/organ-gap calculations now explicitly use the semantic API; its generated canonical dataset and historical audit remain byte-identical. Older tests retain historical closure assertions and separately validate display counts from the scope sidecar.

## Reproducible frozen source derivation

Frozen donor: `donor/pr-1`, SHA `c9dfdcfe0ecd4aac5b71f8ab82ccd37301c775e0`, repository `https://github.com/ashemag/human-atlas`. Existing manifest/rule hashes, seed, exact matched part sets and accepted canonical mappings remain unchanged.

`scripts/generate-area-scopes.mjs` first verifies the existing frozen Phase 3 artifacts, then projects each committed audit match by exact registered source-part identity. It does not invent or rerun new classifiers, consult the screenshot, match names, trim bounds, test positions or fetch live anatomy. Existing offline Phase 3 verification still reproduces its hash-pinned original classifier/guards. Ordinary scope generation requires only committed evidence and current local manifests/identity; no Internet or donor checkout is needed.

| Model | Explicit scopes | Available Areas | Retained Area/part matches | Missing matches |
|---|---:|---:|---:|---:|
| `bp3d-male-4` | 17 | 17 | 746 | 0 |
| `hra-female-v1.5` | 0 | 0 | 0 | 746 |
| `female-study-v3` | 17 | 17 | 737 | 9 |

Male maps the exact frozen donor parts into male RepresentationIds. Every Area has source parity; no concept-expanded extra is added. Female study independently maps only exact retained BP3D source-part identity registered in its own model, using female-study RepresentationIds and its own geometry/bounds. All nine missing matches are male-specific pelvic-viscera parts `FJ3135` through `FJ3143`; female pelvic scope retains two donor-supported parts and adds no guessed female-specific anatomy. HRA receives no scopes; all 17 Areas return zero despite intact semantic membership.

`data/areas/representation-scope-audit-v1.json` contains 51 Area/model rows: semantic counts, donor matches, old closure/new scope/reduction, exact removed RepresentationIds and source IDs with existing names/systems for offline review, retained identities, missing parts with reasons, method, review, unresolved cases and model coverage. It preserves complete historical expansion evidence alongside the immutable Phase 3 audit.

Commands:

- `npm.cmd run generate:area-scopes`: write deterministic sidecar/audit.
- `npm.cmd run check:area-scopes`: regenerate and compare checkout-normalized exact output.
- `npm.cmd run validate:area-scopes`: validate contracts, full-model references, exact derivation and audit.
- `npm.cmd run test:area-scopes`: semantic/display separation, parity, corruption, provenance, identity safety, zero scope, composition and count tests.
- `npm.cmd run test:area-scopes:browser`: desktop/mobile current-model GPU, status/System counts, actual triangle selection, hide/restore, isolate, search exceptions, explode and navigation. `ATLAS_URL` selects a production preview; `SCOPE_OUTPUT` sets evidence location. `SCOPE_BASELINE=1` captures historical closure on an unchanged Phase 4.6 build.

## Visibility, camera and counts

`app/page.tsx` fetches the new scope sidecar with the existing manifest/identity/Region/Area datasets and passes it to the Area index. Existing Area resolution supplies scope-derived masks and camera bounds. Existing `scopeRepresentations()` supplies contextual System inventory. Status uses the same scoped Area length; visible count remains the composed shared visibility result. No additional scope implementation is added to scene, camera, hide/restore, isolate, explosion or themes.

Area scope replaces broad Region membership whenever an Area is active; Region remains navigation context. Search/selection can explicitly reveal outside-scope representations without modifying scope. Clearing selection returns to scoped ordinary geometry. Hidden/unloaded precedence, model-specific RepresentationId hiding, included-member isolation, eligible explosion packing, tabs, systems, reset and model switching retain existing behavior. Whole body and Region counts are unaffected.

Camera bounds union only scoped current-model geometry through existing `regionBounds()` and reuse unchanged `fitRegionCamera()` mechanics. Female study uses morphed female bounds. HRA/no scope has null Area focus and zero geometry; no fallback is fabricated.

## Scientific boundary and deliberate non-goals

All initial scopes remain `source-derived`. This fixes reproducible source fidelity and granularity; it does not independently validate PR #1 heuristics, completeness, clinical correctness or placement. Brachial plexus remains its existing corridor with incomplete named trunks; pelvic scope remains male-source evidence with female-specific membership pending. Female scientific readiness remains integrity true / ready false.

No geometry, manifests, canonical identity/Region/Area memberships, frozen evidence, themes, menu taxonomy or camera mechanics changed. No PR #283/MVMT nerves, Z-Anatomy, OMFAtlas, HRA upgrade, supplemental anatomy, knowledge, pathology or pharmacology work began. See `PHASE_4_7_VALIDATION.md` for counts, exact removal audit links, complete validation and handoff.
