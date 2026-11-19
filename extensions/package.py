#!/usr/bin/env python3
"""Copy shared/ into firefox/ and edge/, validate the manifests and zip both into dist/.
Run: python3 extensions/package.py"""
from __future__ import annotations

import json
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SHARED = ROOT / "shared"
DIST = ROOT / "dist"
VERSION = "1.0.0"
SLUG = "cabinet-countertop-measure"
FORBIDDEN = ("bellevue", "wakitchen", "kitchen pros", "kitchen remodeling", "washington", "seattle")


def check(dest: Path, browser: str) -> None:
    m = json.loads((dest / "manifest.json").read_text())
    assert m["manifest_version"] == 3 and m["version"] == VERSION
    assert m["permissions"] == [] and "host_permissions" not in m and "content_scripts" not in m
    assert len(m["description"]) <= 132
    for rel in m["icons"].values():
        assert (dest / rel).is_file(), rel
    blob = json.dumps(m).lower()
    for f in sorted(dest.rglob("*")):
        if f.suffix in (".html", ".js", ".css"):
            text = f.read_text()
            assert "http://" not in text and "https://" not in text, f"{f} must not link or load anything external"
            blob += text.lower()
    html = (dest / "popup.html").read_text()
    assert "<script>" not in html and "onclick=" not in html, "no inline script (CSP)"
    for word in FORBIDDEN:
        assert word not in blob, f"extension must not carry brand/site/place name: {word}"
    if browser == "firefox":
        g = m["browser_specific_settings"]["gecko"]
        assert g["id"] == f"{SLUG}@nbkdevs" and g["strict_min_version"] == "109.0"
        assert g["data_collection_permissions"]["required"] == ["none"]


def build(browser: str) -> Path:
    dest = ROOT / browser
    for name in ("popup.html", "css", "js", "icons"):
        p = dest / name
        if p.is_dir():
            shutil.rmtree(p)
        elif p.exists():
            p.unlink()
    shutil.copytree(SHARED, dest, dirs_exist_ok=True)
    check(dest, browser)
    DIST.mkdir(exist_ok=True)
    out = DIST / f"{SLUG}-{browser}-{VERSION}.zip"
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(dest.rglob("*")):
            if f.is_file() and f.suffix != ".md":
                z.write(f, f.relative_to(dest).as_posix())
    return out


if __name__ == "__main__":
    for b in ("firefox", "edge"):
        p = build(b)
        print(f"{b}: {p.relative_to(ROOT.parent)} ({p.stat().st_size} bytes)")
