import time
import json
from pydantic import BaseModel, Field
from typing import List
from google import genai
from config import GEMINI_API_KEY

class RecipeStep(BaseModel):
    instruction: str = Field(description="Детальний опис кроку приготування")
    timestamp_seconds: int = Field(description="Таймкод у секундах, на якому найкраще видно цей крок або інгредієнти для нього.")

class NutritionInfo(BaseModel):
    calories_100g: int = Field(description="Калорійність (ккал) на 100 грамів. Якщо неможливо визначити, 0")
    protein_100g: int = Field(description="Білки (г) на 100 грамів. Якщо неможливо визначити, 0")
    fat_100g: int = Field(description="Жири (г) на 100 грамів. Якщо неможливо визначити, 0")
    carbs_100g: int = Field(description="Вуглеводи (г) на 100 грамів. Якщо неможливо визначити, 0")
    calories_serving: int = Field(description="Калорійність (ккал) на одну порцію. Якщо неможливо визначити, 0")
    protein_serving: int = Field(description="Білки (г) на одну порцію. Якщо неможливо визначити, 0")
    fat_serving: int = Field(description="Жири (г) на одну порцію. Якщо неможливо визначити, 0")
    carbs_serving: int = Field(description="Вуглеводи (г) на одну порцію. Якщо неможливо визначити, 0")

class RecipeExtraction(BaseModel):
    title: str = Field(description="Назва страви")
    time_minutes: int = Field(description="Час приготування у хвилинах. Якщо невідомо, використовуйте 0")
    servings: int = Field(description="Кількість порцій. Якщо невідомо, 1")
    nutrition: NutritionInfo = Field(description="Харчова цінність (КБЖВ)")
    ingredients: List[str] = Field(description="Список інгредієнтів з їх точними пропорціями (особливо зверніть увагу на текстовий опис відео)")
    steps: List[RecipeStep] = Field(description="Покроковий рецепт приготування з таймкодами для скриншотів")
    final_result_timestamp_seconds: int = Field(description="Секунда у відео, де найкраще видно готову страву (фінальний результат)")

# Initialize client
client = genai.Client(api_key=GEMINI_API_KEY)

def extract_recipe_from_video(filepath: str, description: str) -> RecipeExtraction:
    """
    Uploads video to Gemini File API and extracts recipe using the video and its description.
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set")
        
    print(f"Uploading {filepath} to Gemini...")
    video_file = client.files.upload(file=filepath)
    
    print("Waiting for video processing...")
    # Wait for processing
    while video_file.state.name == "PROCESSING":
        time.sleep(2)
        video_file = client.files.get(name=video_file.name)
        
    if video_file.state.name == "FAILED":
        raise Exception("Video processing failed in Gemini")
        
    prompt = f"""
    Ти - професійний кулінарний редактор. Твоє завдання - витягти рецепт із цього відео та його оригінального текстового опису.
    
    ТЕКСТОВИЙ ОПИС ВІДЕО:
    {description}
    
    ІНСТРУКЦІЇ:
    1. Знайди точну назву страви.
    2. Витягни список інгредієнтів (шукай точні пропорції в тексті опису).
    3. Склади покрокову інструкцію приготування.
    4. Для КОЖНОГО кроку визнач один таймкод (у секундах), на якому найкраще видно дію або результат цього кроку у відео (щоб ми могли зробити скриншот).
    """
    
    print("Extracting recipe...")
    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=[video_file, prompt],
        config={
            "response_mime_type": "application/json",
            "response_schema": RecipeExtraction,
            "temperature": 0.2
        }
    )
    
    # Cleanup file
    print("Cleaning up Gemini file...")
    try:
        client.files.delete(name=video_file.name)
    except Exception as e:
        print(f"Failed to delete file from Gemini: {e}")
        
    if hasattr(response, 'parsed') and response.parsed:
        return response.parsed
    else:
        return RecipeExtraction.model_validate_json(response.text)
