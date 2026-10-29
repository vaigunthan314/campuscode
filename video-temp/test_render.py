"""
Quick test script to verify Pillow, system fonts, and render sample frames for each scene.
"""
import os
import math
from PIL import Image, ImageDraw, ImageFont

def get_font(size, bold=False, mono=False):
    candidates = []
    if mono:
        candidates = [
            "/System/Library/Fonts/Menlo.ttc",
            "/System/Library/Fonts/Monaco.ttf",
            "/System/Library/Fonts/Courier.ttc",
        ]
    else:
        if bold:
            candidates = [
                "/System/Library/Fonts/HelveticaNeue.ttc",
                "/System/Library/Fonts/Helvetica.ttc",
            ]
        else:
            candidates = [
                "/System/Library/Fonts/HelveticaNeue.ttc",
                "/System/Library/Fonts/Helvetica.ttc",
            ]
    for path in candidates:
        if os.path.exists(path):
            try:
                # For .ttc fonts, index 0 is regular, index 1/2 might be bold
                idx = 1 if bold and "HelveticaNeue" in path else 0
                return ImageFont.truetype(path, size, index=idx)
            except Exception:
                try:
                    return ImageFont.truetype(path, size)
                except Exception:
                    continue
    return ImageFont.load_default()

print("Testing fonts...")
f_sans = get_font(48, bold=True)
f_mono = get_font(24, mono=True)
print(f"Sans font loaded: {f_sans}")
print(f"Mono font loaded: {f_mono}")

img = Image.new("RGB", (1920, 1080), "#f7f7f4")
draw = ImageDraw.Draw(img)
draw.text((100, 100), "TEST RENDER: CAMPUSCODE", fill="#111111", font=f_sans)
draw.text((100, 180), "01 / MONO TEST SYSTEM", fill="#7665ff", font=f_mono)

test_path = "/Users/vaigunthansl/Desktop/Rebuild /video-temp/test_frame.png"
img.save(test_path)
print(f"Saved test frame: {test_path} (exists={os.path.exists(test_path)}, size={os.path.getsize(test_path)})")
