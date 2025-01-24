import openai
import os
import requests
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv



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
if not OPENAI_API_KEY:
    raise ValueError("OpenAI API key not found. Make sure it's set in your .env file.")
openai.api_key = OPENAI_API_KEY

# Pydantic model for input validation
class RecipePrompt(BaseModel):
    prompt: str
    
    
    
@app.get("/get-images/{query}")
async def get_images(query: str):
    """
    Fetch multiple image URLs for the given query using the Pexels API.
    """
    api_url = "https://api.pexels.com/v1/search"
    headers = {"Authorization": PEXELS_API_KEY}
    params = {"query": f"{query} cooked dish", "per_page": 5}  # Fetch 5 images

    try:
        response = requests.get(api_url, headers=headers, params=params)
        if response.status_code == 200:
            data = response.json()
            images = [
                {"id": photo["id"], "url": photo["src"]["medium"], "alt": photo["alt"]}
                for photo in data["photos"]
            ]
            return {"images": images}
        return {"images": []}  # Return an empty array if no results
    except Exception as e:
        print(f"Error fetching images: {str(e)}")
        return {"images": []}
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
# @app.get("/get-image/{recipe_name}")
# async def get_image(recipe_name: str):
#     api_url = f"https://api.unsplash.com/search/photos?query={recipe_name}&client_id={UNSPLASH_API_KEY}"
#     response = requests.get(api_url)
#     if response.status_code == 200:
#         data = response.json()   
#         return {"image_url": data["results"][0]["urls"]["regular"]}
#     return {"image_url": "/images/placeholder.jpg"}
# @app.get("/get-image/{recipe_name}")
# async def get_image(recipe_name: str):
#     """
#     Fetch an image URL for the given recipe name using the Unsplash API.
#     """
#     api_url = f"https://api.unsplash.com/search/photos"
#     query = f"{recipe_name} cooked"
#     params = {
#         "query": query,
#         "client_id": UNSPLASH_API_KEY,
#         "per_page": 5,  # Fetch multiple results
#     }

#     try:
#         response = requests.get(api_url, params=params)
#         if response.status_code == 200:
#             data = response.json()
#             if data["results"]:
#                 # Randomly select an image from the results
#                 import random
#                 random_image = random.choice(data["results"])
#                 return {"image_url": random_image["urls"]["regular"]}
#         return {"image_url": "/images/placeholder.jpg"}  # Default fallback
#     except Exception as e:
#         print(f"Error fetching image: {str(e)}")
#         return {"image_url": "/images/placeholder.jpg"}
