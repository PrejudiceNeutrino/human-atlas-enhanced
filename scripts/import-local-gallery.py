"""Install the supplied gallery locally without altering its WebP exports."""
import argparse
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import zipfile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("zip", type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    destination = root / ".local-gallery" / "digestive"
    prefix = "digestive-system-gallery/"
    with zipfile.ZipFile(args.zip) as archive:
        manifest = json.loads(archive.read(prefix + "gallery.json"))
        items = manifest["items"]
        expected_ids = [f"{group}{number:02d}" for group in ("a", "p") for number in range(1, 16)]
        if manifest["count"] != 30 or [item["id"] for item in items] != expected_ids:
            raise ValueError("Expected all 30 curated figures in their supplied order.")
        # Validate every asset before writing any files. Pillow only decodes; no exports are regenerated.
        from PIL import Image
        for item in items:
            for field, folder in (("image", "images"), ("thumbnail", "thumbnails")):
                relative = item[field]
                if relative != f"{folder}/{item['id']}.webp":
                    raise ValueError(f"Unexpected asset path: {relative}")
                content = archive.read(prefix + relative)
                with Image.open(io.BytesIO(content)) as image:
                    if image.format != "WEBP":
                        raise ValueError(f"Not WebP: {relative}")
                    image.load()
                    if field == "image" and image.size != (item["width"], item["height"]):
                        raise ValueError(f"Dimensions differ: {relative}")
                if field == "image" and hashlib.sha256(content).hexdigest() != item["sha256"]:
                    raise ValueError(f"SHA-256 differs: {relative}")
        for entry in archive.infolist():
            if entry.is_dir():
                continue
            if not entry.filename.startswith(prefix):
                raise ValueError("Unexpected archive root.")
            relative = PurePosixPath(entry.filename[len(prefix):])
            if relative.is_absolute() or ".." in relative.parts or "\\" in str(relative):
                raise ValueError("Unsafe archive path.")
            target = destination.joinpath(*relative.parts)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(archive.read(entry))
    # Preserve existing environment settings and enable only this local development feature.
    env = root / ".env.local"
    lines = env.read_text(encoding="utf-8").splitlines() if env.exists() else []
    key = "HUMAN_ATLAS_LOCAL_GALLERY"
    lines = [line for line in lines if not line.startswith(key + "=")]
    lines.append(key + "=1")
    env.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("Installed 30 full-size WebPs and 30 thumbnails; hashes and decoded dimensions verified.")
    print("Original metadata, source notes and reference previews retained in .local-gallery/digestive/.")
    print("Local gallery enabled in ignored .env.local. Restart npm run dev to load the configuration.")


if __name__ == "__main__":
    main()
