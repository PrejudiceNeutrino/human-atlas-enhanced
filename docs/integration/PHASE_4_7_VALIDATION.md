# Phase 4.7 validation and handoff

Date: 2026-10-04. Starting Phase 4.6/main SHA: `6ef6570e6787da3fda4d314a0726e4257bc419b0`. Expected branch was clean and matched local and live remote main before implementation. Only `phase-4.7/area-granularity` is authorized for commit/push; main is not merged.

## All 17 old/new scoped counts

Counts derive from the unchanged committed Phase 3 audit and the new reproducible scope audit, not from the prompt or screenshot. Canonical Area membership remains 616 records across 590 concepts. All HRA old/new counts are zero, with no fabricated scopes. Female values are independently registered current-model source identities.

| Area | Canonical concepts | Donor parts | Male old | Male scoped | Removed | Study old | Study scoped |
|---|---:|---:|---:|---:|---:|---:|---:|
| Orbit | 74 | 81 | 81 | 81 | 0 | 81 | 81 |
| Circle of Willis | 14 | 15 | 77 | 15 | 62 | 77 | 15 |
| Brainstem | 14 | 19 | 19 | 19 | 0 | 19 | 19 |
| Larynx | 30 | 34 | 34 | 34 | 0 | 34 | 34 |
| Heart | 38 | 77 | 77 | 77 | 0 | 77 | 77 |
| Lung roots | 8 | 11 | 187 | 11 | 176 | 187 | 11 |
| Porta hepatis | 39 | 46 | 48 | 46 | 2 | 48 | 46 |
| Celiac trunk | 7 | 11 | 28 | 11 | 17 | 28 | 11 |
| Kidneys | 28 | 46 | 46 | 46 | 0 | 46 | 46 |
| Brachial plexus | 46 | 48 | 153 | 48 | 105 | 153 | 48 |
| Axilla | 30 | 32 | 32 | 32 | 0 | 32 | 32 |
| Cubital fossa | 20 | 20 | 20 | 20 | 0 | 20 | 20 |
| Wrist | 18 | 18 | 18 | 18 | 0 | 18 | 18 |
| Hand | 104 | 122 | 122 | 122 | 0 | 122 | 122 |
| Pelvic viscera | 11 | 11 | 11 | 11 | 0 | 2 | 2 |
| Popliteal fossa | 20 | 26 | 26 | 26 | 0 | 26 | 26 |
| Foot | 115 | 129 | 131 | 129 | 2 | 131 | 129 |

Six male Areas lose 364 unsupported concept-expanded representations in total across Area/representation pairs; overlaps between Areas are not counted as unique model anatomy. Eleven non-expanded Areas retain representation-identical geometry: Orbit, Brainstem, Larynx, Heart, Kidneys, Axilla, Cubital fossa, Wrist, Hand, Pelvic viscera and Popliteal fossa. All 17 male scopes reproduce the exact frozen donor sets, including original Hand/Foot guards.

## High-risk granularity analysis

The root cause in every case is complete resolution of a valid canonical source concept whose part set extends beyond the donor station selection. Concept memberships are preserved. These are source-fidelity corrections, and every station still needs independent anatomical review.

| Area | Old -> donor/new | Extra geometry removed | Expansion-bearing source concepts |
|---|---|---|---|
| Circle of Willis | 77 -> 15/15 | 62 arterial pieces outside donor set; cerebral/cerebellar/spinal branches remain searchable. | FMA3949, FMA3958, FMA4062, FMA4066, FMA50542 |
| Lung roots | 187 -> 11/11 | 91 arterial and 85 venous pieces; distal pulmonary segmental/basal/lobar branches outside donor set. | FMA49911, FMA49913, FMA49914, FMA49916, FMA50872, FMA50873 |
| Porta hepatis | 48 -> 46/46 | Two arterial pieces: Trunk of gastroduodenal artery and Right gastric artery. | FMA14771 |
| Celiac trunk | 28 -> 11/11 | 17 arterial pieces, including additional hepatic/caudate/segmental branches. | FMA14771, FMA14772, FMA50737 |
| Brachial plexus | 153 -> 48/48 | 105 arterial pieces beyond the source corridor, including distant vertebral-system branches; no nerves are added. | FMA3953, FMA3958, FMA4066, FMA4694 |
| Foot | 131 -> 129/129 | Two distal perforating arterial representations omitted by frozen donor match/guard evidence. | FMA43956 |

These source concepts can overlap; per-concept extra counts must not be summed without deduplication. Exact unique removed RepresentationIds/source IDs, existing labels and systems are in [`representation-scope-audit-v1.json`](../../data/areas/representation-scope-audit-v1.json), `rows` filtered by AreaId/ModelId. This audit enumerates all 176 male Lung roots removals; none are deleted from model geometry or identity.

### Lung roots hard regression

Both routed models have eleven scoped pieces, from eight unchanged canonical concepts. `Right anterior segmental artery` is verified against the audit as concept-expanded and not donor matched. The two male representations are `atlas:representation:bp3d-male-4:FJ2041` and `atlas:representation:bp3d-male-4:FJ2044`, with corresponding independently registered female-study IDs. Unit/browser checks exclude all of its source representations from ordinary Area geometry, reveal them through explicit search/selection, and remove them again when selection clears. Scope membership never mutates.

Actual scoped System inventory: respiratory 2, arterial 2, venous 7; all other Systems 0. Previous inventory was respiratory 2, arterial 93, venous 92. Status now reads `Lung roots · 11 area pieces · 11 visible` with default systems. Visible count still reflects filters/hides/selection rather than fixed scope size.

Scoped camera focus reuses existing bounds fitting. Final desktop/portrait captures show central main bronchi/root vessels without the distal concept-expanded tree; geometry is populated, legible and centered. Source evidence establishes membership, while appearance is only a rendering/framing check.

### Brachial plexus and non-expanded control

The station remains an incomplete-trunk corridor, with the existing scope note and Shoulder/Cervical affiliations. The 48 donor pieces remain: skeletal 2, muscular 8, arterial 26 and venous 12. Previously arterial inventory was 131, producing the 153-piece broad closure. No PR #283, MVMT or guessed named plexus trunks are imported. Heart remains exactly 77 scoped representations; baseline/final controls retain its geometry, framing and System inventory.

## Model safety and conservative coverage

| Model | Explicit scopes / available Areas | Retained donor Area/part matches | Missing matches |
|---|---:|---:|---:|
| `bp3d-male-4` | 17 / 17 | 746 | 0 |
| `hra-female-v1.5` | 0 / 0 | 0 | 746 |
| `female-study-v3` | 17 / 17 | 737 | 9 |

Female study uses its own RepresentationIds, registered exact BP3D source namespace/value/relation and current female bounds. The nine missing matches are `FJ3135` through `FJ3143` in Pelvic viscera; its two retained parts are the source-supported station. No female-specific replacements are inferred. HRA has no accepted source scope: all 17 are unavailable, with canonical semantic membership still accessible. Empty/absent scopes, unknown Area/model and foreign-model requests safely return zero geometry.

Contract/corruption tests reject invalid revisions/provenance/review, unknown Area/model/representation, foreign-model IDs, noncanonical encoding, duplicate scopes/representations and drift from exact generated source sets. A valid same-concept distal representation added to Lung roots is rejected by source-parity validation. Female negative fixtures reject absent representations, foreign model IDs, wrong source value/namespace and candidate identity without names/coordinates.

## Technical regression evidence

The complete technical runner executed 29 commands; 28 technical commands pass and scientific readiness returns its expected exit 1. Evidence: ignored `work/phase-4.7/technical-results.json` and `technical-0.log` through `technical-28.log`. Follow-up check/build/scope tests pass after the final validator encoding guard and additional corruption fixtures.

| Checks | Result |
|---|---|
| `npm.cmd run check`, `npm.cmd run build` | Pass; existing >500 kB JavaScript chunk warning |
| All three atlas validators; interaction and female-joint validators | Pass; model buffers/topology/morph evidence intact |
| Core identity tests/validator/generator check | Pass; all pinned identity contracts unchanged |
| Region tests/validator/generator check | Pass; Whole body/Region counts unchanged |
| Area tests/validator/generator check | Pass; 9 groups retain historical source/expansion evidence and verify scope display |
| Hide/restore, viewer polish and interaction/theme tests | Pass; existing 35 hide tests, 9 polish and 16 interaction/theme groups |
| New scope tests/check/validator | Pass; 8 focused test groups, deterministic sidecar/audit and all-model validation |
| Coverage, female readiness tests, chest/category tests, Python enhancement runner | Pass |
| Scientific female readiness | Expected integrityPassed true / ready false; no gate weakened |

Camera tests project all scoped bound corners into existing desktop/mobile usable rectangles for all four views, across all registered models. Organ regressions retain active-Area-over-Region precedence for Heart, Lung roots, Porta hepatis, Celiac trunk, Kidneys and Pelvic viscera; no Region-and-Area intersection is introduced. Shared visibility still controls display, picking and explosion eligibility.

## Browser and screenshot evidence

All six complete final production browser commands pass with zero JavaScript exceptions at `http://127.0.0.1:3027`, using isolated native GPU Chrome profiles. There are 28 final route/viewport suites. Sandboxed baseline Chrome could not start its GPU subprocesses; ordinary authorized process access resolved launch. No application workaround was introduced.

| Browser command | Full coverage | Result |
|---|---|---|
| `test:regions:browser` | 4 desktop/portrait suites, 20 Region combinations | Pass |
| `test:areas:browser` | 4 desktop/portrait suites, 32 Area combinations | Pass |
| `test:hide-restore:browser` | 4 desktop/portrait suites; all dissection/GPU/camera/chest regressions | Pass |
| `test:viewer-polish:browser` | 6 desktop/portrait/landscape suites; selectors, all 17 choices, counts | Pass |
| `test:viewer-interaction:browser` | 6 desktop/portrait/landscape suites; isolation drill-down, tabs, themes and chest | Pass |
| `test:area-scopes:browser` | 4 desktop/portrait suites, 44 scoped Area combinations | Pass |

The final scope harness additionally checks the exact real GPU membership mask for each ordinary station, not just counts. It verifies distal artery GPU visibility after selection and its absence after clear. Its clean final log is `work/phase-4.7/scope-browser-final.log`; accepted report is `area-scopes-accepted-report.json`. Existing-suite logs are `*-browser.log`, with accepted report copies and `accepted-browser-summary.json` under the same Phase 4.7 directory.

Every requested representative Area is covered on both routes at 1440 x 900 and 390 x 844: Orbit, Circle of Willis, Heart, Lung roots, Porta hepatis, Celiac trunk, Kidneys, Brachial plexus and Foot; Cubital fossa and Popliteal fossa add controls. Selector/interaction suites also pass 740 x 420 short landscape on both routes. The complete Phase 4.6 landscape suite now has a clean final pass, without any production theme/shell redesign.

Baseline captures used the unchanged Phase 4.6 production build before the final build. Evidence is under ignored `work/phase-4.7/baseline/`; final scope screenshots/report are under `work/phase-4.7/browser/`. These local artifacts are generated evidence, not runtime data, and can be reproduced with the committed harness.

For both routes at 1440 x 900 and 390 x 844, baseline/final captures exist for Circle of Willis, Lung roots, Celiac trunk, Brachial plexus, Heart and other representative stations. Representative filenames: `male-1440-lung-roots.png`, `male-390-lung-roots.png`, `female-1440-brachial-plexus.png`, `female-390-circle-of-willis.png`, `male-1440-celiac-trunk.png` and `female-1440-heart.png`. Baseline/final Willis, Lung roots, Celiac trunk, plexus and Heart controls were visually inspected; final Orbit, Porta hepatis, Kidneys and Foot desktop/portrait frames were also inspected; no clipping, empty station, stale distal tree or new layout overflow was found in inspected frames.

The new harness derives all expected geometry from explicit IDs and compares actual UI/GPU counts, contextual System rows and status. It projects current-model triangles for real mesh picks; exercises hide (H for Lung roots), individual Restore/Restore all, isolate/clear, explode, search exceptions, direct same-Region Area changes, Region navigation, URL/reload/reset and routed model switching. Numerical camera bounds and browser picking provide independent framing checks. Browser checks use emulated viewport sizes with native pointer/keyboard input; they do not claim physical touch-device testing or independent anatomical approval.

## Protected data and scientific status

All 150 protected tracked files, including 85 `.bin`/`.bin.gz` files, match the exact starting commit via Git-filter-aware blob hashes. Evidence: `work/phase-4.7/integrity-report.json`. Protected paths: public models/manifests/binaries, public/data identity, public/data Regions, canonical Area dataset, frozen Area seed/historical audit, scientific data/anatomy and package-lock. No dependency, geometry, model manifest, canonical affiliation or frozen evidence change. All generators/atlas validators independently pass.

Female readiness remains `integrityPassed: true`, `ready: false`; independent scientific review, pose evidence and named core/pelvic coverage gaps remain unresolved. Final recorded readiness digest: `c2ced4789ae2997106443298f10da7862fb9eb59ce8eed22671704ac4fa72a9e`. Source-derived scopes retain PR #1 heuristic limitations, incomplete plexus trunks and male-biased pelvic evidence. Engineering/source-parity acceptance does not certify female anatomy or clinical validity.

## Acceptance and handoff

| Phase 4.7 acceptance criteria | Result |
|---|---|
| 1-15: independent semantic/display authority, IDs, frozen deterministic provenance and no fallback | Satisfied by typed sidecar, contracts, generation and semantic/display tests |
| 16-24: six expansion fixes, exact distal exception and eleven parity controls | Satisfied by exact audit/set comparison and desktop/mobile GPU checks |
| 25-31: memberships, affiliations/menu, Area precedence, counts and camera | Satisfied; protected canonical data unchanged, all-model count/camera tests and browser checks pass |
| 32-35: exact female identity, model safety and conservative HRA | Satisfied; 17 independent study scopes, nine recorded gaps, no HRA scopes |
| 36-41: hide/restore/isolate/explode/tabs/themes/selector behavior | Satisfied by complete existing and new browser/unit suites |
| 42-46: geometry, manifests, identity, Region and frozen source integrity | Satisfied; 150 protected blobs identical and all validators/checks pass |
| 47-51: automated/browser/desktop/mobile/documentation | Satisfied; complete final suites pass and both integration records are complete |
| 52-55: integrity true / readiness false and no later anatomy/clinical work | Satisfied; readiness gate retained and scope reviewed |

All 55 Phase 4.7 acceptance criteria are satisfied within the stated responsive-browser/source-derived boundary. The granularity problem is structurally resolved: explicit model-specific IDs govern ordinary display independently of semantic concept closure. The repository is technically ready for a separately authorized next major anatomy/supplemental phase. Independent anatomical review and female scientific readiness remain unresolved; no later phase was begun. Only the Phase 4.7 branch is committed/pushed; no merge into main is performed.

## File inventory

Created (9):

- `app/area-scope-contracts.ts`
- `app/area-scopes.ts`
- `data/areas/representation-scope-audit-v1.json`
- `docs/integration/PHASE_4_7_IMPLEMENTATION.md`
- `docs/integration/PHASE_4_7_VALIDATION.md`
- `public/areas/area-representation-scopes-v1.json`
- `scripts/area-scopes-browser-smoke.mjs`
- `scripts/area-scopes.test.mjs`
- `scripts/generate-area-scopes.mjs`

Modified (10):

- `app/areas.ts`
- `app/page.tsx`
- `package.json`
- `scripts/area-generation.mjs`
- `scripts/areas-browser-smoke.mjs`
- `scripts/areas.test.mjs`
- `scripts/hide-restore-browser-smoke.mjs`
- `scripts/viewer-interaction.test.mjs`
- `scripts/viewer-polish-browser-smoke.mjs`
- `scripts/viewer-polish.test.mjs`

Only scope data, Area runtime/loading, historical audit API naming, relevant tests/browser harnesses and integration documentation change. Screenshot/test logs under ignored `work/phase-4.7` are local evidence.
