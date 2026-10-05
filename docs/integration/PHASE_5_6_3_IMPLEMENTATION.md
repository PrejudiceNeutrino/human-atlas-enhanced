# Phase 5.6.3: final shell, copy and visibility controls

Date: 2026-10-05. Branch: `phase-5.6.3/shell-cleanup`. Clean starting main and phase SHA: `2bf1b226aac17e59f0c1d1a29a3faa012c8dc658`, including Phase 5.6.2. Branch/status, 30-entry history, tracking and the implementation/validation records for 5.3, 5.5, 5.6, 5.6.1 and 5.6.2 were inspected before changes. No donor merge or cherry-pick. Final commit SHA is reported in the delivery message to avoid a self-referential hash.

## Product title and desktop helper

`web/index.html` already supplied `<title>Human Atlas</title>`. `web/main.tsx` replaced it at initial route resolution with `Male anatomy · Human Atlas` or `Female anatomy · Human Atlas`, then wrote another model-specific title in `onModelChange`. Both assignments are removed. The static HTML title now owns the product identity across model, navigation, selection, Search, Random, isolation and explosion. There is no framework/route metadata layer or another title writer. Description, theme metadata and favicon are unchanged; there are no existing Open Graph/application-name title fields requiring correction.

The old footer read `Drag to orbit · Pinch to zoom · Tap to inspect`. It now contains exactly three items: **LMB orbit · RMB pan · Click inspect**. Existing separators, font, subdued colors and bottom-left placement remain; `white-space:nowrap` prevents wrapping. No fourth item or shortcut list is added. No reliable device-capability copy controller existed, so none is introduced. The existing mobile layout hides this helper; no new touch copy is retained.

## Header Eye control

The Visibility heading contains a 28 × 28 px ghost icon button on its right, with the existing mobile Close control adjacent when applicable. Existing Lucide `Eye`/`EyeOff` icons and the Phase 5.6.2 primary/focus tokens provide its styling. Native button semantics, dynamic `title`/`aria-label`, pointer cursor and inherited focus-visible ring remain. The action is disabled until model inventory is available.

The icon is Eye when any available adult system is enabled, with label **Hide all systems**; otherwise it is Eye-off, labeled **Show all systems**. The existing `allSystemsForAtlas` inventory, also used by All, includes only systems with actual model parts and excludes the retained pregnancy-reference layer. Zero-count/model-unavailable systems are never invented. Region/Area zero-count rows keep their existing disabled state independently of the global layer inventory, consistent with All.

`toggleAllSystems` now changes only the underlying `visible` array and a transient `systemVisibilityRevision` event marker. Partial → none → all available is deliberate; previous custom combinations are not remembered. Individual switches synchronize through the existing state. The old helper cleared selection/isolation and used `showAllSystems`; that would have broken this control's contract. `showAllSystems` and All/Skeleton/Organs retain their existing separate preset semantics.

Hidden IDs/history, selection, workspace subject/membership, Region/Area, chest view, explode, camera intent, rotation, reset and saved floor preference are preserved. No Hide/Restore/H/J callback is invoked. Isolation's existing visibility composition remains authoritative: its members and selected structures can remain rendered when ordinary system layers are off. The icon describes layer switches, not a CSS canvas master switch; piece counts retain established resolver semantics.

The scene consumes `systemVisibilityRevision` before updating its existing last-state reference. A global layer-only event suppresses the existing automatic Organs-presentation refit for that frame. Ordinary presets, navigation, explicit camera actions and slider fitting keep their existing behavior. This prevents a header Eye click from moving a manually composed camera when leaving an Organs combination. No new camera animation/controller or renderer lifetime is introduced.

## Authoritative caption casing

The audit found **no caption-specific lowercase transform**. Captions already use `inspectorConcept.name`, sourced through the shared active-model naming/discovery pipeline, including the Random workspace inspector. The mismatch was the inspector's inherited `text-transform:capitalize`, which visually changed the same label. The targeted `.detail-header .structure-title{text-transform:none}` override makes inspector and caption preserve that supplied string exactly; no formatter, title-case algorithm or canonical-data mutation is introduced.

The actual source label for `FMA22842` is `branch of arterial anastomosis`, not `Branch Of Arterial Anastomosis`. Both surfaces now preserve the former, rather than manufacturing the latter. Random roots likewise preserve actual supplied names; the completed browser run exercised three roots and compared them with their inspector. Mixed-case labels, acronyms and numerals flow through without conversion. Included part labels remain their supplied names. Generic About titles and unrelated discovery/hover styling are outside this targeted correction.

Context captions retain existing uppercase presentation for Regions, Teaching Areas and whole-body context. Explode stage captions still reflect the current number of visible system families; changing layers can legitimately change `SEPARATING SYSTEMS` to `SEPARATED STRUCTURES` without changing the explode percentage. Existing wrapping and maximum-width rules remain for long structure labels.

## Eyebrow position and entrance

The preceding eyebrow had 8 px top padding. At settled 1440 × 900 desktop, the row's border box began at Y=29, text at Y=37 and dot at Y=42. The new rule is **`.identity>.eyebrow{position:relative;top:8px}`**. It moves the complete row without increasing its layout height or moving the rest of the rail.

The measured final row starts at Y=37, text at Y=45 and dot at Y=50: exactly **+8 px**. Title remains Y=62, selector block Y=135.6875 and Visibility card Y=357.6875. Both dot and text share the original aligned flex row. The existing wordmark gap contracts by the requested offset without creating a larger brand gap.

Phase 5.3 uses an opacity-only eyebrow entrance and finite letter/caret animations. The relative top offset is independent of animation transforms, survives settlement and remains active when reduced motion disables animation. No keyframe endpoint or new motion is needed. Dark, short-desktop and reduced-motion final browser certification was waived at the user's handoff cutoff; the implementation is shared across those modes.

## Files and scope

Modified runtime: `web/main.tsx`, `app/page.tsx`, `app/globals.css`, `app/viewer-interaction.ts`, `app/anatomy.ts`, `app/scene.tsx`. Modified test configuration: `package.json` (two scripts only), `scripts/viewer-interaction.test.mjs` (global-toggle state contract).

Created: `scripts/shell-cleanup.test.mjs`, `scripts/shell-cleanup-browser-smoke.mjs`, both Phase 5.6.3 records, and nine unchanged existing browser captures under `phase-5.6.3-evidence/`. Ignored profiles/logs/reports remain under `work/phase-5.6.3/`.

React best-practices review covered derived icon state, functional state updates, immutable workspace/history references, native accessibility, existing latest-ref renderer ownership and absence of new timers/effects/dependencies. Geometry, canonical identity, Regions, Areas/scopes, system classification, dependencies and package-lock are unchanged. No Phase 5.7, marquee, Cinematic/HQ, scientific correction or Phase 6 work began. See [validation and the user-approved handoff boundary](PHASE_5_6_3_VALIDATION.md).
