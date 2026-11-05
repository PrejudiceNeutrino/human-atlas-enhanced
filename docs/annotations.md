# Personal Notes and Highlights

Implemented 2026-11-04 against local main `863a70865af04bd16d5e9f9e038dc1b7d79c3f6d`. This is a local implementation; no commit, push or deployment is included unless separately requested.

The requested cumulative local delivery is recorded in [Notes and Learn handoff](integration/NOTES_LEARN_HANDOFF_2026_11_04.md), including every change since that base, the final inventory and verification results.

## Expanded selection validation

The expanded implementation passes **27/27 annotation tests** (12 core/storage and 15 UI/store) and **24/24 Learn tests**, plus TypeScript, production build and whitespace checks. New coverage includes heading-only selection/revisit/delete; whole sections and partial ranges across adjacent sections; one shared note and complete excerpt; actual IndexedDB reopen; legacy/current backup import and grouped export round trips; all-or-nothing reanchoring; overlap checks on every segment; long excerpts and malformed-group rejection; table/list selections; and linked text retaining navigation without nested interactive marks. No new dependency or database upgrade is needed.

The redundant "Text selected" status toast is removed. Tools dismiss on collapsed selection, outside pointer press, scrolling or resizing; an outside press also clears pending selection timers and stale guidance even if a toolbar button retained focus. A regression test covers selection clearing, outside presses with retained toolbar focus, and scrolling. Existing save/error feedback remains available. Native browser/mobile selection handling and visual layout remain outside DOM-test certification.

## Reference and adaptation

Architectural reference: [PrejudiceNeutrino/toye-world-history](https://github.com/PrejudiceNeutrino/toye-world-history/tree/6738e893e19fb191172cfe08535f2a57dc213e8b), inspected read-only at commit `6738e893e19fb191172cfe08535f2a57dc213e8b`. Reviewed its [annotation documentation](https://github.com/PrejudiceNeutrino/toye-world-history/blob/6738e893e19fb191172cfe08535f2a57dc213e8b/docs/annotations.md), core, IndexedDB adapter, local annotation client, global My Notes client, grouping/metadata helpers, Astro tools/content components and annotation tests.

Human Atlas ports Toye's separation of core validation/anchoring, shared IndexedDB storage, contextual tools and a global collection. It retains conservative same-source recovery, bounded versioned backups, overlap rejection, plaintext notes, preserved unresolved records and shared updates. It uses React components and the existing Base UI dialog rather than copying Astro components or imperatively moving React-owned DOM.

## User flow

- **Notes** is available beside Explore and Learn in the shared header, before theme controls. `/notes` is a dedicated, lazy workspace with its deployment rewrite. Explorer controls wrap earlier on compact screens to accommodate the extra navigation item.
- Selecting Learn text opens **Highlight / Add Note** tools. Highlight saves immediately. Add Note first saves the highlight, then opens an optional plain-text note editor. Click/tap a mark, or focus it and press Enter/Space, to edit or delete it. Marks with notes have a dotted underline. Normal copying is not intercepted.
- Selections support heading titles, paragraphs, leaf list items, table cells, linked text and ranges spanning whole or adjacent sections in one reading. One selection creates one saved highlight with one optional note; internal segments preserve each covered block's target, offsets and exact text. All five Digestive readings are supported, including page/section titles, reading introductions, embedded Markdown headings and More Info explanations. Menus and controls are excluded. Educational wording is unchanged.
- Keyboard selections and touch selection handles are observed through `selectionchange`; pointer/keyboard completion also checks the selection. **Alt+H** highlights and **Alt+N** adds a note when a supported selection is active. Escape dismisses selection tools without clearing the native selection. Actions have 44px targets. Tool positioning is bounded to the viewport; status messages do not move article text.
- Notes groups records by subject, registry tab order, source fragment, paragraph and offset. Entries retain the full excerpt and personal note, section/topic, modified date, and revisit/edit/delete actions. Filters cover subject, tab, notes-only and unresolved-only. Unknown/retired local sources remain visible rather than being silently removed.
- Revisit links use `/learn/digestive#annotation=<UUID>`. They wait for storage and rendering, choose the correct tab, open its required More Info panel, focus and identify the exact mark, and scroll according to reduced-motion preferences. Unresolved entries open their original reading without claiming a matching highlight. Annotation IDs remain in fragments, which are not sent to the web server.
- Deleting a highlight asks for confirmation and removes its note too. Saving an empty editor removes the note while keeping its highlight. Closing a changed draft asks before discarding it. Clear-all requires explicit confirmation. Readability and other site controls remain available if storage fails; failed saves leave drafts intact and report the failure.

## Storage, schema and privacy

IndexedDB database: **`human-atlas-personal-notes`**, version **1**, object store **`annotations`** keyed by stable annotation UUID. Indexes cover `target.subjectId` and `target.tabId`. This does not use Toye's database or export identifier. Storage is scoped to the browser profile, device and site origin; localhost, production and other browsers do not share data. Ordinary browser restarts retain IndexedDB, but clearing site data, browser eviction or private browsing can remove it. The workspace explains this and offers manual backups.

Each record stores:

- `id`, `schemaVersion`, created and modified ISO timestamps;
- new records use schema 2, with `selectionKind` (`text`, `heading`, `range`) and ordered `segments`; each segment has its own target and anchor. The primary target/anchor mirrors the first segment for sorting and revisit. Legacy schema-1 records remain readable without rewriting or clearing storage;
- a structured target: `kind: learn`, subject ID, tab ID and explicit source-fragment ID;
- anchor: paragraph/block ID, start/end UTF-16 offsets, exact excerpt, prefix/suffix context, original paragraph snapshot and content fingerprint;
- optional plaintext `note`, restrained `ochre` style and `anchored`/`unresolved` resolution status.

The target kind is explicit so a separately approved future schema can add other resource types, including structures, without treating mesh IDs as text offsets. No 3D notes, cloud sync, authentication or backend were implemented.

`annotation-storage.ts` resolves writes only after transaction completion, not request success. Read/plan/write occurs inside one readwrite transaction so separate tabs cannot overwrite one another's unrelated writes. The centralized React store serializes local operations, rejects stale editor saves, and refreshes subscribers from committed data. User edits advance the modified timestamp monotonically, even after a future-dated import or clock skew. A same-origin BroadcastChannel sends only the literal `changed` notification; no note text or records are broadcast. Messaging is optional: a blocked/unavailable channel does not disable working IndexedDB, although another tab may need a refresh. Version changes close stale DB connections. Blocked/unavailable storage reports an error and supports retry; there is no silent nonpersistent fallback.

No annotation code calls fetch, sends beacons, posts to a service or adds telemetry. The Analytics component is not mounted on Learn or Notes routes. Explorer analytics remain unchanged; the Notes navigation link itself contains no private state. No annotation records, exports, personal text or IDs are written into repository content, application logs, public indexes or external tools. Export creates a local Blob download; import reads a local file without uploading it.

## Anchoring under content revision

Human Atlas JSON has stable section/entry IDs but no manually assigned paragraph IDs. Each Markdown fragment therefore receives an explicit owner key: article introduction, article section, fact summary or fact explanation. Markdown AST parsing generates content-derived paragraph IDs and preserves exact displayed text, including emphasis, tight lists, table cells and hard line breaks. Unchanged paragraphs retain their identities when other paragraphs are inserted or reordered. Version fingerprints use a deterministic noncryptographic two-word hash; matching never relies on that hash alone.

Resolution remains within the original subject, tab and explicit source-fragment ID:

1. For an unchanged source version, verify the exact block ID, full text snapshot and selected offsets; this supports repeated text without guessing after edits. Otherwise find the unique current block matching the saved full snapshot. Repeated identical candidates after revision remain unresolved.
2. For an edited paragraph, require exactly one conservative match: at least 40 original characters, a bounded length ratio, at least 24 unchanged characters at one boundary, and at least 80% shared word coverage. Multiple qualifying candidates are rejected. There is no ordinal-position fallback and no search in another source section.
3. Use stored offsets only if the paragraph snapshot and exact selected text still verify. Otherwise require the exact excerpt and saved nearby prefix/suffix to identify exactly one position in that paragraph.
4. Resolve every segment of a grouped highlight before reserving any range. If any segment fails or conflicts with an occupied range, retain the complete excerpt and note as unresolved; never silently drop segments or reserve partially resolved ranges. Do not create a visual mark elsewhere.
5. Safe recovery refreshes the anchor snapshot, context, offsets and fingerprint. System-only resolution does not change the user's modification timestamp, so it cannot win over a newer edited note during import.

React renders mark fragments across styled runs without replacing the original paragraph DOM or dropping emphasis. Each covered block has a keyboard-focusable fragment; fragments open the same grouped record. Text within links is highlighted visually while retaining native link semantics, without a nested button or intercepted navigation. The Notes workspace also opens and edits the shared note. Adjacent annotations are allowed; overlaps/nesting are rejected. Notes must remain recoverable even after major edits, so aggressive fuzzy matching is deliberately avoided. Deleted/renamed owner IDs or substantial paragraph rewrites can require manual review in Notes.

## Backup rules

Export kind: **`human-atlas-personal-annotations`**, schema **2**, accepting both version-1 and version-2 backups. Exports contain an ISO export timestamp and annotation records, in compact JSON. Toye backups and unsupported versions are rejected. The IndexedDB database version stays at 1 because the existing object store and indexes support both record shapes.

- Import files are limited to **5,000,000 bytes** and **5,000 records**.
- New selections support up to 100,000 excerpt characters across 500 segments, with each block snapshot/segment bounded at 30,000 characters. Notes remain limited to 10,000 characters and context fields to 64. Legacy version-1 excerpts retain their 5,000-character validation limit. Every segment is validated; cross-tab groups, overlapping internal segments, mismatched primary anchors and malformed bounds are rejected. IDs, target membership, offsets, timestamp order, fingerprints and style/status vocabulary are validated. Unknown fields and URLs are projected out. Notes stay plaintext even when they look like HTML.
- Local writes have a 4,800,000-byte record budget so a complete compact backup remains below the import file limit. Rejected writes are atomic and preserve prior data.
- Matching ID: accept only a newer modified timestamp with the same target and exact excerpt. New ID: add unless it overlaps an existing record or exceeds limits. Invalid, older, conflicting or duplicate records are skipped and reported. Import merges inside the same atomic storage transaction. Foreign current subjects/tabs are rejected; previously valid local records from retired content remain unresolved and visible.
- Clear-all removes the shared store only after the user's confirmation. Backups are the recovery mechanism; no server copy exists.

## Initial verification and issues

Automated coverage uses the actual React components, canonical Markdown parser/model, selection ranges and IndexedDB adapter; IndexedDB is supplied by `fake-indexeddb` in tests rather than a Map stub. Final results:

| Check | Result |
|---|---|
| `npm run test:annotations` | **20/20 passed**: 9 core/storage and 11 UI/store tests |
| `npm run test:learn` | **21/21 passed** |
| `node --experimental-strip-types --test scripts/final-ui.test.mjs scripts/shell-cleanup.test.mjs` | **9/9 passed** |
| `npm run check` | **Passed** |
| `npm run build` | **Passed in 16.75s**, with existing large-chunk/plugin-timing warnings |
| Live dev module checks | **13/13 HTTP 200 JavaScript modules** after clearing the stale missing-file lookup |
| `git diff --check` | **Passed** |
| Canonical educational JSON and renderer diff | **Unchanged** |

These 50 focused passing tests supersede intermediate fixture/model failures; they are not a full repository or browser certification.

- Core checks: exact/context matching, paragraph insertion and edits, ambiguity/deletion, original-source confinement, Markdown text/IDs, bounds and foreign backup rejection, plaintext safety, newer-record merging, overlap/adjacency, transaction completion, reopen persistence, abort rollback, concurrent writes and unavailable storage.
- UI/store checks: real inline emphasis retained, selectionchange/Alt shortcuts, native copy untouched, highlight/note creation and editing, mark keyboard activation, tab/remount persistence, all supported blocks matching canonical rendered text, filters/grouping/unresolved records, More Info revisit/focus, local export/import/deduplication, size checks, delete/clear confirmation, stale writes, retired content, atomic storage budget and no network calls. DOM accessibility covers Notes and the revisited article.
- Existing Learn tests continue to verify all 48 article sections and original facts, tables/flows, accordions, tabs, indexes, dialogs, theme behavior and safe Markdown. Existing viewer shortcut/state tests cover navigation coexistence.
- A temporary live Vite failure occurred while the reader import existed before the stylesheet was created. A cached missing-file lookup survived initial file creation. Styles are now imported by the reading/Notes page entry points; reloading the existing Vite config without changing its contents cleared the cached lookup. All 13 checked Learn/Notes stylesheet/module endpoints then returned HTTP 200 JavaScript modules through the correct `/@fs/` dev paths. Initial `/app/...` requests merely returned HTML fallback and were not counted as module validation.
- The UI-to-catalog test found that Markdown hard breaks include a newline in rendered text. The text model was corrected, and every supported current block now compares equal to its actual rendered text. A cross-block selection fixture was also corrected to use valid DOM range offsets. These intermediate failures are superseded by the completed passing checks.
- Dependency installation declared already-installed `remark-parse` 11.0.0 and `unified` 11.0.5 directly; only `fake-indexeddb` 6.2.7 was newly added, as a dev dependency. Existing locked packages were not upgraded. npm reported 32 dependency audit findings; no blanket dependency remediation or install-script approval was performed as part of this feature.

No browser/app control surface was available (inventory empty). Native browser restart persistence, mobile selection handles/native menus, keyboard defaults, real pointer interaction, screen-reader output, visual contrast, device layout and GPU/frame smoothness are not browser-certified. DOM tests explicitly emulate native Enter/Space clicks where jsdom lacks browser defaults and disable contrast checks because jsdom has no layout engine. Responsive/theme/reduced-motion rules were source-reviewed; these tests do not claim a visual review. Heading and multi-block selections are now supported; native mobile selection behavior still needs a real browser/device check.

## Initial Notes file inventory

Added under `app/notes/`: `annotation-core.ts`, `annotation-model.ts`, `annotation-content.ts`, `annotation-storage.ts`, `annotation-store.ts`, `annotation-context.ts`, `annotation-render.tsx`, `annotation-selection.ts`, `annotation-reader.tsx`, `note-editor.tsx`, `page.tsx`, `notes.css`.

Added: `scripts/annotations.test.mjs`, `scripts/annotations-ui.test.mjs`, this document.

Updated: `app/site-navigation.tsx`, `app/site-navigation.css`, `app/learn/page.tsx`, `app/learn/subject-tabs.tsx`, `app/learn/educational-article.tsx`, `app/learn/educational-entry.tsx`, `app/learn/educational-markdown.tsx`, `web/main.tsx`, `vercel.json`, `package.json`, `package-lock.json`, `README.md`, `docs/learn.md`.

Total: **28 files** (15 added, 13 modified). No deletions.

The initial Notes implementation changed no anatomy data, canonical educational JSON, renderer, camera, explosion, themes or existing source wording. Later navigation-only JSON link wrappers and other Learn refinements are documented in `docs/learn.md`. Test bundles and build output remain ignored under `work/annotation-tests/`, `work/learn-tests/` and `dist/`.
