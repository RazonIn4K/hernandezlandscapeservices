"""Right-sized WebP variants for the site's photos and video posters (round 4).

Local-only build helper (needs Pillow), like scripts/optimize_media.py. It reads
media/gallery.json plus the hand-placed homepage images below and writes, into
hernandez_images/w/:

  <stem>-480.webp, <stem>-800.webp, <stem>-1200.webp   (only widths below the
      original; the original file stays the largest srcset candidate)
  <poster-stem>-480.webp                                (~40 KB video posters)

Existing files are left alone unless --force. It also prints the manifest
fields (size, variants, posterSmall) so media/gallery.json can record them;
npm run media:update then writes srcset/sizes into the generated regions.

    python scripts/make_image_variants.py [--force]
"""
import json
import os
import sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "hernandez_images", "w")
WIDTHS = (480, 800, 1200)
POSTER_WIDTH = 480
POSTER_TARGET = 42 * 1024
FORCE = "--force" in sys.argv

# Homepage images that are placed by hand in index.html (not manifest surfaces).
HOME_EXTRA = [
    "hernandez_images/facebook-2026-side-yard-lawn-finish.jpg",
    "hernandez_images/google-profile-2026-tree-climber-canopy.jpg",
    "hernandez_images/web_Wideshot_Bestlandscape2.jpeg",
    "hernandez_images/google-profile-2026-tree-climber-roofline.jpg",
    "hernandez_images/google-profile-2026-branded-truck-trailers.jpg",
    "hernandez_images/google-profile-2026-tree-removal-cut-logs.jpg",
    "hernandez_images/web_Before1.jpeg",
    "hernandez_images/web_After1.jpeg",
    "hernandez_images/web_hero_mobile.webp",
]
HOME_POSTERS = [
    "hernandez_images/web_IMG_0434_poster.jpg",
    "hernandez_images/web_IMG_1095_poster.jpg",
    "hernandez_images/web_IMG_2055_poster.jpg",
]


def stem(rel):
    return os.path.splitext(os.path.basename(rel))[0]


def save_webp(im, path, quality):
    im.save(path, "WEBP", quality=quality, method=6)
    return os.path.getsize(path)


def image_variants(rel):
    src = os.path.join(ROOT, rel)
    with Image.open(src) as im:
        im = im.convert("RGB")
        w, h = im.size
        widths = [x for x in WIDTHS if x < w]
        made = []
        for tw in widths:
            dst = os.path.join(OUT, f"{stem(rel)}-{tw}.webp")
            if FORCE or not os.path.exists(dst):
                th = round(h * tw / w)
                im.resize((tw, th), Image.LANCZOS).save(dst, "WEBP", quality=70 if tw < 800 else 60, method=6)
            made.append(tw)
        return {"src": rel, "size": [w, h], "variants": made}


def poster_variant(rel):
    src = os.path.join(ROOT, rel)
    dst = os.path.join(OUT, f"{stem(rel)}-{POSTER_WIDTH}.webp")
    if FORCE or not os.path.exists(dst):
        with Image.open(src) as im:
            im = im.convert("RGB")
            w, h = im.size
            tw = min(POSTER_WIDTH, w)
            small = im.resize((tw, round(h * tw / w)), Image.LANCZOS)
            for q in (70, 62, 54, 46, 40, 34):
                if save_webp(small, dst, q) <= POSTER_TARGET:
                    break
    return {"poster": rel, "posterSmall": os.path.relpath(dst, ROOT).replace(os.sep, "/")}


def main():
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(ROOT, "media", "gallery.json"), encoding="utf-8") as fh:
        manifest = json.load(fh)
    by_id = {i["id"]: i for i in manifest["items"]}
    surfaces = manifest["surfaces"]
    images = []
    for name in ("galleryPage", "homeGallery"):
        for item_id in surfaces[name]:
            src = by_id[item_id]["src"]
            if src not in images:
                images.append(src)
    images += [x for x in HOME_EXTRA if x not in images]
    posters = [by_id[i]["poster"] for i in surfaces["videosPage"]]
    posters += [x for x in HOME_POSTERS if x not in posters]
    report = {"images": [image_variants(x) for x in images], "posters": [poster_variant(x) for x in posters]}
    print(json.dumps(report, indent=1))


if __name__ == "__main__":
    main()
