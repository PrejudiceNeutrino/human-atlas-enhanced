# Revised Digestive System content and section indexes

Implemented 2026-11-04 against local main `9a2c2cd703d1b278a08180ba5b0ef28fc2f9a62a`. This record describes the initial revised-content implementation before How It Connects and the later label/menu refinements. The subsequently requested local main commit includes all refinements in the [cumulative handoff](integration/DIGESTIVE_LEARN_HANDOFF_2026_11_04.md), which records the final six-tab order, full file inventory and delivery verification. No push or deployment is included.

## Sources and preservation

Source archive: user-supplied `digestive-system-content-revised.zip` under `AP2 Zimmerman Content`. Only its three named JSON entries were imported, byte for byte, into `data/learn/`. The Markdown mirrors and implementation README were inspected as supporting material, not imported as duplicate articles or treated as overriding user instructions. The user's five-tab requirement takes precedence over the README's four-tab import suggestion; Quizzes is present as a disabled Coming Soon control.

| JSON source | Sections | SHA-256 |
|---|---:|---|
| `digestive-system-general-overview.json` | 8 | `9bbdc7f72bee03f2dbdad6382fa7a07be9acb2052dd058af42df8672db6107fd` |
| `digestive-system-deep-dive.json` | 15 | `5b441393a464d77f312ba6ca499c2b3a3102e98990d301142927496fb293ac1a` |
| `digestive-system-exam-cram.json` | 15 | `92f7389c434386137e0a853a8bbbb673a78b8bf76b6a1db7455c5bbe0c8a7370` |
| Existing `digestive-system-why-is-this-cool.json` | 3 facts | `03404d3524c3adefb2f6595e410076f9f439eb39f61ea895d7597bae511fd578` |

Path-specific `.gitattributes` entries disable newline conversion for all four educational JSON files. No source string is rewritten, concatenated into new prose, summarized or discarded. All introductions, section headings, body Markdown, terminology, emphasis, lists, tables, identification checklists and rapid recall render in source order. Supporting `subtitle`, `sourceFiles` and `slideReferences` remain metadata. The introductory prose itself can mention lecture files, and those supplied words remain visible.

## Resulting experience

- Existing Learn chooser and Digestive navigation continue to open `/learn/digestive`, titled Digestive System. The registry defines exactly five ordered tabs: General Overview, Deep Dive, Exam Cram, Why Is This Cool?, Quizzes. Overview is the initial selection; a recognized section hash opens its matching tab.
- The existing Base UI Tabs supply relationships and roving focus. Activation is manual to avoid rendering a long article just by arrowing past its tab. Quizzes is focusable for discovery but cannot activate or navigate and visibly says Coming Soon. No quiz route or functionality exists.
- General Overview uses open reading spacing. Deep Dive renders its complete reference. Exam Cram uses distinct study cards and readable lists. Tables retain semantic column headers and scroll locally within a labeled, focusable region when needed. Raw HTML is not executed and the existing Markdown renderer's URL sanitization remains enabled.
- All four content tabs, including the original facts, have the same reusable section index. Desktop links use 11px type, compact padding and a 180px sticky column. Mobile uses a collapsed native details control with larger touch targets. Highlighting follows the current section during downward/upward scrolling and reflow, is exposed with `aria-current="location"`, and uses theme tokens for its rule/background. Active sidebar links remain visible through internal sidebar scrolling.
- The scroll tracker reads the actual scrolling `.learn-shell`, accounts for the sticky tab bar, observes layout resizing, and selects the final topic at the reading bottom. It schedules at most one animation-frame update per scroll/resize burst; it has no continuously running loop. Hidden facts disable tracking, and article unmount removes its listeners and observer.
- Why Is This Cool? retains its three original entries, exact introductions/explanations, pH table, comparisons, fat-transport flow, source IDs and independent initially collapsed More Info controls. Leaving and returning to its tab preserves open panels. The added heading focus targets and shared index do not alter educational wording.
- Full content lives in a reading-only module. The common subject registry contains only tab metadata, so the 3D explorer's chooser does not import the long JSON articles. It now previews General Overview and reports four available sections. Future systems can reuse the same components by adding content/map/registry entries, without adding subject-specific page components. No future subject is implemented.

## Validation and issues

Final checks cover the exact content-to-component-to-DOM path rather than comparing only a few sample sentences.

- `npm run test:learn`: **20/20 passed**. Covers exact hashes for all four JSON sources, source order, all 38 revised sections' full rendered text and structural Markdown counts/cells, all tab interactions and relationships, placeholder nonactivation, stable section links, section-bookmark tab selection, focused headings, tab-top return, mobile index toggling, indexes on all four tabs, downward/upward/end/resize highlighting with synthetic layout positions, observer cleanup, independent retained facts accordions, safe Markdown, DOM accessibility and shared theme/chooser behavior.
- Keyboard tests execute Base UI's real arrow/Home/End handlers; jsdom does not implement native Enter/Space default button activation, so the fixture explicitly supplies the corresponding click after those events. Native browser behavior is not claimed from that fixture. Base UI intentionally permits focus on its disabled Coming Soon tab while rejecting activation.
- Initial TypeScript inference exposed optional slide-reference keys in heterogeneous JSON sections. The metadata type now permits absent reference values without casting or modifying the source data. Test fixtures were corrected to model native button defaults, discoverable disabled-tab focus and Base UI's own ResizeObservers separately from reading trackers. These intermediate failures are not retained as passing evidence.
- `npm run check`: **passed** after the final component refinements. `npm run build`: **passed in 16.59s**, with existing large-chunk and plugin-timing warnings. Viewer shortcut checks (`node --experimental-strip-types --test scripts/final-ui.test.mjs`): **3/3 passed**. `git diff --check`: **passed**. The final successful runs supersede the corrected intermediate fixture/type failures.
- Browser-control inventory returned no apps or browsers. Real desktop/mobile layout, visual contrast, native keyboard/touch, outside-press dismissal and scroll smoothness are not browser-certified. DOM accessibility excludes color contrast, and scroll highlighting uses synthetic geometry in the fixture. Responsive/theme/reduced-motion CSS was source-reviewed. Supplied user screenshots informed the refinement but are not an automated visual certification of the final layout.

No scientific fact-checking or rewriting was performed; the supplied educational material is the requested content authority. No unrelated repository-wide/GPU suite was run.

## Complete changed-file inventory

Added (8):

- `data/learn/digestive-system-general-overview.json`
- `data/learn/digestive-system-deep-dive.json`
- `data/learn/digestive-system-exam-cram.json`
- `app/learn/content.ts`
- `app/learn/educational-article.tsx`
- `app/learn/section-index.tsx`
- `app/learn/subject-tabs.tsx`
- `docs/digestive-content-revised.md`

Modified (10):

- `app/learn/page.tsx`: use reusable subject tabs on the existing route.
- `app/learn/subjects.ts`: article schema and metadata-only tab registry.
- `app/learn/educational-entry.tsx`: facts layout/index and focusable existing headings.
- `app/learn/educational-markdown.tsx`: optional labeled, focusable table wrapper for articles; original facts formatting retained.
- `app/learn/subject-menu.tsx`: preview/count match available tabs.
- `app/learn/learn.css`: tabs, reading layouts, compact sticky index, active links, study cards and mobile behavior.
- `scripts/learn.test.mjs`: expanded content, interaction and index regression checks.
- `.gitattributes`: preserve raw new JSON bytes across Windows checkouts.
- `docs/learn.md`: current behavior and extension guide.
- `README.md`: current Learn feature description.

No dependencies, package-lock, route dispatcher, deployment rewrites, viewer renderer or geometry files changed. Test bundles and build output remain ignored under `work/learn-tests` and `dist/`.
