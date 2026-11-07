# Learn discovery polish — November 6, 2026

This cumulative handoff covers every change after `136c874fa7dcab66f2f14d95ec0cd3ba2461f145` (`feat: add Gallery label practice and curator tools`) on `feature/gallery-label-practice`. The underlying Label Practice implementation and 272-answer annotation collection are already in that baseline. This follow-up is a local commit only, with no push, main merge, or deployment. After this commit, the branch is two commits ahead and zero behind the local `origin/main` reference at `5fed14cde56c7f451e10d2ca81dac1a3aaf117a2`.

## Gallery introduction

Added a small tutorial below the Gallery introduction:

> For a quick self-test, look for Label Practice when viewing a figure. Name each covered structure, then click or tap a cover to reveal the answer.

An inline preview uses the same Tags icon, Label Practice text, themed surface, border, and rounded shape as the viewer control. It is a noninteractive span, so it does not add a misleading action or keyboard stop. The icon is decorative to assistive technology. Inline wrapping keeps the tip compact on narrower screens.

Files: `app/learn/gallery/page.tsx`, `app/learn/gallery/gallery.css`.

## Automatic launch-badge expiry

The Visualize and Gallery **New** badges now share a fixed cutoff of **Wednesday, November 11, 2026, at 12:00 a.m. Eastern** (`2026-11-11T00:00:00-05:00`, or `05:00 UTC`). The user's explicit Wednesday target determines the date.

Initial rendering compares the browser clock with that instant. A timer removes the badges from an already open page without a refresh or new build. Long delays are bounded to the browser timer limit and rechecked, and unmounting clears the timer. This is a shared calendar deadline, not a four-day period that restarts for each visitor. It uses the device clock and stores no visit or progress data.

Added a Learn UI regression covering both badges just before the cutoff, expiry on an open page, and a fresh page opened at the cutoff. The context-menu navigation assertion now checks the stable Visualize title rather than requiring temporary badge text, so that test remains valid after Wednesday. Tab order, navigation, and Coming Soon labels are unchanged.

Files: `app/learn/subject-tabs.tsx`, `scripts/learn.test.mjs`, `scripts/learn-context-menu.test.mjs`, `docs/learn.md`.

## Study Tools description

Replaced the subject/chapter metadata under the Study Tools heading with an explanation of the available activities and topic filtering:

> Test your understanding with multiple-choice questions, fill-in-the-blank practice, and flashcards. Review key terms in the glossary, or choose a topic to focus your study.

File: `app/learn/study-tools/page.tsx`. Authored question banks, topic counts, activity behavior, progress storage, and source metadata are unchanged.

## Verification and limits

- `npm.cmd run check`: passed after all application changes.
- `npm.cmd run build`: passed after all application changes; existing scene chunk-size and Vite plugin-timing warnings remain.
- `npm.cmd run test:gallery`: 11 passed after the Gallery tutorial change.
- `npm.cmd run test:learn`: 27 passed after the badge expiry change, including the new controlled-clock regression.
- `npm.cmd run test:learn-context-menu`: eight passed after removing the navigation test's dependency on the temporary badge.
- `git diff --check`: passed.

The three focused suites passed during this change set before the final Study Tools paragraph edit; they were not repeated for that text-only change. Type checking and production build cover the final application state. No new browser or physical-device checks were run for this follow-up; the prior Label Practice browser results belong to the [baseline delivery](GALLERY_LABEL_PRACTICE_2026_11_06.md). This follow-up does not extend that browser certification.

The React review checked timer cleanup, lazy initial state, fixed-time comparison, stable navigation labels, and the tutorial's noninteractive semantics. Source images, annotation data, learning content, dependencies, and saved user preferences were not changed. Documentation links in Learn, the curator guide, and Study Tools point to this handoff.
