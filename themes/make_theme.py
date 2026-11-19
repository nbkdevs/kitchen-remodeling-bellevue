"""Builds the "Walnut Morning" Chrome theme (images + manifest + zip) and its store images.
Run: python3 themes/make_theme.py"""
import json
import os
import zipfile

from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
T = os.path.join(HERE, "chrome")
VERSION = "1.0.0"
FRAME = (78, 50, 30)
FRAME_INACTIVE = (110, 80, 56)
TOOLBAR = (250, 243, 232)
FONT = "/usr/share/fonts/truetype/sand-box/google/Roboto/Roboto-VariableFont_wdth,wght.ttf"


def walnut(w, h, base=FRAME, seed=7):
    """Subtle walnut grain strip."""
    import random
    rnd = random.Random(seed)
    img = Image.new("RGB", (w, h), base)
    d = ImageDraw.Draw(img)
    for _ in range(w // 3):
        y = rnd.uniform(0, h)
        x0 = rnd.uniform(-w * 0.2, w)
        ln = rnd.uniform(w * 0.1, w * 0.5)
        shade = rnd.randint(-14, 14)
        c = tuple(max(0, min(255, v + shade)) for v in base)
        d.line([(x0, y), (x0 + ln, y + rnd.uniform(-2, 2))], fill=c, width=rnd.choice([1, 1, 2]))
    return img.filter(ImageFilter.GaussianBlur(0.6))


def main():
    os.makedirs(os.path.join(T, "images"), exist_ok=True)
    src = Image.open(os.path.join(HERE, "source", "walnut-morning.jpg")).convert("RGB")
    ntp = src.resize((1920, 1080), Image.LANCZOS)
    ntp.save(os.path.join(T, "images", "theme_ntp_background.png"), optimize=True)
    walnut(1920, 120, FRAME, 3).save(os.path.join(T, "images", "theme_frame.png"))
    walnut(1920, 120, (96, 66, 44), 5).save(os.path.join(T, "images", "theme_tab_background.png"))
    tb = Image.new("RGB", (1920, 120), TOOLBAR)
    tb.save(os.path.join(T, "images", "theme_toolbar.png"))
    manifest = {
        "manifest_version": 3,
        "name": "Walnut Morning",
        "version": VERSION,
        "description": "A warm wood theme: a walnut frame, a soft cream toolbar and a sunlit countertop on every new tab.",
        "theme": {
            "images": {
                "theme_frame": "images/theme_frame.png",
                "theme_toolbar": "images/theme_toolbar.png",
                "theme_ntp_background": "images/theme_ntp_background.png",
                "theme_tab_background": "images/theme_tab_background.png",
            },
            "colors": {
                "frame": list(FRAME),
                "frame_inactive": list(FRAME_INACTIVE),
                "toolbar": list(TOOLBAR),
                "tab_text": [62, 40, 24],
                "tab_background_text": [246, 230, 210],
                "bookmark_text": [78, 50, 30],
                "ntp_background": [236, 222, 200],
                "ntp_text": [62, 40, 24],
                "ntp_link": [138, 90, 54],
                "ntp_header": list(FRAME),
                "ntp_section": list(TOOLBAR),
                "button_background": [138, 90, 54],
                "toolbar_button_icon": [110, 72, 44],
                "omnibox_background": [255, 251, 245],
                "omnibox_text": [62, 40, 24],
            },
            "tints": {"buttons": [0.07, 0.45, 0.35], "frame": [-1, -1, -1], "frame_inactive": [-1, -1, -1], "background_tab": [-1, -1, -1]},
            "properties": {"ntp_background_alignment": "center", "ntp_background_repeat": "no-repeat", "ntp_logo_alternate": 1},
        },
    }
    with open(os.path.join(T, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)
    dist = os.path.join(HERE, "dist")
    os.makedirs(dist, exist_ok=True)
    zp = os.path.join(dist, f"walnut-morning-chrome-theme-{VERSION}.zip")
    with zipfile.ZipFile(zp, "w", zipfile.ZIP_DEFLATED) as z:
        for rel in ["manifest.json"] + [f"images/{n}" for n in sorted(os.listdir(os.path.join(T, "images")))]:
            z.write(os.path.join(T, rel), rel)
    print("theme zip", zp, os.path.getsize(zp))

    # Store images: a mock browser window with the theme applied.
    g = os.path.join(ROOT, "store-graphics")
    W, H = 1280, 800
    shot = Image.new("RGB", (W, H), FRAME)
    shot.paste(walnut(W, 44, FRAME, 3), (0, 0))
    d = ImageDraw.Draw(shot)
    f = ImageFont.truetype(FONT, 15)
    # active tab
    d.rounded_rectangle([16, 8, 260, 52], radius=10, fill=TOOLBAR)
    d.text((40, 20), "New Tab", font=f, fill=(62, 40, 24))
    d.rounded_rectangle([268, 12, 500, 44], radius=10, fill=(96, 66, 44))
    d.text((290, 20), "Recipes", font=f, fill=(246, 230, 210))
    d.rectangle([0, 44, W, 96], fill=TOOLBAR)
    d.rounded_rectangle([110, 54, W - 110, 86], radius=16, fill=(255, 251, 245), outline=(225, 210, 190))
    d.text((132, 61), "Search or type a URL", font=f, fill=(140, 120, 100))
    for i, x in enumerate((24, 52, 80)):
        d.ellipse([x, 62, x + 14, 76], fill=(110, 72, 44))
    body = ntp.resize((W, int(W * 1080 / 1920)), Image.LANCZOS)
    top = 96
    shot.paste(body.crop((0, 0, W, H - top)), (0, top))
    sb = ImageDraw.Draw(shot, "RGBA")
    sb.rounded_rectangle([W // 2 - 280, 300, W // 2 + 280, 348], radius=24, fill=(255, 251, 245, 235))
    sb.text((W // 2 - 250, 314), "Search the web", font=f, fill=(140, 120, 100))
    for i in range(6):
        x = W // 2 - 255 + i * 90
        sb.rounded_rectangle([x, 380, x + 64, 444], radius=14, fill=(255, 251, 245, 210))
    shot.save(os.path.join(g, "cws-theme-screenshot-1280x800.png"))
    shot.resize((640, 400), Image.LANCZOS).save(os.path.join(g, "cws-theme-screenshot-640x400.png"))
    tile = ntp.resize((440, int(440 * 1080 / 1920)), Image.LANCZOS)
    t = Image.new("RGB", (440, 280), FRAME)
    t.paste(tile.crop((0, 0, 440, 248)), (0, 32))
    t.paste(walnut(440, 32, FRAME, 3), (0, 0))
    td = ImageDraw.Draw(t, "RGBA")
    td.rounded_rectangle([20, 6, 150, 32], radius=8, fill=TOOLBAR)
    td.rounded_rectangle([24, 200, 250, 262], radius=12, fill=(78, 50, 30, 215))
    td.text((40, 212), "Walnut Morning", font=ImageFont.truetype(FONT, 26), fill=(250, 243, 232))
    t.save(os.path.join(g, "cws-theme-promo-440x280.png"))
    icon = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    m = Image.new("L", (128, 128), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, 127, 127], radius=26, fill=255)
    icon.paste(ntp.resize((228, 128), Image.LANCZOS).crop((50, 0, 178, 128)), (0, 0), m)
    icon.save(os.path.join(g, "cws-theme-icon-128.png"))
    print("theme store images written")


if __name__ == "__main__":
    main()
