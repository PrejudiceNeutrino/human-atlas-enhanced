# Phase 5.71: Context Reveal diagnostic experiments

Date: 2026-10-05. Branch: `phase-5.7/reveal-architecture`. Starting main/phase SHA: `8bad70ea21d0a0b05446bba09b7daad124a7dc9d`.

The [architecture recommendation](PHASE_5_71_REVEAL_ARCHITECTURE.md) is based on actual source inspection plus the rendering experiments below. No production Reveal feature was implemented. Only the retained local diagnostic can create these temporary browser materials; it is not imported by the application or added to package scripts.

## Method and reproducibility

Utility: [scripts/reveal-architecture-browser.mjs](../../scripts/reveal-architecture-browser.mjs). Start the existing Vite dev server on a free explicit local port, then run:

```powershell
npx.cmd vite --host 127.0.0.1 --port 3071 --strictPort
# In a separate shell:
$env:ATLAS_URL='http://127.0.0.1:3071'
node scripts/reveal-architecture-browser.mjs
```

Optional `CHROME_PATH` selects installed Chromium; `SMOKE_OUTPUT` selects a diagnostic output folder. Defaults use ignored `work/phase-5.71/browser/`. The diagnostic deliberately requires a loopback origin and an exact current unminified Vite-module anchor. It is not a production-build test and will fail if that instrumentation precondition changes; update it deliberately rather than shipping hooks into runtime source.

The utility starts an owned hidden/headless Chrome process with a unique local profile and closes it in `finally`. CDP response interception adds a lexical diagnostic object to the **browser's received scene module only**. Disk `app/scene.tsx`, the dev server's source, production bundle, manifests and binaries are never edited. It registers the existing optional `document.modelContext` tools to invoke actual viewer selection callbacks using exact fixture IDs. Material experiments then operate on the captured renderer/scene objects in that test process.

The agent-browser and verification skills were consulted. The `agent-browser` CLI is unavailable in this environment, so the repository's dependency-free native Chrome/CDP pattern was used. Initial sandboxed Chrome failed before rendering because its GPU process could not start; the final run used ordinary authorized process/GPU access. No application workaround, browser security bypass, or dependency was added. One intermediate diagnostic attempt used an incorrect Included-row selector; it was corrected to the actual `.member-list button` and the complete utility was rerun. Only the final successful report is retained as acceptance evidence.

Final environment: Chrome WebGL/ANGLE, NVIDIA GeForce RTX 4080, Direct3D11; Three.js revision 185; 1440 x 900 viewport, device scale factor 1; Male model `bp3d-male-4`. The first page check found title `Human Atlas`, meaningful content, 41 buttons, rendered canvas, no Vite overlay and no exceptions. [Initial dev check](phase-5.71-evidence/dev-check.png).

All six concept fixtures are actual source concepts; names are used to locate test fixtures, never to establish anatomical identity or cross-model mappings:

| Fixture | Exact source ID | Selected modeled pieces |
|---|---|---:|
| Liver | FMA7197 | 60 |
| Heart | FMA7088 | 83 |
| Brain | FMA50801 | 59 |
| Left kidney | FMA7205 | 1 |
| Abdominal aorta (deep vessel) | FMA3789 | 1 |
| Scaphoid (bilateral wrist concept) | FMA23709 | 2 |

Each uses normal viewer selection, then diagnostic-only camera framing around the selected bounds, looking from the front. Camera framing is held fixed across its material comparisons. This is an inspection aid, **not a recommendation to autozoom on Reveal entry**. The bilateral wrist framing spans both hands; a later actual Included-row selection tests one small left scaphoid representation, source part **FJ3278**, separately in Dark.

## Rendering variants actually tested

| Variant | Details | Purpose |
|---|---|---|
| Normal | Original shared materials and current selected-state shader | Baseline selected anatomy still physically obscured. |
| Single transparent | All anatomy render materials transparent, depthTest true/depthWrite false; alpha 1 for exact target mask, .1 for others; DoubleSide/forceSinglePass true | Tests whether a per-part alpha mask alone is sufficient. |
| Two-pass | Opaque exact-target pass, depthTest/write true; non-target transparent ghost pass depthTest true/write false; shared original merged geometry; ghost alpha .1, .2, .3; DoubleSide/forceSinglePass true | Tests target surface/depth correctness and opacity density. |
| Two-pass pruned | Same .1 policy, but disables opaque target draws for batches containing no displayed target | Tests bounded batch optimization without geometry extraction. |
| Double-sided ghost default | Two-pass .1 with forceSinglePass false, causing separate back/front ghost draws | Measures draw overhead and visual difference for the wrist concept. |
| Dark single wrist member | Existing theme button and Included member callback; pruned target pass, .1 ghosts with double-sided back/front draws retained from the preceding comparison | Confirms one tiny target's surface through context in Dark; not a full Dark matrix. |

The mask is independent of the animated selection byte. Variants explicitly retain the existing compile injection and contrast uniform and add a target DataTexture. No geometry is copied; each ghost wrapper references original merged geometry. Material variants are cached per original material/pass. The diagnostic keeps all variants alive until browser teardown to compare them; a production implementation should have bounded scene ownership and disposal as specified in the architecture record.

For each main fixture/variant, the utility asserts unchanged visibility W values, XYZ explode offsets, Hidden IDs, frozen workspace scope, systems, selected source IDs, camera world matrix and projection matrix. It does not claim a new UI-state composition suite: these experiments keep existing initial full-body eligibility. The complete final run reports **zero runtime exceptions, zero console errors, zero response-interception errors**. All 36 principal fixture/variant comparisons completed, plus double-sided and single-member diagnostics (38 measurement records).

## Visual observations and retained screenshots

| Structure / question | Evidence | Observation |
|---|---|---|
| Liver baseline vs Reveal | [Normal](phase-5.71-evidence/liver-normal-1.png), [opaque target + .1 context](phase-5.71-evidence/liver-two-pass-pruned-0.1.png) | Ordinary anterior muscle obscures selection. .1 ghosts expose the organ surface and surrounding vessels/skeleton; multiple front layers still attenuate its teal color. |
| Liver single transparent pass | [Single pass](phase-5.71-evidence/liver-single-0.1.png) | Target appears fragmented with internal vessel/triangle surfaces visible through other target surfaces. Alpha 1 without target depthWrite is insufficient in merged transparent batches. |
| Liver opacity density | [.2 context](phase-5.71-evidence/liver-two-pass-0.2.png), [.3 context](phase-5.71-evidence/liver-two-pass-0.3.png) | Higher opacity increases torso clutter and reduces target contrast. .3 loses much of the readable teal surface despite target alpha remaining 1. |
| Heart | [Normal](phase-5.71-evidence/heart-normal-1.png), [.1 pruned](phase-5.71-evidence/heart-two-pass-pruned-0.1.png) | Multipart target retains coherent opaque surface with constituent structures in their source-resolved positions. Rib/lung/muscle ghosts still overlay it; no inferred cardiac membership was added. |
| Brain | [.1 pruned](phase-5.71-evidence/brain-two-pass-pruned-0.1.png) | Skull/head context becomes subdued while target surface reads clearly. Ordinary target self-occlusion remains, rather than every target piece showing through every other target piece. |
| Left kidney | [.1 pruned](phase-5.71-evidence/left-kidney-two-pass-pruned-0.1.png) | A single representation remains legible through dense abdominal context, but overlapping organs/vessels create stronger attenuation than the head example. |
| Deep vessel | [Abdominal aorta .1](phase-5.71-evidence/abdominal-aorta-two-pass-pruned-0.1.png) | Revealed vessel remains identifiable but low in contrast after many ghost layers. This is the most significant legibility concern for simple all-context alpha blending. |
| Wrist group / double-sided cost | [Pruned .1](phase-5.71-evidence/scaphoid-two-pass-pruned-0.1.png), [double-sided ghosts](phase-5.71-evidence/scaphoid-double-sided.png) | Both small target bones are visible at whole-body scale. Default back/front ghost rendering adds cost without resolving all merged-surface ordering problems. |
| One small representation in Dark | [Left scaphoid](phase-5.71-evidence/wrist-single-dark.png) | Exact one-part target retains a shaded solid surface through ghosted wrist/forearm context. Existing Dark theme was changed through its actual button; no synthetic palette replacement. |

All linked captures were visually inspected. These screenshots demonstrate renderer feasibility, not final framing/UI polish or anatomical/scientific validation. Initial source labels/system assignments are retained, including concepts whose first constituent's source system differs from the composite name; the audit does not relabel them.

Approximate tiers: target alpha 1 with depthWrite; initial ghost tuning near .1, potentially .08-.15 pending more views/themes. .2/.3 were compared and are busier. No .4-.6 near-context strategy, view-dependent occluder detector, true geometric blocker set, target-first picking, or automatic Reveal UI was implemented/tested. No exact final opacity is frozen.

## Performance observations

Actual browser inventory: 2,234 parts, 15 chunks, **69 merged anatomy meshes**, 15 used categories, 18 allocated standard materials. The renderer reports 71 resident render geometries including floor resources after initial rendering; picker-only geometries are not represented by that GPU counter. The material diagnostic does not increase this resident geometry count. It caches 45 variants after all three experimental pass types have been warmed across 15 used categories, rather than cloning per part. Repeated alpha changes reuse the warmed programs/materials.

The table reports whole-scene `renderer.info.render` totals, not visible-triangle counts. Fragment-discarded triangles remain submitted. Surface/floor double draws and camera-dependent floor culling explain differing baseline totals:

| Fixture | Normal calls | Single transparent calls | Unpruned two-pass calls | Pruned two-pass calls | Pruned submitted triangles |
|---|---:|---:|---:|---:|---:|
| Liver | 71 | 69 | 138 | 77 | 2,699,988 |
| Heart | 71 | 69 | 138 | 73 | 2,367,066 |
| Brain | 71 | 69 | 138 | 75 | 2,489,040 |
| Left kidney | 71 | 69 | 138 | 70 | 2,293,368 |
| Abdominal aorta | 71 | 69 | 138 | 70 | 2,374,552 |
| Scaphoid | 75 | 73 | 142 | 75 | 2,538,290 |

Liver normal submits 2,348,630 triangles; single transparent 2,288,268; unpruned two-pass 4,576,536. Pruning eliminates 61 opaque batch draws for Liver, retaining eight target-bearing batches plus the 69 ghost draws. Each retained target-bearing batch still submits all its geometry, including discarded non-target vertices. Single-pass ghosts therefore matter more than an opacity uniform's CPU cost.

For the bilateral wrist, switching ghosts to their default two-sided back/front drawing yields **211 calls / 6,865,572 submitted triangles**, versus 142 for unpruned single-pass ghosts. The final tiny Dark member's pruned but double-sided ghost comparison yields 139 calls; it is not the single-pass V1 cost.

Measurements use five warmup renders, then 15 repeated explicit renderer calls. `submitMedianMs` times JavaScript submission; `completedMedianMs`/P95 includes a subsequent `gl.finish`. Main comparisons returned approximately .2-.4 ms median on this headless/high-end setup; double-sided wrist approximately 1.8 ms. These small values are **not GPU timer-query measurements, animation FPS, sustained orbit benchmarks, or a portable frame budget**. Timer precision, browser command submission/synchronization and headless behavior limit interpretation. Draw/triangle/resource counts are the stronger reproducible evidence. Compile warmup is excluded; that startup cost still needs management in a real implementation.

See the complete [report.json](phase-5.71-evidence/report.json) for each recorded alpha, timing, count and fixture. No performance timings are claimed for system heuristics, CPU/GPU occluder detection, female rendering, low-power/mobile hardware or OIT. Those alternatives were evaluated from actual architecture and constraints, not benchmarked.

## Validation and unchanged production boundary

| Check | Result |
|---|---|
| Required branch/status/history/tracking commands | Expected branch, clean starting tree, exact main baseline |
| Live remote main / phase head at start | Both `8bad70ea21d0a0b05446bba09b7daad124a7dc9d` |
| `npm.cmd run check` | Pass |
| Relevant retained Node suites | **112/112 pass**, zero failures/skips |
| `npm.cmd run build` | Pass; existing large-chunk and plugin-timing warnings |
| `npm.cmd run check:regions` | Pass; no generated data rewrite |
| `npm.cmd run check:areas` | Pass; no generated data rewrite |
| `npm.cmd run check:area-scopes` | Pass; no generated data rewrite |
| `npm.cmd run validate:core-contracts` | Pass; unresolved/candidate mappings retained |
| Diagnostic utility syntax / Git whitespace | Pass |
| Complete diagnostic browser run | 38 measurement records; zero runtime/console/interception errors |
| Protected-file comparison | **152/152 unchanged**, including **85 geometry binary/compressed files** |

The 112 retained tests are `hide-restore`, `viewer-interaction`, `area-scopes`, `anatomy-discovery`, `explosion-layout`, `isolation-workspace`, `presentation`, and `shell-cleanup`, run together with `node --experimental-strip-types --test`. They verify existing contracts on the registered models; they are not tests of a shipped Reveal feature.

Protected comparison uses the established 152-file protected inventory and `git hash-object --path` against this audit's exact starting main SHA, avoiding the Windows LF/CRLF snapshot issue. [Protected integrity report](phase-5.71-evidence/protected-integrity.json). An additional static inventory audit of model/identity/Region/Area paths also found no changes. Runtime/app/components, dependency/lockfile, canonical scientific sources, manifests, geometry, classification and generated scopes are unchanged by this commit. No readiness gate was weakened; this pass does not change the prior scientific status or certify unresolved female anatomy. The female-readiness command was not rerun for this documentation/diagnostic-only change.

Coverage limits: experimental rendering is Male desktop with one Dark tiny-member observation. Female/HRA browser experiments, skin-enabled target rendering, final UI/picking/zoom priority, transitions, rapid production toggle/model disposal, full composition browser matrices, mobile/tablet, touch, assistive technology and lower-power GPU performance were **not run**, and are not described as passed. All production feature acceptance is deferred to separately authorized Phase 5.72.

## Artifacts and handoff

Created files: this document, `PHASE_5_71_REVEAL_ARCHITECTURE.md`, the diagnostic utility, and `phase-5.71-evidence/` containing 14 named PNGs plus the rendering and protected-integrity JSON reports. No previously tracked production file is modified. Unretained screenshots, Chrome profiles/logs, transformed module inspection, intermediate failed-run diagnostics and local audit output remain ignored under `work/phase-5.71/`; generated build output remains ignored.

Recommendation: Option A's deterministic all-visible context set, exact separate target mask, shared geometry, opaque target/transparent ghost material variants, pruned target batches, normal target depth and low single-pass ghost alpha. Preferred UI is explicit `Reveal in context` / `Exit reveal` beside the independent `Isolate structure` action. Target-first picking with inspectable ghosts is the proposed next-phase contract, not current behavior.

Commit message: `docs: design context reveal rendering architecture`. Push only `origin/phase-5.7/reveal-architecture`. Final SHA and live branch/main verification are reported in the delivery message to avoid a self-referential commit hash. Stop after this audit; do not implement Phase 5.72.
