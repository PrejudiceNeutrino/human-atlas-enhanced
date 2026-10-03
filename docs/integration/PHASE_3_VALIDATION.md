# Phase 3 validation record

Validation date: 2026-10-03. Starting branch `phase-3/teaching-areas` was clean at `521c86af9b24f461b4fad38727c38b452e29a0bc`, also the reviewed Phase 2 endpoint on main. Phase 1/2 required contracts, data and implementation/validation records were present. The exact frozen PR #1 donor/tag was verified before implementation.

## Automated checks

All 19 requested baseline commands ran before implementation and again against the final application. Every technical check passed. The scientific female-readiness command deliberately returned exit 1 both times with `integrityPassed: true`, `ready: false`. It was not weakened. All three new area technical commands also passed after the final audit update.

| Command | Final result |
|---|---|
| `npm.cmd run check` | Pass |
| `npm.cmd run build` | Pass; existing large JavaScript chunk warning only |
| `node scripts/validate-atlas.mjs` | Pass; all male buffers |
| `node scripts/validate-atlas.mjs atlas-female.json` | Pass; all internal HRA buffers |
| `node scripts/validate-atlas.mjs atlas-female-reconstructed.json` | Pass; study buffers, source topology and recorded morph checks |
| `node scripts/validate-interactions.mjs` | Pass; all three models |
| `npm.cmd run test:viewer-enhancements` | Pass; 6 test entries |
| `npm.cmd run test:core-contracts` | Pass; 6 groups |
| `npm.cmd run validate:core-contracts` | Pass; existing identity counts/candidates unchanged |
| `node --experimental-strip-types scripts/generate-core-contracts.mjs --check` | Pass; unchanged committed artifacts |
| `npm.cmd run test:regions` | Pass; 7 groups including frozen Phase 1 Whole body parity |
| `npm.cmd run validate:regions` | Pass |
| `npm.cmd run check:regions` | Pass; unchanged region artifacts |
| `node scripts/validate-female-joint-additions.mjs` | Pass |
| `npm.cmd run test:coverage` | Pass; 5 tests |
| `npm.cmd run test:female-readiness` | Pass; 6 tests |
| `node scripts/chest-visibility.test.mjs` | Pass; 7 tests |
| `node scripts/female-category-toggle.test.mjs` | Pass; 6 tests |
| `npm.cmd run validate:female-readiness` | Expected exit 1; integrity true, readiness false |
| `npm.cmd run test:areas` | Pass; 9 focused groups |
| `npm.cmd run validate:areas` | Pass; exact migration, provenance and audit/coverage |
| `npm.cmd run check:areas` | Pass; deterministic committed output |
| `npm.cmd run test:areas:browser` | Pass; full final production build, 4 suites / 32 representative area combinations |
| `npm.cmd run test:regions:browser` | Pass; 4 suites / 20 ordinary regional combinations |

Final command evidence is under ignored `work/phase-3/final-results.json` and `final-*.log`; pre-implementation evidence is `baseline-results.json` and `baseline.log`. Browser report/screenshot locations are below. These generated local logs are reproducible and are not additional runtime authorities.

The nine area groups verify exactly 17 unique canonical IDs/nonempty names, valid affiliations/concepts, no duplicate memberships, pinned evidence, exact donor source/part projection and matched-part reproduction, original hand/foot guards, deduplication, no runtime membership classifier, name-independent resolution, all six model-neutral API operations, independent coverage and foreign-model rejection, current-model bounds, zero geometry, systems/search/selection/isolate/clear-selection/explode composition, hidden/loading/context precedence, organ-area precedence over absent regional evidence, deterministic region/area/None/reset/switch cleanup, URL parsing/persistence/normalization and corner camera fitting for every area/model/view at desktop/mobile sizes. Corruption fixtures reject unknown/malformed IDs, missing evidence, changed revisions, guessed source links, missing/changed model audit coverage and changed frozen source. A simulated absent-male-representation fixture records all 746 matches as unresolved, creates no guessed membership and rejects deletion from that unresolved audit.

The initial scientific readiness digest was `c73d8dfa5e67678722152b977b5136d1c523949ed118270d019ab202770a7f22`; the final digest is `fac6708860b3efbb15b81b1832b213a61f2768dc84c9367ab99072d121fd385e`. The presentation change invalidates old review evidence as intended. Independent review, pose evidence and named core/pelvic coverage gaps remain unresolved.

## Taxonomy, membership and independent representation coverage

There are **17 areas**, **616 explicit canonical area/concept memberships**, **590 distinct canonical concepts**, **746 donor area/part matches**, **130 deduplicated memberships**, **0 unresolved mappings**, and **26 concepts shared across multiple areas**. Every station examines the same **2,234 frozen donor BP3D parts**. Region suffixes below refer to existing `atlas:region:*` IDs; canonical area suffixes refer to `atlas:area:*` IDs.

Representation columns are independent Phase 1 resolver results, deduplicated by model-specific representation ID. They are not female counts inferred from male bounds or names.

| Area (canonical suffix) | Regions, preferred first | Memberships | Donor matches | Male representations | HRA representations | Study representations |
|---|---|---:|---:|---:|---:|---:|
| Orbit (`orbit`) | head-jaw | 74 | 81 | 81 | 0 | 81 |
| Circle of Willis (`circle-of-willis`) | head-jaw | 14 | 15 | 77 | 0 | 77 |
| Brainstem (`brainstem`) | head-jaw, cervical | 14 | 19 | 19 | 0 | 19 |
| Larynx (`larynx`) | cervical | 30 | 34 | 34 | 0 | 34 |
| Heart (`heart`) | thoracic | 38 | 77 | 77 | 0 | 77 |
| Lung roots (`lung-roots`) | thoracic | 8 | 11 | 187 | 0 | 187 |
| Porta hepatis (`porta-hepatis`) | lumbar | 39 | 46 | 48 | 0 | 48 |
| Celiac trunk (`celiac-trunk`) | lumbar | 7 | 11 | 28 | 0 | 28 |
| Kidneys (`kidneys`) | lumbar | 28 | 46 | 46 | 0 | 46 |
| Brachial plexus (`brachial-plexus`) | shoulder, cervical | 46 | 48 | 153 | 0 | 153 |
| Axilla (`axilla`) | shoulder | 30 | 32 | 32 | 0 | 32 |
| Cubital fossa (`cubital-fossa`) | elbow-wrist | 20 | 20 | 20 | 0 | 20 |
| Wrist (`wrist`) | elbow-wrist | 18 | 18 | 18 | 0 | 18 |
| Hand (`hand`) | elbow-wrist | 104 | 122 | 122 | 0 | 122 |
| Pelvic viscera (`pelvic-viscera`) | hip | 11 | 11 | 11 | 0 | 2 |
| Popliteal fossa (`popliteal-fossa`) | knee | 20 | 26 | 26 | 0 | 26 |
| Foot (`foot`) | ankle-foot | 115 | 129 | 131 | 0 | 131 |

Zero-geometry areas by model: **male: none; study: none; HRA: all 17**. The internal HRA collection has no accepted identity links for the male-seeded station concepts; it receives no guessed or spatial fallback. Study Pelvic viscera resolves 2 of its 11 canonical concepts, with 9 unavailable. Other study stations resolve every seeded concept. The area API's foreign-model requests return empty arrays even when two models retain the same BP3D source ID.

All 26 shared concepts and their area IDs are individually listed in `data/areas/area-audit-v1.json`. They occur across Axilla/Brachial plexus, Willis/Brachial plexus and Celiac trunk/Porta hepatis. This sharing is educational membership and does not assert that two station entities are anatomically equivalent.

## Organ-area regression

The targeted male tests enable each station's represented systems and assert display, pickability and packing eligibility for every station representation, including those absent from its associated broad region. The shared resolver ignores region exclusion while an area is active. Every row passes.

| Station | Total area representations | Area representations absent from associated Phase 2 region | Result |
|---|---:|---:|---|
| Heart | 77 | 72 | Pass |
| Lung roots | 187 | 187 | Pass |
| Porta hepatis | 48 | 48 | Pass |
| Celiac trunk | 28 | 28 | Pass |
| Kidneys | 46 | 46 | Pass |
| Pelvic viscera | 11 | 11 | Pass |

An accidental `regionMember && areaMember` would eliminate all ordinary pieces in five rows and most Heart pieces. The test explicitly supplies `regionMember: false` for missing-region pieces and verifies they remain displayed/pickable/packing-eligible. Browser Heart, Porta hepatis and Kidneys also confirm actual rendered visibility. Direct Heart -> Lung roots transitions check GPU-mask updates within one unchanged regional context.

## Baseline hashes and geometry status

The unchanged Phase 1 baseline records these manifest fingerprints and counts:

| Model | Parts / concepts / chunks | SHA-256 |
|---|---|---|
| `bp3d-male-4` | 2,234 / 3,432 / 15 | `c359f4bcd2cba90b7411d66d5e9fc04dc81294d46cd5c1e8b212c824f2e5bbee` |
| `hra-female-v1.5` | 888 / 1,073 / 10 | `1525c07d2ed46263c086d1c6b2e52eb9b8f8985746e9a8259036bd6e1d9a1ced` |
| `female-study-v3` | 2,245 / 4,248 / 17 | `8dbb477d6865f2e7cba968b76cf8ae86b1eac905105ae1195c1e78b2e2e65c09` |

`git diff --exit-code 521c86af9b24f461b4fad38727c38b452e29a0bc -- public/models public/identity data/identity public/regions data/regions` passes. All three atlas buffer validators and identity/region drift checks pass. No manifests, binary geometry, Phase 1 datasets/baselines, Phase 2 memberships, dependency lockfile, fit report or scientific checklist changed. Browser network evidence contains only baseline model geometry requests, with no MVMT/context/overview/supplement assets.

## Browser and mobile evidence

The dependency-free Chrome DevTools harness `scripts/areas-browser-smoke.mjs` ran against the final production preview at `http://127.0.0.1:3019`. It uses an isolated headless profile, native GPU rendering, pointer input directed at actual current-model triangle centers, keyboard input, actual UI actions and test-only interception of WebGL texture uploads. It checks rendered visible counts and waits for real assembled/settled offsets. No production test hooks were added. Chromium required execution outside the filesystem sandbox because sandboxed GPU subprocesses failed; the first failed launch and an initial harness system-button lookup were corrected before the clean full run.

Final area report: `work/phase-3-browser/report.json`, `passed: true`, `quick: false`, **4 full route/viewport suites, 32 representative station combinations, zero JavaScript exceptions**. Ordinary-region regression report: `work/phase-2-browser/report.json`, full 4 suites and 20 regional combinations, passed. Representative screenshots are stored beside each report. The existing Phase 2 harness changed only its expected mobile camera clearance from 260 to 320 pixels, matching the added navigation row.

| Route | Viewport | Whole body visible | Representative areas | Result |
|---|---|---:|---|---|
| `/male` | Desktop 1440 x 900 | 2,229 | Orbit, Heart, Porta hepatis, Kidneys, Brachial plexus, Cubital fossa, Popliteal fossa, Foot | Pass |
| `/female` | Desktop 1440 x 900 | 2,239 | Same eight | Pass |
| `/male` | Mobile width 390 x 844 | 2,229 | Same eight | Pass |
| `/female` | Mobile width 390 x 844 | 2,239 | Same eight | Pass |

For every representative combination: selecting the station establishes its affiliated region; count/render matches independent model resolution; a system-only filter works; a real station mesh is picked and isolated; clear selection restores station/system display; explode reaches 100% and packs only eligible pieces; None returns to regional navigation; choosing the station assembles and preserves systems; outside-area search (Heart, or Brain while Heart is active) remains an explicit selected exception; isolate shows exactly that search selection; clear selection restores station filtering; region change clears area and area URL; reset returns to Whole body/default count and removes navigation parameters.

Every suite also verifies all 17 choices at Whole body, keyboard area selection, 44-pixel selector height, no horizontal overflow or selector/camera overlap, direct Heart -> Lung roots transitions, Brachial plexus under secondary Cervical context, reload retaining region/area URL, routed model switching retaining canonical navigation while clearing the inspector, destination-model representation counts, None restoring ordinary Cervical, and unknown IDs normalizing to a clean Whole body URL. The Phase 2 suite independently repeats ordinary region/system/picking/search/isolate/explode/reset/model-switch checks plus female chest presets.

Desktop and mobile screenshots of Whole body, Heart, Porta hepatis, Brachial plexus, Foot and exploded inventory were inspected for framing, clipped anatomy, selector overlap, incorrect model geometry and packing. An initial portrait Whole body screenshot exposed head occlusion behind the moved camera row; portrait reserved height was increased from 440 to 500 pixels and vertical view offset from -40 to -70, preserving the existing fitting/interpolation formulas. Both browser suites were rerun after this correction. Source-derived long/corridor structures can widen stations, especially Brachial plexus and Foot; this is visible and documented. The added control row fits, station focus stays within the usable frame, and no UI overflow was found. Mobile tests cover responsive widths and pointer/keyboard actions; real-device touch gestures and manual anatomical review remain recommended. The unrouted HRA's zero-geometry behavior is covered through API/bounds/visibility tests rather than adding a new route.

## Limitations and acceptance assessment

These memberships inherit PR #1's heuristic source choices, not independent anatomical validation. Original hand/foot guards exclude donor false positives offline but cannot certify all anatomical locality. Canonical source concept granularity can expand stations beyond regex matches: male expansion counts are Willis 62, Lung roots 176, Porta hepatis 2, Celiac trunk 17, Brachial plexus 105 and Foot 2; other stations have no expansion. Exact extra representation IDs are audited. No English-name or spatial filter silently trims canonical resolver results.

Brachial plexus remains a corridor with incomplete named trunks. Pelvic station rules are male-biased, and female-specific membership needs new reviewed evidence. HRA coverage is zero for all seeded stations; study pelvic coverage is partial. The female study remains scientifically unready. Manual anatomical station, source granularity, framing and real touch-device review are recommended.

| Acceptance criteria | Assessment |
|---|---|
| 1-9: one canonical system, 17 stable areas, valid Phase 2 affiliations, explicit concept memberships, no runtime name/spatial classification, frozen reproducible source and unresolved accounting | Satisfied by contracts, dataset, pinned offline evidence, deterministic generation and corruption tests |
| 10-12: Phase 1 resolution, independent models, no male geometry/bounds fallback | Satisfied by model-bound API, coverage and own-bounds/foreign-model tests |
| 13-16: shared visibility, area precedence, organ regression and system/search/selection/isolate/explode composition | Satisfied by focused tests and actual browser GPU/pointer interaction |
| 17-21: region clearing, full reset, deterministic URLs, preserved camera math and own-model area focus | Satisfied by navigation/URL/camera tests and full browser smoke; mobile framing clearance adjusted only for the added row |
| 22-24: unchanged model geometry, Phase 1 identity and Phase 2 data | Satisfied by Git diff, hashes, buffer validation and drift checks |
| 25-27: automated tests, browser smoke and complete documentation | Satisfied; scientific readiness intentionally remains nonzero with integrity true |
| 28: no later-phase feature started | Satisfied; scope and final file inventory reviewed |

Phase 3 engineering acceptance criteria are satisfied. The repository is ready for Phase 4 work with these source/coverage/scientific limitations carried forward; Phase 4 has not begun. This assessment does not promote source-derived station memberships or the female study to independent scientific approval.
