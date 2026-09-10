# Peripheral nerve traces (Z-Anatomy → human-atlas registration)

This directory contains the reproducible pipeline that generated the
peripheral nervous system data added to `public/models/`:

- `export_nerves.py` — Blender script. Run inside Blender with a Z-Anatomy
  `.blend` open. Exports nerve curves/meshes and registration bones
  (femur, humerus, tibia, fibula, radius, ulna) in world space to JSON.
- `register.py` — solves the similarity transform (axis permutation, sign
  flips, uniform scale, offset) that maps Z-Anatomy world space onto the
  BodyParts3D-derived atlas space, using the exported bones as landmarks.
  Writes `transform.json`.
- `inject_nerves.py` — resamples the registered nerve curves (Catmull-Rom),
  sweeps tube meshes along them, packs them into a new binary chunk
  (`nerves-0.bin[.gz]`) in the same format as the body chunks, and appends
  the new parts/concepts to `atlas.json`. Idempotent: re-running replaces
  the previously injected `ZN*` entries.
- `transform.json` — the solved registration used for the current data.

## Usage

```bash
# 1. In Blender (Z-Anatomy .blend open):
#    open export_nerves.py in the Text editor and Run (adjust OUT path)
# 2. Register:
python register.py --export zanatomy_export.json --atlas-public public/models/atlas.json \
    --out transform.json
# 3. Inject:
python inject_nerves.py --export zanatomy_export.json --transform transform.json \
    --atlas public/models/atlas.json
```

## Provenance and licensing

- Nerve geometry traces originate from the [Z-Anatomy](https://github.com/LluisV/Z-Anatomy)
  project (Startup.blend), whose models are licensed **CC BY-SA 4.0**.
  The traces were converted to tube meshes, so the derived data in
  `public/models/nerves-0.bin[.gz]` is additionally licensed under
  **CC BY-SA 4.0** (share-alike applies to these files only).
- Coordinates, scale and chunk/parts/concepts format follow the existing
  BodyParts3D 4.0 dataset (CC BY 4.0), see `public/ATTRIBUTION.md`.
- Heuristic grouping maps Z-Anatomy object names to ~30 named peripheral
  nerves (trigeminal branches, brachial plexus, major limb nerves, etc.);
  very fine terminal branches (< 4 mm) are dropped to reduce noise.
