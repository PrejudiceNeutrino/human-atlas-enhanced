# Learn navigation and Notes delivery — November 6, 2026

This handoff covers all changes after `17ee8f04adef1cd759047847dc4edde49261b3fd` (`feat: add Learn context menu and animated return to top`). The accompanying commit is local on `feature/gallery-label-practice`. No merge, fetch, push or deployment is included.

## Delivered behavior

### Subject navigation

The loose Subjects / Digestive strip is replaced by a compact **Learn › Digestive** breadcrumb and subject switcher above the title. It reuses the existing Learn chooser, marks the current subject, focuses that subject when opened, and continues to derive destinations from the subject registry. Future subjects do not require a growing horizontal row. The existing tab order is preserved.

### Notes dialog

Header **Notes** and RMB **My Notes** now open a shared rectangular dialog over the mounted page. The Section guide's existing surface/backdrop is reused, with a width up to 1180px, fixed title/Appearance/Close controls and an internally scrolling body. The workspace loads lazily.

The former Notes page exports its existing workspace content rather than a separate page shell. The shared site navigation mounts the dialog, so Learn and Explore use the same implementation. Opening and closing Notes preserve the current page, title, URL and reading state; closing restores opener focus.

The existing annotation store, filters, note editor, confirmation prompts and backup import/export remain in use. No storage schema migration, backend, note upload or anatomy-data change was introduced. The editor is nested within Notes and retains unsaved-draft protection and its own Escape/focus behavior.

**Revisit highlight** closes the dialog and follows the existing annotation fragment. A shared hash observer lets the mounted subject tabs and annotation reader open the correct tab/disclosure and focus the passage without remounting the current subject. Repeated visits to the same highlight work. Other-subject links still use their existing Learn route.

Old `/notes` URLs open the dialog over Learn and replace the browser address with `/learn`; the hosting rewrite is retained for old links. There is no longer a separate Notes page in the app route switch. See [Notes dialog details](../notes-dialog.md).

### Final visual refinements

- Removed the visible annotation helper line and its duplicate Your Notes link. Keyboard instructions remain available to screen readers; the header and RMB entry points remain.
- Replaced the back-to-top button's pale dark-mode halo with soft black shadows for idle, hover and lift animation. The launch, pulse, orbit and ending opacity fade remain.
- Tightened the selected-text Highlight / Add Note toolbar: 3px outer padding, 32px desktop buttons and a compact dismiss control. Coarse-pointer controls retain 44px target heights.
- The experimental expanded footer was reverted at the user's request. The original simple Explore-the-atlas footer remains.

Educational wording, source IDs, public images, anatomical datasets and personal-storage formats were preserved.

## Changed implementation areas

| Area | Files |
| --- | --- |
| Subject navigation | `app/learn/page.tsx`, `subject-menu.tsx`, `learn.css` |
| Shared Notes entry points | `app/site-navigation.tsx`, `site-navigation.css`, `app/learn/context-menu/learn-context-menu.tsx` |
| Notes overlay and routing | `app/notes/notes-dialog.tsx`, `notes-trigger.tsx`, `notes-navigation.ts`, `page.tsx`, `notes.css`, `web/main.tsx` |
| Reading/editor integration | `app/learn/subject-tabs.tsx`, `app/notes/annotation-reader.tsx`, `note-editor.tsx` |
| Regression coverage | `scripts/learn.test.mjs`, `annotations-ui.test.mjs`, `palette-ui.test.mjs`, `learn-context-menu.test.mjs` |
| Documentation | This cumulative handoff, `docs/notes-dialog.md`, `docs/learn-context-menu.md` |

## Verification boundary

Completed before the final small refinements:

- **26 Learn tests passed**, including navigation and DOM accessibility.
- **28 Notes, appearance and context-menu integration tests passed**, including background/focus/scroll preservation, nested draft protection and repeated in-place highlight revisits.
- **TypeScript passed.**
- **Production build passed**, retaining the existing large-chunk warning.
- **Chromium acceptance passed** for desktop/mobile Notes layout, nested editor Escape handling, focus restoration, mounted-reading/title/route preservation, highlight revisits and legacy `/notes` links. The accepted report recorded no runtime exceptions.
- Earlier desktop/mobile dark-mode subject-switcher checks passed, including no horizontal overflow and chooser focus restoration.

The user then requested that verification stop. The subsequent dark-mode back-to-top shadow change, helper-line removal/editor fallback update, and compact selection-toolbar CSS **were not retested or rebuilt**. They received diff/whitespace checks only. The annotation UI test was adjusted to the remaining header entry point after helper removal, but that final test edit was not rerun. No full-repository suite, exhaustive GPU/device check or production verification is claimed.

Accepted local evidence is ignored by Git:

- `work/subject-navigation/notes-tests.tap` — 28 passing tests.
- `work/notes-dialog/learn-tests.tap` — 26 passing tests.
- `work/notes-dialog/build.log` — successful production build.
- `work/notes-dialog/browser/report.json` and screenshots — accepted Notes browser run.
- `work/subject-navigation/browser/` — subject-navigation browser evidence.

## Local delivery

The delivery adds one commit above `17ee8f0`. Relative to local references, the branch is two commits ahead of local `main` and three ahead of cached `origin/main`, with no commits behind either. Remote references were not refreshed. The branch name remains the previously requested `feature/gallery-label-practice`; this batch does not implement Gallery Label Practice.

No additional tests were started for the documentation/commit request. Local commit metadata and working-tree status are reported in the final delivery response.
