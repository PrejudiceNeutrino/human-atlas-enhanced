# Digestive Learn and panel refinement handoff

Date: 2026-11-04. Previous commit/base: `9a2c2cd703d1b278a08180ba5b0ef28fc2f9a62a` (`feat: add glass Learn chooser and staged explosion playback`). This record covers **all changes since that commit**, including revised educational content, subsequent user refinements and the female Chest detail layout. Requested delivery is a **local main commit only**. The resulting SHA and final worktree status are reported in the delivery message. No push or deployment is included.

## Final behavior

The existing Learn chooser opens Digestive System on `/learn/digestive`. Its final tab order is:

1. General Overview
2. Deep Dive
3. How It Connects
4. Why's This Cool?
5. Exam Cram
6. Quizzes — disabled, visibly labeled Coming Soon

General Overview remains the default. The existing route dispatcher and deployment rewrites are unchanged; no duplicate article or quiz routes were created. Base UI's existing Tabs wrapper provides relationships, roving keyboard focus and manual activation. Quizzes remains focusable so its status can be discovered, but it cannot activate or navigate. Recognized section bookmarks open the corresponding tab, and changing tabs while scrolled starts the new reading at its top without smooth motion.

### Supplied educational content

- Imported the three revised ZIP JSON entries byte for byte: General Overview (8 sections), Deep Dive (15), Exam Cram (15). All introductory and section Markdown, wording, paragraphs, headings, lists, tables, emphasis, rapid recall and identification checklists render in source order. Subtitle, source-file and slide-reference fields remain metadata. The Markdown mirrors were not imported as duplicate articles. The user's requested Quizzes placeholder took precedence over the ZIP README's four-tab suggestion.
- Added How It Connects from the pasted **The Journey of Digestion** text. Its original article title, italic introduction and all ten numbered sections remain intact. Only heading boundaries were split into structured JSON; a complete reconstructed-Markdown digest verifies preservation after newline normalization.
- The original facts JSON remains unchanged. Its three introductions, explanations, pH table, comparisons and fat-transport sequence retain their existing formatting and independently expandable More Info panels. Hidden facts stay mounted so open panels survive tab changes. The user-requested **Why's This Cool?** display label is applied through the tab registry and an optional heading override; the original source JSON title and IDs remain intact.
- Full articles live in `content.ts`, imported by the lazy Learn page. The shared subject registry contains tab metadata only, so the 3D explorer's chooser does not import these long articles. Reusable article/facts/layout components support later subjects without duplicate page components. No future subject or quiz functionality was implemented.

Import hashes and initial content adaptation: [revised content](../digestive-content-revised.md). Complete narrative digest: [How It Connects](../how-it-connects.md). Current extension guide: [Learn](../learn.md).

### Reading layout and section navigation

- Added open article spacing, separated Exam Cram study cards, readable list spacing, semantic table headers and labeled/focusable table overflow regions. Shared Markdown parsing retains safe URL handling and does not execute raw HTML.
- All five content tabs use the same section menu. Desktop uses an 11px link size, compact spacing and a 180px sticky sidebar. At 850px and below, the index becomes a native details control that starts collapsed and has touch-sized links. Existing themes and reduced-motion styles apply.
- Highlighting follows the reading position in `.learn-shell` while scrolling down or up, on viewport resize and after accordion reflow. The sticky tab bar determines the reading threshold; the final section is selected at the bottom. The active link uses `aria-current="location"`, a colored leading rule and themed background. Internal sidebar scrolling keeps that link visible without moving the article.
- Passive scroll events coalesce into at most one requested frame; no continuously running loop was added. Only the visible reading layout observes reflow. Unmount or hiding the facts removes its tracker listeners/observer. Heading anchors are stable and focusable.

### Learn chooser and female Chest detail

- Widened the frosted chooser from 480px to a 760px desktop cap, reduced vertical spacing/radii and retained fluid mobile width and bounded height. Each subject card previews **all six tab names in final order**, with a Coming Soon badge on Quizzes; its count reports the five available readings. Preview text wraps rather than truncates. Existing dialog focus, Escape/close, shortcut scope and route behavior are retained.
- Moved reconstructed-female **Chest detail** out of the scrolling system list to the bottom of the left Visibility panel, above the visible-pieces/Restore all hidden footer. It remains limited to the Systems tab, as before. Added a top divider and spacing; Tissue/Glands/Pectorals behavior, accessibility state, descriptions and touch target sizes remain unchanged. Male anatomy is unaffected.

## Content integrity and boundaries

The ZIP JSON hashes and the original facts hash are pinned in `scripts/learn.test.mjs`; all pass. The narrative's reconstructed normalized-Markdown SHA-256 is `fd3fc71facdcd9520e277744b798452877e987f2d8e9de2435ef6a10c4b3c1bf`. Path-specific `.gitattributes` rules preserve new JSON bytes across Windows checkouts. Source hashes and extraction details are in the linked content records.

No dependencies, package-lock, model assets, scientific geometry, mappings, Regions/Areas, renderer, camera, picking or explosion code changed. No supplied educational prose was fact-checked or rewritten. Earlier reset/playback fixes remain outside this commit's diff. Ignored build/test output remains under `dist/` and `work/learn-tests/`.

## Complete changed-file inventory

**24 files: 11 added, 13 modified; no deletions.**

| Status | Files | Purpose |
|---|---|---|
| Added | `data/learn/digestive-system-general-overview.json`, `data/learn/digestive-system-deep-dive.json`, `data/learn/digestive-system-exam-cram.json` | Exact revised ZIP sources |
| Added | `data/learn/digestive-system-how-it-connects.json` | Preserved pasted narrative as structured content |
| Added | `app/learn/content.ts` | Reading-only content maps |
| Added | `app/learn/educational-article.tsx` | Reusable structured article renderer |
| Added | `app/learn/section-index.tsx` | Shared desktop/mobile index and reading-position tracking |
| Added | `app/learn/subject-tabs.tsx` | Existing-route tabs, bookmarks, panel state and top-of-tab behavior |
| Added | `docs/digestive-content-revised.md`, `docs/how-it-connects.md`, this handoff | Source provenance, adaptation, tests and cumulative delivery record |
| Modified | `app/learn/subjects.ts` | Metadata-only registry, schemas, final order and labels |
| Modified | `app/learn/page.tsx` | Shared tabs within the existing page |
| Modified | `app/learn/educational-entry.tsx` | Indexed facts wrapper, display-title override and focusable headings |
| Modified | `app/learn/educational-markdown.tsx` | Optional labeled, focusable article table region |
| Modified | `app/learn/learn.css` | Tabs, reading/index/card/table styles and responsive behavior |
| Modified | `app/learn/subject-menu.tsx`, `app/learn/subject-menu.css` | Rectangular chooser and wrapping full-section preview |
| Modified | `app/page.tsx`, `app/globals.css` | Female Chest detail moved to panel bottom with divider |
| Modified | `scripts/learn.test.mjs` | Full content, navigation, index, dialog and accessibility regressions |
| Modified | `.gitattributes` | Stable new educational JSON bytes |
| Modified | `README.md`, `docs/learn.md` | Current behavior and documentation links |

## Final verification and practical limits

Final checks passed on the complete implementation before staging. Coverage is focused on the changed content/UI boundaries; it is not an exhaustive repository or browser certification.

| Check | Result |
|---|---|
| `node --experimental-strip-types --test scripts/learn.test.mjs scripts/final-ui.test.mjs scripts/shell-cleanup.test.mjs` | **30/30 passed**: 21 Learn, 3 shortcut and 6 viewer-state tests |
| `npm run check` | **Passed** |
| `npm run build` | **Passed in 17.42s**, with existing large-chunk and plugin-timing warnings |
| `git diff --check` | **Passed** |
| `git diff --cached --check` | **Passed** after generated-JSON newline cleanup |
| Existing facts JSON integrity | Unchanged, pinned SHA-256 passes |
| Live browser/mobile/GPU certification | Unavailable; limitations below |

- Learn checks compare every rendered section's text against standard Markdown rendering and verify paragraph/list/emphasis/table structure, hashes and order. They cover all 48 article sections plus the three preserved facts, six-tab order, exact renamed heading, navigation/unknown subjects, placeholder nonactivation, roving focus, focusable anchors, bookmark reopening, mobile details, tab-top return, all shared indexes, scroll/upward/end/resize highlighting, observer cleanup, preserved independent accordions, themes, safe Markdown, dialog previews, no-navigation opening, Escape/close and focus restoration.
- Keyboard arrow/Home/End behavior executes the real Base UI handlers. jsdom lacks native Enter/Space default activation; the fixture explicitly supplies the equivalent button click. Base UI's disabled tab remains focusable for discovery but cannot activate. Scroll position tests use synthetic geometry.
- Browser-control inventory was empty during this session. Real desktop/mobile visual layout, color contrast, native pointer/touch/keyboard behavior, outside-press dismissal, hardware frame cost and smoothness remain unverified. DOM accessibility excludes contrast because jsdom has no layout engine. User screenshots informed the layout refinements but do not certify the final result.
- Earlier intermediate type/fixture failures were corrected: optional slide-reference keys, native-button default activation, focusable disabled-tab behavior and Base UI's own panel observers. Only completed final passing runs are certification for the checks actually run.
- Staged whitespace review caught CRLF physical line endings in the newly generated How It Connects JSON. Normalized that generated wrapper to LF; parsed JSON equality and the full reconstructed narrative digest were verified unchanged. The three byte-preserved ZIP sources and original facts were not normalized or rewritten. This formatting-only cleanup followed the test/build run and required no renderer or educational-text changes.

## Local Git delivery

Branch verified as `main`. Before this commit it was **2 ahead / 0 behind** the locally cached `origin/main`; after this single commit it should be **3 ahead / 0 behind** that cached reference. No fetch was performed, so this does not describe live remote state. No push, deployment or separate branch merge is included.
