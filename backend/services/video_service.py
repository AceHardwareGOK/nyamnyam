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

import subprocess

def download_tiktok_carousel(url: str, output_dir: str = "temp_videos") -> tuple[str, str]:
    """
    Fetches TikTok carousel images via tikwm API and stitches them into a video.
    """
    import requests
    
    # Tikwm API call
    res = requests.get(f"https://tikwm.com/api/?url={url}")
    data = res.json()
    if data.get('code') != 0:
        raise Exception("Помилка завантаження каруселі: API повернув помилку")
        
    images = data.get('data', {}).get('images', [])
    desc = data.get('data', {}).get('title', '')
    
    if not images:
        raise Exception("Не знайдено фотографій у цій каруселі")
        
    os.makedirs(output_dir, exist_ok=True)
    job_id = str(uuid.uuid4())
    temp_img_dir = os.path.join(output_dir, f"carousel_{job_id}")
    os.makedirs(temp_img_dir, exist_ok=True)
    
    try:
        # Download images
        for i, img_url in enumerate(images):
            r = requests.get(img_url)
            with open(os.path.join(temp_img_dir, f"img{i:03d}.jpg"), "wb") as f:
                f.write(r.content)
                
        out_path = os.path.join(output_dir, f"{job_id}.mp4")
        
        # Stitch using ffmpeg (3 seconds per image)
        cmd = [
            "ffmpeg", "-y",
            "-framerate", "1/3",
            "-i", os.path.join(temp_img_dir, "img%03d.jpg"),
            "-c:v", "libx264",
            "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p",
            "-r", "30",
            out_path
        ]
        
        # Run ffmpeg, suppress output to not clutter logs
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        return out_path, desc
    finally:
        # Clean up temporary images directory
        import shutil
        if os.path.exists(temp_img_dir):
            shutil.rmtree(temp_img_dir)

def download_video(url: str, output_dir: str = "temp_videos") -> tuple[str, str]:
    """
    Downloads a video from the given URL using yt-dlp.
    Returns a tuple of (path_to_video_file, description).
    """
    os.makedirs(output_dir, exist_ok=True)
    url = resolve_tiktok_shortlink(url)

    # Check for unsupported TikTok photo carousels
    if "tiktok.com" in url and "/photo/" in url:
        return download_tiktok_carousel(url, output_dir)
    
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
