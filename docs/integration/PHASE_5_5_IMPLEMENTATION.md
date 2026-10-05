# Phase 5.5 implementation: final interaction, theme and help polish

Date: 2026-10-04. Authorized branch: `phase-5.5/final-ui-polish`. Clean starting Phase 5.4/main SHA: `c7c6387a84f30cdda71d5e0d435c77b424ef60cb` (README follow-up to Phase 5.4 `73762b4`). Local main, origin/main and the phase branch matched. Implementation/validation records through Phase 5.4 and the actual viewer, scene, interaction, selectors, discovery, display, theme, motion and floor code were reviewed before changing source. No merge into main or Phase 6 work is included.

## Dark palette

The previous canvas `#202a33`, panels `#293540f2`, controls `#2b3742eb` and muted/hover fills `#35424e`/`#40515f` carried blue across nearly every surface. The revised hierarchy gives anatomy the dominant color, while retaining the existing cyan accent for selection and active controls. Colors were reviewed in real rendered Light/Dark screenshots on both models, including all seven floor presets.

| Token/surface | Previous Dark | Final Dark |
|---|---|---|
| Canvas / application | `#202a33` | `#141414` |
| Card | `#2b3742` | `#232323` |
| Main panel | `#293540f2` | `#232323f5` |
| Elevated control | `#2b3742eb` | `#2b2b2bf2` |
| Popover / dropdown | `#2b3742` | `#292929` |
| Input surface | `#24303a` | `#1d1d1d` |
| Secondary / muted fill | `#36434f` / `#35424e` | `#303030` |
| Hover | `#40515f` | `#383838` |
| Border / input border | `#bacbd52b` / `#bacbd54a` | `#ffffff24` / `#ffffff38` |
| Primary text | `#e8edf1` | `#f0f0ef` |
| Secondary / muted / faint text | `#d0dbe3` / `#b3c0cb` / `#a5b4c1` | `#dededb` / `#bdbdbb` / `#a7a7a4` |
| Scrollbar | `#718391` | `#777775` |
| Selected control | `#425c6b` | `#34474b` |
| Primary accent / link / focus | `#88b7c5` / `#9cc8d4` / `#a3d1db` | Retained |
| Disabled rail opacity | `.22` | `.45` |

CSS tokens cover portal-mounted selects, Search/Browse, Display, Info, inspector, Visibility, dock, rail, footer and focus treatments. Dark hover tooltips now use neutral `#303030f5` with foreground text. The vignette uses neutral black. The early HTML stored-theme background, scene clear color and theme-color metadata agree on `#141414`, preventing a blue loading flash. Light theme tokens are unchanged.

Classic Dark floor surface/edge/rim change from `#33424e` / `#293743` / `#556b7b` to `#303030` / `#242424` / `#626260`. Procedural line/accent/center change from `#839baa` / `#a3bdcf` / `#121b24` to `#999995` / `#a3c4c9` / `#080808`. Intensities, opacity, geometry, uniforms, resource lifetime, timing and preset architecture are unchanged. Event Horizon retains a restrained cyan annulus against the darker canvas. No renderer exposure, tissue color, lighting, selection shader, brightness or contrast default changed.

## Teaching Area relevance

Only the inset left-border shadow is removed. The existing dot and accessible affiliation text remain, together with canonical heading order and selected-row/checkmark treatment. Cervical relevance continues to annotate Brainstem under Head & jaw, Larynx under Cervical and Brachial plexus under Shoulder. It does not regroup entries or change memberships, display scopes or selection.

## View lock and camera pipeline

`viewLocked` is a transient React state in the viewer, separate from canonical SceneState, URL and preference stores. Reload initializes false. Reset retains the lock because it resets only the established anatomical/view state. The live scene receives the boolean via its existing latest-ref pattern; toggling lock never recreates the renderer or controls.

The render loop sets `OrbitControls.enableRotate` false while locked. At lock entry it drains outstanding damping with damping temporarily disabled, restores the captured camera position/target, then reenables normal damping. This prevents residual orbit inertia from moving a freshly locked orientation. Controls remain enabled: ordinary anchored wheel zoom, native pinch zoom and right-drag/two-finger pan remain available. Pan preserves camera orientation. Picking, visibility, dissection, isolation, Regions/Areas, explosion and floor controls use their existing actions.

Lock entry turns autorotate off; the scene also suppresses it while locked and the autorotate button is disabled. Unlock does not resume autorotate; the user explicitly turns it back on. Speed remains adjustable and persists as before.

`cameraView` is the single callback for rail buttons and F/S/B. It uses the existing view/reset fields and fitting path and stops autorotate. F/S/B/R remain functional while locked and leave the lock active. The retained isolation fit previously hardcoded oblique direction even when a preset requested Front/Side/Back; it now honors those directions in that same fit, preserving its bounds, framing distances, view offsets and three-quarter isolation angle. No parallel camera controller is introduced.

The rail order is **Three-quarter, Front, Side, Back; separator; Lock; separator; Autorotate, Rotation speed**. Existing 44 px button heights, hover/focus treatment and motion tokens remain. Lock uses familiar lock/unlock icons, dynamic title/accessibility labels and `aria-pressed`. Presets advertise keyboard shortcuts. Reset remains the one compact action in the Explode dock with R help; no redundant rail Reset is added.

## Keyboard and help

`app/viewer-shortcuts.ts` defines the eight keys, action names, labels and context descriptions. The same registry drives actual key dispatch and the Info reference. Legacy exported H/J/slash guard helpers delegate to it, preserving their public test/caller contracts.

| Key | Action / pipeline |
|---|---|
| `/` | Open Search and request input focus |
| H | Existing `hideSelected` callback |
| J | Existing `restoreNewestHidden` helper |
| I | Shared `isolateSelected` callback -> `isolateSelection` |
| R | Existing Reset callback -> `resetViewer` |
| F / S / B | Shared `cameraView` callback -> existing scene fit |

Upper/lowercase letters work. Unknown keys, handled events, composition, repeats, Ctrl, Meta and Alt chords are ignored. Inputs, textareas, selects, contenteditable ancestors and editable ARIA combobox/textbox/searchbox/slider/spinbutton/listbox/menu contexts defer to their own editing/navigation. The modal Info panel suppresses viewer dispatch. I has no fallback: an empty or unresolvable selection is a safe no-op. H/J semantics and hidden-history order remain unchanged.

Info now explains educational/scientific visualization, model scope, manipulation/dissection, lock/reset behavior and source credits in concise sections. It retains the source licenses, HRA authors/version/DOI and BodyParts3D links, explicitly credits [Original Human Atlas](https://github.com/ashemag/human-atlas) and distinguishes [Human Atlas Enhanced](https://github.com/PrejudiceNeutrino/human-atlas-enhanced). The upstream URL was verified; the enhanced URL matches the supplied repository and Git remote. Wording preserves estimated female proportions, incomplete coverage, experimental placement and absent scientific validation. The existing sheet ref/layout effect still resets scroll only on opening, retaining title focus and scroll-to-top behavior.

## Search/Browse and caption layout

The actual post-5.4 surface already had the Phase 5.2 flat active-indicator tabs, 16 px panel padding, 44 px input, 14/12 px rhythm and singular accent-border focus. Those accepted rules are retained. Helper text and result-row left padding are normalized to the title/input/divider edge. Shared charcoal tokens retune Dark without altering ranking, aliases, full Browse inventory, filters, sort modes, virtualization, keyboard result navigation or Escape.

A ResizeObserver measures the actual dock layout and updates `--dock-clearance` on the main element, including viewport resize. It uses untransformed offset geometry, so Phase 5.3 entrance animation cannot distort the settled caption position. The caption sits 14 px above the dock and stays visible at short desktop heights. All caption variants and the workspace-exit control use that same safe boundary. There is no camera-framing or explosion-math change for spacing. The observer and resize listener clean up on unmount.

New controls inherit the existing button/popup motion language. No entrance sequence, camera animation system or dependency is added; reduced motion continues through existing CSS/media behavior. React review checked shared listeners/actions, state ownership, ref updates, observer cleanup, keyboard/ARIA controls and absence of renderer remounts.

## Files and scope

New source/tests: `app/viewer-shortcuts.ts`, `scripts/final-ui.test.mjs`, `scripts/final-ui-browser-smoke.mjs`. New records: this file and `PHASE_5_5_VALIDATION.md`; selected screenshots are under `phase-5.5-evidence/`.

Modified: `app/page.tsx`, `app/scene.tsx`, `app/globals.css`, `app/theme.ts`, `app/theme-store.ts`, `app/classic-floor.ts`, `app/scene-floor.ts`, `app/hide-restore.ts`, `app/anatomy-discovery.ts`, `web/index.html`, `package.json` (test commands only), `scripts/hide-restore.test.mjs` (stale source-shape assertion updated for centralized dispatch).

Geometry, canonical identity, Regions, Teaching Area data/memberships/scopes, scientific sources and package-lock remain unchanged. Scientific reclassification, Flexor Retinaculum corrections, Latin, knowledge, pathology/pharmacology, supplemental anatomy, nerves and HRA upgrades are excluded. Phase 6 is not started. Validation and final handoff status are recorded separately.
