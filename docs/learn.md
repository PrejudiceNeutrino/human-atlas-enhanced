# Learn

Learn is a reading section within the existing Vite/React atlas. The shared main navigation links Explore (`/male`) and Learn (`/learn`). Learn's subject navigation and landing-page cards come from `app/learn/subjects.ts`; the first subject is Digestive (`/learn/digestive`), titled **Digestive System**. Existing model routes, navigation state and anatomy inputs are retained.

In the explorer, Explore and Learn form a compact group in the upper-right toolbar. A vertical divider separates page navigation from the utility controls. Narrow screens place the toolbar below the wordmark, with a second row at the smallest widths. The left rail remains dedicated to model, region, teaching area and visibility controls; the Visibility panel extends to 72px above the viewport bottom with 8px of top padding on desktop.

## Content and components

`data/learn/digestive-system-why-is-this-cool.json` is a byte-for-byte copy of the supplied JSON. SHA-256: `03404d3524c3adefb2f6595e410076f9f439eb39f61ea895d7597bae511fd578`. Its path-specific `.gitattributes` rule disables line-ending conversion so the byte-level integrity check also passes after a Windows checkout.

The page renders its three entries in source order. `EducationalEntry` renders each title and Markdown introduction. `ExpandableExplanation` uses the existing Base UI Collapsible wrapper with a native button, explicit panel relationships and a labeled region. Each explanation starts closed and has its own state. Closing a panel preserves the others. The supplied explanation title and full Markdown stay together inside its panel.

`EducationalMarkdown` uses [react-markdown](https://github.com/remarkjs/react-markdown) and [remark-gfm](https://github.com/remarkjs/remark-gfm). It preserves text, emphasis, paragraphs, line breaks, arrows and the pH table. The presentation plugin marks existing step and arrow paragraphs without changing their text. Table headers use column scope. Markdown headings are offset within explanations to follow the page's heading hierarchy.

`learn.css` uses the existing theme, typography and motion tokens. Reading pages scroll within the application viewport, use fluid widths and a narrow-screen layout, and disable animation and transitions for reduced motion. Shared theme controls use `human-atlas-theme`. No anatomy model data is fetched by the Learn page.

To add a subject, add its content JSON and one registry entry in `subjects.ts`. To add a section, append another structured section to that subject's `sections`. The page, subject links and subject cards use the same registry; the route dispatcher and `/learn/:subject` deployment rewrite need no per-subject changes. Unknown subjects show a Page not found heading and links to available subjects.

## Validation — 2026-11-04

- The supplied and repository JSON hashes match.
- `npm run test:learn`: 6/6 passed. Covers the content hash and order, navigation/subject pages, complete rendered text compared with standard Markdown rendering, emphasis, table cells, transport steps/arrows, collapsed defaults, independent open/close behavior, focus retention, unique IDs, accessible relationships, DOM accessibility with panels open/closed, and shared theme persistence.
- `npm run test:shell-cleanup`: 6/6 passed for the existing viewer state contracts.
- `npm run check`: passed. `npm run build`: passed (16.43 seconds); Vite reported a chunk-size warning for the large viewer bundle.
- The user's original dev server initially cached a failed dependency resolution. Restarting Vite restored HTTP 200 for the Learn module and its dependencies; the user confirmed the page loads after refresh.
- Browser-control inventory was empty. Desktop/mobile visual layout, real keyboard/touch interaction, visual contrast and animation smoothness are **not browser-certified**. Responsive and reduced-motion rules were source-reviewed. The DOM accessibility audit disables color contrast because jsdom has no layout engine.

The DOM tests bundle local page modules with esbuild and keep React/UI dependencies external. They write only ignored `work/learn-tests` artifacts and do not start Vite or share its cache with an active dev server.

## Changed files

Added: `app/site-navigation.tsx`, `app/site-navigation.css`, `app/learn/page.tsx`, `app/learn/subjects.ts`, `app/learn/educational-entry.tsx`, `app/learn/educational-markdown.tsx`, `app/learn/learn.css`, `data/learn/digestive-system-why-is-this-cool.json`, `scripts/learn.test.mjs`, and this document.

Updated: `app/page.tsx`, `app/globals.css`, `web/main.tsx`, `vercel.json`, `package.json`, `package-lock.json`, and `README.md`. Runtime dependencies added: `react-markdown` and `remark-gfm`. Test dependencies added: `jsdom`, `axe-core`, and a direct declaration of the already-installed esbuild version. Existing locked package versions were retained. Included in the [local main handoff](integration/LEARN_AND_VIEWER_HANDOFF_2026_11_04.md); no push or deployment is part of this delivery.
