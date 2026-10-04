# Phase 5.2 validation: stabilization, utilities and hygiene

Date: 2026-10-04. Authorized branch: `phase-5.2/stabilization-hygiene`. Starting Phase 5.1/main SHA: `15c124349e60807e633c296c2527e363c7d13e06`. Live GitHub and local main were verified at this SHA. No merge into main, protected-data edit, dependency upgrade, history rewrite, LFS migration or branch deletion is performed.

## Validation method and scope

The installed agent-browser skill was read; the executable is unavailable, so the established dependency-free native Chrome/CDP harnesses were used. Sandboxed Chrome GPU startup exited with 2147483651; normal authorized process access resolved launch. Development port 3052 and fixed production preview port 3053 belong to this phase; unrelated servers are left alone. Test instrumentation captures actual GPU visibility/offset/selection data and camera matrices, without production test hooks.

Final browser checks use both public desktop routes at 1440×900, following the prior desktop-only final-validation preference documented in Phase 5.1. Physical touch, mobile/tablet final visual certification and assistive-technology certification are not claimed. Reset's actual target dimensions and native keyboard/mouse behavior are verified. Internal HRA remains covered through all-model helper/model validators, without creating a new public route.

## Focused Phase 5.2 acceptance

Development `work/phase-5.2/focused-2/report.json` and production `work/phase-5.2/regression/stabilization/report.json` pass both routes, with zero JavaScript exceptions. Production speed samples show roughly 0.14 rad at 1× versus 0.42 rad at 3× over equivalent 900 ms windows. The suite verifies:

- Functional autorotate toggle, faster calibrated default, native slider End/Home range changes, live increased angular rate, saved values after Reload and malformed-storage fallback. Manual camera behavior is also retained by the workspace/explosion regression suites; no sensitivity/damping values changed.
- Real ordinary H A/B/C followed by J C/B/A, matching the actual newest-first Hidden IDs. Empty J is safe. Real Search input and contenteditable focus reject J. Unit guards additionally reject all editable roles, modifiers/composition/repeats.
- Random creates an explicit active-model workspace. Deterministic first result on both routes is Vascular Tree, seven pieces. Entire-workspace H reaches zero visible pieces, three J presses return exactly three original members, and Restore all returns the identical original GPU buffer/camera. A second deterministic Random avoids the prior DiscoveryEntry.
- Info opens at scrollTop zero and focuses the title; scrolling to 350 followed by a theme rerender retains position. Close/reopen returns to zero.
- Restore all hidden remains visible in both tabs and at Hidden list top, midpoint and bottom with 59 hidden Brain representations. Zero-hidden state stays disabled in the same footer; per-row Restore and source order remain unchanged.
- Canonical bottom Reset is 48×56 px, supports native keyboard/mouse activation and compact hover/focus. The duplicate rail Reset is absent.
- Top-right utilities all measure 44 px tall in the documented order.
- A projected point on the actual stage produces no anatomy hover or inspector/piece-count change. Stage helper tests verify filled finite geometry, rim, theme colors, sub-zero top surface and disabled raycast.
- Light/Dark whole-body, front and oblique views; Shoulder Region, Heart Area; 22-piece pectoral isolation; single clavicle isolation; full explosion and reset. Anatomical bounds, masks, caches and layout keys remain independently verified by the retained suites. Close-up isolation can crop the fixed body-origin floor; it never changes the anatomical camera fit.
- Native discovery input/result keyboard selection and Escape, with the complete aliases/ranking/Browse/A–Z/largest/smallest/System filter coverage in the retained discovery suite.

## Visual evidence

The supplied old desired and current regression screenshots are the request's reference evidence. They are available in the conversation; no separate source image files were supplied on disk. The live pre-fix screenshot establishes the actual starting build. Curated PNGs are committed with this record; full per-model/context captures remain ignored under work.

| Comparison | Evidence |
|---|---|
| B: actual pre-fix faint outline | [Before Light](phase-5.2-evidence/classic-before-light.png) |
| C: restored bounded Light surface and shallow rim | [After Light](phase-5.2-evidence/classic-light.png) |
| D: restrained visible Dark stage | [After Dark](phase-5.2-evidence/classic-dark.png) |
| Oblique perspective/depth | [Oblique](phase-5.2-evidence/classic-oblique.png) |
| Search input hierarchy and one focus border | [Search](phase-5.2-evidence/search-focused.png) |
| Many hidden structures, list top | [Hidden top](phase-5.2-evidence/hidden-top.png) |
| Same footer at list bottom | [Hidden bottom](phase-5.2-evidence/hidden-bottom.png) |
| Compact Reset hover | [Hover](phase-5.2-evidence/reset-hover.png) |
| Compact Reset keyboard outline | [Focus](phase-5.2-evidence/reset-focus.png) |

The restored stage recovers finite floor area, a clear terminating circumference, visual grounding below the feet and shallow perspective depth from the supplied old concept. It uses less diameter/contrast than the old platform, keeps the normal background outside the circumference and does not restore the warehouse-like broad ground. Search retains simple rows and one results scrollbar, with lighter tabs and clearer control/context spacing.

## Automated and scientific regression

Evidence: `work/phase-5.2/technical-results.json` and its `technical-*.log` files.

| Check | Result |
|---|---|
| TypeScript / `npm.cmd run check` | Pass |
| Production / `npm.cmd run build` | Pass; existing large-JS-chunk warning |
| Full Node suite through Phase 5.1 plus Phase 5.2 | **183/183 pass** |
| New stabilization helpers | **10/10 pass**, including all three registered identities |
| Female Python enhancement runner | **3/3 pass** |
| Male/HRA/female-study buffer/topology validators | Pass: 2,234 / 888 / 2,245 parts |
| All-model interactions and female joint additions | Pass |
| Core identity validator/generator --check | Pass |
| Region validator/generator --check | Pass |
| Area validator/generator --check | Pass |
| Explicit Area-scope validator/generator --check | Pass |
| Female readiness | Expected exit 1: **integrityPassed true; ready false** |
| Protected-file integrity | **152/152 match** starting Git blobs; 85 geometry binaries |
| Public runtime copy integrity | **94/94 files byte-identical** in dist |
| Dependency versions / package-lock | Unchanged |

Current technical readiness digest: `f13d20549abe9df458b48d2b435b5e19e0e37af322d811818a86ddcfcd89fa61`. Presentation changes invalidate old scientific review evidence as designed. Existing independent-review, pose, anatomy placement and named core/pelvic-coverage gaps remain; no readiness gate is weakened.

## Retained desktop browser regressions

All retained commands are run against production port 3053, except the Phase 5.0 explosion harness, whose debugger builder-cache probes require unminified modules on final-source dev port 3052. Actual production explosion is independently exercised by the focused and workspace suites. Reports are under `work/phase-5.2/regression/<suite>/`, except the accepted interaction rerun at `interaction-final/`. All eleven commands pass, with 20 retained routed cases plus four isolation workspaces, and zero application JavaScript exceptions.

| Suite | Cases | Current result |
|---|---:|---|
| Regions | 2 routes | Pass |
| Teaching Areas | 2 routes | Pass |
| Hide/restore | 2 routes | Pass |
| Viewer polish | 2 routes | Pass |
| Interaction/themes | 2 routes | Pass; accepted rerun at `work/phase-5.2/interaction-final/` |
| Explicit Area scopes | 2 routes | Pass |
| Anatomy discovery | 2 routes | Pass |
| Presentation/Display | 2 routes | Pass |
| Isolation workspace | 4 workspaces | Pass |
| New stabilization | 2 routes | Pass |
| Staged explosion | 2 routes | Pass |

Early attempts are not acceptance evidence. One focused attempt sent Home without re-focusing the reopened speed slider; correcting test focus made the complete suite pass. The old interaction test read Show all systems from the footer, where the user explicitly requested Restore all hidden; the assertion now checks the contextual `.systems-global-action` location while retaining its system/dissection behavior checks. Failed attempts remain separate for inspection.

## Repository footprint and safe cleanup

Measurements are logical bytes; MiB=1,048,576 and GiB=1,073,741,824. Before audit: `work/` 15.077 GiB; node_modules 549.50 MiB; .git 466.35 MiB; dist 248.74 MiB; public 247.52 MiB; docs 26.46 MiB; data 14.23 MiB. Total local folder and final after-cleanup measurements are recorded in the final section. Current starting tracked content is **423 files / 303,855,084 bytes (289.78 MiB)**, distinguished from ignored output and historical Git objects.

The initial `clean:work -- --apply` removed **10,532,648,642 bytes (9.810 GiB)** of inactive Chrome profiles from clean successful runs. Reports/screenshots, all failed-run profiles/evidence, research/coverage output, source/runtime assets, docs and Git metadata are retained. Default command is dry-run; explicit --apply revalidates the real-root paths, rejects links/escapes, checks active Chromium command lines and stops if process inventory fails. Sandbox process inspection initially returned Access denied, so cleanup used normal authorized process access; no safety check was bypassed.

Starting Git count-objects: count 117; loose size 493.20 KiB; in-pack 1,531; packs 2; size-pack 465.70 MiB; prune-packable 0; garbage 0; size-garbage 0. Largest historical blobs:

| Blob/path | Bytes | Classification |
|---|---:|---|
| pelvis-surface-views.svg revision 7259e49 | 7,755,119 | Generated scientific review figure, retained evidence |
| pelvis-surface-views.svg revision b463bdb | 7,754,686 | Historical scientific review figure |
| body-thoracic-context.bin.gz revision 7093d0e | 7,658,379 | Donor/history model geometry |
| body-shoulder-context.bin.gz revision d6b29eb | 7,574,296 | Donor/history model geometry |
| data/anatomy/z-anatomy/core-source.bin | 7,074,504 | Frozen scientific source geometry |

Full largest-30 list is `work/phase-5.2/largest-blobs.json`. No history is rewritten, refs/remotes/tags deleted or LFS added. Organizational deletion candidates are the merged historical origin Phase 0, 1, 2, 3, 4, 4.5, 4.6, 4.7, 4.8, 4.9, 5/explode-redesign and 5.1 branches. Active Phase 5.2 and all unmerged reference/donor branches remain. Donor remotes `upstream`, `wiiiimm`, `mvmt`, provenance tags and reference PR branches are preserved. Branch refs are not the cause of multi-gigabyte work caches.

`.gitignore` was verified for node_modules/.next/dist/out/coverage/outputs/work/Python caches, without ignoring public runtime content. The pre-existing Pylance exclusions are preserved byte-for-byte and added as the phase's editor settings. They affect editor analysis only.

## Build and deployment footprint

Final Phase 5.2 production build: **260,831,860 bytes / 98 files / 248.75 MiB**, versus pre-existing local dist 260,823,422 bytes, a growth of **8,438 bytes**. All 94 copied public files total **259,541,222 bytes** and match source content exactly. Models/sidecars account for the size; work, browser artifacts, docs, node_modules and source maps are not deployed. The old dist comparison is a local output snapshot, not a measured historical hosted deployment. Existing raw/gzip model pairs support the established loader/fallback and are not removed.

| Main build resource | Raw / gzip kB |
|---|---:|
| Viewer page JS | 871.02 / 243.06 |
| Entry JS | 200.13 / 63.67 |
| CSS | 218.84 / 34.73 |
| Largest static model: female-0.bin | 4,803,512 bytes |
| female-base-12.bin | 4,669,304 bytes |
| body-1.bin | 4,526,484 bytes |
| female-base-1.bin | 4,470,564 bytes |
| body-2.bin | 4,438,056 bytes |

Vite warns about the existing >500 kB JS chunk and reports CSS/resolve plugin timing. Neither warning is a build failure. No destructive or architectural size optimization is performed.

## Fresh clone and final acceptance

Source checkpoint: `50a258eaa36f58562ffa0d23045b99c57e39d146`. External clone: `C:\Users\mindo\AppData\Local\Temp\human-atlas-phase-5.2-fresh-20261004`. Method: true `git clone --no-local --branch phase-5.2/stabilization-hygiene . <external-temp-path>`, independent object transfer and checkout, not a worktree or copied working directory. Initial inventory verified node_modules/dist/work/build metadata were absent. No local environment file, untracked JSON, donor checkout or old output was provided.

Independent `npm.cmd ci` succeeded: 563 packages installed, 564 audited. The existing lockfile reports 22 advisories (1 low, 4 moderate, 17 high); dependency upgrades are explicitly outside this phase. Local npm allowScripts policy blocked install scripts for esbuild, sharp and workerd, without preventing the required application build/checks. No policy or dependency settings were changed to bypass that restriction.

Fresh-clone TypeScript, build, all model/data validators/generator checks, all **183/183 unit tests**, and **3/3 Python tests** pass. Female readiness gives the expected exit 1 with integrity true, ready false, and the same final digest as the original checkout. Evidence: `work/phase-5.2/fresh-results.json` and `fresh-*.log`. Root and fresh builds produce identical index/CSS/viewer asset filenames and bytes; final output is 260,831,860 bytes. The final metadata correction removed misleading `aria-keyshortcuts=J` from the Restore-all button: J restores one row, not all. It changes no viewer behavior and is included in the independently tested clone.

Fresh production preview owns port 3054. Independent runtime smoke from the clone's own browser harness covers both Male/female-study, Regions, Teaching Areas, Search, H/J, the fixed Hidden footer, persistent isolation, Random Anatomy, explosion, Light/Dark Classic floor, info scroll and Reset. The separate fresh discovery suite covers Browse, sorting/filtering, keyboard behavior and active-model inventory. Both complete suites pass on both routes, with zero JavaScript exceptions. Evidence: `work/phase-5.2/fresh-browser/report.json` and `fresh-discovery/report.json`. No local/untracked runtime dependency was discovered. The fresh clone is retained for review. The final follow-up commit changes documentation only; its production source is identical to the tested checkpoint.

Logical-byte audit after three cleanup runs, fresh smoke and the source commit:

| Measure | Before | After snapshot |
|---|---:|---:|
| Whole main workspace | Approximately 16.595 GiB (directory subtotal 17,817,878,394 bytes plus <1 MiB root files) | 7,944,328,815 bytes / 7.399 GiB |
| work | 16,188,376,149 bytes / 15.077 GiB | 6,305,998,290 bytes / 5.873 GiB |
| .git | 489,004,451 bytes / 466.35 MiB | 493,029,070 bytes / 470.19 MiB |
| public/runtime | 259,541,222 bytes / 247.52 MiB | Unchanged |
| dist | 260,823,422 bytes / 248.74 MiB | 260,831,860 bytes / 248.75 MiB |

Total deleted successful-run inactive profiles: **12,853,346,830 bytes / 11.971 GiB**; net working-folder savings are lower because this phase generated new reports/profiles and retained failed-run evidence. Current source checkpoint has 443 tracked files, 307,850,803 logical bytes (293.59 MiB); nine intentional evidence images total 3,916,021 bytes and account for most tracked/Git growth. These measurements include the completed fresh-smoke evidence and precede the final documentation-only commit. Fresh-clone disk usage is outside this workspace and is retained separately for review.

## Final acceptance and limits

Every Phase 5.2 engineering criterion is satisfied within the existing desktop-only final-browser preference. Evidence mapping:

| Acceptance criteria | Evidence |
|---|---|
| 1?6: autorotate | Calibrated mapping, independent controller/storage tests and measured live browser angular rate/persistence |
| 7?13: H/J and isolation | All-model ordering/guard tests; native ordinary H/J and zero/partial/fully hidden workspace GPU/camera checks |
| 14?15: information reader | Native reopen-top/focus test and preserved scroll during theme rerender |
| 16?32: Classic floor | Exact Git regression audit; bounded cylinder/rim tests; reviewed Light/Dark/oblique captures; source-only picker/bounds/layout arrays; retained navigation/isolation/explode tests |
| 33?47: Reset/visibility | Actual target hover/focus/keyboard checks; persistent footer at all scroll positions/both tabs; independent global Systems behavior and frozen-workspace restore |
| 48?59: discovery | Visual review plus complete native keyboard, aliases/ranking, active-model inventory, Browse/sort/filter and bounded virtual-rendering suites |
| 60?77: Random/top-right | Deterministic valid-model pool/no-repeat helpers; native Random?explicit isolation?H/J/Restore composition; measured utility geometry |
| 78?92: repository | Logical disk/Git/tracked/build audits; safe evidence-preserving cleanup; blob/branch classification; verified ignores/editor settings; all donor/provenance refs retained |
| 93?99: reproducibility | True independent external clone, npm ci, all unit/model/data checks/build and both routed production smoke/discovery suites |
| 100?110: regression | All eleven accepted desktop browser commands, all 183 unit tests, all scientific integrity/coverage checks, expected unresolved female readiness |
| 111?125: protection/non-goals | 152 protected files/85 binaries unchanged; lockfile unchanged; curated artifacts/docs only; strict later-phase diff review |

Known limits: female-study placement, coverage, pose and independent-review gaps remain; scientific readiness is false. Existing npm advisories and the >500 kB viewer JS warning remain without dependency/architecture changes. Final mobile/tablet/physical-touch/accessibility certification is not claimed; Reset dimensions and native mouse/keyboard functionality are covered. Close-up anatomical framing can crop the fixed body-origin stage, which deliberately does not influence bounds/camera. The original supplied reference PNGs are in the conversation only; the tracked pre-fix image is a live capture, not a fabricated copy.

The viewer/repository is ready for separately authorized **Phase 5.3 ? Signature Entrance, Motion Language & Interaction Polish**. No Phase 5.3/5.4, supplemental anatomy, nerves, HRA upgrades, knowledge, pathology or pharmacology work has begun. Main stays at `15c124349e60807e633c296c2527e363c7d13e06`. Final commit SHA and phase-only push status are reported in the delivery message, avoiding a self-referential commit hash in this record.
