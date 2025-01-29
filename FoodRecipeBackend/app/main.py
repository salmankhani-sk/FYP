import openai
import os
import requests
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException,UploadFile, File
from pydantic import BaseModel
from dotenv import load_dotenv

from google.cloud import vision
from google.oauth2 import service_account

import io
from openai import OpenAI

# Load environment variables
load_dotenv()

# FastAPI instance
app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this to your frontend domain (e.g., "http://localhost:3000") if you want
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Set OpenAI API key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OpenAI API key not found. Make sure it's set in your .env file.")
openai.api_key = OPENAI_API_KEY

# Pydantic model for input validation
class RecipePrompt(BaseModel):
    prompt: str
    
def sanitize_description(description: str) -> str:
    # Remove common photographic terms
    exclude_terms = ["closeup", "picture", "view", "photography"]
    sanitized = " ".join(
        word
        for word in description.split()
        if word.lower() not in exclude_terms
    )
    return sanitized 
    
@app.get("/get-images/{query}")
async def get_images(query: str):
    api_url = "https://api.pexels.com/v1/search"
    headers = {"Authorization": PEXELS_API_KEY}
    params = {"query": f"{query}  cooked dish", "per_page": 8}

    try:
        response = requests.get(api_url, headers=headers, params=params)
        if response.status_code == 200:
            data = response.json()
            images = [
                {
                    "id": photo["id"],
                    "url": photo["src"]["medium"],
                    "alt": query.capitalize(),  # Use the query as the description
                }
                for photo in data["photos"]
            ]
            return {"images": images}
        return {"images": []}
    except Exception as e:
        print(f"Error fetching images: {str(e)}")
        return {"images": []}
    
    
    
# Youtube Video Embeding




@app.get("/get-videos/{query}")
async def get_videos(query: str):
    """
    Fetch related YouTube videos for a given query after refining it using OpenAI API.
    """
    try:
        # Step 1: Use OpenAI to Generate a More Specific Search Query
        messages = [
            {"role": "system", "content": "You are an AI that improves search queries for finding the best cooking videos."},
            {"role": "user", "content": f"Generate an accurate YouTube search query for cooking a {query} recipe."}
        ]

        openai_response = openai.chat.completions.create(
            model="gpt-4",
            messages=messages,
            max_tokens=50,
            temperature=0.7
        )

        refined_query = openai_response.choices[0].message.content.strip()
        print(f"Refined Search Query: {refined_query}")  # Debugging log

        # Step 2: Fetch YouTube Videos Using the Refined Query
        youtube_api_url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            "part": "snippet",
            "q": refined_query,  # Using the refined query from OpenAI
            "type": "video",
            "maxResults": 3,  # Number of videos to fetch
            "key": YOUTUBE_API_KEY,
        }

        response = requests.get(youtube_api_url, params=params)
        if response.status_code == 200:
            data = response.json()
            videos = [
                {
                    "videoId": item["id"]["videoId"],
                    "title": item["snippet"]["title"],
                    "thumbnail": item["snippet"]["thumbnails"]["medium"]["url"],
                }
                for item in data["items"]
            ]
            return {"videos": videos}

        print("YouTube API Error:", response.status_code, response.text)  # Debug error
        return {"videos": []}

    except Exception as e:
        print(f"Error fetching YouTube videos: {str(e)}")
        return {"videos": []}

@app.post("/generate-recipe/")
async def generate_recipe(recipe_prompt: RecipePrompt):
    """
    Generate a recipe using OpenAI's API.
    """
    try:
        # Construct the prompt with cuisine and user input
        messages = [
            {"role": "system", "content": "You are an AI that generates detailed recipes with ingredients, preparation steps, and cook times"},
            {"role": "user", "content": f"Generate a  recipe for {recipe_prompt.prompt}"}
        ]

        # Call OpenAI API
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=messages,
            max_tokens=100,
            temperature=0.7
        )
        recipe = response.choices[0].message.content.strip()
        return {"recipe": recipe}
    except openai.OpenAIError as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")




# Load Google Vision API Key
GOOGLE_VISION_CREDENTIALS_PATH = os.getenv("GOOGLE_VISION_CREDENTIALS_PATH")
if not GOOGLE_VISION_CREDENTIALS_PATH:
    raise ValueError("Google Vision credentials path not found. Set GOOGLE_VISION_CREDENTIALS_PATH in .env.")

credentials = service_account.Credentials.from_service_account_file(GOOGLE_VISION_CREDENTIALS_PATH)
vision_client = vision.ImageAnnotatorClient(credentials=credentials)

# OpenAI API Key (for text generation)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

# 🔥 Endpoint to Upload Image & Generate Recipe
@app.post("/upload-image/")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Read image file
        image_bytes = await file.read()

        # Convert image to Google Vision API format
        image = vision.Image(content=image_bytes)
        response = vision_client.label_detection(image=image)
        labels = [label.description.lower() for label in response.label_annotations]

        # Extract food-related ingredients (filter out non-food labels)
        food_ingredients = [label for label in labels if label not in ["dish", "food", "meal", "cuisine"]]

        if not food_ingredients:
            return {"error": "No ingredients detected. Please try a different image."}

        # 🔥 Generate a recipe using OpenAI GPT-3.5
        messages = [
            {"role": "system", "content": "You are an AI chef. Create a recipe based on given ingredients."},
            {"role": "user", "content": f"Generate a recipe using these ingredients: {', '.join(food_ingredients)}"}
        ]

        openai_response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=250,
            temperature=0.7
        )

        recipe = openai_response.choices[0].message.content.strip()

        return {"ingredients": food_ingredients, "recipe": recipe}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")