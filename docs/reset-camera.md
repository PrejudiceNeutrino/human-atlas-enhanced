# Reset camera return — 2026-11-04

The Reset button and R shortcut keep the existing full reset: restore default layers, whole-body navigation, hidden pieces, selection, isolation, rotation and explode state. From an assembled view, Reset eases the camera back to its established default fit over 650ms. The user accepted that camera return. From an exploded view, Reset instead fades the existing 3D canvas out over 120ms, reassembles and restores the camera while invisible, then fades the assembled view back in over 280ms.

## Camera and resource behavior

`app/camera-return.ts` captures the current camera position, orbit target and enabled projection offset. It interpolates target, orbit radius, elevation and the shortest yaw to the existing reset fit, including projection offsets from focused/mobile views. Spherical interpolation avoids traveling through the model when returning from behind it. The final frame uses the exact destination pose/projection. A Reset at an already matching pose completes immediately.

`app/scene.tsx` samples transitions in the existing animation loop. For exploded Reset, the fade-out holds the already rendered canvas without rewriting geometry or redrawing it. At zero opacity, one state-buffer update reassembles the pieces and fits the default camera. Fade-in changes only the scene element's compositor opacity and reuses the assembled canvas unless another existing scene feature requires rendering. Canvas pointer input is temporarily suppressed during the 120ms fade-out so picking cannot target stale geometry. UI controls remain available. There are no new timers, frame loops, render passes, materials, geometry copies, network requests or dependencies. Normal camera movement still renders the existing model as ordinary orbiting does; this is not a claim of zero GPU cost.

The renderer computes its destination using the established `fit()` behavior, after isolation exit has restored normal framing. Residual OrbitControls orbit/pan damping is drained before fitting. A normal Reset restores the visible source pose before that frame renders; an exploded Reset fits while transparent. This prevents pending input or isolation cleanup from displacing the destination.

## Interaction boundaries

- Drag, pan, touch, wheel/pinch zoom or a canvas pick cancels the camera return at its current pose.
- A repeated normal Reset starts a fresh camera return from the currently displayed pose. Repeated exploded Reset presses keep the opacity fade continuous.
- Resize cancels camera travel or completes the pending opacity reset immediately, then uses the existing viewport fit.
- Camera presets, Regions/Areas and isolation changes keep their existing fitting behavior and cancel an active camera return. Navigation or slider input that supersedes an exploded Reset clears its pending fade.
- Initial model load does not replay a Reset transition. A model switch disposes the old scene normally.
- Reset remains available with view lock enabled and preserves the locked preference.
- Reduced motion uses the immediate final fit without either animation. Changing the preference during a return completes it on the next frame. A late/backgrounded frame settles by elapsed time.
- `--motion-reset:650ms` lives with the existing CSS motion tokens.

## Verification

- `npm run test:reset-camera`: 11/11 passed. Tests the interpolation and actual scene-frame code, including initial continuity, exact destination, shortest orbit, mobile projection, normal/exploded mode choice, unchanged exploded pixels until transparent, single hidden reassembly, opacity-only fade-in, repeated Reset, interruption, reduced motion, initial-load gating, preset/navigation boundaries, isolation exit and locked view. Real OrbitControls instances additionally verify damping is drained for both modes without a jump or final drift.
- `npm run test:motion`: 6/6 passed, preserving the immediate selection-highlight fix and other motion contracts.
- `node --experimental-strip-types scripts/cursor-zoom.test.mjs`: 11 actual wheel-handler scenario groups passed.
- `npm run check`: passed. `npm run build`: passed in 16.55 seconds, with Vite's large-chunk warning.
- Live browser visual smoothness, GPU frame times and touch gestures were not certified; the browser-control inventory was unavailable.

Added `app/camera-return.ts`, `scripts/reset-camera.test.mjs` and this record. Updated `app/scene.tsx`, the motion token in `app/globals.css`, and the `test:reset-camera` alias in `package.json`. Canonical anatomy data and model assets are unchanged. Included in the [local main handoff](integration/LEARN_AND_VIEWER_HANDOFF_2026_11_04.md); no push or deployment is part of this delivery.
