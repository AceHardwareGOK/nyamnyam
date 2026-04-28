import os
import uuid
import yt_dlp

TEMP_DIR = "temp_videos"
os.makedirs(TEMP_DIR, exist_ok=True)

def download_video(url: str) -> tuple[str, str]:
    """
    Downloads a video from the given URL and extracts its description.
    Returns a tuple of (filepath, description).
    """
    file_id = str(uuid.uuid4())
    filepath = os.path.join(TEMP_DIR, f"{file_id}.mp4")
    
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': filepath,
        'quiet': True,
        'no_warnings': True,
    }
    
    description = ""
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(url, download=True)
            description = info.get('description', '') or info.get('title', '')
        except Exception as e:
            print(f"Error downloading video: {e}")
            raise Exception(f"Failed to download video: {str(e)}")
            
    return filepath, description
