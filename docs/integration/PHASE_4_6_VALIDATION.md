# Phase 4.6 validation and handoff

Date: 2026-10-03. Clean starting Phase 4.5/main SHA: `b0d2518f300ff574f88aed0796d91c1cdc1982b0`. Local and live remote main/Phase 4.6 heads were verified at this SHA. Work is confined to `phase-4.6/viewer-interaction`; main is not merged or pushed.

The user subsequently instructed: **"just assume its good. don't do any more visual testing"**. Visual/browser validation was stopped immediately, including the running isolated Chrome test processes. No further screenshots, browser tests or visual inspections were performed. Remaining visual acceptance is assumed under that instruction, not recorded as an automated pass. The final darker ground neutral and the complete new landscape smoke have not received a clean final visual run.

## Final technical checks

The complete nonvisual suite was rerun after the final production changes. All 25 technical commands pass; the separate scientific readiness gate returns its expected exit 1. Evidence: ignored `work/phase-4.6/technical-results.json`, `technical-0.log` through `technical-25.log`.

| Command | Result |
|---|---|
| `npm.cmd run check` | Pass |
| `npm.cmd run build` | Pass; existing >500 kB chunk warning |
| `node scripts/validate-atlas.mjs` | Pass; 2,234 male parts/buffers |
| `node scripts/validate-atlas.mjs atlas-female.json` | Pass; 888 internal HRA parts/buffers |
| `node scripts/validate-atlas.mjs atlas-female-reconstructed.json` | Pass; 2,245 study parts, topology and recorded morph checks |
| `node scripts/validate-interactions.mjs` | Pass; all three models |
| `npm.cmd run test:viewer-enhancements` | Pass |
| `npm.cmd run test:core-contracts` | Pass |
| `npm.cmd run validate:core-contracts` | Pass |
| `node --experimental-strip-types scripts/generate-core-contracts.mjs --check` | Pass; unchanged identity artifacts |
| `npm.cmd run test:regions` | Pass |
| `npm.cmd run validate:regions` | Pass |
| `npm.cmd run check:regions` | Pass; unchanged Region artifacts |
| `npm.cmd run test:areas` | Pass |
| `npm.cmd run validate:areas` | Pass |
| `npm.cmd run check:areas` | Pass; unchanged Teaching Area artifacts |
| `npm.cmd run test:hide-restore` | Pass; all 35 tests |
| `npm.cmd run test:viewer-polish` | Pass; all 9 groups |
| `npm.cmd run test:viewer-interaction` | Pass; all 16 new groups |
| `node scripts/validate-female-joint-additions.mjs` | Pass |
| `npm.cmd run test:coverage` | Pass |
| `npm.cmd run test:female-readiness` | Pass |
| `node scripts/chest-visibility.test.mjs` | Pass |
| `node scripts/female-category-toggle.test.mjs` | Pass |
| `python scripts/female-enhancement-runner.test.py` | Pass; Windows-compatible Python invocation |
| `npm.cmd run validate:female-readiness` | Expected exit 1; `integrityPassed: true`, `ready: false` |

The new groups cover assembled/exploded group -> member isolation on all three registered models, exact selected member, ordinary-surrounding exclusion, Region/Area/System/hidden/view/reset preservation, invalid/nonmember rejection, ordinary member behavior, unchanged unrelated-search behavior, selected-only hidden restoration, shared explicit All set, reproductive inclusion, independent Systems/dissection restoration, unchanged contextual inventory, valid/default/invalid themes, all three persisted choices, System OS updates, explicit-choice independence, storage-denied fallback, stable subscription snapshots, listener cleanup and anatomy/URL independence.

## Existing complete browser regressions

All four existing browser commands completed successfully before visual testing was stopped. They used native GPU Chrome, isolated profiles and the production preview at `http://127.0.0.1:3023`. This production revision contains the final interaction/UI changes; its dark ground used the initial `#202a33` neutral. The only subsequent production change is the darker Dark-only ground input `#090f14`; Light rendering/interaction paths are unchanged. The final nonvisual build/check/unit/validator suite includes that adjustment.

| Command | Coverage | Result |
|---|---|---|
| `npm.cmd run test:regions:browser` | 4 full male/female desktop/portrait suites, 20 region combinations | Pass |
| `npm.cmd run test:areas:browser` | 4 full male/female desktop/portrait suites, 32 station combinations | Pass |
| `npm.cmd run test:hide-restore:browser` | 4 full male/female desktop/portrait suites, every Phase 4/refinement workflow | Pass |
| `npm.cmd run test:viewer-polish:browser` | 6 full male/female desktop/portrait/landscape suites | Pass |

All complete reports contain zero JavaScript exceptions. Logs: `work/phase-4.6/{regions,areas,hide-restore,viewer-polish}-browser.log`; summary: `browser-regression-results.json`. Copies of accepted reports: `{regions,areas,hide-restore,viewer-polish}-accepted-report.json`. The unchanged older Region/Area harnesses write their screenshots/reports under `work/phase-2-browser/` and `work/phase-3-browser/`; copies preserve this run's accepted results. Updated Phase 4/4.5 harnesses reach Restore through Hidden and assert the new one-scroll-surface layout without removing the existing GPU/pointer/keyboard/camera checks.

The Phase 4 suite verifies actual mesh picks, H/h and editable/modifier safety, hidden GPU visibility/selection cleanup, nonpickability, C/B/A newest-first history, individual middle restoration, Restore all, selected-only search restoration, navigation persistence, unchanged camera, eligible-only exploded packing, model/reset/reload clearing and female chest behavior. The Phase 4.5 suite repeats selector positioning, keyboard selection/focus, all 17 stations and relevance, contextual counts/zero rows, male default versus explicit All and mobile overflow checks.

## New Phase 4.6 browser evidence collected before stop

`scripts/viewer-interaction-browser-smoke.mjs` completed all checks for male and female at **1440 x 900** and **390 x 844** during its full-run attempt. It then entered short-landscape validation; the overall six-suite command did not complete. These four successful suite records are preserved from `interaction-final-browser.log` in `interaction-completed-suites.json`. **No complete six-suite Phase 4.6 pass is claimed.**

| Route / viewport | New interaction checks | Light/Dark UI and anatomy | Female chest |
|---|---|---|---|
| Male / 1440 x 900 | Pass | Pass in completed suite | Not applicable |
| Female / 1440 x 900 | Pass | Pass in completed suite | Tissue 2,239; Glands 2,237; Pectorals 2,229 |
| Male / 390 x 844 | Pass | Pass in completed suite | Not applicable |
| Female / 390 x 844 | Pass | Pass in completed suite | Same unchanged counts |
| Both / 740 x 420 | Full new suite unfinished | Final review assumed at user request | Full new suite unfinished |

The deterministic source group is **Muscle of pectoral girdle**, 22 represented pieces on both routed models. In assembled and exploded views, selecting its first Included structure chooses current-model `FJ1456` (Right pectoralis minor), retains isolation, leaves exactly one visible GPU representation and never invokes ordinary context framing. Shoulder/Axilla context and an unrelated hidden clavicle survive. Show surrounding anatomy exits normally and restores the 32-piece active Axilla context, including the reviewed selected exception. Nonisolated member clicks retain ordinary surroundings. Camera uniforms are compared with the ordinary context and existing numerical tolerance; no new camera math is used.

Tabs exist at zero; native arrow-key navigation moves focus between them. Switching tabs preserves GPU visibility/selection, camera, URL, hidden count and explosion. Hidden appears once and Systems contains no hidden list. Three separately hidden bones retain newest-first order; restoring the middle piece leaves the other two excluded and does not move camera/select restored anatomy. Hiding 83 heart representations yields one scrollable tab content surface, no nested list/panel scrolling, touch-sized Restore actions and no horizontal page overflow. Drawer closing/reopening retains anatomy state. Hide does not force a tab switch.

Hide/Show all is exercised in Whole body, Shoulder and Heart. Contextual row inventory and navigation URL are unchanged, explicit Show all enables the reviewed reproductive system, and a dissected clavicle stays hidden. Whole-body explicit All with that one hide yields male 2,233 / female 2,244 displayed pieces. Restoring all hidden while systems are disabled leaves the visible count at zero. Model-switch/reset behavior remains covered by the complete Phase 4 suite.

Theme browser checks start with dark OS preference and no saved choice, verifying Light. Light/Dark/System switching preserves actual GPU state, selection, hidden count, explosion, URL and camera; canvas identity is unchanged and there are no new model/binary/identity/Region/Area requests. System responds to an OS switch; explicit Dark ignores OS Light; reload retains Dark while temporary hide/explode state resets under existing behavior. All four portal menus and search results have dark surfaces (`rgb(43, 55, 66)`), with normal selected/relevance/focus treatment.

## Screenshots and rendering review already performed

Completed desktop/portrait images are under ignored `work/phase-4.6/interaction-final/`. For each route/width, representative names include `*-{light,dark}-whole.png`, `*-{light,dark}-systems.png`, `*-{light,dark}-skeleton.png`, `*-{light,dark}-muscles.png`, `*-{light,dark}-{skeletal,muscular,arterial,venous}-selected.png`, `*-{light,dark}-heart-area.png`, `*-{light,dark}-hidden.png`, `*-dark-menu-1.png` through `-4.png`, and `*-dark-search.png`. Female Dark Tissue/Glands/Pectorals and Dark body-surface images are also captured. Assembled/exploded isolated-group/member and long-list images retain the exact workflow evidence.

Review already performed found legible bone silhouettes, preserved muscle form and red/blue vessels, strong shaded teal selection, readable dark portal/panel controls and one clean mobile Hidden list. Female Tissue/Glands/Pectorals retain their palette/depth relationships with no severe new black/halo artifact in reviewed images. Anatomical materials are unchanged. The initial lit Dark ground was brighter than intended, prompting the final neutral-only darkening; the user's later instruction ends further review of that final change.

Actual selected screenshot pixels from the completed runs:

| Route / width | Bone Light / Dark teal pixels | Muscle Light / Dark | Artery Light / Dark | Vein Light / Dark |
|---|---:|---:|---:|---:|
| Male / 1440 | 115,878 / 115,744 | 161,206 / 161,241 | 10,810 / 10,844 | 91,471 / 91,442 |
| Female / 1440 | 106,669 / 106,699 | 150,611 / 150,645 | 9,745 / 9,772 | 93,941 / 93,982 |
| Male / 390 | 6,989 / 7,015 | 34,770 / 34,782 | 2,534 / 2,537 | 8,489 / 8,511 |
| Female / 390 | 7,668 / 7,697 | 37,202 / 37,227 | 2,824 / 2,835 | 9,159 / 9,172 |

Every listed selected surface retains more than 16 distinct shaded teal colors. The complete existing Phase 4 suite separately compares ordinary/selected pale bones, muscles and vessels and checks selected assembled/exploded bone among surrounding anatomy.

Initial sandboxed Chrome failed to start GPU subprocesses; normal process access resolved launch. New-harness development fixes include a missing helper, exposing the theme trigger's selected value, matching established floating-point camera tolerance, selecting actual single-piece source concepts and respecting landscape-hidden utility controls. Closed-inspector short-landscape isolation uses the existing compact camera fit: thin vessels can be too small for the screenshot-pixel threshold at default zoom. The harness now uses native wheel zoom for representative landscape pixel inspection, without changing production camera behavior. The final targeted run was stopped at the user's instruction; its incomplete results do not support acceptance. Earlier failures remain in their logs.

## Performance, integrity and scientific status

The scene effect remains keyed only by `atlas`, with theme supplied through a live ref. Six existing neutral colors update in place and dirty the existing normal render. Three lights, ACES/sRGB, exposure/environment settings, one-time PMREM, anatomy materials/shader, geometry buffers, picking/packing and camera math are preserved. Shadow maps remain disabled. No postprocessing, additional pass, new dependency or large buffer is added. No controlled frame-time claim is made.

| Built asset | Phase 4.5 raw / gzip kB | Final raw / gzip kB | Delta raw / gzip kB |
|---|---|---|---|
| Viewer JS | 855.12 / 238.68 | 872.23 / 244.11 | +17.11 / +5.43 |
| Entry JS | 198.70 / 63.12 | 200.06 / 63.71 | +1.36 / +0.59 |
| CSS | 203.38 / 32.35 | 207.22 / 32.90 | +3.84 / +0.55 |

Viewer raw JS increases about 2%; combined compressed increase is 6.57 kB. The existing large-chunk warning remains. Dependencies/lockfile are unchanged.

All **98 protected tracked files**, including all **84 `.bin`/`.bin.gz` files**, match the exact starting commit. Evidence: `work/phase-4.6/integrity-report.json`, Git-filter-aware blob comparisons (preserving existing CRLF checkout rules), pinned manifest hashes, atlas validators and canonical generator checks. Protected-path diff is empty for public models, public/data identity, Regions, Areas, scientific `data/anatomy` and `package-lock.json`. There are no binary, manifest, membership, identity or scientific-evidence changes.

Female readiness remains **`integrityPassed: true`, `ready: false`**, expected exit 1. Final presentation/model digest: `1de477ecdf0602448cab5bc4a7b28a9c32042bab6e13c17a400ec00618855bc1`. Existing independent review, pose and named core/pelvic coverage gaps remain unresolved; no readiness gate is weakened.

## Acceptance and next-phase boundary

| Criteria | Status |
|---|---|
| 1-6: isolated member semantics and camera | Implemented; all-model unit tests and four completed browser suites pass |
| 7-15: tabs/counts/order/restoration/one scroll/mobile | Implemented; four completed suites plus full Phase 4 regression pass |
| 16-21: reversible Systems versus dissection/context | Implemented; unit and completed browser checks pass |
| 22-30: three themes/default/persistence/OS/URL | Implemented; unit and completed browser checks pass |
| 31-39: intentional UI/scene rendering, anatomy/selection/chest/menu readability | Reviewed desktop/portrait evidence passes; final dark-ground and remaining landscape review assumed at user request |
| 40-44: state/loading/pipeline performance boundaries | Satisfied by live-update architecture, GPU/canvas/network/camera checks and bundle review |
| 45-48: canonical/geometry integrity | Satisfied; exact protected-file comparison and validators |
| 49: automated tests | All final nonvisual checks pass; scientific gate intentionally unready |
| 50-52: browser/desktop/mobile | Existing full suites pass; new desktop/portrait suites pass; new complete landscape run unfinished and further visual testing waived by user |
| 53-55: docs and strict scope | Complete; no scientific granularity or later work started |

Phase 4.6 implementation is ready for the authorized branch-only handoff under the user's instruction to assume remaining visual acceptance. It is **not** an independently verified clean pass of every original visual/browser acceptance criterion. The interaction foundation is ready for the separately scoped Teaching Area scientific-granularity phase under that acceptance assumption; no work on that phase has begun. Source taxonomy/membership limitations, female scientific readiness, compact short-landscape framing and physical touch/assistive-technology review remain separate limitations. Only `phase-4.6/viewer-interaction` is committed/pushed; main remains at the starting SHA.
