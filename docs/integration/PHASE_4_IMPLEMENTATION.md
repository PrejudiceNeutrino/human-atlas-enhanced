# Phase 4 implementation: per-structure hide and restore

Implemented on `phase-4/hide-restore`, starting at clean HEAD `401d187642dc07221d3cf3e130bc40e16ab720f6`, the reviewed Phase 3 endpoint. The requested branch, HEAD, clean tree, Phase 1-3 implementation/validation records, six architectural modules and reserved `SceneState.hiddenRepresentationIds` contract were verified. All integration records were read. The Phase 1-3 architecture remains authoritative.

## Frozen donor and behavior port

Donor: PR #421, tag `donor/pr-421`, exact SHA `3a5be52518c51eb7acaff892c42ce9eaedcbbd62`, title `feat: hide and restore individual anatomical structures`. Its `app/anatomy.ts`, `app/page.tsx` and `app/scene.tsx` were inspected at that commit. No merge or cherry-pick was performed.

Adopted behavior: **Hide structure** in the detail inspector, selection clearing after hide, **Restore hidden (N)** in Systems, reset restoring hidden structures, search/direct selection restoring its selected pieces, and hidden geometry excluded from display/picking/explosion packing. The existing inspector and Systems hierarchy/styles remain; EyeOff marks the hide action and both new controls have 44-pixel minimum touch targets.

Deliberately not copied: donor `hidden: string[]` source-part storage, approximate visible-count formula, renderer-local hide condition, or its upstream-only model assumptions. There is no second hidden-state authority, visibility dialog or undo history. The refinement below adds an individual hidden-item list derived from the same RepresentationId state.

## Identity and temporary state

`SceneState.hiddenRepresentationIds?: readonly RepresentationId[]` uses Phase 1's unchanged `atlas:representation:<modelId>:<encoded sourcePartId>` identity format. Defaults and the central reset helper explicitly initialize `[]`. This is temporary viewer interaction state, not canonical anatomical data. No English name, FMA ID, canonical concept, region or teaching area is stored as a hidden identity.

`IdentityIndex.representation(id)` adds exact, model-bound reverse lookup over the existing in-memory representation records. It neither changes nor regenerates the crosswalk. Unknown, malformed, raw-source, alternative-encoded and foreign-model IDs do not resolve and are ignored. No prefix parsing or name inference can hide a coincident source ID from a different model.

The small `app/hide-restore.ts` helper module maps selected source parts through `representationForPart()`, verifies the bound model and deduplicates their RepresentationIds. `hiddenPartIdsForModel()` derives a transient current-model `ReadonlySet<string>` from exact reverse lookup. `app/page.tsx` memoizes this set into `displayState.hiddenPartIds`; it never stores it in authoritative React viewer state. Its size is the active-model hidden count, including hidden pieces excluded by ordinary filters.

## Actions and composition

| Action | Exact behavior |
|---|---|
| Hide structure | Union all currently selected, known current-model RepresentationIds into hidden state; deduplicate; clear source-part selection; exit isolate; stop rotation; close inspector and clear its chosen record. Preserve model, systems, region, teaching area, chest mode, explode amount, view and camera reset counter. |
| Multi-piece selection | Hide every selected current-model representation, including canonical resolver expansions and existing curated search groups. A direct mesh selection hides only that one representation. No canonical-concept hiding is invented. |
| Search selection | Resolve the existing canonical concept or curated source-part group, validate/deduplicate current-model source parts, remove exactly their RepresentationIds from hidden state and select them in one state update. Fully hidden and partly hidden groups restore; unrelated hidden IDs remain. |
| Direct part selection | Retain the existing current-model representation guard and use the same atomic selection/restore helper. Unknown or foreign representation inputs cannot enter selection. Hidden renderer geometry remains unpickable. |
| Restore hidden (N) | Shown only for a positive active-model hidden count. Clear `hiddenRepresentationIds` only. Keep systems, region, area, selection, isolation, explode, chest mode, rotation and camera. Restored pieces re-enter ordinary visibility rules; a disabled system stays disabled. |
| Region / Teaching Area / None | Existing navigation cleanup/framing is unchanged and preserves hidden IDs inside the same model. Canonical memberships and navigation focus bounds are unchanged. |
| Systems / presets / Hide all | Existing system-layer actions preserve hidden IDs. Hide all empties systems and clears selection/isolate as before. Restore hidden cannot enable those systems. |
| Outside-area search exception | Existing selected exceptions still override ordinary area/region/system filtering after explicit restore. Hiding that selection clears the exception; the normal active area view resumes with its membership unchanged. |
| Isolate then hide | Hide selected representations, clear selection/isolate and close the inspector. Existing isolate-exit camera behavior resumes the surrounding viewer; no empty isolation mode remains. |
| Full reset | Central `resetViewer()` clears hidden state/masks and retains Whole body, no area, default systems, tissue chest view, assembled geometry, cleared selection/isolate, stopped rotation, three-quarter view and existing reset increment. |
| Model switch | Existing reset/model helper and routed navigation clear hidden state and model-specific geometry state. Canonical region/area survive and resolve independently on the destination model. Returning to the first model starts with no hidden IDs; there is no per-model cache or cross-model mapping. |
| Reload / URL | Hidden state clears on reload. URLs continue to serialize canonical region/area only; no hidden query parameter, localStorage or database persistence is added. |

## Shared resolver and renderer

`app/visibility.ts` supplies the derived part-set membership to the existing highest-priority hidden exclusion, alongside `context.hidden` and unloaded geometry. Hidden always returns `displayed: false`, `pickable: false`, `packingEligible: false`, including selected, isolated, context, chest and navigation exceptions. `partIsVisible()` and the existing UI count use that same resolver; hiding an already excluded piece does not decrement the count again.

The renderer detects `hiddenPartIds` changes alongside the existing filters. Its eligible-only part list feeds the unchanged explosion packing algorithm and layout key. GPU visibility, selection texture, picker offsets, marker positions and projected hover/fallback targets refresh in the same update. Noneligible pieces receive zero exploded offsets and no inventory cell. Display-excluded pieces receive no GPU selection highlight. A state change clears the old hover label/cursor, projected targets are rebuilt through resolver pickability, and fallback targeting rechecks latest state to reject stale hidden targets before the next render.

Restoring/hiding while fully exploded recomputes the inventory from eligible pieces, avoiding blank cells. Hidden-state changes suppress the existing layout-change camera refit; assembled navigation focus remains based on its complete canonical collection. There is no hide/restore camera-fitting handler. Existing orbit, zoom, reset/view, region/area and isolate camera code and math remain intact. Explosion slider motion retains its existing camera behavior.

## Validation, scope and limitations

`npm.cmd run test:hide-restore` exercises 27 focused tests, including all three registered models and negative IDs. `npm.cmd run test:hide-restore:browser` validates male/female desktop/mobile-width UI actions against actual GPU uploads, real triangle picks, eligible-only offset layouts and camera uniforms, with no production test hooks. See `PHASE_4_VALIDATION.md` for recorded baseline/final results and acceptance.

HRA remains internally registered and unrouted, with model-bound hide behavior tested at unit level. Source concept granularity can select many pieces; hiding follows that existing selection exactly. Existing regional/area coverage and scientific limitations carry forward. Female study readiness is not promoted. Real touch-device and anatomical review remain separate from browser smoke.

No geometry, model manifest, identity dataset, region/area dataset, dependency or lockfile is changed. Apart from the focused selection tint refinement below, no rendering polish, new taxonomy/membership, supplemental anatomy, lazy/context loading, knowledge or later-phase work is included.

Created: `app/hide-restore.ts`, `scripts/hide-restore.test.mjs`, `scripts/hide-restore-browser-smoke.mjs`, and the two Phase 4 integration records. Modified: `app/anatomy.ts`, `app/identity-index.ts`, `app/visibility.ts`, `app/region-navigation.ts`, `app/page.tsx`, `app/scene.tsx`, `app/globals.css` and `package.json` (test scripts only).

## Phase 4 refinement: reversible dissection, H and selection clarity

Refines committed Phase 4 base `890ebf3ab6cf0488b71714302a5f1c942a4438d9` on `phase-4/hide-restore`. The branch and clean starting tree were verified; main remains at the Phase 3 endpoint. This is a focused Phase 4 update, with no Phase 4.5 work.

Systems now shows **Hidden structures**, its active-model count, a bounded scrollable list of physical pieces, individual **Restore** buttons and **Restore all**. It appears only when at least one valid current-model representation is hidden. Each row uses the existing part name; identical names gain the existing source reference, rather than displaying internal RepresentationIds. Long names wrap, each Restore has at least a 44-pixel target, and Systems keeps its own scroll region. The hidden viewport reserves at least one complete 44-pixel row and caps at 18 viewport-height units / 156 pixels. When hidden rows exist, the desktop panel uses 40 additional pixels of existing lower space to accommodate female chest controls; outer-panel scrolling handles shorter viewports instead of clipping actions.

`hiddenRepresentationsForModel()` resolves exact current-model IDs and reverses their deduplicated insertion order for newest-first presentation. The authoritative `hiddenRepresentationIds` array is unchanged; there is no separate list state, timestamp history or canonical-concept hiding. A repeated hide neither duplicates nor moves an existing row. A multi-piece concept produces one independently restorable row per hidden representation.

`restoreHiddenRepresentation()` removes exactly the requested RepresentationId. It changes only the hidden override, preserving other hidden pieces, unrelated selection, isolation, rotation, region, area, systems, chest mode, explode amount and camera state. It does not select restored anatomy. **Restore all** uses the existing override-only helper. Both restore operations re-enter the shared ordinary visibility/picking/packing resolver; disabled systems or active filters can keep restored geometry invisible. Search still atomically restores and selects only its matching current-model representations.

The inspector shows a subtle **H** hint and `aria-keyshortcuts="H"`. Plain H/h invokes the exact same `hideSelected` callback as its button, including inspector closure, selection/hover/highlight cleanup and isolate exit. The guard rejects absent, unresolved or foreign-model selection; Ctrl/Meta/Alt combinations; repeats; composition; already-handled events; and input, textarea, select, contenteditable or combobox/textbox/searchbox targets and ancestors. Shift allows uppercase H. The existing `/` search handler is unchanged.

The existing GPU selection texture now replaces the selected fragment's diffuse color with saturated linear RGB **(0.008, 0.42, 0.32)**, independent of system color, and uses opaque selected surfaces. The existing standard-material lighting, normals and surface shading still run afterward. Nonselected material colors/opacity are untouched. The shader program cache key changes with this shader version; no extra textures, render passes, outlines, postprocessing, lighting, background, tone mapping, shadow pipeline or dependencies are introduced. Hidden geometry continues to receive no selection texture value, and individual restore does not auto-select it.

The existing suite now contains 35 focused tests and expanded male/female desktop/mobile smoke, including actual screenshot pixel inspection of pale bone, muscle, artery and vein selection in assembled views, and selected bone while exploded. See the labeled refinement validation below in `PHASE_4_VALIDATION.md` for final evidence and acceptance. Refinement modifies only this document, its validation record, the hide helpers, viewer controls, scoped CSS, selection shader and existing two Phase 4 test files.
