"""Draws the app icon (kitchen cabinets + countertop + price tag) and writes Android mipmaps
and store icons. Run: python3 tools/make_icons.py"""
import os
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = 1024


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def icon(size=S, rounded=True):
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    bg = Image.new("RGBA", (S, S))
    top, bottom = (164, 108, 66), (94, 59, 34)
    for y in range(S):
        ImageDraw.Draw(bg).line([(0, y), (S, y)], fill=lerp(top, bottom, y / S) + (255,))
    # subtle wood grain
    grain = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    g = ImageDraw.Draw(grain)
    for i in range(0, S, 46):
        g.arc([-400, i - 700, S + 400, i + 700], 200, 340, fill=(255, 235, 210, 22), width=4)
    bg.alpha_composite(grain)
    mask = Image.new("L", (S, S), 0)
    if rounded:
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=220, fill=255)
    else:
        mask.paste(255, [0, 0, S, S])
    img.paste(bg, (0, 0), mask)
    d = ImageDraw.Draw(img)
    cream, shadow = (251, 246, 239, 255), (60, 36, 20, 90)
    # shadow
    sh = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([222, 452, 822, 832], radius=36, fill=shadow)
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(18)))
    # countertop
    d.rounded_rectangle([190, 400, 834, 456], radius=18, fill=(236, 226, 212, 255))
    # base cabinets
    d.rounded_rectangle([214, 456, 810, 812], radius=28, fill=cream)
    d.line([(512, 476), (512, 792)], fill=(214, 196, 176, 255), width=10)
    for x in (470, 554):
        d.rounded_rectangle([x - 9, 560, x + 9, 680], radius=9, fill=(138, 90, 54, 255))
    # upper cabinet
    d.rounded_rectangle([300, 190, 724, 330], radius=24, fill=(251, 246, 239, 230))
    d.line([(512, 206), (512, 314)], fill=(214, 196, 176, 255), width=8)
    for x in (480, 544):
        d.rounded_rectangle([x - 7, 236, x + 7, 286], radius=7, fill=(138, 90, 54, 255))
    # price tag badge
    cx, cy, r = 760, 760, 150
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(47, 107, 90, 255), outline=cream, width=16)
    # dollar sign drawn as strokes
    w = 22
    d.arc([cx - 62, cy - 92, cx + 62, cy + 4], 110, 360, fill=cream, width=w)
    d.arc([cx - 62, cy - 4, cx + 62, cy + 92], -70, 180, fill=cream, width=w)
    d.line([(cx, cy - 122), (cx, cy + 122)], fill=cream, width=w)
    return img.resize((size, size), Image.LANCZOS)


def main():
    master = icon()
    os.makedirs(f"{ROOT}/store-graphics", exist_ok=True)
    os.makedirs(f"{ROOT}/app/assets/icon", exist_ok=True)
    master.save(f"{ROOT}/app/assets/icon/app_icon.png")
    flat = icon(rounded=False)
    flat.convert("RGB").resize((512, 512), Image.LANCZOS).save(f"{ROOT}/store-graphics/app-icon-512.png")
    flat.convert("RGB").resize((114, 114), Image.LANCZOS).save(f"{ROOT}/store-graphics/app-icon-114.png")
    for name, px in {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}.items():
        p = f"{ROOT}/app/android/app/src/main/res/mipmap-{name}/ic_launcher.png"
        master.resize((px, px), Image.LANCZOS).save(p)
    print("icons written")


if __name__ == "__main__":
    main()
