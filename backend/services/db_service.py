import os
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY
from services.ai_service import RecipeExtraction

if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None

def upload_image(filepath: str, bucket_name: str = "recipes_media") -> str:
    """
    Uploads a local image file to Supabase Storage and returns its public URL.
    """
    if not supabase:
        print("Supabase client not initialized. Skipping image upload.")
        return ""
    
    filename = os.path.basename(filepath)
    try:
        with open(filepath, "rb") as f:
            supabase.storage.from_(bucket_name).upload(
                file=f,
                path=filename,
                file_options={"content-type": "image/jpeg"}
            )
        
        # Get public URL
        public_url = supabase.storage.from_(bucket_name).get_public_url(filename)
        return public_url
    except Exception as e:
        print(f"Failed to upload image {filename} to Supabase: {e}")
        return ""

def save_recipe(recipe: RecipeExtraction, step_images: list[str], source_url: str = "", user_id: str = None, main_image_url: str = "") -> dict:
    """
    Saves the extracted recipe and associated images to the Supabase Postgres database.
    """
    if not supabase:
        print("Supabase client not initialized. Skipping DB insert.")
        return {"id": "mock-uuid", "title": recipe.title}
        
    try:
        # 1. Insert recipe
        recipe_data = {
            "title": recipe.title,
            "source_url": source_url,
            "time_minutes": recipe.time_minutes,
            "servings": recipe.servings,
            "user_id": user_id,
            "is_public": False,
            "main_image_url": main_image_url
        }
        
        recipe_response = supabase.table("recipes").insert(recipe_data).execute()
        recipe_id = recipe_response.data[0]["id"]
        
        # 2. Insert ingredients
        ingredients_data = [
            {"recipe_id": recipe_id, "name": ing, "amount": ""} for ing in recipe.ingredients
        ]
        if ingredients_data:
            supabase.table("recipe_ingredients").insert(ingredients_data).execute()
            
        # 3. Insert steps
        steps_data = []
        for i, step in enumerate(recipe.steps):
            img_url = step_images[i] if i < len(step_images) else ""
            steps_data.append({
                "recipe_id": recipe_id,
                "step_number": i + 1,
                "instruction": step.instruction,
                "image_url": img_url,
                "timestamp_seconds": step.timestamp_seconds
            })
            
        if steps_data:
            supabase.table("recipe_steps").insert(steps_data).execute()
            
        return {"id": recipe_id, "title": recipe.title}
    except Exception as e:
        print(f"Database save error: {e}")
        raise Exception(f"Failed to save recipe to database: {str(e)}")

def get_all_recipes(user_id: str = None) -> list:
    """Fetches all recipes ordered by creation date."""
    if not supabase:
        return []
    try:
        query = supabase.table("recipes").select("*, recipe_steps(image_url)").order("created_at", desc=True)
        if user_id:
            # We want to get the user's private recipes OR public recipes
            # For simplicity right now, just the user's recipes
            query = query.eq("user_id", user_id)
        else:
            query = query.eq("is_public", True)
            
        response = query.execute()
        return response.data
    except Exception as e:
        print(f"Failed to fetch recipes: {e}")
        return []

def get_recipe_by_id(recipe_id: str) -> dict:
    """Fetches a complete recipe with ingredients and steps by ID."""
    if not supabase:
        return {}
    try:
        recipe_res = supabase.table("recipes").select("*").eq("id", recipe_id).single().execute()
        recipe = recipe_res.data
        
        ingredients_res = supabase.table("recipe_ingredients").select("name, amount").eq("recipe_id", recipe_id).execute()
        recipe["ingredients"] = ingredients_res.data
        
        steps_res = supabase.table("recipe_steps").select("*").eq("recipe_id", recipe_id).order("step_number").execute()
        recipe["steps"] = steps_res.data
        
        return recipe
    except Exception as e:
        print(f"Failed to fetch recipe {recipe_id}: {e}")
        return {}

def delete_recipe(recipe_id: str, user_id: str) -> bool:
    if not supabase: return False
    try:
        res = supabase.table("recipes").delete().eq("id", recipe_id).eq("user_id", user_id).execute()
        return True # if no error
    except Exception as e:
        print("Delete error:", e)
        return False

def delete_all_recipes(user_id: str) -> bool:
    if not supabase: return False
    try:
        res = supabase.table("recipes").delete().eq("user_id", user_id).execute()
        return True # if no error
    except Exception as e:
        print("Delete all error:", e)
        return False

def update_recipe(recipe_id: str, user_id: str, data: dict) -> bool:
    if not supabase: return False
    try:
        # Update main table
        update_data = {
            "title": data.get("title"),
            "time_minutes": data.get("time_minutes"),
            "servings": data.get("servings")
        }
        if "main_image_url" in data and data["main_image_url"]:
            update_data["main_image_url"] = data["main_image_url"]
            
        res = supabase.table("recipes").update(update_data).eq("id", recipe_id).eq("user_id", user_id).execute()
        if not res.data:
            return False
            
        # Re-insert ingredients and steps (delete old, insert new)
        supabase.table("recipe_ingredients").delete().eq("recipe_id", recipe_id).execute()
        if data.get("ingredients"):
            ing_data = [{"recipe_id": recipe_id, "name": ing, "amount": ""} for ing in data["ingredients"]]
            supabase.table("recipe_ingredients").insert(ing_data).execute()
            
        supabase.table("recipe_steps").delete().eq("recipe_id", recipe_id).execute()
        if data.get("steps"):
            steps_data = []
            for i, step in enumerate(data["steps"]):
                steps_data.append({
                    "recipe_id": recipe_id,
                    "step_number": i + 1,
                    "instruction": step.get("text", ""),
                    "image_url": step.get("image", ""),
                    "timestamp_seconds": 0
                })
            supabase.table("recipe_steps").insert(steps_data).execute()
        return True
    except Exception as e:
        print("Update error:", e)
        return False

def make_recipe_public(recipe_id: str, user_id: str) -> bool:
    if not supabase: return False
    try:
        supabase.table("recipes").update({"is_public": True}).eq("id", recipe_id).eq("user_id", user_id).execute()
        return True
    except Exception as e:
        print("Share error:", e)
        return False
