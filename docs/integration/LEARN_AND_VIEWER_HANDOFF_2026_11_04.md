# Learn and viewer interaction handoff

Date: 2026-11-04. Base commit: `9e0d710fcc1d467dc758d61d6f417231cb1472fe` (`feat: add context reveal for obscured anatomy`). Branch and requested delivery: **local `main` commit only**. This record covers every tracked addition/change since that base, including the supplied content and subsequent viewer refinements. The resulting commit SHA is reported in the delivery message; no push, merge to another branch, or deployment is authorized or performed.

## Resulting behavior

### Learn and Digestive System

- Added `/learn` and `/learn/digestive`, dispatched by the existing Vite/React entry point. Learn remains a lazy-loaded page; the atlas viewer is not loaded or its anatomy fetched by the Learn page. Deployment rewrites support the Learn landing route and subject routes, while the existing `/`, `/male` and `/female` behavior remains.
- Added shared Explore/Learn navigation, a Learn landing card and subject subnavigation. `app/learn/subjects.ts` supplies the subject registry and its structured sections. Adding another subject requires content plus a registry entry rather than changes to the page/navigation components. Unknown subjects show a Page not found heading with available-subject links.
- The first page title is **Digestive System**. Its first section is **Why Is This Cool?**, with the three supplied entries in their existing order. Each introduction remains visible; each More Info control independently opens/closes its own explanation and starts collapsed.
- Copied `data/learn/digestive-system-why-is-this-cool.json` byte for byte from the user-supplied JSON. SHA-256: `03404d3524c3adefb2f6595e410076f9f439eb39f61ea895d7597bae511fd578`. A path-specific `.gitattributes` rule disables line-ending conversion for this source so its bytes and integrity test survive Windows checkouts with `core.autocrlf=true`. No wording was summarized, rewritten or invented. Italic/bold emphasis, paragraph boundaries, comparisons, pH values/table, Unicode en dash/arrows and the complete fat-transport sequence are retained.
- Added reusable educational entry, expandable explanation and Markdown components. The existing Base UI Collapsible wrapper provides native button behavior, expanded-state semantics and panel visibility. Explicit IDs, descriptions and labeled panel regions distinguish the three controls. Markdown heading levels follow the containing page hierarchy; pH table headers have column scope. A presentation plugin marks existing transport-step/arrow paragraphs without changing their text.
- Reading pages use the existing palette, font, control and motion tokens, shared saved theme preference, responsive widths and a scrolling application viewport. They include a skip link, subject/current-page indicators, mobile reading layouts, styled tables/steps and reduced-motion rules.

Details and extension conventions: [Learn](../learn.md).

### Navigation and Visibility panel

- Moved Explore/Learn from below the left-side wordmark to a compact rounded group in the upper-right explorer toolbar. A vertical divider separates page navigation from the existing utility controls. Main navigation and Explorer panels retain distinct labeled navigation landmarks.
- Added compact search presentation at intermediate widths. On narrow screens the toolbar sits below the wordmark; the smallest layouts wrap with a horizontal divider. Model/Region/Teaching area and camera-control spacing account for the relocated toolbar. The Learn reading header keeps its shared navigation and theme control.
- Extended the desktop left navigation rail by changing its bottom clearance from 175px to 72px, providing 103px more Visibility-panel height at the same viewport size. Reduced desktop panel top padding from 18px to 8px, moving the Visibility title and eye control 10px higher. Existing mobile panel placement overrides are retained.

### Selection response

- Found that the green selection highlight eased from zero to full intensity over the 120ms fast-motion duration, allowing the first state-update frame to show almost no confirmation. Newly selected, displayed parts now receive full highlight intensity in that first update. Previous selections keep their existing fade-out; reduced motion and hidden-part behavior are retained.
- The actual click picker, model identity, geometry, GPU quality and inspector behavior were not replaced. An offline benchmark using the real male picker geometry measured eight torso-ray cases at approximately 5–15ms median CPU picking time. These are not browser click-to-paint timings.
- An experimental sorted/pruned picker improved those sampled CPU timings, but was **not integrated**. Its script/report remain ignored under `work/`. They do not establish full picking parity or the source of any unmeasured browser/GPU delay.

Investigation, measurements and limits: [Selection response](../selection-response.md).

### Reset camera and exploded-view fade

- Normal Reset, including the R shortcut, preserves its full state reset and now returns the camera to the established default fit over 650ms. The user explicitly accepted this camera motion. It interpolates position around the target using the shortest yaw, orbit radius/elevation, target pan and projection offset, then settles at the exact destination.
- Reset from an exploded view uses the user-requested opacity transition: 120ms fade-out of the existing 3D canvas, one hidden reassembly/default-camera fit, then 280ms fade-in. The old exploded pixels remain unchanged through fade-out. The model's pieces are not individually animated back together. Canvas pointer input is briefly suppressed during fade-out to prevent picking against geometry that is pending reset; UI controls remain available.
- Both modes use the existing scene loop. The camera return changes camera values; the opacity return changes the scene element's opacity. There are no added rendering passes, per-part materials, geometry copies, fetches or separate animation loops. Ordinary rendering still has its existing GPU cost.
- Residual OrbitControls damping is drained before the destination fit. Isolation exit is completed before capturing that destination. A normal return can be interrupted by pointer/touch interaction or zoom; repeated normal Reset starts from the visible pose. Repeated exploded Reset keeps its fade continuous. New navigation/slider commands supersede the pending fade. View lock is preserved, initial load does not replay Reset motion, resize uses the existing fit, and reduced motion bypasses both animations.

Behavior, lifecycle and test details: [Reset](../reset-camera.md).

## Dependencies and local development

Runtime additions: `react-markdown` (`^10.1.0`) and `remark-gfm` (`^4.0.1`). Test additions: `axe-core` (`^4.14.0`), `jsdom` (`^27.4.0`) and a direct dev declaration for the already-present `esbuild` version (`^0.27.3`). The lockfile records these dependency graphs and npm metadata adjustments; existing locked package versions were not upgraded or removed.

An early browser load reached Vite's failed `remark-gfm` resolution cache. A preliminary DOM-test approach also shared Vite's cache with the running dev server and invalidated optimized browser modules. The final DOM tests use esbuild to bundle only local page modules, leave React/UI packages external, write ignored `work/learn-tests` artifacts and never start Vite. Restarting the user's original server restored HTTP 200 for Learn and its dependencies; the user confirmed that Learn loads after refresh. The extra owned preview server was stopped. No browser cache workaround or test hook ships in the application.

No environment files, model binaries/manifests, canonical anatomy identity, Region/Area data, representation scopes or scientific classifications were changed. Existing Context Reveal target/context masks, depth rules, model boundaries and rendering passes are retained. Temporary build output, profiling output and test artifacts remain ignored and are excluded from the commit.

## Validation and remaining limits

The following results were observed during this work. A successful build retains Vite's warning about a large viewer chunk; that warning was not suppressed. Documentation/staging did not introduce executable changes or trigger redundant full-suite reruns.

| Check | Observed result | Evidence scope |
| --- | --- | --- |
| Supplied JSON hash/ordering | Passed | Repository copy matches the supplied bytes; source order and complete decoded text checked |
| `npm run test:learn` | 6/6 passed | Content fidelity, landing/subject/unknown routes, Markdown emphasis/table/steps, disclosure defaults/independence/focus/IDs, DOM accessibility and saved theme; retained earlier run, not repeated after viewer-only Reset changes |
| `npm run test:reset-camera` | 11/11 passed | Final Reset/fade implementation; actual scene-frame code and real OrbitControls damping, both Reset modes, hidden one-time reassembly, projection, repetition, interruption, reduced motion, lifecycle and normal-mode regression |
| `npm run test:motion` | 6/6 passed | Final immediate-highlight behavior and existing motion/stage contracts |
| `node --experimental-strip-types scripts/cursor-zoom.test.mjs` | 11 scenario groups passed | Final actual wheel handler, cursor anchoring, visibility, Reveal target priority and cleanup |
| `npm run test:context-reveal` | 17/17 passed | Earlier focused model/visibility/lifecycle/renderer/picking run after the selection fix; not rerun after Reset/fade changes |
| `npm run test:shell-cleanup` | 6/6 passed | Earlier viewer state-contract regression; not rerun after Reset/fade changes |
| `npm run check` | Passed | Final executable TypeScript state |
| `npm run build` | Passed | Final executable state, 16.55 seconds; large-chunk warning retained |
| `git diff --check` | Passed | Whitespace review; Git notes local LF/CRLF normalization for edited files |
| Existing locked dependency versions and protected anatomy paths | Passed review | No existing locked version upgrades/removals; no changed protected anatomy paths |
| Live visual/mobile/contrast/touch/GPU-latency certification | Unavailable / not performed | Browser-control inventory was empty; responsive/motion rules were source-reviewed. The DOM audit disables color contrast because jsdom has no layout engine |
| User review | Limited observed acceptance | User confirmed Learn loads and accepted normal Reset camera motion. The final exploded Reset fade has not received a subsequent user acceptance message |
| Complete repository/browser suites, independent anatomy review and public deployment | Not run | No comprehensive certification claimed; no push/deploy requested |

Preliminary dependency-resolution, Vite/SSR DOM-harness and Windows filesystem-access failures were superseded by the final isolated Learn test run. They are not counted as passing browser coverage. Future visual checks should inspect desktop and mobile navigation placement, panel height, all three open explanations, pH table/transport sequence, and both Reset modes in the real browser, including reduced motion and interrupted interactions.

## Complete file inventory

| Path | Change |
| --- | --- |
| `.gitattributes` | Preserve the supplied JSON's exact bytes across Windows line-ending conversion |
| `README.md` | Learn discovery/validation commands and links to this cumulative handoff |
| `app/globals.css` | Taller/tighter Visibility panel and the 650ms Reset motion token |
| `app/page.tsx` | Shared Explore/Learn navigation in the grouped utility toolbar |
| `app/scene.tsx` | Immediate selected-part highlight, camera Reset integration, exploded Reset opacity phases and lifecycle cleanup |
| `app/camera-return.ts` | New finite camera-pose interpolation with exact completion |
| `app/site-navigation.tsx` | Shared labeled Explore/Learn links and current-page state |
| `app/site-navigation.css` | Shared link styling, grouped toolbar/divider and narrow-screen positioning |
| `app/learn/subjects.ts` | Typed educational content/subject registry |
| `app/learn/page.tsx` | Learn landing, subject page shell, theme, subnavigation and section composition |
| `app/learn/educational-entry.tsx` | Reusable entry and independently expandable explanation |
| `app/learn/educational-markdown.tsx` | Markdown rendering, accessible table headers and text-preserving sequence styling |
| `app/learn/learn.css` | Reading layout, hierarchy, disclosure animation, table/sequence and responsive/reduced-motion styling |
| `data/learn/digestive-system-why-is-this-cool.json` | Unmodified supplied educational source |
| `web/main.tsx` | Lazy Learn route dispatch alongside the existing viewer routes |
| `vercel.json` | Learn landing and subject SPA rewrites |
| `package.json` | Markdown/test dependencies and Learn/Reset test aliases |
| `package-lock.json` | Dependency graph/metadata for those additions |
| `scripts/learn.test.mjs` | Isolated DOM/content/accessibility/theme tests |
| `scripts/motion.test.mjs` | Actual scene highlight-buffer regression tests |
| `scripts/reset-camera.test.mjs` | Camera interpolation and actual scene-frame/OrbitControls Reset tests |
| `docs/learn.md` | Learn architecture, extension, source fidelity and validation notes |
| `docs/selection-response.md` | Selection investigation, change and evidence limits |
| `docs/reset-camera.md` | Final normal/exploded Reset behavior, resource boundaries and verification |
| `docs/integration/LEARN_AND_VIEWER_HANDOFF_2026_11_04.md` | This complete cumulative handoff and delivery boundary |

## Delivery boundary

Commit the reviewed source, supplied JSON, tests and documentation together on local `main`. Keep ignored temporary work and generated `dist/` out of the index. Verify the resulting commit and clean working tree locally. Do not push, deploy or infer permission to publish from this local commit request.
