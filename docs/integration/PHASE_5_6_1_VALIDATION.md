# Phase 5.6.1 validation and handoff

Date: 2026-10-05. Branch: `phase-5.6.1/spatial-cleanup`. Starting main/phase SHA: `7077a04bf688330e764614a18d9d7aca9938957f`. Final commit SHA is reported in the delivery message. Only this phase branch is authorized for push; main remains unchanged.

## User-amended acceptance

The user instructed: **"don't worry about other tests, just assume its good and push"**. Remaining browser checks and task servers were stopped. No new test or visual inspection was performed after that instruction. Documentation, exact diff review and branch-only commit/push complete the authorized handoff.

The final production matrix completed **Male Light, Male Dark and Female-study Light** checkpoint assertions. Female Dark was interrupted after Organs, Hip/Brainstem and default Explode captures; its remaining camera/Random/focus checks and final aggregate report are incomplete, not passed. Remaining retained browser suites, exhaustive mobile/tablet, physical touch and assistive-technology certification are waived under the user's instruction. The requested refinements are accepted for handoff within that revised boundary; not every original exhaustive visual criterion is literally certified.

## Technical checks completed before the cutoff

| Check | Result |
|---|---|
| `npm.cmd run check` | Pass, including final runtime source |
| `npm.cmd run build` | Pass, including final runtime source; existing bundle/plugin-timing warnings |
| All current Node test files, including new focused tests | **216/216 pass** |
| New spatial-cleanup unit groups | **13/13 pass** |
| Female enhancement Python runner | **3/3 pass** |
| Male / HRA / female-study geometry/topology validators | Pass: 2,234 / 888 / 2,245 parts |
| All-model interaction / female joint validators | Pass |
| Identity validation and generator `--check` | Pass |
| Region validation and generator `--check` | Pass |
| Teaching Area validation and generator `--check` | Pass |
| Explicit Area-scope validation and generator `--check` | Pass |
| Canonical coverage audit | Pass against exact baseline LF bytes in isolated task workspace |
| Protected inputs | **152/152 unchanged**, including **85 geometry binaries/compressed files** |
| Female readiness | Expected exit 1: **integrityPassed true; ready false** |

The full Node run precedes the final small assisted-view rail callback, world-fit translation and CSS focus override. Final type checking and production build include those refinements; the production matrix covers their behavior. No additional Node rerun was performed after the user's cutoff. Canonical data/dependencies/package-lock were never edited.

Logs are ignored under `work/phase-5.6.1/`: `all-node-final.log`, `focused-node.log`, `technical-summary.json`, `technical-*.log`, `technical-coverage.log`, `final-check.log`, `final-build.log`, `integrity-report.json`, and `featured.json`. Windows CRLF source handling uses Git-filter-aware protected hashes and exact baseline bytes for coverage; no checksum/readiness gate was weakened.

## Browser method and completed checkpoints

Agent-browser and verification skills were read. The CLI is unavailable, so the retained real Chrome/CDP/WebGL harness was used. Sandboxed Chrome exited before rendering; ordinary authorized process/GPU access rendered both models. Dev server used task port 3071. Final production build used fresh preview port 3072. Task servers/browser processes were stopped at the user cutoff.

Both-model startup validation completed with zero JavaScript exceptions. Final production checkpoint assertions completed on the three model/theme combinations listed above. No application exception was observed in those completed checks; the final aggregate exception report was interrupted and is not certified as a completed whole-matrix report.

| Area | Completed result |
|---|---|
| Whole Body / Skeleton | Captured on both models in both themes; accepted default camera composition retained; supporting feet meet the stage |
| Organs | Larger, centered, unclipped union-based fit on both models in both themes |
| Region centering | Both Light model routes: Head & jaw, Cervical, Thoracic, Lumbar, Hip, Elbow & wrist, Knee, Ankle & foot; both Dark routes: Hip capture |
| Area centering | Both Light routes: Orbit, Brainstem, Larynx, Brachial plexus, Hand, Foot; both Dark routes: Brainstem capture |
| Context caption | Shared 10 px dock clearance in assembled/focused/isolated/exploded views; 1280 x 600 captures completed for Male Light/Dark and Female Light |
| Switch cursor | Enabled pointer and unavailable default verified in completed matrices; geometry unchanged |
| Untouched Explode | 0 -> 1% reaches Front; continued changes do not restart it; return to zero retains Front |
| Camera intent | Manual orbit, Side/Back, dolly and lock assertions complete on Male Light/Dark and Female Light |
| Interruption | Native orbit during assist cancels it; resulting orientation remains under user control |
| Random root | Root inspector open with original colors, no selected GPU members, authoritative root name/count |
| Random child / clear | Included child selects one GPU member; camera/workspace preserved; clear falls back to root without highlight |
| H / J | Child hide reduces visible count by one; root inspector remains; newest restore restores count |
| Workspace exit | Show surrounding anatomy exits normally |
| Featured focus | No oversized outline; visible inset keyboard marker, 10 px padding in completed Light/Dark matrices |
| Spine | Canonical FMA13478 selected through ordinary search/selection, with no auto-isolation |
| Reduced motion | Zero-duration Front assist follows existing convention in completed matrices |

Manual-orbit preservation uses a 0.0005 direction-component tolerance because the established damping continues below its render-change threshold; this is under roughly 0.03 degrees, not an automatic orientation override. Other direct preset/Front checks use 0.00001 tolerance. Unit projection checks verify exactly preserved Region/Area fit distances and centered bounds for wide/asymmetric scopes.

Earlier development attempts corrected a malformed test-only bounds wrapper, disabled-cursor expectation, damping comparison, Random fixture's repeat-exclusion handling and the actual global focus-outline override. They are not counted as complete passing matrices. The latest production build and completed production checkpoints are the handoff evidence. The final browser runner is retained for later reuse; no subsequent run is required under the user's cutoff.

## Before/after evidence

The supplied Phase 5.6.11-.18 screenshots and the Phase 5.6 records establish the previous composition. No new old-version browser run was required. Previously Organs inherited the 4-unit body distance/0.68 target, Regions/Areas had a +97.5 px desktop offset, caption clearance was 14 px, eyebrow inset was 4 px, floor radius was 0.50 and Random closed the inspector. Final calculations and all fourteen canonical Featured IDs/counts are in [the implementation record](PHASE_5_6_1_IMPLEMENTATION.md).

Selected unchanged captures made before the cutoff are retained here:

| Checkpoint | Evidence |
|---|---|
| Male body, grounding, brand and stage | [Whole Body](phase-5.6.1-evidence/male-light-whole.png) |
| Male assembled Skeleton | [Skeleton](phase-5.6.1-evidence/male-light-skeleton.png) |
| Male Organs Light / Dark | [Light](phase-5.6.1-evidence/male-light-organs.png), [Dark](phase-5.6.1-evidence/male-dark-organs.png) |
| Female Organs Light / Dark | [Light](phase-5.6.1-evidence/female-light-organs.png), [Dark](phase-5.6.1-evidence/female-dark-organs.png) |
| Shared Region / Area composition | [Hip](phase-5.6.1-evidence/male-light-hip.png), [Brainstem](phase-5.6.1-evidence/male-light-brainstem.png) |
| Default assisted Front explosion | [Front explosion](phase-5.6.1-evidence/male-light-explode-front.png) |
| Male Random root / member | [Root](phase-5.6.1-evidence/male-light-random-root.png), [Member](phase-5.6.1-evidence/male-light-random-member.png) |
| Female Random root | [Root](phase-5.6.1-evidence/female-light-random-root.png) |
| Featured keyboard focus Light / Dark | [Light](phase-5.6.1-evidence/male-light-featured-focus.png), [Dark](phase-5.6.1-evidence/male-dark-featured-focus.png) |
| Canonical Spine selection | [Spine](phase-5.6.1-evidence/female-light-spine.png) |
| Short desktop caption / eyebrow | [1280 x 600](phase-5.6.1-evidence/male-dark-short.png) |

These captures are copied without editing or additional inspection after the cutoff. Dark/female frames alone are not substituted for interrupted interaction certification.

## Integrity, limitations and readiness

Protected hashes compare every declared input to starting commit `7077a04bf688330e764614a18d9d7aca9938957f` using checkout-filter-aware Git hashes. All 152 match, including 85 binary/compressed geometry assets. Source manifests, canonical identity, Region membership, Teaching Area membership/scopes, classification and package-lock remain unchanged. No scientific correction, donor merge, dependency upgrade or later-phase feature was introduced.

Grounding is a fixed presentation transform derived from the model's skeletal supporting minimum; source geometry remains immutable. Male/female Skeleton contact math passes independently. New side-by-side Front/Side floor-contact certification and every floor-preset/cross-scope visual combination were not completed before the cutoff. Existing floor eligibility/preset controller unit tests pass, but broad retained browser suites were not rerun.

Known limits: interrupted Female Dark interaction/final exception aggregate; unrun retained browser regression matrix; desktop-only visual acceptance; original bundle warnings; no independent scientific certification of female study anatomy. The engineering refinements are complete and accepted under the user's amended testing scope. Not every original validation criterion is literally satisfied. The viewer is handed off ready for the next requested Phase 5.7 work under that acceptance, while scientific readiness remains `integrityPassed: true`, `ready: false`. No Phase 5.7 or later work started.
