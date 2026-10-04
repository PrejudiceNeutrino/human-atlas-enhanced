# Phase 4.8 implementation: anatomy discovery and navigation rail

Implemented on `phase-4.8/anatomy-discovery`, starting 2026-10-04 from clean `85caa5f334523935cbdd190d4f7c52b479037785`. HEAD, local main and freshly fetched origin/main matched that Phase 4.7 endpoint. History contains the accepted Phase 1–4.7 work. Implementation/validation records and actual identity, Search, Region, Area, visibility, hide/restore, viewer, selector and responsive code were inspected before modification.

## Product boundaries

Regions remain broad geographic navigation. Teaching Areas remain curated educational stations with Phase 4.7 explicit model-specific representation scopes. The Structure Index is discovery and selection over the existing Search inventory. It creates no third persistent navigation mask, taxonomy, scientific dataset or camera bounds. Source concepts can overlap, including distinct source labels selecting the same geometry; selectable-entry count is not an ontology entity count or a count of unique meshes.

## One discovery surface

`app/anatomy-discovery-panel.tsx` uses the existing Base UI Popover and Tabs wrappers. The familiar top-right Find a structure trigger anchors one portal-mounted panel, aligned to the trigger's end with an 8px gap. The panel contains its heading, Search/Browse tabs, input or sort/System controls, summary and one active content scrollbar. Results are ordinary windowed buttons inside that surface; the old nested Combobox/result portal is removed from the viewer. Popover placement and available-height sizing constrain it to the viewport. There is no page reflow, new motion choreography or geometry mutation.

Click and unmodified `/` both select Search and focus the same input. `/` while Browse is open switches that same panel to Search. The shortcut defers to editable controls/ancestors, modifier combinations, composition, repeats and previously prevented events. Escape dismisses through the existing Popover and returns focus to the trigger. Tabs support existing arrow navigation. Rows support arrows, Home/End, Page Up/Down, Enter and Space with a roving tab stop. Keyboard jumps focus the destination after its window mounts; pointer/touch scrolling retains a tab stop in the mounted window. Selection closes discovery and opens the existing inspector. Opening discovery preserves inspector/anatomy state, avoiding camera movement from an inspector-close side effect.

Input focus uses an explicit shortcut request counter rather than every tab-mode change. This preserves native tab focus when arrowing Search ↔ Browse while `/` still focuses the input immediately. Final visual acceptance follows the user's subsequent desktop-only preference; further phone/landscape visual refinement is outside this handoff.

Search retains the eight existing common-structure suggestions, source names/IDs, verified group aliases, substring matching, stable shortest-name-first ranking and 80-match cap. An explicit no-match message replaces unrelated fallback results. The source suggestions remain lightweight; full inventory belongs to Browse. Input/query, sort and System filter are temporary panel state, reset on close/reopen and model switch. Tabs share that state while the panel stays open.

## Derived shared index and selection

`app/anatomy-discovery.ts` derives one memoized `DiscoveryEntry[]` from the active atlas and identity index. Entries carry stable source/Search ID, source display name, original SearchConcept (including aliases/group metadata), model ID, deduplicated valid part/RepresentationIds, modeled-piece count and represented System IDs. `buildSearchConcepts()` remains the inventory source; `matchesAnatomySearch()` remains the query matcher. No canonical database is copied or augmented.

`resolveSearchPartIds()` in `app/anatomy-search.ts` extracts the existing choose resolution unchanged: mapped source concept → bound canonical/current-model resolution; verified Search-only groups → their existing source part lists. A mapped concept resolving zero does not fall back to raw elements. Discovery rejects missing parts, foreign/unavailable/empty geometry and missing chunks, and deduplicates by RepresentationId. All current committed Search entries are selectable; the exclusion guards are proven with negative fixtures.

Both Search and Browse pass the original SearchConcept to the same viewer `choose()`, which uses that shared resolver and the existing `selectRepresentations()`. Agent-tool selection uses the same choose callback. Atomic selected-only restoration, selected exceptions, inspector, Included structures, isolation, Hide and Restore behavior remain ordinary selection semantics. Browse does not modify Region, Teaching Area, Systems or their inventories. Selection can reveal outside-context geometry without changing ordinary scope; clear selection returns to that scope.

## Counts, sorting and System filtering

`modeledPieceCount` is the number of deduplicated available current-model mesh representations selected by an entry. It is independent of hidden state, enabled Systems, Region/Area membership and actual displayed count. Rows explicitly say “1 modeled piece” / “83 modeled pieces”; this is source mesh granularity, not anatomical completeness.

The summary reports selectable source/Search entries and total active-model representation inventory (“model pieces”). Filtered summaries report matching entries out of the full entry count; model inventory stays fixed. No sum of overlapping entry counts is displayed as unique model anatomy.

Browse defaults to A–Z for predictable lookup in the complete inventory. Largest-first and smallest-first compare modeled-piece counts, then case-insensitive English name, original name and stable source ID for deterministic ties. A–Z uses the same name/ID comparator. Helpers copy arrays and never reorder source data. The lightweight native Sort and System selectors have visible labels and 44px targets.

All systems plus model-present Systems are available independently of current navigation scope. An entry matches a System if any resolved current-model part belongs to it. Multi-system entries remain one row, and their piece count remains their complete selection count, not the count of System-matching members. Clearing the filter restores the full inventory.

| Registered model | Selectable entries | Model pieces |
|---|---:|---:|
| Male `bp3d-male-4` | 3,436 | 2,234 |
| Female study `female-study-v3` | 4,252 | 2,245 |
| Internal HRA `hra-female-v1.5` | 1,073 | 888 |

Four existing verified muscle Search groups account for the extra four entries on each routed model. HRA receives no unsupported groups and no new route. Model switching invalidates the loaded identity/atlas immediately and derives the destination inventory independently, with no name mapping or foreign-model fallback. For example, Bone organ selects 203 male pieces and 208 study pieces; Flat bone selects 10 / 14.

## List scale and responsive composition

Local fixed-height windowing uses 56px two-line rows and four overscan rows per edge. A ResizeObserver supplies the current scroll viewport height. Only the visible window plus overscan mounts; an inert list-height spacer preserves full scrollbar range. Absolute rows do not create separate cards, shadows or scrollbars. Full names remain in accessible button text and title even when visually ellipsized. `aria-posinset`/`aria-setsize` communicate inventory positions. Search results use the same list strategy. No virtualization dependency or model rebuild is added. Measured row counts and timings are recorded in the validation document.

The desktop navigation rail is a flex column: identity/source metadata, three equal-width controls with consistently placed labels above them, then aligned Visibility. Header stays outside a giant card; Visibility retains its own reviewed Systems/Hidden behavior and one content scrollbar. CSS composition replaces unrelated absolute control rows without changing menus, ordering, affiliations or selector semantics.

Phone and short landscape layouts place Model and Region on one compact labeled row and Teaching Area beneath, preserving readable labels and 44px controls. Visibility retains its existing mobile drawer. Phone camera-control clearance follows the compact header; anatomical bounds and all camera code remain unchanged. Discovery becomes a large viewport-constrained surface with usable input/tabs/filter/sort controls and one list scroll. Short landscape uses the same available-height panel and list windowing, rather than letting results escape below it.

## Files and non-goals

Created: `app/anatomy-discovery.ts`, `app/anatomy-discovery-panel.tsx`, `scripts/anatomy-discovery.test.mjs`, `scripts/anatomy-discovery-browser-smoke.mjs`, and these two Phase 4.8 integration documents.

Modified: `app/anatomy-search.ts` (shared existing resolver), `app/page.tsx`, `app/globals.css`, `package.json` (two test commands only), `scripts/hide-restore.test.mjs` (extracted slash-handler wiring assertion), and `scripts/viewer-interaction-browser-smoke.mjs` (dark-surface assertion targets the replacement discovery panel).

No model/geometry/manifest, identity, Region, canonical Area, Area representation scope, scientific readiness or dependency/lockfile changes. OrbitControls, damping, camera fitting/navigation/isolate/explode code, themes, rendering and explosion behavior are unchanged. No entrance/loading motion, brightness/contrast control, anatomy/nerve import, HRA upgrade, knowledge, pathology, pharmacology or later phase was begun. Female study remains scientifically unready. See `PHASE_4_8_VALIDATION.md` for test evidence and the handoff boundary.
