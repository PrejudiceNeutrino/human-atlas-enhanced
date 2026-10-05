# Phase 5.6 implementation: final bug sweep and discovery polish

Date: 2026-10-04. Branch: `phase-5.6/final-bug-sweep`. Clean starting main and phase SHA: `a7a17309638d19a5f41393078b7e24ddd648fa22`. This includes the accepted Phase 5.5 implementation. Branch, status, 30-entry history and branch tracking were inspected before edits. Current implementations and integration records through Phase 5.5 guided this narrow pass. No donor merge or later-phase work is included.

## Switch geometry

The previous default outer track was 32 x 18.4 px, with a 1 px transparent border and a 16 px flex-centered thumb. Its OFF thumb began at the 1 px border, and ON used `calc(100% - 2px)` = 14 px translation, leaving 1 px end insets. Browser rounding measured 18.390625 px height, 1.1875/1.203125 px vertical insets and a 1 px ON end inset. Fractional height and cramped clearance made the visual alignment weak.

Default geometry is now a 32 x 20 px track and 16 px thumb, with the same 1 px border. The thumb is absolutely centered at half the inner height with `translateY(-50%)`; its horizontal position is 1 px inside the border. Vertical clearance is `(20 - 16) / 2 = 2 px`. OFF left inset is `1 + 1 = 2 px`; ON translation is `32 - 16 - 2 * 2 = 12 px`, leaving the same 2 px right inset. Small geometry is consistently 24 x 16 px with a 12 px thumb, 2 px insets and 8 px translation.

Track transitions are restricted to colors. Thumb translation still uses the established motion styling. Focus rings, hover colors, disabled opacity and the expanded pointer target do not alter dimensions or borders. Light/Dark thumb and track colors are retained from Phase 5.5. All Systems rows share the component; there are no row-specific offsets.

## Floor eligibility and presentation

`app/floor-eligibility.ts` derives a binary context target from existing SceneState. It is separate from the persisted `display.sceneFloor` preference. An assembled Whole Body containing skeleton or muscles is eligible at exactly zero explosion. Full Skeleton is eligible. Isolation, Regions, Teaching Areas, organ-only/empty views and every strictly positive explode amount are suppressed. Random always establishes isolation and therefore suppresses the floor without another state flag.

`createSceneFloor` owns a separate eligibility multiplier and interruptible fade. Actual opacity composes the existing entrance reveal, existing preset-switch opacity and the eligibility fade. Context never calls `setPreset`, writes Display storage, or substitutes Classic. All seven presets (Classic, Minimal, Grid, Scanner, Orbital, Event Horizon and Void) retain their original geometry, palette and shader designs. Void remains visually empty even in an eligible context.

The renderer reads `--motion-medium` only when the eligibility target changes: a 180 ms finite ease-out fade, using Phase 5.3 `motionProgress` in the existing animation loop. There is no percentage-linked fade, floor travel or new animation system. Returning exactly to zero restores the remembered preset only when the context is eligible. Live reduced motion settles immediately; hidden documents pause controller updates. Suppression initializes correctly during the hidden entrance stage, and the normal readiness/settled callback still completes.

The floor changes only its own material visibility. Its group remains unpickable and outside anatomy bounds, camera fit, GPU anatomy textures, packing, selection, navigation, isolation and Hidden state. The renderer still has its model-only lifetime. Model changes retain the established independent Display preference semantics.

## Systems and branding

The full-width Hide/Show all systems button and its orphan CSS are removed without a replacement. All/Skeleton/Organs, individual toggles, piece counts, Hidden and Restore all hidden remain. Systems list top padding drops from 7 px to zero, removing additional whitespace under the preset row. Female chest controls retain their existing behavior.

The brand eyebrow receives 4 px top padding. The navigation rail origin is unchanged, internal brand margins remain deliberate, and the finite Phase 5.3 entrance settles at the new layout position. The original Light/Dark tokens and motion/reduced-motion rules remain in force.

## Random workspace and inspection

Previously Random called `choose(concept, true)`, leaving every concept member actively selected and opening the inspector. `randomAnatomyWorkspace` now resolves through the same current-model search resolver, selects/restores those representations, freezes them through `isolateSelection`, then invokes `clearActiveSelection`. The final state has an immutable isolation scope, empty active selection and a closed inspector. The existing isolation camera key fits the entire workspace without an intermediate highlighted frame or extra animation.

The concept remains a caption label, not an active selection. The existing Show surrounding anatomy workspace-exit control remains available. Picking a member opens ordinary inspection and highlights only that member; Included member selection preserves the assembly. H, J, individual Restore and Restore all keep the same independent Hidden/isolation semantics. Region and Area navigation values are preserved. Foreign model entries are rejected, and model changes retain the established cleanup path. Random eligibility (5-200 pieces and valid active-model representations) is unchanged.

## Featured anatomy

The old eight-name landing list was Heart, Brain, Liver, Stomach, Spleen, Pancreas, Urinary bladder and Trachea. Its replacement is **Featured anatomy**, with 14 deliberately ordered stable source ConceptIds from the actual Structure Index. Recognizability, useful isolation assemblies and representation across systems guide curation; size is neither a sorting rule nor a scientific importance score. Lung assemblies, central nervous structures, liver, skeletal/muscular hands and feet, pelvic wall and a venous network offer useful educational entry points and future Reveal candidates without implementing Reveal.

`app/featured-anatomy.ts` filters the active model inventory, retains editorial order, and excludes identical representation scopes. Nested legitimate concepts remain distinct discovery targets. Counts and representation IDs come directly from the Phase 4.8 deduped index. Both public models provide all 14 entries; pelvic wall has its actual model-specific count. Retained HRA source inventory yields no matching entries and receives no male fallback.

| Concept ID | Structure | Male pieces | Female-study pieces | Systems |
|---|---|---:|---:|---|
| `FMA7088` | Heart | 83 | 83 | cardiac, muscular, arterial, venous |
| `FMA50801` | Brain | 59 | 59 | cardiac, nervous, endocrine |
| `FMA7197` | Liver | 60 | 60 | digestive, venous, arterial |
| `FMA7309` | Right lung | 156 | 156 | arterial, respiratory, venous |
| `FMA7310` | Left lung | 124 | 124 | respiratory, arterial, venous |
| `FMA79876` | Brainstem | 11 | 11 | nervous |
| `FMA61680` | Abdomen proper | 15 | 15 | muscular, skeletal |
| `FMA37347` | Muscle of pectoral girdle | 22 | 22 | muscular, skeletal |
| `FMA9713` | Right hand | 19 | 19 | skeletal |
| `FMA11343` | Right foot | 26 | 26 | skeletal |
| `FMA37372` | Muscle of hand | 12 | 12 | muscular |
| `FMA37369` | Muscle of foot | 28 | 28 | muscular |
| `FMA10430` | Pelvic wall | 7 | 12 | muscular, skeletal |
| `FMA71209` | Tributary of axillary vein | 30 | 30 | venous |

Featured rows use the same DiscoveryList and viewer `choose()` as ordinary Search/Browse. Nonempty query ranking, aliases, result cap, Browse sorting/filters, virtualization, keyboard navigation, Escape and slash behavior are unchanged. Random remains an automatic isolated workspace; Featured remains ordinary explicit selection.

## Files and review

Created source: `app/floor-eligibility.ts`, `app/featured-anatomy.ts`. Created tests: `scripts/bug-sweep.test.mjs`, `scripts/bug-sweep-browser-smoke.mjs`. Created records: this file, `PHASE_5_6_VALIDATION.md`, and selected unchanged PNG evidence in `phase-5.6-evidence/`.

Modified runtime: `app/page.tsx`, `app/scene.tsx`, `app/scene-floor.ts`, `app/random-anatomy.ts`, `app/anatomy-discovery.ts`, `app/anatomy-discovery-panel.tsx`, `app/globals.css`, `components/ui/switch.tsx`. Modified test configuration: `package.json` (two scripts only), `scripts/anatomy-discovery.test.mjs`, and the hide-restore, viewer-interaction, stabilization, motion and scene-floor browser harnesses. Retained harnesses now use existing individual toggles/All for disabled-system checks and expect unhighlighted Random workspaces; they do not add product controls.

React best-practices review covered existing listener/observer cleanup, pure derived eligibility, current-model guards, single-owner state transitions, existing refs rather than renderer remounts, shared selection actions, and maintained ARIA/focus controls. No dependencies, lockfile, canonical datasets, classifications, anatomy geometry, scientific corrections, Phase 5.7+, camera redesign or HQ materials changed. Validation and the user-amended browser boundary are recorded separately.
