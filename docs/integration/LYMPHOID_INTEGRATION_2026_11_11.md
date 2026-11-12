# Lymphoid System and Immunity integration - 2026-11-11

Local branch: `feature/lymphoid-integration`, created from `dffa0ae` on the completed Respiratory branch. Local `main` remains at `82e5f4a`. No branches were merged. Delivery is a local commit only, following the user's established instruction. No push or deployment was attempted.

## Content imported without alteration

| Dataset | Confirmed count |
| --- | ---: |
| General Overview | 8 sections |
| Deep Dive | 19 sections |
| How It Connects | 10 sections |
| Who Cares? | 3 expandable stories |
| Exam Cram | 18 sections |
| Glossary | 206 concepts |
| Multiple Choice | 104 questions |
| Fill in the Blank | 66 questions |
| Flashcards | 117 cards |
| Study topics | 13 |
| Gallery figures / full-size WebPs / thumbnails | 35 / 35 / 35 |
| Study-guide objectives | 28 |
| Proposed anatomy targets audited | 19 |

All five phases were inspected. The complete archive has 122 files (119 original phase files plus three root package/index files). Its supplied `FILE-CHECKSUMS.sha256` was verified: all 121 indexed files match. No mismatch was found between the combination manifest, actual phase directories and confirmed counts. Earlier-phase README statements describe the state at that phase; the completed combination package includes the later phases.

The five reading JSON files, five Study Tools JSON files, Gallery manifest and 70 WebPs are copied byte-for-byte. Regression SHA-256 checks cover all **81 runtime source files**. Supplied IDs, article/section order, Markdown, scientific language, questions, choices, answers, accepted alternatives, explanations, captions and source metadata remain unchanged. Git attributes preserve their bytes in commits and fresh checkouts. No images were generated, converted, cropped or recompressed.

Original curriculum, source alignment, scientific-review notes, manifests, answer key, source indexes, schema types and checksums are retained under [`lymphoid-source/`](lymphoid-source/). `archive-inventory.json` lists every original archive entry with length and SHA-256. Original standalone previews and packaging utilities remain editorial references and are not embedded or executed by the application. The integration does not claim a new independent scientific peer review.

**SG-10 remains unresolved:** the supplied study guide asks about a hormone controlling B-cell differentiation, while the supplied material does not supply a validated single-hormone answer. The original readings, coverage flags and flashcard `fc-025` are retained. No new graded hormone answer was invented. All 28 objective maps resolve to their authored reading sections and study topics; a mapped topic is not represented as instructor clarification of SG-10.

## Shared platform changes

`/learn/lymphoid` uses exactly: General Overview, Deep Dive, How It Connects, Who Cares?, Visualize, Gallery, Exam Cram, Study Tools. It appears in Learn selection, the subject dropdown and breadcrumbs. The existing Section Guide descriptions, reading layouts, indexes, heading anchors, previous/next navigation, back-to-top behavior, context menu and facts disclosures are reused. The context menu's first shortcut is **Lymphoid Model**; Navigate and On This Page derive from the actual current subject/tab.

The Respiratory subject-content registry now registers Lymphoid's five unchanged datasets. No new article renderer or parallel application was created. The current shared synchronous reading/Notes catalog is preserved for stable paragraph/source identities; Study Tools banks, Gallery images and 3D geometry retain their existing lazy-loading boundaries. Adding the third bank requires one lazy registry entry and a small subject-specific import module. The shared Study Tools interfaces are unchanged.

Existing manifest-based source validation already supports `22-Lymphoid System-new.pptx` (51 slides), `Lymphoid - Copy.pptx` (20 slides), and the supplied `recall`/`application` metadata. No subject-specific validator override or source-record normalization was necessary. All bank concept references and article-section references resolve.

All 493 Study Tools records use the original IDs. Browser study persistence remains keyed by `human-atlas-study-progress:v1:<subjectId>`. Regression tests exercise the same question/card IDs in Digestive, Respiratory and Lymphoid, reopen their stores, and reset Lymphoid while retaining both other subjects' progress. Actual Lymphoid quiz submission and flashcard rating also save through the shared store.

Notes and highlights use the existing subject-aware annotation catalog and private IndexedDB store. Tests save a Lymphoid note/highlight, switch to Digestive, and restore the original Lymphoid passage through its annotation URL. Existing Notes regression coverage for export/import and preservation still passes. No existing notes or progress were migrated, cleared or reset by implementation.

## Gallery and publication behavior

The earlier user update explicitly made both Respiratory and Lymphoid gallery assets part of normal public production builds; it supersedes the attached prompt's older local-only restrictions. The current request also retains local-only Git delivery. Assets are in `public/images/learn/lymphoid/gallery/`, with no private ZIP, local feature flag, authentication or external image host required. Normal production build inclusion is verified; no live deployment was requested or performed in this task.

The existing Gallery supplies search, four category filters, stars, full-size inspection, next/previous navigation, zoom/pan, keyboard handling and mobile-oriented controls. The categories contain 1 anatomical model, 11 anatomical diagrams, 5 histology figures and 18 physiology diagrams. All 35 full-size SHA-256 values are unique. All 70 files decode as WebP; full-size native dimensions match the manifest, and every original thumbnail is 640 x 450.

Thumbnail loading is lazy, and full-size images enter the viewer only after inspection is opened. No compatible label annotations were supplied: Lymphoid hides Label Practice/curator controls and does not request an annotation sidecar. Digestive label practice still passes its existing Gallery tests. Stars remain namespaced by subject through the existing preferences store.

The manifest's ten `scienceReview` cautions are now displayed verbatim in the existing figure Details area. This small optional shared field preserves the scientific qualifications on simplified diagrams, including the misleading innate/adaptive taxonomy in `p18` and MHC/activation qualifications. Existing subjects without this optional metadata retain their current display. Captions, source slide numbers, extraction metadata, source type and rights-review flags remain in the original manifest.

Local use: `npm.cmd run dev`, open `/learn/lymphoid`, and select Gallery. Production check: `npm.cmd run build`, then `npm.cmd run test:lymphoid-build`. The latter allocates an available local preview port and checks the route, manifest and every image response/hash. A future deployed build can be checked with `node scripts/verify-lymphoid-build.mjs --base-url <deployment-url>` after a separately requested release.

To remove an image later, remove its manifest item and two assets, update the collection/registry count and the intentional fidelity test baseline, and retain all remaining IDs. The shared Gallery handles missing selections/preferences and reports unavailable image previews/full-size loading rather than silently omitting entries.

## Verified anatomy and limitations

The existing Anatomy Companion, AnatomyScene, actual model manifests, identity index, scoped chunks, camera controls, selection, inspection, reset and context behavior are reused. The anatomical system ID is **`lymphatic`**. Original meshes, model coordinates, lighting and materials are untouched. No individual immune cell, antibody, MHC complex or other molecular process is presented as whole-body geometry.

| Target | Male reference | Female study | HRA female reference |
| --- | --- | --- | --- |
| Spleen | verified-and-integrated | verified-and-integrated | verified-and-integrated |
| Thymus | verified-and-integrated | verified-and-integrated | verified-and-integrated |
| Lymph nodes (cervical) | not-represented | not-represented | uncertain |
| Lymph nodes (axillary) | not-represented | not-represented | uncertain |
| Lymph nodes (inguinal) | not-represented | not-represented | uncertain |
| Thoracic duct | not-represented | not-represented | not-represented |
| Right lymphatic duct | not-represented | not-represented | not-represented |
| Cisterna chyli | not-represented | not-represented | not-represented |
| Tonsils (palatine) | not-represented | not-represented | verified-and-integrated |
| Tonsil (pharyngeal) | not-represented | not-represented | not-represented |
| Appendix | verified-and-integrated | verified-and-integrated | verified-and-integrated |
| Red bone marrow | not-represented | not-represented | not-represented |
| Peyerâ€™s patches | not-represented | not-represented | not-represented |
| Lymphatic capillaries | not-represented | not-represented | not-represented |
| Lymphatic vessels | not-represented | not-represented | partial-anatomy-not-integrated |
| B lymphocytes | not-represented | not-represented | not-represented |
| T lymphocytes | not-represented | not-represented | not-represented |
| Natural killer cells | not-represented | not-represented | not-represented |
| Spleen red and white pulp | not-represented | not-represented | not-represented |

There are **four distinct mapped targets across models**: spleen, thymus, appendix and palatine tonsils. Male/female study each offer three shortcuts (four mesh pieces including both thymic lobes). HRA offers four shortcuts (ten mesh pieces, including spleen surfaces and both tonsils). The other 15 proposed targets have no published selection shortcuts.

Unsupported/unresolved targets: cervical, axillary and inguinal lymph nodes; thoracic duct; right lymphatic duct; cisterna chyli; pharyngeal tonsil; red bone marrow; Peyer's patches; lymphatic capillaries; whole-body lymphatic vessel pathways; B lymphocytes; T lymphocytes; natural killer cells; spleen red and white pulp. The HRA regional node candidates remain uncertain, rather than receiving a guessed station assignment. Its afferent/efferent sample vessels are partial sample coverage only and are not integrated as body drainage pathways.

The HRA manifest includes seven pieces of a Yao sample lymph node, but no verified cervical, axillary or inguinal identity. The lesson explicitly excludes that sample from both default and context scopes, avoiding the appearance that it is a verified regional body node or a complete vessel pathway. This uses an optional lesson `excludedPartIds` field; the source manifest is unchanged. Digestive and Respiratory have no exclusions, and their existing scoped representations remain unchanged.

Canonical IDs are pinned separately for HRA; no male geometry is substituted for female geometry. The female study model remains explicitly experimental, with its pre-existing placement/readiness limitations unchanged. HRA has no standalone Explore route, so its viewer never links to a different model as a fallback.

[`LYMPHOID_ANATOMY_AUDIT.json`](LYMPHOID_ANATOMY_AUDIT.json) records all 19 candidates for all three inventories, source IDs, canonical IDs, part names, link relations and representation counts. Run `npm.cmd run audit:lymphoid-anatomy` to repeat canonical resolution, binary bounds/finite-vertex/triangle-index checks and sample exclusion checks. The mapped source geometry was also rendered as static projections and inspected for all three models under ignored `work/lymphoid-audit/`. This is separate from browser/WebGL inspection.

## Validation results

| Command or check | Result |
| --- | --- |
| `npm.cmd run check` | Passed |
| `npm.cmd run build` | Passed; existing lazy scene chunk warning above 500 kB |
| `npm.cmd run test:learn` | 27 passed |
| `npm.cmd run test:study-tools` | 22 passed |
| `npm.cmd run test:gallery` | 11 passed, including Digestive label practice |
| `npm.cmd run test:anatomy-companion` | 11 passed |
| `npm.cmd run test:annotations` | 30 passed |
| `npm.cmd run test:learn-context-menu` | 8 passed |
| `npm.cmd run test:respiratory` | 9 passed |
| `npm.cmd run test:lymphoid` | 9 passed |
| `npm.cmd run test:palettes` | 6 passed |
| `npm.cmd run audit:lymphoid-anatomy -- --write` | Passed for all three inventories and configured actual binary geometry |
| `npm.cmd run audit:respiratory-anatomy` | Passed, original 12 / 12 / 18 shortcuts and scopes unchanged |
| `npm.cmd run test:lymphoid-build` | Passed: route/manifest plus all 70 WebP HTTP responses and original hashes |
| `npm.cmd run test:respiratory-build` | Passed: all 58 Respiratory WebP HTTP responses and original hashes |
| Original archive checksum index | 121 / 121 files match |
| Runtime content fidelity | 81 / 81 original runtime files match |
| WebP decoding and dimensions | 35 full-size + 35 thumbnails passed; no duplicate full-size hashes |
| Application/generated-file whitespace check | Passed; original editorial source formatting is preserved |

The nine regression commands above pass **133 tests** in total. New subject checks cover full rendered Markdown fidelity for all article sections, all disclosures, subject routing/section hashes, all study counts/topic coverage/source links, shuffle/answer-ID grading, authored fill alternatives, actual quiz submission/card rating, three-subject persistence isolation, Gallery filtering/inspection/stars/caveats, Notes saving/restoration, context menus and all three actual anatomy model choices with sample exclusion.

The initial Lymphoid test run had one test-fixture assertion failure: it searched for words such as ambiguous in the original flashcard answer, whose actual authored wording is not a single standard required hormone. The assertion was corrected to match the supplied wording; no educational content changed. Final Lymphoid results are 9/9.

Browser/GPU/mobile smoke checks are **unavailable**, not passed: the browser inventory returned `apps: []` and `browsers: []`. CPU scene tests verify actual catalogue/scoped parts and viewer-state props while substituting the GPU renderer. They do not certify live WebGL orbit rendering, touch gestures, screenshots or responsive visual layout. Palette and DOM accessibility tests pass; no new subject theme or preview CSS was introduced.

## Delivery and follow-up

The complete changed-file inventory is [`LYMPHOID_FILES.txt`](LYMPHOID_FILES.txt). Original Digestive/Respiratory educational datasets, public gallery assets, model manifests, identity mappings and scene renderer are unchanged. The current main branch and the completed Respiratory branch were preserved.

This task ends with a local commit on `feature/lymphoid-integration`. No push, main merge or live deployment is performed. The galleries are production-build ready, which does not imply that the live website has changed.

Remaining verification/polish: real desktop/mobile/WebGL interaction in an available browser; instructor clarification of SG-10; independent scientific/anatomical review as already flagged in supplied materials; the explicitly unsupported/uncertain anatomy targets. Label Practice needs separately authored coordinates if requested later. No unsupported content, geometry or labels were fabricated.
