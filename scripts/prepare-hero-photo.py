# One-off: prepares the generated hero photo for the home page.
#   1. paints out brand-like marks on shorts, shoes and socks (the generator drew sportswear logos);
#   2. adds headroom above the ball, so it clears the site header instead of hiding behind it.
# Usage: python3 scripts/prepare-hero-photo.py <source.png> public/hero-default.jpg
import sys
import numpy as np
from PIL import Image, ImageFilter

src, out = sys.argv[1], sys.argv[2]
a = np.asarray(Image.open(src).convert("RGB")).copy()
h, w, _ = a.shape
NAVY = np.array([0x10, 0x2C, 0x40]) / 255.0
rng = np.random.default_rng(7)

# (x0, y0, x1, y1, kind): "light" = a light mark on dark cloth, "dark" = a dark mark on a white shoe or sock,
# "lime" = a lime mark on a dark shoe, "dim" = a grey mark on a dark shoe. The mark's pixels take the surrounding material's median colour.
MARKS = [
    (1286, 611, 1307, 626, "light"),  # blocker's shorts
    (1405, 618, 1428, 635, "light"),  # second blocker's shorts
    (1308, 822, 1339, 855, "light"),  # shoe, bottom right
    (1350, 838, 1380, 864, "dim"),    # second shoe, bottom right
    (845, 504, 871, 527, "lime"),     # spiker's raised shoe
    (884, 669, 904, 697, "lime"),     # spiker's lower shoe
    (888, 509, 900, 523, "dark"),     # spiker's sock
    (162, 819, 189, 834, "dark"),     # left player's shoe
    (0, 826, 13, 847, "dark"),        # left player's other shoe
    (83, 667, 94, 678, "lime"),       # left player's shorts
]

for x0, y0, x1, y1, kind in MARKS:
    p = a[y0:y1, x0:x1].astype(np.float32)
    lum = p.mean(axis=2)
    mx, mn = p.max(axis=2), p.min(axis=2)
    sat = (mx - mn) / np.maximum(mx, 1)
    if kind == "light":
        mark, base = lum > 95, lum < 70
    elif kind == "dim":   # a grey mark on a dark shoe
        mark, base = lum > 58, lum < 45
    elif kind == "dark":  # relative to the shoe's own tone, which is shaded
        mid = np.median(lum)
        mark, base = lum < mid - 28, lum >= mid
    else:  # lime: saturated and green-yellow
        mark = (sat > 0.3) & (p[..., 1] > p[..., 2] * 1.3) & (lum > 55)
        base = (lum < 60) & ~mark
    if not mark.any() or not base.any():
        continue
    fill = np.median(p[base], axis=0) + rng.normal(0, 2.5, p.shape)
    m = Image.fromarray((mark * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    m = (np.asarray(m).astype(np.float32) / 255.0)[..., None]
    a[y0:y1, x0:x1] = np.clip(p * (1 - m) + fill * m, 0, 255).astype(np.uint8)

# Headroom: one flat ceiling tone fading to navy (stretching or mirroring the top rows would repeat the lamps).
HEADROOM, SEAM = 150, 48
ga = a.astype(np.float32) / 255.0
tone = np.median(ga[:40].reshape(-1, 3), axis=0)
fade = np.linspace(0.2, 1.0, HEADROOM)[:, None, None]
top = np.broadcast_to(tone * fade + (NAVY * 0.45) * (1 - fade), (HEADROOM, w, 3))
ease = np.linspace(0.85, 0.0, SEAM)[:, None, None]
ga[:SEAM] = ga[:SEAM] * (1 - ease) + tone * ease
canvas = np.concatenate([top, ga], axis=0)
Image.fromarray((np.clip(canvas, 0, 1) * 255).astype(np.uint8)).save(out, quality=90, optimize=True, progressive=True)
print("saved", out, canvas.shape[1], "x", canvas.shape[0])
