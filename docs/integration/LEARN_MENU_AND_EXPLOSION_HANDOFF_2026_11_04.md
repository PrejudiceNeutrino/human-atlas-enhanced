# Learn chooser and explosion interaction handoff

Date: 2026-11-04. Base/previous commit: `d619692e391357f8f7961de667d6adcdcf09baf2` (`feat: add Learn and refine viewer navigation and reset motion`). Requested destination: **local main commit only**. This record covers every changed/added file since that commit. The preceding [Learn and viewer handoff](LEARN_AND_VIEWER_HANDOFF_2026_11_04.md) remains the historical record of that earlier delivery.

## Resulting behavior

- The toolbar's Learn button opens a glass subject chooser over the current explorer or reading page, with a blurred backdrop, theme-aware frosted surface, restrained motion, clear Digestive System link, close control and Escape hint. Opening/dismissing does not navigate or replace the explorer. Choosing Digestive follows `/learn/digestive`. Direct `/learn` routing remains available. The existing registry supplies subjects and lesson counts; no future subjects are invented.
- The chooser uses the existing Base UI Dialog, accessible title/description, initial subject focus and focus return. Viewer shortcuts defer within it. The shared dialog wrapper accepts an optional backdrop class without changing other dialogs. Responsive width/scrolling, coarse-pointer hints and reduced-motion CSS are included.
- Removed the thin outer trace border on Explore/Learn and replaced it with a soft translucent group fill. The active treatment and divider before utility icons remain.
- Added Play/Pause beside the explosion percentage: animate to Systems apart (30%), then Every piece (100%). Single-family layouts skip the first stage. Reset/manual input cancels playback; blur/backgrounding pauses; incompatible scene changes invalidate it. Reduced motion jumps to the next stop.
- Playback is sampled by the existing renderer loop, with UI reporting every 50ms. Camera assistance survives continuous expansion, stale UI progress cannot rewind a paused frame, and delayed view acknowledgement cannot snap a completed assist backwards.
- Fixed cumulative camera zoom-out after manual expansion/retraction by keeping the assembled zoom baseline separate from camera direction reanchoring. Manual zoom/pan remain meaningful. Returning to 0% restores assembled scale and eases back to the original slight three-quarter angle without resetting layers or exploration state. View lock and reduced motion are respected. The previously accepted normal Reset camera motion and exploded Reset opacity fade remain.

Detailed contracts: [Learn](../learn.md), [explosion playback/camera](../explode-playback.md), [Reset](../reset-camera.md).

## Complete file inventory

| Status | Files | Purpose |
|---|---|---|
| Added | `app/learn/subject-menu.tsx`, `app/learn/subject-menu.css` | Reusable registry-driven glass subject dialog and responsive/theme/motion styles |
| Modified | `app/site-navigation.tsx`, `app/site-navigation.css` | Learn dialog trigger; softened navigation group |
| Modified | `components/ui/dialog.tsx` | Optional backdrop class for the existing dialog wrapper |
| Modified | `app/viewer-shortcuts.ts` | Honor the chooser's disabled shortcut scope |
| Added | `app/explode-playback.ts`, `app/use-explode-playback.ts`, `app/explode-playback.css` | Playback command, stage/timing helpers, cancellation lifecycle and compact Play/Pause styling |
| Modified | `app/page.tsx` | Playback hook, button, manual takeover, Reset cancellation and scene command wiring |
| Modified | `app/scene.tsx` | Renderer-owned playback, assistance synchronization, persistent zoom baseline and manual-zero angle return |
| Modified | `app/globals.css` | Two staged playback duration tokens |
| Added | `scripts/explode-playback.test.mjs`, `scripts/explosion-camera.test.mjs` | Playback lifecycle and real camera-fit regressions |
| Modified | `scripts/reset-camera.test.mjs` | Renderer playback/assistance and manual-zero regression coverage |
| Modified | `scripts/learn.test.mjs`, `scripts/final-ui.test.mjs` | Chooser DOM/accessibility/focus/navigation and shortcut tests |
| Modified | `package.json` | `test:explode-playback` and `test:explosion-camera` aliases; no dependency changes |
| Added | `docs/explode-playback.md`, this handoff | Interaction/implementation contracts, full change inventory and validation limits |
| Modified | `docs/learn.md`, `docs/reset-camera.md`, `README.md` | Current behavior, refreshed verification and delivery links |

Total: **23 files** (9 added, 14 modified). No deleted files. No package-lock/dependency, canonical lesson JSON, scientific input, geometry, mapping or scope edits. The supplied lesson JSON still has SHA-256 `03404d3524c3adefb2f6595e410076f9f439eb39f61ea895d7597bae511fd578`.

## Final verification and limits

| Check | Result |
|---|---|
| Learn DOM/content/accessibility/focus | 8/8 passed |
| Viewer shortcut scope | 3/3 passed |
| Playback helpers/hook | 7/7 passed |
| Actual scene frame / Reset / manual-zero camera | 18/18 passed |
| Actual explosion camera fit | 6/6 passed |
| Existing explosion layout | 10/10 passed |
| Existing motion | 6/6 passed |
| Existing shell cleanup | 6/6 passed |
| Actual cursor-wheel handler | 11 scenario groups passed |
| `npm run check` | Passed |
| `npm run build` | Passed, 15.89s; large-chunk and plugin-timing warnings |
| `git diff --check` | Passed before staging |
| Live browser/GPU, desktop/mobile visual and real touch/pointer behavior | Unavailable; browser-control inventory empty |

The seven-file combined Node run reported 41 passing subtests: 40 named tests plus one wheel-handler file containing the 11 scenario groups. The separate scene/camera runs add 18 and 6 named tests. These are focused CPU/DOM/source-extracted renderer tests, not an exhaustive all-repository or browser certification. DOM accessibility excludes color contrast because jsdom has no layout engine. A synthetic outside-press fixture stalled in jsdom and was removed rather than counted as passed; the chooser retains Base UI's existing outside-dismiss behavior, which remains a real-browser verification gap. Visual smoothness and hardware frame cost are not measured.

Test bundles and build output remain ignored under `work/` and `dist/`. No production test hooks were added. Earlier failed camera-fit results reproduced the zoom bug and are superseded by the final six passing groups after the fix.

## Git delivery

The working branch was verified as `main`. Before this commit it was 1 commit ahead and 0 behind the locally cached `origin/main`; after this single commit it should be 2 ahead and 0 behind that cached reference. No fetch was performed, so this is not a live remote-state claim. The resulting SHA and clean-worktree result are reported in the delivery message. No push or deployment is included.
