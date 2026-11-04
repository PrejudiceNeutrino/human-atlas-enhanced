# Explosion playback and camera return

Updated 2026-11-04. This refinement follows local main commit `d619692e391357f8f7961de667d6adcdcf09baf2`.

## Controls

The small Play control beside the explosion percentage animates to the next existing stage: Systems apart at 30%, then Every piece at 100%. It becomes Pause during playback and is disabled at 100%, while loading/leaving, on error, or with fewer than two visible pieces. A single-family layout goes straight to Every piece because it has no separate systems stage. The button has an accessible action label, pressed state and relationship to the slider.

Full-stage durations use `--motion-explode-systems:2600ms` and `--motion-explode-pieces:4200ms`. A partially completed stage takes proportionally less time, with a 400ms minimum. Smoothstep easing starts/stops gently and lands exactly on the destination. Reduced motion goes directly to that destination. Manual slider use cancels playback; pointer/adjustment-key capture first publishes the last rendered position so control takeover does not rewind to an older UI value. Reset cancels playback before resetting viewer state. Blur or a hidden tab pauses at the last rendered amount. Model, Region, Teaching area, reset, visibility, hidden pieces, selection, isolation and breast-view changes invalidate the active command. Unmount cancels it and removes listeners.

## Renderer ownership and glitch fixes

`app/explode-playback.ts` defines the finite command and pure stage/timing helpers. `app/use-explode-playback.ts` owns commands, cancellation and UI state. `app/scene.tsx` samples the command inside its existing frame loop and applies the same existing piece-offset calculation used by manual dragging. It reports percentage changes to React at most every 50ms, plus completion. The renderer does not wait for those reports to advance the anatomy. A cancelled command retains its last rendered value until React acknowledges the stop, and stale callbacks cannot overwrite a newer reset or scope.

The earlier React-driven playback could advance less often than rendering and interfere with camera assistance. The final implementation removes that separate frame driver. Continuous explosion frames no longer cancel their own front-view assist. A pending-view acknowledgement also prevents a completed assist from snapping backwards while React still holds the previous view. These are code-path fixes; actual device frame rate has not been measured.

The assembled-distance bug was reproduced in all six camera-fit regression groups before the fix. Camera-direction reanchoring had adopted an already expanded distance as a fresh baseline, accumulating zoom-out. The final renderer keeps the assembled distance and applied expansion scale independently of the direction/target anchor. Retracting removes the applied scale, while preserving intentional wheel zoom and pan. Explicit viewport/preset/isolation fitting establishes its own new baseline. Repeated expansion/retraction and changes in packed membership no longer redefine the baseline.

When the slider reaches 0% without navigation or a full Reset, it first restores assembled zoom, then returns to the original slight three-quarter direction over the existing 650ms camera-return duration. It keeps the current orbit target, projection, layers, selection and other viewer settings. Residual OrbitControls damping is drained; the view indicator updates after completion without causing a refit. New canvas input, renewed slider movement, navigation or view lock interrupts the return. A locked view retains its angle; reduced motion uses the final angle immediately. This uses camera movement only after reassembly and retains the separately accepted full Reset behavior: normal camera return when assembled, opacity fade when exploded.

No packing algorithm, scientific input, model asset, material or render pass was added or changed. Expansion still updates and renders the existing model each frame, just as manual expansion does; this does not promise zero GPU cost.

## Verification

- Playback helpers/hook: **7/7 passed** (`npm run test:explode-playback`), including staged stops, exact/monotonic interpolation, pause, manual/reset cancellation, stale updates, scope/readiness invalidation, reduced motion, background pause and unmount. The hook test also rejects a new animation-frame loop.
- Actual renderer frame and camera-return code: **18/18 passed** (`npm run test:reset-camera`). Includes per-frame progress without React feedback, no pause rewind, uninterrupted front assist, delayed view acknowledgement, all existing Reset regressions, manual-zero angle/zoom/pan/projection retention, cancellation, lock/reduced-motion behavior, and real OrbitControls damping.
- Actual explosion-fit code against male and reconstructed female manifest bounds: **6/6 passed** (`npm run test:explosion-camera`), covering full and repeated partial round trips, reanchoring, manual zoom/pan, compact viewports/custom distances and changing packed membership.
- Existing explosion layout: **10/10 passed**; motion: **6/6 passed**; actual wheel handler: **11 scenario groups passed**; shell cleanup: **6/6 passed**.
- TypeScript check passed. Production build passed in **15.89s**, with Vite large-chunk and plugin-timing warnings.
- Browser-control inventory was unavailable. Desktop/mobile GPU smoothness, visual appearance, real pointer/touch takeover and on-device frame times remain unverified. CPU/DOM tests do not certify those properties.

The [cumulative local handoff](integration/LEARN_MENU_AND_EXPLOSION_HANDOFF_2026_11_04.md) lists every file in this delivery and its Git boundary.
