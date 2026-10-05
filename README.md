# Human Atlas Enhanced

An expanded open-source 3D anatomy explorer built on [ashemag/human-atlas](https://github.com/ashemag/human-atlas), with a focus on model-aware anatomy, dissection, navigation, discoverability, and a more polished scientific-visualization experience.

**[Open the live atlas](https://anatomy.neutrino.live)**

The project currently includes the original **BodyParts3D adult male reference anatomy** and an **experimental derived female study model**. It is intended for education and exploration, not diagnosis, surgery, or clinical decision-making.

## What this fork adds

Compared with the original viewer, this fork now includes:

- **Male and female-study models** with model-scoped anatomical representation identity and no automatic male-to-female geometry fallback.
- **Canonical anatomy identity** separating named anatomical concepts from the individual meshes that represent them.
- **Anatomical Regions** for broad body navigation (for example: Head & Jaw, Cervical, Shoulder, Thoracic, Abdominal, Pelvic, Upper Limb, and Lower Limb), including primary and spanning memberships.
- **17 Teaching Areas** for focused educational navigation (including Orbit, Circle of Willis, Brainstem, Larynx, Brachial plexus, Axilla, Cubital region, Wrist, Hand, Pelvic region, Popliteal region, and Foot), with explicit model-specific display scopes.
- **Search + Browse** through the active model inventory, with aliases, modeled-piece counts, sorting, system filtering, and keyboard access.
- **Persistent isolation workspaces** that let users isolate an anatomical assembly, inspect its individual members, and continue dissecting without losing the workspace.
- **Per-structure dissection** with hide, restore, hidden-history tracking, keyboard controls, and model-safe representation IDs.
- **Staged anatomical explosion** that first separates major anatomical families and then progressively separates individual pieces with continuous camera behavior.
- **Random Anatomy** for quickly discovering and isolating modeled structures.
- **Display controls** for Light/Dark themes, brightness, contrast, and autorotation speed.
- **Presentation and motion polish** including coordinated entrance motion, smoother model transitions, reduced-motion support, and refined interaction feedback.
- **A bounded presentation stage** separated from anatomy geometry and ready for further scene-environment work.
- Core interactions are covered by automated and browser tests so features such as navigation, search, dissection, isolation, model switching, and exploded views can be checked as the atlas grows.

## Models and anatomy data

### Male reference

The male viewer uses **BodyParts3D 4.0**, an adult male reference anatomy containing:

- **2,234 selectable meshes**
- **3,432 named concepts**

A named concept may correspond to one mesh or to multiple source meshes. The project therefore treats anatomical concepts and rendered representations as separate identities.

### Female study model

The female option is an **experimental derived study model**, not a scanned or independently validated female reference.

It combines BodyParts3D-derived anatomy with fitted/adapted HRA female anatomy and estimated whole-body proportion changes. It is useful for exploration and development, but unresolved coverage, placement, and validation limitations remain.

Female teaching readiness intentionally remains gated pending independent anatomy review.

See:

- [`docs/female-anatomy.md`](docs/female-anatomy.md)
- [`docs/anatomy-coverage.md`](docs/anatomy-coverage.md)
- [`public/ATTRIBUTION.md`](public/ATTRIBUTION.md)

## How the atlas is organized

The viewer distinguishes several layers that are easy to conflate in a 3D anatomy application:

**Canonical concept**  
A named anatomical entity such as a liver, muscle, artery, or grouped structure.

**Representation**  
One or more model-specific meshes that visually represent that concept.

**Region**  
A broad anatomical navigation context.

**Teaching Area**  
A focused educational/station-style grouping with explicit model-specific geometry scope.

**Isolation workspace**  
A temporary set of representations the user explicitly isolates for inspection and dissection.

This separation allows the male and female models to share anatomical knowledge without pretending their geometry is interchangeable.

## Explore

You can:

- orbit and zoom the anatomy
- switch between male and female-study models
- enable or disable anatomical systems
- navigate by Region
- navigate by Teaching Area
- search or browse modeled structures
- inspect multi-piece anatomical concepts
- isolate structures and assemblies
- hide and restore individual structures
- progressively explode anatomy from assembled body to separated pieces
- use Random Anatomy to discover structures
- adjust theme, brightness, contrast, and autorotation

## Run locally

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open the local URL reported by Vite.

Build the static site with:

```sh
npm run build
```

## Validation

The repository contains automated checks for the anatomy manifests, canonical identity system, model-specific mappings, Regions, Teaching Areas, discovery, dissection, isolation, presentation, and explode behavior.

Common commands include:

```sh
npm run check
npm test
npm run build
```

Additional validators and browser-smoke suites live under [`scripts/`](scripts/).

## Scientific status

The project preserves source provenance and has increasingly strict structural validation, but the complete atlas has **not yet undergone a comprehensive independent scientific audit**.

Known upstream and model-level classification, naming, mapping, laterality, regional-membership, and placement questions are being treated separately from UI development. The project should therefore be understood as an evolving educational/scientific visualization system rather than a clinically validated anatomical reference.

A future scientific-audit phase is intended to systematically review:

- upstream issues, pull requests, forks, and known corrections
- system assignments
- names and identifiers
- laterality
- canonical concept ↔ representation mappings
- Region memberships
- Teaching Area memberships
- gross spatial placement and context
- male/female discrepancies

Confirmed corrections will be provenance-backed rather than silently inferred.

## Project direction

The current development sequence is intentionally layered:

1. **Viewer foundation** — identity, models, Regions, Teaching Areas, discovery, dissection.
2. **UI / UX refinement** — isolation, staged explosion, presentation, motion, scene controls.
3. **Scientific validation** — systematic audit of anatomy configuration and known community findings.
4. **Knowledge buildout** — sourced anatomical descriptions, terminology, relationships, function, supply, innervation, and related educational data.

The long-term goal is to move beyond a 3D object viewer toward an interactive anatomical knowledge system where selecting anatomy can eventually explain what it is, where it is, how it relates to surrounding structures, and why it matters.

## Provenance and attribution

This repository is an enhanced fork of:

**[ashemag/human-atlas](https://github.com/ashemag/human-atlas)**

The original application is built around BodyParts3D anatomy and is released under the MIT License. Anatomy datasets and third-party sources retain their own licenses and attribution requirements.

Full anatomy-source credits, licenses, and adaptation notes are maintained in:

[`public/ATTRIBUTION.md`](public/ATTRIBUTION.md)

Please preserve source attribution when redistributing anatomy data.

## License

Application code is released under the [MIT License](LICENSE).

Anatomy data is subject to its source-specific licensing and attribution requirements; see [`public/ATTRIBUTION.md`](public/ATTRIBUTION.md).
