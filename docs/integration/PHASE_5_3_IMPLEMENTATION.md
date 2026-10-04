# Phase 5.3: signature entrance and interaction motion

Date: 2026-10-04. Branch: `phase-5.3/motion-polish`. Starting Phase 5.2/main SHA: `97244e969061f155412ea8f037133f5885384be9`. The starting tree was clean. The pre-created `phase-5.3/signature-motion` branch pointed to this same accepted endpoint; the requested branch was created from it without changing main. Local main, origin/main and live remote main match the starting SHA. History and implementation/validation records through Phase 5.2 were inspected. No donor merge or cherry-pick.

## Actual preceding behavior

Phase 4.9's retained motion starts the eyebrow at 0 ms, title at 35, metadata at 60, navigation at 90, Visibility at 130, utilities at 170, camera/footer at 210 and dock/caption at 240. All use 280 ms fades or 8 px translations. The title is ordinary text with the same upward entrance as other content. Discovery explicitly disables animation and transitions. Sheets retain the component library's 40 px side offsets; menus use its generic zoom animation. Selection changes the existing GPU selection texture immediately. The Phase 5.2 fixed circular stage appears together with the canvas.

The sound existing model readiness gate waits for all real chunk loads and one rendered complete frame before setting `sceneReady`. The canvas fades for 280 ms. Model switches fade out for 120 ms before the existing state/load/disposal path; the header stays mounted. Region, Area, isolation and slider semantics are already mature. The baseline production build and native Chrome/CDP presentation suite both passed before the presentation edits; snapshots under `work/phase-5.3/baseline/` show the waiting shell and final composition in both themes. No random independent mesh pop-in was observed after the shared readiness gate.

## Motion vocabulary and final user tuning

CSS owns timings for DOM and portal surfaces; `app/motion.ts` reads those tokens for the existing model transition and finite scene interpolation. No animation dependency or large state machine is introduced.

| Token | Final value / purpose |
|---|---|
| `--motion-fast` | 120 ms; selection interpolation and panel exit/model departure |
| `--motion-medium` | 180 ms; panel entry and theme surface transitions |
| `--motion-slow` | 280 ms; coherent anatomy fade and subsequent stage reveal |
| `--motion-brand` | 900 ms; wordmark signature |
| `--motion-stagger` | 80 ms; shell offsets |
| `--motion-caret-blink` | 2,000 ms; two finite finishing cursor blinks |
| `--motion-type-fast` / `--motion-type-slow` | 40 / 180 ms; quadratic character cadence ramp, complete in 1,671 ms |
| `--motion-entrance` | 480 ms; layout fades/slides |
| `--motion-shell` | 3,800 ms; remove all shell entrance work |
| `--motion-curve` | `cubic-bezier(.2,.7,.2,1)`; fast functional surface motion |
| `--motion-emphasized` | `cubic-bezier(.16,1,.3,1)`; wordmark solid resolve |
| `--motion-enter-curve` | `cubic-bezier(.22,.45,.35,1)`; gentler layout entrance |

The first visual version used a 600 ms wordmark and 280 ms layout entry. The user asked to lengthen the wordmark, approved its revised fade, then asked for less snappy, longer layout entrances. The final 900/480 ms timings implement that feedback. These longer decorative timings never postpone model readiness, state changes or direct manipulation. The shell timer allows the finishing cursor blinks to complete; layout fades finish by 1,440 ms and the cursor ends near 3,671 ms. No model-loading delay is introduced.

The user also requested a typed `INTERACTIVE ANATOMY` eyebrow. Nineteen decorative character spans use CSS stepped opacity, with a static quadratic ramp from 40 ms per character to 180 ms, with one screen-reader-only copy of the full text. A one-pixel decorative caret follows the active letter and blinks twice over 2,000 ms at the end, disappearing by approximately 3,671 ms. The user explicitly requested a slower typed eyebrow, then a faster-to-slower cadence ramp and two slower finishing blinks (500 ms visible / 500 ms hidden per cycle). There are no typing timers or loops. Reduced motion shows the complete text immediately.

## Signature and master shell timeline

`Human Atlas` stays a normal text link inside the existing heading. A positioned duplicate is explicitly `aria-hidden`, has no pointer events and takes no layout space. Supported browsers use a faint text stroke; others use ghost text. The ghost appears, the solid text resolves over it, and a small tracking adjustment settles to the original typography. The ghost returns to opacity zero. No hand-authored SVG, title replacement, font/dependency change or persistent seen-intro preference is used.

| Element | Start / finish from viewer mount |
|---|---|
| Background shell | Immediate |
| Eyebrow | 0 / 1,671 ms; 19-character type-in |
| Ghost and solid wordmark | 0 / 900 ms |
| 3D badge | 400 / 880 ms |
| Metadata | 480 / 960 ms |
| Model/Region/Teaching Area rail, as one unit | 480 / 960 ms; 6 px from left |
| Visibility | 560 / 1,040 ms; 6 px from left |
| Utilities and camera controls | 640 / 1,120 ms; utilities 6 px from right |
| Explode dock | 720 / 1,200 ms; 6 px upward |
| Caption/footer/help | 960 / 1,440 ms; opacity only |

The shell is independent of download duration. Ready anatomy starts resolving immediately even if the shell is still entering. During a slow load, the functional shell settles while the real preparation indicator remains. The dock stays usable without being held hostage by download completion.

All DOM entrances are scoped to `data-shell-settled=false`. One finite timer removes these rules at 3,800 ms. Keyboard focus reveals a focused group immediately without cancelling/restarting its animation. Hidden delayed groups have no pointer hit-testing; focus overrides their visual concealment. Semantics remain in the DOM. The top-level diagnostic presentation state is `shell`, `scene`, `settled` or `error`; settlement combines completed shell and stage work, with an explicit error override. Scope, selection, tabs, Display and model changes never reset the shell.

## Anatomy, loading and stage

The shared canvas opacity transition is retained instead of introducing per-mesh opacity animations, a scale gimmick or low-contrast anatomical ghost. All chunks are complete and the complete frame has rendered before `onReady`; no fixed artificial wait is inserted. The established material lighting, camera and framing stay unchanged. Selection still uses the original teal/shading shader and GPU texture.

The understated preparation card retains actual chunk-completion percentage. The header's status dot reflects preparation/readiness/error, and the 3D badge has a thin progress underline driven by that same real percentage. This is chunk completion, not simulated elapsed-time or byte progress. Error handling overrides entrance state and leaves an accessible, clickable Reload viewer alert. Successful later chunk callbacks cannot erase a preceding load error.

The restored Phase 5.2 stage/rim geometry, dimensions, material colors and origin are unchanged. It begins hidden, then fades in over 280 ms after the 280 ms anatomy fade. Three existing stage materials share one finite interpolation in the existing scene loop. Their final opacity is exactly one and original opaque rendering is restored. No plane, floor style chooser, radial mesh modification, extra render pass or looping environment is added. Stage work stops at settlement and does not affect pickers, anatomical bounds, navigation or explosion layouts. A new model scene gets its own short scene/stage resolve; the application intro stays settled.

## Interaction surfaces and state

Discovery, Display, rotation speed and selector menus use opacity plus 4 px translation/0.98 scale around their existing trigger origin. Inspector and Info use a 6 px right-to-left entrance. Entry is 180 ms; exit is 120 ms. Existing Base UI starting/ending attributes retain closing surfaces and preserve focus/scroll/unmount behavior; closing surfaces release pointer events. Explicit CSS properties replace generic animation behavior for these viewer surfaces.

The inspector container remains mounted when another structure is selected; its entrance does not replay. Details update directly, avoiding an added content flash or delay. The existing keyed details scroller and Info reopen-at-top callbacks remain intact. Systems/Hidden content gets only a short opacity resolve. Counts remain ordinary values, with no odometer. Toggles update immediately.

Only changing selection bytes are interpolated over 120 ms in a sparse map within the existing renderer frame loop. Both selection and deselection reach exact final bytes; interruptions begin from the current value. No geometry rebuild, new material program, mesh timer or selected-ID mutation is introduced. Hidden visibility still wins immediately, so deselection cannot reveal hidden geometry. Reduced motion sets selection bytes immediately.

Male/Female switching retains the existing 120 ms departure and immediate destination readiness-driven 280 ms resolve. The header/document remain stable and no camera swoop is added. Region/Area changes use existing navigation/framing without a canvas fade. Random Anatomy uses ordinary selection, explicit isolation and camera framing. Isolation workspace scope and active member stay independent; member inspection never starts scene/brand motion. Explosion offsets continue to track the direct slider value in the same frame; its mathematical/layout/cache contracts are unchanged.

## Theme, accessibility and performance

An early guarded document-head script applies stored Dark and its background before the application module loads. The existing theme controller removes that temporary inline background when taking ownership. Binary theme normalization, storage migration and Display settings remain unchanged. Surface background, text and borders use short explicit transitions; theme changes do not fade anatomy or reset entrance. No global `transition: all` is introduced.

Reduced motion disables ghost, tracking, staggering, slides, portal transforms and decorative stage interpolation. The shell and stage settle promptly. Manual orbit, zoom, selection, isolation and explosion remain functional. Changing the preference during entrance resolves remaining stage/selection work immediately. No semantic content is hidden for animation, and decorative text is excluded from assistive output.

CSS handles DOM motion. Scene motion reuses refs, the existing frame loop, dirty rendering and selection texture; no React updates occur per interpolation frame. Floor values mark the renderer dirty only when changing, and the finite stage branch stops after completion. Cleanup disposes the original scene resources and cancels the shell timer/listener. There are no new shaders, postprocessing, framebuffers, shadow maps, render targets or per-mesh timers. The React best-practices review checked ref-based transient values, effect cleanup, finite work, stable inspector identity and accessible duplicate text.

## Deliberate non-goals and handoff

No geometry, manifest, identity, Region, Teaching Area membership/scope, scientific status, utility semantics, navigation architecture, dependency version or lockfile changes. No redesign, animated floor presets, new nerves/anatomy, HRA upgrades, knowledge, pathology, pharmacology or later-phase work. The only retained-harness adjustment waits for the actual settled-shell signal rather than a historical fixed delay and recognizes that an intentionally hidden loading stage produces no camera shader uniforms. See `PHASE_5_3_VALIDATION.md` for exact evidence and limits. Commit/push is restricted to this phase branch; main remains unchanged.
