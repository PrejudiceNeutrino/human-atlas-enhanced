#!/usr/bin/env python3
# Export nerve curves/meshes + registration bones from a Z-Anatomy .blend
# (world space). Run inside Blender's Text editor with the Z-Anatomy
# Startup.blend open; adjust OUT below if needed.
import bpy, json

OUT = "zanatomy_export.json"

BONE_KEYS = ["femur", "humerus", "tibia", "fibula", "radius", "ulna"]

out_nerves, out_bones = [], []
for o in bpy.data.objects:
    n = o.name.lower()
    is_nerve = ("nerve" in n or "plexus" in n)
    is_bone = any((" " + k) in n or n.startswith(k) or (".l" in n or ".r" in n) and k in n for k in BONE_KEYS)
    if is_nerve and o.type == "CURVE":
        mw = o.matrix_world
        splines = []
        for s in o.data.splines:
            if s.type == "BEZIER":
                pts = [tuple(mw @ bp.co) for bp in s.bezier_points]
            elif s.type == "POLY":
                pts = [tuple(mw @ p.co) for p in s.points]
            else:
                continue
            if len(pts) >= 2:
                splines.append([list(p) for p in pts])
        if splines:
            out_nerves.append({"name": o.name, "kind": "curve", "splines": splines})
    elif o.type == "MESH" and (is_nerve or is_bone):
        ev = o.evaluated_get(bpy.context.evaluated_depsgraph_get())
        me = ev.to_mesh()
        if not me:
            continue
        mw = ev.matrix_world
        verts = [list(mw @ v.co) for v in me.vertices]
        faces = [list(f.vertices) for f in me.polygons]
        rec = {"name": o.name, "kind": "mesh", "verts": verts, "faces": faces}
        (out_nerves if is_nerve else out_bones).append(rec)
        ev.to_mesh_clear()

# keep only whole bones (skip numerous small fragments): short names without "of"/branch
keep = [b for b in out_bones if len(b["name"]) < 40 and " of " not in b["name"]]
json.dump({"nerves": out_nerves, "bones": keep}, open(OUT, "w"))
print("NERVES", len(out_nerves), "BONES_KEPT", len(keep))
