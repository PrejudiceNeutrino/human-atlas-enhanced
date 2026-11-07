# Gallery Label Practice

Open **Learn → Digestive → Gallery**, open a labeled figure, then enable **Label Practice** (the tag icon on narrow screens). Ordinary image inspection is the default. Hide All, Reveal All, Reset Practice, a revealed counter, optional cover numbers, and a numbered label list sit in a secondary strip. The existing viewer still owns navigation, zoom, pan, pinch, Fit, 1:1, Details, stars, dismissal, and focus return.

Click or tap a cover to reveal the original printed pixels; click again to hide them. A drag beyond six CSS pixels pans without revealing. A pinch never counts as a reveal. Covers also accept Enter and Space, and the label list provides larger alternative targets. Hidden accessible names contain only label numbers. The image gets a generic practice alt description; revealing a cover exposes its curated answer to assistive technology.

**Identify** is optional. Select a cover or label number, type the term, and Check. Matching ignores capitalization and repeated whitespace but requires the complete preferred term or an explicitly curated accepted answer. Reveal Answer and manual reveals are assisted, not correct. Reveal All also marks unanswered labels assisted. Hide All preserves the session's outcomes; Reset Practice clears them. Leaving/reopening a figure starts its answers over. The enabled practice setting carries across figure navigation within the mounted Gallery, including the existing Starred-only selection.

Practice state is session-only. It never writes to localStorage or Study Tools progress. Existing stars remain in `human-atlas-gallery:v1:<subjectSlug>` with their existing schema, cross-tab updates, and storage-failure behavior. Revealed counts are not mastery scores.

## Data and rendering contract

The optional sidecar is `/images/learn/<subjectSlug>/gallery/label-practice.json`, fetched after the first figure opens. The existing schemaVersion 1 `gallery.json` is unchanged. No sidecar or a 404 simply leaves an ordinary Gallery; a failed or invalid sidecar shows an availability message without breaking image inspection or stars.

`app/learn/gallery/label-practice-model.ts` defines and validates schemaVersion 1:

```json
{
  "schemaVersion": 1,
  "subjectId": "digestive",
  "figures": [{
    "figureId": "a02",
    "sourceImageSha256": "<the actual 64-character GalleryFigure.sha256>",
    "reviewStatus": "candidate",
    "coverage": "partial",
    "reviewNotes": "Review the image and preview before publication.",
    "labels": [{
      "id": "a02-example",
      "label": "<transcribe the printed term>",
      "acceptedAnswers": [],
      "reviewStatus": "needs-review",
      "regions": [{ "shape": "rect", "x": 0.1, "y": 0.1, "width": 0.1, "height": 0.04, "fill": "#ffffff" }]
    }]
  }]
}
```

This is a structural example, not a publishable annotation. Use the editor to obtain real coordinates. All coordinates are fractions of the original image, with the origin at its top left. Rectangles require positive dimensions and must remain inside the image. Polygon regions use `points: [[x,y], ...]` instead of rectangle fields; they require at least three points and nonzero area. The editor preserves imported polygons; its drawing/move/resize tools author rectangles.

Each answer can have multiple regions to cover repeated words or a term printed on several lines. One action reveals/hides the entire answer. Colors must be opaque six-digit hex values: no alpha, blur, or translucent production masks. Optional `hint` and `conceptId` metadata are reserved for curated content; the current UI does not infer or fabricate concept mappings.

Figure review statuses are `verified`, `candidate`, and `not-applicable`; coverage is `complete`, `partial`, or `none`. Individual answers are `verified` or `needs-review`. An optional issue (`overlaps-anatomy`, `truncated-source`, or `inadequate-mask`) prevents that answer being verified. Only verified, issue-free answers on verified figures are playable. Partial figures display a coverage notice. A hash mismatch disables all masks for that figure until it is reviewed against the new crop. Validation rejects unknown figure IDs, duplicate IDs within their figure scope, malformed hashes, invalid coordinates, unsupported shapes, and inconsistent publication states.

The image and SVG overlay are siblings inside the same transformed image-space wrapper in `ZoomFigure`. They receive one translation and scale, including wheel anchoring, pointer pan, pinch, fit, and resize. SVG geometry never depends on viewport measurements at runtime. The editor converts pointer positions back into normalized image space automatically. Source image and thumbnail bytes, asset paths, manifest fields, provenance, and rights metadata remain intact.

## Curating an existing or newly imported figure

1. Add the figure through the existing Gallery import/manifest workflow, preserving its real ID, dimensions, source metadata, and SHA-256. Start `npm run dev` and open it in Gallery.
2. Choose **Annotate labels** below the viewer toolbar. This lazy-loaded editor exists only in development. It waits for the existing sidecar to load, or a confirmed 404, so an unfinished request cannot silently replace an existing collection with an empty draft.
3. Existing annotations load automatically. For a new term, choose **New answer**, enter its printed label, then drag a rectangle over the text. Dragging again on empty image space adds another region to the selected answer. Select an existing cover to move it; drag its corner handles to resize it. Arrow keys move the selected rectangle one source pixel; Shift moves ten. Zoom/Fit remain available while authoring; use Preview masks for ordinary pan and pinch inspection.
4. Add accepted answers one per line, select a cover color, and record mask concerns. Use Delete region or Delete answer to remove mistakes. Cover every repeated occurrence of the answer. Keep leader lines and useful anatomy visible. If that cannot be done honestly, leave the answer flagged and unreviewed, or obtain a reviewed alternative asset rather than publishing misleading coverage.
5. Use **Preview masks** at fit, 1:1, and enlarged views. Reveal/ordinary inspection remains available after leaving the editor. Confirm the transcription against the actual source. Mark individual answers reviewed, choose the honest coverage level, add review notes, then mark the figure reviewed. Edits to geometry or answer text invalidate review automatically.
6. **Export JSON** downloads a complete durable sidecar, preserving the other figures. Replace `public/images/learn/<subjectSlug>/gallery/label-practice.json` with the reviewed export and inspect its Git diff. Import JSON can load a prior export back into the editor; it validates the schema, subject, figure IDs, and current figure hash. A file for a different image version is rejected. Keep unfinished drafts outside the published sidecar if desired.
7. Reload Gallery after replacing the file. Run the checks below and visually inspect the published covers. Commit the metadata with its coverage report. No application change is needed for each additional annotated image or subject collection.

The editor has no server writes, backend, or authentication. Browser drafts are not autosaved: export before closing, navigating to another figure, or reloading. Import/export requires the full collection when preserving other figures; exporting a deliberately partial imported collection exports that collection. Production builds remove the editor import and its write-capable controls entirely.

## Coverage and verification

The [current coverage report](gallery-label-practice-coverage.md) lists all 30 figures: 28 eligible, 24 playable, 23 complete, one partial, four remaining candidates, and two without useful printed labels. There are 272 visually reviewed answers across 294 mask regions. "Complete" refers to identifiable eligible callouts, not all explanatory text on the page. The requested edge-clipped terms on a05, a12, and a13 are included with covers reaching the source boundaries; unreadable terms remain excluded.

```powershell
npm.cmd run check
npm.cmd run test:label-practice
npm.cmd run audit:label-practice
npm.cmd run build
```

After changing annotations, regenerate the coverage report with `npm.cmd run audit:label-practice -- --write`. The audit checks every source hash as well as annotation validity and report freshness; it does not verify geometry visually.

For real Chromium acceptance, run the dev server on port 3096 and the built preview on 3097, then `npm.cmd run test:label-practice:browser`. Override `ATLAS_DEV_URL`, `ATLAS_URL`, `CHROME_PATH`, or `SMOKE_OUTPUT` as needed. The script uses a temporary browser profile under ignored `work/label-practice/browser`, never a personal profile. It exercises multiple aspect ratios, zoom/pan alignment, pointer drag versus reveal, keyboard/list controls, touch and rotation, production editor exclusion, and the development curator's draw/move/resize/multiple-region/preview/import/export workflow. Screenshots and the browser report remain ignored local review artifacts.

Automated counts and alignment checks complement source-image and screenshot review. Desktop Chromium touch emulation is not a physical-device or screen-reader certification. This is a visual transcription/masking review of supplied educational materials; the feature does not add clinical validation or new rights claims.
