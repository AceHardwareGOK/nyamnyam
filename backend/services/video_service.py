import os
import uuid
import yt_dlp
import requests

TEMP_DIR = "temp_videos"
os.makedirs(TEMP_DIR, exist_ok=True)

def resolve_tiktok_shortlink(url: str) -> str:
    if "vt.tiktok.com" in url or "vm.tiktok.com" in url:
        try:
            # TikTok shortlinks block yt-dlp page extraction, resolve manually
            response = requests.head(url, allow_redirects=True, timeout=10)
            return response.url.split('?')[0]  # Remove query params for a clean URL
        except Exception as e:
            print(f"Failed to resolve shortlink: {e}")
            return url
    return url

def download_video(url: str) -> tuple[str, str]:
    """
    Downloads a video from the given URL and extracts its description.
    Returns a tuple of (filepath, description).
    """
    url = resolve_tiktok_shortlink(url)
    
    file_id = str(uuid.uuid4())
    filepath = os.path.join(TEMP_DIR, f"{file_id}.mp4")
    
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': filepath,
        'quiet': True,
        'no_warnings': True,
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-us,en;q=0.5'
        },
        'extractor_args': {
            'tiktok': ['api_hostname=api16-normal-c-useast1a.tiktokv.com']
        }
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
