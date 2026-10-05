# Phase 5.6.1: camera framing, grounding and final UI cleanup

Date: 2026-10-05. Branch: `phase-5.6.1/spatial-cleanup`. Clean starting main, origin/main and phase SHA: `7077a04bf688330e764614a18d9d7aca9938957f`, including merged Phase 5.6. Branch/status, 30-entry history and branch tracking were inspected before edits. Existing integration records and current implementations through Phase 5.6 informed this refinement. The final commit SHA is reported in the delivery message.

## Organs framing

The preset already resolved the current-model cardiac, respiratory, digestive, urinary, endocrine and reproductive systems correctly. The problem was the camera: changing Systems did not request a refit, and Organs inherited the Whole Body distance of 4 and desktop target Y of 0.68. Its shorter, higher geometry therefore occupied too little of the viewport.

`isOrgansPresentation` identifies an unfocused, non-isolated organ-system presentation. The scene unions the current atlas bounds of displayed parts, then uses the existing eight-corner `fitRegionCamera` calculation, 34-degree field of view and 1.15 fit margin. The target is the organ union center plus the fixed grounding transform. A transition into/out of this presentation refits; normal body and Skeleton retain their existing distance/target and camera path. Empty inventories never produce a fabricated fit. There are no fixed male coordinates or female fallbacks.

Desktop male and female-study Organs were captured in Light/Dark. The root bounds center projects to the shared canvas axis, with a substantially larger vertical footprint and comfortable top/bottom clearance. Ordinary body/Skeleton camera composition is retained, apart from the small requested world grounding correction.

## Region and Teaching Area centering

The old desktop safe rectangle started at 285 px (245 on narrower desktop) and ended 90 px from the right. Its asymmetric center introduced a +97.5 px horizontal shift on desktop over 1100 px wide. This was a shared presentation offset, not incorrect Hip/Brainstem identity or bounds.

`focusedViewport` separates the established available-width budget from the composition anchor: the desktop left/right exclusions are balanced around the canvas, caption and dock axis. For example, `[285, width - 90]` becomes `[187.5, width - 187.5]`. Available width, vertical budget, geometry center, fit margin and resulting camera distance remain identical. This corrects the shared horizontal offset without changing accepted scope zoom. Portrait/mobile retains its existing asymmetric safe-area convention; inspector-open isolation retains its existing panel-aware safe rectangle.

Light checks on both public models covered Head & jaw, Cervical, Thoracic, Lumbar, Hip, Elbow & wrist, Knee and Ankle & foot, using actual final canonical Regions. Areas covered Orbit, Brainstem, Larynx, Brachial plexus, Hand and Foot. Dark captures cover Hip and Brainstem on both models. Actual bounds centers project to X=720 at 1440 x 900. No per-Region/Area exceptions, memberships or display scopes changed.

## Caption, switches and branding

The shared dock observer now reserves **10 px**, previously 14 px, above the Explode dock: every caption moves down **4 px**. Caption text and decorative rules remain in the same flex component. Caption clearance is checked in ordinary/focused/isolated/exploded states and at 1280 x 600.

The shared Switch root adds `cursor-pointer`, including its expanded pseudo-element hit target. Existing disabled conventions remain: unavailable Systems switches compute `default` through the established application styling; the generic component retains its disabled `not-allowed` utility. The 32 x 20 track, 16 px thumb, 2 px insets and 12 px ON translation are unchanged.

The brand eyebrow's top padding changes from **4 to 8 px**. The teal dot remains in the same aligned flex row. Internal brand spacing remains unchanged, and the existing finite entrance/typewriter settles at the new layout position. No keyframe endpoint or new motion sequence was introduced.

## Explode camera orientation assist

`app/camera-intent.ts` owns semantic orientation intent inside the model's existing renderer lifetime. Initial/reset state is uncustomized. Manual OrbitControls start/change/end events record customization only when the interaction actually changes direction. Pan and dolly do not mark orientation intent. Explicit camera presets, including Three-quarter, are deliberate choices. Autorotation is also deliberate orientation adjustment.

`SceneState.cameraIntentRevision` advances only for explicit presets/full Reset, independently of navigation's existing fit/reset counter. Reset restores canonical Three-quarter and clears customization; Front/Side/Back/Three-quarter preset actions mark customization. Model changes establish a fresh intent controller. No quaternion-proximity heuristic or persisted preference is used.

Only a **0 -> positive** explosion edge from an uncustomized, unlocked camera starts the assist. The existing `motionProgress` ease-out and `--motion-slow` token interpolate the current direction toward Front in the same animation loop, preserving target and radius as the established explosion-fit path manages distance. Intermediate positive slider changes do not restart it. Returning to zero does not force Three-quarter. On completion, the existing rail state is updated to Front without invoking another fit or marking a deliberate user preset.

Pointer/touch/control start and wheel input immediately cancel the assist. An actual subsequent orbit records customization, preventing another assist until Reset. Reduced motion uses the existing zero-duration convention. Lock suppresses/cancels this unsolicited programmatic assist; explicit user presets remain available while locked, consistent with Phase 5.5. No explosion offsets, family lanes, packing, layout keys, eligibility or source bounds changed.

## Random inspector subject

The Phase 5.6 random workspace correctly cleared `selected`, but it also closed a Sheet whose open state required selected parts. Random now freezes a separate `workspaceInspector` subject containing the current `modelId` and canonical discovery `conceptId`, while visual active selection remains empty. `randomWorkspaceInspector` resolves that subject only from the active-model discovery inventory and only while isolation remains active.

The inspector derives its title, existing description/system overview, reference, authoritative deduped modeled-piece count, source/provenance and Included structures from this subject. This metadata never feeds the selection GPU texture. Isolate/Hide require actual active selection; Show surrounding anatomy remains available. There is no new anatomy description or knowledge ingestion.

Direct and Included member selection preserve the immutable workspace and subject, highlight only the child, and show the child inspector. Clear selection and hiding a selected child fall back to the root inspector. H/J and restore retain independent Hidden membership. Explicit narrowing/search/exiting and Reset clear the subject. Model changes clear selection, root metadata and last-random tracking. The original Random 5-200-piece eligibility and selection pipeline remain unchanged.

## Grounding and stage

Classic's cylinder center is -0.014 with thickness 0.018: its authoritative top/contact plane is **-0.005**. The rim/procedural plane remains -0.0049. The stable supporting-foot reference is the active model's minimum available skeletal bounds Y; both public inventories identify a distal toe phalanx as that minimum. This uses existing model bounds, not geometry rewrites or anatomical reclassification.

The fixed model transform is:

`groundOffset = -0.005 + 0.0002 - minimumSkeletalY`

| Model | Minimum skeletal Y | Fixed model translation Y | Final supporting minimum Y |
|---|---:|---:|---:|
| Male | 0.0076313000000000075 | -0.012431300000000008 | -0.0048 |
| Female-study | 0.007249734830111265 | -0.012049734830111265 | -0.0048 |

The tiny 0.0002 clearance avoids apparent floor intersection at the contact reference. Anatomy render groups, pickers, sparse markers and projection/focus/fit calculations use the same fixed translation. Canonical model coordinates, source bounds, vertices and explosion textures remain unchanged. The translation is established once per model, independent of floor visibility, preset, scope, selection, Hidden state or explode amount. Suppressing the floor never moves anatomy. Full Skeleton shares the same contact reference.

Shared stage radius changes from **0.50 to 0.56**, diameter **1.00 to 1.12**, exactly **+12%**. Classic and every procedural preset share that base footprint. Thickness, edge/rim profile, centering, palette, shader design and animations are unchanged. Phase 5.6 binary floor eligibility remains intact.

## Featured Anatomy

Ordinary rows retain their normal surface; hovered/active rows use the subtle accent background. Keyboard-focused rows add a restrained **3 px inset left marker**, with the global form-like outline explicitly suppressed for this component. Row padding is consistently 10 px. Mouse interaction does not add the keyboard marker. The existing listbox semantics, virtual row size, keyboard navigation, search ranking and ordinary structure selection are unchanged.

Every previous entry was reviewed against recognizability, distinct geometry scope and useful exploration. Heart, Brain, Liver, both distinct lung assemblies, Brainstem, Abdomen proper, Muscle of pectoral girdle, skeletal Hand/Foot, Muscle of foot and Pelvic wall remain. Muscle of hand overlapped the hand showcase; Tributary of axillary vein was a less immediately recognizable landing entry. Those slots now showcase the canonical Spine assembly and paired Kidneys. Kidneys' two pieces are deliberately retained for recognizability, rather than a size/ranking quota.

| Concept ID | Final editorial entry | Male pieces | Female-study pieces |
|---|---|---:|---:|
| FMA7088 | Heart | 83 | 83 |
| FMA50801 | Brain | 59 | 59 |
| FMA7197 | Liver | 60 | 60 |
| FMA7309 | Right lung | 156 | 156 |
| FMA7310 | Left lung | 124 | 124 |
| FMA79876 | Brainstem | 11 | 11 |
| FMA61680 | Abdomen proper | 15 | 15 |
| FMA37347 | Muscle of pectoral girdle | 22 | 22 |
| FMA9713 | Right hand | 19 | 19 |
| FMA11343 | Right foot | 26 | 26 |
| FMA13478 | Vertebral column (Spine) | 48 | 49 |
| FMA37369 | Muscle of foot | 28 | 28 |
| FMA10430 | Pelvic wall | 7 | 12 |
| FMA7203 | Kidney | 2 | 2 |

All fourteen are available in both public models, with current-model deduped counts and no duplicate representation scopes. The retained HRA-source inventory has no matching shelf entries and receives no fallback. No alias duplicate, dynamic size ranking, automatic isolation or Reveal behavior was added.

## Files, scope and handoff

Created runtime: `app/camera-intent.ts`, `app/spatial-presentation.ts`. Created tests: `scripts/spatial-cleanup.test.mjs`, `scripts/spatial-cleanup-browser-smoke.mjs`. Created records: this file, `PHASE_5_6_1_VALIDATION.md`, and selected existing captures under `phase-5.6.1-evidence/`.

Modified runtime: `app/anatomy.ts`, `app/classic-floor.ts`, `app/featured-anatomy.ts`, `app/globals.css`, `app/hide-restore.ts`, `app/page.tsx`, `app/random-anatomy.ts`, `app/region-navigation.ts`, `app/scene.tsx`, `app/viewer-interaction.ts`, `components/ui/switch.tsx`. `package.json` adds two test commands only. Retained tests/harnesses are updated for intentional Random inspector, stage size and Reset intent changes, plus the wheel-handler cancellation dependency.

Modified retained tests: bug-sweep unit/browser, cursor-zoom unit, hide-restore unit, motion browser, scene-floor unit/browser, stabilization unit/browser. They retain original geometry, selection and protection assertions; no application bypass/test hook was added.

React best-practices review covered model-only scene lifetime, ref-owned callback/animation state, event/observer cleanup, derived active-model inspector data, immutable workspace authority, accessible row focus and shared actions. No dependencies/lockfile, binary geometry, canonical identity, Regions, Area memberships/scopes or system classification changed. No Phase 5.7, marquee, Cinematic Camera, HQ materials, terminology, science or knowledge work began. Validation and the user's final testing cutoff are documented separately.
