# Learn

Study Tools replaces the disabled Quizzes placeholder with authored multiple-choice, fill-in-the-blank, glossary and flashcard activities. See [Study Tools](study-tools.md) for the exact imported counts/hashes, local progress, source navigation, file inventory and verification limits. Gallery now provides the local-only curated image collection; see [Gallery](gallery.md) for setup, inspection controls and production exclusion.

The [Notes and Learn cumulative handoff](integration/NOTES_LEARN_HANDOFF_2026_11_04.md) covers every change since `863a708`, including personal Notes/Highlights, grouped selections, the current guide/labels/navigation, complete file inventory, validation limits and local delivery state.

The General Overview's final paragraph links **Deep Dive** and **Exam Cram** to their existing tabs. These two Markdown link wrappers are the only changes to that supplied JSON; all wording and emphasis are preserved. Normal activation switches tabs, updates the bookmark and focuses the destination title without reloading. Modified clicks retain native link behavior. The source integrity test removes only these exact wrappers before comparing the original ZIP hash.

Previous/next arrow controls sit below each reading's section index, with a subtle divider and no shuffle control. They follow the available tab order, start at General Overview and lead through Exam Cram to Gallery and Study Tools, skipping any Coming Soon tabs. The mobile index includes the same controls when expanded. Switching updates the tab bookmark, starts at the top and focuses the destination title for keyboard and assistive-technology users.

Native text selection uses the shared atlas teal palette: soft sea-glass teal with dark text in light mode, deeper teal with pale text in dark mode. Global `::selection` styling preserves native selection and annotation behavior; forced-color mode uses the system Highlight colors.

How It Connects and Who Cares? have short reading introductions stored as optional `readingIntro` tab metadata. They use the shared article header typography and spacing; How It Connects retains its original italic opening line above its introduction. Canonical educational JSON, fact passages and More Info explanations remain unchanged.

Learn is a reading section within the existing Vite/React atlas. The shared main navigation links Explore (`/male`) and opens a Learn subject chooser over the current page. Selecting Digestive opens `/learn/digestive`, titled **Digestive System**. `/learn` remains available as a direct landing route; clicking the toolbar's Learn control no longer navigates there. The chooser, subject subnavigation and landing-page cards use `app/learn/subjects.ts`. Existing model routes, navigation state and anatomy inputs are retained.

The [2026-11-04 cumulative Digestive handoff](integration/DIGESTIVE_LEARN_HANDOFF_2026_11_04.md) records all changes since the preceding commit, including final labels/menu layout, the female panel refinement, complete file inventory and local delivery checks.

## Personal Notes and Highlights

The shared header now includes **Notes**, opening `/notes`. Learn headings, passages and whole sections can be highlighted and given optional personal notes, saved in a Human Atlas-specific IndexedDB database. Selections can span headings, paragraphs, lists, table cells and adjacent sections within one reading. They create one highlight and note with internal anchors for each text block. Linked text keeps working as a link; navigation menus and controls are excluded. Click a highlight or use Enter/Space to edit it. With a text selection active, Alt+H highlights and Alt+N adds a note. Tools dismiss when the selection is cleared or the user presses elsewhere; the redundant selected-text status toast is removed.

Notes provides subject/section filters, note-only/unresolved views, edit/delete, source revisiting, local backup import/export and confirmed clear-all. Revisit opens the proper tab and More Info panel before focusing the mark. Canonical content remains unchanged. Conservative source-scoped anchoring retains unresolved records after revisions. Learn/Notes routes do not mount Analytics. Storage is local to this browser, device and site address; it does not synchronize automatically. Details, schema, limits, Toye architectural reference and verification are in [annotations](annotations.md).

In the explorer, Explore and Learn form a compact group in the upper-right toolbar. A vertical divider separates page navigation from the utility controls. Narrow screens place the toolbar below the wordmark, with a second row at the smallest widths. The left rail remains dedicated to model, region, teaching area and visibility controls; the Visibility panel extends to 72px above the viewport bottom with 8px of top padding on desktop.

## Glass subject chooser

`app/learn/subject-menu.tsx` uses the existing Base UI dialog wrappers. Its open/closed state is local to the dialog, so opening and dismissing it does not navigate, remount the explorer, change its camera or alter anatomy state. Only choosing a subject follows a link to that subject's page. Both explorer and reading-page Learn controls use the chooser.

The panel has a frosted theme-aware surface, a softly blurred full-screen backdrop, restrained shadows, a clear subject row and a small Escape hint. Its desktop shape is a wider rectangle, capped at 760px. Beneath each subject title, a compact wrapping list previews every tab in registry order, including the enabled Study Tools activity. The count still reports only available content tabs. Narrow screens retain fluid width and bounded vertical scrolling. The earlier thin outline around the toolbar navigation group is removed; that group uses a soft translucent fill while retaining the active indicator and utility divider.

The dialog has an accessible title/description and explicit modal semantics, initially focuses the first subject, and returns focus to Learn on close. Escape and the close button dismiss it. Default Base UI outside-press dismissal is retained. A `data-atlas-shortcuts="disabled"` scope prevents the viewer's keyboard shortcuts from changing the scene behind the focused chooser. The popup and backdrop use the site's motion tokens and disable transitions under reduced motion; small screens use fluid width and bounded vertical scrolling.

`DialogContent` now accepts an optional `overlayClassName`, forwarded to its existing backdrop. Other dialogs keep their default appearance. No new dependencies, 3D objects, scene passes or model downloads were added for the chooser. Background blur has ordinary browser compositing cost; no GPU-performance claim is made.

## Content and components

The Digestive System page now has seven ordered tabs: **General Overview**, **Deep Dive**, **How It Connects**, **Who Cares?**, **Exam Cram**, **Gallery** (local collection), and **Study Tools** (enabled). General Overview is selected initially. Overview, Deep Dive and Exam Cram render the supplied JSON sources (with only the two navigation-link wrappers described above added to Overview) from `digestive-system-content-revised.zip`: 8, 15 and 15 sections respectively, including each file's complete `introMarkdown` and all `sections[].markdown`. How It Connects renders all ten supplied sections of **The Journey of Digestion**, preserving its title and italic introduction. `subtitle`, `sourceFiles` and `slideReferences` remain metadata rather than extra article paragraphs. No Markdown mirror is imported, so the content is not duplicated.

`SubjectTabs` uses the existing Base UI Tabs wrapper. Arrow keys/Home/End move tab focus; Enter/Space activate the focused native button. Study Tools is enabled and lazy-loads its dataset/activity chunk when opened. Facts stay mounted while hidden to retain independent accordion state; inactive long articles unmount. Switching from a scrolled article returns to the tab bar without animated scrolling. Section bookmarks reopen the matching existing tab on the same subject route.

An info button at the far right of the tab bar opens **Section guide** in a centered glass dialog, reusing the Learn chooser's blurred backdrop, surface, close button and motion preferences. General descriptions supplied by the user live alongside tab metadata in `subjects.ts`; the current **Who Cares?** display label is retained. Seven available approaches use spacious cards in two columns, collapsing to one on mobile. Gallery is an enabled tab with local-study availability; there are no remaining Coming Soon previews. Study Tools remains enabled. Educational source JSON and reading introductions are unchanged. Base UI Dialog handles modal focus, Escape, dismissal and focus return. Opening it preserves the current tab, article DOM and reading position. The button is outside the tablist and stays visible while narrow-screen tabs scroll; the dialog bounds its internal scrolling to the viewport. `section-guide.tsx` and `learn.css` provide the layout, and `subject-menu.css` provides the shared glass styling.

`EducationalArticle` renders structured article sections, stable focusable heading anchors, safe shared Markdown, appropriately nested headings and focusable horizontal table regions. Overview uses open reading spacing; Exam Cram uses separated study cards with spaced bullets. The existing facts renderer is retained inside `EducationalFacts`.

All five available content tabs use the shared `ReadingLayout` and section index. On desktop it is a sticky 180px column with 11px links and reduced padding; at 850px and below it becomes a native details index, collapsed initially, with touch-sized links. Current-section highlighting uses `aria-current="location"`, a colored leading rule and a themed background. It tracks the actual `.learn-shell` reading viewport, scrolling both down and up, viewport changes and accordion reflow. At the document bottom it selects the final section. The sidebar scrolls internally to keep the highlighted link visible without moving the article. A passive scroll listener coalesces position reads into a single animation frame; inactive facts stop observing, and all listeners/observers are cleaned up. There is no continuous animation loop.

The metadata-only `subjects.ts` registry is shared with the explorer's chooser. Full JSON content is imported by `content.ts` only in the lazy reading-page module, avoiding the new long articles in the 3D explorer bundle. No routes, dependencies, viewer interactions, geometry or scientific datasets changed.

Full import hashes, changed-file inventory and current verification: [revised Digestive content](digestive-content-revised.md).

The subsequent [How It Connects addition](how-it-connects.md) records the pasted narrative's integrity check, tab placement and updated verification.

`data/learn/digestive-system-why-is-this-cool.json` is a byte-for-byte copy of the supplied JSON. SHA-256: `03404d3524c3adefb2f6595e410076f9f439eb39f61ea895d7597bae511fd578`. Its path-specific `.gitattributes` rule disables line-ending conversion so the byte-level integrity check also passes after a Windows checkout.

The tab, chooser preview, visible heading and index label use the user-requested **Who Cares?** display title from the registry. `EducationalFacts` accepts this title separately, preserving the original JSON title, body text and source IDs.

The page renders its three entries in source order. `EducationalEntry` renders each title and Markdown introduction. `ExpandableExplanation` uses the existing Base UI Collapsible wrapper with a native button, explicit panel relationships and a labeled region. Each explanation starts closed and has its own state. Closing a panel preserves the others. The supplied explanation title and full Markdown stay together inside its panel.

`EducationalMarkdown` uses [react-markdown](https://github.com/remarkjs/react-markdown) and [remark-gfm](https://github.com/remarkjs/remark-gfm). It preserves text, emphasis, paragraphs, line breaks, arrows and the pH table. The presentation plugin marks existing step and arrow paragraphs without changing their text. Table headers use column scope. Markdown headings are offset within explanations to follow the page's heading hierarchy.

`learn.css` uses the existing theme, typography and motion tokens. Reading pages scroll within the application viewport, use fluid widths and a narrow-screen layout, and disable animation and transitions for reduced motion. Shared theme controls use `human-atlas-theme`. No anatomy model data is fetched by the Learn page.

To add a subject, add its content JSON to the reading-only maps in `content.ts` and a registry entry with its tabs in `subjects.ts`. Article-tab IDs match their JSON IDs; fact tabs use the existing entry/More Info schema. To extend an article, append to its JSON `sections`; its index is generated automatically. Study Tools uses the enabled `study-tools` kind with a lazy data adapter; its generic activities accept a subject bank and separate subject-scoped progress. Gallery uses a lazy reusable renderer and separate local manifest/assets, protected by development-only configuration; see `gallery.md`. The page, subject links and chooser use the same registry; the route dispatcher and `/learn/:subject` deployment rewrite need no per-subject changes. Unknown subjects show a Page not found heading and links to available subjects.

## Earlier validation — before revised content

- The supplied and repository JSON hashes match.
- `npm run test:learn`: 8/8 passed. Covers the content hash and order, navigation/subject pages, complete rendered text compared with standard Markdown rendering, emphasis, table cells, transport steps/arrows, collapsed defaults, independent open/close behavior, focus retention, unique IDs, accessible relationships, DOM accessibility with panels open/closed, and shared theme persistence. Chooser checks additionally cover no navigation, preserved explorer DOM, correct subject links, modal naming/description, initial focus, close-button/Escape dismissal, focus restoration and DOM accessibility while open.
- `npm run test:final-ui`: 3/3 passed, including suppression of every viewer shortcut within the chooser scope.
- `npm run test:shell-cleanup`: 6/6 passed for the existing viewer state contracts.
- `npm run check`: passed. `npm run build`: passed for the final combined refinement (15.89 seconds); Vite reported large-chunk and plugin-timing warnings.
- The user's original dev server initially cached a failed dependency resolution. Restarting Vite restored HTTP 200 for the Learn module and its dependencies; the user confirmed the page loads after refresh.
- Browser-control inventory was empty, including a fresh check for this refinement. Desktop/mobile visual layout, real keyboard/touch interaction, visual contrast and animation smoothness are **not browser-certified**. Responsive and reduced-motion rules were source-reviewed. The DOM accessibility audit disables color contrast because jsdom has no layout engine. An attempted synthetic-pointer backdrop-press test did not complete in jsdom and was interrupted rather than counted as passing; that pointer fixture was removed. Real outside-press dismissal remains a browser verification gap; its default Base UI implementation is unchanged.

The DOM tests bundle local page modules with esbuild and keep React/UI dependencies external. They write only ignored `work/learn-tests` artifacts and do not start Vite or share its cache with an active dev server.

## Changed files

For the current revised-content and shared-index refinement, see the complete inventory in [revised Digestive content](digestive-content-revised.md). The inventory below records the earlier deliveries.

Added: `app/site-navigation.tsx`, `app/site-navigation.css`, `app/learn/page.tsx`, `app/learn/subjects.ts`, `app/learn/educational-entry.tsx`, `app/learn/educational-markdown.tsx`, `app/learn/learn.css`, `data/learn/digestive-system-why-is-this-cool.json`, `scripts/learn.test.mjs`, and this document.

The subsequent chooser refinement adds `app/learn/subject-menu.tsx` and `app/learn/subject-menu.css`; updates the shared navigation, `components/ui/dialog.tsx`, `app/viewer-shortcuts.ts`, `scripts/learn.test.mjs` and `scripts/final-ui.test.mjs`. The [chooser and explosion handoff](integration/LEARN_MENU_AND_EXPLOSION_HANDOFF_2026_11_04.md) records this local main delivery. The prior handoff records the earlier committed implementation, before this refinement.

Updated: `app/page.tsx`, `app/globals.css`, `web/main.tsx`, `vercel.json`, `package.json`, `package-lock.json`, and `README.md`. Runtime dependencies added: `react-markdown` and `remark-gfm`. Test dependencies added: `jsdom`, `axe-core`, and a direct declaration of the already-installed esbuild version. Existing locked package versions were retained. Included in the [local main handoff](integration/LEARN_AND_VIEWER_HANDOFF_2026_11_04.md); no push or deployment is part of this delivery.
