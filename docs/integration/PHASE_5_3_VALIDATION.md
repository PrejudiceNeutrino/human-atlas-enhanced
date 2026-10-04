# Phase 5.3 validation and delivery

Date: 2026-10-04. Branch: `phase-5.3/motion-polish`. Starting accepted Phase 5.2/main SHA: `97244e969061f155412ea8f037133f5885384be9`. Main is unchanged. Final commit SHA and branch-only push status are reported in the delivery message, avoiding a self-referential commit hash.

## Final presentation and evidence

The user reviewed the live result, requested a longer wordmark, approved its revised text fade, requested gentler/longer layout easing, and then requested a typed eyebrow. Final settings: **900 ms wordmark**, **480 ms layout entrances**, `cubic-bezier(.22,.45,.35,1)`, 80 ms offsets, and a **1,671 ms typed INTERACTIVE ANATOMY**. Letters ramp from 40 to 180 ms each; the cursor then blinks twice with 500 ms on/off intervals. Layout finishes by 1,440 ms; only the cursor extends the finite presentation state until 3,800 ms. Functional popup/selection timing remains 120/180 ms; actual geometry readiness is never delayed for the intro.

The retained before-change production presentation suite passed on both routes: `work/phase-5.3/baseline/report.json`. Its screenshots show the original simple 280 ms staggered shell, immediate ordinary title and readiness-gated canvas, with no prominent random mesh pop-in. The unchanged base was independently built for bundle comparison.

Final focused evidence: `work/phase-5.3/ramp-final/report.json`. Native Chrome/CDP uses real production assets on port 3057, native mouse/keyboard actions, GPU texture/camera interception and test-only request interception. No production test hook is introduced. Both Light/Dark cases pass, together with portrait/short-landscape and reduced motion. Screencast PNG frames plus named checkpoints remain under the same ignored evidence folder. Representative images are intentionally retained in the repository:

| Checkpoint | Reviewable artifact |
|---|---|
| Light ghost title and partially typed eyebrow | [Light brand](phase-5.3-evidence/light-brand.png) |
| Dark ghost title and partially typed eyebrow | [Dark brand](phase-5.3-evidence/dark-brand.png) |
| Settled navigation with real loading still held | [Navigation/loading](phase-5.3-evidence/light-navigation.png) |
| Coherent anatomy resolve | [Anatomy](phase-5.3-evidence/light-anatomy.png) |
| Subsequent stage/rim resolve | [Pivot floor](phase-5.3-evidence/light-floor.png) |
| Final desktop Light composition | [Light settled](phase-5.3-evidence/light-settled.png) |
| Final desktop Dark composition | [Dark settled](phase-5.3-evidence/dark-settled.png) |
| Stable right inspector | [Inspector](phase-5.3-evidence/light-inspector.png) |
| Portrait inspector at 390 x 844 | [Portrait](phase-5.3-evidence/responsive-390-inspector.png) |
| Short landscape inspector at 740 x 420 | [Landscape](phase-5.3-evidence/responsive-740-inspector.png) |
| Immediate reduced-motion settled composition | [Reduced motion](phase-5.3-evidence/reduced-motion.png) |

Eleven selected PNGs total 3,382,027 bytes. Chrome profiles, raw screencast frames, logs and unsuccessful attempts remain ignored in `work/`; they are not committed or included in deployment.

## Automated acceptance observations

| Behavior | Final focused result |
|---|---|
| Wordmark | Semantic normal linked text; ghost aria-hidden; final solid opacity 1/ghost opacity 0 |
| Typed eyebrow | One assistive copy, aria-hidden visual letters; all 19 letters reach opacity 1; sampled final cursor states are exactly visible -> hidden -> visible -> hidden |
| Shell | Complete finite sequence; no invisible settled controls; cleanup signal reached |
| Readiness | Real geometry requests held by test: canvas stays at opacity 0; releasing them starts actual readiness-driven reveal |
| Anatomy/stage | Camera matrices unchanged across reveal; stage settles; no broad plane or perpetual animation |
| Dark persistence | Every sampled viewer frame has stored Dark; early ghost and settled captures remain Dark |
| Navigation | Whole body -> Region -> Area -> None without replaying shell/wordmark/type-in |
| Inspector | Heart -> Right clavicle retains exact panel DOM identity; no running container entrance on member change |
| Highlight/resources | Final GPU selection correct; selection does not recompile shaders or allocate framebuffers |
| Search/Browse | Existing anchored surface; explicit opacity/transform entry, completed unmount on close |
| Info | Close/reopen returns scroller to top; motion does not change scroll container |
| Random/isolation | Native Random enters ordinary persistent isolation; no introduction replay |
| Explosion | Direct native slider endpoint manipulation and reset remain functional |
| Model switch | Male -> Female -> Male reaches settled state with stable application intro |
| Responsive | 390 x 844 and 740 x 420 search/inspector open and close; no horizontal overflow or rail/control overlap |
| Reduced motion | No brand/shell/type-in events, ghost hidden, canvas transition 0 s; isolate/explode still work |
| Errors | Manifest and chunk failures override entrance with `error`; visible accessible alert and no stale preparation status |
| Runtime exceptions | Zero in the focused suite |

## Technical regressions and scientific status

Final command evidence is `work/phase-5.3/technical-results.json` and `technical-*.log`. Build evidence is `final-build.log`; the initial sandboxed baseline Vite startup failed, then ordinary authorized process access built successfully. No application workaround or weakened gate was used.

| Check | Result |
|---|---|
| `npm.cmd run check` / TypeScript | Pass |
| `npm.cmd run build` | Pass; existing large-JS-chunk/plugin-timing warnings |
| Full Node suite through Phase 5.2 plus new motion tests | **187/187 pass** |
| Motion helpers/stage tests | **4/4 pass**; typing ramp, timing units, late-frame settlement, monotonic reveal and preserved geometry/origin |
| Female Python enhancement runner | **3/3 pass** |
| Male/HRA/female-study buffer/topology validators | Pass: 2,234 / 888 / 2,245 parts |
| All-model interaction and female joint validators | Pass |
| Core identity validator/generator --check | Pass |
| Region validator/generator --check | Pass |
| Area validator/generator --check | Pass |
| Explicit Area-scope validator/generator --check | Pass |
| Coverage/readiness and female chest/category tests | Pass within retained Node/model suites |
| Female readiness command | Expected exit 1: **integrityPassed true; ready false** |
| Protected files | **152/152 unchanged**, including 85 geometry binaries and package-lock |

Final scientific digest: `04f381a81555955598597c7af61aafdcd03baaed0864fef7aac2f3978f962314`. Presentation changes invalidate previous independent-review evidence as designed. Named coverage, pose, placement and independent-review gaps remain. No scientific validator, anatomical source, identity, membership or scope is altered. `work/phase-5.3/integrity-report.json` compares Git-filter-aware working-file blob hashes to the exact accepted Phase 5.2 base.

## Retained browser regressions

Ten completed retained browser commands on the initial production motion checkpoint pass: Regions, Areas, hide/restore, viewer polish, interaction/themes, explicit Area scopes, anatomy discovery, presentation/Display, isolation workspace and stabilization. Evidence: `work/phase-5.3/regression/<suite>/report.json` and `browser-summary.json`. These cover both routed models, exact GPU visibility/highlight, camera behavior, teaching scopes, discovery keyboard/windowing, H/J, Random, autorotate, Info scroll and reset. Isolation separately covers four workspaces.

The user then refined decorative timing/type-in. The final build is reviewed with the complete final focused suite. The fresh retained presentation/Display run at `work/phase-5.3/presentation-verified/` passes both routes after the longer layout/type-in refinements; the last cadence/cursor-only change is covered by the final focused suite and pure ramp test. Unaffected semantic suites are not mislabeled as a second rerun of the typography-only refinements.

The explosion harness uses final-source dev port 3056 for its established unminified debugger cache probes. The first attempt overlapped a live page edit and model reload: its failure capture shows a 0%-loading female scene while comparing an 82%-exploded offset. This attempt is not acceptance evidence. The stable-source rerun **passes both routes** and is recorded separately under `work/phase-5.3/explosion-final/`. Together with the ten retained production commands, all eleven retained suites pass. Production direct explode behavior is also covered by the final focused and retained workspace/stabilization suites.

The retained presentation test now waits for `data-shell-settled=true` instead of assuming a historical fixed entrance delay. Its loading-shell check uses initialized canvas dimensions: hiding the stage deliberately means the empty loading scene does not yet emit camera shader uniforms. Readiness, display limits, semantic state, selection shading, errors and reduced-motion assertions remain intact.

## Performance, bundle and limits

No dependency/version or package-lock changes; package.json adds only the two motion test commands. No new shader, rendering pass, postprocessing, shadow map or timer per mesh. Stage interpolation and changing selection bytes share the original scene loop. Completed stage/selection maps do no further animation work, and completed DOM entrance rules are removed.

Final captured Light/Dark scene-reveal samples each contain 40 frame intervals. Median **16.7 ms** in both themes; p95 **16.8 / 16.8 ms**; maxima **16.8 / 16.8 ms**. Full shell/loading samples had medians 16.7 ms, p95 33.3/33.3 ms and maxima 133.3/150.1 ms. Those longer intervals include real download/decode/compile, test screencast capture and concurrent regression load. They are not a hardware-independent frame-rate guarantee. Ready-scene interpolation is consistent; no new persistent motion/render workload was found.

Vite uses the same build/compression reporting for baseline and final comparison:

| Resource | Phase 5.2 baseline raw / gzip kB | Final raw / gzip kB | Approximate delta raw / gzip kB |
|---|---:|---:|---:|
| Viewer JS | 871.02 / 243.06 | 873.17 / 243.83 | +2.15 / +0.77 |
| Entry JS | 200.13 / 63.67 | 200.20 / 63.69 | +0.07 / +0.02 |
| CSS | 218.84 / 34.73 | 225.01 / 35.71 | +6.17 / +0.98 |
| HTML | 0.62 / 0.40 | 0.86 / 0.51 | +0.24 / +0.11 |

Aggregate approximately **+8.63 kB raw / +1.88 kB gzip**. Existing model/sidecar assets are unchanged and dominate output size. This is a measured local build comparison, not a hosted transfer measurement. Existing >500 kB viewer warning remains.

Known limits: female scientific readiness remains false; physical touch devices and independent assistive-technology certification are not claimed. The compact short-landscape layout retains pre-existing small anatomy and tight slider-label spacing; this presentation pass preserves its functional controls and avoids an unrelated redesign. Headless/capture frame samples cannot certify every user's hardware performance. No later phase or creative environment is implemented.

## File inventory and acceptance boundary

Created: `app/motion.ts`, `scripts/motion.test.mjs`, `scripts/motion-browser-smoke.mjs`, both Phase 5.3 records, and eleven review PNGs in `docs/integration/phase-5.3-evidence/`.

Modified: `app/page.tsx`, `app/scene.tsx`, `app/globals.css`, `app/classic-floor.ts`, `app/theme-store.ts`, `web/index.html`, `package.json`, and the retained `scripts/presentation-browser-smoke.mjs` timing/readiness check. No protected scientific source or unrelated hygiene changes.

Acceptance mapping: criteria 1-11 are covered by final brand/type-in/timeline captures; 12-20 by real readiness and fixed-stage tests/captures; 21-30 by panel identity/scroll/resource checks; 31-40 by stable model/scope/Random/isolation/explode and Dark persistence; 41-55 by reduced motion, resource checks, finite work and desktop/responsive evidence; 56-73 by retained/full technical regressions and protected-file checks; 74-77 by the exact scope/diff audit. All 77 Phase 5.3 engineering acceptance criteria are satisfied within the documented browser/performance and scientific-status limits. Scientific readiness is deliberately not promoted.

The viewer remains ready for a separately authorized Phase 5.4 environment/floor-preset project once Phase 5.3 is reviewed and accepted. No Phase 5.4, supplemental anatomy, nerves, HRA upgrade, knowledge, pathology or pharmacology work has begun. Only the phase branch is committed/pushed; no merge into main.
