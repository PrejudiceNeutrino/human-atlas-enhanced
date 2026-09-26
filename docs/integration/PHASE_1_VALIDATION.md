# Phase 1 validation record

## Pre-implementation baseline (2026-09-26)

Branch `phase-1/core-contracts` at `3ae9e8f` was clean before changes. All nine Phase 0 audit documents existed and were read. PowerShell blocks unsigned `npm.ps1`, so package scripts are invoked with `npm.cmd`.

| Check | Baseline result |
|---|---|
| `npm.cmd run check` | Pass |
| `npm.cmd run build` | Pass; existing Vite warning for a chunk over 500 kB |
| `node scripts/validate-atlas.mjs` | Pass; male 2,234 parts, 3,432 concept mappings, 2,288,268 triangles and binary buffers verified |
| `node scripts/validate-interactions.mjs` | Pass for male, HRA female and female study |
| `npm.cmd run test:viewer-enhancements` | Pass; 6 test entries, including search and cursor zoom |
| `node scripts/validate-female-joint-additions.mjs` | Pass |
| `npm.cmd run test:coverage` | Pass; 5 tests |
| `npm.cmd run test:female-readiness` | Pass; 6 tests |
| `npm.cmd run validate:female-readiness` | Expected nonzero result: `integrityPassed: true`, `ready: false`, digest `2aacaedd4a5b9cfe911a1ed10b57adba3357a32599e526633e23f0110e11f167`. Review digest and independent review, pose evidence and named core/pelvic coverage remain unresolved. |

## Post-implementation results (2026-09-26)

| Check | Result |
|---|---|
| `npm.cmd run check`, `npm.cmd run build` | Pass; same Vite large-chunk warning (>500 kB), no build error |
| `node scripts/validate-atlas.mjs`, `node scripts/validate-interactions.mjs` | Pass, all three manifests covered by interaction test |
| `node scripts/validate-atlas.mjs atlas-female.json` and `... atlas-female-reconstructed.json` | Pass, including female study source topology/recorded morph checks; 888 and 2,245 buffers validated |
| `npm.cmd run test:viewer-enhancements` | Pass, 6 entries |
| `node scripts/validate-female-joint-additions.mjs` | Pass |
| `npm.cmd run test:coverage`, `npm.cmd run test:female-readiness` | Pass, 5 and 6 tests |
| `node scripts/chest-visibility.test.mjs`, `node scripts/female-category-toggle.test.mjs` | Pass, 7 and 6 tests |
| `python scripts/female-enhancement-runner.test.py` | Pass, 3 tests. The package alias uses `python3`, which is not executable in this Windows environment, so it was run with `python`. |
| `npm.cmd run test:core-contracts` | Pass, 6 test groups. Every one of 8,753 source concepts resolves to its original ordered part list. Negative fixtures detect duplicate IDs, unknown concepts/models, conflicting exact IDs, malformed namespaces, frame/registry mistakes, orphan IDs, missing elements/chunks and snapshot drift. |
| `npm.cmd run validate:core-contracts` | Pass; 5,386 canonical concepts, 5,367 representations, 8,753 source concept mappings, 74,630 derived links, 15 candidate/unresolved cross-model mappings |
| `node --experimental-strip-types scripts/generate-core-contracts.mjs --check` | Pass; sidecar, audit report and baseline snapshot match the manifests |
| `npm.cmd run validate:female-readiness` | Expected nonzero: `integrityPassed: true`, `ready: false`. Same unresolved review, pose and coverage reasons. Digest changed to `755f48748a1f52c6f693eedbbbcc46dbd962c7eab3a48d37e9f9540d79ba51b5` because presentation/route code changed; validator was not altered. |

The pinned manifest summary remains male **2,234 parts / 3,432 concepts / 15 chunks**, HRA female **888 / 1,073 / 10**, and female study **2,245 / 4,248 / 17**. SHA-256 fingerprints are in `data/identity/phase-1-baseline.json`: male `c359f4bcd2cba90b7411d66d5e9fc04dc81294d46cd5c1e8b212c824f2e5bbee`, HRA `1525c07d2ed46263c086d1c6b2e52eb9b8f8985746e9a8259036bd6e1d9a1ced`, study `8dbb477d6865f2e7cba968b76cf8ae86b1eac905105ae1195c1e78b2e2e65c09`. No model manifest or binary chunk was modified.

### Browser smoke

Headless Chrome on the local Vite server rendered `/male` (2,234 modeled; 2,229 visible) and `/female` (2,245 modeled; 2,239 visible) with WebGL canvases. The male search returned heart results and the Muscles switch changed visible count from 2,229 to 1,827. Clicking the model selector navigated from male to `/female`. On female, Glands and Pectorals presets changed visible counts to 2,237 and 2,229; heart selection showed 83 pieces, isolation showed 83 visible pieces, and reset restored 2,239. The explode slider reached 100% with the inventory caption and returned to 0%. Screenshots were inspected locally but are not committed. The current HRA reference remains unrouted by design.

Camera orbit/zoom math and pointer handling passed existing automated tests. Full manual visual inspection of anatomy, touch gestures and scientific placement still require human review; these checks do not certify anatomical accuracy.
