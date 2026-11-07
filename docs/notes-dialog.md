# Notes dialog handoff — November 6, 2026

Notes now opens in a wide dialog over the current Learn or Explore page, using the Section guide's existing dialog surface and backdrop. It is included in the local delivery described in the [cumulative handoff](integration/LEARN_NAV_NOTES_HANDOFF_2026_11_06.md); no push or deployment was performed. Further verification stopped at the user's request.

## Behavior

- Header **Notes** and RMB **My Notes** open the same shared dialog. Opening and closing it preserve the background page, reading position, active tab, title and URL. The visible annotation helper line and duplicate Your Notes link were subsequently removed at the user's request; keyboard instructions remain available to screen readers.
- The rectangular workspace is up to 1180px wide, with a fixed heading, Appearance and Close controls, and an internally scrolling body. It adapts to narrow screens and uses existing palette, theme and reduced-motion behavior.
- Existing highlights, personal notes, subject/section filters, unresolved records, backup export/import, deletion confirmations and browser storage are reused. No storage schema or saved-data migration was introduced.
- The personal-note editor remains a nested dialog. Escape closes that editor first; unsaved-draft confirmation remains in place. Closing Notes restores focus to the control that opened it.
- **Revisit highlight** closes Notes and uses the existing annotation hash. Within the current subject, it activates the correct tab, opens any required disclosure and focuses the saved passage without remounting Learn. Repeated visits to the same highlight also work. Other-subject links navigate to the existing Learn route.
- Old `/notes` URLs open Learn with the Notes dialog already visible and replace the address with `/learn`. The old standalone Notes page is no longer rendered. The hosting rewrite remains for backward compatibility.

## Implementation

- `app/notes/notes-dialog.tsx`: shared dialog, lazy workspace loading, focus restoration and reading handoff.
- `app/notes/notes-trigger.tsx` and `notes-navigation.ts`: shared open action and in-place hash navigation.
- `app/notes/page.tsx`: existing Notes workspace content, with its former page shell removed.
- `app/site-navigation.tsx`: mounts the shared dialog and replaces the Notes route link with a dialog button.
- `app/notes/annotation-reader.tsx` and `app/learn/subject-tabs.tsx`: react to in-place annotation hash changes; note content and reading source IDs are unchanged.
- Notes CSS, site-navigation CSS, the RMB command and the editor focus fallback are adapted to the dialog.
- `web/main.tsx`: legacy `/notes` compatibility without a standalone Notes route.

The earlier compact Learn subject switcher remains in place. The original simple footer was restored at the user's request and remains unchanged by this work.

## Completed verification

- 26 Learn regression/accessibility tests passed.
- 28 Notes, palette and context-menu integration tests passed, including the new mounted-reading/focus/scroll checks, nested draft protection and repeated highlight revisits.
- TypeScript and the production build passed. The build retains the existing large-chunk warning.
- Isolated Chromium checks passed for desktop/mobile dark-mode layout, opening without changing the mounted reading/title/route, nested editor Escape handling, focus restoration, in-place highlight revisits and legacy `/notes` links.
- Browser screenshots and the accepted report are in ignored `work/notes-dialog/browser/`; test logs are under `work/subject-navigation/notes-tests.tap` and `work/notes-dialog/`.

The first browser attempt timed out while the local page was loading; the subsequent diagnostic run completed with no recorded runtime exceptions. This is focused verification, not a full repository/GPU/device certification. No further checks were run after the user's instruction to document and move on.

After these checks, the visible annotation helper line was removed and its editor-focus fallback was updated, the back-to-top button's dark shadow was softened, and the selection toolbar was compacted. These final refinements and the corresponding header-entry-point test edit were not retested or rebuilt; see the cumulative handoff's verification boundary.
