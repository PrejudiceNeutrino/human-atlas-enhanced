# Digestive System Study Tools

The heading's introduction now explains the practice questions, flashcards, glossary, and topic filtering instead of displaying chapter metadata. See the [Learn discovery polish handoff](integration/LEARN_DISCOVERY_POLISH_2026_11_06.md) for the complete follow-up change set and verification limits.

Later Gallery and flashcard changes since `a21d4fc` are documented in the [Gallery/flashcard cumulative handoff](integration/GALLERY_FLASHCARDS_HANDOFF_2026_11_04.md). The older implementation checks below remain historical; the handoff separates the targeted arrow-key regression result from follow-ups that were not retested.

Implemented on `main` after `ed80a55`, using the supplied `digestive-system-study-tools-content.zip` and the user's implementation prompt. This document covers all changes since that baseline, including subsequent interface refinements. This is software integration of authored material, not new educational content. Delivery is a local commit only; no push or deployment is authorized.

## Cumulative local handoff — 2026-11-04

- Enabled the existing Digestive Study Tools tab with four native activities, exact supplied content, 12-topic filtering, reusable subject-bank components and lazy loading/error feedback. Existing reading tabs, facts and personal Notes remain available.
- Added randomized multiple-choice sessions, scoring/results/missed review and a prominent initial Start session action. Tightened question spacing and strengthened button visibility. Submit becomes Next question in place; the temporary submission-centering behavior was removed.
- Added fill-in-the-blank grading, authored hints/reveals, retry/review workflows and separate assisted-recall tracking. Both question activities offer complete, continuous answer keys without changing practice progress. Supporting explanations, alternatives and underlined reading links are muted while correct answers stay prominent.
- Added the complete searchable glossary as a continuous list without pagination, with topic/letter filters, related concepts and verified article-section links. Same-page source links activate the correct reading tab and focus its section.
- Added flashcard review, Known/Needs Review tracking, filters, shuffle/restart, completion and optional next-card-after-marking. Flashcards now open in their own centered glass viewer over the current activity and retain their session on close/reopen. The only visible shortcut labels are in the bottom guide: Left/Right navigate, Space/Up/Down flip, K/U rate, S/R shuffle/restart, and Escape closes. Editable controls and closed viewers ignore activity shortcuts.
- Added subject-scoped browser-local study progress, cross-tab refresh, visible storage errors, isolated reset and local review-report export. Study interactions are excluded from personal annotation selection; no Notes records are reset or exported by Study Tools.
- Aligned topic/export controls, expanded both storage notes to use available width and stacked footer controls on mobile. Reading-sidebar arrows retain their original equal widths with shorter 38px desktop height. The Exam Cram body-size override is limited to article sections so its introduction matches other reading introductions.
- Added source-data line-ending protection, data/reference/persistence and DOM test scripts, the package test command, updated Learn expectations, README and Learn documentation. Shared DialogContent gains opt-in retained mounting; other dialogs keep their defaults. No dependency or lockfile change is needed.

The file inventory below identifies every added runtime/data/test file and modified integration file. Ignored `work/` artifacts and the original external source ZIP are not part of the commit. Before this commit, local `main` was one commit ahead of cached `origin/main`; this commit makes it two ahead. No remote fetch was performed, so that comparison describes the locally cached tracking ref.

## Content and integrity

All five JSON files were extracted without rewriting and independently compared byte-for-byte with their ZIP entries. `.gitattributes` disables line-ending conversion for this dataset. The supplied Python validator passed, as do the native schema/referential checks. Runtime validation fails visibly on malformed records rather than silently filtering them. Unresolved teaching references are reported explicitly; none were found.

| File | Preserved records | SHA-256 |
|---|---:|---|
| `data/learn/digestive-study-tools/concepts.json` | 194 | `33aa58eee5a30286fe2e481f69ad410875d17524eda542c8c3ba2cb0e5b70baf` |
| `data/learn/digestive-study-tools/multiple-choice.json` | 111 | `2a957fd51429ab7373122f3dfa93852f47d688fa815a8778925340e8e4c49bd3` |
| `data/learn/digestive-study-tools/fill-in-the-blank.json` | 55 | `1dfeecebe8dcfede51a507a196c95396ba2d04a516ab830c4615bcfd6b4871b5` |
| `data/learn/digestive-study-tools/flashcards.json` | 101 | `1f1daf9f71015463e8873f4f411d042145d99a383a994458855971164ed8f022` |
| `data/learn/digestive-study-tools/manifest.json` | 12 topics | `092b4b41a574d031d2d6b92841978ae92d099b1e7af8aa7fc8f86ddb9b257039` |

All 461 educational record IDs are unique; all topic/concept/related-concept references, choices, correct choice IDs, blank placeholders, accepted alternatives and slide metadata validate. All **29 unique article/section references resolve** against existing Learn articles. No article prose, answer, distractor, hint, definition, alias, explanation or card was regenerated or rewritten. The supplied `types.ts` informed the local generic contracts. The preview's interaction code was inspected, not embedded or copied into the runtime; the original preview, README, types and validator remain available under ignored `work/study-tools-source/` and in the original ZIP.

## Navigation and interface

The enabled **Study Tools** tab replaces Quizzes at the end of `/learn/digestive`. Existing order and the user's current **Who Cares?** label are preserved. The later local-only [Gallery](gallery.md) integration inserts Gallery immediately before Study Tools; the study activity bank and behavior are unchanged. The Learn chooser/guide derive the live Study Tools entry from the registry.

The landing view displays **Study Tools**, **Digestive System · Chapter 24**, and four activity cards with exact counts. Every activity uses the manifest's exact topic IDs/labels plus All Topics; counts reflect the selected topic. Switching activities retains the selected topic and current sessions. Changing topic creates fresh sessions from that topic's records. All four activities are native React and use the existing typography, themes, surfaces, responsive breakpoints and focus styles. Long material wraps; the glossary renders the entire filtered list as one continuous scroll without page controls. A lazy component boundary defers the dataset/activity chunk until Study Tools opens. It has loading/error feedback and imports no 3D geometry.

Action controls use visible theme-aware borders, contrasting tinted fills, medium-weight text and a subtle raised surface. This applies consistently to session/result actions, Hint/Reveal/Retry, answer-key controls, exports, related concepts and flashcard deck/rating controls. Primary result-review actions use the solid primary treatment; secondary actions such as New session remain clearly outlined. Active Hint/deck/rating states and hover states are distinct, and native disabled/focus states remain intact. Known and Needs Review additionally use green/warm border accents when unselected. Styles remain scoped to Study Tools.

The topic selector and export button share an aligned desktop control row. The storage note occupies its own full-width row underneath, so it no longer raises the export button above the selector. On mobile, controls stack in source order and share the same left edge.

Both storage notes use the available width with left-aligned text and natural wrapping. The footer no longer caps its note at 500px: it shares a desktop row with Reset Study Progress, then stacks above the button on mobile. Balanced word wrapping avoids isolated trailing words where supported.

### Multiple Choice

10-, 20- or all-question sessions shuffle both questions and answer IDs once per session; normal rerenders do not reorder choices. Source `c1` correctness never depends on displayed position. Native radios and a form provide keyboard selection/submission. A submission guard records only one attempt per question. The authored explanation and correctly identified option appear after submission. Score/progress, Previous/Next, results, new sessions and review of missed/unanswered session questions are operational.

The initial Multiple Choice panel has a prominent **Start session** action alongside its description, stacking beneath it on mobile. It invokes the same session initializer as **New randomized session**, respecting the selected topic and question count.

Following user feedback, the question card is tighter and capped at 940px. Persistent controls offer **New randomized session** and **Review missed (count)**; the latter uses the selected topic's most recently incorrect questions from saved progress, including earlier sessions. It reviews all currently missed questions. The Submit control becomes a prominent **Next question** control in the same position, with focus retained there. Footer Previous/Next have clear surfaces/borders, arrows and a stronger Next style. **Submission does not auto-scroll**: temporary centering behavior was removed at the user's request. Advancing to an unanswered question returns its heading to view without smooth motion.

**View key** opens a continuous full answer key for the selected topic (all 111 questions with All Topics), independent of the current session size or missed-review subset. Every question retains all four authored options, with the correct choice identified by ID, a themed highlight and an explicit Correct answer label. Authored explanations and contextual reading links remain visible. The key uses stable source order without answer-position letters, since practice choices are shuffled.

### Fill in the Blank

All 55 prompts replace exactly one `_____` with an inline input while preserving the surrounding sentence. Checking uses only the authored answer/alternatives after case, whitespace and insignificant-punctuation normalization. There is no fuzzy/AI grading; numeric punctuation/signs remain distinct. Wrong answers support Retry; Hint and Reveal Answer use authored text. Explanations appear after checking/revealing. Revealed answers are tracked separately; a correct retry after a reveal is assisted practice, never independent recall. Previous/Next preserve each question's state. Session results and review of missed/revealed/unanswered questions are available.

**Reveal full key** opens all 55 completed prompts (or the selected topic's subset), with the supplied answers highlighted, accepted alternatives, explanations and reading links. Both key views are mounted only when explicitly requested and use the existing page's continuous scrolling. Back to practice controls at the top and bottom restore the exact unfinished session/draft and return keyboard focus to the key trigger. Browsing a key changes no score, attempt, per-question reveal count or saved study progress. Topic changes start fresh practice, consistent with the existing activity behavior. Shared rendering and focus/return handling live in `answer-key.tsx`; the JSON sources are unchanged.

### Glossary and Flashcards

The glossary displays all 194 concepts in one continuous alphabetical list, with no pagination or load-more steps. Search, topic and starting-letter filters immediately show their complete matching lists. Aliases, related concept buttons and source links remain available. Related-concept navigation can leave the current topic filter to show the exact concept. No glossary identity is interpreted as a mesh ID.

Flashcards show the authored front, flip via a native button to the authored back, reset the face on navigation, shuffle, mark Known/Needs Review, review only Needs Review, show session marking progress and restart/complete reviews. Review state/counts persist across refreshes. No hover is required.

The answer side has a clearly distinguishable theme-aware accent tint and an accented Back label; the front retains its neutral surface. The single-card surface has no border, shadow or focus ring in normal color modes. High-contrast forced-color mode retains a keyboard outline. The card has a fixed height with internal overflow for longer text, and reading links are omitted from single-card practice. Rating announcements are screen-reader-only. Flipping, navigating and rating therefore do not insert extra rows or move the controls; source reading links remain available in list view.

The flashcard viewer uses a glass surface up to 980px wide, a tighter card surface, grouped deck controls, a visible Known/Needs Review/unmarked badge, stronger rating buttons and a bottom shortcut guide. Optional **Next card after marking** is off by default and enables faster review without changing the normal manual workflow. Completed reviews focus their result heading; navigation/flip/restart returns focus to the card. The focused card's accessible name includes the authored face text and its description identifies the current side and flip action.

| Shortcut | Flashcard action |
|---|---|
| Left / Right arrows | Previous / next card (Right finishes the final card) |
| Space / ↑ / ↓ | Flip the card |
| Enter on the focused card | Native button flip |
| K | Mark Known |
| U | Mark Needs Review (unknown) |
| S | Shuffle the current deck/filter |
| R | Restart the current review in the same order |
| Escape | Close the flashcard viewer |

Flashcards open from the activity navigation or overview card in a centered glass dialog using the Learn menu's blurred backdrop, theme tokens and motion preferences. The current activity remains underneath. Escape, the close button or the backdrop dismiss the viewer and return focus to its opener. The mounted viewer retains its deck, position, face and review settings when reopened; topic changes and progress reset still restart it. Source-reading links in list view close the viewer before opening the referenced article. The dialog traps focus and scrolls internally on smaller screens.

Shortcut labels appear only in the bottom guide, while action buttons retain `aria-keyshortcuts`. While the modal is open, it owns a window keyboard listener so shortcuts work immediately regardless of which part of its surface has focus, including the header, close button and blank areas. The listener is removed on close/unmount; inline use remains scoped to the viewer. Text-entry fields, contenteditable text, links, other dialogs, Alt/Ctrl/Meta modifiers and composition/repeat events are excluded. Space/Enter preserve native activation on utility buttons and the auto-advance checkbox; arrow and letter shortcuts remain available from the checkbox. Shift+arrow/Space selection or page-navigation behavior is preserved. Restarting clears session marks, not saved Known/Needs Review history. This keyboard/layout/color follow-up received source review only; no routine tests or builds were run.

After `a21d4fc`, **List view** adds a continuous list inside the flashcard dialog. The All cards and Needs Review controls switch between every card in the selected topic and just those marked for review, with counts. It initially follows the current practice filter and preserves source order, with the complete authored question, answer and supporting reading links visible together. Opening/filtering the list changes no progress, rating, deck order, card position or face. Back to cards returns to the existing session; outside list view, the deck controls still start their respective practice decks. The empty state explains how to collect review cards. Card shortcuts and their guide are inactive while reading the list, allowing arrows and Space to scroll normally; Escape still closes the dialog. List entry/return moves focus to its heading/opener. The all-cards list extension received source review only; no tests or builds were run at the user's request.

The modal-wide keyboard follow-up initially attached a bubbling window listener, but Base UI's dialog popup stops composite arrow-key propagation. The listener now uses capture and removes the same capture listener on close/unmount, so it receives arrows before the popup boundary while retaining field, list and modifier guards. The single targeted DOM regression check `node --test --test-name-pattern="flashcard modal arrows" scripts/study-tools-ui.test.mjs` **passed**: all four arrows navigate/flip with the modal open, text fields and the review list retain normal keys, and closing releases keyboard control. No broader suite or build was rerun for this fix.

## Persistence and export

Progress is stored in localStorage under **`human-atlas-study-progress:v1:digestive`**, independently of the Notes IndexedDB database. The generic key is `human-atlas-study-progress:v1:${subjectId}`. No account, backend, cloud sync or uploads were added. MC records retain attempt/correct/incorrect counts, latest outcome and time. Recall records additionally retain hint/reveal/assisted counts. Cards retain Known/Needs Review status, review count and time. Storage events refresh other open tabs; read/write failures are visible and the current study session remains usable. This is lightweight local persistence, not transactional cross-tab attempt synchronization.

**Reset Study Progress** confirms first and clears only this subject's progress key, restarting its current activity sessions. Tests also create an actual personal annotation and verify reset preserves it and the existing theme preference.

At the user's later request, **Export review notes** downloads a `human-atlas-study-review` JSON report for the selected topic: attempted/reviewed record IDs, authored stems/prompts/fronts, outcomes/counters/times, contextual source references and review queues. It excludes private Notes/Highlights, correct-answer banks and editorial authoring state. This is a student study report, not the preview's content-author correction export; no Editorial Review interface was added. The action remains entirely local.

## Source navigation

In both answer keys, explanations, accepted alternatives and source links use the theme's muted text color to keep questions and correct answers prominent. Link underlines are softened at rest and regain emphasis on hover or keyboard focus; all supporting material remains expanded.

`sourceTarget` verifies `articleId` and `sectionId` against the existing article catalog, then constructs `/learn/digestive#<articleId>-<sectionId>`. `SubjectTabs` now handles same-page hash changes as well as initial bookmarks: activate the destination tab, wait for its heading to exist, focus it and scroll it into view. Unresolved references render as unavailable text instead of fabricated links. Slide references stay in the original records/report as contextual metadata; the interface does not claim exact PowerPoint quotations.

## File inventory

| Added | Purpose |
|---|---|
| The five JSON files listed above | Unmodified authored datasets/manifest |
| `app/learn/study-tools/types.ts`, `validation.ts`, `data.ts`, `model.ts` | Adapted contracts, schema/reference validation, lazy data adapter, filtering/shuffle/grading/search/link helpers |
| `app/learn/study-tools/progress.ts`, `review-export.ts` | Separate subject-scoped local progress and student review report |
| `app/learn/study-tools/page.tsx`, `loader.tsx`, `shared.tsx`, `study-tools.css` | Reusable workspace, Digestive adapter, lazy/error boundary, source/navigation controls and responsive theme styles |
| `app/learn/study-tools/multiple-choice.tsx`, `fill-in-the-blank.tsx`, `glossary.tsx`, `flashcards.tsx` | Complete native activities |
| `app/learn/study-tools/answer-key.tsx` | Continuous MC/FIB answer keys and shared focus/return handling |
| `scripts/study-tools.test.mjs`, `scripts/study-tools-ui.test.mjs` | Data/core/persistence and React/DOM integration checks |
| `docs/study-tools.md` | Content hashes, behavior, integration, files and limits |

Modified: `.gitattributes` (exact source bytes), `app/learn/subjects.ts` (enabled registry/guide state), `app/learn/subject-tabs.tsx` (lazy panel/hash navigation), `app/notes/annotation-reader.tsx` (exclude study interactions from annotation selection tools), `components/ui/dialog.tsx` (opt-in retained dialog mounting for flashcard session continuity), `package.json` (test command), `scripts/learn.test.mjs` (enabled tab/guide/order expectations), `README.md`, `docs/learn.md`. The pre-existing two edits to `app/learn/learn.css` are retained. No package dependency or lockfile change is required. No existing inline Study Mode/exercise identity system was found; none was forced into this implementation.

## Verification and remaining limits

The flashcard dialog, Up/Down flip shortcuts, final sidebar-button sizing, storage-note layout and answer-key muting follow-ups were reviewed in source only. Test selectors/shortcut expectations were updated for the new interface, without execution. Tests, type checks and builds were not rerun for the final follow-ups or this commit, following the user's request to avoid routine testing. The results below describe earlier verification and do not certify the final snapshot. Commit preparation includes a whitespace check and a review of the staged file inventory only.

- `npm run test:study-tools`: **21/21 passed** (8 data/core/storage and 13 React/DOM tests), covering all four activities, stable choice order, grading/score/review, hints/reveals, all 194 glossary concepts in a continuous list, aliases/definitions/related concepts, actual article tab/hash/focus navigation, flashcard persistence, reset isolation, review export, both complete answer keys and authored text/options/alternatives, topic filtering, session/draft preservation, no key-related progress writes, focus return, no network/geometry, DOM accessibility and submission preserving scroll position while focusing Next question, scoped flashcard shortcuts/typing guards, repeat suppression, optional auto-advance, single-card review boundaries and focus restoration.
- `npm run test:learn`: 24 existing/updated Learn checks passed.
- `npm run test:annotations`: 27 Notes/Highlights checks passed.
- Viewer/shared navigation checks: 9 passed (`final-ui.test.mjs`, `shell-cleanup.test.mjs`).
- Supplied Python validator, all five ZIP hash comparisons, TypeScript and whitespace checks **passed**. The latest production build **passed in 17.11s**. Existing Vite large-chunk/plugin-timing warnings remain. The focused suites total **81 passing tests** across this implementation; the full repository suite was not run.
- The browser-control inventory was empty. Tests use jsdom/fake IndexedDB and source review; native keyboard defaults/touch, actual desktop/mobile visuals, browser restart/eviction behavior and animation smoothness are not live-browser certified. Existing theme tokens/reduced-motion conventions apply; no new quiz flip/motion animation is required.
- Local progress can be lost if site data is cleared. The review export is a report, not a progress-import backup feature. Current sessions stay while switching activities but restart after reloading or changing topic; accumulated progress persists. Simultaneous writes in separate tabs are not fully transactional. Future subjects can reuse the generic activity/workspace/progress components through their own data adapter. Gallery, inline recall, 3D identification, spaced repetition and editorial authoring remain outside this implementation.
