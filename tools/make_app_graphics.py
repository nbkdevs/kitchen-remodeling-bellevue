"""Amazon/Play graphics from the real app screenshots (store-graphics/raw, made by
app/screenshots/screenshots_test.dart): phone screenshot folders and the 1024x500 feature graphic.
Run: python3 tools/make_app_graphics.py"""
import os
import shutil

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
G = os.path.join(ROOT, "store-graphics")
RAW = os.path.join(G, "raw")
FONT = "/usr/share/fonts/truetype/sand-box/google/Roboto/Roboto-VariableFont_wdth,wght.ttf"


def font(size, weight):
    f = ImageFont.truetype(FONT, size)
    f.set_variation_by_axes([weight, 100])
    return f


def main():
    for size in ("1080x1920", "800x1280"):
        out = os.path.join(G, f"phone-{size}")
        os.makedirs(out, exist_ok=True)
        for n in sorted(os.listdir(RAW)):
            if n.endswith(f"-{size}.png"):
                shutil.copy2(os.path.join(RAW, n), os.path.join(out, n.replace(f"-{size}", "")))
    W, H = 1024, 500
    bg = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(bg)
    a, b = (94, 59, 34), (164, 108, 66)
    for x in range(W):
        t = x / W
        d.line([(x, 0), (x, H)], fill=tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3)))
    icon = Image.open(os.path.join(ROOT, "app", "assets", "icon", "app_icon.png")).resize((96, 96), Image.LANCZOS)
    bg.paste(icon, (56, 70), icon)
    d.text((56, 190), "Kitchen Remodeling", font=font(46, 700), fill=(251, 246, 239))
    d.text((56, 242), "Cost Planner", font=font(46, 700), fill=(251, 246, 239))
    d.text((56, 318), "Split your budget by line item.", font=font(24, 400), fill=(246, 232, 214))
    d.text((56, 352), "Add sales tax, a reserve and permits.", font=font(24, 400), fill=(246, 232, 214))
    for i, n in enumerate(("1-planner-1080x1920.png", "3-presets-1080x1920.png")):
        s = Image.open(os.path.join(RAW, n)).convert("RGB")
        s = s.resize((230, int(230 * s.height / s.width)), Image.LANCZOS)
        x, y = 560 + i * 220, 40 + (0 if i == 0 else 50)
        m = Image.new("L", s.size, 0)
        ImageDraw.Draw(m).rounded_rectangle([0, 0, s.width - 1, s.height - 1], radius=22, fill=255)
        sh = Image.new("RGBA", (s.width + 30, s.height + 30), (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle([15, 15, s.width + 15, s.height + 15], radius=22, fill=(0, 0, 0, 80))
        bg.paste(sh, (x - 8, y), sh)
        bg.paste(s, (x, y), m)
    bg.save(os.path.join(G, "feature-graphic-1024x500.png"))
    print("app graphics written")


if __name__ == "__main__":
    main()
