# Public Digestive gallery - November 6, 2026

The user requested that all gallery figures be available on the main site, followed by a local commit. This supersedes the local-study-only boundary in the November 4 handoff. Delivery remains local: no push, asset upload or deployment.

## Changes

- Added all 30 original full-size WebPs, 30 supplied thumbnails and the unchanged manifest under `public/images/learn/digestive/gallery/`. Vite includes these in normal production builds; fresh checkouts need no private ZIP or environment opt-in.
- Switched the existing Gallery renderer to the public URLs and removed its development flag and local-study notice. Loading errors offer a visitor-facing retry action. Existing grid, search, filters, image inspection, zoom/pan and navigation remain in place.
- Preserved all source bytes, captions, alt text, stable IDs/order, dimensions, hashes, slide references, crop metadata and recorded rights-review fields. The user's inclusion request does not change those provenance records or assert new licensing rights.
- Removed the obsolete local-serving Vite plugin and feature-flag configuration. Private-folder filesystem denials remain. The archive importer no longer changes environment settings; it continues to retain source reference material locally.
- Updated current documentation and the shared Gallery description. Source README, reference HTML, contact sheet, environment files and work artifacts remain ignored and excluded from public assets.

## Verification

| Check | Result |
| --- | --- |
| `npm.cmd run check` | Passed |
| `npm.cmd run build` | Passed; existing large-chunk and plugin-timing warnings remain |
| `node --test scripts/gallery.test.mjs scripts/learn.test.mjs` | 29 passed, 0 failed |
| Production preview `/learn/digestive` | HTTP 200 with application shell |
| Production manifest and all 60 image endpoints | All 61 returned HTTP 200, correct MIME types and byte-for-byte original content |
| Production output contents | Only manifest, images and thumbnails in the public gallery folder; local-study notice and private endpoint absent from JS |
| Browser verification | Unavailable: connected inventory exposed no browser or app surfaces. Visual layout, native focus/keyboard and touch/pinch behavior were not rechecked |

The first focused-test attempt was blocked by sandbox restrictions on esbuild's parent-directory scan. The same command passed when rerun with approved execution permissions; no application workaround was needed. The production preview server was closed after verification. No broad anatomy, GPU or Study Tools suites were run for this focused asset-publication change.

## Delivery

Work is on local `main`, following `41687df`. Before this change, `origin/main...HEAD` was 0 behind and 0 ahead against the locally cached remote reference. The final commit adds one local commit. No remote refresh, push or deployment was performed, so the live site remains unchanged until this commit is delivered.
