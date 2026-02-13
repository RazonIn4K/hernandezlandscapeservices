import os
from pathlib import Path

# Configuration
IMAGE_DIR = (
    "/Users/davidortiz/Main-Learning-Vault/hernandezlandscapeservices/hernandez_images"
)
# Relative path for HTML src
WEB_PATH_PREFIX = "hernandez_images/"
OUTPUT_HTML_FILE = "gallery_fragment.html"


def generate_gallery_html():
    img_dir = Path(IMAGE_DIR)

    # Get all potential main images (excluding thumbnails)
    # Filter for files starting with 'web_' and ending with '.webp', but NOT containing '_thumb'
    images = sorted(
        [
            f
            for f in img_dir.iterdir()
            if f.name.startswith("web_")
            and f.suffix == ".webp"
            and "_thumb" not in f.name
        ]
    )

    html_output = []

    for img_path in images:
        filename = img_path.name
        stem = img_path.stem

        # Construct paths
        full_img_src = f"{WEB_PATH_PREFIX}{filename}"
        thumb_src = f"{WEB_PATH_PREFIX}{stem}_thumb.webp"

        # Check if thumbnail exists
        thumb_path = img_dir / f"{stem}_thumb.webp"
        if not thumb_path.exists():
            print(f"Warning: Thumbnail missing for {filename}, using full image.")
            thumb_src = full_img_src

        # Basic alt text from filename
        alt_text = stem.replace("web_", "").replace("_", " ")

        # HTML Snippet
        snippet = f"""
                <!-- {alt_text} -->
                <div class="gallery-item group relative overflow-hidden rounded-xl shadow-lg cursor-pointer">
                    <img src="{thumb_src}" loading="lazy" alt="{alt_text}" class="w-full h-64 object-cover transform transition duration-500 group-hover:scale-110">
                    <div class="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                        <div class="text-center p-4">
                            <h3 class="text-white font-bold text-xl mb-2">Project</h3>
                        </div>
                    </div>
                </div>"""
        html_output.append(snippet)

    # Write to file
    with open(OUTPUT_HTML_FILE, "w") as f:
        f.write("\n".join(html_output))

    print(f"Generated gallery HTML for {len(images)} images in {OUTPUT_HTML_FILE}")


if __name__ == "__main__":
    generate_gallery_html()
