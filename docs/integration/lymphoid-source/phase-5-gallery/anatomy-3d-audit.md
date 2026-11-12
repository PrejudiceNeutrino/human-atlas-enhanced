# Lymphoid Visualize — proposed 3D anatomy targets

This is a candidate shortlist for the eventual **Learn → Lymphoid → Visualize** page and anatomy-aware Deep Dive links, not an inventory claiming that every target exists as a selectable mesh.

## What is verified

Human Atlas `app/model-registry.ts` currently lists the **lymphatic** anatomical system among the available systems for the adult male BodyParts3D reference, the experimental female study model, and the HRA female reference. The existing Digestive Visualize feature shares the full Explore renderer and uses canonical concept IDs resolved to real model-specific meshes.

**What has not been verified:** a corresponding canonical concept ID, mesh representation, or camera target for each organ below. The current remote atlas manifest was not available for a complete item-level audit in this stage. None of the proposed targets is falsely assigned a made-up ID. Codex must resolve them against the model-specific manifests before enabling organ shortcuts.

## Priority gross-anatomy targets

| Candidate | Deep Dive section | Recommendation |
|---|---|---|
| Spleen | `spleen` | First priority; visually valuable as a distinct organ, if a supported mesh exists |
| Thymus | `thymus` | First priority; verify coverage because its size changes with age |
| Cervical, axillary, and inguinal lymph nodes | `lymph-node` | Verify each actual node/group separately, with model-specific identity |
| Thoracic duct | `trunks-ducts` | High-value drainage-pathway target, only if separately modeled |
| Right lymphatic duct | `trunks-ducts` | Valuable contrast with thoracic duct; may be too small to select |
| Cisterna chyli | `trunks-ducts` | Candidate only; normal anatomy and model granularity vary |
| Palatine and pharyngeal tonsils | `tonsils-and-malt` | Candidate gross structures, if actually represented |
| Appendix | `tonsils-and-malt` | Optional site of mucosal lymphoid tissue; use existing anatomy if mapped |

## Prefer diagrams and microscopy

Lymphatic endothelial flap valves, spleen red and white pulp, thymic cortical selection, germinal centers, Peyer's patches, individual B/T/NK cells, antigen processing, MHC complexes, complement proteins, and antibodies are **not suitable for claiming direct gross-body 3D visualization**. Use the extracted histology and physiology figures instead, unless an actual separate validated microscale visualization is added later.

## Integration requirements

Use `anatomy-3d-candidates.json` for a starting audit list, then resolve against the active `IdentityIndex` and `MODEL_REGISTRY`. Store only confirmed canonical IDs in the eventual subject-specific anatomy references. Provide a working full-lymphatic-system view before adding unverified organ-level buttons. Never substitute arbitrary meshes through loose display-name matching or silently borrow geometry from the male model for the female model.

This is the outcome of the Stage 5 source inspection and GitHub architecture check; no site code has been altered.
