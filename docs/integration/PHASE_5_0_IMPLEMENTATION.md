# Phase 5.0: staged anatomical explosion and layout continuity

Date: 2026-10-04. Branch: `phase-5/explode-redesign`. Starting Phase 4.9/main SHA: `c90224609a9bd338ba4cca4a3f9fd2642a7a573d`. Local main, origin/main, the branch and live remote main matched this SHA. Accepted implementation/validation records through Phase 4.9 and current anatomy, visibility, page, scene and browser contracts were inspected. The only pre-existing change was untracked `.vscode/settings.json`, preserved outside this phase. No donor merge or cherry-pick.

## Root cause, reproduced before changing the algorithm

Native desktop Chrome captured male/default Systems/Whole body at 0, 10, 20, 30, 34 through 41, 45, 50, 70, 100 and back to 0. GPU offset textures and camera matrices were intercepted by the test process. Before screenshots reproduce the supplied lateral jump.

The old packing solution did **not** depend on explode percentage. Its key was visible source IDs plus viewport aspect, and shelf cells remained fixed. The decisive bug was camera fitting: slider movement called `fit(view, max(0, (amount - .3) / .7))`; once that extent exceeded `.1`, around **37%**, the target abruptly changed from `(0, .68, 0)` to `(-packingWidth * .12, .85, 0)` on desktop. Camera view-matrix translation changed between the sampled 37% and 38% frames from approximately `(0, -.6789, -4.5968)` to `(.8281, -.8650, -4.3969)`. GPU offsets changed smoothly. The old renderer also switched to Front above 50%, the fitter could force Front above extent 80%, and the page forced Front above slider 80%. These orientation switches and the lateral target switch are removed.

The previous radial-system stage independently moved pieces vertically relative to `.85`, so it did not preserve rigid internal family anatomy. Its 45% transition into one mixed inventory had no educational family endpoint. This phase replaces that behavior rather than masking the screen-space symptom.

## Pure layout contract and cache

`app/explosion-layout.ts` centralizes typed presentation metadata and pure layout/evaluation helpers. `createStableExplosionLayout` receives current eligible source parts, their active `ModelId`, and an optional active scope center. It produces model-bound RepresentationIds, present family lanes, per-piece stable cells/order, assembled bounds, family translations and final piece translations.

The key is JSON encoding of `[modelId, focusCenterOrNull, sortedRepresentationIds]`. Representation IDs use the existing `atlas:representation:<modelId>:<encoded sourcePartId>` contract. Geometry bounds and system classification are immutable current-manifest inputs. No slider value, camera aspect/orientation, pointer, random value, clock or frame timing participates. Different navigation scopes with identical geometry and center may reuse the same layout because their targets are identical.

The scene builds the key only when visibility inputs or chunk availability change. It builds targets only when the key changes. Slider-only movement evaluates cached targets and interpolated bounds; it never rebuilds the key, lane solution or shelf packer. Resize updates camera framing without changing layout targets. A routed model switch disposes the scene and creates an independent model-bound cache.

## Presentation families

These families are **presentation groups**, not canonical anatomy, scientific hierarchy, histological layers, Region membership or Teaching Area membership. Existing `SystemId` classifications are used exhaustively:

| Order | Family | Existing systems |
|---|---|---|
| 1 | Support | skeletal, connective |
| 2 | Muscular | muscular |
| 3 | Visceral | cardiac, respiratory, digestive, urinary, endocrine, reproductive, lymphatic, mammary, pregnancy |
| 4 | Vascular | arterial, venous |
| 5 | Neural / sensory | nervous, sensory |
| 6 | Surface | integumentary |

Mammary/pregnancy use the Visceral presentation zone; no anatomy classification changes. HRA-derived study tissues retain their existing source-system assignments, including any integumentary tissue. Only present families receive lanes, preserving this global order without sorting by piece count.

## Adaptive family and final lanes

1. Union actual assembled bounds of eligible representations within each family.
2. Allocate each midpoint lane its actual horizontal width, with a small numerical minimum of `.001` world units.
3. Use a gap of 7% of the largest active-scope assembled span. This scales with Whole body, small stations and isolated assemblies.
4. Center the combined lane intervals about the active navigation focus X coordinate, or the eligible assembled union center when no navigation focus exists.
5. Translate each family on **world X only**, from its actual assembled center to its lane center. All members receive exactly the same translation.
6. Adapt the existing variable-size shelf packer within each family at a fixed local aspect of `.65`, independent of viewport. Preserve height-first packing with an immutable, locale-independent encoded source-ID tie break, equivalent to the model-bound RepresentationId suffix. The recorded order is the actual shelf cell order.
7. Allocate final family zones using `max(assembledFamilyWidth, packedFamilyWidth)` plus the same gap and deterministic order. Final cell centers are local shelf centers plus that final zone center; Y is centered about the active scope center and final Z is the scope-center plane.

The piece translation includes the necessary movement from the completed midpoint lane to its final family zone. This permits family-local inventories to widen continuously without intermixing the final families. Final horizontal projected world bounds lie inside their family zones, with no shared cell or hidden slot. At 100%, individual pieces form recognizable adjacent family inventories. Intermediate Stage 2 geometry can overlap while moving toward its cells; collision-free interpolation is not claimed.

Missing/nonfinite/reversed bounds are sanitized for layout, tiny projected dimensions have the existing `.035` minimum and `.04` cell padding, and empty sets produce finite zero bounds. A single representation has zero translation at every amount.

## One continuous slider and equations

The centralized breakpoint is `SYSTEM_SEPARATION_END = .30`. Let `S(t) = t*t*(3-2*t)` for clamped `t`:

For two or more families:

```text
familyWeight = S(clamp(amount / .30))
pieceWeight  = S(clamp((amount - .30) / .70))
offset = familyTranslation * familyWeight + pieceTranslation * pieceWeight
position = assembledPosition + offset
```

At 0 all offsets are exactly zero; at 30% there is no per-piece movement; at 100% the family-local cells are reached. Both value and first derivative are continuous at the breakpoint. For fewer than two families, family translation is zero and `pieceWeight = S(amount)` uses the whole useful range. The midpoint label/marker is omitted for those views. Some already well-separated small assemblies need only tiny final offsets; this is not an imposed dead first stage.

The single slider remains pointer/touch/keyboard operable, with 1% keyboard steps and no snapping. A subtle noninteractive marker and "Systems apart" label appear at 30% only in multifamily scopes. `getAriaValueText` reaches the actual Base UI slider thumb and exposes Assembled, Separating system families, Systems apart, Separating individual structures and Every piece. Caption status uses the same centralized stage semantics. Explicit scope/isolated captions retain their existing precedence.

Direct slider transformation updates on the next existing render frame, without an added settle tween, including reduced-motion users. Retained browser tests now compare successive real GPU snapshots for stability rather than requiring the old decorative damping to produce another near-zero upload. Region/Area harnesses capture those real pixels, and the hide/restore harness compares final offsets with the new scope-centered family layout.

## Camera continuity and user control

Assembled navigation framing is retained. Slider movement never calls the whole-view reset or isolated-assembly refit. Camera target and projection offset remain fixed during a drag. A pure eight-corner perspective fit derives distance from the interpolated layout bounds relative to the fixed target and captured view direction. Stage easing blends the assembled distance into the required padded distance continuously; subsequent amount changes apply only the ratio of the new distance to the previous requested distance.

The ratio preserves current orbit orientation, user zoom and cursor-anchored pan/zoom. Layout lanes remain on world X while orbiting. Orbit and zoom remain available at every amount, including 100%; the old late-stage forced Pan/Front restrictions are removed. Explicit camera view buttons remain available. Explicit navigation, Reset, resize, isolation entry/exit and inspector framing may still perform their existing intentional fits. Eligibility-only hide/restore and Systems changes rebuild offsets without moving the camera; the next slider change reanchors its ratio denominator to the new bounds while retaining the assembled-distance reference, without an initial jump or permanently shrinking the midpoint view. Existing automatic rotation controls and ring/marker visibility rules remain.

## Shared visibility and dissection composition

Only `resolveVisibility(...).packingEligible` representations with loaded geometry enter the cache. Hidden/unloaded/context exclusions, selection exceptions, Systems, model chest rules, Regions and explicit Phase 4.7 Area scopes retain the central resolver. No second filter implementation is added. Area display still supersedes broad Region evidence. Persistently isolated assemblies use their frozen scope independently of selected members. The pectoral-girdle assembly has two actual source families (muscular and skeletal); its behavior follows those classifications, while the two-piece Sartorius assembly and Skeleton preset demonstrate the one-family path.

Hiding removes the representation entirely from the target map; restoring recomputes compact cells. Noneligible representations have zero offsets. GPU visibility/selection, picker matrices, marker positions and projected hover/fallback targets update together. No hidden invisible picker or stale offset is retained. Counts, identity, canonical navigation, chest and Search/Browse semantics are unchanged.

## Rendering, performance and scope

Merged/batched geometry, the existing Float32 offset/visibility texture, Uint8 selection texture, picker meshes and marker buffer are reused. Each changed slider value uploads the existing state buffers; idle frames perform no layout rebuild or repeated slider upload. Targets are not stored in a new Three object per representation. Pure interpolation and fitting are linear in eligible count; sorting/packing occurs only on cache rebuild. No new rendering dependency, pass, framebuffer, shadow map, floor plane or postprocessing. Layout computation observations and bundle deltas are recorded in validation; no controlled FPS claim.

Created: `scripts/explosion-layout.test.mjs`, `scripts/explosion-browser-smoke.mjs`, and the two Phase 5.0 integration records. Modified: `app/explosion-layout.ts`, `app/scene.tsx`, `app/page.tsx`, `app/globals.css`, `components/ui/slider.tsx`, `package.json` (two test aliases), and the seven existing browser harnesses for Regions, Areas, hide/restore, interaction, Area scopes, discovery and presentation. Dependency versions/lockfile are unchanged.

No geometry/model/manifest, identity, Region, Area, representation-scope or scientific evidence changes. Search/Browse, navigation rail, Systems/Hidden, theme, Display and loading choreography are retained. No supplemental anatomy, nerves, MVMT runtime integration, HRA upgrades, knowledge, pathology, pharmacology or later phase was started. Main remains unchanged; handoff is limited to the requested phase branch.
