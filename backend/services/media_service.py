import os
import uuid
import ffmpeg

TEMP_IMG_DIR = "temp_images"
os.makedirs(TEMP_IMG_DIR, exist_ok=True)

def extract_screenshots(video_path: str, timestamps: list[int]) -> list[str]:
    """
    Extracts screenshots from a video at the given timestamps (in seconds).
    Returns a list of file paths to the extracted images.
    """
    image_paths = []
    
    for timestamp in timestamps:
        # Generate a unique filename for the image
        img_filename = f"step_{timestamp}_{uuid.uuid4().hex[:8]}.jpg"
        img_path = os.path.join(TEMP_IMG_DIR, img_filename)
        
        try:
            # Run ffmpeg to extract a single frame at the given timestamp
            (
                ffmpeg
                .input(video_path, ss=timestamp)
                .filter('scale', 1280, 1280, force_original_aspect_ratio='decrease') # Maintain aspect ratio, max 1280px on any side
                .output(img_path, vframes=1, qscale=2) # High quality jpeg
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
            image_paths.append(img_path)
        except ffmpeg.Error as e:
            print(f"ffmpeg error at timestamp {timestamp}: {e.stderr.decode()}")
            # If extraction fails, append None so the length matches the timestamps
            image_paths.append(None)
            
    return image_paths
