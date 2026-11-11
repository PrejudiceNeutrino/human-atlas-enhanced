# Respiratory System integration - 2026-11-11

Branch: `feature/respiratory-integration`, created from the clean current `main` (`82e5f4a`). Respiratory only; Lymphoid is unchanged.

## Imported content and fidelity

| Dataset | Imported count |
| --- | ---: |
| General Overview | 8 sections |
| Deep Dive | 23 sections |
| How It Connects | 11 sections |
| Who Cares? | 3 expandable stories |
| Exam Cram | 18 sections |
| Glossary | 192 concepts |
| Multiple Choice | 106 questions |
| Fill in the Blank | 67 questions |
| Flashcards | 114 cards |
| Study topics | 14 |
| Gallery | 29 figures, 29 full-resolution WebPs, 29 thumbnails |
| Curriculum | 30 objectives (29 questions plus terminology), 15 original scientific review items |

The five reading JSON files, five Study Tools JSON files, Gallery manifest and 58 WebPs are copied byte-for-byte. Automated SHA-256 checks cover all 69 imported runtime files. No authored scientific text, IDs, answers, explanations, image bytes, source metadata or Markdown was regenerated. Digestive educational datasets and gallery assets are unchanged. Git attributes preserve source bytes on fresh checkouts.

All five archive phases were inspected. Original curriculum, source inventory, alignment maps, manifests and scientific-review material are retained in [`respiratory-source/`](respiratory-source/). `archive-inventory.json` records every archive entry and its hash. Standalone previews and packaging utilities are editorial references; none is embedded or executed by the app.

Metadata inconsistency: root `master-manifest.json` still has `version: phase4`, `phasesIncluded: [1,2,3,4]` and `phasesRemaining: [5]`; its later `latestPhase`/`phase5` fields and the actual Phase 5 directory establish the completed visual package. The root README also retains earlier Phase 4 wording. The original metadata is preserved; the actual individual phase data is authoritative.

## Shared implementation

`/learn/respiratory` uses all eight tabs in this order: General Overview, Deep Dive, How It Connects, Who Cares?, Visualize, Gallery, Exam Cram, Study Tools. The subject chooser, dropdown, breadcrumbs, section guide, context menu, heading navigation and bookmarked section hashes use the existing registries and controllers. Section descriptions are shared with Digestive.

`app/learn/content.ts` registers subject-owned reading records for the existing renderers and annotation catalog. Reading content remains synchronous with the shared Notes catalog to preserve stable source/paragraph identities. No parallel article renderer or Notes database was added.

Study Tools loads one lazy subject bank alongside the same four interfaces. Presentation filenames and slide limits come from each manifest. Respiratory sources allow 42 physiology slides and 19 anatomy slides; both original `knowledge` and Digestive `recall` cognitive metadata are accepted without modifying records. Study storage uses the existing `human-atlas-study-progress:v1:<subjectId>` keys; tests exercise identical IDs in both subjects, remount persistence and reset isolation. Existing notes/highlights use the same private IndexedDB store with subject-specific targets.

Gallery counts and Label Practice availability are registry metadata. Respiratory uses browsing, category/search filtering, stars, image inspection, navigation and the shared zoom/pan component. It has no label-coordinate dataset: Label Practice and curator controls are hidden, and no annotation sidecar is requested. Digestive label practice still passes its existing Gallery regressions. Thumbnails load lazily; full-size figure URLs enter the inspector only when opened.

## Public gallery assets

The later user instruction explicitly superseded local-only handling. All images and the unchanged manifest are in `public/images/learn/respiratory/gallery/`. Normal Vite production builds include them; no environment flag, authentication, private ZIP, local directory or external image host is required. No existing Digestive publication policy was changed.

Start local development with `npm.cmd run dev`, then visit `/learn/respiratory` and choose Gallery. A fresh checkout includes all assets. Build with `npm.cmd run build`; run `npm.cmd run test:respiratory-build` to start an isolated production preview and verify the route, manifest and every WebP by HTTP and SHA-256. To check an actual deployment later, run `node scripts/verify-respiratory-build.mjs --base-url https://anatomy.neutrino.live`.

To remove a figure later, edit the subject manifest, remove that item and its two files, update the count and registry count, and update the intentional source-fidelity baseline. Stable IDs of remaining figures must be retained; filters and preferences already tolerate absent IDs. Missing runtime images show an explicit preview/viewer error rather than an unexplained broken image.

## Anatomy audit and coverage

The existing AnatomyScene, model manifests, identity index, camera fitting and context/dissection controls are reused. Geometry, materials and scene lighting are unchanged. Respiratory adds the already registered HRA female reference as a lesson option, with its own canonical IDs. HRA has no standalone Explore route, so no link falls back to a different model. Digestive retains its original two model options.

| Model | Canonically resolved shortcuts | Coverage |
| --- | ---: | --- |
| Male reference | 12 | Airways, diaphragm, cartilages, vessels, rib cage and inferior conchae |
| Female study | 12 | Same source-concept coverage; experimental derived geometry |
| HRA female reference | 18 | Includes actual lung segments, all five lobes and laryngeal assembly |

Across models, **19 of 23 proposed targets have complete mapped coverage**, one has explicitly partial coverage (inferior nasal conchae only), and three have no verified complete target: nasal cavity, pharynx and pleura. No uncertain mapping is published. Pulmonary arteries and veins use two separate verified shortcuts, so shortcut totals differ from candidate counts. HRA epiglottic cartilage is explicitly labeled partial; the full epiglottis is selectable in male/female study models.

Male/female study lung and lobe concepts are bronchovascular assemblies without outer lung tissue. They are documented as coarser coverage and do not become misleading lung-tissue shortcuts. HRA provides the actual lung tissue and lobes. The female study model remains experimental; no independent anatomical readiness status was changed.

The machine-readable [`RESPIRATORY_ANATOMY_AUDIT.json`](RESPIRATORY_ANATOMY_AUDIT.json) audits all 23 candidates per model, with canonical IDs, source IDs, part names, relations and representation counts. `npm.cmd run audit:respiratory-anatomy` rechecks actual binary geometry, finite vertices, triangle indices and identity resolution. Static projections of the actual 12 male and 18 HRA mappings were rendered and visually inspected under ignored `work/respiratory-audit/`. This is distinct from GPU/browser testing.

| Proposed target | Male / female study | HRA female reference |
| --- | --- | --- |
| Lungs (both together) | combined-or-coarser-anatomy | verified-and-integrated |
| Right lung | combined-or-coarser-anatomy | verified-and-integrated |
| Left lung | combined-or-coarser-anatomy | verified-and-integrated |
| Superior lobe of right lung | combined-or-coarser-anatomy | verified-and-integrated |
| Middle lobe of right lung | combined-or-coarser-anatomy | verified-and-integrated |
| Inferior lobe of right lung | combined-or-coarser-anatomy | verified-and-integrated |
| Superior lobe of left lung | combined-or-coarser-anatomy | verified-and-integrated |
| Inferior lobe of left lung | combined-or-coarser-anatomy | verified-and-integrated |
| Trachea | verified-and-integrated | verified-and-integrated |
| Larynx | not-represented | verified-and-integrated |
| Diaphragm | verified-and-integrated | not-represented |
| Right main bronchus | verified-and-integrated | verified-and-integrated |
| Left main bronchus | verified-and-integrated | verified-and-integrated |
| Nasal cavity | not-represented | not-represented |
| Pharynx | not-represented | not-represented |
| Epiglottis | verified-and-integrated | partial-anatomy |
| Thyroid cartilage | verified-and-integrated | verified-and-integrated |
| Cricoid cartilage | verified-and-integrated | verified-and-integrated |
| Arytenoid cartilages | verified-and-integrated | verified-and-integrated |
| Pleura | not-represented | not-represented |
| Pulmonary arteries and veins | verified-and-integrated | verified-and-integrated |
| Rib cage / sternum | verified-and-integrated | not-represented |
| Nasal conchae | partial-anatomy | not-represented |

## Validation

| Command / check | Final result |
| --- | --- |
| `npm.cmd run check` | Passed |
| `npm.cmd run build` | Passed; existing lazy scene chunk exceeds 500 kB warning |
| `npm.cmd run test:learn` | 27 passed |
| `npm.cmd run test:study-tools` | 22 passed |
| `npm.cmd run test:gallery` | 11 passed, including existing Digestive label-practice interactions |
| `npm.cmd run test:anatomy-companion` | 11 passed |
| `npm.cmd run test:annotations` | 30 passed |
| `npm.cmd run test:learn-context-menu` | 8 passed |
| `npm.cmd run test:respiratory` | 9 passed |
| `node scripts/respiratory-anatomy-audit.mjs --write` | Passed for all three actual model inventories and referenced binary geometry |
| `npm.cmd run test:respiratory-build` | Passed: route/manifest plus all 58 image responses, original byte hashes |
| `git diff --check 82e5f4a -- . ':(exclude)docs/integration/respiratory-source/phase-*'` | Passed for application/runtime content and generated metadata; original editorial files excluded |

The 118 automated regression checks include full rendered Markdown comparisons, disclosures, source anchors, topic coverage, shuffle/answer-ID evaluation, all accepted fill alternatives, subject-isolated persistence, Gallery interactions, Notes save/restore, context-menu navigation, model switching, verified selection and zoom/reset props. CPU anatomy UI tests replace the GPU renderer; they do not certify actual orbit/pinch/WebGL rendering.

The original Phase 4 `answer-key.md` retains its supplied extra blank line at EOF; a full source-inclusive Git whitespace check reports that preserved source formatting. Generated archive inventory line endings were normalized to LF without changing any supplied file.

Initial runs exposed legacy assertions assuming only Digestive or older Study Tools copy; those tests now assert the current behavior and scope annotation checks to the rendered subject. The first restricted-shell esbuild run could not resolve the checkout; rerunning with ordinary filesystem access resolved that environment failure. New test-fixture selector/timing issues and a preview-port conflict were corrected before the accepted final runs. The preview verifier now allocates an available port.

Desktop/mobile browser smoke tests are **unavailable**: browser inventory was empty and opening the in-app browser returned `Browser is not available: iab`. No screenshot-based browser, GPU rendering, mobile gestures or deployed-page result is claimed. Static mesh projection review and DOM accessibility checks are separately documented above.

## Delivery and remaining external step

Implementation and original assets are committed locally on `feature/respiratory-integration`; the complete changed-file inventory is [`RESPIRATORY_FILES.txt`](RESPIRATORY_FILES.txt). No merge into main was performed. The worktree is clean.

A push to `https://github.com/PrejudiceNeutrino/human-atlas-enhanced.git` was attempted, but automatic approval review rejected the source/asset export because explicit approval of that exact GitHub destination was required. Nothing was pushed, and the rejection was not bypassed. The user must approve that specific push before remote delivery can continue.

**Live production deployment is not verified.** The connected Vercel API returned HTTP 403 for scope `neutrino2`, requiring the user to authorize this connection for its existing team access. Project discovery and deployment could not proceed. The production build and all public image responses are verified locally; a deployed-page or live-public-Gallery claim would be inaccurate until team access is restored and that exact commit is deployed.

Remaining polish/verification: actual desktop/mobile interaction and GPU inspection in an available browser; final public deployment and live URL checks; future label coordinates only if separately authored; the three unresolved anatomy targets and partial nasal-concha coverage. All original scientific review notes remain available for editorial review; this integration does not claim independent scientific peer review.
