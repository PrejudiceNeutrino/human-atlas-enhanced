# Phase 4.9 implementation: presentation, motion and display

Date: 2026-10-04. Branch: `phase-4.9/presentation-motion`. Clean starting HEAD, local main and origin/main: `294dba653364212d3741a14e3d6895e38797f95d`, the accepted Phase 4.8 discovery endpoint. History and implementation/validation records through Phase 4.8 were inspected alongside the actual runtime, UI wrappers and regression harnesses. This implementation extends the current architecture; no donor code is merged.

## Theme and display preferences

One compact button replaces the Light/Dark/System Select. In Light it shows a moon with the label and tooltip **Switch to dark mode**; in Dark it shows a sun and **Switch to light mode**. Native button semantics support keyboard activation and the existing focus treatment. The obsolete Select-chevron CSS was removed so the icon is visible. There is no menu or System choice.

`human-atlas-theme` accepts only `light` and `dark`. Missing preferences default to Light. Stored `system` and other malformed choices normalize deterministically to Light and are rewritten to `light` during initialization. No OS listener remains. Explicit choices persist immediately, and blocked storage still permits a session preference. Theme does not touch anatomy or URL state.

The adjacent Display popover reuses the existing Base UI Popover and Slider components. It contains Brightness, Contrast, current percentages and Reset display. It is portal-mounted at the existing utility layer, constrained to available viewport width, dismissible with Escape, and keyboard operable. Scoped CSS gives the slider tracks explicit dimensions for the installed component's orientation contract.

`app/display.ts` owns defaults, bounds, validation and an independent preference controller; `app/display-store.ts` exposes a stable external-store snapshot. `human-atlas-display` stores a JSON object with numeric brightness and contrast. Nonfinite, mistyped, malformed or unavailable stored values fall back independently to defaults; valid numeric values clamp to their bounds. Controls persist normalized values. No query parameters, account or scientific state are introduced.

| Setting | Reviewed default | Range | Rendering path |
|---|---:|---:|---|
| Brightness | 1.0 / 100% | 0.70-1.30 / 70-130% | Existing `renderer.toneMappingExposure` |
| Contrast | 1.0 / 100% | 0.85-1.15 / 85-115% | Shared `displayContrast` uniform in existing anatomy materials |

Brightness preserves the Phase 4.5 exposure baseline. Contrast applies a smooth symmetric curve after ACES tone mapping and output-color conversion, before dithering: `x^c / (x^c + (1-x)^c)`. It is identity at 1, preserves endpoints and midpoint, and remains monotonic without added thresholding/posterization. The existing lit standard-material path and saturated teal diffuse selection remain intact. There is no CSS canvas filter, replacement tone mapper, extra render target or postprocessing pass.

Display refs update exposure/uniforms in place and mark the existing scene dirty. No material `needsUpdate`, shader recompile, geometry refetch or renderer rebuild occurs. Reset display changes only its two preference values to 1.0; it preserves theme, model, Region, Teaching Area, Systems, hides, selection, isolation, explode and camera.

## Background and pivot reference

The 30-unit ground circle and solid cylinder pedestal were removed. Neither is replaced with another plane. The two original horizontal rings remain at the existing pivot, with opacity reduced to 0.24 / 0.12. Light uses faint cool gray (`#8c969f` / `#a4aeb8`); Dark uses restrained gray-blue (`#81919e` / `#71828f`). The unchanged background colors are `#e4e8eb` / `#202a33`.

This is a spatial reference without a slab, glow or horizon. Rings retain the existing hide conditions during isolation and later explode stages, preserving the clean isolated presentation. Anatomical geometry, lighting, standard materials, ACES/sRGB, environment intensity and camera fitting formulas remain unchanged.

## Startup, readiness and model transitions

The scene shell is immediate. CSS opacity/transform keyframes run once when the stable viewer mounts: eyebrow (0ms), title (35ms), metadata (60ms), selectors (90ms), Visibility (130ms), utilities (170ms), camera/footer (210ms), and dock/caption (240ms). Each entrance lasts 280ms with `cubic-bezier(.2,.7,.2,1)`, using at most 8px movement. Backwards fill ends with the ordinary layout and avoids persistent animation transforms around portal anchors. Loading uses a separate 180ms opacity animation. Surface transitions use the same curve and 180ms timing, with explicit color/border/opacity properties.

Geometry fetch/decode/merge retains the existing three-worker concurrency and starts normally. The canvas stays at opacity zero while chunks assemble internally. After all current-model chunks complete and a coherent frame has rendered, the scene reports `onReady` exactly once; the entire canvas fades in over 280ms. Readiness is separate from rounded progress percentages. There is no per-mesh animation or arbitrary startup delay. Loading progress remains visible, with a restrained preparation label and modeled-piece count.

Catalogue/chunk/WebGL errors retain an immediately operable alert and Reload button and suppress preparation. The loading surface has no pointer interception. A failed scene never reports successful readiness. Theme changes do not change the reveal flag or crossfade geometry.

Male/Female selection uses a 120ms outgoing canvas fade followed by destination loading and the 280ms readiness reveal. The routed app now changes the model in place with the existing canonical URL instead of recreating the document and branding. The navigation shell stays mounted. The previous catalogue definitions remain available while destination controls are temporarily disabled, preventing the empty-catalogue Select fallback from resetting Region/Area. Only destination-model identity/geometry is active; the old renderer is disposed. Back/forward retains ordinary full-page restoration. No camera formula or navigation information architecture was redesigned.

`prefers-reduced-motion: reduce` removes all startup animations and stagger, removes canvas fades and uses zero outgoing delay. Existing global reduced-motion handling also disables component microtransitions. Geometry readiness, errors and interactive behavior are otherwise identical. There is no animation dependency or second continuous loop.

## Persistent isolation correction

The exact old bug was reproduced in desktop Chrome: slash, `pectoral`, Muscle Of Pectoral Girdle, isolate 22 pieces, then a real projected-triangle 3D member click. The inspector selected Left pectoralis minor but ordinary visibility returned from 22 to 2,217 pieces. This is a deterministic visible member permitted by the brief; Left Serratus Anterior is attempted first by the regression picker.

Root cause: direct selection used `selectRepresentations`, which deliberately exits isolation. The previous Included helper restored the isolate boolean but replaced the visibility authority with the new single selection, narrowing the assembly. Visibility and isolated camera fitting both depended on active selection.

`isolatedRepresentationIds` now freezes the original active-model assembly independently of `selected`. `isolatedPartIds` is a derived exact lookup through the bound identity index. `toggleIsolation` captures known current-model RepresentationIds. `selectAssemblyMember` validates membership, performs ordinary selected-only restoration, then preserves the original scope for a member. Direct 3D picks and Included selections share this behavior. Unknown/foreign entries cannot authorize scope membership; unrelated Search/Browse still explicitly exits isolation through its existing selection helper.

The shared visibility resolver uses the frozen scope while isolated, with hidden/unloaded precedence intact. The GPU selection texture emphasizes only the active member. Camera fitting uses the original assembly bounds and scope key, so changing members does not refit to one piece or restore ordinary framing. Included structures stays available for the full isolated assembly after member selection.

Show surrounding anatomy clears the isolation scope, assembles explosion and retains the active member as the reviewed ordinary selection exception. Region/Area/Systems context resumes. Clear selection, hide, presets, navigation, Reset and model switching clear or discard scope under their existing cleanup semantics. Isolation is transient and never persisted or inferred by English name/across models.

## Performance and scope

One normal scene render, the existing one-time PMREM/environment setup, merged chunk geometry, three lights, existing state textures and renderer loop remain. Shadow maps stay disabled. No additional render passes, postprocessing, SSAO, geometry reload on theme/display, major dependency or lockfile changes. Floor/pedestal removal also removes two neutral draw objects. Contrast adds a small fragment-color transform; no frame-rate improvement is claimed.

Created: `app/display.ts`, `app/display-store.ts`, `app/display-controls.tsx`, `scripts/presentation.test.mjs`, `scripts/presentation-browser-smoke.mjs`, and the two Phase 4.9 integration records.

Modified: anatomy/visibility state contracts, hide/restore and navigation cleanup, viewer interaction helper, page, scene, themes/store, global presentation CSS, routed app shell, package test scripts, the existing interaction unit/browser expectations, and desktop-mode/output support in retained browser harnesses. Dependencies are unchanged. Full inventories appear in the commit diff.

No model/manifest/binary, identity dataset, Region dataset, canonical Area dataset, Area representation scope, scientific evidence or readiness validator changes. Search/Browse and rail composition remain the Phase 4.8 design. Existing explode layout and packing algorithm remain unchanged. Staged explode/macro-system lanes, supplemental anatomy, nerves, HRA upgrades, knowledge ingestion, pathology, pharmacology and later phases were not started. Female engineering integrity does not certify scientific readiness.
