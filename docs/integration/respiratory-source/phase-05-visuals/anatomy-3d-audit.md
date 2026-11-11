# Respiratory System — Proposed 3D Anatomy Companion Targets

**Status: candidate audit only; individual concept-to-mesh links have not been established.**

The current Human Atlas `app/model-registry.ts` explicitly includes `respiratory` among supported system categories in the male (`bp3d-male-4`), female study (`female-study-v3`) and HRA female reference (`hra-female-v1.5`) model registries. This is evidence that the system category is recognized, **not** verification that any specific lung, bronchus, laryngeal cartilage, or diaphragm mesh is selectable or accurate in those models.

The present Digestive lesson uses curated canonical concept IDs (`data/learn/digestive-anatomy-references.json`) and `app/learn/anatomy-companion/references.ts`. This document proposes the same workflow for Respiratory. **Do not invent IDs, infer exact anatomical segmentation from a category name, or silently substitute unrelated geometry.**

## Candidate structures

| Priority | Target | Deep Dive section | Current verification |
|---|---|---|---|
| high | Lungs (both together) | `lungs-pleura` | Not yet verified individually |
| high | Right lung | `lungs-pleura` | Not yet verified individually |
| high | Left lung | `lungs-pleura` | Not yet verified individually |
| medium | Superior lobe of right lung | `lungs-pleura` | Not yet verified individually |
| medium | Middle lobe of right lung | `lungs-pleura` | Not yet verified individually |
| medium | Inferior lobe of right lung | `lungs-pleura` | Not yet verified individually |
| medium | Superior lobe of left lung | `lungs-pleura` | Not yet verified individually |
| medium | Inferior lobe of left lung | `lungs-pleura` | Not yet verified individually |
| high | Trachea | `trachea` | Not yet verified individually |
| high | Larynx | `larynx-cartilages` | Not yet verified individually |
| high | Diaphragm | `breathing-muscles` | Not yet verified individually |
| high | Right main bronchus | `bronchial-tree` | Not yet verified individually |
| high | Left main bronchus | `bronchial-tree` | Not yet verified individually |
| medium | Nasal cavity | `nasal-cavity` | Not yet verified individually |
| medium | Pharynx | `pharynx` | Not yet verified individually |
| medium | Epiglottis | `larynx-cartilages` | Not yet verified individually |
| medium | Thyroid cartilage | `larynx-cartilages` | Not yet verified individually |
| medium | Cricoid cartilage | `larynx-cartilages` | Not yet verified individually |
| medium | Arytenoid cartilages | `larynx-cartilages` | Not yet verified individually |
| medium | Pleura | `lungs-pleura` | Not yet verified individually |
| medium | Pulmonary arteries and veins | `lungs-pleura` | Not yet verified individually |
| low | Rib cage / sternum | `breathing-muscles` | Not yet verified individually |
| low | Nasal conchae | `nasal-cavity` | Not yet verified individually |

## Intended first-pass 3D experience

1. Begin with `primarySystems: ["respiratory"]` using the actual existing Explore viewer and model identifiers. Do not initialize a second atlas data source.
2. Use thoracic and cervical framing as reasonable **candidate** context regions, then check valid region IDs in the current registry.
3. Resolve the high-priority structures against canonical concepts in the actual selected model. Record separately for male, experimental female study, and HRA female reference. Only publish a `conceptId` in the production anatomy-reference JSON after successful identity resolution and visual inspection of the geometry.
4. Start with overall lungs, right/left lungs, trachea, larynx, diaphragm and main bronchi **only where present**. Add individual lobes, cartilages, and pleura later if accurate representations exist.
5. Show informative unavailable states rather than selecting a visually similar but anatomically inaccurate part.
6. Avoid automatic camera focus on non-3D microscopic concepts. Link to gallery figures as the primary visualization for alveolar cells, respiratory membrane, gas diffusion and hemoglobin/CO₂ chemistry.
7. Make the Visualize introduction subject-specific. The current `app/learn/anatomy-companion/visualize-page.tsx` includes Digestive-specific copy, despite the generalized component signature.
8. Keep anatomy colors, lighting, and rendered model materials separate from site-level color palettes.

## Necessary audit before producing a deployable anatomy-reference file

- Inspect `public/models/atlas.json`, `atlas-female-reconstructed.json`, and any relevant HRA model manifest and crosswalk through the **actual identity index**, not a presumed ID list.
- Verify each candidate's presence, laterality, anatomical fidelity, representation count, and category in each model.
- Where available, note whether the named structure is an actual mesh, a collection, or a parent concept spanning several meshes.
- Document unresolved cases explicitly. No currently listed candidate is claimed to have a verified canonical concept ID.

## Appropriate gallery alternatives

The alveolar microstructure and air–blood membrane are represented by figure IDs `p06`, `p07`, and `p08`. Oxygen and CO₂ transport are represented by `p15`, `p16`, `p17`, and `p18`. Respiratory nervous control is represented by `p19` and `p20`. These diagrams should complement gross 3D anatomy, not be treated as hidden anatomy meshes.
