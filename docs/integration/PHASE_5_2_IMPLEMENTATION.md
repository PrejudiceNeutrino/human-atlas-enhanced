# Phase 5.2: viewer stabilization, interface polish and repository hygiene

Date: 2026-10-04. Branch: `phase-5.2/stabilization-hygiene`. Starting Phase 5.1/main SHA: `15c124349e60807e633c296c2527e363c7d13e06`. Local main, origin/main and live GitHub main were verified at this SHA before changes. Accepted Phases 1 through 5.1 are included. One pre-existing untracked file, `.vscode/settings.json`, contained only the requested Python analysis exclusions; its contents are preserved and included as workspace hygiene. Main is not merged, modified or pushed.

## Autorotation and dissection

Before: `SceneState.rotate` was a transient boolean; OrbitControls used raw speed `0.65`, approximately 92 seconds per turn at 60 fps. The toggle did not persist. Native orbit suspends automatic rotation during manipulation and resumes afterward; isolation and explode >=40% suppress rotation. Manual orbit/zoom/pan/damping configuration is retained.

Now: the default multiplier is 1×, mapped to raw speed **1.5**, approximately 40 seconds per turn. A separate gauge button next to the autorotate toggle opens the compact speed slider. Range **0.25×–3×**, step 0.05, raw **0.375–4.5**, corresponding to approximately 160–13.3 seconds per turn. Browser measurements show roughly three times the angular change at 3× versus 1×. These are inspection-turntable settings, not manual sensitivity values. [OrbitControls documentation](https://threejs.org/docs/pages/OrbitControls.html) documents the independent speed property and elapsed-time update.

`rotation.ts` validates finite numbers, clamps bounds and defaults malformed types/JSON to 1×. `rotation-store.ts` persists only `human-atlas-rotation-speed`, with denied-storage fallback. The transient toggle remains unsaved. The scene consumes the latest multiplier without reinitialization or anatomy-state mutation. Elapsed time is supplied only while autorotation is enabled, with a 100 ms cap for suspended frames; ordinary manual updates are unchanged. There is no URL state or change to zoom, pan, fitting, models, explosion or damping settings. The toggle is disabled in the contexts where the renderer already suppresses it.

**J** uses `hiddenRepresentationsForModel`, the Hidden UI's existing reverse insertion order. `restoreNewestHidden` removes its first current-model RepresentationId using the existing single-restore helper. There is no independent undo stack. A multi-piece hide contributes the same per-representation rows already used by Hidden; J restores one newest row per press. Empty history returns the same state. Modifiers, handled events, composition, repeat, inputs, textareas, selects, contenteditable ancestors and editable ARIA roles are guarded. H continues using its existing shared callback. Restore preserves frozen isolation membership, selection, explosion and camera key; it cannot expose surrounding anatomy.

## Information panel

The actual scroll container is the `.about-sheet` popup, not `.about-copy` or the window. A stable callback ref sets its initial `scrollTop` to zero when mounted. A layout effect keyed only to `about` resets it on a new open if the popup is retained during closing. The title receives initial keyboard focus. Selection, theme, preferences and ordinary rerenders do not replay the reset. No window scroll is manipulated.

## Classic stage regression and restoration

The supplied old desired screenshot demonstrates a finite filled stage, although its gray surface visually dominates the lower body. The supplied new screenshot demonstrates the large, faint outline regression. These are composition references, not pixel specifications. An exact pre-fix capture is retained at `work/phase-5.2/baseline-authorized/male-light-whole.png`; selected before/after evidence is linked in the validation record.

Git history is decisive. At Phase 4.5 commit `b0d2518`, `scene.tsx` created:

- A broad `CircleGeometry(30,96)` at y=-0.019 with gray rough MeshStandardMaterial.
- A finite `CylinderGeometry(.68,.7,.028,100)` centered at y=-0.016 with a pale MeshStandardMaterial, metalness .12 and roughness .67.
- Radius .63/.632 and .55/.551 rings at y=.001, opacity .4/.16.

Phase 4.9 commit `c902246` removed **both** broad ground and finite platform, leaving only the two rings at reduced opacity .24/.12. Later anatomy-safe camera composition made the surviving outline more prominent relative to its useful fill, which was entirely absent. The root cause is the removal of the finite surface together with the broad floor, not changed scientific geometry. The old platform diameter was roughly 1.36–1.40 world units; the remaining outer ring diameter was 1.264.

`createClassicFloor` is a dedicated presentation helper. It creates one shallow cylinder with radius .5 at the top, .508 below, depth .018, center y=-.014, plus a narrow .497–.5 ring at y=-.0049. Diameter is **1.0** at the surface, 1.016 at the base. This is approximately 27% smaller than the old platform surface and 21% smaller than the outline diameter. The top lies beneath the model's base, avoiding the former surface cutting through the feet. No broad plane, rectangular slab, wall/horizon, shadow pass, texture or environment preset is added.

Three untextured MeshBasicMaterials provide stable low-cost presentation: Light surface `#d0d7dc`, darker edge `#bcc7ce`, rim `#aebdc7`; Dark surface `#33424e`, edge `#293743`, rim `#556b7b`. A distinct shallow edge and narrow circumference convey depth without a heavy dark platform or glow. Tone mapping is disabled on the stage materials; existing anatomical lighting/display shaders stay unchanged. Theme updates recolor these materials in place.

The helper's named group is a root presentation object. Both meshes have disabled `raycast` and a `presentationOnly` marker. The anatomical picker independently iterates only source-part pickers, never scene descendants; background clicking/hovering the stage stays a no-op. Identity, inventories, Systems, Hidden, piece counts, Regions, Areas, Random candidates and isolation remain derived exclusively from atlas data.

Camera bounds and explosion inputs are unchanged source-part arrays. The floor never joins `bounds`, `pickers`, target maps, layout keys, marker arrays or eligibility. It remains fixed beneath the overall body workspace through isolation and explosion and is never duplicated per family or translated with pieces. Tight Region/Area/isolated camera crops can naturally omit the body-origin stage; camera semantics are deliberately retained rather than reframing around it. Phase 5.4 can replace this dedicated helper without excavating anatomical rendering. No preset state machine or later environment work is introduced.

## Reset, Visibility and utilities

The canonical Reset remains in the bottom Explode dock, with the same `resetViewer` behavior. Its geometry is explicitly 48×56 px, rounded, vertically centered, with a separate noninteractive divider and a compact outline. Hover/focus can no longer fill an oversized vertical strip. The redundant camera-rail Reset is removed; no new Reset is added.

The post-5.1 top utilities have no obsolete Show/Hide control. Display is a live Brightness/Contrast control and remains. Real Systems/Hidden, per-row Restore, H/J, isolation and Show surrounding anatomy remain.

`Restore all hidden` now lives permanently in `.panel-foot` outside both scroll containers. It appears in Systems and Hidden at top/middle/bottom scroll, with a stable disabled action at zero hidden count. The Hidden scroll content contains only its heading and per-representation rows. The global action clears hidden overrides while preserving the Phase 5.1 workspace and camera. The useful Hide/Show all systems action moves immediately below the Systems presets, inside that tab's contextual controls; its existing navigation semantics are unchanged. Existing harness expectations are updated only for the moved action and persistent disabled footer.

Top-right ordering is **Theme → Display → Random → Search → Info**. Desktop heights are uniformly 44 px, with matching radii, spacing and 18 px icons. The Random button uses a shuffle icon and `Random anatomy` accessible name/title. No entrance choreography is added.

## Search/Browse

The same Popover, Tabs, DiscoveryList, virtual window, search ranking/aliases, filters, sorts, keyboard navigation and selection pipeline remain. The tab strip is flattened to a restrained active indicator, removing its heavy filled nested box. Input background is transparent, radius 6 px, height 44 px, uniform 12 px padding. A single accent border handles both pointer/keyboard focus, with no extra outline/glow/underline. Panel padding is 16 px; tab/control spacing is 14/12 px. The muted context caption and results divider create a deliberate boundary. Rows remain simple 56 px entries with name and piece count; only the results area scrolls. Browse controls and all sorts/filtering are unchanged.

## Random Anatomy

`random-anatomy.ts` filters the existing Phase 4.8 DiscoveryEntry inventory for the active identity. Eligibility is **5–200 modeled pieces**, valid available matching current-model representations, source part alignment and nonempty geometry. This is an exploration heuristic, not anatomical/scientific/educational importance. There is no foreign-model fallback or second inventory.

Selection uses the existing `choose` pipeline, which resolves the concept and calls `selectRepresentations`. Random requests explicit `isolateSelection` in that same atomic update; inspector and the existing isolation camera flow follow normally. A single `lastRandomId` ref avoids immediate repeat when alternatives exist; empty pools safely do nothing, and singleton pools select their sole entry. There is no persistent random mode. The resulting workspace supports the existing member inspection, dissection, Restore-all, explosion and explicit exit behavior. Region/Area URL context is retained under the existing isolation precedence.

## Repository and deployment audit

Before-change logical byte usage: `work/` 16,188,376,149 (15.077 GiB), node_modules 576,194,005 (549.50 MiB), .git 489,004,451 (466.35 MiB), dist 260,823,422 (248.74 MiB), public 259,541,222 (247.52 MiB), docs 27,748,573 (26.46 MiB), data 14,919,780 (14.23 MiB). `.next`, outputs and coverage are absent. The tracked footprint is 303,855,084 bytes over 423 files. These are logical file sizes, not allocated NTFS/compressed volume blocks.

The large work folders come from Phase 4.7–5.1 browser harnesses, not Git branch refs. The harnesses create `chrome-*` user profiles beside reports/screenshots and previously retained every browser cache. Largest phase subtrees: Phase 5 approximately 4.87 GiB; Phase 5.1 3.88 GiB; Phase 4.9 3.10 GiB; Phase 4.8 2.28 GiB; Phase 4.7 .95 GiB. Failed runs and research/coverage output require evidence-aware retention.

`npm.cmd run clean:work` performs a dry run. `npm.cmd run clean:work -- --apply` removes only inactive `chrome-*` directories whose immediate parent has a clean `report.json` with `passed: true` and no `failure.json`. Process inventory failure stops cleanup; active profile paths, links/junctions and paths outside the real `work/` root are refused. Resolved targets are checked again before deletion. Reports, screenshots, failure evidence, model assets, source, docs and Git metadata are retained. The initial applied cleanup removed **10,532,648,642 bytes (9.810 GiB)**. New regression profiles can be cleaned with the same command once their reports pass.

Git object audit before changes: 117 loose objects, 493.20 KiB loose size; 1,531 packed objects, 2 packs, 465.70 MiB packed size; zero prune-packable objects, garbage or garbage bytes. Largest reachable blobs are 7.40 MiB pelvis scientific-audit SVG revisions; donor/history model context gzip revisions up to 7.30 MiB; 6.75 MiB frozen Z-Anatomy source geometry; additional historical binary versions. These are scientific evidence, anatomy assets and preserved donor history. No accidental browser output was found among the largest blobs. Historical versions share filenames but are distinct revisions, not redundant deployed copies. Nothing is removed from Git history and LFS is not introduced.

All historical origin phase branches through Phase 5.1, plus Phase 5/explode-redesign, are merged into main and are organizational cleanup candidates. Keep current Phase 5.2, main, reference PR branches, donor tags and donor/remotes. Reference PR #1/#283/#421 and all unmerged donor refs remain intact. Branch refs are tiny; they did not cause the large working-directory usage. No local/remote branch is deleted.

Existing `.gitignore` already covers node_modules, .next, .vinext, dist, out, coverage, outputs, work, Python caches and build metadata. Its rules were verified rather than widened to hide runtime assets. The supplied `.vscode/settings.json` excludes generated/local directories from Pylance only; it does not exclude assets from Git, installation or deployment.

The production output contains all 94 public runtime files byte-identically. The first Phase 5.2 build was 260,831,884 bytes (248.75 MiB), only 8,462 bytes larger than the pre-existing local dist. Static anatomy/JSON is the dominant deployment footprint; raw and gzip model files are retained for existing supported loading/fallback. No work, docs, test screenshots, node_modules or source maps are copied to dist. Viewer JS is approximately 871.05 kB raw/243.07 kB gzip; entry JS 200.13/63.67 kB; CSS 218.84/34.73 kB. The existing >500 kB bundle warning remains. No architecture, dependencies, model quality, hosting, CDN or public scientific content is changed to reduce a size number.

## Reproducibility and scope

The validation record contains the true external fresh-clone commit/location, independent npm ci, checks/build, model/data validators and production runtime smoke. Existing node_modules, dist, work and donor checkouts must not be reused. Engineering validation retains female `integrityPassed: true`, `ready: false` and all independent-review/coverage limitations.

No new anatomy, scientific classification, donor integration, nerve/MVMT/HRA upgrade, knowledge, Latin, pathology or pharmacology work is included. No Phase 5.3 signature animation/motion system or Phase 5.4 creative environment/preset system is started.
