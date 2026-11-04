# How It Connects

Added 2026-11-04 on the existing `/learn/digestive` page. The user-requested final navigation order is General Overview, Deep Dive, How It Connects, Why's This Cool?, Exam Cram, Quizzes. No new route, dependency or subject-specific renderer is needed.

The tab label is **How It Connects**; its article preserves the supplied title **The Journey of Digestion**, italic introductory sentence and all ten numbered section headings, paragraphs, lists and emphasis. Existing shared article rendering supplies the compact sticky/collapsible section menu, scroll-aware highlighting, focusable heading anchors, section bookmarks, themes, responsive layout and motion preferences. The chooser automatically reports five available sections. General Overview remains selected initially; Quizzes remains Coming Soon.

## Content integrity

Source: the user-pasted `Pasted text.txt` attachment, SHA-256 `6b16588bd2e47845fc8c8557251e18da9bc2bfbc0605441e21ba8dfde5c5fa89`.

`data/learn/digestive-system-how-it-connects.json` stores the title, introductory Markdown and ten structured sections. Extraction split only the supplied heading boundaries, retaining wording and paragraph structure. No explanatory prose was invented. Reconstructing the complete Markdown from this JSON matches the supplied text after CRLF-to-LF normalization and removal of terminal newlines: SHA-256 `fd3fc71facdcd9520e277744b798452877e987f2d8e9de2435ef6a10c4b3c1bf`. The test pins this complete-document digest and separately compares every rendered section's text and Markdown structure. The new JSON has a path-specific `-text` attribute for stable Windows checkouts.

## Files in this addition

Added: `data/learn/digestive-system-how-it-connects.json`, `docs/how-it-connects.md`.

Updated: `app/learn/subjects.ts` (tab metadata), `app/learn/content.ts` (reading-only content map), `.gitattributes`, `scripts/learn.test.mjs`, `docs/learn.md`, `README.md`.

Earlier revised-content/index work and the female Chest detail placement are retained. This record describes this addition only. Existing article sources, original facts, renderer, chest controls, routes and dependencies are untouched by it. The subsequently requested local main commit is documented in the [cumulative handoff](integration/DIGESTIVE_LEARN_HANDOFF_2026_11_04.md), including final label/menu refinements. No push or deployment is included.

## Verification

`npm run test:learn`: **21/21 passed**. The expanded tests cover six-tab navigation, complete content preservation across all 48 article sections, the new article's ten indexed topics, its bookmark/reopen behavior, highlighting in all five content tabs, keyboard navigation, Coming Soon nonactivation, original accordions, theme persistence, safe Markdown and DOM accessibility.

`npm run check`: **passed**. `npm run build`: **passed in 17.07s**, with existing large-chunk and plugin-timing warnings. `git diff --check`: **passed**. No remaining content, navigation-test or type/build errors were found in these checks.

Real browser/mobile visual layout and interaction were not exercised for this addition; the session's browser inventory was empty. DOM accessibility excludes color contrast, highlighting checks use synthetic section positions, and the keyboard fixture models native button activation explicitly. Responsive/reduced-motion behavior uses the existing shared styles. These checks do not certify actual device layout or native touch behavior.
