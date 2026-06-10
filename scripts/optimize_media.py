#!/usr/bin/env python3
"""Optimize raw photos/videos into web-ready files in hernandez_images/.

Local-only, optional step (requires ffmpeg on PATH). Raw sources are
gitignored; only the optimized output in hernandez_images/ is committed.

Usage:
    python scripts/optimize_media.py                 # auto-pick source dir
    python scripts/optimize_media.py --source "iCloud Photos"
    python scripts/optimize_media.py --source media/inbox --output hernandez_images

Paths are resolved relative to the repository root (the parent of scripts/),
so the script works from any checkout on any machine. By default it reads
raw files from media/inbox/ (or the legacy "iCloud Photos/" folder if
media/inbox/ does not exist) and writes web_*.{webp,mp4,jpg} files into
hernandez_images/. After optimizing, register the new files in
media/gallery.json and run `npm run media:update` (see docs/MEDIA-WORKFLOW.md).
"""

import argparse
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SOURCES = ("media/inbox", "iCloud Photos")
DEFAULT_OUTPUT = "hernandez_images"
WEB_PREFIX = "web_"

IMAGE_EXTS = {".heic", ".jpg", ".jpeg", ".png"}
VIDEO_EXTS = {".mov", ".mp4"}


def run_command(command):
    try:
        subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return True
    except FileNotFoundError:
        print("Error: ffmpeg not found on PATH. Install ffmpeg to optimize media.")
        sys.exit(1)
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {' '.join(map(str, command))}\n{e.stderr.decode()}")
        return False


def process_image(file_path: Path, output_dir: Path):
    name_stem = file_path.stem

    # High-res webp (for lightbox/full view)
    target_webp = output_dir / f"{WEB_PREFIX}{name_stem}.webp"
    # Thumbnail webp (for grid)
    target_thumb = output_dir / f"{WEB_PREFIX}{name_stem}_thumb.webp"

    print(f"Processing image: {file_path.name}")

    # Convert to WebP (high quality); scale to max 1920 width, keep aspect ratio
    if not target_webp.exists():
        cmd_convert = [
            "ffmpeg", "-i", str(file_path),
            "-vf", "scale='min(1920,iw)':-1",
            "-q:v", "80",
            str(target_webp),
        ]
        if run_command(cmd_convert):
            print(f"  -> Created {target_webp}")
    else:
        print(f"  -> Skipped (exists): {target_webp}")

    # Thumbnail (approx 400px wide) for grids
    if not target_thumb.exists():
        cmd_thumb = [
            "ffmpeg", "-i", str(file_path),
            "-vf", "scale='min(400,iw)':-1",
            "-q:v", "70",
            str(target_thumb),
        ]
        if run_command(cmd_thumb):
            print(f"  -> Created thumbnail {target_thumb}")
    else:
        print(f"  -> Skipped (exists): {target_thumb}")


def process_video(file_path: Path, output_dir: Path):
    name_stem = file_path.stem

    target_mp4 = output_dir / f"{WEB_PREFIX}{name_stem}.mp4"
    target_poster = output_dir / f"{WEB_PREFIX}{name_stem}_poster.jpg"

    print(f"Processing video: {file_path.name}")

    # Convert to MP4 (H.264/AAC), scaled to max 1280 wide for web delivery
    if not target_mp4.exists():
        cmd_convert = [
            "ffmpeg", "-i", str(file_path),
            "-vf", "scale='min(1280,iw)':-2",  # even dimensions for encoder compatibility
            "-c:v", "libx264", "-preset", "slow", "-crf", "23",
            "-c:a", "aac", "-b:a", "128k",
            "-movflags", "+faststart",
            str(target_mp4),
        ]
        if run_command(cmd_convert):
            print(f"  -> Created {target_mp4}")
    else:
        print(f"  -> Skipped (exists): {target_mp4}")

    # Poster image (frame at 1 second)
    if not target_poster.exists():
        cmd_poster = [
            "ffmpeg", "-i", str(file_path),
            "-ss", "00:00:01", "-vframes", "1",
            "-q:v", "5",
            str(target_poster),
        ]
        if run_command(cmd_poster):
            print(f"  -> Created poster {target_poster}")
    else:
        print(f"  -> Skipped (exists): {target_poster}")


def resolve_dir(value: str) -> Path:
    path = Path(value)
    return path if path.is_absolute() else REPO_ROOT / path


def pick_default_source() -> Path:
    for candidate in DEFAULT_SOURCES:
        path = REPO_ROOT / candidate
        if path.is_dir():
            return path
    # Nothing exists yet; report the preferred location.
    return REPO_ROOT / DEFAULT_SOURCES[0]


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "--source",
        help="Directory of raw photos/videos (default: media/inbox/, falling back to 'iCloud Photos/'). "
             "Relative paths are resolved from the repo root.",
    )
    parser.add_argument(
        "--output",
        default=DEFAULT_OUTPUT,
        help=f"Directory for optimized output (default: {DEFAULT_OUTPUT}/). "
             "Relative paths are resolved from the repo root.",
    )
    args = parser.parse_args()

    source_path = resolve_dir(args.source) if args.source else pick_default_source()
    output_dir = resolve_dir(args.output)

    if not source_path.is_dir():
        print(f"Source directory not found: {source_path}")
        print("Create it and drop raw photos/videos inside, or pass --source <dir>.")
        sys.exit(1)

    output_dir.mkdir(parents=True, exist_ok=True)

    files = sorted(f for f in source_path.iterdir() if f.is_file())

    count_processed = 0
    print(f"Found {len(files)} files in {source_path}")

    for file_path in files:
        # Ignore hidden files
        if file_path.name.startswith("."):
            continue

        ext = file_path.suffix.lower()

        if ext in IMAGE_EXTS:
            process_image(file_path, output_dir)
            count_processed += 1
        elif ext in VIDEO_EXTS:
            process_video(file_path, output_dir)
            count_processed += 1

    print(f"\nProcessing complete. Processed {count_processed} files.")
    print("Next: add the new files to media/gallery.json and run `npm run media:update`.")


if __name__ == "__main__":
    main()
