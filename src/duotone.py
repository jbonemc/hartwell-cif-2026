"""Duotone every photograph in img/raw into img/: black-and-white, then mapped onto the report's palette.
Shadows take the brand navy, highlights a pale warm grey; the midtones carry a faint red gel so the set reads as one."""
import json, pathlib, sys
from PIL import Image, ImageOps, ImageEnhance
SRC = pathlib.Path(__file__).parent.parent / 'img'
NAVY = (21, 38, 59); LIGHT = (236, 232, 226); RED = (217, 70, 59)
def lerp(a, b, t): return tuple(int(round(a[i] + (b[i]-a[i])*t)) for i in range(3))
# build a 256-entry lookup: navy -> (navy blended toward red in the lower-mid tones) -> light
lut = []
for v in range(256):
    t = v/255
    base = lerp(NAVY, LIGHT, t)
    gel = (1 - abs(t-0.42)/0.42) if abs(t-0.42) < 0.42 else 0   # peaks around the mid tones
    lut.append(lerp(base, RED, 0.22*gel))
credits = json.load(open(SRC/'credits.json'))
for key in credits:
    im = Image.open(SRC/'raw'/f'{key}.jpg').convert('RGB')
    g = ImageOps.grayscale(im); g = ImageOps.autocontrast(g, cutoff=1)
    g = ImageEnhance.Contrast(g).enhance(1.08)
    r = g.point([lut[v][0] for v in range(256)]); gg = g.point([lut[v][1] for v in range(256)]); b = g.point([lut[v][2] for v in range(256)])
    out = Image.merge('RGB', (r, gg, b))
    out.save(SRC/f'{key}.jpg', quality=78, optimize=True, progressive=True)
    print(key, out.size)
