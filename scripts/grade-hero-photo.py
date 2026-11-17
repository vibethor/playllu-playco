# One-off: grades the generated hero photo into the brand colours (Midnight Navy shadows, Electric Lime ball,
# cool court instead of orange wood) and adds headroom. Usage: python3 scripts/grade-hero-photo.py <source.png> public/hero-default.jpg

import sys, colorsys
import numpy as np
from PIL import Image, ImageFilter

src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
# the brand-like mark on the left shoe: its light pixels take the shoe's own dark fabric
_a = np.asarray(im).copy()
_x0, _y0, _x1, _y1 = 612, 619, 636, 655
_p = _a[_y0:_y1, _x0:_x1].astype(np.float32)
_l = _p.mean(axis=2)
_dark = np.median(_p[_l < 60], axis=0)
_m = Image.fromarray(((_l > 78) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
_m = (np.asarray(_m).astype(np.float32) / 255.0)[..., None]
_rng = np.random.default_rng(7)
_fill = _dark + _rng.normal(0, 3.0, _p.shape)
_a[_y0:_y1, _x0:_x1] = np.clip(_p * (1 - _m) + _fill * _m, 0, 255).astype(np.uint8)
im = Image.fromarray(_a)

a = np.asarray(im).astype(np.float32) / 255.0
h, w, _ = a.shape
hsv = np.asarray(im.convert("HSV")).astype(np.float32)
H, S, V = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
yy, xx = np.mgrid[0:h, 0:w]

NAVY = np.array([0x10, 0x2C, 0x40]) / 255.0
LIME = np.array([0xDB, 0xFF, 0x00]) / 255.0
LIME_H = colorsys.rgb_to_hsv(*LIME)[0] * 360

def soft(mask, r):
    return np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255.0

# 1. the ball: yellow panels -> Electric Lime
ball = ((xx - 903) ** 2 + (yy - 63) ** 2 < 46 ** 2) & (H > 30) & (H < 75) & (S > 0.35)
ballm = soft(ball, 1.2)

# 2. the wooden floor: warm orange -> cool pale court
# (wood is hue 27-33; skin is 18-26, so the hue ramp keeps legs out of it)
floor = (yy > 742) * np.clip((H - 26.0) / 1.5, 0, 1) * (H < 50) * (S > 0.08)
floorm = soft(floor, 1.5) * np.clip((yy - 742) / 30.0, 0, 1)

lum = (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])[..., None]

res = a.copy()
# floor: luminance carried on a cool navy-grey
cool = lum * np.array([0.80, 0.92, 1.02]) * 1.05
res = res * (1 - floorm[..., None] * 0.85) + cool * (floorm[..., None] * 0.85)

# 3. whole frame: a navy duotone under the photo (shadows to Midnight Navy, lights to Cloud White)
CLOUD = np.array([0xF7, 0xFA, 0xFC]) / 255.0
duo = NAVY * 0.35 + (CLOUD - NAVY * 0.35) * np.clip(lum * 1.08, 0, 1)
shadow_w = np.clip(1.0 - lum * 1.6, 0, 1)            # strongest in the shadows
res = res * (1 - 0.22 - 0.25 * shadow_w) + duo * (0.22 + 0.25 * shadow_w)

# ball last, so the lime stays pure
ball_rgb = LIME * np.clip(lum * 1.55, 0, 1)
res = res * (1 - ballm[..., None]) + ball_rgb * ballm[..., None]

# 4. headroom: the site header covers the top of the hero, and the ball is at the very top of the frame.
#    The dark ceiling is continued upwards and faded to navy, so the ball clears the header.
HEADROOM = 150
graded = Image.fromarray((np.clip(res, 0, 1) * 255).astype(np.uint8))
# (one flat ceiling tone, fading to navy: stretching or mirroring the top rows repeats the lamps and the ball)
ga = np.asarray(graded).astype(np.float32) / 255.0
tone = np.median(ga[:40].reshape(-1, 3), axis=0)
fade = np.linspace(0.2, 1.0, HEADROOM)[:, None, None]
sa = np.broadcast_to(tone * fade + (NAVY * 0.45) * (1 - fade), (HEADROOM, w, 3))
# feather the join: the photo's first rows ease out of the flat tone
SEAM = 48
ease = np.linspace(0.85, 0.0, SEAM)[:, None, None]
ga[:SEAM] = ga[:SEAM] * (1 - ease) + tone * ease
graded = Image.fromarray((np.clip(ga, 0, 1) * 255).astype(np.uint8))
canvas = Image.new("RGB", (w, h + HEADROOM))
canvas.paste(Image.fromarray((np.clip(sa, 0, 1) * 255).astype(np.uint8)), (0, 0))
canvas.paste(graded, (0, HEADROOM))
canvas.save(out, quality=90, optimize=True, progressive=True)
print("saved", out)
