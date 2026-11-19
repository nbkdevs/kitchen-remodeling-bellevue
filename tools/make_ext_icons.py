"""Extension icon: a tape measure over a countertop corner. Run: python3 tools/make_ext_icons.py"""
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = 512


def draw():
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, S - 1, S - 1], radius=110, fill=(47, 107, 90, 255))
    # countertop L
    d.rectangle([70, 300, 442, 380], fill=(236, 226, 212, 255))
    d.rectangle([362, 120, 442, 380], fill=(236, 226, 212, 255))
    # ruler along the top edge
    d.rounded_rectangle([60, 210, 330, 262], radius=10, fill=(244, 196, 66, 255))
    for i, x in enumerate(range(78, 320, 22)):
        h = 26 if i % 2 == 0 else 14
        d.line([(x, 212), (x, 212 + h)], fill=(60, 45, 20, 255), width=5)
    # tape body
    d.rounded_rectangle([250, 150, 380, 280], radius=34, fill=(251, 246, 239, 255), outline=(60, 45, 20, 255), width=8)
    d.ellipse([290, 190, 340, 240], fill=(138, 90, 54, 255))
    return img


def main():
    master = draw()
    out = f"{ROOT}/extensions/shared/icons"
    os.makedirs(out, exist_ok=True)
    for s in (16, 32, 48, 128):
        master.resize((s, s), Image.LANCZOS).save(f"{out}/icon{s}.png")
    master.resize((300, 300), Image.LANCZOS).save(f"{ROOT}/store-graphics/edge-logo-300x300.png")
    master.resize((128, 128), Image.LANCZOS).save(f"{ROOT}/store-graphics/extension-icon-128.png")
    print("extension icons written")


if __name__ == "__main__":
    main()
