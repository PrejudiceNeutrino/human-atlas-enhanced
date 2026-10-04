# Phase 5.0 validation: staged explosion and layout continuity

Date: 2026-10-04. Starting accepted Phase 4.9/main SHA: `c90224609a9bd338ba4cca4a3f9fd2642a7a573d`. Branch: `phase-5/explode-redesign`. Live remote main matched this starting SHA. The existing untracked `.vscode/settings.json` is excluded from the phase.

## User-amended visual boundary

The user instructed: **"for the final checks just make sure desktop looks good, mobile and tablet do not matter"**. Final browser/visual acceptance covers male and female desktop at 1440 x 900; before reproduction also uses 1920 x 1080. Mobile, tablet and short-landscape final visual criteria are waived, **not passed**. Existing touch-capable slider semantics and responsive CSS remain, but physical touch and assistive-technology certification are not claimed.

The agent-browser executable was unavailable locally. The repository's existing dependency-free native Chrome/CDP approach was used, with real pointer/keyboard events, actual GPU uploads, camera uniforms and screenshots. Sandboxed Chrome disconnected during GPU startup; normal authorized process/GPU access succeeded. The owned Vite server was started explicitly on loopback and selected free port 3042; older occupied servers were not used or stopped. Final browser runs use this workspace's unchanged completed runtime; production build is checked separately.

## Before reproduction and exact root cause

Ignored evidence: `work/phase-5/baseline/baseline.json`, `analysis.json`, and `male-*.png`. The original male/default Systems/Whole body sequence captured 0, 10, 20, 30, every integer 34 through 41, 45, 50, 70, 100 and back to 0.

The original eligible set is exactly **2,217 representations**. Its unchanged shelf layout is approximately **7.311489 x 4.072494** world units. `analysis.json` records the ordered eligible IDs, original layout key, all cells and key/cell hashes for the regression samples. No grid dimension or cell reassignment occurred during slider motion. Maximum adjacent GPU offset change over 34-41% is approximately **0.010672** world units.

The old camera target discontinuity, however, is directly visible in screenshots and matrices. At 37%, captured view translation is approximately `(0, -.678912, -4.596784)`; at 38% it becomes `(.828121, -.865028, -4.396871)`. Source inspection ties this to the extent `.1` target switch after `(amount - .3) / .7`, mathematically around slider 37%. Other later thresholds forced Front orientation. The implementation record describes their removal and the rigid family-stage replacement.

## Automated and scientific regressions

`npm.cmd run check` and `npm.cmd run build` pass on the completed implementation. The complete unit invocation passes **161/161 tests**, covering identity/core, Regions, Areas, hide/restore, viewer polish/interaction, explicit Area scopes, discovery/search, cursor zoom, coverage, readiness, female chest/category/contour, presentation and ten new explosion groups. The separate Python female enhancement runner passes **3/3**.

| Check | Result |
|---|---|
| Three atlas topology/buffer validators | Pass: male 2,234; internal HRA 888; study 2,245 parts |
| All-model interaction and female joint validators | Pass |
| Identity validator and generator `--check` | Pass |
| Region validator and generator `--check` | Pass |
| Area validator and generator `--check` | Pass |
| Explicit Area-scope validator and generator `--check` | Pass |
| Full unit suite, including staged explosion | 161/161 pass |
| Python female enhancement runner | 3/3 pass |
| Source/coverage audit | Pass; isolated regeneration equals canonical baseline |
| Female readiness | Expected exit 1: `integrityPassed: true`, `ready: false` |
| Protected-path diff and exact Git-filter-aware comparison | Pass: 152 files, including 85 binaries |

Evidence: `work/phase-5/technical-results.json`, `technical-*.log`, `final-explosion-unit.log`, `final-readiness.log`, `bundle-report.json`, `integrity-report.json` and the final tool-recorded npm check/build results. The coverage audit runs only in ignored `work/phase-5/coverage-audit`, using exact committed source blobs to honor pinned checksums despite checkout CRLF. It does not rewrite protected scientific outputs. Readiness digest for the final presentation is `68a8a40eebfbeb27c951ded7b08394391a87f664bdee0c374459be798023bf35`; no readiness requirement is weakened.

The ten new numerical groups test:

- Every current SystemId has exactly one presentation family.
- All three registered models: every integer percent 0-100; explicit 34-41%; fixed family/cell/order/key/final targets; finite offsets; adjacent differences bounded by the smoothstep derivative.
- Reversed source array order gives identical layouts; repeated `25, 60, 10, 90, 35, 40` visits are identical; 0-100-0 returns exact zero offsets without signed-zero drift.
- At 30%, all members of each family have identical translations and preserve their internal relative vectors. Midpoint bounds are centered and adjacent lane intervals do not overlap.
- At 100%, every representation's horizontal bounds remain inside its correctly ordered family zone.
- One-family views use the entire range, one representation remains assembled, and empty/zero/thin/reversed/nonfinite/missing bounds remain finite.
- All registered-model Region/Area scopes, hidden exclusion/restoration, chest modes and frozen isolated scopes compose through the unchanged resolver; model/focus keys are distinct.
- Fixed-target fitting is continuous through all sampled values and around 30%; accessible value text covers endpoints and both stages.

## Focused desktop explosion browser acceptance

Final focused report: `work/phase-5/explosion-complete/report.json`, **passed true, desktopOnly true, both models, zero JavaScript exceptions**. Screenshots are beside the report. The harness intercepts real state/selection textures and camera matrices without production test hooks. Test-only conditional debugger breakpoints count actual stable-layout builder entries and measure their durations.

For both routes it verifies every integer percent against the pure stable layout, while asserting that the builder count does not change during slider-only motion. It captures 0, 10, 20, 30, 35, 36, 40, 50, 70 and 100 screenshots. Round trip restores both exact assembled GPU offsets and original camera matrices. Repeated visits match the same targets. A held native pointer drag through 34-41% verifies the same GPU positions and unchanged orientation as native keyboard input.

The original target jump is gone. Representative final male view translations:

| Amount | View translation X | View translation Y | Distance component Z |
|---|---:|---:|---:|
| 30% | approximately 0 | -.678912 | -6.391918 |
| 35% | approximately 0 | -.678912 | -6.589413 |
| 36% | approximately 0 | -.678912 | -6.673606 |
| 40% | approximately 0 | -.678912 | -7.143318 |

Female similarly retains X approximately zero and Y -.678912. Only continuously derived distance changes. The 1% position sweep and smooth fit formula, fixed target and unchanged orientation support continuity across the entire range.

| Desktop workflow | Final evidence |
|---|---|
| Whole body, male/female | 2,217 / 2,239 default visible pieces; complete 1% sweep and screenshots |
| Former 35-40% jump | Native held pointer drag and keyboard samples; no lateral reassignment or orientation switch |
| Midpoint educational view | Support, muscular, visceral, vascular and neural/sensory assemblies remain rigid and horizontally separated |
| Head & jaw, Shoulder, Ankle & foot | 30% and 100% per-scope GPU offsets/counts and screenshots on both models |
| Heart, Kidneys, Brachial plexus Areas | 30% and 100% explicit-scope GPU offsets/counts and screenshots on both models |
| All / Skeleton / Organs | Correct eligible-only layouts; Skeleton has no stage marker/dead family interval |
| Pectoral-girdle isolation | Exact 22-piece frozen assembly, both actual source families, 10/30/60/100/0% |
| Sartorius isolation | Exact two-piece one-family assembly, early individual offsets and full explosion, no misleading midpoint label |
| Exit isolation without Reset | Returning to 30% reproduces the ordinary assembled camera reference |
| Hide/restore at 30/60/100% | One actual clavicle leaves/reenters target map; no hidden GPU offset or stale selection; camera remains unchanged |
| Return to midpoint after hide/restore | Reproduces the original 30% camera matrices, preventing permanently tiny family framing |
| Orbit/zoom at 100% | Native drag changes orientation, native wheel zoom works, no layout rebuild or target change |
| Light/Dark | Same offsets/cache, reviewed midpoint/full screenshots; no broad floor plane |
| Reduced motion | Direct keyboard transformations still reach correct GPU offsets without decorative delay |
| Actual model switch | Both routed destinations load independently and retain their correct default counts/targets |

Development visual review caught a camera-cache issue after hiding at full explosion: discarding its assembled-distance reference kept the later midpoint too distant. The final fix retains that reference and reanchors only the ratio denominator. Isolation exit explicitly clears its own reference before ordinary framing resumes. Both cases now have actual camera-matrix regressions.

Other development failures were test setup issues: old Region/Area capture omitted pixel arrays needed to observe stationary direct manipulation; pectoral-girdle source inventory legitimately contains two families; Sartorius's early movement is small but nonzero; model switching must wait on the routed URL rather than a nonexistent trigger value property. The retained presentation failure test also now waits for a new `performance.timeOrigin` after Reload, preventing assertions against a stale error surface. No product behavior or acceptance assertion was weakened to bypass these failures. Only completed clean runs support acceptance.

## Retained desktop browser regressions

The final complete eight-suite run is recorded under `work/phase-5/regression-complete`, with `browser-regressions-complete.json` consolidating process status. Each suite retains all original desktop scenarios and both routes; `SMOKE_DESKTOP=1` removes only non-desktop viewports.

The Area-scope harness uses `SCOPE_OUTPUT` rather than `SMOKE_OUTPUT`; its final report/screenshots were copied from its existing default `work/phase-4.7/browser` into the consolidation directory. Its final runner log records the actual source destination and both passing routes.

All eight final process statuses are zero, all sixteen retained route/desktop suites pass, and their reports contain zero JavaScript exceptions. Together with the two focused explosion route suites, this is **18 completed desktop route suites** on the final implementation.

| Retained suite | Final result |
|---|---|
| Regions | Both models pass navigation, picking, Systems, isolation, explode, Reset and search |
| Teaching Areas | Both models pass eight representative station workflows |
| Hide/restore | Both models pass real mesh picks, H, individual restoration, eligible-only family packing, camera and chest behavior |
| Viewer polish | Both models pass attached menus, all stations/relevance, counts, defaults and model switch |
| Interaction/themes | Both models pass Systems/Hidden, persistent assembly inspection and shaded selection in both themes |
| Explicit Area scopes | Both models pass station granularity and Lung roots regression |
| Discovery | Both models pass Search/Browse inventory, sorting/filtering, keyboard selection and bounded rendering |
| Presentation | Both models pass Display, binary theme, startup/loading, persistent isolation; reduced-motion and genuine catalogue/chunk errors also pass |

## Visual review, performance and boundaries

Desktop screenshots confirm a readable one-slider dock and 30% stage marker, coherent family comparisons, finite small-scope views, family-organized final inventories, correct selection shading and Light/Dark readability. The former body-wide lateral jump is absent. Source neural/sensory coverage is limited, and sparse sensory structures retain their source positions inside that family; no missing peripheral nerve geometry or scientific hierarchy is invented.

The real builder count stays unchanged through the 101-value sweep, repeated visits, pointer drag, orbit and zoom. Rebuilds occur for loaded eligibility, filters/scopes/hides and model lifecycle only. Representative native debugger observations are roughly 3.7 / 4.2 ms median for male/female rebuilds in the focused workflow, with observed maxima about 7.6 / 16.8 ms under concurrent browser load. Pure Node cold Whole body observations were roughly 8-43 ms across the three models. These are approximate local observations, not controlled latency/FPS benchmarks.

The focused workflow observes hundreds of existing state-texture uploads but only tens of eligibility-triggered builds: male 852 uploads / 31 builds; female 995 uploads / 35 builds, including loading and all scope/filter/dissection exercises. Percentage motion uploads the existing offset buffer without repacking. Idle state has no explosion rebuild. The merged/batched pipeline and existing marker/picker buffers remain; no new rendering dependency/pass/shadow/framebuffer is added.

| Vite bundle | Starting raw / gzip kB | Final raw / gzip kB | Delta raw / gzip kB |
|---|---:|---:|---:|
| Viewer page JS | 861.98 / 240.02 | 865.05 / 241.27 | +3.07 / +1.25 |
| Entry JS | 200.13 / 63.67 | 200.13 / 63.67 | 0 / 0 |
| CSS | 215.60 / 34.23 | 216.08 / 34.31 | +.48 / +.08 |

Combined reported gzip delta is approximately **1.33 kB**. The pre-existing large-chunk warning remains. Dependency records and package-lock are unchanged; package metadata adds only two test aliases.

All 152 protected files, including all 85 binary/compressed geometry files, match starting Git blobs after normal checkout filters. Models/manifests, identity, Regions, canonical Areas, Area representation scopes and scientific coverage/review data are unchanged. Female scientific readiness remains false, with existing independent review, pose and named core/pelvic coverage limitations unresolved. Internal HRA is numerically tested without a new public route.

Stage 2 intermediate motion can overlap; endpoint family zones/cells are nonoverlapping horizontally. Full-body inventories necessarily make tiny structures small until zoomed. Physical touch/screen-reader certification, mobile/tablet/short-landscape final visual checks and controlled frame-time benchmarks are not claimed. No supplemental anatomy, nerves, MVMT runtime, HRA upgrades, knowledge/pathology/pharmacology or later phase was started.

## Acceptance and handoff

| Original criteria | Final assessment |
|---|---|
| 1-7: fixed layout/key/targets and drift-free interpolation | Satisfied by all-model numerical and actual GPU/cache sweeps |
| 8-24: one slider, rigid family endpoint, adaptive centered lanes, continuous family-local pieces and small-scope safety | Satisfied by numerical tests and both desktop route suites |
| 25-29: camera continuity, fixed target, stable orbit/zoom | Satisfied by matrices, native orbit/zoom and camera-reference regressions |
| 30-36: shared eligibility, hide/restore, Systems, Regions, Areas, isolation and chest modes | Satisfied by focused and retained desktop regressions |
| 37-39: stage label, continuous marker, accessible values | Satisfied by actual slider/ARIA and pointer/keyboard checks |
| 40, 50-51: mobile/portrait/short-landscape acceptance | Final visual checks waived by the user's desktop-only instruction; not reported as passed |
| 41-46: numerical continuity, repeat visits, rigidity, overlap and order | All ten focused test groups pass |
| 47-49, 52-53: routed-model desktop, Light/Dark and visual review | Both models and eighteen desktop route suites pass; screenshots reviewed |
| 54-58: cache, batching, no new pass/shadow/dependency | Satisfied by actual builder probes, unchanged pipeline and dependency diff |
| 59-65: previous viewer foundations | Complete retained desktop regressions pass |
| 66-69: geometry/identity/Region/Area integrity | All 152 protected files match, including scopes and 85 binaries |
| 70-72: automated/browser checks and documentation | Completed; expected scientific-readiness failure remains explicit |
| 73-75: strict later-phase boundary | No later work started |

**Phase 5.0 engineering acceptance is satisfied within the user's amended desktop-only scope. Staged explosion is ready to become the canonical explode behavior.** This does not promote female scientific readiness or claim the waived non-desktop visual checks. Commit/push is confined to the requested phase branch; main is not merged or modified. The final handoff reports its commit SHA, avoiding a self-referential SHA in this record.

## Delivery status

The validated local Phase 5 commit is complete. Push is pending explicit trusted user approval: automatic approval review rejected the branch push, including after read-only verification of the destination, because publishing this newly committed payload to the public remote requires authorization it accepts for the exact repository and branch. GitHub confirms `origin` is `https://github.com/PrejudiceNeutrino/human-atlas-enhanced.git`, public, with authenticated user `PrejudiceNeutrino` holding ADMIN permission. Live remote main and `phase-5/explode-redesign` both remain at the starting SHA; no rejected push ran. Only the requested phase branch is eligible for the later authorized push; main must remain unchanged.
