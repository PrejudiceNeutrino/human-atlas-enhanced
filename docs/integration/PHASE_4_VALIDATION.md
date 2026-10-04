# Phase 4 validation record

The sections below retain the original implementation evidence through commit `890ebf3ab6cf0488b71714302a5f1c942a4438d9`. The labeled refinement section at the end records the current individual-list, shortcut and selection-tint validation.

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

The internal HRA has no new UI route; its hide behavior is model-bound unit coverage. Existing Phase 2/3 coverage gaps and source concept expansions remain unchanged. Restoring clears only the hidden override, so a piece excluded by another filter need not appear. Hidden interaction state is intentionally temporary; reload/model switch discards it. The original implementation added no undo history or hidden-item list; the refinement below adds the list. Anatomy/source-granularity, real-device touch and extended usability review remain recommended.

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

## Phase 4 refinement validation

Starting branch `phase-4/hide-restore` was clean at `890ebf3ab6cf0488b71714302a5f1c942a4438d9`; branch/status/log and the main-to-HEAD diff confirmed Phase 4 was committed and main was still at `401d187642dc07221d3cf3e130bc40e16ab720f6`. Current implementation modules and Phase 4 tests were inspected before editing. This validation applies to the focused refinement, not a new phase.

The existing hide/restore suite expands from 27 to **35 tests**. Added groups cover the A/B/C dissection stack with C/B/A presentation, middle-item restoration then C/A restoration, Restore all, exact one-ID removal, unchanged unrelated selection and camera/filter/explode fields, duplicate/order stability, eight-piece individual restoration, foreign/unknown list rejection, H/h using the same button action, no-selection and modifier/composition/repeat rejection, editable ancestors and unchanged slash registration. Shader checks verify full system-independent saturated tint differs from every existing system material, preserves the standard shading path, and uses no added postprocessing pipeline. Existing three-model safety, resolver exclusions, region/area/system composition, reset, model switch and female chest parity remain covered.

The existing Chrome harness retains every original Phase 4 scenario and adds actual screenshot pixel inspection, native keyboard events and a reversible dissection workflow for both routes at both viewport sizes. It checks normal versus selected pale shoulder bone, muscle, artery and vein pixels; multiple shaded colors; a selected clavicle beside ordinary ivory bones; and selected bone in the exploded inventory. GPU selection uploads confirm highlight cleanup when hidden and no auto-selection on individual restoration.

Shortcut checks type `h` in the real search field while anatomy remains selected, then exercise real input, textarea, select, inherited contenteditable and combobox/textbox/searchbox targets. Ctrl/Meta/Alt events do nothing, uppercase H and lowercase h hide, no-selection h does nothing, and native `/` still opens search. The A/B/C sequence uses right clavicle, left clavicle and right scapula, verifies C/B/A rows and zero hidden GPU visibility/offsets, restores B only, then restores C and A. The exploded variant verifies eligible-only offsets and unchanged camera after individual B restore; Restore all preserves the already selected unrelated piece.

The long-list case hides 83 heart representations and checks every row, bounded vertical scrolling, accessible names rather than internal IDs, 44-pixel individual restore targets, usable Systems scrolling and no horizontal overflow. Early browser development caught flex sizing that squeezed the hidden list, including insufficient row space beside female desktop chest controls. Scoped flex allocation, a full-row minimum viewport, 40 additional desktop pixels while hidden rows exist, and outer scrolling for shorter panels were corrected before the final run. The harness explicitly checks the hidden viewport itself, in addition to button dimensions. Bone screenshot candidates were restricted to physical shoulder bones so skeletal-system nonbone tissue cannot stand in for bone validation.

An initial mobile pointer-close setup step missed the inspector's moving button during its opening translation. Setup now invokes the existing Close button action directly and waits for popup removal before inspecting pixels, consistent with existing scripted panel setup. Real mesh picking, Hide and individual Restore still use native pointer events; H/h and typing use native keyboard events. No production animation or interaction workaround was added; only clean full browser reruns support acceptance. `SMOKE_QUICK=mobile` supports a focused male mobile development run; acceptance uses the full four-suite mode.

The final refinement again matches all 84 binary/compressed geometry hashes against the exact Phase 4 base and all three pinned manifest hashes above. Protected-path diff against `890ebf3ab6cf0488b71714302a5f1c942a4438d9` is empty for models, public/data identity, regions and areas, `package.json` and `package-lock.json`. No dependency, membership, scientific checklist or readiness validator changed. Evidence: `work/phase-4-refinement/integrity-report.json`.

Female readiness remains **`integrityPassed: true`, `ready: false`**, with expected exit 1. Refinement presentation digest: `bdc6d9dabdeae7ea1f849c53c2306f194d21ab3015e9c7905c6e05ad78a20876`. Scientific review, poses and named core/pelvic coverage gaps remain unresolved. The engineering refinement does not promote scientific readiness. HRA remains internal unit coverage; real touch-device gestures and extended anatomical/usability review remain outside these browser-width checks. Restoration may remain invisible under existing filters, and reload/model switch still discard temporary hides.

### Final regression and browser results

The complete 26-command Phase 4 suite was repeated against the final production revision. **All 25 technical commands pass**, including check/build, all atlas/interaction validators, Phase 1 contract/generation checks, Phase 2 region checks and four-suite smoke, Phase 3 area checks and four-suite smoke, coverage/joint/readiness/chest/category tests, and all 35 Phase 4 unit tests. The remaining scientific gate returns its required exit 1 with integrity true/readiness false. Build retains only its existing large-chunk warning. No checks were weakened.

Evidence: `work/phase-4-refinement/verified-0.log` through `verified-24.log`; the clean full final browser rerun is `accepted-hide-restore-browser.log`. Earlier browser setup failures remain in their original logs, with no acceptance attributed to them. `accepted-results.json` consolidates the 25 unchanged-production results and the final browser rerun, recording each source log. Copied region/area reports are `regions-browser-report.json` / `areas-browser-report.json`, each full mode with four suites and zero exceptions.

Final hide/restore browser report: `work/phase-4-refinement-browser/report.json`, **passed true, quick false, four suites, zero JavaScript exceptions**. Every original Phase 4 workflow and every refinement scenario passes for `/male` and `/female` at 1440 x 900 and 390 x 844. Final screenshot inspection confirms ivory-to-teal differentiation, varied surface shading, no stale tint after hiding, readable names/counts, accessible scrolling and restore controls, and no horizontal overflow. The female panel preserves its chest controls with both scrolling lists accessible.

Actual pixel evidence from final screenshots:

| Route / width | Selected isolated pale rib teal pixels | Selected clavicle among ivory bones | Selected exploded bone |
|---|---:|---:|---:|
| Male / 1440 | 19,431 | 359 | 389 |
| Female / 1440 | 19,260 | 329 | 194 |
| Male / 390 | 7,476 | 142 | 43 |
| Female / 390 | 7,768 | 133 | 41 |

Normal skeletal screenshots contain zero pixels matching the teal selection predicate. Muscle/artery/vein selected screenshots contain 4,156-36,546 teal pixels, compared with zero normally; selected surfaces retain 745-1,805 distinct shaded teal colors across the four tested systems. This measures actual lit output rather than relying only on shader text. Representative files beside the report: `male-1440-skeletal-selected.png`, `female-390-bone-assembled-selected.png`, `*-bone-exploded-selected.png`, `*-dissection-stack.png` and `*-many-hidden.png`.

| Refinement acceptance criteria | Final assessment |
|---|---|
| 1-6: RepresentationId authority, individual restore, Restore all, newest-first order and piece-by-piece rebuild | Satisfied by exact helpers, 35-test suite and C/B/A -> C/A -> zero browser workflow |
| 7-10: shared H/h action, typing/modifier safety and unchanged slash search | Satisfied by shared callback, guard tests and native browser keyboard/editable-target checks |
| 11-16: clear bone/all-system selection, cheap shader path and no stale tint/selection | Satisfied by every-system shader checks, bone/muscle/vessel pixels and GPU selection uploads; no added render passes |
| 17-24: hidden exclusion, region/area/system/explode/reset/model-switch/chest parity | Satisfied by existing resolver and complete Phase 1-4 regressions, per-cell GPU offsets, camera uniforms and female chest modes |
| 25-26: desktop/mobile smoke | Satisfied by all four clean final route/viewport suites and screenshot inspection |
| 27: model/data hashes | Satisfied by all 84 geometry comparisons, three pinned manifests, protected-path diff and frozen artifact checks |
| 28: documentation | Satisfied by labeled refinement sections in both existing Phase 4 records |
| 29: Phase 4.5 untouched | Satisfied by eight-file scope review; no navigation redesign, counts/default changes, lighting/background/tone/shadow changes, dependency/data changes or later content |

**Phase 4 including this refinement is fully accepted for engineering integration.** The branch is ready to merge Phase 4 and begin a separately scoped Phase 4.5 afterward, carrying the stated scientific/source and real-device limitations. This work does not merge main and does not start Phase 4.5.
