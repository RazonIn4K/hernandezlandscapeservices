import re
import os

GALLERY_FILE = (
    "/Users/davidortiz/Main-Learning-Vault/hernandezlandscapeservices/gallery.html"
)


def clean_gallery_html():
    with open(GALLERY_FILE, "r") as f:
        content = f.read()

    # Regex Replacements

    # 1. Clean gallery-item container
    # From: <div class="gallery-item group relative overflow-hidden rounded-xl shadow-lg cursor-pointer">
    # To: <div class="gallery-item group">
    content = re.sub(
        r'<div class="gallery-item group relative overflow-hidden rounded-xl shadow-lg cursor-pointer">',
        r'<div class="gallery-item group">',
        content,
    )

    # 2. Clean image styles
    # From: <img src="..." ... class="w-full h-64 object-cover transform transition duration-500 group-hover:scale-110">
    # To: <img src="..." ... class=""> (CSS handles geometry)
    # We'll use a regex that matches the class attribute specifically on lines inside gallery-item
    # actually, the pattern is consistent.
    content = re.sub(
        r'class="w-full h-64 object-cover transform transition duration-500 group-hover:scale-110"',
        r'class=""',
        content,
    )

    # 3. Clean overlay div
    # From: <div class="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
    # To: <div class="gallery-overlay">
    content = re.sub(
        r'<div class="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">',
        r'<div class="gallery-overlay">',
        content,
    )

    # 4. Clean h3 text
    # From: <h3 class="text-white font-bold text-xl mb-2">
    # To: <h3>
    content = re.sub(
        r'<h3 class="text-white font-bold text-xl mb-2">', r"<h3>", content
    )

    # 5. Clean parent grid container (optional, maybe keep tailwind grid for now or replace with gallery-grid)
    # From: <div class="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
    # To: <div class="gallery-grid max-w-7xl mx-auto">
    content = re.sub(
        r'<div class="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">',
        r'<div class="gallery-grid max-w-7xl mx-auto">',
        content,
    )

    with open(GALLERY_FILE, "w") as f:
        f.write(content)

    print("Successfully cleaned styles in gallery.html")


if __name__ == "__main__":
    clean_gallery_html()
