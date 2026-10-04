# Phase 4.6: interaction shell, dissection panel and themes

Implemented on `phase-4.6/viewer-interaction`. The clean starting HEAD, local main and origin/main all resolved to `b0d2518f300ff574f88aed0796d91c1cdc1982b0`, the completed Phase 4.5 endpoint. Branch history includes Phase 1 identity/visibility, Phase 2 Regions, Phase 3 Teaching Areas, Phase 4 hide/restore and its refinement. Their implementation/validation records, actual viewer modules, UI components and browser harnesses were inspected. No old endpoint or donor code is used.

## Isolated member selection

The inspector's Included structures buttons previously called `choosePart`, which used `selectRepresentations`. That reviewed ordinary selection helper explicitly returns `isolate: false`. Consequently a member click ran the renderer's existing isolate-exit branch, restoring ordinary navigation framing and surrounding anatomy.

`selectIncludedMember` in `app/viewer-interaction.ts` validates the requested member against the current selection and model-bound identity index, delegates exact selection/selected-only restoration to `selectRepresentations`, then preserves the existing isolate boolean. The inspector passes an explicit member-selection intent. Search, agent-tool selection and direct mesh picks retain their existing behavior.

| Transition | Result |
|---|---|
| Ordinary group -> Included member | Member selected; isolation remains false; normal navigation/system context remains available. |
| Isolated group -> Included member | Exactly that current-model member selected; isolation remains true; ordinary surroundings remain excluded by the unchanged visibility resolver. |
| Isolated member -> Show surrounding anatomy | Existing isolate toggle exits normally and assembles; Region/Teaching Area/System context resumes, including the reviewed selected exception. |
| Unknown, foreign or nonmember input | Member transition leaves state unchanged. |

Member drill-down preserves Region, Teaching Area, System preferences, hidden RepresentationIds, explode amount, view and reset counter. The renderer's existing isolated-selection fit sees the new selected ID and refits that member. No ordinary whole-body/Region/Area restoration runs while isolate stays true. The same transition works after moving an isolated group into its existing exploded view. No second isolation mode, return stack, geometry hack or camera formula was added.

## Visibility tabs and dissection

The existing `.layers-panel` and mobile open/close architecture now contain the existing Base UI-backed Tabs component: **Systems** and **Hidden**. This provides associated tablist/tab/tabpanel semantics, arrow-key navigation, selected state and focus behavior without a dependency. The selected tab is local presentation state, retained across drawer close/reopen, without reload persistence. Tabs never mutate viewer state or move the camera.

Systems contains the reviewed All/Skeleton/Organs presets, female chest controls and contextual inventory rows/switches. Hidden exclusively owns the derived newest-first dissection list, individual Restore and Restore all. It always exists and shows `No structures hidden.` at zero. The Hidden badge remains in the tab header while Systems is active; its count is the number of deduplicated, valid active-model hidden RepresentationIds, regardless of ordinary navigation/system exclusion. Names and duplicate-name source references remain derived presentation only.

Each active `.visibility-content` is the sole vertical content scrollbar. The panel and tab header/footer do not scroll; `.system-list` and `.hidden-list` have no independent scroll container. Presets/chest controls share the Systems content surface. Long hidden names wrap, Restore targets remain at least 44 pixels high and Restore all is reachable after the list. The visible-piece status is always in the fixed footer; the reversible Systems action appears only on Systems. Horizontal scrolling is suppressed and rows can shrink/wrap. The same design operates inside the existing mobile drawer, including short landscape layouts.

H/h and Hide structure keep the current tab; the badge updates immediately. All Phase 4 helpers, RepresentationId authority, deduplication, insertion/newest-first order, individual restoration, search auto-restoration, hidden precedence, nonpickability/nonpacking, reset and model-switch clearing remain unchanged. Restore does not select anatomy or enable disabled Systems. Navigation, chest modes and explosion retain their reviewed hidden-state semantics. Reload still clears temporary anatomy state; model changes still clear model-bound hides without cross-model mapping.

## Reversible Systems control

`allSystemsForAtlas` computes exactly the previous All preset's model-present adult system set in existing SYSTEMS order, excluding Pregnancy. Both the All preset and Show all systems use `showAllSystems` with this same list. The male fresh/reset default still excludes Reproductive; explicit All/Show all enables it. Female defaults remain unchanged.

When any system in this applicable set is enabled, the footer says **Hide all systems** and clears enabled layers plus the ordinary selection/isolate, matching reviewed filtering cleanup. At zero it says **Show all systems**, enabling the shared All set and its reviewed Tissue chest presentation. Neither action changes Region, Teaching Area, hidden RepresentationIds, model, explode, view or reset. Existing renderer behavior handles any necessary isolate exit/layout change; no new camera handler was introduced.

System inventory counts continue using Phase 4.5 memoized current-scope representations, independently of toggles, dissection and selected exceptions. Actual visible count still uses the shared resolver. Hiding a femur, hiding all Systems and showing all Systems leaves that femur dissected. Restore all while Systems are disabled keeps them disabled.

## Light / Dark / System

`app/theme.ts` defines three valid preferences and a small controller with storage, media-query and presentation ports. `app/theme-store.ts` initializes it before the lazy viewer mounts and exposes a stable `useSyncExternalStore` snapshot. No saved or invalid preference resolves to **Light**, even if the OS prefers Dark. Explicit choices persist as `human-atlas-theme` in localStorage. Storage-denied environments still support a session preference.

**System** resolves `(prefers-color-scheme: dark)` and responds to live media-query changes. Explicit Light and Dark ignore OS changes. A compact icon selector beside Search/About exposes all three named choices, selected menu state and accessible labeling. The root `data-theme`, existing `.dark` component variant and browser theme-color metadata update together. Theme never enters a URL or any anatomy state, and adds no account/database or anatomy persistence.

Existing component semantic variables and centralized viewer tokens style page, panels, portal menus, search/results, inspector/About, tabs, borders, text, controls, badges, statuses, dock, camera controls, hover tooltip and focus/selected states. Light retains the neutral Phase 4.5 presentation. Dark uses cool charcoal surfaces and readable secondary text, deliberate control/relevance/selected accents, and coordinated portal surfaces; no page inversion is used. Selector anchoring and available-height behavior are unchanged.

## Scene presentation and performance

The existing scene effect still depends only on `atlas`; theme travels through a separate live ref. The animation loop detects a changed resolved theme and updates these existing neutral material colors/renderer clear color, marking the normal scene render dirty:

| Neutral | Light | Dark |
|---|---|---|
| Clear background | `#e4e8eb` | `#202a33` |
| Ground | `#d5d9dc` | `#090f14` |
| Platform | `#eeeeec` | `#303c46` |
| Outer ring | `#8c969f` | `#8a9ba8` |
| Inner ring | `#a4aeb8` | `#8296a5` |
| Inventory markers | `#64748b` | `#a4b6c6` |

Anatomy System colors, standard materials, surface opacity/depthWrite, exposure 1.0, environment intensity .55, all three lights, ACES/sRGB and the saturated linear teal selection RGB (.008, .42, .32) are unchanged. Selection stays opaque, shaded and independent of bone/muscle/vessel source colors in both themes. Female scientific geometry and chest visibility remain unchanged.

Theme updates neither rebuild geometry nor recreate the renderer, refetch model binaries/sidecars, regenerate identity or re-resolve Regions/Areas. There are no new shadows, postprocessing, render passes, large GPU buffers, material systems or dependencies. PMREM remains one-time scene setup. Camera controls/math are unchanged. Browser validation compares actual GPU state, canvas identity, network requests and camera uniforms; no controlled frame-time improvement is claimed.

## Files and non-goals

Created: `app/viewer-interaction.ts`, `app/theme.ts`, `app/theme-store.ts`, `scripts/viewer-interaction.test.mjs`, `scripts/viewer-interaction-browser-smoke.mjs`, and these Phase 4.6 implementation/validation records.

Modified: `app/page.tsx`, `app/globals.css`, `app/scene.tsx`, `web/main.tsx`, `package.json` (two test commands only), `scripts/hide-restore-browser-smoke.mjs` and `scripts/viewer-polish-browser-smoke.mjs`. Existing harnesses now reach restoration through Hidden and use the explicit Systems label; obsolete nested-scroll assertions now check the one-surface design. Existing GPU, pointer, keyboard, navigation, picking, selection and camera assertions are retained.

No model manifest, binary geometry, public/data identity, Region or Teaching Area dataset, scientific evidence, readiness validator, dependency or lockfile changes. Teaching Area granularity, lung roots, plexus/Willis scope, nerves, supplemental anatomy, HRA/female geometry upgrades, loading architecture, knowledge and clinical/AI/localization work remain deferred. Engineering readiness does not imply female scientific readiness. See `PHASE_4_6_VALIDATION.md` for reproducible results and limitations.
