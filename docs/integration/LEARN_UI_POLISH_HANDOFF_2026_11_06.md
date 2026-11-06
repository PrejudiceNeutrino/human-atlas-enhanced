# Learn UI polish - November 6, 2026

This handoff covers every pending change after `479e931` (`style: use consistent compact gaps in gallery toolbar`) on local `main`. It records the final behavior after the user's iterative refinements. Earlier Gallery publication/starring, viewer parity, context placement and page-width commits are already in the baseline; they are not new features in this batch.

## Gallery and navigation

- Gallery search grows to the right edge of the toolbar while retaining the existing compact, equal button gaps and responsive wrapping.
- The starred filter's visible label is now **Starred**. Its count, saved starred-only behavior, tooltip and accessible result announcement remain intact.
- Visualize receives the same small **New** badge already used by Gallery. Tab order is unchanged.

Files: `app/learn/gallery/{gallery.css,page.tsx}`, `app/learn/subject-tabs.tsx`.

## Study Tools

- Activity navigation applies its selected background immediately, without a delayed transition. Selected hover retains the selected card background and readable foreground.
- Topic now uses the existing themed Select primitives with an associated label, full-width trigger, wrapping option labels and a scrollable menu. `modal={false}` avoids locking site scroll while the dropdown is open.
- Topic changes retain the existing activity filtering and clear transient focused/export state as before.
- Flashcards' List view button exposes `aria-controls` only while its target list is mounted, fixing the missing-target accessibility relationship.

Files: `app/learn/study-tools/{page.tsx,study-tools.css,flashcards.tsx}`.

## Full Visualize workspace

- Model and Focus anatomy use the shared themed nonmodal Select instead of native dropdown menus. Keyboard editing remains excluded from viewer shortcuts; `/` focuses the anatomy trigger.
- The help popover reuses Explore's two-column shortcut reference and bordered keycaps, with local width/spacing and viewport-constrained scrolling. Its anatomy-search label reflects Learn's focus selector. Explore's panel and global styles are unchanged.
- Digestive and Included structures cards have consistent gaps, left-aligned wrapping text, count badges where applicable, subtle selected accents and member checkmarks. Hover keeps text readable. Generic button rules exclude these cards, Select triggers, dock buttons and panel/camera icon controls so their own styles apply correctly.
- Camera and panel icons are 44 by 44 pixels; the rail column widens to 54px to accommodate square buttons and padding.
- Removed the toolbar's Pause/Interact toggle and replaced obsolete help copy. The existing view lock remains. On coarse-pointer devices the initial canvas activation action still enables interaction.

Files: `app/learn/anatomy-companion/{viewer.tsx,panels.tsx,companion.css}`.

## Compact Anatomy Companion

The article companion intentionally contains only the requested object and the existing explode toolbar beneath its collapse/close header. It omits model/focus selectors, toolbar/panel toggles, keyboard help, Open in Explore, camera rail, Visibility/Inspect panels, descriptive copy and selection shortcuts. Loading and failure recovery remain available when necessary.

- Direct manipulation starts enabled, including for coarse pointers. The object can be rotated, panned and zoomed with the renderer's existing controls.
- Clicking the object does not select a member or open an inspector. Hidden selection shortcuts cannot make it disappear.
- Explode playback and the shared reset confirmation remain available. Reset reassembles/refits the same requested object rather than opening the entire digestive system.
- Another article View in 3D action replaces the target, preserves the compact interface and stops the previous playback.
- The canvas occupies the full companion width; it no longer reserves a camera-rail column.

Files: `app/learn/anatomy-companion/{viewer.tsx,companion.css}`. The article's existing open/collapse/close and focus-return implementation is retained.

## Natural colors and selection

Opening an organ previously selected every representation, tinting the entire object and marking all Included entries as selected. Learning entry and focus actions now freeze the real assembly with the existing isolation helper, then clear active selection. Isolation membership and camera focus remain independent of the selection highlight.

- Visualize and the compact companion initially show natural material colors.
- Clicking a Visualize member selects only that piece and retains the whole isolated assembly. Clear selection does not remove the assembly.
- The inspector distinguishes included-piece counts from selected-piece counts. Hide/Isolate act on an explicit active selection.
- The chosen digestive shortcut retains its active state without requiring selected geometry.
- Context Reveal resolves the focused canonical group independently of active selection. Returning from context to isolation preserves the intended organ even when nothing is selected.

Files: `app/learn/anatomy-companion/{model.ts,viewer.tsx,panels.tsx}`. No shared Explore selection helper or shader behavior was changed.

## Embedded camera fit

The renderer's general fit path did not account for embedded isolation. A later ResizeObserver callback could overwrite an organ's fitted camera with a whole-body distance, even when the isolation/aspect key had not changed. This made small lesson objects such as the esophagus appear tiny.

An embedded-only branch now fits actual isolated bounds with the existing corner-based camera fitter and 16px canvas inset. Entry, general fit/reset and resize use the object bounds. Explosion fitting retains its separate assembled baseline and existing expansion logic. The nonembedded Explore fitting branch is unchanged.

File: `app/scene.tsx`.

## Tests and documentation

- Anatomy UI tests exercise themed option menus, page-scroll freedom, Escape/focus return, editing boundaries, natural colors/default empty selection, member inspection, context transitions, compact-only controls, request replacement and compact Reset isolation.
- A real-manifest camera regression runs the renderer's actual fit/resize functions with a Three.js CPU camera. All eight references in both models must remain inside the canvas inset and occupy at least 60% of one available dimension on entry, reset and several viewport sizes, including a same-aspect resize after forced zoom-out.
- The explosion-camera CPU fixture now supplies `embedded: false`, the existing renderer environment field that its prior fixture omitted. This fixes a fixture ReferenceError without changing production explosion behavior.
- Study Tools UI tests operate the real themed Topic menu. A stale static-bundle assertion was replaced with runtime no-canvas/no-model-fetch checks because lazy Learn imports now legitimately appear in build metadata. Appearance control lookup follows its current accessible label.
- `docs/anatomy-companion.md` now documents the final compact/full interfaces, default unselected assemblies, dropdowns and fitting behavior. Earlier implementation/validation sections are explicitly historical.

## Accepted verification

These checks were run against the final application changes; subsequent edits only added/updated documentation.

| Check | Result |
| --- | --- |
| `npm.cmd run check` | Passed |
| `npm.cmd run build` | Passed; existing large-chunk and plugin-timing warnings remain |
| `node --test scripts/anatomy-companion.test.mjs scripts/anatomy-companion-ui.test.mjs` | 11 passed: four manifest/camera checks and seven workspace checks |
| `node --experimental-strip-types --test scripts/reset-camera.test.mjs scripts/explosion-camera.test.mjs` | 26 passed |
| `node --test scripts/study-tools.test.mjs scripts/study-tools-ui.test.mjs scripts/gallery.test.mjs scripts/learn.test.mjs` | 56 passed: eight Study Tools domain, 14 Study Tools UI, eight Gallery and 26 Learn checks |
| `git diff --check` | Passed |
| Live browser/GPU/touch verification | Not performed; prior connected inventory exposed no browser/app surfaces |

Accepted test coverage totals 93 passing tests. The first explosion-camera run exposed the omitted fixture field described above; its corrected run passed all 26 camera checks. Esbuild-based tests required approved execution outside the filesystem sandbox after path-resolution access denials. Final accepted runs supersede those intermediate failures.

The DOM workspace harness substitutes the GPU renderer. Camera tests project real model bounds through a real CPU camera and execute production fit/resize code, but do not certify live WebGL rendering, native browser layout, touch scrolling, lighting or prolonged GPU lifecycle. No exhaustive repository suite or scientific-readiness audit was run.

## Scope and local delivery

Geometry, atlas manifests, canonical mappings, educational JSON, image assets, Notes anchors/storage, saved gallery preferences and Study Tools progress schemas were not changed. The original renderer, identity resolver, shared Select, explode controls and action helpers remain the owners of those behaviors. Explore's UI and its nonembedded camera behavior are preserved.

Before this batch commit, local `main` was **0 behind / 12 ahead** of the cached `origin/main` reference. One local commit adds this implementation, test updates and documentation. The remote reference was not refreshed. No push or deployment is authorized or included.
