# Phase 3 implementation: canonical teaching areas

Implemented on `phase-3/teaching-areas`, starting from clean HEAD `521c86af9b24f461b4fad38727c38b452e29a0bc`, the reviewed Phase 2 endpoint also present on main. The required Phase 1/2 records and contracts were verified, and all integration records were read. No donor branch was merged or cherry-picked.

The hierarchy remains Body -> canonical Region(s) -> canonical Teaching Area(s) -> canonical Anatomical Concept(s) -> active-model Representation(s) -> Mesh. Teaching areas are educational collections, not ontology concepts, geometry IDs, or assertions of anatomical equivalence.

## Taxonomy and navigation affiliations

Every area ID below has the prefix `atlas:area:`. Every region suffix has the prefix `atlas:region:` and references the unchanged Phase 2 taxonomy. The first affiliation is the preferred context when the current region is incompatible; a compatible current region is retained.

| Canonical area suffix | Display name | Region affiliations, preferred first |
|---|---|---|
| orbit | Orbit | head-jaw |
| circle-of-willis | Circle of Willis | head-jaw |
| brainstem | Brainstem | head-jaw, cervical |
| larynx | Larynx | cervical |
| heart | Heart | thoracic |
| lung-roots | Lung roots | thoracic |
| porta-hepatis | Porta hepatis | lumbar |
| celiac-trunk | Celiac trunk | lumbar |
| kidneys | Kidneys | lumbar |
| brachial-plexus | Brachial plexus | shoulder, cervical |
| axilla | Axilla | shoulder |
| cubital-fossa | Cubital fossa | elbow-wrist |
| wrist | Wrist | elbow-wrist |
| hand | Hand | elbow-wrist |
| pelvic-viscera | Pelvic viscera | hip |
| popliteal-fossa | Popliteal fossa | knee |
| foot | Foot | ankle-foot |

Brainstem explicitly includes secondary Cervical navigation; this does not infer new broad-region anatomical membership. Brachial plexus is discoverable under both Shoulder and Cervical. The donor's six regions are preserved only inside frozen migration evidence, never exposed as a competing runtime taxonomy.

## Contracts and committed artifacts

`app/area-contracts.ts` defines `AreaId = atlas:area:${string}`, `TeachingArea`, `AreaMembership`, `AreaEvidence`, and `AreaDataset`. Definitions carry stable ID, display name, ordered region IDs, order, provenance, review and optional scope note. Memberships target only Phase 1 `CanonicalConceptId` values. Evidence retains the donor short area ID, typed BP3D part ID, exact source concept ID, source path, repository and revision. All definitions/memberships are `source-derived` candidates requiring anatomical review.

Runtime authority: `public/areas/canonical-areas-v1.json`, schema 1, revision `canonical-areas-v1`, identity revision `core-crosswalk-v1`, region revision `canonical-regions-v1`. It contains exactly 17 definitions and 616 explicit deduplicated memberships. It contains no name regexes, canonical coordinates, chunk memberships or donor classifier.

Offline evidence: `data/areas/pr1-seed-v1.json`. It freezes the exact donor anatomy source, all 17 rules with regex source/flags, original short IDs/display names/legacy affiliations, and hand/foot guard descriptions. It also retains the donor's 2,234 part IDs, names, source concept IDs and bounds, sorted by source part ID. These bounds exist only to reproduce the original hand/foot guards offline. The entire original classifier is evidence; it is not imported by application code.

Audit: `data/areas/area-audit-v1.json` records exact donor matches, guard exclusions, accepted mappings, unresolved matches, deduplication, concepts shared between areas, affiliation and independent per-model coverage, zero-geometry stations, canonical resolver expansion IDs and organ-area regional-evidence gaps.

## Frozen donor and reproducible migration

Authoritative donor: [PR #1 in ashemag/human-atlas](https://github.com/ashemag/human-atlas/pull/1), tag `donor/pr-1`, exact SHA `c9dfdcfe0ecd4aac5b71f8ab82ccd37301c775e0`, purpose “Add teaching-area stations under the regional clusters.” Inspected donor files: `app/anatomy.ts`, `app/page.tsx`, `app/scene.tsx`, `app/globals.css`, and `README.md`, including area selection/filtering, framing, UI and corridor note.

Pinned donor manifest SHA-256: `c359f4bcd2cba90b7411d66d5e9fc04dc81294d46cd5c1e8b212c824f2e5bbee`. Pinned anatomy source SHA-256: `fd8555870714f4cd75327d7cb8a7ab73cb7352a3a4e72934b277e3bd5a54e744`. Pinned compact part-evidence projection SHA-256: `b7667474e3ddc37ad397128cbf63a1c6cfa719fc70684b5556e351e5ef17225a`.

`scripts/area-generation.mjs` executes the checked-in, hash-pinned donor classifier **offline only**, using the original donor whole-body bounds. This preserves the exact regex and `partRegion()` guards for Hand and Foot without reimplementing their classification math. Canonical mapping then follows donor BP3D part ID -> current BP3D male representation -> unique most-specific accepted **exact** Phase 1 canonical concept. Specificity is the number of resolved representations; equal-specificity ambiguity, candidate links, missing representations or absent exact links are unresolved, never guessed. Mapping does not use names, bounds, FMA directly or chunk indices.

Several source part matches can support one area/concept record; all evidence is retained. There are 746 area/part matches, all accepted, reduced by 130 duplicate concept memberships to 616 area/concept records across 590 unique concepts. Twenty-six concepts belong to multiple stations. Unresolved count is zero in the current frozen inputs; the audit retains an explicit unresolved collection, and corruption tests simulate missing representations to prove unresolved accounting works.

The runtime Phase 1 resolver can expand a canonical concept to more representations than the donor regex selected. For example, Lung roots has 11 donor part matches but 187 male representations; Circle of Willis has 15 matches but 77 representations; Brachial plexus has 48 matches but 153 representations. These follow existing accepted source concept granularity and Phase 1 resolution, rather than a hidden donor-part restriction. Expansion IDs are explicit in the audit. This is a source limitation requiring anatomical review, not a claim that all expanded pieces independently satisfy the original rule or are equivalent to the station's focal entity.

Commands:

- `npm.cmd run generate:areas`: write runtime dataset and audit from committed evidence/identity/regions/manifests.
- `npm.cmd run check:areas`: regenerate in memory and compare committed outputs, normalizing checkout line endings only.
- `npm.cmd run validate:areas`: validate contracts, exact migration, complete audit and independent coverage.
- `npm.cmd run test:areas`: focused positive, composition and corruption tests.
- `node --experimental-strip-types scripts/generate-areas.mjs --freeze-source --write`: explicit source recapture from the pinned Git donor; ordinary generation/checks do not need Git tags or sibling checkouts.
- `npm.cmd run test:areas:browser`: reproducible production-preview browser smoke, configurable with `ATLAS_URL` and `CHROME_PATH`.

## Model-neutral API

`createAreaIndex(dataset, sidecar, regionDataset, identity)` in `app/areas.ts` provides `areas()`, `area(areaId)`, `areasForRegion(regionId)`, `conceptsForArea(areaId)`, `areasForConcept(conceptId)` and `representationsForArea(areaId, modelId)`. Whole body exposes every station. Representation resolution uses the bound Phase 1 identity index, deduplicates by representation ID and returns zero for another model. Missing geometry is valid. No male coordinates, name matching or spatial fallback fills HRA/study gaps.

## Visibility and composition

The existing `app/visibility.ts` remains the only visibility authority. Derived `areaPartIds` supplies membership through the reserved `areaMember` dimension. Scene display, picking and explosion eligibility continue to consume the same resolver; the renderer has no local teaching classifier. Renderer change detection includes area identity/masks so direct transitions inside the same region cannot retain stale GPU visibility.

Precedence: hidden/unloaded controls -> isolation -> explicit selection exception -> ordinary system + navigation + depth filters -> chest/breast rules -> context display/picking/packing rules. When no area is active, navigation means ordinary region membership. **When an area is active, navigation means area membership alone.** Its region is context, not an additional mask. This preserves legitimate organ/vessel station members omitted by Phase 2's incomplete organ-region evidence.

Systems constrain ordinary station pieces. Search outside a station can reveal selected exceptions without changing memberships. Isolate displays exactly the selection; clear selection returns to area + systems. Explosion packs the resolver's eligible station pieces plus selected exceptions. Existing chest behavior, hidden/loading reservations and unpickable/unpacked context semantics remain intact.

## Navigation, URL, UI and camera

`app/area-navigation.ts` extends the Phase 2 navigation helpers. Choosing a region clears area/masks/focus, selection/isolation, explosion and rotation while preserving system layers and chest behavior. Choosing an area does the same cleanup, preserves systems and retains a compatible region or chooses the first affiliation. Choosing None returns to the current regional view. Reset returns to Whole body, no area, model defaults and the existing reset semantics. Model switching preserves only valid canonical region/area navigation, clears model-specific IDs/masks/bounds/selection and independently re-resolves destination geometry.

URLs serialize only canonical `region` and `area` values, for example `/male?region=atlas%3Aregion%3Ashoulder&area=atlas%3Aarea%3Aaxilla`. Clean routes still mean Whole body + None; region-only links work; valid areas normalize incompatible/absent regions to their declared context; unknown areas clear safely; unknown regions fall back to Whole body. Reload and routed model switches retain canonical navigation. Reset removes both parameters. Unrelated query parameters survive. No mesh IDs or coordinates are serialized.

The existing model/region controls gain a compact native Teaching area selector with None. Regional choices expose only affiliated stations, including every affiliation for multi-region areas. Whole body exposes all 17. Native select labels, keyboard behavior, 44-pixel targets and constrained widths support accessible navigation. Active station caption/status is clear. Brachial plexus and pelvic-viscera scope notes preserve corridor/male-source limitations. Systems remains a separate Systems panel. The added selector row requires modest vertical layout clearance; mobile camera controls move below it, and the systems panel moves down on desktop. There is no broad redesign or lighting change.

Area focus unions only current-model Phase 1 resolved bounds using existing `regionBounds()`, then reuses the unchanged `fitRegionCamera()` corner-fitting math. Area focus takes priority over regional focus in assembled views. The mobile usable rectangle starts at 320 pixels to clear the extra selector/camera row; the ordinary region browser projection harness uses that same updated clearance. Portrait Whole body/inventory fitting reserves 500 rather than 440 pixels and uses a -70 rather than -40 vertical view offset to clear that row without covering the head. Existing fitting/interpolation formulas, orbit controls and isolate fit remain intact; desktop Whole body behavior is unchanged. Zero geometry gives null focus, usable existing body framing and a clear unavailable status, with no other-model substitute.

## Deliberate deviations, limitations and scope

PR #1 shorthand IDs remain provenance only. Its six regions, runtime regexes/spatial classification, button-grid UI and toggle behavior were not ported. Canonical station data drives the viewer while independent anatomical review remains pending. Brachial plexus is a corridor, not a claim of complete named trunks. Pelvic source rules are male-biased; study female-specific organs were not guessed into that station. HRA has zero accepted coverage for these seeded concepts. Existing compound source concepts can widen a station. Female scientific readiness remains false.

No hide/restore UI, rendering polish, dependency upgrade, nerve import, lazy/context loading, supplemental geometry, knowledge research or later-phase feature was begun. Phase 1 identity files, Phase 2 data and every model/binary remain unchanged.

## File inventory

Created (13): `app/area-contracts.ts`, `app/area-navigation.ts`, `app/areas.ts`; `public/areas/canonical-areas-v1.json`; `data/areas/pr1-seed-v1.json`, `data/areas/area-audit-v1.json`; `scripts/area-generation.mjs`, `scripts/generate-areas.mjs`, `scripts/validate-areas.mjs`, `scripts/areas.test.mjs`, `scripts/areas-browser-smoke.mjs`; `docs/integration/PHASE_3_IMPLEMENTATION.md`, `docs/integration/PHASE_3_VALIDATION.md`.

Modified (9): `app/anatomy.ts`, `app/globals.css`, `app/page.tsx`, `app/region-navigation.ts`, `app/scene.tsx`, `app/visibility.ts`, `web/main.tsx`, `package.json`, `scripts/regions-browser-smoke.mjs` (mobile camera projection clearance only).

Validation evidence and acceptance assessment are in `PHASE_3_VALIDATION.md`. Reverting this phase removes navigation/data/code without a geometry migration.
