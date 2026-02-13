import os
from pathlib import Path

# Configuration
MEDIA_DIR = (
    "/Users/davidortiz/Main-Learning-Vault/hernandezlandscapeservices/hernandez_images"
)
WEB_PATH_PREFIX = "hernandez_images/"
OUTPUT_HTML_FILE = "video_fragment.html"


def generate_video_html():
    media_dir = Path(MEDIA_DIR)

    # Get all processed videos
    videos = sorted(
        [
            f
            for f in media_dir.iterdir()
            if f.name.startswith("web_") and f.suffix == ".mp4"
        ]
    )

    html_output = []

    # We might want to limit the number of videos or pick specific ones
    # But for now, let's generate HTML for all found videos

    for vid_path in videos:
        filename = vid_path.name
        stem = vid_path.stem

        # Paths
        video_src = f"{WEB_PATH_PREFIX}{filename}"
        poster_src = f"{WEB_PATH_PREFIX}{stem}_poster.jpg"

        # Default Poster if missing
        poster_attr = ""
        poster_path = media_dir / f"{stem}_poster.jpg"
        if poster_path.exists():
            poster_attr = f'poster="{poster_src}"'

        alt_text = stem.replace("web_", "").replace("_", " ")

        snippet = f"""
                <div class="video-card group">
                    <div class="video-wrapper relative">
                        <video controls preload="metadata" {poster_attr} class="w-full h-full object-cover">
                            <source src="{video_src}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                        <div class="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity duration-300 bg-black bg-opacity-20">
                            <i class="fas fa-play-circle text-white text-5xl opacity-80"></i>
                        </div>
                    </div>
                </div>"""
        html_output.append(snippet)

    with open(OUTPUT_HTML_FILE, "w") as f:
        f.write("\n".join(html_output))

    print(f"Generated video HTML for {len(videos)} videos in {OUTPUT_HTML_FILE}")


if __name__ == "__main__":
    generate_video_html()
