# Phase 5.4: creative scene floor presets

Started on clean `phase-5.4/scene-environments` at accepted Phase 5.3/main commit `72b3910a6b5eca482c7eb89a028d24b9a4551f85`. Local main, origin/main and the phase branch pointed to that same commit. The implementation and validation records through Phase 5.3, the current scene, page, CSS, Display/store, Classic helper, motion tokens, renderer and anatomy-only camera/picking/layout paths were reviewed. The user's later instruction makes desktop the visual acceptance target; mobile issues are outside this delivery's acceptance boundary.

## Preference and Display control

`app/scene-floor-presets.ts` owns the seven typed IDs, labels, shader modes and animation flags. `normalizeSceneFloor` accepts only those IDs and returns Classic for missing, malformed or retired values. No model or anatomical identity is associated with the preference.

`app/display.ts` extends the existing `human-atlas-display` localStorage object with `sceneFloor`. Old brightness/contrast preferences migrate in memory to Classic while retaining their numeric values. Malformed JSON and unavailable storage retain the established safe defaults/session behavior. Floor-only changes notify the existing external store. No new storage system, listener, URL parameter, database or account state exists. `app/display-store.ts` and `app/page.tsx` need no modifications.

`app/display-controls.tsx` adds a labeled, compact Scene floor select inside the existing Display popover, using the existing Base UI select components. It exposes Classic, Minimal, Grid, Scanner, Orbital, Event Horizon and Void. Reset display restores brightness 1, contrast 1 and Classic. It does not touch anatomical/navigation state, isolation, hidden history, explosion or theme. The control inherits native menu keyboard/focus behavior. Only two scoped CSS rules were added.

## Presets and shader

| Preset | Implementation | Continuous motion |
|---|---|---|
| Classic | Unmodified `createClassicFloor`: filled cylinder, edge materials and narrow rim | None |
| Minimal | One faint primary ring | None |
| Grid | Three concentric rings, restrained radial divisions and rim ticks | None |
| Scanner | Two faint rings and one rotating radial sweep with short trailing falloff | One 24-second cycle |
| Orbital | Primary ring and three thin flattened ellipses | Slow relative counter-rotation |
| Event Horizon | Transparent central falloff, soft annulus, cheap angular/radial waves and faint outer ring | Slow polar phase |
| Void | Entire floor group invisible | None; zero floor draws |

`app/scene-floor.ts` owns the presentation group and controller. All five procedural presets reuse a single plane, one ShaderMaterial, one shader program and a small set of scalar/color uniforms. A uniform chooses the style; selecting a preset does not change shader source. The shared program is precompiled once during the hidden loading stage using the existing renderer's `compile` API. This prepares the material without drawing, an extra render pass or camera changes, and avoids the first-visible-use compilation stall observed in the initial benchmark. Polar shader math uses simple trigonometry, smoothstep, a few annulus terms and derivative antialiasing. There are no textures, noise libraries, feedback, simulation, additional render passes or render targets. Event Horizon is an aesthetic accretion-inspired stage without a physical-accuracy claim. Its alpha fades before the plane boundary; its center is translucent.

Light uses cool neutral lines and a lower intensity/central opacity. Dark allows stronger cool neutral accents while keeping the anatomy dominant. The Classic helper retains its exact reviewed palettes. Theme changes update colors/intensity in place, preserve the chosen preset and do not compile new materials. No anatomy shader, semantic system color or selection teal was changed.

## Placement, depth and scientific separation

The stage retains the reviewed fixed body-origin reference: radius 0.5 m, one-meter footprint, horizontal XZ plane. The procedural plane is at y = -0.0049 m, matching the Classic rim. The Classic cylinder, thickness, rim, scale and reveal helper are unchanged. There is no camera-angle alignment, view-specific repositioning or fit adjustment.

The existing fixed stage can be cropped or disappear in tight Region, Teaching Area or single-structure isolation views. Keeping it at the anatomical origin avoids introducing a large environment into a small isolated structure's view. It remains one stage beneath the overall exploded scene rather than one per family. This deliberate behavior matches the established Classic reference and does not modify any anatomical camera math.

Every stage mesh has a no-op raycast and `userData.presentationOnly`. The group is added directly to the Three scene and never registered in the anatomy picker array, atlas part inventory, projected hit targets, bounds arrays, visibility resolver, discovery/index, Systems, Hidden or explosion layout. Picking and hover continue to consult only atlas parts. Bounds, camera fit, packing and explosion offsets continue to use only the original part bounds and eligible atlas representations.

Procedural material uses depthTest true, depthWrite false, DoubleSide, transparent alpha and renderOrder -1. Opaque anatomical depth masks the stage; the early transparent order avoids drawing stage lines over transparent body context. Classic retains its original settled material behavior. No shadows, postprocessing, global environment lighting changes or extra renderer pass were added.

## Motion, resource lifetime and composition

Preset changes use a short fade out/fade in within the existing `--motion-fast` duration (120 ms), with Phase 5.3 `motionProgress` easing. The outgoing style reaches zero before the incoming style becomes visible. At most one style draws at any time. This avoids crossfade overlap, geometry morphs and indefinitely active outgoing animations. Rapid interrupted changes settle on the latest requested preference.

The original scene animation loop calls the floor controller using visible elapsed time, capped at 0.1 seconds to avoid catch-up jumps. Only animated, visible presets advance a scalar time uniform. Static presets and Void return without animation work. Reduced motion settles transitions immediately, sets phase to zero and preserves the selected visual style. Live reduced-motion changes also freeze an already running preset. Hidden document updates return without advancing phase; the existing loop and browser suspension are reused, without another timer or listener.

The renderer effect is still keyed only by `[atlas, modelId]`. Display updates are read through the existing ref and never rebuild anatomy, reload assets, reset camera or rebuild explosion targets. Motion duration/CSS are read only when the selected floor actually changes. Theme, model switch, isolation workspace, member inspection, Regions/Areas, Random Anatomy and staged explode remain independent of this preference.

Both the Classic objects and the single procedural object are allocated once per scene lifetime and reused on every switch. Invisible cached objects do no GPU draw work; Void hides the entire group. The controller disposes its geometry/material resources once at scene teardown and removes its children before the generic scene cleanup. No buffers or textures are created during animation or preset changes. Classic retains its reviewed draw cost; each procedural floor uses one draw, Void zero.

## Scope and delivery

No dependencies, package-lock, runtime images, videos or large visual assets were introduced. `package.json` adds focused unit/browser commands. The existing presentation tests were updated only to expect the added Classic default in the Display object. The new tests cover preference migration, persistence/reset, unchanged Classic geometry/materials, disabled floor raycasts, fixed placement, motion freezing, rapid switching and resource disposal, plus actual GPU/camera/state composition and screenshot/performance evidence.

No model geometry, identity data, Region membership, Teaching Area membership/scope, explosion math, selection/picking architecture or camera math changed. No supplemental anatomy, nerves, HRA upgrades, knowledge, pathology, pharmacology or later-phase work was started. Validation and the exact desktop/mobile boundary are recorded separately in `PHASE_5_4_VALIDATION.md`.
