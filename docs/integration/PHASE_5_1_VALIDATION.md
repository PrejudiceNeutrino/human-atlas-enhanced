# Phase 5.1 validation: isolation workspace and dissection

Date: 2026-10-04. Authorized branch: `phase-5.1/isolation-workspace`. Starting Phase 5.0 SHA: `0de072c9f2de425565ac9ef0a8d04c17a963a83b`. Main remains at Phase 4.9 SHA `c90224609a9bd338ba4cca4a3f9fd2642a7a573d`; the user explicitly waived the merged-main prerequisite and approved the Phase 5.0 commit as this branch's base. The untracked `.vscode/settings.json` is preserved outside the phase.

## User-amended final browser boundary

The user instructed: **"for any final tests you do just verify desktop browser, dont worry about mobile or tablet"**. Final browser acceptance is male and female desktop at 1440 x 900. Additional responsive testing was stopped immediately; mobile/tablet/short-landscape final acceptance is waived, not reported as passed.

`agent-browser` is unavailable. The repository's established dependency-free native Chrome/CDP harnesses are used, with native mouse/keyboard events, real projected mesh triangles, GPU visibility/selection/offset texture interception and renderer camera matrices. No production test hook is added. Sandboxed Chrome exited during GPU startup; ordinary authorized process access resolved launch. Owned loopback servers use dev port 3043 for baseline/development and production-preview port 3044 for final verification. Older workspace servers are neither reused nor stopped.

## Before-change evidence

`work/phase-5.1/baseline-complete/report.json` records a pre-production-edit audit on `0de072c`:

| Route / structure | Workspace | Direct example | Included example | After Clear | After H |
|---|---:|---|---|---:|---:|
| Male / Abdomen | 24 | Right external oblique | Right obturator internus | 2,217 | 2,216 |
| Male / Muscle Of Pectoral Girdle | 22 | Right pectoralis minor | Left pectoralis minor | 2,217 | 2,216 |
| Female / Abdomen Proper | 15 | Right psoas major | Left psoas major | 2,239 | 2,238 |
| Female / Muscle Of Pectoral Girdle | 22 | Right pectoralis minor | Left pectoralis minor | 2,239 | 2,238 |

Every direct/Included choice already retained all original scope pieces, updated inspection/highlight and preserved camera. None offered child narrowing. Clear/H returned to ordinary body context instead of retaining isolation. The source-level inspector-open camera-key dependency was also identified before modification.

Ordinary male Abdomen selection displays 2,218 pieces, including the reviewed selected exception; default ordinary body is 2,217. Female has no selectable exact Abdomen entry, so its available Abdomen Proper assembly is used without importing male geometry or fabricating membership.

## Focused workspace browser acceptance

Development reports at `work/phase-5.1/focused-dissection/report.json` and `focused-final/report.json` complete all four routed workspaces with zero JavaScript exceptions. Final production evidence is `work/phase-5.1/regression-final/isolation-workspace/report.json`: four workspaces pass, zero JavaScript exceptions, maximum observed camera-matrix difference `0.0007109809666872025` during the native-orbit sequence. Non-orbit comparisons pass the tighter tolerance. Representative assembled active-child and 60% workspace screenshots were reviewed locally on both desktop routes; normal siblings and shaded teal active members remain clear and both transition actions are readable.

Each focused sequence verifies:

- Ordinary search leaves surrounding anatomy visible, followed by explicit Isolate structure and an exact current-model GPU membership mask.
- Three different real 3D member picks and a return to A preserve the original scope and camera; inspector/source reference and exactly one active GPU highlight match each pick.
- Native orbit and cursor zoom change the camera; repeated Included A/B/C/A inspection then preserves that view. Active Included rows expose their pressed state. Exact Left Serratus Anterior is inspected/hidden/restored in both pectoral workspaces.
- H/h hides selected members, clears active highlight/inspection, updates Hidden count/history, retains scope and excludes hidden members from real picking. Restore returns them inside the same workspace without selecting them.
- Multiple members are hidden individually and individually restored. Hiding the entire original selection creates a valid empty workspace; Restore all returns exactly its original membership, without ordinary surroundings or camera refit.
- Clear selection preserves all workspace geometry and removes every GPU highlight. Exit remains reachable without an inspector. Background clicks retain their established no-op behavior; another direct pick reopens inspection without reframing.
- At 60% explode, repeated inspection preserves the complete real GPU offset/visibility buffer. Hide legitimately removes eligibility; restore reconstructs the identical deterministic offsets. No selection-driven packing/family-stage jump occurs.
- Explicit child Isolate structure narrows to one current-model representation; separate Show surrounding anatomy explicitly restores ordinary context. Discovery remains the reviewed explicit navigation exit, and model switches clear scope/hidden IDs in both directions.

Camera comparisons without native orbit use matrix tolerance `1e-5`. The native-orbit sequence waits for stable samples and uses `0.002` to accommodate residual OrbitControls damping under concurrent Chrome workloads; actual maximum differences are recorded in the final focused `cameraDeltas` array. The pure camera-key tests independently assert exact equality across member, hide, restore, clear and inspector-open changes. This is a substantial-view-preservation check, not a claim that ongoing damping is frozen.

## Automated and scientific regressions

| Check | Result |
|---|---|
| `npm.cmd run check` | Pass on final production source |
| `npm.cmd run build` | Pass; existing large-chunk warning remains |
| Full Node unit suite through Phase 5.0 plus Phase 5.1 | 173/173 pass |
| Final focused helper regression after camera-key cleanup | 53/53 pass |
| New Phase 5.1 helper tests | 12/12 pass, all three registered identities |
| Python female enhancement runner | 3/3 pass |
| Male / HRA / female-study topology/buffer validators | Pass: 2,234 / 888 / 2,245 parts |
| All-model interaction and female joint validators | Pass |
| Core identity validator and generator `--check` | Pass |
| Region validator and generator `--check` | Pass |
| Teaching Area validator and generator `--check` | Pass |
| Explicit Area-scope validator and generator `--check` | Pass |
| Source/coverage audit in isolated ignored directory | Regeneration equals canonical baseline |
| Female readiness | Expected exit 1: integrity true, readiness false |
| Protected-file and dependency integrity | 152 files match base; 85 geometry binaries; dependency records unchanged |

Technical evidence: `work/phase-5.1/technical-results.json`, `technical-*.log`, `final-focused-unit.log`, `final-female-readiness.log`, `integrity-report.json` and final npm check/build tool output. The final female presentation digest is `da1e495a9581eb21fb91883bd15ed849773dab14f52a52f6f2ff4a87fe90b435`. No readiness gate or independent-review requirement is weakened.

The new unit groups assert explicit scope creation/replacement/exit, independent selected state, scope-reference preservation through repeated picks and dissection, exact visible/pick/packing exclusion, restore from an empty workspace, selection-only stable layout/key/targets, identical restored offsets, no camera-key effects from inspector visibility, navigation/discovery precedence, invalid/foreign model rejection and model-switch cleanup. Existing editable-control and multi-representation hide tests remain active.

## Final production browser regression record

All ten browser commands pass. Accepted summary: `work/phase-5.1/browser-accepted-summary.json`. The nine production commands use the fixed final build on port 3044, with no source changes/hot reload during acceptance. The retained Phase 5.0 explode harness requires unminified module URLs for its debugger cache-builder probes: its production attempt stopped at that instrumentation precondition, then the complete unchanged final-source desktop run passed on port 3043. Actual production explode composition is independently checked by the new workspace suite.

| Desktop browser command | Cases | Result |
|---|---:|---|
| Regions | 2 routed models | Pass |
| Teaching Areas | 2 routed models | Pass |
| Hide/restore | 2 routed models | Pass; keyboard guards, history, individual/all Restore, empty workspace, camera and female chest |
| Viewer polish | 2 routed models | Pass |
| Interaction/themes | 2 routed models | Pass; existing 22-piece assembly behavior preserved |
| Explicit Area scopes | 2 routed models | Pass; unchanged Lung roots and other frozen scopes |
| Anatomy discovery | 2 routed models | Pass; renderer identity, navigation and explicit clear/exit composition |
| Presentation/Display | 2 routed models | Pass; theme/display, loading/error/model-transition coverage |
| Staged explosion | 2 routed models | Pass; integer sweep, cache probes, camera/packing continuity |
| New isolation workspace | 4 workspaces across both models | Pass; direct/Included, exact serratus, H/Restore, clear, narrow/exit, camera and 60% offsets |

The retained commands produce 18 routed desktop case records; the new command adds four workspace records. All accepted reports contain zero application JavaScript exceptions. Reports/screenshots are under `regression-final/<suite>/`; the Area-scope report is copied there from its existing `SCOPE_OUTPUT` default `work/phase-4.7/browser`. The complete explode report is under `explosion-final-dev/`. Earlier failed or interrupted attempts remain separate and are excluded from the accepted summary.

Early development failures are retained separately and do not support acceptance. Older Region/Area/discovery harnesses initially asserted that Clear selection exited isolation; the retained tests now assert persistence and use explicit Show surrounding anatomy to continue. The old interaction harness expected exit text on the primary CTA; it now checks both distinct actions. A first focused test attempted Included selection after hiding had closed inspection; it now reopens inspection with a visible member pick. Camera sampling was adjusted for existing native damping. Development hot reload interrupted a renderer-identity assertion during an additional responsive run; final production assets are fixed throughout the acceptance run. Additional responsive checking was then stopped at the user's instruction.

## Integrity, limitations and phase boundary

All protected model/manifests/binaries, public/data identity, Regions, Areas/representation scopes, scientific anatomy evidence and lockfile match the approved base by Git-filter-aware blob hashes. The coverage audit uses exact committed source blobs in `work/phase-5.1/coverage-audit` to honor pinned checksums in this CRLF checkout and does not write protected outputs. No dependency version, scientific membership, geometry, readiness evidence or canonical navigation rule changes.

Female engineering integrity remains true and scientific readiness remains false. Internal HRA is tested at helper level and has no public route. Source mesh granularity and experimental female placement/independent-review gaps remain. Mobile/tablet/short-landscape final visuals are waived; physical touch, assistive-technology certification and controlled frame-time benchmarks are not claimed. The existing production bundle-size warning remains.

No later-phase work is implemented. Every Phase 5.1 engineering acceptance criterion is satisfied within the user's authorized base-SHA and desktop-only amendments. Criteria 1-14 are supported by baseline evidence and direct/Included regression; 15-32 by dissection/empty-workspace/clear/narrow/exit tests; 33-38 by camera-key, native orbit and exact GPU offset checks; 39-49 by retained navigation/model/female/readiness/highlight checks; 50-63 by the reviewed scope and protected-data diff; 64-66 by completed automated/browser regressions and these records. Original broader responsive final acceptance is waived, not claimed.

The repository is ready for separately authorized Phase 5.2 stabilization/utilities work. That phase has not begun. Main is not merged, modified or pushed; delivery is confined to the authorized Phase 5.1 branch.
