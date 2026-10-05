# Phase 5.5 validation and handoff

Date: 2026-10-04. Branch: `phase-5.5/final-ui-polish`. Clean starting main/Phase 5.4 SHA: `c7c6387a84f30cdda71d5e0d435c77b424ef60cb`. Local main, origin/main and phase branch matched at start. Final commit SHA is supplied in the delivery message, avoiding a self-referential commit hash. Push is restricted to this phase branch; main is unchanged.

## Final acceptance boundary

The user explicitly requested: **“do mimimal testing for desktop, otherwise call it good and push.”** The focused desktop matrix had already completed on both public models. The broader browser runner was stopped at this instruction; no additional browser/visual validation was performed afterward. Completed work is retained, interrupted/unrun suites are waived for this delivery, and mobile/tablet/physical-touch and assistive-technology certification are not claimed.

Original criteria requiring every retained browser suite to complete are therefore not all literally satisfied. Delivery is accepted under the user's revised minimal desktop testing scope. The viewer can leave this UI refinement phase under that acceptance; scientific readiness remains a separate future process. No Phase 6 audit or correction is started.

## Method and evidence

The installed agent-browser and verification skills were read. The CLI is unavailable. The established repository Chrome/CDP harness was used instead, with real mouse/keyboard input and test-only GPU camera/texture instrumentation; no product test hook was added. Initial sandboxed Chrome disconnected before verification; normal authorized process/GPU access completed it. The development viewer on task port 3066 rendered anatomy and controls with zero runtime exceptions. Final source was built and served on task production preview port 3067. The focused final browser run uses the production output, not a stale server.

Primary focused report: `work/phase-5.5/regression/final-ui/report.json`. It passes both Male and Female routes with zero JavaScript exceptions. An earlier dev-focused run passed before the final isolation-preset correction; its evidence in `focused-1/` is not substituted for the final production result. That earlier run's relevance-dot probe used an incorrect selector; the final probe correctly verifies `.area-relevance-dot`, canonical headings and absence of the bracket. Reports/logs/profile output remain ignored under `work/`. Fourteen selected unchanged screenshots are retained under `phase-5.5-evidence/`.

| Final checkpoint | Evidence |
|---|---|
| Light Male / Female composition | [Male](phase-5.5-evidence/male-light-whole.png), [Female](phase-5.5-evidence/female-light-whole.png) |
| Neutral Dark canvas and Classic | [Dark Classic](phase-5.5-evidence/male-dark-classic.png) |
| Grid / Event Horizon / Void | [Grid](phase-5.5-evidence/male-dark-grid.png), [Event Horizon](phase-5.5-evidence/male-dark-event-horizon.png), [Void](phase-5.5-evidence/male-dark-void.png) |
| Dark inspector, both models | [Male](phase-5.5-evidence/male-dark-inspector.png), [Female](phase-5.5-evidence/female-dark-inspector.png) |
| Search / Browse | [Search](phase-5.5-evidence/male-dark-search.png), [Browse](phase-5.5-evidence/male-dark-browse.png) |
| Info and help | [Info](phase-5.5-evidence/male-dark-info.png) |
| Cervical relevance across canonical headings | [Teaching Area menu](phase-5.5-evidence/male-dark-teaching-areas.png) |
| Selected isolated anatomy + lock | [Lock workspace](phase-5.5-evidence/male-light-locked-isolation.png) |
| Short desktop caption/dock | [1280 x 600](phase-5.5-evidence/male-dark-height-600.png) |

## Theme, anatomy and interface observations

The final canvas `#141414` is substantially darker and neutral compared with the supplied blue/slate screenshot and the retained Phase 5.3/5.4 Dark palette. Panels `#232323`, elevated controls `#2b2b2b` and popovers `#292929` remain distinguishable. Anatomy provides the dominant color. Bone, muscle and visible arterial/venous detail remain readable in rendered full-body captures, with normal lighting/exposure and unchanged tissue/selection shaders. The existing cyan highlight remains active in selected isolated anatomy. Pale small structures remain covered by retained picking/data/unit checks; a separate new scientific/structure-by-structure visual audit was not performed at the user's cutoff.

All seven floor presets (Classic, Minimal, Grid, Scanner, Orbital, Event Horizon, Void) were captured in Dark on both models. Neutral Classic and procedural lines retain clear stage identity, while Event Horizon's cyan annulus remains distinct from the near-black canvas. The floor architecture/resource/timing code is unchanged beyond palette values. Both Light full-body compositions and Light selected isolation were captured; Light palette tokens are unchanged. Full Light floor/cross-panel browser certification was not repeated after the cutoff.

Search/Browse retains the accepted flat active-indicator tabs and single focus border, with title/helper/results/dividers aligned. Full Browse inventory remains present on both models. Search keyboard behavior continues through the same discovery list/action pipeline. Info presents both repository links, retained source attribution/license context and eight registry-rendered shortcuts. The scroller opens at zero on both initial opening and close/reopen after an intentional scroll.

Cervical probe verifies Brainstem under Head & jaw, Larynx under Cervical and Brachial plexus under Shoulder. All three retain dots and report `boxShadow: none`; headings/membership and canonical order are unchanged. Selected row/checkmark behavior remains the unchanged native Select implementation.

## Keyboard and lock matrix

The final production report verifies the following on both models:

| Case | Result |
|---|---|
| `/` | Opens Search and focuses the field |
| F / S / B | Rail state and actual rendered camera orientation change to the requested preset |
| R | Existing full Reset returns three-quarter view, clears hidden state and retains lock |
| I with Heart selected | Enters the ordinary persistent isolation workspace |
| I with no selection | Safe no-op; no arbitrary fallback |
| H / J | Hide selected and restore newest hidden remain functional while locked |
| Text input | Literal `F S B R I H J` entered into Search does not change camera/dissection |
| Key presses with Search focused | F/S/B/R/I/H/J are guarded; a valid selected structure cannot be hidden/isolated/restored by typing |
| Ctrl / Meta chords | Viewer actions do not fire |
| Unit guard matrix | Every key rejects Ctrl/Meta/Alt, composition, repeats, handled events and all editable/ARIA ancestor contexts |
| Current oblique orientation -> Lock | Camera matrix unchanged within 0.00001 tolerance |
| Left drag while locked | Rendered camera unchanged within 0.00001 tolerance |
| Zoom while locked | Camera distance changes; orientation submatrix unchanged within 0.00001 |
| Right-drag pan while locked | Camera translation changes; orientation unchanged within 0.00001 |
| F/S/B while locked in isolation | Actual camera directions differ; lock remains active |
| Autorotate -> Lock | Rotation stops; toggle disabled; unlocked state does not resume it |
| Reload | Lock resets to false; saved Dark theme remains Dark |
| Reduced motion | Lock and Side preset remain functional with the existing reduced-motion system |

The right rail uses Three-quarter/Front/Side/Back, separator, Lock, separator, Autorotate/Speed. Dynamic titles/accessibility labels and pressed state identify lock; existing hit-target heights and focus styling remain. Reset stays in the bottom dock. No new cinematic motion or separate keyboard/camera controller exists.

Caption/dock clearance is exactly **14 px** on both models at 1440 x 900, 1440 x 700 and 1280 x 600. Caption remains displayed rather than hidden at the short height. The caption observer changes only overlay layout, not camera fit or explosion behavior. Existing assembled/isolation captures cover the relevant variants; broader new explosion/open-panel combinations were waived at cutoff.

## Technical regressions and integrity

| Check | Final result |
|---|---|
| `npm.cmd run check` | Pass |
| `npm.cmd run build` | Pass; existing large-chunk/plugin-timing warnings remain |
| Full Node tests through Phase 5.4 + new shortcut tests | **195/195 pass** |
| Female enhancement Python runner | **3/3 pass** |
| Male / HRA / female-study geometry/topology validators | Pass: 2,234 / 888 / 2,245 parts |
| All-model interaction / female joint validators | Pass |
| Identity validator and generator `--check` | Pass |
| Region validator and generator `--check` | Pass |
| Teaching Area validator and generator `--check` | Pass |
| Area scopes validator and generator `--check` | Pass |
| Coverage / chest / category / readiness unit tests | Pass in full Node suite |
| Canonical source coverage audit | Pass in isolated baseline-byte workspace |
| Female readiness | Expected exit 1: **integrityPassed true; ready false** |
| Protected inputs | **152/152 unchanged**, including **85 geometry binaries/compressed files** |
| Package-lock / dependencies | Unchanged |
| Git whitespace/diff check | Pass |

Technical logs are under `work/phase-5.5/technical-*.log`, `final-node.log` and `final-build.log`. The first ad hoc identity-generator command used a nonexistent Python filename; the correct retained `scripts/generate-core-contracts.mjs --check` completed successfully and its corrected log is authoritative. Direct coverage generation refused the Windows CRLF source checkout because its frozen source checksums pin LF bytes. Git-filter-aware integrity confirms unchanged source. The same audit passed against exact starting-commit source bytes copied into `work/phase-5.5/canonical-coverage/`; generated coverage stayed in that isolated folder and no canonical workspace output changed. No checksum gate was weakened.

Protected comparison in `work/phase-5.5/integrity-report.json` uses `git hash-object --path` against the exact starting commit, respecting the repository's Windows checkout filters. Model binaries, manifests, canonical identity, Regions, Area memberships/scopes, scientific source files and package-lock all match. Female readiness accurately retains independent-review/coverage/placement limits; presentation code changes invalidate the old review digest without weakening integrity. No anatomy/system classification is corrected in this phase.

## Browser regression cutoff

Completed final commands: **4/4 pass** — focused final-ui, Regions, Teaching Areas and hide/restore; each covers both public desktop model routes. Regions/Areas include actual selection, systems, isolate, explode, reset and model switching. The focused final-ui run covers the new behaviors above.

Viewer-polish and viewer-interaction were running when the user requested the cutoff and were stopped; they are **incomplete, not passed**. Retained Area scopes, discovery, presentation, explosion, isolation-workspace, stabilization, motion and full scene-floor browser suites had not begun and are **waived for this delivery**. Their automated helper/data/unit suites passed; prior phase browser records are historical evidence only, not new Phase 5.5 passes. No further testing is required under the user's revised instruction.

## Acceptance and limitations

Original acceptance groups 1-74 are implemented, with the focused desktop observations above and residual broad visual combinations explicitly waived. Regression/data/non-goal criteria are backed by all automated tests and protected comparisons. Original criterion 94 and the full-regression browser requirement are not claimed as fully completed; the user's minimal-desktop cutoff replaces that validation boundary. All requested product changes are complete and approved for branch-only push under that boundary.

Known limits: desktop-only minimal visual acceptance; no physical touch/mobile/tablet or assistive-technology certification; interrupted/unrun retained browser coverage; no independent scientific validation of female geometry/coverage; the established body-origin floor can be cropped in tight anatomical views; existing bundle warnings remain. UI engineering acceptance does not imply medical/scientific certification. The viewer is ready to move beyond this UI polish phase under the user's acceptance, with Phase 6 scientific validation still future work.

Created source/test files, modified-file inventory and palette details are in [PHASE_5_5_IMPLEMENTATION.md](PHASE_5_5_IMPLEMENTATION.md). Fourteen evidence PNGs and both records are included in the phase commit; no ignored browser profile/build output is committed. Commit/push uses only `phase-5.5/final-ui-polish`, leaving main unchanged.
