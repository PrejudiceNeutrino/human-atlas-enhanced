# Phase 4.5 validation

Validation date: 2026-10-03. Starting main/Phase 4 and clean branch HEAD: `df4cf9a675d8effa03090e293d3b0ac8e21baa1f`. Only `phase-4.5/viewer-polish` is to be pushed; main is not modified or merged. See the implementation record for file inventory, menu order and exact renderer settings.

## Baseline and automated regression

The complete pre-change suite ran against the Phase 4 endpoint: all 22 non-browser technical checks passed, the three complete browser suites passed, and female readiness returned its required exit 1 with integrity true/readiness false. Initial sandboxed Chrome launches failed because GPU subprocesses could not start. Normal process access resolved the launch issue. Initial development-server reload/model-transition races were reproduced as harness observations of the outgoing document; the clean baseline production reruns passed. No production behavior was changed to bypass a test.

Post-change production validation uses the same complete suite plus the two new polish commands:

| Command | Result |
|---|---|
| `npm.cmd run check` | Pass |
| `npm.cmd run build` | Pass; existing large-chunk warning remains |
| `node scripts/validate-atlas.mjs` | Pass; 2,234 male pieces/buffers |
| `node scripts/validate-atlas.mjs atlas-female.json` | Pass; 888 internal HRA pieces/buffers |
| `node scripts/validate-atlas.mjs atlas-female-reconstructed.json` | Pass; 2,245 study pieces/buffers, recorded topology/morph checks |
| `node scripts/validate-interactions.mjs` | Pass; all three models |
| `npm.cmd run test:viewer-enhancements` | Pass; 6 entries |
| `npm.cmd run test:core-contracts` | Pass; 6 groups |
| `npm.cmd run validate:core-contracts` | Pass |
| `node --experimental-strip-types scripts/generate-core-contracts.mjs --check` | Pass |
| `npm.cmd run test:regions` | Pass; 7 groups |
| `npm.cmd run validate:regions` | Pass |
| `npm.cmd run check:regions` | Pass |
| `npm.cmd run test:regions:browser` | Pass; full 4 suites, 20 regional combinations |
| `npm.cmd run test:areas` | Pass; 9 groups |
| `npm.cmd run validate:areas` | Pass |
| `npm.cmd run check:areas` | Pass |
| `npm.cmd run test:areas:browser` | Pass; full 4 suites, 32 station combinations |
| `npm.cmd run test:hide-restore` | Pass; 35 tests |
| `npm.cmd run test:hide-restore:browser` | Pass; full 4 suites, including Phase 4 refinement |
| `node scripts/validate-female-joint-additions.mjs` | Pass |
| `npm.cmd run test:coverage` | Pass; 5 tests |
| `npm.cmd run test:female-readiness` | Pass; 6 tests |
| `node scripts/chest-visibility.test.mjs` | Pass; 7 tests |
| `node scripts/female-category-toggle.test.mjs` | Pass; 6 tests |
| `npm.cmd run validate:female-readiness` | Expected exit 1; `integrityPassed: true`, `ready: false` |
| `npm.cmd run test:viewer-polish` | Pass; 9 groups with all three models, all regions and all areas |
| `npm.cmd run test:viewer-polish:browser` | Pass; 6 complete route/viewport suites |

The new focused suite verifies exact head-to-toe order, 17 unique areas in every context, primary grouping/all-affiliation relevance, Whole body neutrality, incompatible/compatible area context, None retaining Region, Region clearing Area, full-model inventory, every Region/Area's independently resolved system counts, area precedence, zero counts, duplicate/foreign-model exclusion, returning to Whole body, unchanged inventory under toggles/hides/selection exceptions, model defaults/reset/switch and unchanged female defaults.

Evidence is generated locally under ignored `work/phase-4.5/`: baseline technical logs `-0.log` through `-22.log` and `-results.json`; final technical logs `final-0.log` through `final-22.log` and `final-results.json`. Successful baseline browser logs are `baseline-regions-browser-rerun.log`, `baseline-areas-production.log`, and `baseline-hide-production-final.log`. Failed early runs remain in their original logs and do not support acceptance. The consolidated accepted-result file identifies the clean final logs/reports.

## Browser, selectors, counts and defaults

The final production preview is `http://127.0.0.1:3022`, with native GPU Chrome and isolated profiles. Existing dependency-free CDP harnesses retain real triangle picks, visibility/selection texture uploads, packing-cell verification and camera uniforms. The new harness measures **open** Base UI popups rather than its hidden measurement surfaces and paces keyboard events through menu transitions. It selects an actual reproductive source concept rather than assuming a generic source label. These were harness corrections; no production assertions were removed.

| Route | Viewport | New polish suite | Default visible |
|---|---|---|---:|
| Male | 1440 × 900 | Pass | 2,217 |
| Female | 1440 × 900 | Pass | 2,239 |
| Male | 390 × 844 | Pass | 2,217 |
| Female | 390 × 844 | Pass | 2,239 |
| Male | 740 × 420 | Pass | 2,217 |
| Female | 740 × 420 | Pass | 2,239 |

Every new suite checks attached Model/Region/Teaching Area menus, trigger-width matching, 0–6px gap, viewport containment, no horizontal menu/page overflow, content-driven height, usable item dimensions, Escape dismissal/focus return, unchanged camera uniforms on menu opening, Enter/Space selection and scrolling to Foot. Every area menu contains all 17 stations plus None, in exact group order. Whole body, Head & jaw, Ankle & foot, Shoulder and Cervical relevance are verified, including Brainstem and Brachial plexus under their secondary Cervical affiliation. Out-of-region Willis selection establishes Head & jaw, compatible Brachial plexus retains Cervical, and None preserves context.

The browser compares every displayed system row with independent Phase 1/2/3 resolved inventory for Whole body, Shoulder, Ankle & foot, Heart, Kidneys and Brachial plexus. Zero rows expose Base UI disabled semantics. Disabling/re-enabling Skeleton leaves inventory unchanged. An outside-Heart Brain selection and hide/restore leave Heart inventory unchanged. Heart + Skeleton displays zero without leaving the station. Default/reset/switch Reproductive is off on male; All and manual toggling enable it; explicit reproductive selection reveals the selected default-off piece. Female default Reproductive remains on. All suites report zero JavaScript exceptions.

Representative current-scope counts are identical on the two routed models for these seeded scopes:

| Scope | Total | Nonzero system counts |
|---|---:|---|
| Shoulder Region | 122 | Skeleton 34; Muscles 88 |
| Ankle & foot Region | 118 | Skeleton 66; Muscles 48; Connective tissue 4 |
| Heart Area | 77 | Muscles 5; Heart 16; Arteries 55; Veins 1 |
| Kidneys Area | 46 | Arteries 36; Veins 6; Urinary 2; Endocrine 2 |
| Brachial plexus Area | 153 | Skeleton 2; Muscles 8; Arteries 131; Veins 12 |

All other model-present rows show zero in these scopes. Whole body counts sum to male 2,234 and study 2,245, independently of their 2,217/2,239 ordinary visible defaults. Full system inventories are recorded in `scope-counts.json` and browser report snapshots. These numbers preserve canonical resolver expansion and existing source system assignments; they are not anatomical corrections or invented values from the example screenshots.

## Rendering and dissection evaluation

Before rendering captures are in `before-render/`; after captures are in `after-polish/`. Both routes have reproducible Whole body, Skeleton, muscular, Shoulder, Thoracic and Heart images. Female images additionally cover Tissue, Glands and Pectorals. Baseline and final Phase 4 suites capture ordinary and selected pale bone, muscle, artery and vein, bone among surrounding anatomy, selected exploded bone, dissection stack, long hidden list and hidden exploded inventory. The screenshot names and reproduction commands are preserved by the harnesses; generated images are local evidence rather than committed application assets.

Visual inspection finds better ivory-bone separation from the cooler gray, more distinct muscle shaded sides/curvature and overlap boundaries, legible red/blue vessels, and preserved strong teal selection. The light theme remains neutral. Existing highlights remain readable without overexposing broad muscle surfaces or crushing the shaded side. Female chest materials and system colors are unchanged; tissue/gland/pectoral modes retain their independent visibility behavior. Portrait menus show compact rows and clear relevance marks, with ordinary unrelated areas readable. Short landscape menus retain bottom attachment and scroll within the remaining viewport. Closed controls, Systems, hidden-list restoration and the bottom dock remain usable without page overflow.

The complete Phase 4 browser suite repeats real bone selection, H/h and editable/modifier guards, hidden-list updates, C/B/A newest-first ordering, individual middle restoration, multiple hides, Restore all, hidden/exploded eligible-only GPU packing, no stale highlights/hover/picking, model switch, Reset and female chest composition. Actual pixel checks retain visibly teal selected bone/muscle/artery/vein and varied shaded colors. Hide/restore camera uniforms and unrelated selection remain unchanged. Region/area navigation preserves hides, and full reset/model switching clear them as reviewed. No organ-area intersection regression occurs.

Final screenshot pixel evidence (the same Phase 4 teal predicate):

| Route / width | Selected pale bone | Selected muscle | Selected artery | Selected vein | Selected bone among ivory bones / exploded |
|---|---:|---:|---:|---:|---:|
| Male / 1440 | 30,463 | 31,200 | 7,474 | 29,706 | 702 / 956 |
| Female / 1440 | 29,170 | 40,927 | 21,396 | 27,211 | 636 / 558 |
| Male / 390 | 11,712 | 13,102 | 5,955 | 13,265 | 277 / 92 |
| Female / 390 | 11,832 | 13,089 | 18,847 | 12,128 | 254 / 83 |

Selected surfaces retain 1,793–4,849 distinct shaded teal colors across these cases; ordinary comparison screenshots contain zero pixels matching the predicate.

## Pipeline and build size

Exact parameter changes are in `PHASE_4_5_IMPLEMENTATION.md`. Scene lights remain **3 → 3**. PMREM generation remains the existing one-time environment setup. ShadowMap is still disabled; no postprocessing, new per-frame render pass, large GPU buffer, geometry-loading path or renderer dependency was introduced. Camera/OrbitControls and selection shader code are unchanged.

| Built asset | Before raw / gzip | After raw / gzip | Difference raw / gzip |
|---|---|---|---|
| Viewer JS chunk | 852.27 / 237.98 kB | 855.12 / 238.68 kB | +2.85 / +0.70 kB |
| Entry JS chunk | 198.70 / 63.12 kB | 198.70 / 63.12 kB | 0 / 0 kB |
| CSS | 201.79 / 32.05 kB | 203.38 / 32.35 kB | +1.59 / +0.30 kB |

This is approximately 0.33% added raw viewer JS and 1.00 kB added combined compressed JS/CSS. Dependencies and lockfile are unchanged. Build retains its existing >500kB warning. No comparable frame-time benchmark is claimed: the harness records rendered state and matrices, not a controlled GPU timing workload. The hard performance constraints are satisfied by the unchanged rendering architecture and small bundle delta.

## Model/data integrity and scientific status

All **98 tracked protected files**, including all **84 `.bin` / `.bin.gz` geometry files**, match the starting commit. The hash report compares exact binary blobs and baseline checkout bytes for text, using Git's existing `core.autocrlf=true` filters. Initial raw-blob comparisons exposed existing checkout CRLF differences; no data file was modified. `git diff --exit-code df4cf9a675d8effa03090e293d3b0ac8e21baa1f -- public/models public/identity data/identity public/regions data/regions public/areas data/areas package-lock.json` is empty. Atlas validators and canonical generation/check commands independently pass.

| Manifest | Unchanged working-file SHA-256 |
|---|---|
| Male | `c359f4bcd2cba90b7411d66d5e9fc04dc81294d46cd5c1e8b212c824f2e5bbee` |
| Internal HRA female | `1525c07d2ed46263c086d1c6b2e52eb9b8f8985746e9a8259036bd6e1d9a1ced` |
| Female study | `8dbb477d6865f2e7cba968b76cf8ae86b1eac905105ae1195c1e78b2e2e65c09` |

Female readiness remains **`integrityPassed: true`, `ready: false`**. Presentation changes alter its review digest as designed. Independent anatomical review, pose evidence and named core/pelvic coverage gaps remain unresolved. The readiness validator, scientific checklist, canonical evidence and model geometry are not weakened or edited.

Baseline readiness digest: `bdc6d9dabdeae7ea1f849c53c2306f194d21ab3015e9c7905c6e05ad78a20876`. Final digest: `c328de6a7081c0d1944b3cdd11ed8beb0de55765a174e124401410e3d2cc150a`.

## Acceptance and known limitations

| Phase 4.5 criteria | Assessment |
|---|---|
| 1–6: coherent attached selectors, compact menus, desktop/mobile | Satisfied by popup geometry, screenshots and keyboard tests |
| 7–19: separate canonical systems, all 17 areas, grouping/relevance, context/None semantics and area precedence | Satisfied by unchanged datasets/helpers, focused tests and browser station transitions |
| 20–27: scoped representation counts, toggle/hidden/exception independence and zero-row preferences | Satisfied by all-model/all-scope unit coverage and independent browser inventories |
| 28–31: male default/reset/manual/All and unchanged female defaults | Satisfied by helper/reset/switch tests and browser default/selection actions |
| 32–36: anatomy contrast, bone/muscle/vessel readability and selection clarity | Satisfied by before/after visual review and actual selection-pixel regressions |
| 37–40: no shadows/postprocessing/pipeline regression, preserved camera feel | Satisfied by scene diff, unchanged camera math, bundle evidence and camera uniforms |
| 41: Phase 4 dissection | Satisfied by all 35 unit tests and full four-suite GPU/pointer/keyboard regressions |
| 42–45: immutable model/identity/region/area data | Satisfied by all protected-file hashes, diff and validators |
| 46–49: automated/browser/desktop/mobile checks and docs | Satisfied by clean complete reports and both Phase 4.5 records |
| 50: later work deferred | Satisfied by final scope review |

Engineering acceptance is satisfied and the viewer foundation is ready for the next **separately scoped** major feature phase. Scientific readiness is not implied. Canonical source gaps, resolver expansions, male-derived station membership, incomplete named plexus trunks and source system classifications remain unchanged. The internal HRA is unit-tested rather than newly routed. Real-device touch gestures and assistive-technology usability still merit human review; browser checks use native pointer/keyboard input at mobile widths. Existing short-landscape whole-body framing is compact and remains deliberately untouched under the camera non-goal. Local screenshots/logs are reproducible and ignored by Git. No later anatomy/model/knowledge/clinical feature was started.
