# Respiratory System — Curated Chapter 23 Gallery (Phase 5)

This package contains **29 deliberately selected gallery figures** from the two supplied Chapter 23 PowerPoints: 42 physiology slides and 19 anatomy slides, 61 reviewed in total.

- `gallery.json` — source of truth: stable IDs, titles, descriptions, categories, slide provenance, source type, rights-review flags, educational article targets, image paths, dimensions and SHA-256 hashes.
- `images/` — **29 full-size WebP** figures cropped from the lecture material. All labels preserved within chosen crops.
- `thumbnails/` — **29 WebP** gallery thumbnails.
- `gallery-preview.html` — standalone review interface with search, category filters, source information, fullscreen image viewer, and editable/exportable review notes. Thumbnails are embedded so the preview grid works even without local assets; for **full-resolution inspection**, extract this ZIP and open the preview from the same extracted directory.
- `contact-sheet.jpg`, `contact-sheet-1.jpg`, `contact-sheet-2.jpg` — contact sheets for quick inspection.
- `anatomy-3d-candidates.json` and `anatomy-3d-audit.md` — proposed gross anatomical targets, deliberately **not** invented canonical concept mappings.
- `scientific-interpretation-notes.md` — lecture simplifications that need contextual explanation.
- `gallery-validation.json` — automated format, dimension, reference and file-integrity summary.

**Categories:** anatomical models (4), anatomical diagrams (9), histology/microscopic anatomy (5), physiological diagrams (11).

**Extraction:** cropped high-resolution renders of the supplied slides, retaining labels and PowerPoint annotations. Two contrasting ventilation slides (24 and 25) are presented as one side-by-side figure (`p11`). These are images extracted from the user's supplied educational materials, not newly generated illustrations.

**For Codex:** use `gallery.json`, its stable figure IDs, and the WebP files. Reuse the current Gallery component, lazy-load card thumbnails, load full-resolution assets only in the image inspector, and preserve source- and rights-review metadata. Integrate the anatomy candidate list only after resolving actual canonical IDs via the current model's identity index.

**Local/offline use:** the user has indicated that these teaching assets are for local use initially. Some diagrams contain publisher credits. Keep media local and excluded from public production until rights decisions are made separately.
