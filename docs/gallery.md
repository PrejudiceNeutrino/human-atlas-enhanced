# Digestive System Gallery

Learn -> Digestive -> Gallery makes all **30 curated figures** and **30 supplied WebP thumbnails** available on the main site. The gallery uses the same assets in development, preview and production, without an environment opt-in. The tab order is General Overview, Deep Dive, How It Connects, Who Cares?, Visualize, Gallery, Exam Cram, Study Tools.

## Assets and provenance

The tracked collection is `public/images/learn/digestive/gallery/`: the original `gallery.json`, `images/a01.webp` through `a15.webp` and `p01.webp` through `p15.webp`, and their matching `thumbnails/` files. Vite copies these into `dist/images/learn/digestive/gallery/` during the normal build. A fresh checkout contains everything needed; no ZIP import or private environment configuration is required.

All 60 images and the manifest are copied byte-for-byte from the supplied collection. Full-size SHA-256 values, dimensions, IDs, default order, titles, descriptions, alt text, tags, source slide references, crop provenance, `sourceType` and `rightsReview` fields are preserved. Existing image credits remain intact. The user's November 6 request authorizes including all figures on the main site; this does not alter the source's recorded rights-review status or claim a new license grant.

The ignored `.local-gallery/digestive/` archive retains the source README, reference HTML and contact sheet. These reference artifacts and `.env.local` are not public build inputs or committed assets. Vite retains the private-folder filesystem denial. The old development-only middleware, environment gate and local-study notice have been removed. `scripts/import-local-gallery.py` remains an archive importer, without modifying environment settings or the tracked public collection.

## Browsing and inspection

The responsive grid provides All plus four category filters: 9 Anatomical Models, 8 Anatomical Diagrams, 7 Histology and 6 Physiology Diagrams. Search covers titles, descriptions and tags while preserving supplied order. Thumbnails reserve their dimensions, load lazily and use `object-fit: contain`. The grid has three desktop columns, two at intermediate widths and one on small phones. Loading, empty results and errors reserve space to preserve Learn scrolling; failed requests offer Try again.

Opening a card uses the existing Base UI Dialog with the site's glass backdrop, theme and motion preferences. The selected full-size figure is fitted without cropping or enlarging beyond native resolution. Previous/next and Left/Right navigate the filtered set, wrapping at the ends. Controls support zoom, Fit/reset, Actual size, wheel zoom, double-click, pointer dragging and two-pointer pinch/pan. Plus/minus zoom, 0 fits, Escape closes, and focus returns to the opening card. Captions and slide provenance stay outside the image, with a white illustration surface retained in dark mode.

## Validation and delivery

The November 6 follow-up is a **local commit only**, with no push, upload or deployment. It supersedes the production-exclusion behavior described in the historical [November 4 handoff](integration/GALLERY_FLASHCARDS_HANDOFF_2026_11_04.md).

Current verification results are recorded in [the public-gallery handoff](integration/GALLERY_PUBLICATION_2026_11_06.md). Focused regression coverage is in `scripts/gallery.test.mjs`; run `node --test scripts/gallery.test.mjs`. Browser surfaces were unavailable in this session, so visual layout, native focus/keyboard and touch/pinch behavior were not browser-certified.
