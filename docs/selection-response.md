# Selection highlight response — 2026-11-04

The user reported a noticeable sub-second delay in the green anatomy highlight. The click handler runs on pointer release after tap/orbit discrimination; there is no selection debounce or model reload. A newly selected part previously began with a zero selection byte and eased toward 255 over the shared 120ms fast-motion duration. The first state-update frame could therefore show almost no highlight, with full feedback arriving over subsequent rendered frames.

`app/scene.tsx` now sets newly selected, displayed parts to 255 during the first state-buffer update. Previous selections retain the existing fade-out. Reduced motion, hidden geometry, loading, model-specific selection and Context Reveal rules retain their behavior. Picking, geometry, rendering quality, navigation and the inspector are unchanged by this fix.

## Investigation

An offline CPU benchmark loaded the actual male model's picker geometry: 2,234 meshes and 2,288,268 triangles. Eight front/side rays aimed at the bilateral external oblique and serratus bounding-box centers used the same visibility rules, bounding-box broad phase and Three.js exact triangle intersection as the current picker. After warm-up, the median picking times were 5.23–14.81ms across the sampled rays, with the slowest individual sample 19.28ms. These measurements exclude React commits, GPU drawing, event scheduling and browser/device overhead; they are not click-to-paint measurements or a reproduction of the user's precise camera.

The picker also performs exact tests on intersected boxes behind an already found nearer surface. An experimental distance-sorted/pruned traversal preserved all eight sampled results and reduced these median CPU times to 0.65–2.83ms. That experiment remains in ignored `work/selection-profile.mjs` and `work/selection-profile.json`; it was **not integrated**. Proper production integration would need broader parity coverage, particularly Reveal target priority, ties, inside-box rays and wheel anchoring.

Additional CPU probes measured the selected-state visible counter at a 0.70ms median, the unchanged packing-layout key at 0.51ms, and a new layout at 6.45ms. Layout rebuilding is conditional on membership/key changes. None of these offline measurements establishes the cause of an unmeasured longer browser stall.

## Validation

- `npm run test:motion`: 6/6 passed, including the actual scene texture-update block before any interpolation frame, interrupted fade-out/reselection, old-selection fade-out, reduced motion, loading and hidden-part behavior.
- `npm run test:context-reveal`: 17/17 passed, including model-scoped visibility, lifecycle, picking priorities, rendering queues and sparse uploads.
- `npm run check`: passed. `npm run build`: passed in 15.15 seconds, with Vite's large-chunk warning.
- End-to-end browser/GPU latency and visual response were not measured because browser-control inventory was unavailable. This fix removes the explicit fade-in; it does not certify that every source of selection latency has been eliminated.
