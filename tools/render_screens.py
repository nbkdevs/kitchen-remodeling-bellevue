"""Headless Chrome screenshots of the extension popup (3 tabs) and the HF Space page, then
store frames: Edge/AMO 1280x800, Edge 440x280 tile, app feature graphic 1024x500.
Run: python3 tools/render_screens.py"""
import json
import os
import shutil
import subprocess
import tempfile

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
G = os.path.join(ROOT, "store-graphics")
CHROME = "/opt/google/chrome/chrome"
FONT = "/usr/share/fonts/truetype/sand-box/google/Roboto/Roboto-VariableFont_wdth,wght.ttf"
WOOD_D, WOOD, CREAM, INK = (94, 59, 34), (138, 90, 54), (251, 246, 239), (43, 33, 25)


def shot(url, out, w, h, scale=2):
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
                    f"--force-device-scale-factor={scale}", f"--window-size={w},{h}",
                    f"--screenshot={out}", "--virtual-time-budget=2000", url],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def popup_shots():
    tmp = tempfile.mkdtemp()
    shutil.copytree(os.path.join(ROOT, "extensions", "shared"), tmp, dirs_exist_ok=True)
    html = open(os.path.join(tmp, "popup.html")).read()
    outs = {}
    for tab in ("counter", "splash", "cab"):
        state = {"tab": tab, "unit": "in"}
        with open(os.path.join(tmp, f"pre-{tab}.js"), "w") as f:
            f.write("localStorage.setItem('ccm-state-v1', %s);" % json.dumps(json.dumps(state)))
        page = html.replace('<script src="js/measure.js">', f'<script src="pre-{tab}.js"></script>\n<script src="js/measure.js">')
        p = os.path.join(tmp, f"popup-{tab}.html")
        open(p, "w").write(page)
        out = os.path.join(tmp, f"{tab}.png")
        shot("file://" + p, out, 380, 600)
        img = Image.open(out).convert("RGB")
        # trim the empty cream area at the bottom
        outs[tab] = img
    return outs


def frame(popup, title, lines, size=(1280, 800)):
    W, H = size
    bg = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(bg)
    for y in range(H):
        t = y / H
        d.line([(0, y), (W, y)], fill=tuple(int(WOOD_D[i] + (WOOD[i] - WOOD_D[i]) * t) for i in range(3)))
    p = popup.resize((int(popup.width * (H - 80) / popup.height), H - 80), Image.LANCZOS)
    x = W - p.width - 70
    sh = Image.new("RGBA", (p.width + 40, p.height + 40), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([20, 20, p.width + 20, p.height + 20], radius=18, fill=(0, 0, 0, 90))
    bg.paste(sh, (x - 14, 30), sh)
    m = Image.new("L", p.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, p.width - 1, p.height - 1], radius=14, fill=255)
    bg.paste(p, (x, 40), m)
    f1 = ImageFont.truetype(FONT, 52)
    f1.set_variation_by_axes([700, 100])
    f2 = ImageFont.truetype(FONT, 28)
    tx = 70
    y = 200
    for part in title.split("\n"):
        d.text((tx, y), part, font=f1, fill=CREAM)
        y += 64
    y += 24
    for ln in lines:
        d.ellipse([tx, y + 12, tx + 10, y + 22], fill=(244, 196, 66))
        d.text((tx + 24, y), ln, font=f2, fill=(246, 232, 214))
        y += 46
    return bg


def main():
    pops = popup_shots()
    specs = [
        ("counter", "Countertop area\nwith cutouts", ["Add every straight run", "Subtract sink and cooktop cutouts", "Square feet, m² and an order size"]),
        ("splash", "Backsplash\ntile counter", ["Any tile size, in or cm", "Waste allowance and openings", "Tiles and boxes to buy"]),
        ("cab", "Cabinet run\nplanner", ["Standard 9 to 36 in boxes", "Fewest boxes for the wall", "Linear feet and filler left"]),
    ]
    for i, (tab, title, lines) in enumerate(specs, 1):
        img = frame(pops[tab], title, lines)
        img.save(os.path.join(G, f"extension-screenshot-{i}-{tab}-1280x800.png"))
        img.resize((640, 400), Image.LANCZOS).save(os.path.join(G, f"extension-screenshot-{i}-{tab}-640x400.png"))
    tile = frame(pops["counter"], "Cabinet &\nCountertop\nMeasure", [], size=(1280, 800)).resize((440, 275), Image.LANCZOS)
    t = Image.new("RGB", (440, 280), WOOD_D)
    t.paste(tile, (0, 2))
    t.save(os.path.join(G, "extension-promo-440x280.png"))

    # HF Space / web calculator screenshot (Product Hunt gallery, Design Nominees)
    page = os.path.join(ROOT, "packages", "hf-space", "index.html")
    shot("file://" + page, os.path.join(G, "web-calculator-1280x800.png"), 1280, 800, scale=1)
    shot("file://" + page, os.path.join(G, "web-calculator-1270x760.png"), 1270, 760, scale=1)
    print("screens written")


if __name__ == "__main__":
    main()
