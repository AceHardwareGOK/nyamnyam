from fastapi import APIRouter, HTTPException, Header, Depends, UploadFile, File
from pydantic import BaseModel
import os
import shutil

from services.video_service import download_video
from services.ai_service import extract_recipe_from_video
from services.media_service import extract_screenshots
from services.db_service import upload_image, save_recipe, get_all_recipes, get_recipe_by_id, supabase, delete_recipe, delete_all_recipes, update_recipe, make_recipe_public

router = APIRouter()

def get_current_user_id(authorization: str = Header(None)) -> str | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    try:
        # Use our existing supabase client to parse the token
        res = supabase.auth.get_user(token)
        if res and res.user:
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
    url: str

@router.post("/extract")
def extract_recipe(req: ExtractRequest, user_id: str | None = Depends(get_current_user_id)):
    video_path = None
    try:
        # 1. Download video & extract description
        print(f"Downloading video from {req.url}...")
        video_path, description = download_video(req.url)
        
        # 2. Extract recipe via AI
        print("Extracting recipe via Gemini AI...")
        recipe = extract_recipe_from_video(video_path, description)
        
        # 3. Extract screenshots using timestamps
        print("Extracting screenshots via ffmpeg...")
        timestamps = [step.timestamp_seconds for step in recipe.steps]
        timestamps.append(recipe.final_result_timestamp_seconds)
        local_images = extract_screenshots(video_path, timestamps)
        
        # 4. Upload images to Supabase
        print("Uploading images to Supabase...")
        public_image_urls = []
        for img_path in local_images:
            if img_path and os.path.exists(img_path):
                public_url = upload_image(img_path)
                public_image_urls.append(public_url)
                # Cleanup local image
                os.remove(img_path)
            else:
                public_image_urls.append("")
                
        # 5. Save to database
        print("Saving recipe to Database...")
        # The last image is the main image
        step_public_urls = public_image_urls[:-1] if public_image_urls else []
        main_image_url = public_image_urls[-1] if public_image_urls else ""
        
        saved_data = save_recipe(recipe, step_public_urls, req.url, user_id, main_image_url)
        
        # Inject image URLs into the returned recipe object
        recipe_dict = recipe.model_dump()
        for i, step in enumerate(recipe_dict["steps"]):
            step["image_url"] = step_public_urls[i] if i < len(step_public_urls) else ""
            
        recipe_dict["main_image_url"] = main_image_url
            
        # Return complete recipe to frontend
        return {
            "status": "success",
            "message": "Рецепт успішно згенеровано",
            "data": recipe_dict,
            "db_info": saved_data
        }
        
    except Exception as e:
        print(f"Extraction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup video file
        if video_path and os.path.exists(video_path):
            os.remove(video_path)

@router.delete("/recipes/{recipe_id}")
def delete_recipe_route(recipe_id: str, user_id: str | None = Depends(get_current_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
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
    ingredients: list[str]
    steps: list[dict]
    main_image_url: str | None = None

@router.put("/recipes/{recipe_id}")
def update_recipe_route(recipe_id: str, req: UpdateRecipeRequest, user_id: str | None = Depends(get_current_user_id)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
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
