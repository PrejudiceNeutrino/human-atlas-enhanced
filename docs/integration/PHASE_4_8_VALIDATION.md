# Phase 4.8 validation and handoff

Date: 2026-10-04. Starting Phase 4.7/main SHA: `85caa5f334523935cbdd190d4f7c52b479037785`. The expected Phase 4.8 branch was clean and matched local main and freshly fetched origin/main before implementation. Commit/push is restricted to `phase-4.8/anatomy-discovery`; no merge into main is performed.

## Acceptance boundary

The user subsequently instructed: **“i only really care about desktop view, so as long as it looks good there, call it good”**. Desktop is the final visual acceptance target. The six-suite responsive discovery run had already passed before this instruction. Further phone/landscape visual refinement was not pursued. The last change preserves keyboard focus while arrowing between discovery tabs; final desktop tests explicitly cover it. Earlier responsive evidence is retained, not relabeled as a rerun of that last focus-only change.

## Discovery index and automated coverage

| Model | Selectable source/Search entries | Current-model representations |
|---|---:|---:|
| Male | 3,436 | 2,234 |
| Female study | 4,252 | 2,245 |
| Internal HRA | 1,073 | 888 |

The 19 new tests cover complete active-model resolution, representation availability/deduplication, no foreign geometry, exact counts and Systems, deterministic A–Z/largest/smallest sorting and tie breaks, nonmutation, all System filters, multi-system uniqueness, reset, suggestions/aliases/shortest-name ranking, no-result behavior, identical Search/Browse resolution, ordinary selected exceptions and isolate semantics, Region/Area preservation and atomic selected-only restoration, independent male/female counts, invalid/unavailable/empty/missing-chunk exclusion, mapped zero-geometry no-fallback, bounded window size/tail reachability and editable/modifier/composition shortcut guards. All three registered models are tested without routing HRA.

Current-model differences are established by source ID, not names: Bone organ has 203 male / 208 study representations; Flat bone has 10 / 14; Irregular bone has 43 / 44. The index rebuilds against the destination identity on model switch. Browser checks independently verify inventory totals and a destination-model compound count.

`Right foot`, source concept `FMA11343`, is the stable compound use case because the actual source inventory has no generic selectable concept named exactly Foot. It selects 26 current-model representations on each routed model, independently of the curated Foot Teaching Area (129 scoped pieces). Browse selection opens the ordinary inspector; isolation is checked against the exact per-part GPU visibility mask. It preserves active Thoracic Region, and separately active Heart Teaching Area/context/URL. Clear selection returns to the 77-piece Heart scope. Single-piece selection and aliased Quadriceps keyboard Search selection are also covered.

The complete technical runner executed 30 commands. The original hide test's source-text assertion expected an inline slash handler; it was updated to assert the extracted helper wiring and then all 35 hide tests passed. Final check/build, 19 discovery tests and the unchanged readiness gate were repeated after the final keyboard adjustment. No behavioral or scientific assertion was weakened.

| Command group | Result |
|---|---|
| `npm.cmd run check`, `npm.cmd run build` | Pass; existing >500 kB chunk warning |
| Three atlas validators, interaction validator, female joint validator | Pass |
| Phase 1 identity tests/validator/generator check | Pass |
| Region tests/validator/generator check | Pass |
| Area tests/validator/generator check | Pass |
| Hide/restore, viewer polish, interaction/theme tests | Pass; 35 / 9 / 16 groups |
| Phase 4.7 scope tests/check/validator | Pass; all-model explicit scope/source integrity |
| Coverage/readiness tests, female chest/category tests, Python enhancement runner | Pass |
| New discovery index tests | Pass; 19 groups |
| Female scientific readiness | Expected exit 1; integrity true / readiness false |

Technical evidence: ignored `work/phase-4.8/technical-results.json`, `technical-*.log`, `final-technical-followup.json`, and the latest `accepted-technical-followup.json` / `accepted-*.log`. `accepted-technical-results.json` consolidates successful final outcomes while retaining the original attempt logs. The isolated production build avoided changing the assets of running regression browsers; the desktop preview is `http://127.0.0.1:3029`. After those browsers completed, the ordinary `npm.cmd run build` also passed on the final source (`accepted-build.log`).

## Search/Browse browser evidence

The dependency-free CDP harness uses isolated native GPU Chrome, actual pointer/keyboard events, current-model identity expectations, test-only GPU texture/camera interception, and screenshots. No production hooks or browser dependency were added. Ordinary process access is required because sandboxed Chrome cannot start GPU subprocesses.

Completed responsive discovery evidence: `work/phase-4.8/browser-final/report.json` and `discovery-browser-accepted.log`; six suites, zero JavaScript exceptions. Final desktop evidence: `work/phase-4.8/desktop-accepted/report.json` and `discovery-desktop-accepted.log`. `SMOKE_DESKTOP=1` reproduces the user-approved desktop focus. Default invocation still tests both routes at all three viewport sizes.

| Route / viewport | Discovery result |
|---|---|
| Male / 1440 × 900 | Pass; final desktop acceptance |
| Female / 1440 × 900 | Pass; final desktop acceptance |
| Male / 390 × 844 | Passed responsive run before final focus-only adjustment |
| Female / 390 × 844 | Passed responsive run before final focus-only adjustment |
| Male / 740 × 420 | Passed responsive run before final focus-only adjustment |
| Female / 740 × 420 | Passed responsive run before final focus-only adjustment |

Each discovery suite verifies trigger and `/` use the same focused Search panel, `/` from Browse returns to that input, editable-input slash safety, Escape/focus return, explicit no-result state, aliases and keyboard selection, contained results with no secondary Combobox popup, one logical scrollbar, all three sorts with independent expected ordering, System filter/reset, unique window rows, 56px touch-sized targets, middle/tail scrolling, Home/End across windows, Tab/Shift+Tab order, single/multi-piece selection, exact compound isolate mask, Region/Area preservation, model switching, destination inventory/count and no geometry/canvas rebuild or model refetch. Final desktop suites add native Search/Browse tab-arrow focus preservation.

Camera uniforms before/after discovery opening are equal within the existing 0.00001 tolerance. Canvas identity and model request counts are unchanged. There is no anatomy-bound, camera-state or viewport reflow change from opening discovery.

## Performance and desktop visual review

Across the completed six-suite run, maximum sampled Browse DOM rows were **16** (desktop/portrait) and **12** (short landscape), for inventories of 3,436 / 4,252 entries. The theoretical bound is `ceil(scrollViewportHeight / 56) + 9`, clipped by list length. Search uses the same windowing with its existing 80-match cap. No thousands-row dump or virtualization dependency is present.

In that local run, panel open took **20.9–35.5 ms**, A–Z **19.1–31.6 ms**, largest-first **18.2–32.2 ms**, smallest-first **16.6–30.2 ms**, and System filter **19.8–25.2 ms**. The harness measures an action through animation-frame completion, not controlled frame time or GPU throughput; these values are environment-specific observations. Rows remain bounded while scrolling to the middle and end. Final desktop timings are separately preserved in its report.

Desktop screenshots reviewed include male Browse, female Whole body/navigation, and Search/selection contexts. The three selectors and Visibility share the same left edge and width; labels sit consistently above controls, the header stays separate, and the Visibility tab content remains scrollable. All 17 Teaching Areas and the existing selector menu interaction remain available. Discovery is attached just below the trigger, with input/results or filters/index inside one panel. No detached stacked result card or horizontal overflow remains.

Earlier portrait navigation/Browse and short-landscape Browse/isolate screenshots were also inspected. They show viewport-contained controls and lists. Short-landscape anatomical framing remains the existing compact camera behavior and can overlap navigation during isolation; camera fitting was explicitly outside this phase. Physical touch and screen-reader certification are not claimed, and further non-desktop visual acceptance follows the user's waiver.

Screenshots are local ignored evidence, not application assets. Desktop examples: `desktop-accepted/male-1440-browse.png`, `desktop-accepted/female-1440-navigation.png`, `desktop-accepted/male-1440-right-foot-isolated.png`. Earlier responsive examples: `browser-final/female-390-navigation.png`, `browser-final/female-390-browse.png`, `browser-final/female-740-browse.png`.

## Previous phases and integrity

The complete Region and Area browser suites have clean final reruns recorded in `navigation-regression-final.json` and `{regions,areas}-browser-final.log`. An earlier Area model reload overlapped rebuilding preview assets and could not load a file; it is not accepted evidence. No application workaround or data change was introduced.

All six existing browser regressions pass, with zero JavaScript exceptions. These suites retain native mesh picks, actual GPU masks/highlights/packing, hide/H, individual Restore/Restore all, Systems/Hidden tabs, Hide/Show all, isolated Included-member drill-down, Light/Dark/System behavior, Teaching Area scopes, explode/reset/model switching and female chest coverage.

| Full browser regression | Result |
|---|---|
| Regions | Pass; 4 route/viewport suites, 20 combinations |
| Teaching Areas | Pass; 4 route/viewport suites |
| Hide/restore | Pass; 4 route/viewport suites |
| Viewer polish | Pass; 6 route/viewport suites |
| Interaction/themes | Pass; 6 route/viewport suites |
| Explicit Area representation scopes | Pass; 4 route/viewport suites, 44 station combinations |

Accepted evidence is consolidated in `work/phase-4.8/accepted-browser-summary.json`; original reports and logs remain available. Region/Area final reports are in `work/phase-2-browser/report.json` and `work/phase-3-browser/report.json`; the other four reports are in `work/phase-4.8/regression/<suite>/report.json`. Together these cover 28 existing regression suites, plus six responsive discovery suites and the final two desktop discovery suites.

All **152 protected tracked files**, including **85 `.bin` / `.bin.gz` geometry files**, match the starting commit by Git-filter-aware blob hash. Evidence: `work/phase-4.8/integrity-report.json`. Protected paths cover models/manifests/geometry, public/data identity, Regions, all public/data Areas including representation scopes, scientific `data/anatomy`, and `package-lock.json`. Protected-path diff is empty. Package dependency records are unchanged; only two test scripts were added. No renderer/camera module was modified.

Female readiness remains **`integrityPassed: true`, `ready: false`**, with independent review, pose evidence and named core/pelvic coverage gaps unresolved. No readiness validator, scientific checklist or source evidence is modified. Final digest: `4b38bac6db7e1bb69590cb38c044b1039d2ebde81a729d0cb9e4e1fee43d1c4e`, preserved in `accepted-validate-female-readiness.log`.

## Handoff

| Original acceptance criteria | Evidence / final status |
|---|---|
| 1–6: unified Search, shortcut, containment, focus, ranking | Final desktop browser tests and 19 unit groups pass |
| 7–17: current-model inventory, counts, sorting, System filtering | All-model unit coverage and routed-model browser checks pass |
| 18–20: large-list scale and dependencies | Bounded 12–16 sampled rows; no new dependency |
| 21–30: selection and distinct navigation semantics | Shared resolver/choose pipeline, exact 26-piece isolate, Region/Area preservation and prior regressions pass |
| 31–36: coherent rail and selector behavior | Desktop screenshots reviewed; existing selector regression suites pass |
| 37–41: viewports, overflow and camera | Final desktop passes; earlier responsive run passes; final non-desktop visual acceptance waived by user; camera stable |
| 42–47: interaction/theme/scopes/explode | Full interaction, hide/restore, polish and scope browser regressions pass |
| 48–54: integrity, tests and documentation | 152 unchanged protected files; technical/browser outcomes accepted; both documents complete |
| 55–57: phase boundaries | No later motion, explode redesign or supplemental anatomy/knowledge work started |

All Phase 4.8 acceptance criteria are satisfied within the user's amended desktop visual boundary. The engineering discovery/navigation implementation is ready for a separately authorized motion/presentation phase; no later phase is started here. This engineering result does not imply female scientific readiness. Full file inventory and architecture/count/sort/filter/selection semantics are in `PHASE_4_8_IMPLEMENTATION.md`. The final commit SHA is reported in the handoff message, not self-referentially embedded in its own commit.
