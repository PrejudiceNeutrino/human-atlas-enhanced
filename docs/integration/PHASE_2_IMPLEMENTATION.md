# Phase 2 implementation: canonical regions and regional navigation

Implemented on `phase-2/regions`, starting from the reviewed Phase 1 endpoint `af4b1b846bd0eba43fafc90bea30a61fad6c66a2`. The starting tree was clean; the Phase 1 implementation and validation records, core contracts, identity sidecar and baseline were present. All eleven existing integration documents were read before implementation. Phase 1 identity, the wiiiimm renderer, all three manifests, and all binary geometry remain the foundation. No teaching area or later-phase feature was started.

## Taxonomy and contracts

Exactly one broad-region taxonomy exists, in the versioned canonical dataset. `app/region-contracts.ts` defines `RegionId`, `Region`, `RegionMembership`, `RegionEvidence`, and `RegionDataset`, reusing Phase 1 canonical concept IDs, evidence and review contracts.

| Stable ID | Label | Order |
|---|---|---:|
| `atlas:region:body` | Whole body | 0 |
| `atlas:region:head-jaw` | Head & jaw | 1 |
| `atlas:region:cervical` | Cervical | 2 |
| `atlas:region:shoulder` | Shoulder | 3 |
| `atlas:region:elbow-wrist` | Elbow & wrist | 4 |
| `atlas:region:thoracic` | Thoracic | 5 |
| `atlas:region:lumbar` | Lumbar | 6 |
| `atlas:region:hip` | Hip | 7 |
| `atlas:region:knee` | Knee | 8 |
| `atlas:region:ankle-foot` | Ankle & foot | 9 |

Each broad region has Whole body as its parent. There are no left/right region duplicates. Laterality remains on Phase 1 representations. Whole body is a neutral navigation state, with no explicit membership rows: its API resolves all canonical concepts, deduplicates available representations, and the viewer leaves the regional mask unset.

## Explicit data and frozen donor evidence

- Runtime authority: `public/regions/canonical-regions-v1.json`, schema 1, revision `canonical-regions-v1`, identity revision `core-crosswalk-v1`.
- Reproducible minimal source evidence: `data/regions/mvmt-seed-v1.json`, containing source part IDs and the committed donor `region`/`spans` fields. It contains no bounds, chunk offsets or names.
- Structured coverage and unresolved audit: `data/regions/region-audit-v1.json`, including successful source-to-concept mappings, unresolved source records, per-region role counts, overlapping concepts and independent model coverage.
- Generator: `scripts/generate-regions.mjs`; `npm.cmd run generate:regions` explicitly writes these three artifacts, while `npm.cmd run check:regions` verifies them against the frozen tag. It never writes model manifests or binary data.

The donor is [calvinyu94-debug/mvmt-atlas](https://github.com/calvinyu94-debug/mvmt-atlas), local tag `donor/mvmt-base`, exact SHA `7c2ea6ee4fe0022085c692d1a8ff25f7d4482a50`. The frozen manifest SHA-256 is `2da8e462f4c202e1b7aac36f075e67ddad6d017cf713aad6e38e33c4d1c5d82f`. Inspected code: donor `app/anatomy.ts`, `app/page.tsx`, `app/scene.tsx`, `public/models/atlas.json`, `scripts/rechunk-bp3d.mjs` and README. This is technical provenance, without an additional licensing audit.

The mapping path is donor source part ID -> current BP3D male representation -> the most specific unique **exact** Phase 1 canonical relationship. Candidate, context and part-of relationships cannot seed a membership. If multiple equally specific exact concepts exist, the generator records the part as unresolved. Current evidence has one exact link per BP3D part, so no ambiguous regional mapping needs a guess. Display names, bounds and chunk indices never participate in the mapping.

`Part.region` becomes a `primary` membership; each additional `Part.spans` value becomes a `spanning` membership. Records are unique by region, canonical concept and role; multiple source parts may contribute evidence to one record. Every evidence item retains the donor repository, path and revision, typed BP3D source part ID, exact source concept ID, donor region ID and originating field. Every record is marked `source-derived`, with no claim of independent anatomical review.

All 3,764 donor parts are accounted for: 877 safely map; 1,357 current BP3D parts have no donor primary region evidence; 1,530 donor supplement parts have no current BP3D representation and are excluded. The latter two groups are preserved as 2,887 unresolved/not-seeded audit records. Among parts that have both current BP3D geometry and donor region evidence, the unresolved canonical-link count is **zero**. Organs and vessels remain Whole body anatomy until explicit regional evidence is provided; this phase does not place them by coordinates or names.

The donor generated primary assignments using source clinical assignments, overrides and landmark-weighted centroids. Its spanning evidence uses regional bone boxes and either centroid inclusion or at least 50% of triangles inside a region. We import the **frozen resulting evidence**, without running those heuristics again. These boundary choices still warrant scientific review, especially long bones, broad muscles and structures represented by compound source concepts.

## Model-neutral region API

`createRegionIndex(dataset, sidecar, identity)` in `app/regions.ts` exposes:

- `regions()` and `region(regionId)` for stable definitions;
- `conceptsForRegion(regionId)` and `regionsForConcept(conceptId)` for explicit canonical relationships;
- `representationsForRegion(regionId, modelId)` for deduplicated current-model geometry, resolved only through the existing Phase 1 `identity.resolve` API.

The index is bound to the active identity index. Requests for another model yield no representations. A missing canonical concept on a model is valid and counted as unavailable. Source concepts that represent several meshes retain Phase 1 resolution semantics; region membership does not create new mesh identities. The runtime loads only committed sidecars and the active manifest; it never reads Git tags or a sibling donor checkout.

The HRA reference has zero available representations for the seeded broad regions because Phase 1 has no accepted male-to-HRA canonical continuity for those concepts. It remains internally registered, with its full Whole body coverage of 888 pieces. The female study resolves its retained canonical concepts using its **own morphed geometry**; missing pelvic/lumbar concepts remain unavailable. Neither model receives guessed identity mappings or male geometry fallback.

## Viewer and visibility integration

`app/page.tsx` loads the region dataset alongside the existing identity sidecar and model manifest. One memoized resolution produces a transient current-model part-ID set and bounds. These are derived renderer inputs, not a second regional membership authority. `resolveVisibility` in `app/visibility.ts` feeds this set into the reserved `regionMember` decision. Display, picking, wheel anchors and explosion packing continue to consult the existing visibility resolver.

A compact, labeled native region selector fits beside the existing model choice on desktop and mobile, always exposes Whole body, supports keyboard/touch operation and shows the active region. Added CSS places the two selectors together and styles regional status, preserving existing camera-control placement and system-panel layout. The systems panel retains its full-model counts; the visible count is the actual composed result. Regional status reports available/visible pieces, unavailable geometry, or an empty system intersection. No exercise, patient-mode or external-parent behavior was copied.

Composition semantics:

| Action | Result |
|---|---|
| Choose a region | Preserve systems/chest view; clear selection and isolate; assemble explosion; stop rotation; frame the region. |
| Systems in a region | Intersect ordinary display with regional membership. The existing system actions clear selection/isolate. |
| Search selection | Explicit selected representations remain displayed, pickable and packing-eligible despite ordinary region/system exclusion. Canonical membership is unchanged. Isolate can frame an outside-region search result. |
| Mesh selection/inspector | Existing source names, IDs, inspector details and selection behavior remain. Visible regional geometry is pickable. |
| Isolate | Exactly the current selection, including selected exceptions outside the active region. |
| Clear selection | Exit isolation and return to the composed regional/system display. |
| Explode | Pack only the visibility resolver's eligible regional structures plus explicit selection exceptions. |
| Full reset | Whole body, default model systems, tissue chest view, assembled geometry, cleared selection/isolate, stopped rotation, three-quarter view and a new camera-reset counter. |
| Model switch | Retain only the canonical region ID; clear model-specific selection/masks/bounds and reset remaining viewer controls as before. Re-resolve the region in the new model's frame. |

The existing routed switch is a page navigation. A canonical `region` query parameter carries navigation between `/male` and `/female`; it contains no mesh IDs or coordinates. Region changes/reset update that parameter with `history.replaceState`, so reload after reset stays in Whole body. Unknown IDs normalize to Whole body after dataset validation. Clean `/male` and `/female` URLs still default to Whole body. No new route or HRA selector option was added.

## Camera and Whole body parity

`regionBounds()` unions active-model resolved representation bounds. `app/region-camera.ts` projects all eight bounding-box corners relative to the selected view direction and calculates a padded perspective fit inside the usable desktop/mobile rectangle. The scene applies that fit only to assembled regional navigation; existing isolate and exploded-inventory framing remain authoritative in those modes. On region changes, reset/view changes and resize, the focus uses the current model's bounds. Empty geometry returns null and retains normal, usable body framing with an unavailable message.

Whole body leaves both the regional mask and regional focus neutral. The previous camera fit, chunk loader, systems, search, inspector, isolation, explosion, breast/cutaway controls, presets, reproductive geometry and model-specific default counts remain unchanged. The model manifests and baseline hashes are unchanged. A pre-existing CRLF checkout issue in Phase 1 generation was corrected only in its comparison: `--check` normalizes line endings while still checking every other byte of generated content. No Phase 1 sidecar or baseline was regenerated.

## Deliberate MVMT deviations and future loading observations

This implementation uses full-detail existing manifests and fetches the existing 15/10/17 chunk sets. It does not port MVMT's renderer, overview meshes, chunk indices, classification overrides, supplemental geometry, clinical text or muscle depth features.

MVMT's `chunkKeysFor()` chooses regional BP3D/MVMT full-detail sets, optionally adding shared vessel/organ chunks; Whole body uses a decimated overview with the same source part IDs but separate buffer layouts. Its scene tracks absent/full-detail/overview/context states, deduplicates in-flight requests, disposes unwanted sets and prevents duplicate rendering of one part. `contextKeysFor()` requests explicit context copies after the region's own chunks finish loading. Context uses dim materials, no picking/packing, separate layouts and an exclusion cap for large neighboring parts with low in-region fractions.

These mechanisms inform a later loader adapter, not anatomical membership. Any optimization must retain canonical region semantics, use per-model representations and validate per-model overview/context geometry. Both regional lazy loading and contextual geometry are deferred. No explicit context relation was promoted; spanning members display as ordinary regional anatomy, not dim context. This separates **what belongs** from **how it loads**, preserves Whole body parity and avoids rechunking.

## Verification and handoff

See `PHASE_2_VALIDATION.md` for all test results, exact coverage and limitations. Phase 2 code/data can be rolled back without a geometry migration. Boundary review and missing cross-model identity evidence remain explicit follow-up work; no later phase is implemented here.

### File inventory

Created (13):

- `app/region-contracts.ts`, `app/regions.ts`, `app/region-navigation.ts`, `app/region-camera.ts`.
- `public/regions/canonical-regions-v1.json`, `data/regions/mvmt-seed-v1.json`, `data/regions/region-audit-v1.json`.
- `scripts/generate-regions.mjs`, `scripts/validate-regions.mjs`, `scripts/regions.test.mjs`, `scripts/regions-browser-smoke.mjs`.
- `docs/integration/PHASE_2_IMPLEMENTATION.md`, `docs/integration/PHASE_2_VALIDATION.md`.

Modified (8):

- `app/anatomy.ts`, `app/visibility.ts`, `app/page.tsx`, `app/scene.tsx`, `app/globals.css`.
- `web/main.tsx`, `package.json`, `scripts/generate-core-contracts.mjs`.

No model, binary, dependency-lockfile, scientific review or Phase 1 data artifact changed.
