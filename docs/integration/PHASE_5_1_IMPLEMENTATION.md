# Phase 5.1: isolation workspace hardening and dissection semantics

Date: 2026-10-04. Branch: `phase-5.1/isolation-workspace`. Base: `0de072c9f2de425565ac9ef0a8d04c17a963a83b`, the completed Phase 5.0 endpoint. Live remote main remains `c90224609a9bd338ba4cca4a3f9fd2642a7a573d` (Phase 4.9). The user explicitly authorized using `0de072c` and waived the merged-main prerequisite. No merge into main is performed. The pre-existing untracked `.vscode/settings.json` is preserved and excluded from delivery.

## Before-change audit

The original pre-4.9 defect restored ordinary body visibility after a direct assembly-member pick; earlier Included selection could narrow to the child. Phase 4.9 already froze model-bound isolation RepresentationIds independently of inspection, routed direct and Included member selection through the same helper, and fitted the original scope rather than the selected member. Phase 5.0 retained those fixes and introduced stable explode layouts.

Before modifying production code, native desktop Chrome audited both routed models on the exact base. Evidence: `work/phase-5.1/baseline-complete/report.json` and its screenshots. Male Abdomen has 24 pieces; female has no selectable exact Abdomen entry, so its available 15-piece Abdomen Proper assembly is used. Muscle Of Pectoral Girdle has 22 pieces on both models.

Direct triangle picks and Included member choices already updated the inspector/highlight while retaining every original workspace piece and the camera. Male direct examples included Right external oblique and Right pectoralis minor; female examples included Right psoas major and Right pectoralis minor. Those behaviors are preserved.

Defects reproduced: Clear selection returned to ordinary body counts (male 2,217; female 2,239). H discarded the workspace and returned to the body minus the selected hidden member (2,216 / 2,238). The isolated-child inspector offered only exit, with no explicit narrowing control. Source audit also found that inspector-open state participated in the isolation camera key, so panel closure could refit an unchanged workspace.

Ordinary male Abdomen search displays 2,218 pieces because the reviewed selected exception adds one piece excluded by default Systems; it does not isolate. Background clicks are an established no-op. Model switching clears transient selection, isolation and hidden IDs and re-resolves canonical navigation against the destination identity. Search/Browse selection is the existing explicit discovery navigation action and exits isolation; it does not derive a new workspace. These navigation semantics remain unchanged.

## State and visibility authority

`SceneState.isolatedRepresentationIds` is the persistent, transient, model-bound workspace membership. `isolatedPartIds` is its memoized exact current-model lookup for rendering. `state.selected` is the independent active inspection list in current-model source parts; its equivalent active-selection RepresentationIds are obtained through `representationIdsForPartIds(identity, state.selected)`. The selected concept/name lives in the existing inspector `chosen` record. No canonical dataset is modified and no new authority/cache is introduced.

`isolateSelection` resolves only known current-model selected parts and captures their RepresentationIds. It enters or explicitly replaces the workspace, including narrowing to a child or a multi-representation selection. An empty/unresolved selection cannot establish a new scope. `exitIsolation` is a separate explicit operation. The legacy `toggleIsolation` helper delegates to these operations for compatibility; the UI uses the two distinct actions.

Hidden IDs remain independent of membership. The unchanged centralized resolver gives hidden/unloaded exclusions highest precedence, then applies the frozen isolation scope. Existing explicit-isolation precedence over ordinary Systems/Region/Area/chest exclusions is retained. Outside isolation, selected exceptions and Phase 4.7 Area-over-Region precedence are unchanged. This preserves the existing product semantics rather than imposing a different mathematical filter intersection.

## Interaction and dissection

| Action | Result |
|---|---|
| Direct visible-member pick | Existing `selectAssemblyMember` updates the active member/inspector, restores only the selected representations if necessary, and retains the frozen parent scope. |
| Included Structures | Uses the same member semantics, retains the complete parent member list and now exposes `aria-pressed` for the active row. No automatic child isolation. |
| Repeated A/B/C/A inspection | Scope and hidden history remain independent; only active inspection/highlight changes. |
| H / Hide structure | The same guarded callback unions every selected current-model RepresentationId into hidden state, clears active selection/chosen record, stops rotation and closes the inspector. It now retains isolation membership, even if the visible workspace becomes empty. |
| Individual Restore | Removes only its hidden override. The member returns subject to the current workspace; it does not select the restored member or return the body. |
| Restore all | Clears hidden overrides only. Even an entirely hidden workspace returns as that workspace. UI location is unchanged. |
| Clear selection | `clearActiveSelection` clears active selection/inspector state while leaving isolation and dissection intact. |
| Background click | Existing no-op; does not exit the workspace. |
| Isolate structure on a child | Explicitly replaces the workspace with that child's current-model representations and assembles explosion. |
| Show surrounding anatomy | Clears the workspace, assembles explosion and retains the active selection when present. Ordinary reviewed filters and selected exceptions resume; hidden IDs remain hidden. |
| Search/Browse | Existing explicit navigation exits isolation and atomically selects/restores only its resolved current-model representations. No discovery architecture change. |
| Region / Area / Systems / Reset | Existing explicit navigation cleanup is retained. Same-model navigation preserves dissection; Reset clears it. |
| Model switch | Existing model cleanup discards scope and hidden state. No concept-name mapping, foreign RepresentationId reuse or male geometry fallback. |

The H guard continues to reject input/textarea/select, contenteditable and editable ARIA roles/ancestors, modifiers, composition, repeats and handled events. Hidden representations have neither GPU highlight nor display/picker/packing eligibility. After hide there is deliberately no active inspector selection; the workspace remains available for another real member pick or restore.

## Minimal UI and camera changes

The inspector retains its layout and now exposes **Isolate structure** and, while isolated, a separate **Show surrounding anatomy** action. The same exit action is reachable beside the existing scene caption when inspection is cleared or closed. Its pointer-enabled, 44px minimum-height control prevents an empty workspace from trapping the user. Search, Visibility, rail, toolbar and Explode dock designs are unchanged.

`isolationCameraKey` contains only frozen scope membership, reset counter and viewport aspect. Active member, hidden overrides and inspector-open state do not participate. Entry, explicit narrowing, exit, resize and existing view/reset actions may frame anatomy. Ordinary inspection, hide, restore, clear selection and closing/reopening inspection retain the manual camera. The existing initial isolated fit still accounts for the inspector's available space; closing it does not silently reframe.

No camera fit or explosion equation is rewritten. The Phase 5.0 layout key still derives from current-model eligible geometry and navigation focus, without active selection as an independent input. Selection-only changes in a stable workspace preserve every actual GPU offset. Hide legitimately removes eligibility; restore reconstructs the original deterministic targets. No packing-cell, family-stage or camera jump is introduced by inspection.

## Scope and delivery inventory

Created: `scripts/isolation-workspace.test.mjs`, `scripts/isolation-workspace-browser-smoke.mjs`, and the two Phase 5.1 integration records.

Modified: `app/anatomy.ts` (state-contract comment), `app/viewer-interaction.ts`, `app/hide-restore.ts`, `app/page.tsx`, `app/scene.tsx`, `app/globals.css` (exit control only), `package.json` (two test aliases), `scripts/hide-restore.test.mjs`, `scripts/presentation.test.mjs`, and retained browser harnesses for Regions, Areas, hide/restore, interaction, explicit Area scopes and discovery. Older expectations now use explicit exit after asserting that clear/hide preserves the workspace; existing substantive navigation, rendering and data assertions remain.

No geometry/models/manifests, identity, Regions, canonical Area membership, Area representation scopes, scientific evidence, dependency version or lockfile changes. No history stack, persistent Restore-all footer, J shortcut, autorotate-speed control, Random Anatomy, inspector scroll-reset work, Reset hover work, floor preset, discovery visual cleanup, advanced motion, supplemental anatomy, nerves, HRA upgrades, knowledge ingestion or later phase is included.

Female-study and internal HRA representation behavior are tested independently. Female readiness remains `integrityPassed: true`, `ready: false`; engineering acceptance does not certify anatomical validity. Validation evidence and exact limitations are in `PHASE_5_1_VALIDATION.md`.
