# Phase 5.72 validation and accepted handoff

Date: 2026-10-05. Starting main/phase SHA: `039c570bb137419b094ccb4339232abbf740b53d`. Implementation branch: `phase-5.7/context-reveal`.

## User-approved cutoff and destination

The user instructed **"call this pass good, do final cleanup/documentation and push main. no more testing"**. All additional testing stopped. The owned regression runner, its test Chrome tree and task Vite preview were stopped. Existing results/captures were retained without further visual inspection or tests. The instruction authorizes main delivery and supersedes the original phase-only push boundary.

This is an accepted handoff under that revised boundary. **Not every original exhaustive acceptance criterion is literally certified.** Three retained suites failed before cutoff; their causes remain unresolved. Interrupted/unrun coverage is waived, not passed. The implementation may proceed to separately authorized Phase 5.8 planning under user acceptance, with these regression limits carried forward. No Phase 5.8 work is included here.

## Completed technical results

| Check | Result |
|---|---|
| Required branch/status/history/tracking and live remote baseline | Clean expected branch, exactly main with reviewed Phase 5.71 SHA |
| All current Node test files | **242/242 passed**, 27 files; includes 17 new Reveal groups and actual wheel-handler regression |
| TypeScript check | Pass in completed run |
| Production build | Pass in completed run; existing large-chunk/plugin-timing warnings |
| Male / HRA / female-study atlas validators | Pass: 2,234 / 888 / 2,245 parts |
| All-model interactions / female joints | Pass |
| Identity validator / generator check | Pass |
| Regions validator / generator check | Pass |
| Areas validator / generator check | Pass |
| Explicit Area scopes validator / generator check | Pass |
| Python female enhancement runner | 3/3 pass |
| Source coverage | Exact baseline LF inputs reproduced canonical report; 20 targets, 12 not separately identified female-study representations |
| Female readiness | Expected exit 1: **integrityPassed true; ready false** |
| Protected inputs | **152/152 unchanged**, including **85 binary/compressed geometry files** |
| Retained Phase 5.71 diagnostic | Complete, zero runtime/console/interception errors |

Typecheck/build and the all-Node run preceded the final one-line Search/Browse policy refinement (explicit concept selection exits Reveal even for the same subject). The final focused browser matrix exercised that refinement successfully. Those commands were not repeated after the user stopped testing; no final post-cutoff build/check is claimed.

The direct source-coverage runner initially rejected `isa_parts_list_e.txt` because the established Windows checkout newline conversion differs from its pinned raw checksum. Exact starting-main source blobs were exported into ignored `work/phase-5.72/coverage/`, audited there, and the resulting report compared structurally equal to the canonical baseline. No canonical source/checksum gate was rewritten. Female readiness still reports unresolved independent review and a presentation-code digest mismatch; it was not weakened or marked ready.

Protected comparison used the established 152-file inventory and `git hash-object --path` against exact starting main. [Integrity report](phase-5.72-evidence/protected-integrity.json). Scientific datasets, geometry, memberships/scopes, mappings, classification and package-lock are unchanged.

## Focused production-feature browser matrix

The final local Chrome/CDP suite **passed 37 named checks with 12 structure/theme records**, at 1440 x 900. It used actual WebGL, UI actions and the existing optional model-context selection interface. Browser-only dev-module interception exposed state/resources for observations and deterministic robustness fixtures; no production window test hook was shipped. The agent-browser CLI was unavailable, so the established repository CDP pattern was used with normal authorized Chrome GPU/process access.

Final report: [Reveal report](phase-5.72-evidence/reveal-report.json). It contains **zero application runtime exceptions, zero console errors and zero interception errors**. Intermediate harness failures were superseded by this completed focused run: native Enter simulation, ghost probe sampling, settled camera floating-point tolerance, real model-menu routing and normal Display popover outside-dismissal were corrected. Camera matrices are compared at a strict 1e-10 tolerance after settling; other state/texture/layout comparisons remain exact.

| Behavior | Completed evidence |
|---|---|
| Liver hero | Actual Search result starts normally; explicit entry/exit preserves camera, systems, Hidden, scope, explode, layout and floor |
| Six Light targets | Liver, Heart, Brain, left kidney, abdominal aorta, bilateral scaphoid |
| Representative Dark | Liver, Heart, Brain, abdominal aorta |
| Multipart target identity | Liver 60, Heart 83, Brain 59, scaphoid 2; every displayed selected part matches dedicated mask |
| Target and ghost picking | Real overlapping triangle ray selects target over nearer context; ghost ray away from target selects context and exits |
| Same member / different subject | Same direct selected-member pick can retain mode; different member/concept/ghost exits |
| Partial Hidden | Existing state setter establishes a partially hidden selected fixture; hidden member has neither visibility nor target-mask bit |
| J / H | J restores that member as target without reselecting; H hides selection and exits |
| Eye / individual system switch | Eye preserves subject and established selection exception while ordinary context disappears; individual switch exits through existing selection cleanup |
| Persistent isolation | Child opaque, displayed workspace remainder ghosted; no full-body geometry returns; surrounding/narrow actions exit safely |
| Random | Unhighlighted root has disabled Reveal; actual inspected member can reveal only within preserved Random workspace |
| Explode | 0%, 30%, 50%, 100%; unchanged base GPU state/XYZ offsets, layout key, percentage and camera on entry/exit |
| Camera | User orbit, Front/Side/Back/three-quarter presets and lock; camera-only preset retains Reveal; orbit causes no mask upload |
| Display | Brightness 1.3 and contrast 1.15 verified while active; reset and both live theme directions preserve mode |
| Floors | Classic, Minimal, Grid, Scanner, Orbital, Event Horizon, Void remain independent |
| Region / Area | Navigation exits; explicit Area-member context stays within its representation scope |
| Female-study | Liver and Heart multipart subjects work in Dark; male-to-female and female-to-male clear state and mask |
| Escape / clear | Closing inspector retains accessible caption Exit reveal; clear selection exits |
| Reduced motion | Immediate entry/exit works |
| Resource / mask lifecycle | Twelve cycles across three subjects: stable warmed resources; one mask upload on entry, none at idle; original normal material objects and zero mask bytes restored on exit |

Opacity comparison captured Liver and Heart at **0.08, 0.10, 0.15, 0.20** before cutoff. Selected final value is **0.08**: lowest tested candidate retains a readable anatomical silhouette/vessel/skeleton context while reducing front-layer wash over opaque targets. No strength slider is exposed. Standard lighting/teal selection is retained; target is not an always-on-top overlay.

## Measured draw counts and resources

| Target | Normal | Reveal | Selected parts |
|---|---:|---:|---:|
| Male Liver, close framing | 71 | 74 | 60 |
| Male Heart | 71 | 69 | 83 |
| Male Brain | 71 | 71 | 59 |
| Male left kidney | 71 | 67 | 1 |
| Male abdominal aorta | 71 | 67 | 1 |
| Male scaphoid | 75 | 72 | 2 |
| Female-study Liver | 70 | 81 | 60 |
| Female-study Heart | 70 | 73 | 83 |

Whole-body Liver including floor draws was 75/78. The 71/74 close-framed result is broadly consistent with the audit's 71/77 sanity reference; pruning also excludes wholly invisible and target-only context batches. Counts are whole-scene submitted draws, not isolated visible-triangle counts. No portable FPS or low-power-device budget is claimed.

Stable warmed male resources across 12 cycles were 71 resident render geometries, five textures, eight programs and 138 anatomy objects. Masks are 16 KiB for the routed models, sparse CPU membership changes and one observed upload per recorded entry. This demonstrates bounded repeated-cycle ownership, not unlimited stress testing. Last completed build viewer-chunk delta: +5,239 raw bytes; existing-artifact gzip recompression +1,779 bytes. No dependency/lockfile upgrade occurred.

## Retained browser regressions at cutoff

Ten completed suites passed: **Regions, Areas, hide/restore, viewer polish, viewer interaction, explicit Area scopes, discovery, presentation, stabilization, scene floors**. Each suite's desktop mode was requested where supported; no exhaustive new mobile/touch certification is inferred.

Three completed attempts failed and remain **unresolved, not passed**:

- Explosion: `Slider preserves camera orientation` assertion.
- Isolation workspace: male Abdomen and Pectoral Girdle checkpoints passed; female fixture stopped with `No visible mesh picked: female 1440`.
- Motion: CDP `Page.captureScreenshot` timeout.

No baseline reproduction or further diagnosis was performed after the cutoff, so these are not asserted to be exclusively harness or pre-existing issues. **Final UI** was interrupted while running. **Bug sweep, spatial cleanup, microinteraction and shell cleanup** retained suites were unrun by that runner. Those remaining checks are user-waived for this handoff. [Retained summary](phase-5.72-evidence/regression-summary.json).

The passing new Reveal suite does cover actual explode offsets/entry/exit, isolated and Random member selection, and reduced-motion switching; it does not substitute for the failed/uncompleted exhaustive retained suites. Physical touch, independent assistive technology, low-power GPU, and exhaustive mobile/tablet/rear-view transparency certification are not claimed.

## Existing retained visual evidence

27 previously captured PNGs are copied unchanged under `phase-5.72-evidence/`. They were not re-inspected after testing stopped.

| Scenario | Capture |
|---|---|
| Actual hero normal / Reveal | [Normal](phase-5.72-evidence/liver-whole-normal.png), [Reveal](phase-5.72-evidence/liver-whole-reveal.png) |
| Liver close / restored normal | [Reveal](phase-5.72-evidence/light-liver-reveal.png), [Normal](phase-5.72-evidence/light-liver-normal.png) |
| Heart / Brain | [Heart](phase-5.72-evidence/light-heart-reveal.png), [Brain](phase-5.72-evidence/light-brain-reveal.png) |
| Kidney / deep vessel / wrist | [Kidney](phase-5.72-evidence/light-left-kidney-reveal.png), [Aorta](phase-5.72-evidence/light-abdominal-aorta-reveal.png), [Scaphoid](phase-5.72-evidence/light-scaphoid-reveal.png) |
| Dark | [Liver](phase-5.72-evidence/dark-liver-reveal.png), [Heart](phase-5.72-evidence/dark-heart-reveal.png), [Brain](phase-5.72-evidence/dark-brain-reveal.png), [Aorta](phase-5.72-evidence/dark-abdominal-aorta-reveal.png) |
| Isolation / Random / explode | [Isolation](phase-5.72-evidence/isolation-reveal.png), [Random member](phase-5.72-evidence/random-member-reveal.png), [Explode](phase-5.72-evidence/exploded-reveal.png) |
| Female-study | [Liver](phase-5.72-evidence/female-FMA7197-reveal.png), [Heart](phase-5.72-evidence/female-FMA7088-reveal.png) |
| Restored target member | [J restored](phase-5.72-evidence/restored-target.png) |
| Liver opacity range | [.08](phase-5.72-evidence/opacity-liver-0.08.png), [.10](phase-5.72-evidence/opacity-liver-0.1.png), [.15](phase-5.72-evidence/opacity-liver-0.15.png), [.20](phase-5.72-evidence/opacity-liver-0.2.png) |
| Heart opacity range | [.08](phase-5.72-evidence/opacity-heart-0.08.png), [.10](phase-5.72-evidence/opacity-heart-0.1.png), [.15](phase-5.72-evidence/opacity-heart-0.15.png), [.20](phase-5.72-evidence/opacity-heart-0.2.png) |

## Limits and acceptance

Merged transparent triangles cannot be independently sorted; intersections and accumulated ghost opacity remain angle-dependent limits, particularly for deep vessels. Opaque target members self-occlude normally. Existing FrontSide picker/body-surface exclusions remain; exact target priority does not invent hits where target triangles are absent.

Implementation, explicit UI, model-scoped masks, pruning, material/depth policy, composition and protected boundaries are complete. The user accepted the pass for main delivery despite the unresolved/waived validation above. It is therefore ready for the user's next separately authorized phase under that accepted boundary, **not a claim that all 114 original criteria or every retained suite passed**. No Marquee/Cinematic/HQ/scientific correction or Phase 6 work began. [Implementation and complete file inventory](PHASE_5_72_IMPLEMENTATION.md).
