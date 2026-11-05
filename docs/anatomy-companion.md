# Visualize and Anatomy Companion

The Digestive System has a dedicated **Visualize** tab immediately before Gallery. Overview remains a reading page without an embedded model. Visualize provides a large interactive digestive model; eight explicit **View … in 3D** actions in Deep Dive open a reusable companion alongside the article. The same existing `AnatomyScene` powers both contexts and Explore.

## Using it

The model loads as its panel becomes visible, with an explicit Load button when intersection observation is unavailable. Choose a structure from Focus anatomy or select a real piece in the model. Selections use the existing immediate highlight and display the source structure's name. Curated structures use short passages from the supplied educational content; other picked parts use the existing atlas explanation/system overview, labeled when applicable.

Controls provide free orbit/pinch/wheel inspection, keyboard-accessible zoom and camera presets, Reset View, Full digestive system, surrounding context and Open in Explore. Camera targets come from the selected representations' actual bounds. Structure changes are user-initiated; scrolling does not select or rotate anatomy. The context option uses the existing Context Reveal renderer, with surrounding skeletal/respiratory/cardiac/urinary representations resolved through the canonical cervical/thoracic/lumbar/hip region index.

On wider desktops, Deep Dive's companion is a sticky column beside the article. It can collapse or close, and its dropdown changes the target without reopening the panel. On narrower displays it becomes an expandable inline panel above the article sections rather than covering text or creating narrow reading columns. Touch/coarse-pointer devices begin with interaction paused: tap Interact with model to manipulate it and Pause interaction to restore page scrolling over the canvas. Camera buttons and the selector remain usable without pointer manipulation.

Open in Explore opens the current model route in another tab with `?concept=<canonical ID>`. Explore resolves that explicit request once per model through the existing identity/selection/isolation workflow. Missing, unknown and candidate requests do not select substitute geometry. Normal Explore URLs retain their behavior.

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

All eight currently resolve in both offered models: `bp3d-male-4` and `female-study-v3`. The female study model uses its configured adapted reference geometry and estimated proportions; it is experimental, not an independently validated female anatomical reference. The disclosure remains visible. No male fallback is performed when resolving female representations. Availability checks require actual current-model geometry, valid counts/chunks, the correct coordinate frame and non-candidate/non-rejected/non-unresolved links. A missing target produces an explicit unavailable message with no unrelated highlight.

These source-ontology collections overlap, so piece counts are not additive. Multipart concepts retain every available representation rather than treating an organ as a single mesh. The complete digestive display combines the existing digestive system inventory with the curated concept representations: **142 unique pieces** per offered model. Optional surrounding context raises the scoped inventory to 266 male or 263 female-study pieces.

## Shared renderer and loading

- `LearningAnatomyViewer` is the visibility/lazy/error boundary; `viewer.tsx` owns lesson controls and selection state. Only one Learn scene can be mounted: Visualize and Deep Dive are mutually exclusive tabs, and inactive article/tab panels unmount. Collapsing or dismissing the companion releases its renderer.
- `model.ts` calls the existing model registry, `createIdentityIndex` and `createRegionIndex`. It derives a runtime manifest view containing necessary parts/chunks. Original source IDs, byte offsets, positions, normals, indices and bounds stay unchanged. Chunk indexes are remapped only within that in-memory view; the source manifest and canonical representation records are untouched.
- The existing binary format permits **chunk-level**, not individual-organ network loading. Digestive-only male loads 6 of 15 chunks (about **13.76 MB compressed**); female study loads 7 of 17 (about **16.66 MB compressed**). Those shared chunks contain unrelated bytes, but the scene constructs GPU geometry only for scoped parts. Browsers without native gzip decompression use the existing larger uncompressed fallback.
- Showing surrounding context or changing model recreates the single scoped scene using its normal disposal path. Overlapping chunks may benefit from browser HTTP caching, but this pass adds no custom buffer cache or new geometry pipeline. The model catalogue/crosswalk/regions are still complete lightweight metadata.
- Embedded mode adds an unobstructed camera fitting rectangle, the full model's existing grounding offset and scoped zoom commands. Existing fullscreen Explore defaults remain in place. The scene's normal colors, display brightness/contrast, theme, selection shader, context rendering and reduced-motion camera/reset utilities are reused. The embedded floor is the existing Void preset.
- While an embedded viewer is offscreen or the document is hidden, its frame loop stops. Visibility resumes it without starting another renderer. Scene teardown aborts outstanding geometry fetches, disconnects resize/visibility handling, cancels frames, disposes controls/materials/geometries/textures/environment/renderer and removes the canvas. Metadata requests also abort on model change/unmount.
- WebGL initialization/context failures produce a readable error with Retry 3D and leave the article and Open in Explore available. Lazy module failures are contained by a viewer boundary. No global Learn keyboard listener or automatic orbit/follow-along behavior is added.

The rendered controls/model are `data-annotation-excluded` and marked to disable atlas-wide shortcuts. Deep Dive's prose/heading annotation sources remain unchanged, and text is still selectable for copying, highlighting and personal Notes. No Notes or Study Tools storage is written by the companion.

## Files

- Added `data/learn/digestive-anatomy-references.json` and `app/learn/anatomy-companion/{references.ts,model.ts,learning-viewer.tsx,viewer.tsx,visualize-page.tsx,companion.css}`.
- Updated `app/learn/educational-article.tsx`, `subjects.ts`, `subject-tabs.tsx` for curated actions, companion layout and the Visualize tab. Navigation chooser/guide/order derive from the same registry.
- Updated `app/scene.tsx` with opt-in embedded fit, activity/visibility pause, grounding and zoom support. Existing fullscreen call sites use defaults.
- Updated `app/viewer-interaction.ts` and `app/page.tsx` for explicit canonical Learn-to-Explore requests.
- Added `scripts/anatomy-companion.test.mjs` and its package command; updated focused Learn/navigation expectations and the existing camera fixture for the optional scene fields. Updated README, Learn/Gallery docs and this file.

## Validation and limits

- Three mapping/scope tests passed against both actual manifests, crosswalk and region dataset: all eight concepts, multipart resolution, original offsets/bounds/chunks, no manifest mutation, real focus bounds, unavailable/candidate/foreign-model rejection, context state and canonical Explore targets.
- Two focused Learn DOM tests passed: Overview stays model-free, Visualize owns the entry point without eager geometry initialization, eight curated actions open the companion, reading text is unchanged, collapse/expand works and close restores focus.
- Existing Context Reveal checks: **17 passed**. Existing actual-camera/scene-frame reset checks: **18 passed**, including real OrbitControls damping and reduced motion. Their fixture now provides the new optional embedded/zoom fields while retaining fullscreen expectations.
- Final TypeScript check and production build **passed**; the build completed in **16.80s** and emitted separate lazy `viewer` and shared `scene` chunks. Existing Vite large-chunk/plugin-timing warnings remain. The full repository/Learn/Notes suites were not rerun, following the user's limited-testing preference. Focused accepted coverage totals **40 passing checks** across the mapping, two Learn DOM, Context Reveal and camera suites.
- The connected browser inventory returned no surfaces. Live GPU rendering, touch ergonomics, desktop/mobile visuals, native focus behavior and prolonged GPU-memory behavior are not automated-browser-certified. The user's screenshot confirms the real reused renderer displayed the digestive anatomy during implementation, but it is not a substitute for exhaustive interaction/performance testing.

Follow Along, scroll-driven focus, additional anatomical subjects, automatic term links, custom streaming geometry, clinical validation of the female study model, gallery-linked structure identification and new quiz features are deliberately deferred. Local delivery is recorded in the [cumulative handoff](integration/VISUALIZE_PALETTES_HANDOFF_2026_11_04.md). No push or deployment is included.
