import os
import subprocess
import shutil
from pathlib import Path

# Configuration
SOURCE_DIR = "/Users/davidortiz/Main-Learning-Vault/hernandezlandscapeservices/iCloud Photos"
# Use absolute path for output directory to avoid confusion
OUTPUT_DIR = "/Users/davidortiz/Main-Learning-Vault/hernandezlandscapeservices/hernandez_images"
WEB_PREFIX = "web_"

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

def run_command(command):
    try:
        subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {' '.join(command)}\n{e.stderr.decode()}")
        return False

def process_image(file_path):
    filename = file_path.name
    name_stem = file_path.stem
    
    # Target filenames
    
    # High-res webp (for lightbox/full view)
    target_webp = os.path.join(OUTPUT_DIR, f"{WEB_PREFIX}{name_stem}.webp")
    # Thumbnail webp (for grid)
    target_thumb = os.path.join(OUTPUT_DIR, f"{WEB_PREFIX}{name_stem}_thumb.webp")
    
    print(f"Processing image: {filename}")
    
    # Convert to WebP (High Quality)
    # Scale to max 1920 width/height, keep aspect ratio
    if not os.path.exists(target_webp):
        cmd_convert = [
            "ffmpeg", "-i", str(file_path),
            "-vf", "scale='min(1920,iw)':-1",
            "-q:v", "80", 
            target_webp
        ]
        if run_command(cmd_convert):
            print(f"  -> Created {target_webp}")
    else:
        print(f"  -> Skipped (exists): {target_webp}")

    # Create Thumbnail
    # Scale to 400px width/height (approx) for grid
    if not os.path.exists(target_thumb):
        cmd_thumb = [
            "ffmpeg", "-i", str(file_path),
            "-vf", "scale='min(400,iw)':-1",
            "-q:v", "70",
            target_thumb
        ]
        if run_command(cmd_thumb):
            print(f"  -> Created thumbnail {target_thumb}")
    else:
        print(f"  -> Skipped (exists): {target_thumb}")

def process_video(file_path):
    filename = file_path.name
    name_stem = file_path.stem
    
    # Target filename
    target_mp4 = os.path.join(OUTPUT_DIR, f"{WEB_PREFIX}{name_stem}.mp4")
    target_poster = os.path.join(OUTPUT_DIR, f"{WEB_PREFIX}{name_stem}_poster.jpg")
    
    print(f"Processing video: {filename}")
    
    # Convert to MP4 (H.264/AAC)
    # Scale to 720p for web optimization
    if not os.path.exists(target_mp4):
        cmd_convert = [
            "ffmpeg", "-i", str(file_path),
            "-vf", "scale='min(1280,iw)':-2", # Ensure even dimensions for enc compatibility
            "-c:v", "libx264", "-preset", "slow", "-crf", "23",
            "-c:a", "aac", "-b:a", "128k",
            "-movflags", "+faststart",
            target_mp4
        ]
        if run_command(cmd_convert):
            print(f"  -> Created {target_mp4}")
    else:
         print(f"  -> Skipped (exists): {target_mp4}")

    # Generate Poster Image (Frame at 1 second or start)
    if not os.path.exists(target_poster):
        cmd_poster = [
            "ffmpeg", "-i", str(file_path),
            "-ss", "00:00:01", "-vframes", "1",
            "-q:v", "5",
            target_poster
        ]
        if run_command(cmd_poster):
             print(f"  -> Created poster {target_poster}")
    else:
         print(f"  -> Skipped (exists): {target_poster}")

def main():
    source_path = Path(SOURCE_DIR)
    
    # Extensions to look for
    image_exts = {'.heic', '.jpg', '.jpeg', '.png'}
    video_exts = {'.mov', '.mp4'}
    
    files = [f for f in source_path.iterdir() if f.is_file()]
    files.sort()
    
    count_processed = 0
    
    print(f"Found {len(files)} files in {SOURCE_DIR}")
    
    for file_path in files:
        # Ignore hidden files
        if file_path.name.startswith('.'):
            continue
            
        ext = file_path.suffix.lower()
        
        if ext in image_exts:
            process_image(file_path)
            count_processed += 1
        elif ext in video_exts:
            process_video(file_path)
            count_processed += 1
            
    print(f"\nProcessing complete. Processed {count_processed} files.")

if __name__ == "__main__":
    main()
