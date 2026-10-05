# Phase 5.6.2: accents and microinteractions

Date: 2026-10-05. Branch: `phase-5.6.2/microinteraction-polish`. Clean starting branch, local main and live remote main: `89a4fa1dba7632fdf62b2bef2315dd779b22b27c`, the accepted Phase 5.6.1 endpoint. Branch/status/history/tracking, preceding implementation records and current runtime were inspected. Main is unchanged. No donor merge or dependency changes.

## Dark accent

The interactive color comes from `--primary`, rather than the neutral hover token named `--accent`. Dark `--primary` changes **#88b7c5 -> #70cbd5**, a cleaner icy teal-blue. Dark `--primary-hover` changes **#a5ccd6 -> #94dce3**. `--switch-active` now references `--primary`. Dark ring changes **#a3d1db -> #94dce3**, and focus references that ring. Foreground remains **#152124**. Selected rail buttons, enabled switch tracks, slider thumbs/ranges, existing primary actions/output and focus surfaces resolve the shared tokens. Neutral hover fills, links, anatomy selection shading and semantic system colors retain their distinct roles. Light accent tokens are unchanged.

Contrast tests check filled foreground at >=4.5:1, active surfaces against charcoal at >=3:1 and focus against the background at >=3:1. Existing normal/hover/pressed/selected/focus/disabled semantics and dimensions remain; no new hover motion is added.

## Explode idle cue

`app/use-explode-idle.ts` owns event-driven eligibility and one cancellable **1,000 ms** idle timeout. The cue is eligible only at exactly zero, with no held pointer or adjustment key, after both the original shell and scene settlement. Shell settlement is still 3,800 ms; initial idle starts no earlier than 4,800 ms, and later real scene loading can postpone it. Returning to zero or activating Reset restarts the delay.

Pointer-down capture and Arrow/Home/End/Page adjustment-key capture suppress the cue immediately. Pointer-up/cancel and key-up on the window handle releases outside the control. Window blur clears held input. Value changes also restart the delay. The listeners and timeout clean up on unmount; there are no intervals or React frame updates.

Only the thumb's noninteractive `::before` halo animates. The original `::after` hit target, thumb geometry, transforms and track remain unchanged. The halo uses a **3,000 ms** cycle, existing `--motion-enter-curve`, opacity **0 -> .16 -> 0 Light / 0 -> .28 -> 0 Dark**, and halo-only scale **1 -> 1.15 -> 1**. Its inset is -5 px relative to the thumb padding box, approximately 20 -> 23 px diameter, with 4 px blur and 1 px shadow spread. The actual 16 px thumb never scales or moves. Above zero the animation is absent. Reduced motion removes the loop completely.

## Reset confirmation

The existing shared Reset action still calls `resetViewer`, including keyboard R and valid resets at zero. It increments a transient activation counter; only the keyed SVG remounts, so each activation restarts one **-360 degree** turn about its center. No timer, accumulated listener or permanent animation state is needed. Hover/focus/pointer-down do not trigger it. The existing reset semantics, button geometry and view-lock behavior remain unchanged.

The user requested a slower eased turn after seeing the initial 360 ms version. Final duration is **650 ms**, with the gentler existing **`--motion-enter-curve: cubic-bezier(.22,.45,.35,1)`**. This explicitly supersedes the brief's approximate 250-450 ms suggestion. Reduced motion suppresses the spin.

## Classic Light floor

Only the three Light material colors change:

| Material | Previous | Final |
|---|---|---|
| Surface | #d0d7dc | #dfe2e3 |
| Edge | #bcc7ce | #c8ced1 |
| Rim | #aebdc7 | #b6c1c7 |

The surface is lighter and more neutral, with a retained visible edge/rim. Dark stays #303030 / #242424 / #626260. Classic geometry, radius .56, diameter 1.12, thickness .018, cylinder Y -.014, contact -.005 and rim Y -.0049 are unchanged. Grounding, eligibility, fades, resource lifetime and every procedural preset palette remain unchanged. Procedural presets do not inherit the Classic material colors.

## 3D badge

The old badge `::after` was a one-pixel progress underline driven by real chunk completion. It is replaced by a decorative SVG rounded-rectangle stroke, `pathLength=100`, animated dash offset 100 -> 0. Real loading progress remains in the accessible preparation card; decoration never gates loading or anatomy reveal.

The badge retains its original 400-880 ms appearance. Trace starts **480 ms**, lasts **720 ms**, and travels clockwise from near the upper-left round corner. At **1,200 ms**, the completed perimeter fades over **650 ms** while one soft terminal shadow pulse rises to **.3 opacity** and returns to zero. Shadow is 5 px blur / 1 px spread. Final ordinary badge appearance returns by **1,850 ms**. Stroke/glow use Light `--ui-link` and refreshed Dark `--primary`; existing entrance easing is reused. The wordmark retains its accepted 0-900 ms timing.

The user identified a page-load rendering defect in the first implementation. Shared Badge styling enforces 12 px size on direct SVG children. The final SVG is inside a positioned decorative span, with explicit full-size SVG dimensions, so the full badge is traced instead of a small square over the text. The browser suite explicitly verifies border-box coverage.

All badge motion is scoped to the existing one-time `data-shell-settled=false` lifetime. Model, Region, Area, Random, theme and ordinary reset actions never restart it. Reduced motion immediately shows the normal badge, with no trace or glow. Decoration is aria-hidden, pointer-transparent and out of layout.

## Tests, performance and scope

New focused tests check meaningful color contrast, Light neutralization, fixed stage dimensions/Dark colors and procedural palette isolation. Native Chrome tests cover held pointer/keyboard input, release outside the slider, idle recovery, above-zero absence, stationary thumb, repeated Reset, full badge sizing, normal/reduced motion, theme persistence and navigation without replay. Two older Area pointer harnesses now use the actual Phase 5.6.1 focused viewport and model-grounding translation; runtime camera behavior is not changed.

Production delta versus the independently built starting commit: **JS +1,500 bytes / +565 gzip; CSS +2,053 bytes / +405 gzip**. No dependency, renderer frame work, shader, buffer, texture, geometry, scientific data or unrelated motion is introduced. Only the three approved cues animate. The original build warnings remain. Validation, evidence and final handoff limits are in [the validation record](PHASE_5_6_2_VALIDATION.md). No Phase 5.7 or later work is started.
