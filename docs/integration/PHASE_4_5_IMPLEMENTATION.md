# Phase 4.5: viewer navigation and rendering polish

Started on clean `phase-4.5/viewer-polish` at `df4cf9a675d8effa03090e293d3b0ac8e21baa1f`, identical to local main and origin/main. History includes Phase 1 contracts, Phase 2 regions, Phase 3 areas, Phase 4 hide/restore and its individual-restore/H/selection refinement. Their implementation and validation records and the current runtime were inspected before changes. This phase changes presentation, runtime inventory counts, model defaults and existing renderer parameters only.

## Attached selectors

Model, Region and Teaching Area now use the same existing Base UI Select wrapper in `components/ui/select.tsx`. It uses bottom placement, start alignment, a 4px offset and `alignItemWithTrigger=false`. This removes the selected-item-over-trigger pop-out behavior. Side collision flipping is disabled; available-height sizing keeps menus below their triggers even on short screens, while alignment shifting protects viewport edges. Popup width comes from Base UI's `--anchor-width`; height is content-driven, capped by `min(360px, var(--available-height))`, or 280px in short landscape layouts. There is no fixed menu height or horizontal scrolling.

All triggers are 44px high. Menus share borders, 9px radius, restrained shadow, selected checkmarks, hover/focus treatment and typography. Items are at least 40px high on desktop and 44px at phone widths. Menus use portals and overlay the scene; opening them does not change scene dimensions, navigation state, bounds or camera. Accessible names and label associations remain explicit. Base UI supplies keyboard navigation, Enter/Space selection, Escape dismissal and focus return. No dependency was added or upgraded.

## Global Teaching Area discovery, separate canonical systems

`app/viewer-polish.ts` derives presentation groups from canonical region order and each area's first ordered `regionIds` affiliation; within each group it retains canonical area order. No anatomical membership or taxonomy is copied into JSX or changed. The menu always contains None plus all 17 areas:

| Group | Stations, in display order |
|---|---|
| Head & jaw | Orbit; Circle of Willis; Brainstem |
| Cervical | Larynx |
| Shoulder | Brachial plexus; Axilla |
| Elbow & wrist | Cubital fossa; Wrist; Hand |
| Thoracic | Heart; Lung roots |
| Lumbar | Porta hepatis; Celiac trunk; Kidneys |
| Hip | Pelvic viscera |
| Knee | Popliteal fossa |
| Ankle & foot | Foot |

Each station appears once under its preferred affiliation. Relevance considers **every** declared affiliation: Cervical marks Larynx, Brainstem and Brachial plexus even though the latter two appear in other groups. A subtle inset line and dot identify relevance; screen-reader text says “Affiliated with [current region]”. The current group's heading receives a text accent. Selection remains separate, with its own check and stronger background. Whole body marks no local group or station. Unrelated stations remain fully selectable with ordinary readable text.

Region order remains Whole body, Head & jaw, Cervical, Shoulder, Elbow & wrist, Thoracic, Lumbar, Hip, Knee, Ankle & foot. Existing `selectRegion` and `selectArea` helpers remain unchanged. Region selection clears the active area. Area selection keeps compatible context or uses its first affiliation: Ankle & foot → Kidneys establishes Lumbar; Cervical → Brachial plexus keeps Cervical. None preserves the current region. An active area's membership **supersedes** broad region membership for visibility and counts; region is navigation context only. All navigation actions preserve Phase 4 current-model hidden RepresentationIds. Camera fitting, damping, orbit/zoom, polar limits and focus formulas are unchanged.

## Scope inventory counts

System rows report current-model **mesh representations**, deduplicated by RepresentationId:

- Whole body: all active-model inventory representations.
- Region without area: Phase 2 resolved representations for that region.
- Active area: Phase 3 resolved representations for that area alone.

`scopeRepresentations` and `systemCountsForScope` consume existing Phase 1 model-bound resolution and source system classifications. Canonical concepts are never counted as modeled pieces. Foreign-model representations never contribute. Toggle state, chest mode, hidden overrides, isolate and outside-scope search selections do not alter this inventory. The existing visible count still uses the composed visibility resolver, including those filters and exceptions.

Rows remain stable for systems present in the current model. A zero scope count mutes the row and disables its switch and system-only action, retaining the underlying global checked preference. Returning to a populated scope restores its operability. Entirely model-absent systems retain the existing omitted-row behavior. All/Skeleton/Organs remain global system presets; they do not change membership or leave a station. Heart + Skeleton legitimately produces zero visible ordinary pieces and the existing explanatory status.

## Model defaults

`defaultVisibleForModel` excludes only Reproductive from the male default. Fresh load, full Reset and switching back to male use it: 2,217 ordinarily visible male pieces instead of 2,229. The inventory remains 2,234, including 12 reproductive and 5 body-surface pieces. All explicitly enables Reproductive; manual toggling and explicit reproductive search selection still work. Female study and internal HRA defaults preserve their previous arrays, including female reproductive visibility. The female study ordinary default remains 2,239 visible pieces.

## Renderer parameters

| Parameter | Phase 4 | Phase 4.5 |
|---|---|---|
| Clear color | `#f2f3f3` | `#e4e8eb` |
| CSS root/background | `#f3f4f4` | `#e4e8eb` |
| Tone mapping / output | ACES filmic / sRGB | Unchanged |
| Exposure | 1.12 | 1.00 |
| Environment | RoomEnvironment, PMREM sigma .04 | Unchanged |
| Scene environment intensity | 1.00 (Three default) | .55 |
| Hemisphere colors | `0xffffff` / `0xa7acb2` | Unchanged |
| Hemisphere intensity | 1.05 | .45 |
| Key color | `0xfffaf4` | Unchanged |
| Key intensity / position | 2.3 / (-2, 4, 3) | 2.65 / (-3, 4, 4) |
| Rim color / position | `0xe9f0ff` / (2, 2, -3) | Unchanged |
| Rim intensity | 1.8 | .85 |
| Anatomy roughness / metalness | .53 / .08 | Unchanged |
| System base colors | Existing palette | Unchanged |
| Body-surface opacity / depthWrite | .1 / false | Unchanged |
| Selection diffuse RGB / selected opacity | (.008, .42, .32) / 1 | Unchanged |
| Ground / platform / rings | Existing geometry and materials | Unchanged |

Lower environment/fill and exposure retain brighter key-facing surfaces while revealing shaded-side curvature and overlaps. The modestly cooler gray improves ivory-bone silhouette separation. No tissue recoloring or new material system was needed. The Phase 4 saturated teal highlight remains shaded by the existing standard material.

There are still three scene lights, one normal scene render per frame, the existing one-time PMREM setup, and the same merged geometry, textures and buffers. Shadow maps remain disabled. No SSAO/GTAO, bloom, outline, extra render pass, postprocessing or rendering dependency exists. Antialiasing and pixel-ratio limits remain unchanged. Build-size measurements and visual comparisons are in the validation record; no frame-rate improvement is claimed.

## Scope and files

Created: `app/viewer-polish.ts`, `scripts/viewer-polish.test.mjs`, `scripts/viewer-polish-browser-smoke.mjs`, `scripts/select-browser-helpers.mjs`, and the Phase 4.5 implementation/validation records.

Modified: `app/page.tsx`, `app/globals.css`, `app/scene.tsx`, `components/ui/select.tsx`, `package.json` (two test commands only), and the existing region/area/hide-restore browser harnesses to operate the styled controls and assert the new male default. Their existing pointer/GPU/selection/dissection assertions remain in place. Route-settling waits avoid observing the old document during reload/model transitions. The shared menu helper also supports native controls for baseline captures.

Models, manifests, binary geometry, identity, region and area datasets, donor evidence and package-lock are unchanged. Regions and Teaching Areas remain distinct canonical concepts. No anatomy review/correction, nerves, supplemental anatomy, HRA update, female geometry, lazy/context loading, knowledge ingestion, clinical feature, database/persistence or later phase is included. Female scientific readiness is unchanged and remains false.
