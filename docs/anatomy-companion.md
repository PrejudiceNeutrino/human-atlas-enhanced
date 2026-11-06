# Visualize and Anatomy Companion

The Digestive System has a dedicated **Visualize** tab immediately before Gallery. Visualize uses a shared 1480px page width for its site header, subject navigation, content and footer; reading tabs retain their 1080px layout. Opening the wider desktop companion keeps those same page edges aligned with its 1560px workspace, returning to 1080px when the companion stacks on narrower screens. Overview remains a reading page without an embedded model. Visualize provides a large interactive digestive model; eight explicit **View … in 3D** actions in Deep Dive open a reusable companion alongside the article. The same existing `AnatomyScene` powers both contexts and Explore.

## Using it

The model loads as its panel becomes visible, with an explicit Load button when intersection observation is unavailable. Visualize and the compact Deep Dive companion share the existing renderer, but intentionally provide different interfaces.

**Visualize** provides Model and Focus anatomy dropdowns, Visibility with Systems/Hidden tabs, digestive structure shortcuts, a selection inspector, a camera rail with presets/zoom/view lock/rotation, and the shared Explore explode dock. The dropdowns use the shared themed Select with nonmodal menus so the page can still scroll while a menu is open. Surrounding context sits directly below the Visibility heading. The toolbar provides Open in Explore and keyboard help; the redundant Pause button is removed. On coarse-pointer devices, tap Interact with model to enable direct manipulation. Lock view prevents manual rotation and pauses autorotation; zoom, pan and presets remain available.

Choose an organ to isolate its actual model-specific assembly in natural colors, without selecting all its pieces. Click a piece in the canvas or Included structures list to highlight and inspect just that piece while retaining the visible assembly. Clear selection keeps the isolated assembly visible. The inspector distinguishes included pieces from actively selected pieces. Structure cards use separated rows, left-aligned wrapping labels, count badges, and a subtle selected accent/checkmark. Panel icons and camera controls have 44px square targets. Keyboard help uses Explore's existing two-column keycap styling without changing Explore's help panel.

Choose Complete digestive system to return to the full lesson scope; Visualize's dock Reset assembles the model and clears hiding and selection. With Surrounding context enabled, focus requests use the existing Context Reveal renderer rather than isolating the target. Context targets resolve independently of active selection, including when returning to isolation with no selected piece. Structure changes are user-initiated; scrolling does not select or rotate anatomy.

**Anatomy Companion** opens the requested object alongside Deep Dive, with only its rotatable/zoomable canvas and shared explode toolbar below the collapse/close header. Model/focus selectors, panel toggles, help, Open in Explore, camera buttons, inspector, explanatory copy and selection shortcuts are omitted. Clicking the object does not open an inspector or change its assembly. Interactivity starts enabled, including on coarse-pointer devices. Explode Reset reassembles and refits the same requested object; another View in 3D action replaces the object and stops the prior playback. Loading/failure recovery remains available when necessary.

The companion is a sticky desktop column and becomes an inline panel above the article sections on narrower screens. Embedded camera fitting uses the actual isolated bounds and a 16px canvas inset on initial load, resize and reset. This prevents a later ResizeObserver callback from replacing the organ fit with a whole-body camera distance. Full-screen Explore retains its existing fitting branch.

Open in Explore, available in Visualize, opens the current model route in another tab with `?concept=<canonical ID>`. Explore resolves that explicit request once per model through its existing identity/selection/isolation workflow. Missing, unknown and candidate requests do not select substitute geometry. Normal Explore URLs retain their behavior.

## Canonical references

`data/learn/digestive-anatomy-references.json` is the separate lesson mapping. It declares subject/tab/article IDs, primary systems, surrounding-context regions/systems, canonical concepts and Deep Dive section IDs. No supplied reading JSON, atlas manifest, crosswalk, vertex data or concept identity was rewritten. Original article paragraphs, Notes anchors and heading IDs remain intact. Display names are labels, never a geometry lookup mechanism.

| Structure | Canonical concept | Source concept | Male / female-study pieces |
|---|---|---|---:|
| Stomach | `atlas:concept:002773` | `FMA7148` | 1 / 1 |
| Liver | `atlas:concept:002829` | `FMA7197` | 60 / 60 |
| Gallbladder | `atlas:concept:002833` | `FMA7202` | 1 / 1 |
| Pancreas | `atlas:concept:002830` | `FMA7198` | 4 / 4 |
| Duodenum | `atlas:concept:002838` | `FMA7206` | 1 / 1 |
| Small intestine | `atlas:concept:002831` | `FMA7200` | 56 / 56 |
| Large intestine | `atlas:concept:002832` | `FMA7201` | 8 / 8 |
| Esophagus | `atlas:concept:002763` | `FMA7131` | 1 / 1 |

All eight currently resolve in both offered models: `bp3d-male-4` and `female-study-v3`. The female study model uses its configured adapted reference geometry and estimated proportions; it is experimental, not an independently validated female anatomical reference. The disclosure remains visible in Visualize; the compact companion has no model selector and uses the male reference model. No male fallback is performed when resolving female representations. Availability checks require actual current-model geometry, valid counts/chunks, the correct coordinate frame and non-candidate/non-rejected/non-unresolved links. A missing target produces an explicit unavailable message with no unrelated highlight.

These source-ontology collections overlap, so piece counts are not additive. Multipart concepts retain every available representation rather than treating an organ as a single mesh. The complete digestive display combines the existing digestive system inventory with the curated concept representations: **142 unique pieces** per offered model. Optional surrounding context raises the scoped inventory to 266 male or 263 female-study pieces.

## Shared renderer and loading

- `LearningAnatomyViewer` is the visibility/lazy/error boundary; `viewer.tsx` owns lesson controls and selection state. Only one Learn scene can be mounted: Visualize and Deep Dive are mutually exclusive tabs, and inactive article/tab panels unmount. Collapsing or dismissing the companion releases its renderer.
- `model.ts` calls the existing model registry, `createIdentityIndex` and `createRegionIndex`. It derives a runtime manifest view containing necessary parts/chunks. Original source IDs, byte offsets, positions, normals, indices and bounds stay unchanged. Chunk indexes are remapped only within that in-memory view; the source manifest and canonical representation records are untouched.
- The existing binary format permits **chunk-level**, not individual-organ network loading. Digestive-only male loads 6 of 15 chunks (about **13.76 MB compressed**); female study loads 7 of 17 (about **16.66 MB compressed**). Those shared chunks contain unrelated bytes, but the scene constructs GPU geometry only for scoped parts. Browsers without native gzip decompression use the existing larger uncompressed fallback.
- Showing surrounding context or changing model recreates the single scoped scene using its normal disposal path. Overlapping chunks may benefit from browser HTTP caching, but this pass adds no custom buffer cache or new geometry pipeline. The model catalogue/crosswalk/regions are still complete lightweight metadata.
- Embedded mode adds an unobstructed camera fitting rectangle, the full model's existing grounding offset and scoped zoom commands. Existing fullscreen Explore defaults remain in place. The scene's normal colors, display brightness/contrast, theme, selection shader, context rendering and reduced-motion camera/reset utilities are reused. The embedded floor is the existing Void preset.
- While an embedded viewer is offscreen or the document is hidden, its frame loop stops. Visibility resumes it without starting another renderer. Scene teardown aborts outstanding geometry fetches, disconnects resize/visibility handling, cancels frames, disposes controls/materials/geometries/textures/environment/renderer and removes the canvas. Metadata requests also abort on model change/unmount.
- WebGL initialization/context failures produce a readable error with Retry 3D and leave the article and Open in Explore available. Lazy module failures are contained by a viewer boundary. In Visualize, commands are handled by the focused viewer's bubbled key events, without a global Learn command listener or automatic follow-along. H hides selected representations; J restores the newest hidden item in the current scope; I isolates; R assembles and resets; F/S/B choose views; / focuses the anatomy selector. Text fields, selects, sliders, editable content, modifier chords and events outside the viewer are excluded. Explore's global shortcut exclusions remain intact.

The rendered controls/model are `data-annotation-excluded` and marked to disable atlas-wide shortcuts. Deep Dive's prose/heading annotation sources remain unchanged, and text is still selectable for copying, highlighting and personal Notes. No Notes or Study Tools storage is written by the companion.

## Files

- Added `data/learn/digestive-anatomy-references.json` and `app/learn/anatomy-companion/{references.ts,model.ts,learning-viewer.tsx,viewer.tsx,visualize-page.tsx,companion.css}`.
- Updated `app/learn/educational-article.tsx`, `subjects.ts`, `subject-tabs.tsx` for curated actions, companion layout and the Visualize tab. Navigation chooser/guide/order derive from the same registry.
- Updated `app/scene.tsx` with opt-in embedded fit, activity/visibility pause, grounding and zoom support. Existing fullscreen call sites use defaults.
- Updated `app/viewer-interaction.ts` and `app/page.tsx` for explicit canonical Learn-to-Explore requests.
- Added `scripts/anatomy-companion.test.mjs` and its package command; updated focused Learn/navigation expectations and the existing camera fixture for the optional scene fields. Updated README, Learn/Gallery docs and this file.

## Original validation and limits (historical)

- Three mapping/scope tests passed against both actual manifests, crosswalk and region dataset: all eight concepts, multipart resolution, original offsets/bounds/chunks, no manifest mutation, real focus bounds, unavailable/candidate/foreign-model rejection, context state and canonical Explore targets.
- Two focused Learn DOM tests passed: Overview stays model-free, Visualize owns the entry point without eager geometry initialization, eight curated actions open the companion, reading text is unchanged, collapse/expand works and close restores focus.
- Existing Context Reveal checks: **17 passed**. Existing actual-camera/scene-frame reset checks: **18 passed**, including real OrbitControls damping and reduced motion. Their fixture now provides the new optional embedded/zoom fields while retaining fullscreen expectations.
- Final TypeScript check and production build **passed**; the build completed in **16.80s** and emitted separate lazy `viewer` and shared `scene` chunks. Existing Vite large-chunk/plugin-timing warnings remain. The full repository/Learn/Notes suites were not rerun, following the user's limited-testing preference. Focused accepted coverage totals **40 passing checks** across the mapping, two Learn DOM, Context Reveal and camera suites.
- The connected browser inventory returned no surfaces. Live GPU rendering, touch ergonomics, desktop/mobile visuals, native focus behavior and prolonged GPU-memory behavior are not automated-browser-certified. The user's screenshot confirms the real reused renderer displayed the digestive anatomy during implementation, but it is not a substitute for exhaustive interaction/performance testing.

Follow Along, scroll-driven focus, additional anatomical subjects, automatic term links, custom streaming geometry, clinical validation of the female study model, gallery-linked structure identification and new quiz features are deliberately deferred. Local delivery is recorded in the [cumulative handoff](integration/VISUALIZE_PALETTES_HANDOFF_2026_11_04.md). No push or deployment is included.


## Explore controls follow-up - November 6, 2026 (historical)

The current compact interface and default selection behavior supersede the shared-control behavior described below. See [the Learn UI polish handoff](integration/LEARN_UI_POLISH_HANDOFF_2026_11_06.md) for the cumulative changes after `479e931` and current verification.

Visualize and the compact Anatomy Companion share the same lesson workspace. Selection, hidden representations, isolation, layer visibility and explode amount are now mutable session state, using Explore's existing action helpers and model-bound identity. Hiding a multipart organ retains every representation in the hidden history; restore actions do not enable a disabled layer. Reset returns to the current digestive inventory. Changing models clears model-specific dissection; changing context does not rewrite source anatomy. Inspector panels open on selection and can be dismissed independently.

`app/explosion-controls.tsx` is extracted from Explore and used by both Explore and Learn. It retains the existing Button/Slider primitives, CSS classes, 460px dock, percentage formatting, filled play/pause glyphs, 30% marker/label, 48px reset control, keyed reset-confirmation animation and `useExplodeIdle` effect. Both callers keep the same `useExplodePlayback` hook and renderer-owned timing; manual input pauses playback at its displayed pose. Embedded CSS changes dock placement, with compact padding when needed, and excludes dock controls from the generic Learn button styles.

The shared renderer now fits embedded isolation and explosion to the actual canvas with a 16px inset rather than reserving full-screen Explore panels. The isolation fit uses the selected representations' real bounds. Explore keeps its established full-screen fitting branch. No geometry, canonical mapping, educational source JSON, Notes anchors or stored study progress changed.

The follow-up also fixes horizontal Visibility tab layout, explicit panel content sizing, broken Unicode labels, compact selector widths, and the companion camera-row arrangement. The duplicate bottom action row and permanently visible help paragraph are replaced by focused panel actions and a keyboard-help popover.

See [the implementation handoff](integration/LEARN_VIEWER_PARITY_2026_11_06.md) for checks, coverage limits and local-only delivery. `npm.cmd run test:anatomy-companion` now includes the catalogue/scope checks and five workspace interaction/layout tests. The workspace tests replace only the GPU renderer; they do not certify WebGL or final browser appearance.


## Current validation and delivery

See [Learn UI polish - November 6, 2026](integration/LEARN_UI_POLISH_HANDOFF_2026_11_06.md) for the latest changes, accepted checks and remaining browser/GPU limits. The anatomy companion command covers four real-manifest/camera tests and seven CPU-only workspace checks. Camera projection checks exercise the renderer's actual fit/resize functions against all eight canonical lesson references in both models, including same-aspect resizing. They do not replace live WebGL or touch verification.
