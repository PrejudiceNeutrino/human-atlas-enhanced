#!/usr/bin/env python3
"""Solve the Z-Anatomy -> human-atlas coordinate transform and validate it.

Uses bounding boxes of six landmark bones (left/right femur, humerus,
tibia, fibula, radius, ulna) to search axis permutations x sign flips x
uniform scales. Mirrors are rejected (determinant must stay +1) so that
left/right chirality is preserved. Writes transform.json with the best
registration (perm, signs, scale, offset) plus per-bone residuals.
"""
import argparse, itertools, json
import numpy as np

BONE_MAP = {  # Z-Anatomy base name -> atlas part names
    "femur": ["Left femur", "Right femur"],
    "humerus": ["Left humerus", "Right humerus"],
    "tibia": ["Left tibia", "Right tibia"],
    "fibula": ["Left fibula", "Right fibula"],
    "radius": ["Left radius", "Right radius"],
    "ulna": ["Left ulna", "Right ulna"],
}
SIDE = {".l": "left", ".r": "right", ".m": "left"}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--export", required=True, help="zanatomy_export.json from export_nerves.py")
    ap.add_argument("--atlas", required=True, help="atlas.json manifest (public/models/atlas.json)")
    ap.add_argument("--out", default="transform.json", help="output transform.json")
    args = ap.parse_args()

    z = json.load(open(args.export, encoding="utf-8"))
    a = json.load(open(args.atlas, encoding="utf-8"))

    # atlas part bounds
    atlas_bones = {}  # (basename, side) -> np 2x3 bounds
    for p in a["parts"]:
        for base, names in BONE_MAP.items():
            if p["name"] in names:
                side = "left" if "left" in p["name"].lower() else "right"
                atlas_bones[(base, side)] = np.array(p["bounds"])

    # Z-Anatomy bone bounds
    za_bones = {}
    for b in z["bones"]:
        base_full = b["name"].split(".")[0].strip().lower()
        suffix = b["name"][-2:].lower()
        side = SIDE.get(suffix)
        base = base_full.replace(" muscle", "")
        if base in BONE_MAP and side and (base, side) not in za_bones:
            v = np.array(b["verts"])
            za_bones[(base, side)] = np.array([v.min(0), v.max(0)])

    pairs = [(k, za_bones[k], atlas_bones[k]) for k in za_bones if k in atlas_bones]
    print("matched pairs:", len(pairs), [k for k, _, _ in pairs])
    if len(pairs) < 4:
        raise SystemExit("not enough landmark bones matched")

    best = None
    for perm in itertools.permutations(range(3)):
        for signs in itertools.product([1, -1], repeat=3):
            R = np.zeros((3, 3))
            for i, (src, s) in enumerate(zip(perm, signs)):
                R[i, src] = s
            det = np.linalg.det(R)
            if abs(det - 1) > 1e-6:  # preserve handedness (mirrors swap left/right)
                continue
            for scale in (0.001, 0.0005, 0.002, 0.01, 0.1, 1.0):
                c_err, s_err = [], []
                for k, zb, ab in pairs:
                    tzc = (zb[0] + zb[1]) / 2 * scale
                    tzc = R @ tzc
                    ac = (ab[0] + ab[1]) / 2
                    tzsize = np.sort((zb[1] - zb[0]) * scale * np.abs(R).sum(0))
                    asize = np.sort(ab[1] - ab[0])
                    c_err.append(np.abs(tzc - ac).max())
                    s_err.append(np.abs(tzsize - asize).max() / max(asize.max(), 1e-6))
                score = np.mean(c_err) + np.mean(s_err) * 0.5
                if best is None or score < best[0]:
                    best = (score, perm, signs, scale, np.mean(c_err), np.mean(s_err))

    score, perm, signs, scale, c_err, s_err = best
    R = np.zeros((3, 3))
    for i, (src, s) in enumerate(zip(perm, signs)):
        R[i, src] = s
    print("BEST score=%.5f perm=%s signs=%s scale=%s center_err=%.4f size_err=%.4f"
          % (score, perm, signs, scale, c_err, s_err))

    # offset: mean center difference over all paired bones
    offs = []
    for k, zb, ab in pairs:
        offs.append((ab[0] + ab[1]) / 2 - R @ ((zb[0] + zb[1]) / 2 * scale))
    offset = np.mean(offs, axis=0)
    print("offset:", offset.tolist())

    for k, zb, ab in pairs:
        lo, hi = R @ (zb[0] * scale) + offset, R @ (zb[1] * scale) + offset
        d = np.abs(lo - ab[0]).max(), np.abs(hi - ab[1]).max()
        print("  %-18s max_corner_err=%.4f m" % ("/".join(k), max(d)))

    json.dump({"perm": list(perm), "signs": list(signs), "scale": scale,
               "offset": offset.tolist(), "score": float(score)},
              open(args.out, "w"), indent=1)
    print("saved", args.out)


if __name__ == "__main__":
    main()
