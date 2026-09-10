#!/usr/bin/env python3
"""Register Z-Anatomy peripheral nerve curves into human-atlas coordinates
and inject them into the atlas as tube meshes.

Outputs (next to --atlas):
  - nerves-0.bin / nerves-0.bin.gz  (new binary chunk, same layout as body chunks)
  - atlas.json updated with new parts/concepts and one extra chunk entry.

Idempotent: previously injected parts (ids starting with "ZN") and the
nerves-0 chunk entry are replaced on re-run.

Coordinates and units: the atlas is meters / Y-up; nerve curves are
transformed with the similarity solved by register.py (transform.json).
"""
import argparse, gzip, json
import numpy as np

# Grouping: pattern (lowercase substring, first match wins) -> display name.
# None drops the object (too thin / not a named peripheral nerve).
GROUPS = [
    ("maxillary nerve", "Maxillary nerve"),
    ("ophthalmic nerve", "Ophthalmic nerve"),
    ("mandibular nerve", "Mandibular nerve"),
    ("trigeminal nerve", "Trigeminal nerve"),
    ("suprascapular nerve", "Suprascapular nerve"),
    ("dorsal scapular nerve", "Dorsal scapular nerve"),
    ("long thoracic nerve", "Long thoracic nerve"),
    ("pudendal nerve", "Pudendal nerve"),
    ("brachial plexus", "Brachial plexus"),
    ("deep fibular", "Deep fibular nerve"),
    ("superficial fibular", "Superficial fibular nerve"),
    ("common fibular", "Common fibular nerve"),
    ("fibular nerve", "Common fibular nerve"),
    ("deep peroneal", "Deep fibular nerve"),
    ("superficial peroneal", "Superficial fibular nerve"),
    ("median nerve", "Median nerve"),
    ("ulnar nerve", "Ulnar nerve"),
    ("radial nerve", "Radial nerve"),
    ("musculocutaneous", "Musculocutaneous nerve"),
    ("axillary nerve", "Axillary nerve"),
    ("sciatic nerve", "Sciatic nerve"),
    ("tibial nerve", "Tibial nerve"),
    ("femoral nerve", "Femoral nerve"),
    ("obturator nerve", "Obturator nerve"),
    ("saphenous nerve", "Saphenous nerve"),
    ("lateral femoral cutaneous", "Lateral femoral cutaneous nerve"),
    ("interosseous nerve", None),  # anterior/posterior interosseous: too thin, drop
    ("facial nerve", "Facial nerve"),
    ("medial plantar nerve", "Medial plantar nerve"),
    ("lateral plantar nerve", "Lateral plantar nerve"),
    ("superior gluteal nerve", "Superior gluteal nerve"),
    ("inferior gluteal nerve", "Inferior gluteal nerve"),
    ("nerve to", None),
]
THIN = ("branch", "digital", "cutaneous", "communicating", "ramus")


def classify(name):
    low = name.lower()
    side = "left" if low.endswith(".l") else "right" if low.endswith(".r") else None
    base = name[:-2].strip() if side else name
    for pat, disp in GROUPS:
        if pat in base.lower():
            return side, disp
    return side, None


def catmull_rom(pts, spacing=0.008, max_pts=160):
    """Catmull-Rom resample of a polyline (pts: n x 3)."""
    P = np.asarray(pts, dtype=float)
    if len(P) < 2:
        return None
    if len(P) > 2:
        seg = np.linalg.norm(np.diff(P, axis=0), axis=1)
        total = seg.sum()
        if total < 0.004:  # drop < 4 mm fragments
            return None
        n = int(min(max_pts, max(8, total / spacing)))
        u = np.linspace(0, len(P) - 1, n)
        idx = np.clip(u.astype(int), 0, len(P) - 2)
        frac = u - idx
        p0, p1 = P[idx], P[idx + 1]
        pm = P[np.clip(idx - 1, 0, len(P) - 1)]
        pp = P[np.clip(idx + 2, 0, len(P) - 1)]
        fv = frac[:, None]
        c0 = 2 * p0
        c1 = -pm + p1
        c2 = 2 * pm - 5 * p0 + 4 * p1 - pp
        c3 = -pm + 3 * p0 - 3 * p1 + pp
        return 0.5 * (c0 + c1 * fv + c2 * fv * fv + c3 * fv * fv * fv)
    seg = np.linalg.norm(P[1] - P[0])
    if seg < 0.004:
        return None
    n = int(min(max_pts, max(4, seg / spacing)))
    return (P[0][None] * (1 - np.linspace(0, 1, n))[:, None]
            + P[1][None] * np.linspace(0, 1, n)[:, None])


def tube(points, radius, sides=8):
    """Sweep a tube mesh along a polyline. Returns (verts, normals, faces)."""
    C = points
    tangents = np.gradient(C, axis=0)
    tangents /= np.maximum(np.linalg.norm(tangents, axis=1, keepdims=True), 1e-9)
    # parallel transport frame
    ref = np.array([0.0, 0.0, 1.0])
    if abs(tangents[0] @ ref) > 0.9:
        ref = np.array([1.0, 0.0, 0.0])
    normals = np.cross(tangents, ref)
    normals /= np.maximum(np.linalg.norm(normals, axis=1, keepdims=True), 1e-9)
    for i in range(1, len(C)):
        n_prev = normals[i - 1]
        n_raw = np.cross(tangents[i], ref)
        ln = np.linalg.norm(n_raw)
        if ln > 1e-9:
            n_proj = n_raw - tangents[i] * (tangents[i] @ n_prev)
            ln2 = np.linalg.norm(n_proj)
            if ln2 > 1e-9:
                normals[i] = n_proj / ln2
    binormals = np.cross(tangents, normals)
    ang = np.linspace(0, 2 * np.pi, sides, endpoint=False)
    ring = (np.cos(ang)[:, None, None] * normals[None, :, :]
            + np.sin(ang)[:, None, None] * binormals[None, :, :])  # sides x n x 3
    verts = np.transpose(ring, (1, 0, 2)) * radius + C[:, None, :]  # n x sides x 3
    n = len(C)
    vnorm = np.repeat(normals, sides, axis=0)  # outward-facing wall normals
    faces = []
    for i in range(n - 1):
        b0 = (i + 1) * sides
        for j in range(sides):
            j2 = (j + 1) % sides
            faces.append((i * sides + j, i * sides + j2, b0 + j))
            faces.append((b0 + j, b0 + j2, i * sides + j2))
    return np.asarray(verts).reshape(-1, 3), vnorm, faces


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--export", required=True, help="zanatomy_export.json from export_nerves.py")
    ap.add_argument("--transform", required=True, help="transform.json from register.py")
    ap.add_argument("--atlas", required=True, help="atlas.json manifest to update in place")
    args = ap.parse_args()

    z = json.load(open(args.export, encoding="utf-8"))
    t = json.load(open(args.transform, encoding="utf-8"))
    R = np.zeros((3, 3))
    for i, (src, s) in enumerate(zip(t["perm"], t["signs"])):
        R[i, src] = s
    S, O = t["scale"], np.array(t["offset"])

    # collect and transform nerve curves
    groups = {}  # (display, side) -> [(polyline, radius)]
    skipped = 0
    for obj in z["nerves"]:
        if obj["kind"] != "curve":
            continue
        side, disp = classify(obj["name"])
        if not disp or not side:
            skipped += 1
            continue
        low = obj["name"].lower()
        radius = 0.0012 if any(k in low for k in THIN) else 0.0024
        if "plexus" in low:
            radius = 0.0020
        for spline in obj["splines"]:
            pts = (R @ (np.asarray(spline).T * S)).T + O
            rs = catmull_rom(pts)
            if rs is not None:
                groups.setdefault((disp, side), []).append((rs, radius))
    print("grouped nerves:", len(groups), "skipped objects:", skipped)

    # build meshes and pack the binary chunk
    blob = bytearray()
    new_parts, new_concepts = [], []
    tri_total = 0

    def append_aligned(fmt, values):
        while len(blob) % 4:
            blob.append(0)
        off = len(blob)
        blob.extend(np.asarray(values, dtype=fmt).tobytes())
        return off

    for (disp, side), tubes in sorted(groups.items()):
        all_v, all_n, all_f = [], [], []
        off_v = 0
        for pts, radius in tubes:
            v, n, f = tube(pts, radius)
            all_f.extend([(a + off_v, b + off_v, c + off_v) for a, b, c in f])
            all_v.append(v)
            all_n.append(n)
            off_v += len(v)
        V = np.vstack(all_v)
        N = np.vstack(all_n)
        F = np.asarray(all_f, dtype=np.uint32)
        slug = disp.lower().replace(" ", "")[:8].upper()
        pid = "ZN%s-%s" % (slug, "L" if side == "left" else "R")
        lo, hi = V.min(0), V.max(0)
        pos_off = append_aligned("f4", V.reshape(-1))
        nrm_off = append_aligned("i2", np.clip(np.round(N * 32767), -32767, 32767).astype(np.int16).reshape(-1))
        idx_off = append_aligned("u4", F.reshape(-1))
        part = {
            "id": pid,
            "name": "%s (%s)" % (disp, "left" if side == "left" else "right"),
            "conceptId": pid + "C",
            "system": "nervous",
            "chunk": 0,
            "positions": pos_off,
            "normals": nrm_off,
            "indices": idx_off,
            "vertexCount": len(V),
            "indexCount": len(F) * 3,
            "bounds": [[round(float(lo[0]), 6), round(float(lo[1]), 6), round(float(lo[2]), 6)],
                       [round(float(hi[0]), 6), round(float(hi[1]), 6), round(float(hi[2]), 6)]],
        }
        new_parts.append(part)
        new_concepts.append({"id": part["conceptId"],
                             "name": disp + ("" if not side else " (" + side + ")"),
                             "elements": [pid]})
        tri_total += len(F)

    bin_bytes = bytes(blob)
    base = args.atlas.rsplit("/", 1)[0]
    open(base + "/nerves-0.bin", "wb").write(bin_bytes)
    gz_bytes = gzip.compress(bin_bytes, 6)
    open(base + "/nerves-0.bin.gz", "wb").write(gz_bytes)

    # update atlas.json (idempotent: remove previous ZN data first)
    a = json.load(open(args.atlas, encoding="utf-8"))
    old_chunk_idx = [i for i, c in enumerate(a["chunks"]) if "nerves-0" in c.get("url", "")]
    if old_chunk_idx:
        old_idx = old_chunk_idx[0]
        a["chunks"] = [c for i, c in enumerate(a["chunks"]) if i != old_idx]
        a["parts"] = [p for p in a["parts"] if not p["id"].startswith("ZN")]
        a["concepts"] = [c for c in a["concepts"] if not c["id"].startswith("ZN")]
        for p in a["parts"]:  # re-index chunks
            if p["chunk"] > old_idx:
                p["chunk"] -= 1
    a["parts"] += new_parts
    a["concepts"] += new_concepts
    new_chunk_index = len(a["chunks"])
    for p in new_parts:
        p["chunk"] = new_chunk_index
    a["chunks"].append({"url": "/models/nerves-0.bin", "bytes": len(bin_bytes),
                        "gzip": "/models/nerves-0.bin.gz", "gzipBytes": len(gz_bytes)})
    a["triangles"] = a.get("triangles", 0) + tri_total
    json.dump(a, open(args.atlas, "w", encoding="utf-8"), separators=(",", ":"))

    print("chunk_index:", new_chunk_index, "parts+:", len(new_parts),
          "concepts+:", len(new_concepts), "tris:", tri_total,
          "bin:", len(bin_bytes), "gz:", len(gz_bytes))


if __name__ == "__main__":
    main()
