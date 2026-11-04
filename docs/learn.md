# Learn

Learn is a reading section within the existing Vite/React atlas. The shared main navigation links Explore (`/male`) and opens a Learn subject chooser over the current page. Selecting Digestive opens `/learn/digestive`, titled **Digestive System**. `/learn` remains available as a direct landing route; clicking the toolbar's Learn control no longer navigates there. The chooser, subject subnavigation and landing-page cards use `app/learn/subjects.ts`. Existing model routes, navigation state and anatomy inputs are retained.

In the explorer, Explore and Learn form a compact group in the upper-right toolbar. A vertical divider separates page navigation from the utility controls. Narrow screens place the toolbar below the wordmark, with a second row at the smallest widths. The left rail remains dedicated to model, region, teaching area and visibility controls; the Visibility panel extends to 72px above the viewport bottom with 8px of top padding on desktop.

## Glass subject chooser

`app/learn/subject-menu.tsx` uses the existing Base UI dialog wrappers. Its open/closed state is local to the dialog, so opening and dismissing it does not navigate, remount the explorer, change its camera or alter anatomy state. Only choosing a subject follows a link to that subject's page. Both explorer and reading-page Learn controls use the chooser.

The panel has a frosted theme-aware surface, a softly blurred full-screen backdrop, restrained shadows, a clear subject row and a small Escape hint. It shows the real subject title, section title and explanation count from the registry, with no invented future subjects. The earlier thin outline around the toolbar navigation group is removed; that group uses a soft translucent fill while retaining the active indicator and utility divider.

The dialog has an accessible title/description and explicit modal semantics, initially focuses the first subject, and returns focus to Learn on close. Escape and the close button dismiss it. Default Base UI outside-press dismissal is retained. A `data-atlas-shortcuts="disabled"` scope prevents the viewer's keyboard shortcuts from changing the scene behind the focused chooser. The popup and backdrop use the site's motion tokens and disable transitions under reduced motion; small screens use fluid width and bounded vertical scrolling.

`DialogContent` now accepts an optional `overlayClassName`, forwarded to its existing backdrop. Other dialogs keep their default appearance. No new dependencies, 3D objects, scene passes or model downloads were added for the chooser. Background blur has ordinary browser compositing cost; no GPU-performance claim is made.

## Content and components

`data/learn/digestive-system-why-is-this-cool.json` is a byte-for-byte copy of the supplied JSON. SHA-256: `03404d3524c3adefb2f6595e410076f9f439eb39f61ea895d7597bae511fd578`. Its path-specific `.gitattributes` rule disables line-ending conversion so the byte-level integrity check also passes after a Windows checkout.

The page renders its three entries in source order. `EducationalEntry` renders each title and Markdown introduction. `ExpandableExplanation` uses the existing Base UI Collapsible wrapper with a native button, explicit panel relationships and a labeled region. Each explanation starts closed and has its own state. Closing a panel preserves the others. The supplied explanation title and full Markdown stay together inside its panel.

`EducationalMarkdown` uses [react-markdown](https://github.com/remarkjs/react-markdown) and [remark-gfm](https://github.com/remarkjs/remark-gfm). It preserves text, emphasis, paragraphs, line breaks, arrows and the pH table. The presentation plugin marks existing step and arrow paragraphs without changing their text. Table headers use column scope. Markdown headings are offset within explanations to follow the page's heading hierarchy.

`learn.css` uses the existing theme, typography and motion tokens. Reading pages scroll within the application viewport, use fluid widths and a narrow-screen layout, and disable animation and transitions for reduced motion. Shared theme controls use `human-atlas-theme`. No anatomy model data is fetched by the Learn page.

To add a subject, add its content JSON and one registry entry in `subjects.ts`. To add a section, append another structured section to that subject's `sections`. The page, subject links and subject cards use the same registry; the route dispatcher and `/learn/:subject` deployment rewrite need no per-subject changes. Unknown subjects show a Page not found heading and links to available subjects.

## Validation — 2026-11-04

- The supplied and repository JSON hashes match.
- `npm run test:learn`: 8/8 passed. Covers the content hash and order, navigation/subject pages, complete rendered text compared with standard Markdown rendering, emphasis, table cells, transport steps/arrows, collapsed defaults, independent open/close behavior, focus retention, unique IDs, accessible relationships, DOM accessibility with panels open/closed, and shared theme persistence. Chooser checks additionally cover no navigation, preserved explorer DOM, correct subject links, modal naming/description, initial focus, close-button/Escape dismissal, focus restoration and DOM accessibility while open.
- `npm run test:final-ui`: 3/3 passed, including suppression of every viewer shortcut within the chooser scope.
- `npm run test:shell-cleanup`: 6/6 passed for the existing viewer state contracts.
- `npm run check`: passed. `npm run build`: passed for the final combined refinement (15.89 seconds); Vite reported large-chunk and plugin-timing warnings.
- The user's original dev server initially cached a failed dependency resolution. Restarting Vite restored HTTP 200 for the Learn module and its dependencies; the user confirmed the page loads after refresh.
- Browser-control inventory was empty, including a fresh check for this refinement. Desktop/mobile visual layout, real keyboard/touch interaction, visual contrast and animation smoothness are **not browser-certified**. Responsive and reduced-motion rules were source-reviewed. The DOM accessibility audit disables color contrast because jsdom has no layout engine. An attempted synthetic-pointer backdrop-press test did not complete in jsdom and was interrupted rather than counted as passing; that pointer fixture was removed. Real outside-press dismissal remains a browser verification gap; its default Base UI implementation is unchanged.

The DOM tests bundle local page modules with esbuild and keep React/UI dependencies external. They write only ignored `work/learn-tests` artifacts and do not start Vite or share its cache with an active dev server.

## Changed files

Added: `app/site-navigation.tsx`, `app/site-navigation.css`, `app/learn/page.tsx`, `app/learn/subjects.ts`, `app/learn/educational-entry.tsx`, `app/learn/educational-markdown.tsx`, `app/learn/learn.css`, `data/learn/digestive-system-why-is-this-cool.json`, `scripts/learn.test.mjs`, and this document.

The subsequent chooser refinement adds `app/learn/subject-menu.tsx` and `app/learn/subject-menu.css`; updates the shared navigation, `components/ui/dialog.tsx`, `app/viewer-shortcuts.ts`, `scripts/learn.test.mjs` and `scripts/final-ui.test.mjs`. The [chooser and explosion handoff](integration/LEARN_MENU_AND_EXPLOSION_HANDOFF_2026_11_04.md) records this local main delivery. The prior handoff records the earlier committed implementation, before this refinement.

Updated: `app/page.tsx`, `app/globals.css`, `web/main.tsx`, `vercel.json`, `package.json`, `package-lock.json`, and `README.md`. Runtime dependencies added: `react-markdown` and `remark-gfm`. Test dependencies added: `jsdom`, `axe-core`, and a direct declaration of the already-installed esbuild version. Existing locked package versions were retained. Included in the [local main handoff](integration/LEARN_AND_VIEWER_HANDOFF_2026_11_04.md); no push or deployment is part of this delivery.
