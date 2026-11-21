# Phase 6 — Canonical anatomical knowledge POC v2

**Status:** draft scientific/architectural POC, not ready to merge or publish as scientifically reviewed material.

## Why the first POC was replaced

The previous pilot matched anatomical facts using source FMA identifiers and (for the right hepatic biliary tree) a display-name fallback. This is unacceptable for a scalable knowledge system. The actual `right hepatic biliary tree` source concept is `FMA71857`, mapped to **`atlas:concept:002797`**. The correct crosswalk already exists. V2 uses only pinned canonical IDs to identify records and relation endpoints. The old pilot file, name-based resolver and temporary inspector modifications were removed. The frontend remains on the pre-pilot appearance until Codex implements the v2 inspector.

## Core design

`data/anatomy/knowledge/poc-v2.json` is an illustrative, source-linked dataset with 20 distinct canonical concept records and 18 directed relationships. `app/anatomy-knowledge-v2.ts` defines the typed lookup, side-aware inherited fields and relationship adjacency. The relationship ID joins two canonical concept IDs, has a typed predicate, and carries citations and a review status. **Never infer a relationship from matching names or arbitrary source-mesh membership.**

These 20 records demonstrate muscles, a bone, an artery, a nerve, organs, a duct, a duct network and a teaching group; the group and nerve are deliberately knowledge-only. Knowledge-only IDs `atlas:concept:005387` and `atlas:concept:005388` are **prototype-reserved**, immediately after the highest pinned canonical ID. Before adding new datasets, provide a persistent knowledge-concept registry independent of generated mesh IDs, and migrate the prototype aliases without collisions. Do not modify `public/identity/core-crosswalk-v1.json` or the pinned source model manifests merely to add knowledge-only concepts.

When a sided structure inherits from a common anatomical record, its own canonical ID and terminology remain separate. V2 fills in missing typed fields from its parent and keeps sided-specific overrides. Relations explicitly targeting a right or left structure must preserve their side. Do not automatically mirror a right-sided edge to the other side; bilateral facts require separate reviewed edges. The POC does not yet provide a full semantic inheritance and member aggregation engine.

## Schema design decisions

* A base concept carries ID, source IDs, anatomical kind, system, terminology, summary, definition, development, and review state.
* Structure-specific `details` fields are typed (muscle: origin, insertion, innervation, actions; nerve: roots, course, motor/sensory distribution; bone: landmarks, articulations, attachments; artery: origin, course, territory; organ: internal organization and physiology; duct: drainage and branches; group: members). Separate fields when meanings differ: an artery's `origin` is not muscle attachment `origin` at the display layer.
* Every prose field is an independent assertion with `sourceIds` and `review`. Candidate factual assertions may be uncited initially but cannot be promoted to reviewed without adequate targeted evidence.
* Each source describes its type, URL, attribution/reuse status, and editorial use. A bibliographic source listed for a record is not proof of verification of every fact. Candidate Latin terms do not become TA2-verified until cross-checked against an individual official terminology entry.
* Relationships are a typed directed graph. An incoming relation is visible on the destination's detail panel with a grammatical reverse label; do not invent the anatomical inverse of a predicate without review. Clicking a relation navigates by canonical ID, not display name.
* Include knowledge-only navigation. If no verified representation exists for the current model, show its textual inspector and a clear `3D geometry unavailable in this model` status. Never borrow an unrelated model's meshes or change model sex invisibly.
* Clinical relevance can be displayed as a short sourced note, but pathology, pharmacology, and disease entities belong in separate future collections linked by canonical IDs.

## UI/UX acceptance demonstration

1. Select **Right supraspinatus** in the male viewer; show appropriate origin, insertion, actions, nerve, supply, hierarchy/context and references. A distinct right identity inherits shared anatomical facts.
2. Click **Suprascapular nerve** through a canonical `innervated-by` relationship; open a text-only concept with its description, nerve-specific fields and visible warning that no geometry exists in this model.
3. On that nerve entry, list **Right supraspinatus** and **Right infraspinatus** as incoming anatomical connections. Clicking either returns to the selected model's actual mesh.
4. Navigate **Right supraspinatus → Right scapula / Right humerus / Right suprascapular artery** via typed links. Show appropriate bone/artery fields, never muscle-only fields.
5. Navigate **Right hepatic biliary tree → Right hepatic duct → Common hepatic duct**, with correct independent labels and ID mappings; no English-name lookup or arbitrary first-mesh inheritance.
6. Navigate a structure shared by the male and experimental female study models. Knowledge is shared by canonical concept when IDs agree, but the available 3D representation is specific to the active model. Preserve the female experimental warning.
7. Select a structure without a curated record. Keep the existing system-overview fallback but label it as generic and do not present it as source-reviewed anatomy. Existing scene controls, search, regions, isolation, hide/show, exploded model and camera behaviors must remain intact.
8. All claims and relations expose their source references and scientific review state. The app should not imply preliminary candidate wording is certified anatomical terminology.

## Validation and limits

Run `npm run test:knowledge-v2`, `npm run check`, `npm run build`, and the existing viewer/search/identity tests. The new JSON regression test checks canonical identities against `public/identity/core-crosswalk-v1.json`, relationship endpoint integrity, typed detail-field requirements, sourced assertions and provisional Latin status. Add UI navigation tests for clickable targets with and without mesh geometry.

The current records are **editorial candidates only**. Several illustrative fields have empty `sourceIds`, and the bibliographic URLs and licensing notes must be audited against the actual linked content. The POC is a technical demonstration, not permission to expand this into 5,386 unreviewed descriptions. Prior to production, add proper source section/page/identifier provenance, explicit source licensing and reuse decisions, terminology authority IDs, and a durable ID allocation policy for knowledge-only concepts.

## Primary project context

- `docs/integration/DATA_MODEL.md` — original canonical design.
- `app/identity-index.ts` — existing crosswalk and model-aware representation resolution.
- `app/page.tsx` — structure inspector and selection flows.
- `app/anatomy-discovery.ts` and `app/anatomy-search.ts` — search/browse and concept selection.
- `docs/integration/PROVENANCE_AND_LICENSES.md` — asset/text provenance obligations.
- `data/anatomy/knowledge/poc-v2.json` — candidate examples.
