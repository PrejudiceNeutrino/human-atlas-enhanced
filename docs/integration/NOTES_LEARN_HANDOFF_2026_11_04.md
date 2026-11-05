# Notes, highlighting and Learn refinements handoff

Date: 2026-11-04. Base/previous commit: `863a70865af04bd16d5e9f9e038dc1b7d79c3f6d` (`feat: expand Digestive Learn content and section navigation`). This record covers every change since that commit. Delivery is a **local commit on main only**; no push, fetch or deployment is included. The delivery message records the resulting SHA and final worktree status.

## Final behavior

### Personal Notes and Highlights

- Notes appears beside Explore and Learn in the shared header and opens the lazy `/notes` workspace. The deployment configuration rewrites that route to the existing SPA entry point. The explorer toolbar wraps at 480px to accommodate the extra navigation item.
- All five Digestive readings support selecting heading titles, partial text, whole sections and ranges across adjacent sections. Selections can include paragraphs, leaf list items, table cells, embedded Markdown headings, linked text, page introductions and expanded More Info explanations. One selection creates **one saved highlight and one optional note**, with internal anchors for each covered text block. Navigation menus and controls are excluded; selections stay within one reading tab.
- Selection tools support pointer/touch selection events, keyboard selection, Alt+H to highlight and Alt+N to add a note. Click/tap a mark or activate its focusable fragment with Enter/Space to edit or delete it. Plaintext note drafts survive save errors; changed drafts and destructive actions require confirmation. Linked text keeps its native navigation semantics without a nested interactive mark.
- The redundant selected-text toast is removed. Clearing the selection, pressing outside, scrolling or resizing dismisses the selection tools. Outside presses clear pending capture timers and stale guidance even when focus remained on a toolbar button.
- Notes groups entries in subject/tab/document order, shows complete excerpts and notes, and provides subject/section, notes-only and unresolved-only filters. New entries distinguish Heading, Passage and Extended passage selections. Revisit links select the proper tab, open a required More Info disclosure, wait for rendering, then focus and identify the saved mark. Unresolved selections retain their entire excerpt and note instead of being silently dropped or placed elsewhere.

### Storage, privacy and compatibility

- Browser-local IndexedDB database `human-atlas-personal-notes`, database version 1, stores records in `annotations`. No accounts, cloud sync or server-side note storage are introduced. Learn/Notes routes do not mount Analytics; explorer analytics remain unchanged. No actual personal records are checked into this repository.
- New records and exports use schema 2: ordered `segments`, each with its own structured target and verified anchor, plus `selectionKind`. The primary target/anchor mirrors the first segment for ordering/revisit. Existing schema-1 records and backups remain supported without deleting or rebuilding storage.
- Content-derived block IDs and explicit source-fragment IDs preserve ownership. Unchanged versions require verified ID, full block text and offsets. Revised content requires a unique exact snapshot or conservative same-source/context match. Every segment must resolve before a grouped highlight is displayed or reserves ranges. A missing/ambiguous/conflicting segment retains the complete record as unresolved. System-only recovery does not advance the user's edit timestamp.
- Transactions read/plan/write atomically and report success only after commit. The shared store serializes local writes, rejects stale note saves, maintains monotonic edit timestamps, and optionally notifies other same-origin tabs through a content-free BroadcastChannel message. Blocked messaging does not disable working storage. Storage failures are explicit and retryable.
- Local backups use kind `human-atlas-personal-annotations`, with version/field/target validation and newer-record merge rules. Unknown fields and foreign formats are rejected or projected out. Groups cannot mix tabs or overlap internally. Cross-record overlaps remain rejected; adjacent highlights are allowed. Limits: 5,000 records, 5 MB import, 4.8 MB local record budget, 100,000 selected characters across 500 segments, 30,000 characters per block snapshot and 10,000 per personal note. Export/import is entirely local.
- The read-only Toye architectural reference, pinned source commit, detailed schema, recovery rules and initial implementation issues are documented in [annotations](../annotations.md). `remark-parse` 11.0.0 and `unified` 11.0.5 were already installed transitively and are now direct dependencies; only `fake-indexeddb` 6.2.7 was newly added as a dev dependency. Existing locked dependencies were not upgraded.

### Learn presentation and navigation

- Final tab order: **General Overview → Deep Dive → How It Connects → Who Cares? → Exam Cram → Quizzes**. The facts tab's display label is now Who Cares? across the heading, chooser preview, section guide and navigation labels. Its original source ID/JSON title and three facts remain intact, preserving bookmarks and source identity.
- How It Connects and Who Cares? have short reading introductions using the other articles' header hierarchy, spacing and typography. The Journey of Digestion keeps its original italic opening line, with its additional description underneath. The facts introduction quotes “More Info” as the control name. These additions are registry metadata, separate from supplied educational prose.
- The far-right info button opens Section guide as a centered glass dialog, reusing the Learn chooser's blurred backdrop, surface, close button, theme and motion conventions. The user's general descriptions replace Digestive-specific guide copy. Five available approaches appear in spacious two-column cards, changing to one column on mobile; the last available card spans both desktop columns. Scrolling is bounded inside the dialog. Modal naming/focus, Escape/close dismissal and focus return preserve the active tab, article DOM and reading position.
- Gallery and Study Tools are **informational Coming Soon previews in the guide**, with readable titles/badges and blurred descriptions. They add no live functionality, routes or tabs. The existing disabled Quizzes tab remains unchanged pending its future replacement.
- Previous/next arrows sit below the desktop/mobile section index, separated by a subtle divider, with descriptive accessible labels and no shuffle control. They follow available tab order, disable at either end, skip Coming Soon, update the bookmark and focus the destination title after returning to the tab bar without smooth scrolling.
- The General Overview's final Deep Dive and Exam Cram references now link to their respective tabs. Normal activation switches locally with destination focus; modified clicks retain native browser behavior. Bold emphasis and all surrounding wording are preserved.
- Native text selection uses soft teal/dark text in light mode and deep teal/pale text in dark mode. Both color pairs have calculated contrast above 7:1; forced-color mode uses system Highlight colors. Persistent saved highlights retain their separate ochre treatment.

## Content integrity and boundaries

Only two Markdown link wrappers were added to `data/learn/digestive-system-general-overview.json`; there are no educational wording changes. The source integrity test removes only those two exact wrappers before comparing the original ZIP hash. Deep Dive, Exam Cram, How It Connects and the original facts JSON are unchanged in this commit. The original facts SHA-256 remains `03404d3524c3adefb2f6595e410076f9f439eb39f61ea895d7597bae511fd578`.

The Learn tests verify every supplied article section and fact, emphasis, paragraphs, lists, tables, transport sequence and independent More Info behavior. Raw HTML is not executed. No anatomy assets, scientific geometry/mappings, Regions/Areas, renderer, camera, picking, explosion or female Chest detail behavior changed since the base commit. Earlier anatomy/viewer work is outside this diff. Build/test bundles remain ignored under `dist/`, `work/learn-tests/` and `work/annotation-tests/`; verification logs are temporary local files.

## Complete file inventory

**36 files: 17 added, 19 modified; no deletions.** Counts include this handoff.

| Status | Files | Purpose |
|---|---|---|
| Added | `app/notes/annotation-core.ts`, `annotation-model.ts`, `annotation-content.ts` | Versioned records/backup validation, grouped anchors/recovery, Markdown block/source catalog, ordering and revisit URLs |
| Added | `app/notes/annotation-storage.ts`, `annotation-store.ts`, `annotation-context.ts` | Atomic IndexedDB, shared subscriptions/mutations, compatibility, storage errors and rendering contexts |
| Added | `app/notes/annotation-selection.ts`, `annotation-render.tsx`, `annotation-reader.tsx` | Multi-block range capture, annotated headings/text, selection tools, shortcuts and revisit focus |
| Added | `app/notes/note-editor.tsx`, `page.tsx`, `notes.css` | Personal note editor, global collection/filters/backups, responsive themed presentation |
| Added | `app/learn/section-guide.tsx` | Centered glass learning-approach guide and future previews |
| Added | `scripts/annotations.test.mjs`, `scripts/annotations-ui.test.mjs` | Core/model, actual IndexedDB-adapter and React/DOM regression coverage |
| Added | `docs/annotations.md`, this handoff | Architecture/reference, limits, validation and cumulative delivery documentation |
| Modified | `app/learn/educational-article.tsx`, `educational-entry.tsx`, `educational-markdown.tsx` | Reading introductions, source-scoped annotation support, selectable headings, safe local tab links and preserved disclosures |
| Modified | `app/learn/page.tsx`, `subject-tabs.tsx`, `section-index.tsx` | Annotation reader integration, annotation/disclosure jumps, guide trigger, previous/next navigation and heading focus |
| Modified | `app/learn/subjects.ts`, `learn.css` | Display label, descriptions/reading introductions/future preview metadata, guide and navigation styles |
| Modified | `app/globals.css` | Native selection colors and forced-color fallback |
| Modified | `app/site-navigation.tsx`, `app/site-navigation.css` | Global Notes link and compact-screen toolbar wrapping |
| Modified | `data/learn/digestive-system-general-overview.json` | Two requested in-article links, preserving wording/emphasis |
| Modified | `web/main.tsx`, `vercel.json` | Lazy Notes route, SPA rewrite and Learn/Notes analytics exclusion |
| Modified | `package.json`, `package-lock.json` | Direct parser dependencies, test-only IndexedDB dependency and annotation test command |
| Modified | `scripts/learn.test.mjs` | Current labels, source-link integrity, introductions, page arrows/links and modal guide checks |
| Modified | `README.md`, `docs/learn.md` | Current feature summary, extension conventions and links to detailed handoffs |

## Final verification and limits

| Check | Result |
|---|---|
| `npm run test:annotations` | **27/27 passed**, 12 core/storage and 15 UI/store tests |
| `npm run test:learn` | **24/24 passed** |
| `node --experimental-strip-types --test scripts/final-ui.test.mjs scripts/shell-cleanup.test.mjs` | **9/9 passed** |
| `npm run check` | **Passed** |
| `npm run build` | **Passed in 16.37s**; existing large-chunk/plugin-timing warnings remain |
| `git diff --check` | **Passed** |
| Canonical content integrity and existing renderer boundaries | **Passed** through pinned content tests and diff review |

These **60 focused tests** cover grouped/legacy annotations, headings and range boundaries, persistence across actual adapter connections, atomic recovery/import, failures and conflicts, note CRUD, backups, native copy preservation, linked text, stale selection dismissal, all existing Learn content/navigation/disclosures, guide modality/naming/focus return, and shared viewer shortcut/state contracts. DOM accessibility checks use axe with color contrast disabled because jsdom has no layout engine. This is not a full repository suite or real-browser certification.

No browser/app control surface was available during implementation. Native mobile selection handles, browser restart/eviction behavior, actual screen-reader output, full desktop/mobile visual review and animation smoothness remain unverified in a live browser. Browser-local storage does not sync automatically and can be removed by clearing site data; manual backups remain the recovery path. Substantial content rewrites or ambiguous anchors can retain records as unresolved. Gallery, Study Tools and quizzes functionality remain future work.

A transient Vite missing-stylesheet import occurred during initial Notes construction. Moving stylesheet imports to page entry points and reloading the existing Vite config cleared its stale missing-file cache. Thirteen relevant dev modules subsequently returned HTTP 200 JavaScript; the final production build also resolves them. No configuration-content change or extra service is included.

## Local delivery state

The branch was verified as `main`, based on `863a70865af04bd16d5e9f9e038dc1b7d79c3f6d`. Before this commit, cached `origin/main` and local main were equal (**0 behind / 0 ahead**). A single new local commit therefore makes main **0 behind / 1 ahead** of that cached ref, provided no concurrent ref change occurs. No remote was fetched or pushed. The post-commit status, exact commit ID and divergence are verified and reported in the final response.
