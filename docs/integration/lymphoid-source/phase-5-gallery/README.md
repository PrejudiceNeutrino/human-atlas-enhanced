# Lymphoid System — Curated Chapter 22 Gallery (Stage 5)

This package contains **35 nonredundant selected figures** from two supplied PowerPoint lecture decks (**51 + 20 = 71 slides**). It is designed as the visual-content equivalent of the prior Digestive System gallery, for review before Codex implementation.

All **35 full-size images and 35 640 × 450 thumbnails are WebP**. Figures are generally extracted directly from embedded PowerPoint media to preserve their original raster detail. Two figures are combined from source panels (seven nonspecific defenses and IgM/IgA configurations), and two are crops of rendered slides (labeled teaching-model photograph and intestinal lipid illustration). Images are not AI-generated.

## Files

- `gallery.json`: stable image IDs, figure titles, categories, captions/alt text, tags, original slide references, image extraction method, relevant Learn section IDs, and review flags.
- `images/*.webp`: curated images, original labels retained.
- `thumbnails/*.webp`: uncropped, letterboxed thumbnails.
- `gallery-preview.html`: self-contained offline reviewer with filters, search, large-image inspection, and exported review notes. Open directly in a browser from this directory; no server needed.
- `contact-sheet.jpg` and `contact-sheet-1/2.jpg`: quick-selection visual overview.
- `anatomy-3d-candidates.json`: proposed 3D focus targets and *explicitly unverified* geometry resolution status.
- `gallery-validation.json`: checks for structural integrity, file existence, WebP format, section references, and duplicate extraction IDs.

## Scientific interpretation flags

Some slides use simplified figures. The most important caveats are included in `gallery.json` under `scienceReview` (MHC class I, cytotoxic T-cell priming, complement/immune timing, and a problematic innate/adaptive taxonomy diagram). Figure inclusion preserves course source content; the website should keep any caution metadata instead of silently rewriting the image.

## Anatomy Companion targets

The current `app/model-registry.ts` declares the `lymphatic` system for the main male reference, female study, and HRA female source model. **This is system-level availability only, not verification of individual spleen/thymus/node/duct meshes.** A Codex pass must resolve each candidate against the actual atlas identity index and model-specific geometry. No guessed canonical IDs appear in the supplied candidates file.

## Credit note

The user reports Professor Zimmerman's authorization to use his instructional slide images. Some supplied figures visibly carry Pearson or other publisher credits, which may need additional rights review before public redistribution. Metadata preserves a `rightsReview` flag; this package makes no independent ownership determination. The teaching-model photograph is described as instructor-approved based on user report, not as rights-audited.

No changes have been made to the Human Atlas GitHub repository.
