from fastapi import APIRouter, HTTPException, Header, Depends, UploadFile, File, Request
from pydantic import BaseModel
import os
import shutil

from services.video_service import download_video
from services.ai_service import extract_recipe_from_video
from services.media_service import extract_screenshots
from services.db_service import upload_image, save_recipe, get_all_recipes, get_recipe_by_id, supabase, delete_recipe, delete_all_recipes, update_recipe, make_recipe_public, create_job, update_job, get_job

router = APIRouter()

import time
from pydantic import BaseModel, HttpUrl
from limiter import limiter
import logging

logger = logging.getLogger(__name__)

auth_cache = {}
AUTH_CACHE_TTL = 300 # 5 minutes

def get_current_user_id(authorization: str = Header(None)) -> str | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    
    now = time.time()
    if token in auth_cache:
        user_id, expiry = auth_cache[token]
        if now < expiry:
            return user_id
        else:
            del auth_cache[token]

    try:
        # Use our existing supabase client to parse the token
        res = supabase.auth.get_user(token)
        if res and res.user:
            auth_cache[token] = (res.user.id, now + AUTH_CACHE_TTL)
            return res.user.id
    except Exception as e:
        print("Auth error:", e)
    return None

@router.post("/upload-image")
def upload_image_route(file: UploadFile = File(...), user_id: str | None = Depends(get_current_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Save file temporarily
    temp_path = f"temp_{file.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Upload via db_service
        public_url = upload_image(temp_path)
        if not public_url:
            raise HTTPException(status_code=500, detail="Не вдалося завантажити зображення у сховище")
            
        return {"status": "success", "url": public_url}
    except Exception as e:
        print("Upload error:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.get("/recipes")
def list_recipes(user_id: str | None = Depends(get_current_user_id)):
    recipes = get_all_recipes(user_id)
    return {"status": "success", "data": recipes}

@router.get("/recipes/{recipe_id}")
def get_recipe(recipe_id: str):
    recipe = get_recipe_by_id(recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Рецепт не знайдено")
    return {"status": "success", "data": recipe}

class ExtractRequest(BaseModel):
    url: HttpUrl

from fastapi import BackgroundTasks
import uuid

# No need for in-memory extraction_jobs anymore

def process_extraction_job(job_id: str, url: str, user_id: str | None):
    video_path = None
    try:
        update_job(job_id, "processing", "Завантаження відео...")
        logger.info(f"[{job_id}] Downloading video from {url}...")
        video_path, description = download_video(url)
        
        update_job(job_id, "processing", "Аналіз відео за допомогою ШІ...")
        logger.info(f"[{job_id}] Extracting recipe via Gemini AI...")
        recipe = extract_recipe_from_video(video_path, description)
        
        update_job(job_id, "processing", "Створення скріншотів кроків...")
        logger.info(f"[{job_id}] Extracting screenshots via ffmpeg...")
        timestamps = [step.timestamp_seconds for step in recipe.steps]
        timestamps.append(recipe.final_result_timestamp_seconds)
        local_images = extract_screenshots(video_path, timestamps)
        
        update_job(job_id, "processing", "Завантаження зображень у хмару...")
        logger.info(f"[{job_id}] Uploading images to Supabase...")
        public_image_urls = []
        for img_path in local_images:
            if img_path and os.path.exists(img_path):
                public_url = upload_image(img_path)
                public_image_urls.append(public_url)
                os.remove(img_path)
            else:
                public_image_urls.append("")
                
        update_job(job_id, "processing", "Збереження рецепта...")
        logger.info(f"[{job_id}] Saving recipe to Database...")
        step_public_urls = public_image_urls[:-1] if public_image_urls else []
        main_image_url = public_image_urls[-1] if public_image_urls else ""
        
        saved_data = save_recipe(recipe, step_public_urls, url, user_id, main_image_url)
        
        recipe_dict = recipe.model_dump()
        for i, step in enumerate(recipe_dict["steps"]):
            step["image_url"] = step_public_urls[i] if i < len(step_public_urls) else ""
            
        recipe_dict["main_image_url"] = main_image_url
            
        update_job(job_id, "success", "Рецепт успішно згенеровано", recipe_id=saved_data.get("id"))
        
    except Exception as e:
        logger.error(f"[{job_id}] Extraction error: {e}", exc_info=True)
        update_job(job_id, "error", "Внутрішня помилка", error=str(e))
    finally:
        if video_path and os.path.exists(video_path):
            os.remove(video_path)

def get_required_user_id(authorization: str = Header(None)) -> str:
    user_id = get_current_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized: Будь ласка, увійдіть в систему")
    return user_id

@router.post("/extract")
@limiter.limit("5/minute")
def extract_recipe(request: Request, req: ExtractRequest, background_tasks: BackgroundTasks, user_id: str = Depends(get_required_user_id)):
    job_id = str(uuid.uuid4())
    create_job(job_id, user_id)
    background_tasks.add_task(process_extraction_job, job_id, str(req.url), user_id)
    return {"status": "success", "job_id": job_id}

@router.get("/extract/status/{job_id}")
def get_extraction_status(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Завдання не знайдено")
    
    res = {"status": job["status"], "message": job["message"]}
    if job.get("error"): res["error"] = job["error"]
    if job.get("recipe_id"): res["db_info"] = {"id": job["recipe_id"]}
    return res

@router.delete("/recipes/{recipe_id}")
def delete_recipe_route(recipe_id: str, user_id: str | None = Depends(get_current_user_id)):
    success = delete_recipe(recipe_id, user_id)
    if not success:
        raise HTTPException(status_code=403, detail="Не вдалося видалити рецепт (можливо, він вам не належить)")
    return {"status": "success"}

@router.delete("/recipes")
def delete_all_recipes_route(user_id: str | None = Depends(get_current_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    success = delete_all_recipes(user_id)
    if not success:
        raise HTTPException(status_code=500, detail="Не вдалося видалити всі рецепти")
    return {"status": "success"}

class UpdateRecipeRequest(BaseModel):
    title: str
    time_minutes: int
    servings: int
    calories_100g: int | None = 0
    protein_100g: int | None = 0
    fat_100g: int | None = 0
    carbs_100g: int | None = 0
    calories_serving: int | None = 0
    protein_serving: int | None = 0
    fat_serving: int | None = 0
    carbs_serving: int | None = 0
    ingredients: list[str]
    steps: list[dict]
    main_image_url: str | None = None

@router.put("/recipes/{recipe_id}")
def update_recipe_route(recipe_id: str, req: UpdateRecipeRequest, user_id: str | None = Depends(get_current_user_id)):
    success = update_recipe(recipe_id, user_id, req.model_dump())
    if not success:
        raise HTTPException(status_code=403, detail="Не вдалося оновити рецепт")
    return {"status": "success"}

@router.post("/recipes/{recipe_id}/share")
def share_recipe_route(recipe_id: str, user_id: str | None = Depends(get_current_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    success = make_recipe_public(recipe_id, user_id)
    if not success:
        raise HTTPException(status_code=403, detail="Не вдалося зробити рецепт публічним")
    return {"status": "success"}
