# Phase 5.72: Context Reveal / X-Ray

Date: 2026-10-05. Implementation branch: `phase-5.7/context-reveal`. Starting main SHA: `039c570bb137419b094ccb4339232abbf740b53d`, the reviewed Phase 5.71 audit. Branch/status/history/tracking and live remote main were confirmed before implementation. The checkout started clean and exactly at main, including the audit and accepted preceding phases.

The user subsequently instructed: **"call this pass good, do final cleanup/documentation and push main. no more testing"**. This supersedes the original phase-branch-only delivery instruction. Testing stopped; the accepted implementation is delivered to main. Exact final SHA is reported in the delivery message. See [validation and cutoff](PHASE_5_72_VALIDATION.md) for completed evidence and unresolved/waived checks.

## Architecture

The frozen [Phase 5.71 recommendation](PHASE_5_71_REVEAL_ARCHITECTURE.md) is followed: explicit activation, a dedicated model-bound target mask, opaque selected targets, and low-opacity already-visible non-target context. No camera-space blocker detector, anatomical heuristic, geometry extraction/rebuild, per-frame raycast, postprocessing or new dependency is introduced.

`app/context-reveal.ts` owns the presentation subject and pure entry/exit/reconciliation helpers. `SceneState.contextReveal` is absent when off; when on it contains `{mode:'context', modelId, targetRepresentationIds}`. The subject is an ephemeral snapshot of the resolved current selection, not a Hidden set or frozen isolation workspace. It is never persisted in the URL or localStorage.

Entry converts current selected source parts through the active IdentityIndex, rejecting unknown, foreign, unavailable, empty and missing-chunk representations. It requires a displayed target and UI scene readiness. All valid selected members are included, including explicitly hidden members in the logical subject; hidden members have no rendered mask bit. Their membership is retained so restoring one returns it to the target pass without reselecting or unhiding it on entry.

`app/context-reveal-renderer.ts` creates one nearest-filtered, no-mipmap, NoColorSpace RGBA Uint8 DataTexture using model-local atlas indexing. Its R byte is 255 for currently displayed targets and zero otherwise. Male/female-study width is 4,096, or 16 KiB CPU data plus GPU storage/driver overhead. This mask is independent of the animated selection texture and the existing Float32 offset/visibility texture.

The scene still merges original geometry by chunk/material category. Loading retains each batch's part indices as small metadata, rather than scanning vertices when the subject changes. Each batch has its original mesh plus one bounded context wrapper sharing the same BufferGeometry. Target/context material variants are cached by original shared material; there is no material per representation. Compile callbacks and program keys are explicitly installed on clones.

One scene render uses Three's opaque and transparent queues: **opaque target geometry first, transparent ghost context afterward**. This retains front ghost overlays and rejects ghosts behind target depth. It is two anatomical presentation passes within one `renderer.render`, not two full-scene renders or an always-on-top target overlay.

## Material and depth configuration

| Property | Target | Context |
|---|---|---|
| Effective alpha | 1.0 | **0.08**, shared shader uniform |
| Material opacity property | 1 | 1; shader supplies effective ghost alpha |
| transparent | false | true |
| depthTest | true | true |
| depthWrite | true | false |
| side | DoubleSide | DoubleSide |
| forceSinglePass | false / ordinary opaque draw | true; avoids separate transparent back/front draws |
| renderOrder | Original batch order, currently 0 | Same original batch order, currently 0 |
| blending | NormalBlending | NormalBlending |

Both variants retain original system/source color, roughness .53, metalness .08, lights, environment, exposure, ACES/sRGB and shared contrast processing. Target selection retains the animated teal diffuse mix. Context explicitly suppresses selection-color mixing and uses the ghost alpha, so fading old selection bytes cannot make non-target context opaque/fully teal.

Both shaders first obey the existing visibility discard. The target pass then discards non-targets; the context pass discards targets. Target draws are disabled for batches without a displayed target, and context draws are disabled for batches without displayed non-targets. Whole merged batch vertices are still submitted where a pass is needed; fragment pruning is not target-only geometry extraction.

On exit, original material objects and normal visibility flags are restored, context wrappers are disabled, and mask bytes clear. The mask is marked for update only when membership changes; a cleared, unused mask need not upload while normal shaders do not sample it. Idle/orbit frames do not upload it. Visibility revisions invalidate pass membership; unchanged target bytes do not cause another texture upload. Model disposal removes wrappers and disposes cached variants and the mask through the original scene lifetime.

## UI and lifecycle

The inspector adds a text action next to the independent Isolate action: **Reveal in context**, changing to **Exit reveal** with native button semantics, `aria-pressed`, descriptive title and existing secondary-action styling. It is unavailable without a valid displayed selection/readiness. Closing the inspector retains the subject and exposes Exit reveal beside the scene caption.

The viewer's functional state-update wrapper reconciles the presentation subject after complete actions. Search/Browse/Featured/agent concept selection explicitly returns to normal presentation, including reselecting the same concept. No discovery action auto-enters Reveal. A different direct/Included member selection exits; a direct pick of the same exact selected member can retain Reveal.

Clear selection and H exit. Explicit Isolate/narrow and Show surrounding anatomy exit. Region/Area navigation clears the old subject. Model switching resets state and disposes the old model's texture/index mapping. Foreign target IDs cannot match the destination renderer's model-bound index. Entry and exit themselves preserve selection, Hidden history, systems, navigation, workspace membership, explode and camera fields.

Switching is immediate, following the audit's V1 recommendation. There is no new opacity tween, per-part timer or React frame loop. Reduced motion therefore receives immediate switching; existing selection and scene/floor choreography retains its existing reduced-motion handling.

## Picking and camera

The existing event-driven picker keeps its AABB broad phase and exact triangle raycasts. A target triangle hit outranks a nearer ghost hit; among targets, the nearest hit wins. If no target triangle intersects the pointer, ordinary nearest ghost picking applies. Projected exploded fallback/hover uses the same priority comparator. No per-frame raycasting is added.

A ghost pick changes subject normally and exits Reveal. A multipart target's member pick changes the active subject and exits; after explicit activation on that member, repeated same-member picking can retain it. Cursor-anchored wheel zoom also prioritizes an actual target hit, otherwise retaining the existing visible-surface/plane fallback. Existing body-surface pick suppression when solids are present and FrontSide picker materials are retained; DoubleSide rendering is not a new inside-surface picker.

Reveal does not zoom, refit, orbit, change focal length or alter lock. User orbit and Front/Side/Back/three-quarter presets keep Reveal active. The three-quarter camera preset is camera-only; the separate full Assemble and reset action retains its existing full reset semantics and exits Reveal. Existing autorotation, intent and explode-assisted camera rules remain unchanged.

## Composition

| Feature | Behavior |
|---|---|
| Hidden / partial target | Hidden always wins in both passes. No selection-restoration helper is called by Reveal entry. |
| Restore / J | Ordinary restoration only; a restored selected subject member returns opaque if Reveal is still active. Restored eligible non-targets become context. History/order remains unchanged. |
| Systems / Eye | No system toggles are overwritten. Eye-off removes ordinary context while retaining previously accepted selected/isolation exceptions. Ordinary individual system toggles clear selection/workspace and exit Reveal as before. |
| Regions / Areas | Existing resolver remains authoritative. Explicit Area scopes supersede broad Region evidence for ordinary context; no historical concept closure fills missing scopes. Navigation exits Reveal. Existing selected exceptions are preserved rather than replaced with a new filter intersection. |
| Isolation | Only currently displayed frozen workspace members participate. Inspecting a child then activating Reveal ghosts other workspace members; full-body context never returns. |
| Random | Unhighlighted root and workspace inspector are preserved. Root has no active selection, so Reveal is disabled until an actual member is inspected. No outside anatomy is manufactured. |
| Explode | Existing XYZ state texture, layout key, family lanes, packing and percentage are untouched. Both material passes follow current translated positions at 0/.3/.5/1. |
| Light/Dark | Existing theme controller/background/floor palettes remain independent. Same anatomy materials/alpha policy in both themes. |
| Brightness/Contrast | Existing exposure and shared contrast uniform apply to both passes; no separate Reveal color pipeline. |
| Floors | Presentation-only floor/markers are not registered anatomy batches. All seven presets and existing eligibility rules remain independent. |

## Performance and evidence

The completed production-feature browser matrix measured close-framed male Liver **71 normal / 74 Reveal draws**, versus audit sanity reference 71/77. Whole-body hero including stage draws was 75/78. Heart was 71/69, Brain 71/71, kidney and abdominal aorta 71/67, scaphoid 75/72. Lower totals in some cases result from pruning wholly invisible/target-only context batches, not missing target identity. Female-study Liver was 70/81 and Heart 70/73.

Each recorded entry required one actual mask upload, with no idle uploads; camera orbit did not change mask membership/version. Twelve cycles across Liver/Heart/Brain retained the same warmed resources: 71 resident render geometries, five textures, eight programs and 138 anatomy objects in the male diagnostic scene. These counters exclude picker-only GPU geometry and do not constitute an indefinite memory stress test. There are no new dependencies or lockfile changes.

The last completed build's lazy viewer chunk grew from 887,320 to 892,559 bytes: **+5,239 bytes**. Recompression of those existing artifacts gave +1,779 gzip bytes; Vite's reported gzip sizes were 248.85 to 250.67 kB. That build preceded the final one-line Search/Browse exit-policy refinement, which was exercised in the passing focused browser matrix; it was not rebuilt after the user's no-more-testing cutoff. No portable FPS claim is made.

## Limitations and files

Transparent surfaces remain sorted at merged-object level, not per representation/triangle. Intersections and accumulated front-layer alpha can still reduce deep-target contrast, particularly at some camera angles. Target members self-occlude normally; Reveal is not a cutaway through every member of a broad target. Ghost picking preserves existing surface/front-face restrictions. The selected/workspace system/navigation exceptions remain explicit established contracts.

Created: `app/context-reveal.ts`, `app/context-reveal-renderer.ts`, `scripts/context-reveal.test.mjs`, `scripts/context-reveal-browser-smoke.mjs`, this record, the validation record and `phase-5.72-evidence/`.

Modified: `app/anatomy.ts` (optional subject type), `app/page.tsx` (state/actions/lifecycle), `app/scene.tsx` (batch registration, mask sync, picking/zoom priority, cleanup), `package.json` (two test aliases only), `scripts/cursor-zoom.test.mjs` (actual handler dependencies and target-anchor scenario), `scripts/reveal-architecture-browser.mjs` (exclude new hidden context wrappers from original audit batch inventory).

React best-practices review covered functional state updates, bounded renderer ownership, latest refs, no render-frame React updates, derived availability, native accessible controls and cleanup. No geometry, manifests, canonical identity, Region/Area datasets, classifications, dependencies or scientific corrections changed. No Marquee, Cinematic Camera, HQ materials, Phase 6, knowledge or supplemental anatomy work began.
