# Phase 2 validation record

Validation date: 2026-10-03. Starting branch `phase-2/regions` was clean and exactly at `af4b1b846bd0eba43fafc90bea30a61fad6c66a2`; the expected Phase 1 records and six required core artifacts were verified. Frozen donor SHA matched `7c2ea6ee4fe0022085c692d1a8ff25f7d4482a50`.

## Automated checks

The eleven requested baseline checks ran before implementation. All passed except the intentionally nonzero scientific female-readiness gate, which reported `integrityPassed: true`, `ready: false`. They ran again after implementation with the same outcome. No scientific validator or readiness checklist was weakened.

| Check | Post-implementation result |
|---|---|
| `npm.cmd run check` | Pass |
| `npm.cmd run build` | Pass; existing Vite chunk-size warning only |
| `node scripts/validate-atlas.mjs` | Pass; all 2,234 male buffers and mappings verified |
| `node scripts/validate-atlas.mjs atlas-female.json` | Pass; all 888 HRA buffers verified |
| `node scripts/validate-atlas.mjs atlas-female-reconstructed.json` | Pass; all 2,245 study buffers, topology and recorded morph/contour checks verified |
| `node scripts/validate-interactions.mjs` | Pass; all three models, desktop/mobile packing, pointer/tap and empty-view cases |
| `npm.cmd run test:viewer-enhancements` | Pass; 6 entries including 10 wheel-handler scenario groups |
| `npm.cmd run test:core-contracts` | Pass; 6 groups, full source resolution and corruption cases |
| `npm.cmd run validate:core-contracts` | Pass; 5,386 canonical concepts, 5,367 representations, 74,630 links; existing 15 candidate mappings retained |
| `node --experimental-strip-types scripts/generate-core-contracts.mjs --check` | Pass after fixing pre-existing CRLF-only comparison sensitivity; pinned identity files unchanged |
| `node scripts/validate-female-joint-additions.mjs` | Pass |
| `npm.cmd run test:coverage` | Pass; 5 tests |
| `npm.cmd run test:female-readiness` | Pass; 6 tests |
| `node scripts/chest-visibility.test.mjs` | Pass; 7 tests |
| `node scripts/female-category-toggle.test.mjs` | Pass; 6 tests |
| `npm.cmd run test:regions` | Pass; 7 groups |
| `npm.cmd run validate:regions` | Pass; donor evidence, exact links, unresolved accounting and resolver-derived model coverage |
| `npm.cmd run check:regions` | Pass; all three committed region artifacts reproduce from frozen donor and Phase 1 identity |
| `npm.cmd run validate:female-readiness` | Expected exit 1: integrity true, readiness false; unresolved independent review, poses and named core/pelvic coverage remain |

The baseline readiness digest was `b8b2b7a5ed9140acb91c04ccac8d787192dc968c4c9d1e7eaae84eba01cddd26`; the final digest is `c73d8dfa5e67678722152b977b5136d1c523949ed118270d019ab202770a7f22`. Presentation changes correctly invalidate old scientific review evidence, while geometry integrity remains true.

The region tests cover unique IDs/names/root/parents, valid canonical references and primary/spanning roles, no duplicate memberships, pinned evidence, unresolved donor accounting, independent male/HRA/study resolution, zero foreign-model results, independent female bounds, Whole body visibility parity against the resolver from the exact Phase 1 commit across systems/chest/selection/isolate, systems plus regions, selected search exceptions, isolation/clear-selection, explosion eligibility, deterministic reset and stale-state-free switching. Negative fixtures reject malformed/name-keyed IDs, missing names/root, invalid parents, unknown concepts/regions, duplicate memberships, invalid roles, missing/altered provenance, guessed concept links, missing unresolved rows and missing model coverage records. Camera tests project every regional bounding corner into unobstructed rectangles at 1440×900 and 390×844 for all four existing view directions.

## Membership and model coverage

There are **10 canonical regions**, including the neutral body root; **1,118 explicit memberships**, comprising **829 primary** and **289 spanning** records, representing **829 distinct canonical concepts**. **272 concepts** appear in multiple broad regions.

The generator examined **3,764 donor parts**: **877 safely mapped**, **2,887 unresolved/not seeded**. The latter comprise **1,357 current BP3D parts without donor regional evidence** and **1,530 excluded donor supplements with no current BP3D representation**. Among donor parts with both current geometry and regional evidence, there are **0 unresolved exact-link mappings**. Each unresolved item has a reason in the structured audit.

Representation columns below are independently deduplicated Phase 1 resolver results, not counts inferred from coordinates or matching names. Root concept count means all canonical concepts; root has no explicit primary/spanning rows.

| Region (ID suffix) | Canonical concepts | Primary | Spanning | Male representations | HRA representations | Study representations |
|---|---:|---:|---:|---:|---:|---:|
| Whole body (`body`) | 5,386 | 0 | 0 | 2,234 | 888 | 2,245 |
| Head & jaw (`head-jaw`) | 276 | 242 | 34 | 300 | 0 | 300 |
| Cervical (`cervical`) | 140 | 87 | 53 | 153 | 0 | 153 |
| Shoulder (`shoulder`) | 118 | 51 | 67 | 122 | 0 | 122 |
| Elbow & wrist (`elbow-wrist`) | 140 | 140 | 0 | 144 | 0 | 144 |
| Thoracic (`thoracic`) | 159 | 87 | 72 | 172 | 0 | 172 |
| Lumbar (`lumbar`) | 67 | 33 | 34 | 96 | 0 | 73 |
| Hip (`hip`) | 62 | 59 | 3 | 69 | 0 | 58 |
| Knee (`knee`) | 40 | 14 | 26 | 40 | 0 | 40 |
| Ankle & foot (`ankle-foot`) | 116 | 116 | 0 | 118 | 0 | 118 |

All male regional concepts resolve. In the study, 14 lumbar concepts and 4 hip concepts are unavailable; other seeded regions resolve every concept. In HRA, every seeded broad-region concept is currently unavailable. This reflects Phase 1's conservative identity separation, not geometry inferred from another model. Whole body available/unavailable canonical concept counts are male 3,432/1,954, HRA 1,073/4,313 and study 4,248/1,138. Detailed source/representation evidence and coverage are committed in `data/regions/region-audit-v1.json`.

## Baseline and geometry integrity

The three pinned manifests retain their counts and SHA-256 fingerprints:

| Model | Parts / concepts / chunks | SHA-256 |
|---|---|---|
| `bp3d-male-4` | 2,234 / 3,432 / 15 | `c359f4bcd2cba90b7411d66d5e9fc04dc81294d46cd5c1e8b212c824f2e5bbee` |
| `hra-female-v1.5` | 888 / 1,073 / 10 | `1525c07d2ed46263c086d1c6b2e52eb9b8f8985746e9a8259036bd6e1d9a1ced` |
| `female-study-v3` | 2,245 / 4,248 / 17 | `8dbb477d6865f2e7cba968b76cf8ae86b1eac905105ae1195c1e78b2e2e65c09` |

`git diff --exit-code af4b1b846bd0eba43fafc90bea30a61fad6c66a2 -- public/models public/identity data/identity data/anatomy` passes. No model manifest, binary, identity sidecar, baseline snapshot, fit report or scientific checklist changed. All source buffers also passed the existing integrity validators. No dependencies changed and no donor branch was merged or cherry-picked.

## Browser and mobile smoke

The reproducible dependency-free Chrome DevTools harness is `scripts/regions-browser-smoke.mjs`; set `ATLAS_URL` for the local preview and optionally `CHROME_PATH` for an installed Chromium executable. It uses a separate headless browser profile, actual pointer/key input, and local model triangles to target regional mesh picks. Test-only WebGL instrumentation reads the real offset/visibility texture uploads, waits for assembled/settled geometry and verifies rendered counts; production code has no test hooks. Screenshots and JSON evidence are written under ignored `work/phase-2-browser/`, with no geometry mutations. The final smoke uses the production build to avoid development hot-reload interference. Native GPU rendering was used; `CHROME_ANGLE=swiftshader` is an optional software fallback.

`npm.cmd run test:regions:browser` passed against the final production preview at `http://127.0.0.1:3018`. The complete report has `passed: true`, `quick: false`, four route/viewport suites, 20 regional combinations and **zero JavaScript exceptions**. Only current baseline model chunks were requested; no MVMT, overview or context chunks were loaded.

| Route | Viewport | Whole body visible | Representative regions | Result |
|---|---|---:|---|---|
| `/male` | Desktop 1440×900 | 2,229 | Shoulder, Thoracic, Hip, Knee, Head & jaw | Pass |
| `/female` | Desktop 1440×900 | 2,239 | Shoulder, Thoracic, Hip, Knee, Head & jaw | Pass |
| `/male` | Mobile width 390×844 | 2,229 | Shoulder, Thoracic, Hip, Knee, Head & jaw | Pass |
| `/female` | Mobile width 390×844 | 2,239 | Shoulder, Thoracic, Hip, Knee, Head & jaw | Pass |

Every listed combination switched regions, checked resolved counts, intersected with Skeleton, picked a real regional mesh, isolated it, cleared selection, exploded the regional eligible set to 100%, and reset to Whole body/default counts. Skeletal counts were Shoulder 34, Thoracic 84, Hip 6, Knee 22 and Head & jaw 61 on both routed models. Search selected the heart while Shoulder plus Skeleton was active: selected geometry overrode the ordinary filters, isolate displayed exactly the selected pieces, and clear selection restored the regional skeletal count. Each suite switched models while Shoulder remained selected, verified the new route and cleared inspector state, re-resolved 122 current-model regional pieces, and switched back to Whole body. Female Glands/Pectorals controls after switching retained the known 2,237/2,229 counts and reset restored 2,239.

Screenshots were captured for Whole body and all five representative regions on both routes/sizes, plus the regional exploded view. Representative desktop/mobile screenshots were inspected for framing, stale geometry, blank views, exploded packing and UI overflow. An initial mobile selector/camera-row overlap was found and corrected by placing the selector beside the model control; the final automated overlap and horizontal-overflow checks pass for all four suites. Regional mobile framing also reserves clearance below the camera row. The harness now waits for actual rendered explosion offsets to settle, avoiding misleading transition screenshots. No anatomical viewport clipping was found in the final inspected screenshots, and the independent corner-projection tests pass. Model-select interaction in the harness uses the actual UI option action and an explicit route-change wait before checking the new model. Mobile checks cover responsive layout and pointer interaction at mobile widths, not a physical touch-device certification.

## Limitations and acceptance scope

Source-derived boundaries have not received independent scientific review. Whole body preserves the organs/vessels for which the donor supplied no region evidence; regional organ presets can legitimately be empty. Spanning members are ordinary members, and long structures or compound source concepts can enlarge a regional view. Existing source system classifications are retained rather than adopting donor overrides (for example, `FJ1439`, named Right tibialis anterior, remains categorized as skeletal). HRA has no accepted canonical coverage for these male-seeded concepts; study pelvic/lumbar coverage is partial. No fabricated fallback is provided. The female study remains scientifically unready. Lazy loading and contextual geometry are deliberately deferred. Manual anatomical boundary, fit, usability and real touch-device review remain recommended; automated checks do not certify anatomical accuracy.

## Acceptance assessment

| Requested criteria | Assessment and evidence |
|---|---|
| 1–7: one taxonomy, root + nine regions, explicit canonical membership, no runtime chunk/name inference, pinned donor and unresolved records | Satisfied; dataset/contracts, frozen generation and audit checks |
| 8–11: Phase 1 visibility and representation resolvers, independent model resolution, no male coordinate fallback | Satisfied; shared resolver, foreign-model/own-bounds tests and explicit HRA/study availability |
| 12–15: Whole body parity, immutable manifests/geometry/baselines, control composition | Satisfied; frozen Phase 1 visibility comparison, hashes/buffers/Git diff and automated/browser interaction checks |
| 16: model-specific regional camera focus | Satisfied; own-model bounds, all-view corner-projection tests and routed browser smoke |
| 17–18: automated and browser validation | Satisfied; all technical gates pass; scientific-readiness nonzero result remains intentionally unchanged |
| 19–20: complete documentation, no Phase 3 work | Satisfied; both Phase 2 records complete; file inventory/scope reviewed |

Phase 2 engineering acceptance criteria are satisfied. The repository is ready for Phase 3 implementation with the documented coverage and review limitations carried forward. No teaching areas or later phase work has begun. Independent anatomical review is still recommended, and this does not promote the female study to scientific readiness.
