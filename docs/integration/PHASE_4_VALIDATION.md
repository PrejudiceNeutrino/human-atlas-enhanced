# Phase 4 validation record

Validation date: 2026-10-03. Starting branch `phase-4/hide-restore` was clean at exact HEAD `401d187642dc07221d3cf3e130bc40e16ab720f6`. Required Phase 1-3 records, identity/visibility/navigation modules and reserved hidden-state field were present. Frozen `donor/pr-421` resolved to `3a5be52518c51eb7acaff892c42ce9eaedcbbd62` and its three-file implementation was inspected.

## Baseline and final regression commands

The 24 requested existing commands ran before implementation. All non-browser technical checks passed; scientific readiness deliberately returned exit 1 with integrity true and readiness false. Sandboxed Chromium GPU subprocesses failed for the initial region/area browser launches. Both complete browser suites then passed on rerun outside the filesystem sandbox against the unchanged baseline production build. This launch issue was environmental; no production code was changed to work around it.

Baseline evidence: ignored `work/phase-4/baseline-results.json`, `baseline-*.log`, `baseline-regions-browser-rerun.log`, `baseline-areas-browser-rerun.log`, and the separately copied baseline browser reports. The baseline build remained unchanged throughout its browser reruns.

Final evidence is captured in `work/phase-4/final-results.json` and `final-*.log`. Browser commands use local production preview `http://127.0.0.1:3021` with separate headless Chromium profiles and native GPU rendering outside the sandbox. No dependency upgrade or production test hook was required.

| Command | Final result |
|---|---|
| `npm.cmd run check` | Pass |
| `npm.cmd run build` | Pass; existing large-JavaScript-chunk warning only |
| `node scripts/validate-atlas.mjs` | Pass; 2,234 male buffers/mappings |
| `node scripts/validate-atlas.mjs atlas-female.json` | Pass; 888 internal HRA buffers |
| `node scripts/validate-atlas.mjs atlas-female-reconstructed.json` | Pass; 2,245 study buffers/topology/morph checks |
| `node scripts/validate-interactions.mjs` | Pass; all three models |
| `npm.cmd run test:viewer-enhancements` | Pass; 6 entries |
| `npm.cmd run test:core-contracts` | Pass; 6 groups |
| `npm.cmd run validate:core-contracts` | Pass; existing concepts, representations, links and unresolved candidates unchanged |
| `node --experimental-strip-types scripts/generate-core-contracts.mjs --check` | Pass; pinned identity artifacts unchanged |
| `npm.cmd run test:regions` | Pass; 7 groups |
| `npm.cmd run validate:regions` | Pass |
| `npm.cmd run check:regions` | Pass; frozen artifacts unchanged |
| `npm.cmd run test:regions:browser` | Pass; 4 full suites / 20 regional combinations |
| `npm.cmd run test:areas` | Pass; 9 groups |
| `npm.cmd run validate:areas` | Pass |
| `npm.cmd run check:areas` | Pass; frozen artifacts unchanged |
| `npm.cmd run test:areas:browser` | Pass; 4 full suites / 32 representative station combinations |
| `node scripts/validate-female-joint-additions.mjs` | Pass |
| `npm.cmd run test:coverage` | Pass; 5 tests |
| `npm.cmd run test:female-readiness` | Pass; 6 tests |
| `node scripts/chest-visibility.test.mjs` | Pass; 7 tests |
| `node scripts/female-category-toggle.test.mjs` | Pass; 6 tests |
| `npm.cmd run validate:female-readiness` | Expected exit 1; integrity true, readiness false |
| `npm.cmd run test:hide-restore` | Pass; 27 focused tests |
| `npm.cmd run test:hide-restore:browser` | Pass; 4 full route/viewport suites, zero JavaScript exceptions |

## Focused hide/restore coverage

The 27 tests in `scripts/hide-restore.test.mjs` cover every requested unit-level scenario: three-model RepresentationId isolation; no raw source/concept/name authority; exact single/multi-piece hiding; deduplication; display/pick/packing exclusion; hidden precedence over selection, isolation, navigation, depth, chest and context; atomic selected-only search restoration, including partly hidden groups and unrelated hidden pieces; override-only Restore; independent system toggling, Hide all, region and area navigation; reset/model-switch cleanup; visible counts without double subtraction; eligible-only packing cells; coincident source IDs in foreign models; malformed/unknown/encoded-alias negative IDs; study-to-male and male-to-HRA rejection; disappearance of outside-area selected exceptions; direct-selection validation; and preservation of camera/view/filter/explode state and canonical-only URLs.

Chest parity compares every study part across Tissue/Glands/Pectorals and selected/isolate states with the visibility resolver from the exact starting commit, then verifies hidden precedence for the HRA-derived study pieces. No scientific or geometry fixture was rewritten to make tests pass.

## Browser evidence and actual renderer checks

The new `scripts/hide-restore-browser-smoke.mjs` exercises `/male` and `/female` at 1440 x 900 and mobile width 390 x 844. Its test process intercepts real WebGL visibility/offset and selection texture uploads and camera uniforms, without adding application test hooks. It projects actual current-model triangle positions through the captured camera to make real pointer picks.

Final report: `work/phase-4-browser/report.json` with `passed: true`, `quick: false`, four route/viewport suites and zero JavaScript exceptions. Representative inspector, Restore and hidden exploded screenshots are stored beside the report and reviewed for clipping/overflow, control accessibility, stale highlights and packing. Desktop and mobile male/female screenshots show the existing inspector's scrolling content accommodates the additional action, Systems retains its scrollable list and fixed Restore/count controls, and the exploded inventory has no hidden-piece holes.

| Route | Viewport | Whole body visible | Heart selected pieces | Result |
|---|---|---:|---:|---|
| `/male` | 1440 x 900 | 2,229 | 83 | Pass |
| `/female` | 1440 x 900 | 2,239 | 83 | Pass |
| `/male` | 390 x 844 | 2,229 | 83 | Pass |
| `/female` | 390 x 844 | 2,239 | 83 | Pass |

Early development harness attempts exposed case differences between mesh/source-concept labels and a wait that expected repeated texture uploads after an immediate stationary layout update. The harness was corrected to normalize only test labels and compare actual offsets directly. These were test assumptions, not additional rendering rules. A clean full rerun of the final harness is retained in `work/phase-4/final-hide-restore-browser-rerun.log`; only clean full reports support acceptance.

For each suite the harness checks:

- A real single-mesh inspector action hides only that representation, closes the inspector, clears GPU highlight/hover, decrements the visible count and blocks a repeat pick of the hidden geometry. Restore returns it under the same filters.
- Heart search selects 83 pieces; hiding all produces the corresponding hidden count; search restores the whole group while an unrelated skeletal hide remains. A single member of that group is hidden separately and then restored by selecting the whole group again.
- Shoulder -> Whole body -> Shoulder preserves hiding. Disabling/re-enabling Skeleton preserves hiding; Restore with Skeleton disabled leaves zero displayed pieces until re-enabled.
- Heart -> Lung roots -> Heart preserves hiding. Brain is selected outside Heart as the existing search exception, then hidden; ordinary Heart visibility resumes with unchanged station identity.
- Isolate then hide returns ordinary area visibility and closes the inspector, with no empty isolate state.
- Hidden pieces receive exactly zero GPU visibility and offsets at 100% explosion. Every eligible piece's uploaded offset matches the unchanged packing algorithm run over eligible pieces only, with exactly one cell per eligible piece. Hiding another real mesh and restoring while already exploded rebuild both layouts correctly. Desktop hover is visible before hide and cleared afterward.
- Captured assembled and exploded camera view/projection matrices remain unchanged for ordinary hide/restore. Existing isolate-exit, slider-motion and navigation camera behavior remains covered by regression tests.
- Multiple hides followed by Reset restore Whole body/default systems/chest/assembled state. Routed male/female switching clears hiding while retaining canonical Heart/Thoracic navigation, including on switching back.
- Female Tissue/Glands/Pectorals compose with a hidden adipose representation; expected visible counts are 2,238 / 2,237 / 2,229. Restore in Pectorals preserves Pectorals and its ordinary 2,229 count.
- Hide all stays independent: restoring hidden pieces with all systems off keeps zero visible. Hidden state never enters the URL, and reload starts with no hides. Controls retain touch targets and there is no horizontal layout overflow or navigation/camera overlap.

The existing complete region and area smoke tests independently repeat Whole body, navigation, systems, actual mesh selection, search exceptions, isolate, explode, reset, model switching and female chest behavior. These checks validate responsive mobile widths and pointer/keyboard interaction; physical touch gestures still merit manual device testing.

## Geometry, canonical data and dependency integrity

All three manifest hashes match the unchanged Phase 1 baseline:

| Model | Parts / concepts / chunks | SHA-256 |
|---|---|---|
| `bp3d-male-4` | 2,234 / 3,432 / 15 | `c359f4bcd2cba90b7411d66d5e9fc04dc81294d46cd5c1e8b212c824f2e5bbee` |
| `hra-female-v1.5` | 888 / 1,073 / 10 | `1525c07d2ed46263c086d1c6b2e52eb9b8f8985746e9a8259036bd6e1d9a1ced` |
| `female-study-v3` | 2,245 / 4,248 / 17 | `8dbb477d6865f2e7cba968b76cf8ae86b1eac905105ae1195c1e78b2e2e65c09` |

An additional byte-level SHA-256 comparison of **all 84 tracked `.bin` / `.bin.gz` model geometry files** against Git blobs from the exact starting commit passed. Every raw and compressed baseline geometry file matched. The ignored `work/phase-4/integrity-report.json` records individual hashes and all three manifest hashes.

`git diff --exit-code 401d187642dc07221d3cf3e130bc40e16ab720f6 -- public/models public/identity data/identity public/regions data/regions public/areas data/areas package-lock.json` passes. Atlas buffer validators and canonical generation/check commands also pass. No manifest, binary, concept ID, identity link, region membership, area membership, fit report, scientific checklist or lockfile changed. Package metadata changes only add the two Phase 4 test commands. Browser network evidence requests only the existing baseline model chunks.

## Scientific status, limitations and acceptance

Female readiness remains **`integrityPassed: true`, `ready: false`**; the intentionally nonzero scientific gate is retained. Baseline digest: `fac6708860b3efbb15b81b1832b213a61f2768dc84c9367ab99072d121fd385e`. Final digest: `80bfa2c44431a7e3fe440eb4b1421489646b15e993128907eeddf93da7f6a7b8`. Presentation changes invalidate old scientific review evidence as designed; independent review, poses and named core/pelvic coverage remain unresolved. No readiness validator was weakened.

The internal HRA has no new UI route; its hide behavior is model-bound unit coverage. Existing Phase 2/3 coverage gaps and source concept expansions remain unchanged. Restoring clears only the hidden override, so a piece excluded by another filter need not appear. Hidden interaction state is intentionally temporary; reload/model switch discards it. No undo history or hidden-item list is added. Anatomy/source-granularity, real-device touch and extended usability review remain recommended.

| Acceptance criteria | Assessment |
|---|---|
| 1-2: RepresentationId authority and transient source mapping | Satisfied by typed state, exact identity reverse lookup and three-model/negative tests |
| 3-5: donor-style controls and selection/isolate/inspector cleanup | Satisfied by UI and actual pointer/GPU smoke |
| 6-9: no display, picking, packing or stale hover | Satisfied by shared resolver and actual GPU, repeat-pick and hover checks |
| 10-14: multi-piece selection, deduplication, selected-only restoration and filter preservation | Satisfied by focused tests and full/partial search browser cases |
| 15-20: system/region/area persistence, unchanged station semantics, model-safe switch and Reset | Satisfied by state helpers and both routed browser suites |
| 21-23: independent Hide all, actual counts and eligible-only exploded cells | Satisfied by UI/GPU parity, disabled-system Restore and per-cell offset comparison |
| 24-28: camera, chest, Whole body, Regions and Teaching Areas | Satisfied by camera-uniform checks, chest parity and existing complete browser regressions |
| 29-32: model/identity/region/area integrity | Satisfied by frozen hashes, all 84 binary comparisons, buffer validators, generation checks and protected-path diff |
| 33-35: automated tests, browser smoke and documentation | Satisfied; all 25 technical commands pass, plus the expected nonzero scientific gate |
| 36-37: no rendering polish or later phase | Satisfied by final scope/diff review |

Phase 4 engineering acceptance criteria are satisfied. The repository is ready for the separately scoped rendering-polish pass, carrying forward the existing scientific/source-coverage limitations. Rendering polish and every Phase 5/later feature remain untouched.
