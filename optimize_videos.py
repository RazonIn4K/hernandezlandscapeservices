import os
import subprocess
import glob


def optimize_videos(directory, threshold_mb=20):
    print(f"Scanning {directory} for videos larger than {threshold_mb}MB...")

    # Get all mp4 files
    files = glob.glob(os.path.join(directory, "*.mp4"))

    for filepath in files:
        size_mb = os.path.getsize(filepath) / (1024 * 1024)

        if size_mb > threshold_mb:
            filename = os.path.basename(filepath)
            print(f"\nProcessing {filename} (Size: {size_mb:.2f} MB)...")

            output_path = os.path.join(directory, f"optimized_{filename}")

            # ffmpeg command:
            # -crf 28 (Good compression for web)
            # -preset medium (Balance speed/compression)
            # -movflags +faststart (Web optimization for streaming)
            cmd = [
                "ffmpeg",
                "-y",
                "-i",
                filepath,
                "-vcodec",
                "libx264",
                "-crf",
                "28",
                "-preset",
                "medium",
                "-acodec",
                "aac",
                "-b:a",
                "128k",
                "-movflags",
                "+faststart",
                output_path,
            ]

            try:
                subprocess.run(
                    cmd,
                    check=True,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )

                new_size_mb = os.path.getsize(output_path) / (1024 * 1024)
                reduction = (1 - (new_size_mb / size_mb)) * 100

                print(
                    f"  -> Optimized Size: {new_size_mb:.2f} MB (Reduced by {reduction:.1f}%)"
                )

                if new_size_mb < size_mb:
                    os.replace(output_path, filepath)
                    print(f"  -> SUCCESS: Replaced original file.")
                else:
                    if os.path.exists(output_path):
                        os.remove(output_path)
                    print(
                        f"  -> SKIPPED: Optimization did not reduce size. Keeping original."
                    )

            except subprocess.CalledProcessError as e:
                print(f"  -> ERROR: Failed to optimize {filename}.")
                if os.path.exists(output_path):
                    os.remove(output_path)
            except Exception as e:
                print(f"  -> ERROR: Unexpected error: {e}")


if __name__ == "__main__":
    base_dir = "/Users/davidortiz/Main-Learning-Vault/hernandezlandscapeservices"
    target_dir = os.path.join(base_dir, "hernandez_images")
    optimize_videos(target_dir)
