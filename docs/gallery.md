# Local Digestive System Gallery

Implemented from `digestive-system-curated-gallery.zip` and the user's gallery prompt. All **30 figures** (`a01`–`a15`, then `p01`–`p15`) and **30 provided thumbnails** are integrated in the supplied default order. All WebPs are copied byte-for-byte, without conversion, recompression, new crops or substitute images. The original `gallery.json`, source/rights fields, README, contact sheet and reference HTML remain in the ignored local collection folder.

## Navigation and content

Gallery is an enabled tab inside `/learn/digestive`, immediately before Study Tools. The current order is General Overview → Visualize → Deep Dive → How It Connects → Who Cares? → Exam Cram → Gallery → Study Tools. The attached implementation prompt predates the user's Who Cares? rename and enabled Study Tools; those existing changes are preserved rather than restoring the older Why Is This Cool?/Quizzes labels. The shared Learn chooser and Section guide derive Gallery from the same registry. The existing horizontally scrollable tab list supports all eight tabs without compressing the labels.

The page shows **Digestive System Gallery** and the requested subtitle. It renders manifest titles, descriptions and alt text verbatim. Four category controls plus All filter instantly, and token-based text search covers titles, descriptions and tags without rearranging the supplied order. Counts are 9 Anatomical Models, 8 Anatomical Diagrams, 7 Histology and 6 Physiology Diagrams. All 30 thumbnails use the supplied 640 × 450 exports with reserved dimensions, lazy loading and `object-fit: contain`. The grid has three desktop columns, two at intermediate widths and one on small phones. Thumbnail errors retain an accessible full-size inspection action; empty searches can clear their filters.

Category buttons disable the inherited button color transition. Their selected treatment also overrides the generic hover style, so selection appears immediately under the pointer and remains consistent when the pointer leaves. This CSS-only follow-up was not retested.

The synchronous Gallery loader reserves at least one viewport of height throughout module and manifest loading, empty results and errors. This prevents its temporarily short content from clamping the Learn scroll container back toward the page top when switching from a long reading. The existing shared tab-scroll behavior is retained. This follow-up was reviewed in source without a browser run.

## Image inspection

Opening a card shows an existing Base UI Dialog with the site's glass backdrop, themes and motion preferences. It displays only the selected full-size image, fitted to the available area without cropping or enlarging beyond native resolution. Captions and controls sit outside the image. The viewer provides:

- Previous/next buttons and Left/Right keyboard navigation through the current filtered result set, wrapping at the ends.
- Zoom-in/out buttons, Fit/reset, Actual size, wheel zoom, double-click fit/enlarge, pointer dragging and two-pointer pinch/pan.
- Plus/minus keyboard zoom, 0 to fit, Escape/close/outside dismissal and focus return to the opening card.
- Bounded internal scrolling and a focusable inspection region. The question/image dimensions are unchanged; changing figure or resizing the viewport resets the fit.

Zoom is anchored to the cursor or pinch midpoint. It stops at one image pixel per CSS pixel; no extra high-resolution copies are fabricated. Pointer panning changes only the image transform and does not rerender the gallery. Browser Ctrl/Meta zoom shortcuts are preserved. The white illustration surface is retained in dark mode so labels and third-party credits are not inverted or obscured. Full title and caption appear below the figure; subtle provenance formats the exact presentation filename and original slide numbers. The combined gastric-phase figure `p08` correctly displays **24-Digestive System.pptx — Slides 27–29**.

## Local setup and public boundary

From the repository root, run:

```powershell
python scripts/import-local-gallery.py 'C:\path\to\digestive-system-curated-gallery.zip'
npm.cmd run dev
```

The importer requires Pillow to decode and verify WebPs, already available in the implementation environment. Pillow is not used by the website, and no dependency was added to `package.json`. The importer checks all 30 stable IDs/order, full-size hashes, WebP decoding and full-size dimensions before installing. It preserves original bytes and existing environment settings. Its destination is **`.local-gallery/digestive/`** and it adds **`HUMAN_ATLAS_LOCAL_GALLERY=1`** to ignored **`.env.local`**. Set it to `0` or remove it to disable; restart the development server after changing it.

Both the private collection and `.env.local` are ignored by Git. Assets are outside `public/`, outside module imports and never emitted by the build. An explicitly enabled Vite development middleware serves only `gallery.json`, `images/[ap]01…15.webp` and matching thumbnails at `/__local-gallery/digestive/`. It rejects other files/methods, disables caching and refuses realpath escapes. Vite's existing environment/certificate/Git denials are retained and extended to the local collection; direct private-file URLs are blocked. Source README, reference HTML and contact sheet are not served by the gallery endpoint.

`__LOCAL_GALLERY_ENABLED__` is true only for an opted-in development server outside production mode. Builds and previews force it false even if `.env.local` enables the feature. Production renders a clear local-study availability notice and does not fetch the private manifest or images. There is no production publishing switch in this change. The Gallery UI/infrastructure may be committed; local assets and previews must remain excluded.

Before any public release, resolve each figure's recorded rights/third-party credits, retain required attribution, choose an explicit reviewed public asset manifest and intentionally change the publishing configuration. The source `rightsReview`, `sourceType`, crop provenance and original hashes remain available for that decision. The current local implementation does not claim redistribution approval or publish anything.

## Files

- Added `app/learn/gallery/model.ts`, `loader.tsx`, `page.tsx`, `zoom-figure.tsx` and `gallery.css`: reusable metadata/filtering, lazy/error boundary, collection UI and image inspection.
- Added `scripts/import-local-gallery.py` and `scripts/local-gallery-plugin.ts`: exact local import and development-only asset serving.
- Updated `.gitignore`, `vite.config.ts`, `app/learn/subjects.ts`, `subject-tabs.tsx` and `section-guide.tsx`: protected storage/configuration and shared navigation integration.
- Updated `README.md`, `docs/learn.md`, this file and existing Learn/Study Tools test navigation expectations. Those suites were not rerun.
- Local-only: `.local-gallery/digestive/`, `.env.local` and `work/gallery-boundary-check.mjs` are ignored and are not release artifacts.

The earlier uncommitted Needs Review list and front/back flashcard tint changes are preserved. No anatomy geometry, educational reading prose, Notes records, study content JSON, dependency or lockfile was changed for Gallery.

## Validation and limits

- All 30 full-size files and all 30 thumbnails decoded as WebP. All full-size dimensions and SHA-256 values match the supplied manifest. Import does not alter the source exports.
- The manifest and every one of the 60 development image endpoints returned the exact local bytes with the correct MIME type. The source-only README is refused. Direct private-folder and raw filesystem asset paths are refused.
- Production mode refuses the local manifest and exposes a false feature flag despite the local opt-in. The built distribution contains none of the 64 supplied private files or manifest records checked against their source hashes/content.
- TypeScript and the production build passed during implementation. The normal Vite large-chunk/plugin-timing warnings remain. A short-lived verification server reported a dependency-scan shutdown warning when closed; the endpoint/boundary assertions passed.
- No browser surfaces were available through the connected computer-use inventory. Live desktop/mobile visual behavior, native keyboard defaults, focus trapping and touch/pinch ergonomics are **not browser-certified**. Their handlers and existing Base UI integration were reviewed in source; no broad regression suites were run, following the user's limited-testing preference.

The [cumulative Gallery/flashcard handoff](integration/GALLERY_FLASHCARDS_HANDOFF_2026_11_04.md) records all changes since `a21d4fc`, including later UI fixes and their verification limits. Delivery is a local `main` commit of source/infrastructure/documentation only; private course assets remain ignored. No push, asset upload or deployment is included.
