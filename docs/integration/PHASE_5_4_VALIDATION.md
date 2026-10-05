# Phase 5.4 validation: scene floor presets

## Starting state and acceptance boundary

Clean `phase-5.4/scene-environments`, based directly on Phase 5.3/main `72b3910a6b5eca482c7eb89a028d24b9a4551f85`. Main and origin/main contained the accepted Phase 1–5.3 lineage. The user's later instruction, **“don't worry about mobile issues, only desktop experience matters”**, makes desktop the acceptance target. Mobile results are waived, never described as passing. No mobile product fixes were made.

Final production source is served on loopback port 3064. The retained explosion cache probes use the same source on fresh dev port 3065 because their debugger probes require an unminified module. Browser tests run installed Chrome with normal authorized process access. An initial sandboxed launch crashed its GPU process before rendering; that attempt is excluded. The `agent-browser` executable is unavailable, so the repository's established Chrome DevTools harness supplies the actual input, screenshot, GPU, network, camera and resource evidence.

## Technical regressions

| Check | Result |
|---|---|
| `npm.cmd run check` | Pass on final production code |
| `npm.cmd run build` | Pass; existing large-chunk/plugin-timing warnings remain |
| Full Node suite through Phase 5.3 plus floor tests | **193/193 pass** |
| New floor unit groups | **6/6 pass** |
| Female Python enhancement runner | **3/3 pass** |
| Male / HRA / female-study buffer/topology validators | Pass: 2,234 / 888 / 2,245 parts |
| All-model interaction and female joint validators | Pass |
| Identity validator and generator `--check` | Pass |
| Region validator and generator `--check` | Pass |
| Teaching Area validator and generator `--check` | Pass |
| Area representation-scope validator/generator `--check` | Pass |
| Female coverage/readiness/chest/category tests | Pass within retained Node/model suites |
| Female scientific readiness command | Expected exit 1: **integrityPassed true; ready false** |
| Protected source comparison | **152/152 unchanged**, including **85 binaries/compressed geometry files** |

Evidence: `work/phase-5.4/final-check.log`, `final-build.log`, `final-all-node.log`, `technical-summary.json`, `technical-*.log`, `final-female-readiness.log` and `integrity-report.json`. Final presentation/model digest is `2c6af6569e87a3d1c88ed0516fc0d697d11251c2eac2d4119604d58fb470d176`. Existing independent review, coverage and pose/placement gaps remain unresolved. No readiness gate or scientific source was weakened.

The floor unit groups validate all seven IDs; missing/invalid storage; old Display migration; every preset's storage reload; complete reset; exact Classic geometry/material/palette equivalence; fixed placement and footprint; no raycast hits; static/no-op animation; live reduced motion and hidden updates; rapid switching with no overlap; identical resource instances and one disposal per resource; and continued anatomy-only picker, bounds and packing authority.

## Visual evidence

Reviewed all seven presets in both palettes at 1440 × 900. The contact sheets contain actual screenshot crops for each preset: [Light](phase-5.4-evidence/light-presets.png), [Dark](phase-5.4-evidence/dark-presets.png). Full-body Event Horizon captures confirm the anatomy remains dominant: [Light](phase-5.4-evidence/light-event-horizon.png), [Dark](phase-5.4-evidence/dark-event-horizon.png). The [Display screenshot](phase-5.4-evidence/display-desktop.png) shows the compact control alongside brightness, contrast and Reset display. These PNGs are documentation evidence, outside the production bundle.

| Preset | Light review | Dark review |
|---|---|---|
| Classic | Reviewed filled stage/rim preserved | Reviewed dark stage/rim preserved |
| Minimal | One faint ring; clean orientation | One restrained ring |
| Grid | Faint technical rings, divisions and ticks; feet readable | Technical lines remain subordinate to anatomy |
| Scanner | Quiet sweep; complete 24-second cycle observed | Complete cycle observed; no flashes or anatomy interference |
| Orbital | Three subtle elliptical paths; slow relative motion | Thin paths retain restrained contrast |
| Event Horizon | Soft low-contrast annulus, transparent center; no black sticker | Richer annulus; feet and silhouette remain legible |
| Void | No floor visible | No floor visible |

Procedural plane boundaries are invisible. The floor neither remaps semantic anatomy colors nor alters selection teal. Fixed origin/scale is deliberate: tight Head/heart/single-structure framing can crop the stage entirely. It does not follow the camera or expand to fill the viewport.

## Final desktop floor workflow

Final focused evidence: `work/phase-5.4/final-floor/report.json` and screenshots. The complete desktop suite passes on both routed models, with 99 screenshot captures and zero JavaScript/shader exceptions.

The suite covers every preset in Light/Dark, all seven actual reloads, invalid stored value fallback, phase-zero reduced motion for Scanner/Orbital/Event Horizon, a full Scanner cycle in both palettes and repeated resource switching. It compares exact GPU visibility/explosion buffers, GPU highlight, hidden count, URL, inspector/isolation state and camera matrices before/after floor changes. No anatomy/data requests recur when switching floors and the renderer lifetime stays model-scoped.

The composed Reset display test first hides a clavicle, selects Shoulder/Axilla, enters a pectoral workspace and explodes it. It cycles all presets, changes brightness and contrast, then resets Display. The complete anatomical snapshot and camera remain unchanged while brightness/contrast return to 1 and floor to Classic.

Both models cover Whole Body; Head & jaw, Thoracic and Ankle & foot Regions; Heart and Brachial plexus Areas; Abdomen (female **Abdomen Proper**), right Pectoral girdle and single-clavicle isolation; 0%, 50% and 100% explosion with Classic/Grid/Event Horizon; Random under Classic/Event Horizon; and model switch in both directions with the preference preserved. The female scope fixture uses its actual inventory name, without adding or fabricating an anatomical mapping.

## Picking, hidden tab and switch cost

`work/phase-5.4/final-probe/probe-report.json` passes all seven floor-background click checks. A point on the actual stage footprint, away from feet/UI, is projected using the real GPU camera matrices and clicked with native mouse input. Every anatomical/camera snapshot remains unchanged. Unit rays also return no floor hit. The stage is absent from atlas inventories, visibility/packing eligibility, Hidden, Systems, Search and Structure Index by construction and by unchanged GPU/count snapshots.

The frozen-tab probe observes identical floor phase before and after 1.5 seconds of browser lifecycle suspension. The pure controller additionally verifies hidden-document updates do not advance phase. Reduced-motion tests keep the chosen shader mode visible and phase at zero, including a live media preference change.

| Preset | Full-body scene draws | Floor delta versus Void | Post-load shader compilations on switch |
|---|---:|---:|---:|
| Classic | 75 | 4, preserving the reviewed cylinder material groups and rim | 0 |
| Minimal | 72 | 1 | 0 |
| Grid | 72 | 1 | 0 |
| Scanner | 72 | 1 | 0 |
| Orbital | 72 | 1 | 0 |
| Event Horizon | 72 | 1 | 0 |
| Void | 71 | 0 | 0 |

The initial, unprewarmed first procedural use compiled two shaders and contained one 66.7 ms frame. The shared program is now prepared during the hidden loading stage with `renderer.compile`, without a draw/pass. The final probe records zero switch-time compilation for all presets. First Minimal use after that change has a 16.7 ms median and 16.8 ms maximum. All switch samples have medians around 16.7 ms and p95 around 16.7–16.8 ms. One Scanner sample contains a 99.9 ms maximum with **zero** shader compiles; it is retained as an isolated headless/host frame outlier, not hidden or represented as shader cost. Final ordinary full-body samples were taken before concurrent regression load: each Light sample contains 150 intervals and each Dark sample 151. Classic, Scanner, Orbital and Event Horizon all have **16.7 ms medians**; p95 is **16.7-16.8 ms**. Maxima are 16.8 ms for Classic/Scanner/Orbital, and **17.1 / 16.9 ms** for Light/Dark Event Horizon. No sustained frame-time increase is observed in these local samples.

GPU creation/deletion instrumentation runs only in the test process. The focused suite repeats all seven presets four times after warming. Before and after counts are identical: **289 buffers, 8 textures, 4 framebuffers and 24 shader compilations** (whole-renderer totals, including existing anatomy/environment resources). No additional floor framebuffer exists. Unit tests perform another 30 cycles, verify identical object instances, no disposal/allocation during switches, no overlapping styles and one disposal per resource at teardown. There are no dynamically growing floor buffers/textures, geometry/material/buffer/texture allocations per frame, or additional framebuffers.

## Bundle and dependencies

Identical local Vite build/compression reporting is used for the starting and final source:

| Resource | Starting raw / gzip kB | Final raw / gzip kB | Delta raw / gzip kB |
|---|---:|---:|---:|
| Viewer JS | 873.17 / 243.83 | 879.01 / 245.86 | +5.84 / +2.03 |
| Entry JS | 200.20 / 63.69 | 200.20 / 63.69 | 0 / 0 |
| CSS | 225.01 / 35.71 | 225.28 / 35.75 | +0.27 / +0.04 |
| HTML | 0.86 / 0.51 | 0.86 / 0.51 | 0 / 0 |

Aggregate approximately **+6.11 kB raw / +2.07 kB gzip**. No dependency/version or package-lock change. No runtime visual assets, textures, videos, shader library, postprocessing, shadow maps or new renderer passes. Existing anatomy assets dominate output size and the existing >500 kB viewer warning remains.

## Retained regressions, integrity and limitations

All twelve retained browser suites were invoked with `SMOKE_DESKTOP=1`: Regions, Areas, hide/restore, viewer polish, interaction/themes, Area scopes, anatomy discovery, presentation/Display, isolation workspace, stabilization, motion and explosion. `scripts/motion-browser-smoke.mjs` now honors that existing desktop-only environment convention and accurately reports responsive checks as skipped; its default responsive checks remain available. The retained presentation test changes only the expected default Display object to include Classic. No retained semantic assertion is weakened.

Before the user's desktop-only instruction, broader browser attempts found mobile Reset/Restore input issues in older harness flows that scroll the fixed UI and were not acceptance evidence. Exploratory mobile harness edits were reverted. Mobile/tablet/physical-touch behavior is waived for this delivery. A focused early run also timed out on the female Abdomen fixture; the final run uses the actual Abdomen Proper inventory entry. These attempts remain separately logged in `work/phase-5.4/` and are excluded from final pass totals.

Git-filter-aware comparison against the exact starting commit proves all protected manifests, binary geometry, identity, Regions, Teaching Area memberships/scopes, scientific source and package-lock are unchanged. No camera, selection/picking or explosion mathematics changed. Floor-only code cannot become a model representation or enter packing/hidden history. Main remains unchanged; only the authorized phase branch is committed and pushed.

Known limits: female scientific readiness remains false; fixed body-origin staging can be cropped in close-up anatomical framing; headless frame intervals and resource counters are local evidence, not a GPU timing guarantee, heap profiler certificate, physical-touch review or assistive-technology certification. The brief's desktop engineering acceptance criteria are assessed using the final results below, with mobile scope explicitly waived. No later anatomy, nerve, HRA, knowledge, pathology or pharmacology work was begun.

## Final completion record

The user approved push and requested the validation cutoff: **"just call it good man, i approve push."** No further browser/visual tests were performed after that instruction.

- Final floor workflow: **pass**, both models, 99 screenshots, all seven presets and both palettes, all required scope/isolation/explode/Random/model-switch workflows, persistence/reset, reduced motion and resource cycling.
- Final picking/switch/frozen-tab probe: **pass**, seven background clicks, no anatomical/camera change, zero post-load shader compiles and frozen phase unchanged.
- Final retained browser commands: **11/11 completed commands pass**: Regions, Areas, hide/restore, viewer polish, interaction, Area scopes, discovery, presentation, isolation workspace, stabilization and motion. Evidence: `work/phase-5.4/desktop-browser-summary.json` and the named directories under `desktop-regression/`.
- Explosion: the earlier completed desktop run **passes both routes**, with unchanged layout/camera/cache behavior, in `work/phase-5.4/explosion/report.json`. That run predates only the procedural shader prewarm. The final repeat under `desktop-regression/explosion/` was interrupted at the user's cutoff and is **not** reported as completed. Final production floor tests independently verify 0/50/100% explosion with Classic/Grid/Event Horizon and exact buffer/camera invariance.
- Full technical regressions: check/build, 193 Node tests, three Python tests and every model/data validator pass. Final female readiness intentionally stays `integrityPassed: true`, `ready: false`.
- Protected integrity: 152 unchanged files / 85 geometry binaries; no dependency, runtime asset, camera/math, scientific data or later-phase scope changes.

Acceptance mapping: criteria 1-16 are covered by the typed control, migration/persistence, exact Classic helper and both-palette captures; 17-29 by disabled raycasts, actual background clicks and exact GPU/camera/state comparisons; 30-48 by the procedural program, small draw cost, frozen phase, invisible edge, restrained captures and bounded/disposed resources; 49-58 by reset and both-model/scoped/Random/explode/theme workflows; 59-66 by frame/resource/bundle evidence and protected-file comparisons; 67-72 by the completed technical/focused/retained tests, documentation and exact scope audit. **Accepted for desktop with the user's explicit validation cutoff.** Mobile scope and the final repeated explosion command are waived; an unqualified claim that every originally planned browser rerun completed is not made.

Created: `app/scene-floor-presets.ts`, `app/scene-floor.ts`, `scripts/scene-floor.test.mjs`, `scripts/scene-floor-browser-smoke.mjs`, both Phase 5.4 records and five review PNGs in `docs/integration/phase-5.4-evidence/`.

Modified: `app/display-controls.tsx`, `app/display.ts`, `app/globals.css`, `app/scene.tsx`, `package.json`, `scripts/presentation.test.mjs`, `scripts/presentation-browser-smoke.mjs` and `scripts/motion-browser-smoke.mjs`. `app/page.tsx`, `app/display-store.ts` and `app/classic-floor.ts` are unchanged.

The final commit is the phase branch tip with message `feat: add configurable creative scene floor presets`; its exact SHA is supplied in the handoff. Push is restricted to `phase-5.4/scene-environments`, with main unchanged.
