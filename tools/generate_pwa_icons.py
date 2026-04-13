from __future__ import annotations

from pathlib import Path

from PIL import Image


def generate_icons(src: Path, out_dir: Path) -> None:
    img = Image.open(src).convert("RGBA")
    size = max(img.size)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(img, ((size - img.size[0]) // 2, (size - img.size[1]) // 2))

    out_dir.mkdir(parents=True, exist_ok=True)
    for s in (192, 512):
        out_path = out_dir / f"icon-{s}.png"
        resized = canvas.resize((s, s), Image.LANCZOS)
        resized.save(out_path, "PNG", optimize=True)
        print("wrote", out_path)


if __name__ == "__main__":
    repo = Path(__file__).resolve().parents[1]
    src = repo / "public" / "images" / "BabyCareLogo.png"
    out_dir = repo / "public" / "icons"
    generate_icons(src, out_dir)

