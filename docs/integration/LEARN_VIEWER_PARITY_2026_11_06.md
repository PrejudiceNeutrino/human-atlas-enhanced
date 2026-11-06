# Learn viewer parity - November 6, 2026

The user requested Explore-like controls in Digestive Visualize and the Deep Dive Anatomy Companion, followed by fixes to panel layout, button placement and an exact match to Explore's explode dock. This is one cumulative local change following `3f0f06a` on `main`. No push or deployment is included.

## Result

- Both Learn contexts use one shared learning workspace backed by the existing `AnatomyScene`. Visibility has Systems/Hidden tabs, scoped system switches, newest-first hidden history with individual/all restore, digestive reference shortcuts, and Surrounding context. A dismissible inspector supports member selection, Hide, Isolate, exit isolation and clear selection.
- H/J/I/R/F/S/B and / use the shared shortcut dispatcher with an optional embedded boundary. Explore's default dispatcher still ignores Learn, typing, slider editing and excluded surfaces. Pointer interaction focuses the canvas stage; commands do not run from article/Notes controls.
- The camera rail provides presets, view lock, zoom, camera reset and existing rotation/speed controls. Compact companion controls wrap above the canvas; panel controls remain inside the companion and its close/collapse header stays accessible.
- Focus requests resolve through pinned canonical identities and isolate the real model-specific assembly by default. Context mode preserves the surrounding-context presentation. Model switching clears model-specific state; context inventory remains derived from the existing lesson mapping.
- Extracted `app/explosion-controls.tsx` from Explore and used it in both places. Same Button/Slider markup/classes, existing playback and idle hooks, play/pause glyphs, percentage presentation, stage marker/label, reset dimensions and confirmation animation. Embedded styling changes placement and compact padding. The generic Learn button rules exclude these shared dock buttons.
- Fixed actual embedded isolation/explosion camera budgets: canvas bounds with a 16px inset, without desktop/mobile full-screen chrome reservations. Full-screen Explore uses its existing branch.
- Fixed Visibility tabs stretching vertically, content overflow, malformed text glyphs, oversized selectors and duplicated bottom controls. Shortcut help is in a popover and remains available to assistive technology from the inspection stage.

## Verification

| Check | Accepted result |
| --- | --- |
| TypeScript | Passed |
| Production build | Passed; existing chunk-size/plugin-timing warnings remain |
| Catalogue/scope and workspace tests | 8 passed: 3 real-manifest checks and 5 CPU-only UI workflows |
| Learn integration | 26 passed, including supplied reading integrity, eight companion entry actions, collapse/close focus, tab navigation and DOM accessibility |
| Shared shortcuts/hide-restore/context/explosion/camera | 86 passed across final-ui, hide-restore, context-reveal, explosion-layout and reset-camera suites; includes embedded bound-corner projection and actual explosion-fit budget checks |
| Explode playback | 7 passed, including renderer-owned progress, pause/manual/reset behavior, readiness/scope changes, reduced motion and teardown |
| Browser/GPU visual verification | Unavailable: connected inventory exposed no app/browser surfaces. User screenshots guided layout fixes and showed functioning geometry; they do not certify the final shared dock, mobile/touch behavior or GPU lifecycle |

The first playback-suite invocation encountered an esbuild filesystem sandbox denial; the same suite passed with approved execution permissions. The new UI harness was corrected to reproduce asynchronous readiness and atlas-dependent teardown. Final accepted checks supersede those intermediate harness attempts. The DOM style check loads ordinary shared CSS rules; the production build validates the full Tailwind/CSS input. No broad GPU, female-scientific-readiness or exhaustive repository suite was run.

Existing source geometry/identity/mappings and educational JSON are unchanged in the Git diff. Real-manifest scope tests retain source bounds/offsets/chunks and verify no in-memory source mutation. Digestive-only inventory remains 142 pieces in each offered model, with 266 male or 263 female-study pieces when context is included.

## Delivery

Before this commit, local `main` was 0 behind / 7 ahead of the cached `origin/main` reference. This follow-up adds one local commit. The remote reference was not refreshed and nothing was pushed or deployed.
