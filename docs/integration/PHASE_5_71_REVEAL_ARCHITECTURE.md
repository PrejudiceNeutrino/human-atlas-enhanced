# Phase 5.71: Context Reveal architecture audit

Date: 2026-10-05. Repository: `PrejudiceNeutrino/human-atlas-enhanced`. Branch: `phase-5.7/reveal-architecture`.

## Decision and scope

Recommend **explicit Context Reveal that ghosts every already-visible non-target representation**, using a separate model-bound target mask and **opaque target batches plus transparent context batches sharing existing geometry**. Keep normal depth testing on both; targets write depth, ghosts do not. Start visual tuning near 0.1 ghost opacity, with single-pass double-sided ghosts. Prune target draws to batches containing visible targets. This is Option A for context selection, with a bounded two-pass material architecture for rendering.

This commit contains investigation, documentation, a local browser diagnostic, and evidence only. It implements no production Reveal state, renderer changes, picking behavior, or UI. Phase 5.72 has not begun. Proposed names/code below are a handoff specification, not existing application APIs. [Experiments and validation](PHASE_5_71_REVEAL_EXPERIMENTS.md) distinguish measured behavior from recommendations and untested alternatives.

## Repository prerequisite and reviewed history

At start, `git branch --show-current`, `git status`, `git log --oneline --decorate -30`, and `git branch -vv` confirmed the expected branch and clean tree. HEAD, local main, origin/main, and the phase tracking branch were all **`8bad70ea21d0a0b05446bba09b7daad124a7dc9d`**. A live `git ls-remote origin refs/heads/main refs/heads/phase-5.7/reveal-architecture` confirmed the same heads. The branch starts exactly from current main, rather than merely sharing an ancestor.

The ancestry includes accepted Phase 5.6 `7077a04`, 5.6.1 `89a4fa1`, 5.6.2 `2bf1b22`, and 5.6.3 `8bad70e`. Implementation/validation records from the core identity phases through 5.6 and the three subsequent cleanups were consulted, particularly 4.5 rendering, 4.7 Area display scopes, 4.8 discovery, 4.9 display, 5.0 explosion, 5.1 isolation, 5.3 motion, and 5.6.3 system controls. Earlier browser waivers remain waivers; this audit does not retrospectively certify them. The current main includes the accepted Phase 5.6 work. No donor merge/cherry-pick, dependency upgrade, or main modification is included.

## 1. Current rendering path and ownership map

| Stage | Actual source and contract |
|---|---|
| Model selection | [model-registry.ts](../../app/model-registry.ts) maps routes/legacy viewer names to stable ModelIds and separate manifests. Male and female study have public routes; HRA reference remains a registered internal model. |
| Catalogue loading | [page.tsx](../../app/page.tsx#L70) fetches active manifest, identity crosswalk, Regions, Areas and explicit Area representation scopes with abortable loading. It constructs model-specific indexes. |
| Stable identity | [identity-index.ts](../../app/identity-index.ts#L29) encodes `atlas:representation:<modelId>:<encoded sourcePartId>`. Exact lookup connects an ID to current source part, chunk, offsets and bounds. Canonical concepts can resolve many representations. |
| Discovery and selection | [anatomy-discovery.ts](../../app/anatomy-discovery.ts#L21) derives active-model entries from shared Search resolution, rejecting missing/unavailable/foreign/empty geometry and deduplicating RepresentationIds. `choose` resolves source part IDs and calls `selectRepresentations`. |
| Derived render input | `page.tsx` derives `regionPartIds`, explicit `areaPartIds`, `hiddenPartIds`, and frozen `isolatedPartIds` without rewriting their representation authorities. It passes `displayState` to the scene. |
| Eligibility | [visibility.ts](../../app/visibility.ts#L25) returns `displayed`, `pickable`, `packingEligible`; the scene supplies selection/system sets and loaded status where required. These channels are related but not identical. |
| Binary geometry | [scene.tsx](../../app/scene.tsx#L111) uses three concurrent chunk workers; gzip when supported, otherwise raw binary; `decodeModelResponse` checks response/size. Manifest offsets address Float32 positions, normalized Int16 normals, Uint32 indices. |
| Part geometry and picker | One BufferGeometry and a non-scene picker `Mesh` per part. Bounds/sphere are assigned; a constant Float32 `partIndex` attribute is added per vertex. Pickers retain the original individual topology. |
| Render geometry | Parts within each `(chunk, material category)` are combined by `mergeGeometries(gs, false)`. A normal `THREE.Mesh` renders each merged geometry, with frustum culling disabled. Geometry groups are not used to make a draw per part. |
| Shader state | A Float32 RGBA `partState` DataTexture stores XYZ explode offset and W visibility; a Uint8 RGBA `selectionState` texture currently uses R for highlight. Width is the next power of two of part count. Nearest sampling, no mipmaps, no color-space conversion. |
| Final presentation | MeshStandardMaterial, injected shader, environment/lights, ACES filmic tone mapping, exposure and sRGB output. Existing dirty rendering performs one scene render when needed inside the shared animation loop. |

```text
RepresentationId -> active IdentityIndex -> source part / atlas.parts index
  -> resolveVisibility(displayState, loaded/current selections/systems)
  -> partState.W (fragment discard), selectionState.R (highlight)
  -> original chunk geometry + per-vertex partIndex
  -> merged chunk/category Mesh + shared MeshStandardMaterial
  -> vertex offset + fragment highlight + display contrast
  -> depth/blending + ACES/exposure/sRGB -> canvas
```

Source-derived female breast tissue (`mammary`, and specified `VH_F_` integumentary tissue other than `VH_F_skin`) uses the `hra-breast` category and a plain reproductive-colored material. It retains its original source systems for visibility. The material category is not a new scientific classification.

Static manifest inventory at the audited SHA:

| Model | Parts | Chunks | Merged anatomy batches | Used material categories | Manifest triangles |
|---|---:|---:|---:|---:|---:|
| Male | 2,234 | 15 | 69 | 15 | 2,288,268 |
| HRA reference | 888 | 10 | 28 | 15 | 1,810,038 |
| Female study | 2,245 | 17 | 70 | 15 | 2,437,148 |

Male counts were also observed in the actual browser scene. The other two batch inventories are static code/manifest calculations, not new browser certification.

## 2. Material ownership and current transparency

`materialFor` ([scene.tsx:92](../../app/scene.tsx#L92)) creates one material per `SYSTEMS` entry, plus `hra-breast`: **18 allocated standard materials**, including unused categories. Render batches across chunks share these material objects. A representation has no independent render Mesh/material. The separate picker Mesh is constructed without a supplied material and gets Three's default mesh material; it never renders and does not carry visual state. Changing its opacity would accomplish nothing on the canvas.

There is no `BatchedMesh`, `InstancedMesh`, skinned mesh, per-part React component, selection-material replacement, or anatomy ShaderMaterial path. Geometry merging is the batching technique. MeshStandardMaterial is customized with `onBeforeCompile` and program cache key `atlas-standard-display-v4`.

Ordinary anatomy: DoubleSide, metalness .08, roughness .53, opacity 1, transparent false, depthWrite true, default depthTest true. Body surface: transparent true, opacity .1, depthWrite false, still DoubleSide/depth tested. Selecting a surface raises its shader alpha toward 1 but does **not** move it into the opaque render list or enable depthWrite. Existing surface transparency proves blending support, not arbitrary independent per-part opacity support.

Presentation-only Points markers are transparent .72, depthTest false, renderOrder 10; they are not an appropriate target-depth precedent. Classic floor materials have separate theme/entrance opacity handling. Procedural floors use their own transparent ShaderMaterial, depthTest true/depthWrite false/renderOrder -1, disabled raycast, and `presentationOnly`. Floor methods named `setReveal`, scene prop `revealed`, and `revealStart` concern startup choreography, **not Context Reveal**. Do not reuse these names/state as the new feature's authority.

## 3. Selected-state implementation and available channels

Normal selection is current-model source part IDs in `SceneState.selected`, derived through exact representation resolution. Each displayed selected part writes a target highlight byte 255 into `selectionTexture.R`; a sparse map interpolates changed bytes over the Phase 5.3 fast duration (120 ms), or immediately for reduced motion/loading. The shader mixes diffuse RGB toward `(0.008, 0.42, 0.32)` and alpha toward 1 using that byte. Lighting/shading still applies. Explicit hidden state prevents both display and selected highlight.

| Per-representation channel | Present capability | Cost / required extension |
|---|---|---|
| Visibility | W float in partState; fragment discard | Existing linear update/upload on relevant state changes. Invisible vertices still pass through the merged draw. |
| Selected color | R byte in selectionState | Existing sparse interpolation; no material clone/recompile. |
| Arbitrary color | Shared category diffuse color only, apart from selected mix | Add a texture channel/lookup and shader branch; cheap bounded state, no per-part material needed. |
| Opacity | Shared material opacity; selected alpha override | Add a separate presentation texture/uniform. Correct blend/depth policy also needs material passes. |
| Emissive | Shared standard material property; no per-part emissive highlight | Possible shader/texture extension, currently absent; do not promise an existing emissive channel. |
| Transform | Per-part XYZ translation in partState and matching picker matrix | Existing explode path. Per-part rotation/scale is absent and outside Reveal scope. |
| Draw order | Per merged Mesh/Object3D | No cheap per-part renderOrder inside a merged draw. Splitting/extracting geometry or separate passes is needed. |
| Depth behavior | Per shared material/render pass | Cannot vary depthWrite/depthTest per representation with an opacity texture alone. |

Do not use interpolated selection intensity to decide target membership: during fade it is fractional, and a broad target must retain exact representation identity independently of highlight timing.

## 4. Exact visibility and isolation pipeline

The actual resolver is not a strict intersection of every filter:

1. Explicit Hidden (context or derived hiddenPartIds) and explicitly unloaded geometry always reject display, picking and packing, including selected targets and isolation members.
2. Isolation accepts only frozen `isolatedPartIds`, falling back to selection only for legacy inputs. It intentionally bypasses ordinary Systems/Region/Area/chest exclusions **within that workspace**.
3. Outside isolation, **nonselected** parts require their enabled system, active navigation membership, depth membership when supplied, and chest display rules. Active Area membership replaces incomplete Region membership; an absent explicit Area scope yields no ordinary area geometry.
4. Selected parts outside isolation retain the established selection exceptions to those ordinary filters.
5. Context-only geometry, when supplied, can display but cannot pick or pack. Body surface is not pickable when solid anatomy is present. Neither rule is opacity-based.

The renderer derives loaded availability from picker presence for packing; the geometry render path inherently has no draw for an unloaded part. Counts in the page use catalogue state rather than loaded geometry. Keep that distinction in diagnostic assertions.

`isolatedRepresentationIds` is the frozen model-bound authority. Active `selected` is inspection; `hiddenRepresentationIds` is dissection; neither defines workspace membership. `isolateSelection` explicitly freezes selection and resets explode. Member picking/Included rows preserve parent scope. Hide/clear can leave an empty or unhighlighted workspace. `isolationCameraKey` uses workspace parts, reset and aspect, not selection/hides/Reveal.

**Systems contract clarification:** Reveal must never enable a disabled system or add its excluded anatomy to context. Existing selected and isolation exceptions can already display geometry with its switch off, as accepted in Phase 5.6.3. Preserve that existing behavior: the guarantee is that entering/exiting Reveal changes no base eligibility or switches. An absolute rule that *every* off-system part vanishes, including frozen isolation members and ordinary selected exceptions, would change previous product contracts and is not part of this presentation layer. Phase 5.72 must test the existing exception explicitly rather than silently claiming a strict intersection.

## 5. Proposed state, targets and context selection

Keep the persisted scientific/dissection/navigation authorities untouched. The new state is transient, reset with scene/model lifecycle, absent from URL/localStorage:

```ts
type ContextRevealState = { mode: 'off' | 'context'; modelId: ModelId | null };
// Derived, never another mutable copy of selection:
selectedRepresentationIds = representationIdsForPartIds(identity, state.selected);
baseVisibleIds = loaded representations accepted by resolveVisibility(...).displayed;
targets = intersect(selectedRepresentationIds, baseVisibleIds);
ghostContext = difference(baseVisibleIds, targets);
```

The derived target/context sets are model-bound RepresentationIds; transient atlas indices belong only at the renderer boundary. No canonical/name-based target guessing. Keep target mask distinct from selection intensity, Hidden IDs and frozen isolation membership. Naming `revealContextRepresentationIds` is more honest than `occluders` in V1: many ghosted parts will be beside/behind the target, with no geometric blocker claim.

Enable only when current loaded selection resolves at least one displayed target. Empty target sets normalize effective mode to off before drawing/picking. A partially hidden/unloaded selection targets only its displayed subset; never restore missing targets. If context is empty (all visible workspace parts targeted), render targets normally and describe that there is no surrounding context; do not manufacture full-body context.

| Selection kind | Target |
|---|---|
| One representation | That exact displayed current-model representation. |
| Liver or another multipart concept | All resolved selected representations, including constituent structures from multiple source systems; never just the first inspector part. Male Liver resolves 60 parts. |
| Broad group/composite | Exact active-model selected set, with every target mutually depth-occluding normally. No scientifically invented shell/outermost-member rule. May have little context and high complexity. |
| Teaching Area navigation | Navigation changes display scope and clears selection; it does not itself select all Area members. Reveal requires an actual subsequent selection. |
| Selected member within isolation | Selected member subset of displayed workspace; ghost other displayed workspace members only. |
| Random unhighlighted workspace root | No selected target; Reveal unavailable until a member is actually inspected. Workspace inspector identity is not selection. |

Selection changes to a different structure leave Reveal in V1; the user explicitly invokes it for the new subject. A same-target pick can retain it. Optional later automatic/continuous retargeting is architecturally possible through this derived mask, but is not V1 default behavior.

## 6. Context/occluder strategies evaluated

| Strategy | Fit, reliability and expense | Decision |
|---|---|---|
| A: ghost all visible non-targets | `G = B - T`, O(N) on eligibility/target changes, no camera-dependent calculations. Handles thousands of representations and exact deterministic tests. More context is faded than necessary. | **V1 recommendation.** Browser-tested transparency/depth variants on six structures. |
| B: system/context heuristics | Category-level state is easy, but systems are not physical depth layers. Vessels, organs, muscles and skeleton can each block any target; camera rotation invalidates simplistic heuristics. Selected concepts span source systems. | Reject for V1: unreliable blockers and arbitrary scientific-looking rules. No heuristic data generated or browser implementation tested. |
| C1: projected boxes / CPU bounds | Eight corners per visible part plus camera-depth interval and target screen overlap; O(N) coarse computation per camera invalidation. Cheap relative to triangle raycasting but boxes include empty space and near-plane projection needs clipping. | Possible later broad phase; alone is not true geometric occlusion. Existing explode projections are only fallback targets, not an occlusion oracle. |
| C2: camera-to-target rays / sampled rays | Single ray misses thin targets/holes and off-center blockers; bounded multi-ray sampling improves coverage but not completeness. Current click picker provides individual geometry/AABB tests; no BVH/spatial index exists. Multiple rays times thousands of pickers/triangles can be expensive. | Reject V1 per-frame full-scene raycasts. Sparse rays on throttled camera changes would still need budgets and stability/hysteresis. No measured CPU blocker timings claimed. |
| C3: depth/stencil/ID buffers | Closest screen-space answer, but target geometry must be rendered separately, with representation IDs/depth comparison and potentially readback or GPU classification. Must handle hidden targets, multisample edges, transparent context and exploding meshes. | Reject V1: more passes/resources/complexity than required; CPU readback can stall. No current postprocessing framework; no new framebuffer necessary for recommended path. |
| D: coarse bounds plus limited exact sampling | Reduces candidates, can retain more anatomy unghosted; inaccurate/coarse classifications can leave opaque blockers and can flicker during orbit. Hybrid detection alone does not solve alpha/depth batching. | Later enhancement behind the same presentation mask. Requires accuracy, camera budget, hysteresis and target legibility evidence before adoption. |

This evaluates four product strategies and three geometric mechanisms. Only A's rendering variants were experimentally exercised; B/C/D were technical/code evaluations, not fabricated visual experiments.

## 7. Recommended material and depth architecture

For Phase 5.72, allocate a bounded presentation mask DataTexture (RGBA Uint8, next-power-of-two width, same nearest/no-color-space sampling). R is exact target membership. Reserve other channels only as future capacity, not required features. Share it across material variants. At 4,096 texels it is 16 KiB CPU plus GPU storage, excluding driver overhead. Do not overload `partState.W` or the animated selection R byte.

Compile distinct cached `normal`, `context-target`, and `context-ghost` variants per material category. Explicitly install `onBeforeCompile`/program cache keys on clones: material cloning does not copy the custom compile callback. Reuse partState, selectionState, contrast uniform and standard lighting/color transforms. Construct bounded variants once per scene/category, never per representation/frame; dispose them and the new texture during scene cleanup. Keep immutable current geometry shared between normal/target and ghost Mesh wrappers. Creating a wrapper does not copy GPU position/index buffers.

| Pass | Mask rule after ordinary visibility discard | Alpha | Depth / blending |
|---|---|---|---|
| Normal / off | Existing shader unchanged | Existing material/selected behavior | Existing baseline settings |
| Context target | Discard non-targets; ordinary visibility still wins | 1.0 | Opaque list, depthTest true, depthWrite true, DoubleSide |
| Context ghost | Discard targets; ordinary visibility still wins | Tunable low uniform, initially around .1 | Transparent list, NormalBlending, depthTest true, depthWrite false, DoubleSide with forceSinglePass true |

One renderer scene render can contain both queues; this is additional geometry draws, not two entire `renderer.render` calls and not postprocessing. Disable normal-only geometry wrappers while Context is active. Render target wrappers only for loaded batches containing displayed targets. Metadata can retain batch part indices at load time for O(N) membership decisions; do not scan millions of vertices each interaction in production. Ghost batches stay shared and can additionally skip wholly invisible/target-only batches if metadata permits. Normal wrappers regain exact original materials/visibility on exit.

Targets draw normally with their own depth, preserving mutual surface occlusion and curvature. Transparent ghosts behind the target fail its depth test; ghosts in front blend over it and retain spatial cues without writing blocking depth. Do not disable target depthTest, clear depth, or force it over the entire scene. A high renderOrder alone cannot fix depth-write problems and cannot interleave opaque and transparent queues. Presentation floor/markers are excluded from the target/context mask.

The compromise does **not** guarantee every member of a broad target is individually visible through other target members. That is normal anatomy/self-occlusion, not an occluder-detection failure. Multiple front ghost layers can still attenuate target contrast; this is a known tuning limit, especially for deep vessels. Preserve the depth compromise before considering a deliberate outline/emphasis enhancement in a separately scoped pass.

## 8. Transparency limitations and rejected render alternatives

The installed Three.js revision is **185**; inspect its actual sources, not assumptions about separate per-part meshes. [WebGLRenderLists](../../node_modules/three/src/renderers/webgl/WebGLRenderLists.js) separates opaque/transmissive/transparent objects and sorts transparent items by group order, renderOrder, object depth, then stable ID. It does not sort the triangles or representations inside one merged anatomy mesh. Intersecting transparent anatomy therefore retains order errors within and between batches, particularly when orbiting or viewing posterior structures.

`depthWrite:true` on ghosts lets low-alpha surfaces prevent later visible fragments. `depthWrite:false` avoids that suppression but increases overlapping fragment work and exposes unsorted internal surfaces. `depthTest:true` against opaque target depth retains front/back cues. Standard alpha blending accumulates: even identical .1 layers have combined coverage `1 - (1 - .1)^k`; ten layers approach .65. Thus low per-layer opacity can still form dense visual clutter. Double-sided transparent materials normally render back then front in two draws; single-pass ghosts trade some surface consistency for lower draws and less redundant layering. Neither variant provides order-independent transparency.

These behaviors are also described in the official [Three.js Material documentation](https://threejs.org/docs/pages/Material.html), particularly transparent queue handling, depth controls, alphaHash and forceSinglePass. The repository's installed source is the version-specific authority.

Rejected alternatives:

- **One transparent anatomy pass with target alpha 1:** measured target internal triangles show through because target surfaces do not write depth; draw order is not per representation. Cheap but fails target surface clarity.
- **Ghosts with depthWrite enabled:** transparent blockers can still suppress targets/context; fails the purpose.
- **Target always-on-top / depthTest false:** removes meaningful spatial/self-occlusion cues and makes unrelated back geometry read as foreground.
- **One mesh/material clone per representation:** loses chunk/system batching and scales resource/draw overhead toward thousands of parts.
- **Rebuild merged geometry per selection:** expensive allocation/copy/upload, unnecessary when masks and bounded variants suffice. A later target-only extraction optimization needs separate evidence.
- **Per-part renderOrder or uniform-only depthWrite:** unavailable inside existing shared draw calls; changing material state affects every part in that batch.
- **AlphaHash:** avoids blend sorting but introduces grain. It is a possible separate renderer experiment, not the chosen product presentation; relying on temporal antialiasing would add an unwanted postprocessing requirement.
- **Weighted blended transparency/depth peeling:** could reduce sorting artifacts but introduces render targets/passes and maintenance cost without demonstrated V1 necessity.

Target 1.0 is an architectural choice. Ghost .08-.15 is a candidate tuning band based on .1/.2/.3 experiments. .2-.3 was visibly busier and attenuated targets. A .4-.6 "near context" tier was not tested and is not recommended for V1: there is no justified near-context classifier yet. Do not freeze such a tier in a scientific dataset or infer it from system labels.

## 9. Picking and zoom semantics

Current picking ([scene.tsx:167](../../app/scene.tsx#L167)) is an event-driven pointer-tap pipeline. It rejects unready/drags, constructs a camera ray, loops loaded displayed pickers accepted by `resolveVisibility(...).pickable`, uses translated AABBs as a broad phase, then exact `intersectObject(mesh, false)` and the nearest hit. Surface is excluded when solid anatomy exists. Picker positions include explode offsets and grounding. Picker material has default FrontSide, whereas render materials are DoubleSide; this existing mismatch merits an inside/back-facing test in 5.72, not an unsolicited renderer repair in 5.71.

Above explode .45, projected part bounds provide a no-hit fallback; pointer hover activates at .5, and markers at .75. Bounds are generated from current transformed positions on dirty frames. Cursor-anchored wheel zoom separately uses an event-driven nearest visible-solid geometry ray then a target plane fallback. None of these reads rendered opacity or the selection shader to decide hits.

Recommend **C: exact target-hit priority, otherwise inspectable ghosts**. During Context, find the nearest eligible target hit and nearest eligible ghost hit in the same event loop. Choose the target if its triangles actually intersect the pointer ray; otherwise select the nearest ghost. Do not give priority merely because the pointer lies inside a large target bounding rectangle. An ordinary ghost pick exits Reveal and inspects that structure normally; same-target picking retains Reveal. Included rows remain an alternate way to reach members. Ghosted body surface retains its existing suppression when solids exist; "inspectable" applies to the existing pickable set, not every drawn presentation object.

Use the same priority policy for exploded fallback/hover to avoid contradictory labels; exact hit wins before the bounded nearest projected fallback. Use nearest target-hit zoom anchoring during Context when a target ray hit exists, otherwise preserve existing nearest-visible/plane behavior. This prevents a clearly visible internal target from zooming about a ghost shell. Outside Context, all current picking/zoom behavior stays byte-for-byte equivalent. No raycast added to the animation loop, no new per-frame hit cache, no hidden picker resurrection.

Only this architecture is recommended here; priority and revised zoom/hover are **not implemented or browser-certified** by the diagnostic. The experiment's material wrappers never become pickers.

## 10. Composition and lifecycle / edge-case contract

| Feature or edge case | Intended V1 behavior |
|---|---|
| Search/Browse | Resolves and selects normally; no automatic Reveal. Selecting a new subject exits existing Reveal. Ordinary Search may restore its own selected hidden representations via the existing selection callback; Reveal entry itself never invokes that restoration. |
| No selection / clear selection | Effective mode off, action unavailable. Clear still preserves frozen isolation and Hidden state. Closing only the inspector is not clearing selection; provide an accessible Exit reveal control by the scene caption while active. |
| One tiny representation | Valid exact target; no minimum name/size heuristic. Does not automatically zoom on entry. User camera controls remain available. Thin-member legibility is a tuning/verification checkpoint. |
| Large/broad composite | Target all exact displayed selected members. Preserve normal target self-occlusion; no forced cutaway. If all context is targeted, render normally without inventing context. |
| H / Hide | Existing callback hides all selected current-model IDs and clears selection; Reveal exits. Hidden wins immediately, never a fade that briefly resurrects the target. |
| Already hidden / partly hidden target | Target intersection excludes hidden IDs. If none remain, off. If some remain, render only that subset. Never call selectRepresentations to "activate" Reveal. Current H clears all active selection; partial-hidden input is a robustness case rather than a new partial-hide UI. |
| Individual restore / J / Restore all | Change Hidden overrides only. Restored parts appear only where the current resolver permits, ghosted if eligible non-targets during still-active Reveal. No reselection, new target, isolation exit or automatic mode entry. |
| Disabled Systems | No enabled-array mutations or added context from rejected systems. Preserve existing selected/workspace exceptions documented above. Ordinary individual toggles currently clear selection/isolation and thus exit Reveal. Header Eye preserves selection/workspace; Reveal may remain effective on its surviving base set. |
| Regions | Region changes clear selection/workspace and reset explode under existing navigation; Reveal exits, rather than carrying old targets to another station. |
| Teaching Areas / None | Existing explicit scope/Area-over-Region authority and navigation cleanup remain. Changes exit Reveal; empty/unavailable Area scope is not filled from concept closure. |
| Isolation entry / narrowing | Exit Reveal, then execute existing isolate action; do not convert target mask into workspace membership. |
| Isolation exit | Exit Reveal as workspace changes; retain existing selection/Hidden/navigation semantics. |
| Active selection within isolation | Explicit invocation targets inspected member(s), ghosting displayed workspace remainder only. No full-body anatomy appears. Scope membership is unaffected even if all members are hidden. |
| Random Anatomy | Exit Reveal. Keep unhighlighted isolated Random root and inspector identity separate; no target until actual member inspection. |
| Explode | Reveal mode/mask never enters layout keys, eligibility or offsets. Draws sample existing XYZ offsets; pickers already mirror them. Slider changes can keep Reveal active. Hide/system actions may legitimately alter packing through their existing eligibility, independently of Reveal. |
| Male/Female/HRA switch | Clear Reveal before old scene disposal. Allocate destination texture/variants from its own atlas indices/ModelId. No cross-model name/ID carryover, male fallback or stale mask. |
| Unavailable female concept | No active-model representations means no target/action. Preserve zero/unavailable status; do not import male geometry or use bounds/name mapping. |
| Light/Dark | Keep existing theme controller, background, floor palette and markers; shared anatomical highlight remains the current shader color. Tune/read targets in both themes; do not modify scientific system colors to simulate depth. |
| Brightness/Contrast | Existing exposure/shared contrast apply to both Reveal variants, with no recompile on slider updates. Their defaults/preferences stay independent. |
| Floor presets | Floor is presentation-only and never ghost context. Existing floor eligibility/preset preference remains authoritative: full assembled figure can retain floor; Region/Area/isolation/explode suppression remains unchanged. |
| Camera lock / Front/Side/Back / orbit / zoom | Reveal entry/exit neither unlocks nor refits camera. Presets/orbit keep current intent semantics. Option A's context mask is camera independent. Existing explode-assisted camera behavior is unchanged. |
| Reset / load failure / context loss | Normalize Reveal off; use existing reset/error behavior. No stale ghost mode survives unavailable geometry. |

## 11. UI and automatic entry recommendation

Keep the existing independent inspector actions:

```text
[ Reveal in context ]   -> [ Exit reveal ] while active
[ Isolate structure ]
```

Disabled until displayed target geometry exists, with an understandable no-selection/unavailable state. Use the native existing Button conventions, keyboard focus, accessible name and pressed/toggle semantics where appropriate. Retain an Exit reveal action near the existing caption when the inspector is closed; a presentation state must not trap users behind a hidden panel. No new shortcut or global toolbar is necessary for V1.

Reject a Normal/Reveal/Isolate three-state selector: isolation is an independent persistent workspace in which Reveal can operate on a member; representing these as mutually exclusive states would erase that composition. Explicit Isolate remains a workspace-changing action, while Reveal is presentation.

Do not automatically enter after Search/Browse, Included selection, Random or model/navigation changes. Selection must remain predictable. A future product policy can dispatch explicit Reveal after successful resolution using the same state/mask architecture; no renderer redesign is needed, but that policy is separate from V1.

## 12. Performance and reduced motion

For N representations, M merged batches, S material categories:

- Entry/target/eligibility updates: O(N) derived ID/index masks and batch target membership; one bounded byte-texture upload. No material changes per idle frame. Existing sparse selection animation is independent.
- Geometry: reuse original merged buffers, no per-part cloning/refetch. Additional ghost Mesh wrappers O(M); at most normal + two bounded variants per category O(S). Program variants depend on pass structure, not target IDs, opacity, camera or selection.
- Draws: conservative two-pass diagnostic submits approximately 2M anatomy draws with single-pass ghosts. Pruning opaque target draws yields M + target-bearing batches; female/HRA estimate comes from the static M=70/28 inventory, not a hardware timing claim. Double-sided ghost default instead approaches 3M.
- Vertices: whole merged batches still process invisible/non-target vertices, even when fragment discard removes them. Batch pruning reduces target work but does not magically draw only target triangles. Fragment blending/overdraw grows with projected overlap; dense torso views may be fill-bound.
- Sorting: transparent list O(M log M), not O(N log N) independent parts/triangles. This cheap sorting is also the reason ordering cannot be fully accurate.
- Shader: one additional mask sample/varying and early pass discard, existing lit standard shading and contrast. No framebuffer, required postprocessing, GPU readback or per-frame occluder computation.
- Picking: existing event-driven O(N) AABB/eligible tests plus exact candidates. Priority classification is cheap per hit; do not double the full raycast or move it to requestAnimationFrame.

Measured Male Liver: normal scene 71 draws / 2,348,630 submitted triangles; single transparent 69 / 2,288,268; unpruned two-pass 138 / 4,576,536; pruned two-pass **77 / 2,699,988**. Floor/surface draws affect scene totals. Full details, hardware and timing limitations are in the experiments record. These are evidence for bounded overhead, not a guaranteed 60 FPS budget on mobile/integrated GPUs. Repeated opacity changes did not grow geometry/program/material counts in the diagnostic.

Prefer instant entry/exit in V1; no opacity animation required. If later fading is added, use the existing finite dirty-frame loop and CSS-owned motion duration, with zero duration and immediate settlement for `prefers-reduced-motion`. A preference change during a transition settles immediately. Do not fade a removed/hidden/unavailable target back in or reuse the animated selection byte as target membership. No per-part timers/React rerender loop; keep material depth/blending modes stable during the fade to avoid compile/sort churn.

## 13. Phase 5.72 implementation and verification handoff

Changes, when separately authorized, belong at: a pure Context Reveal derivation/reducer alongside viewer interaction; transient state/explicit actions in page; bounded mask/material wrappers in scene; event-driven hit-priority classification in pointer/zoom/fallback paths. Identity, visibility authorities, Area scopes, Hidden/isolation data, explosion equations/keys and floor implementation remain the source of their existing semantics.

Required deterministic checks: active-model target resolution; empty/foreign/unloaded rejection; hidden target intersection without restoration; current selected/system exception; fixed workspace subset; broad/multipart target completeness; same/off-mode base parity; mode exit lifecycle; zero changes to Hidden/systems/navigation/isolation or explosion key/XYZ offsets on Reveal entry/exit. Use explicit concept/representation fixtures, not ambiguous coordinate picks. Test target-priority with actual triangle hits and ghost fallback, including small/back-facing targets and existing body-surface exclusions.

Browser acceptance for 5.72 must revisit Male/Female, Light/Dark, selected body surface, dense/deep targets, outside/inside isolation, partial-hidden targets, system/header Eye behavior, Area/Region changes, H/J, Random, explode, camera presets/lock/zoom, reduced motion and rapid toggles/model disposal. Measure normal vs Reveal on a lower-power GPU and during orbit, inspect memory/program stability, and confirm exact baseline restoration after exit. No final UI/picking/transitions/device coverage is claimed by 5.71's local rendering experiment.

Key remaining risks are unsorted intersecting ghost surfaces, accumulated alpha reducing deep-target contrast, merged-batch vertex overhead, existing selected/isolation filter exceptions being misunderstood, body-surface picking exclusions, and model/scene resource cleanup. These are explicit implementation constraints, not reasons to mutate scientific inputs or start Phase 5.72 in this audit.
