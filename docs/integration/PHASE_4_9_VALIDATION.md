# Phase 4.9 validation and handoff

Date: 2026-10-04. Starting Phase 4.8/main SHA: `294dba653364212d3741a14e3d6895e38797f95d`. The expected Phase 4.9 branch was clean and matched local main/origin main before changes. Live remote main and Phase 4.9 still matched that starting SHA at final verification. Commit/push is confined to `phase-4.9/presentation-motion`; main is not merged.

## User-approved validation boundary

The user instructed: **"for the final checks just make sure desktop looks good, mobile and tablet do not matter"**. Final browser and visual acceptance covers both routed models at 1440 x 900. Phone, tablet and short-landscape final acceptance is waived, not reported as passed. Retained harnesses still offer their original responsive coverage; `SMOKE_DESKTOP=1` limits only viewports and preserves every desktop scenario and both models.

## Technical regressions

Final `npm.cmd run check` and `npm.cmd run build` pass. Build retains the existing large-chunk warning. The complete unit invocation passes **151 tests**, including Phase 1 identity, Regions, Areas, hide/restore, rendering/navigation polish, interactions/themes, explicit Area scopes, discovery/search, cursor zoom, coverage, female readiness/chest/category, breast contour and the six new presentation groups. The Python female enhancement runner separately passes three tests.

| Validation group | Result |
|---|---|
| Three atlas buffer/topology validators | Pass: male 2,234; HRA 888; study 2,245 parts |
| All-model interaction validator and female joint validator | Pass |
| Identity validator and generator `--check` | Pass |
| Region validator and generator `--check` | Pass |
| Area validator and generator `--check` | Pass |
| Area-scope validator and generator `--check` | Pass |
| Full unit regression invocation | 151/151 pass |
| Python female enhancement runner | 3/3 pass |
| Female scientific readiness | Expected exit 1; integrity true, readiness false |
| Protected-path diff and Git-filter-aware integrity | Pass; 152 files, including 85 geometry binaries |

Evidence: ignored `work/phase-4.9/technical-results.json`, `technical-*.log`, and `accepted-build.log`. The validators were not weakened. The older coverage audit writes protected scientific output and its raw source checksum is sensitive to this CRLF checkout. An attempted ordinary audit stopped before writing. It was then run only in `work/phase-4.9/coverage-audit` using exact committed source blobs and current unchanged manifests. The isolated regenerated JSON equals the canonical coverage baseline exactly; no source or scientific baseline was edited.

The six new unit groups test display value types/nonfinite values/clamps/defaults, persistence/reset/unavailable storage, monotonic neutral contrast, and persistent assembly scope across repeated direct and Included member picks on all three registered models. They verify hidden precedence, model-bound/foreign scope rejection, explicit exit, unrelated search, hide, navigation and model-switch cleanup. Existing interaction tests now assert the required full assembly remains visible after member selection and the retired System migration.

## Exact isolation regression

Before implementation, native desktop Chrome followed slash -> pectoral -> Muscle Of Pectoral Girdle -> Isolate -> real 3D member click. The assembly had 22 visible pieces; direct selection of Left pectoralis minor restored 2,217 ordinary male pieces. Evidence: `baseline-bug-verified/report.json` and `pectoral-direct-member.png`.

The new focused regression uses actual current-model triangle positions projected through intercepted renderer camera matrices, then native mouse events. It attempts Left Serratus Anterior first and permits another deterministic visible member, as specified in the brief. Final checks on both models verify: one member is highlighted and shown in the inspector, all 22 original assembly pieces keep their exact GPU visibility mask, the original camera is retained, other members stay visible and Included structures remains available. Included member selection also retains that scope and exactly one GPU highlight. Show surrounding anatomy explicitly exits and restores the ordinary count (male 2,217; study 2,239) while retaining the selected exception.

The retained interaction suite additionally repeats assembled and 100% exploded Included selection under Shoulder/Axilla context with an unrelated hidden clavicle. Scope remains 22 pieces in both cases; Region, Area, Systems, hiding and explode state survive. Existing explode packing is unchanged.

## Theme, Display and motion browser checks

The focused CDP harness captures real exposure and contrast uniform uploads, GPU visibility/selection masks, camera uniforms, canvas identity, network requests, shader compile count and framebuffer allocation count. No production test hook was introduced.

- A single binary theme button has a visible moon/sun, an unambiguous accessible action label, native mouse and Enter activation, Light/Dark persistence and deterministic `system` -> `light` migration even with a dark OS. Theme changes preserve the anatomy snapshot and camera.
- Brightness reaches actual exposure 0.7 / 1.3; Contrast reaches actual uniform 0.85 / 1.15. Values reload correctly, malformed JSON defaults safely and numeric extremes clamp. Reset restores 1 / 1 while preserving the exact viewer snapshot. The final stronger case includes active Shoulder/Axilla, an unrelated hidden representation, isolated assembly selection and 100% explode.
- Theme/display updates retain canvas identity, model/data request counts, shader compile count and framebuffer allocation count. The shared normal scene render remains the only runtime pass; no shadow map or postprocessing is introduced.
- Actual model chunk requests are held only by the test process. During preparation the canvas stays at opacity zero, loading remains visible, the shell becomes interactive and camera projection remains stable. Releasing requests produces one coherent readiness reveal. Region/Area/discovery interaction does not replay startup.
- Model switching keeps the document/header identity and startup animation count unchanged, preserves canonical navigation, clears model-specific state and reaches a fully visible destination canvas.
- Reduced motion produces no startup animation events, zero canvas transition duration and normally visible anatomy. Both catalogue and chunk failures show an operable alert without a lingering preparation surface. There are no JavaScript exceptions.

Evidence: `work/phase-4.9/desktop-accepted-final-2/report.json`, its screenshots, and the earlier completed focused report `presentation-desktop-final/report.json`. The final follow-up adds the visible track dimensions, complete native Enter events, captured entrance stages and stronger reset snapshot to the previously passing behavior.

During development, the existing theme Select's direct-SVG hiding rule was removed; explicit Display track dimensions fixed the installed Base UI orientation styling. A stable retained catalogue fixed Region/Area fallback during in-place model transition. Browser harness corrections wait for Escape focus restoration after the 180ms close animation, send Enter text as part of the native key event, compare layout height rather than scaled popup-opening bounds, and sample only available camera uniforms before any lit geometry exists. These corrections retain the substantive assertions. Failed/early logs remain separate and do not support final acceptance.

## Retained browser regression results

All seven existing commands pass with both routed desktop models and zero JavaScript exceptions. Clean report locations are consolidated in `work/phase-4.9/accepted-browser-summary.json`.

| Desktop command | Suites | Result |
|---|---:|---|
| Regions | 2 | Pass; all five ordinary regional combinations per route |
| Teaching Areas | 2 | Pass; eight representative station workflows per route |
| Hide/restore | 2 | Pass; mesh picks, H/h, dissection stack, restoration, masks/packing/camera, model switch and female chest |
| Viewer polish | 2 | Pass; attached menus, all 17 stations/relevance, keyboard/focus, contextual counts and defaults |
| Interaction/themes | 2 | Pass; Systems/Hidden, assembled/exploded assembly, binary theme independence and shaded selected pixels |
| Explicit Area scopes | 2 | Pass; 11 representative station combinations per route including Lung roots regression |
| Anatomy discovery | 2 | Pass; full inventory/counts/sorts/filter/windowing, keyboard selection, scope preservation and model switch |

Reports are under `regression-final/<suite>/report.json`, except the final clean viewer-polish rerun at `regression-accepted/viewer-polish/report.json`. The retained regressions use the isolated final runtime build at port 3040; the scoped Display-track CSS follow-up and final keyboard/reset/motion checks use the otherwise identical final build at port 3041. No production behavior changed after those runtime regressions. Ordinary final build assets match the port-3041 build.

## Desktop visual review and performance

Light and Dark desktop screenshots include Whole body, isolated multi-piece pectoral assembly, direct member selection, selected bone/muscle/artery/vein at baseline and both supported display extremes, navigation/Visibility/discovery, Display popover, Region and Heart Teaching Area. The broad floor/horizon and cylinder slab are absent; faint rings remain beneath the assembled body. Isolation keeps a neutral uncluttered background, shaded teal emphasis and readable contours. Panels, discovery, controls and portal menus remain readable and contained, with no horizontal overflow. Entrance-stage/loading screenshots show a restrained stable shell without partial anatomy. All finalized representative captures are reviewed locally; screenshots are ignored evidence, not application assets.

For each theme and route, all four selected systems retain more than 20 qualifying teal pixels and more than 16 distinct shaded teal colors at both Brightness/Contrast extremes. Exact counts are in the focused report; no anatomical or frame-rate certification is inferred from pixel checks.

| Built asset | Phase 4.8 raw / gzip kB | Phase 4.9 raw / gzip kB | Delta raw / gzip kB |
|---|---|---|---|
| Entry JavaScript | 200.07 / 63.71 | 200.13 / 63.67 | +0.06 / -0.04 |
| Viewer JavaScript | 860.34 / 239.61 | 861.98 / 240.02 | +1.64 / +0.41 |
| CSS | 212.29 / 33.67 | 215.60 / 34.23 | +3.31 / +0.56 |
| Total | 1,272.70 / 336.99 | 1,277.71 / 337.92 | +5.01 / +0.93 |

No animation dependency, dependency upgrade, new postprocessing, render target, shadow map, per-mesh entrance or additional continuous loop. One normal render path and existing one-time PMREM remain. Theme/Display do not refetch geometry, recreate the scene, compile shaders or allocate framebuffers. Contrast has a bounded fragment-color arithmetic cost; controlled GPU/frame-time benchmarks were not undertaken.

## Integrity, limitations and acceptance

All **152 protected tracked files**, including **85 `.bin` / `.bin.gz`** files, match the exact starting commit by Git-filter-aware blob hash. `integrity-report.json` enumerates every file. Protected-path diff is empty for models/manifests, public/data identity, Regions, Areas and representation scopes, scientific anatomy data and package-lock. Package dependencies are byte-equivalent as parsed records; only the two presentation test aliases were added.

Female readiness remains **`integrityPassed: true`, `ready: false`**. Final presentation digest: `f2a1238f41f263af8c0966c64cc93aa8a6e919e826b7fc38d8c71438fa3b0cbe`. Independent anatomical review, pose evidence and named core/pelvic coverage limitations remain unresolved. No scientific gate, review evidence or geometry was weakened.

Desktop engineering acceptance is satisfied within the user's amended boundary. Original phone/tablet/mobile visual criteria are explicitly waived; physical touch, screen-reader certification, scientific placement review and controlled frame-time benchmarks are not claimed. The pre-existing bundle-size warning remains. An unrelated untracked `.vscode/settings.json` appeared during the session and is preserved outside the phase commit.

Implementation/file details are in `PHASE_4_9_IMPLEMENTATION.md`; the final commit identifies all seven new and nineteen modified phase files. Main remains unchanged. The viewer is ready for a separately scoped explode-system redesign; that redesign and all supplemental anatomy/knowledge/later-phase work have not started.

## Delivery status

The local Phase 4.9 commit is complete. Push is pending explicit user confirmation: automatic approval review rejected the branch push because it would publish committed contents to a public destination without an explicit trusted user message authorizing that exact disclosure. Read-only GitHub checks verified `origin` as `PrejudiceNeutrino/human-atlas-enhanced`, public, with the authenticated account `PrejudiceNeutrino` holding ADMIN permission. No remote branch was changed by the rejected actions. The requested destination remains only `phase-4.9/presentation-motion`; main must remain unchanged.
