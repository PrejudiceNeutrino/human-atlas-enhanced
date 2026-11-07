# Learn context menu and return to top

Learn uses the Engineering Club context-menu architecture with Human Atlas navigation and appearance state. The source checkout was `PrejudiceNeutrino/engineering-club` at `2f50060351506c3f36654958f59890941bc49b0f`. The adapted files are `menu-panel.tsx`, `context-target.ts`, `page-sections.tsx`, the lifecycle/portal pattern from `site-context-menu.tsx`, and `context-menu.css`. Source files were read without changes.

## Commands

- **Digestive Model** is first and activates the existing **Visualize** tab inside Learn. Its real link is `/learn/digestive#digestive-system-visualize`; ordinary activation stays in the mounted page. It uses the existing embedded anatomy viewer and its model controls.
- **Navigate** lists available tabs from `LearnSubject.tabs` in registered order, including the current `Who Cares?` title and Visualize. Unavailable placeholders are omitted and the current tab is indicated.
- **On This Page** lists the active reading layout's real section headings. It updates the existing section hash, scrolls `.learn-shell` below the sticky tab strip, and focuses the heading. It is omitted where no section index is registered.
- **My Notes** opens the shared Notes dialog over the current page; see [Notes dialog handoff](notes-dialog.md).
- **Back to top** shares its controller and animation with the floating button.
- **Appearance** uses the existing theme and palette stores. It contains Light / Dark and Classic, Ignition, Ultraviolet, and Iris & Ember.
- **Reload page** reloads the current document.
- **Previous / next** arrows sit below the commands and above the native-menu hint. They also remain in the desktop and mobile reading indexes. All three locations use `ReadingPageContext`; first/last destinations are disabled.

`SubjectTabs.activateTab` is shared by ordinary tabs, reading arrows, menu navigation, and the model shortcut. There is one active tab state. Context-menu navigation preserves the established tab/section hashes and focuses the destination. No Explore URL initializer or independent renderer was added.

## Integration and future subjects

The menu mounts once per Learn page, outside the individual tab panels. A Learn landing page gets the same shared menu without a subject shortcut or reading arrows.

`LearnSubject.modelShortcut` declares a label and an actual Visualize tab ID. For a future supported subject, register its existing Visualize tab and this metadata. The shortcut is shown only when the referenced tab exists and has kind `visualize`; no display-name or anatomical ID guessing is involved.

The adapted page-sections registry reads `ReadingLayout`'s existing section links. Kept-mounted inactive facts unregister their sections. Gallery and Study Tools do not receive invented headings.

## Native behavior and accessibility

The menu leaves selected text, links/downloads, images, media, form fields, contenteditable, existing highlights, note editors, buttons, flashcards, dialogs, and embedded anatomy native. It respects `defaultPrevented`, `[data-context-menu="native"]`, Shift + right-click, and touch long-press. The menu is never mounted in Explore.

The port retains delayed hover submenus, portals, viewport clamping, focus restoration, outside-click/scroll/resize dismissal, checked/current indicators, and cleanup. Arrow keys, Home/End, Enter/Space and Escape are supported; ContextMenu / Shift+F10 works on eligible focused Learn content. Footer arrows participate in menu keyboard navigation, with disabled endpoints skipped.

Menu styling uses Human Atlas tokens. Dark mode uses a soft black shadow to avoid a pale glow. Menu and return-to-top animation respect reduced motion.

## Floating return-to-top button

`LearnBackToTop` appears after scrolling down and displays a reading-progress ring. Both it and the RMB command dispatch `LEARN_BACK_TO_TOP_EVENT` through `backToLearnTop`.

The controller focuses Learn content, eases the internal scroller to the top, and plays a pressed/lifted button, arrow launch/return, orbiting ring and expanding pulse. The button fades to zero opacity during the final portion of the animation before unmounting. Wheel, touch, pointer input and scrolling keys cancel the glide. Reduced motion returns immediately, and all frames, timers, observers and listeners are cleaned up on unmount.

## Files

New implementation files:

- `app/learn/context-menu/{menu-panel.tsx,context-target.ts,page-sections.tsx,learn-context-menu.tsx,context-menu.css}`
- `app/learn/back-to-top.tsx`
- `app/learn/scroll-navigation.ts`

Integration files: `app/learn/{page.tsx,subject-tabs.tsx,subjects.ts,section-index.tsx,learn.css}`. Test commands are registered in `package.json`. Educational content, anatomical datasets, Gallery images and personal-storage schemas are unchanged.

## Verification

Final results on November 6, 2026: 116 existing regression tests passed, all 8 new context-menu/button integration tests passed, Chromium acceptance passed, TypeScript passed, and the production build passed with the existing large-chunk warning. The final dark-mode shadow-only adjustment was made after those browser screenshots and the build; those checks were not repeated for that CSS adjustment.

- `npm run test:learn-context-menu`: real Learn controls in JSDOM, including menu navigation, heading focus, native exclusions, appearance state, Visualize destination, shared arrows, floating-button progress, animation completion and cancellation.
- `npm run test:learn-context-menu:browser`: headless Chromium against `ATLAS_URL` (default `http://127.0.0.1:3096`), actual section scrolling, both arrow locations, desktop/narrow positioning, all palettes and dark mode, launch/landing and opacity-fade keyframes, reduced motion, and the in-place Visualize destination.
- Existing Learn, Gallery, Study Tools, Notes, palette, anatomy-companion and Explore interaction regression suites.
- TypeScript and production build.

Browser screenshots and JSON report are written to ignored `work/learn-context-menu/browser/`. The browser smoke verifies Learn navigation and controls; it does not certify every GPU, anatomical representation, assistive technology or physical touch device. There is no custom touch-long-press menu.

## Delivery

Changes are committed locally on `feature/gallery-label-practice`, based on local `main` at `5c000f6` (`fixed button styling`). No merge, fetch, push or deployment is part of this delivery. The branch name was created at the user's earlier request; this commit contains the Learn context-menu and return-to-top work, with no Gallery label-practice implementation.

The delivery adds one commit above local `main`; cached `origin/main` is one additional commit behind local `main`. These comparisons use local references without refreshing the remote.
