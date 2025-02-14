from fastapi.responses import FileResponse
import openai
import os
import requests
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException,UploadFile, File
from pydantic import BaseModel
from dotenv import load_dotenv
import torch
import clip
import faiss
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from PIL import Image
import io
from google.cloud import vision
from google.oauth2 import service_account
from openai import OpenAI
from fpdf import FPDF
from pydantic import BaseModel
from fastapi.responses import FileResponse
import traceback  # To log errors
from typing import List
from fastapi_users import FastAPIUsers, schemas ,  BaseUserManager
from fastapi_users.authentication import JWTAuthentication
from fastapi_users.db import SQLAlchemyUserDatabase
from fastapi import Depends
from sqlalchemy import Boolean, Column , Integer , String
from sqlalchemy.ext.asyncio import AsyncSession , create_async_engine
from sqlalchemy.orm import sessionmaker
from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTable, SQLAlchemyUserDatabase 
from db import engine, Base, get_db_session
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi_users import FastAPIUsers, BaseUserManager
from fastapi_users.authentication import JWTAuthentication
from fastapi_users.db import SQLAlchemyUserDatabase
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import os
from db import engine, Base, get_db_session
from models import User, UserRecipeHistory
from fastapi_users.authentication import JWTStrategy
from fastapi_users import FastAPIUsers, UserManager
from fastapi_users.authentication import AuthenticationBackend, BearerTransport




os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"




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
SECRET_KEY = os.getenv("SECRET_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OpenAI API key not found. Make sure it's set in your .env file.")
openai.api_key = OPENAI_API_KEY



auth_backend = JWTAuthentication(secret=SECRET_KEY, lifetime_seconds=3600)
# Define the Bearer Token Transport
bearer_transport = BearerTransport(tokenUrl="auth/jwt/login")



def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=SECRET_KEY, lifetime_seconds=3600)

# Set up the Authentication Backend
auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)
# User Manager
class UserManager(BaseUserManager[User, int]):
    user_db_model = User

    async def on_after_register(self, user: User, request=None):
        print(f"User {user.email} has registered.")

# User DB Adapter
async def get_user_db():
    async with get_db_session() as session:
        yield SQLAlchemyUserDatabase(User, session)

# Instantiate FastAPI Users
fastapi_users = FastAPIUsers[User, int](
    get_user_db,
    [auth_backend],  # Add all backends here
    UserManager,
)
# User routes
# Add the authentication routes
app.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/auth/jwt",
    tags=["auth"],
)
# FastAPI-Users setup
fastapi_users = FastAPIUsers[User, int](
    get_user_db,
    [auth_backend],  # Pass the auth backend here
    UserManager,
)

# Add the registration route
app.include_router(
    fastapi_users.get_register_router(),
    prefix="/auth",
    tags=["auth"],
)

# Optionally, add the reset password and verify email routes

# Models for Endpoints
class RecipePrompt(BaseModel):
    prompt: str

# On startup: Initialize database
@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Example endpoint: Save recipe search to UserRecipeHistory
@app.post("/generate-recipe/")
async def generate_recipe(
    recipe_prompt: RecipePrompt,
    db: AsyncSession = Depends(get_db_session),
    user: User = Depends(fastapi_users.current_user),
):
    try:
        # Save the user's search to the database
        recipe_history = UserRecipeHistory(
            user_id=user.id, recipe=recipe_prompt.prompt
        )
        db.add(recipe_history)
        await db.commit()

        # Dummy response (replace with actual recipe generation logic)
        return {"recipe": f"Generated recipe for: {recipe_prompt.prompt}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




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

# Load CLIP model
device = "cpu"  # Since your laptop does not have CUDA
model, preprocess = clip.load("ViT-B/32", device=device)

# Load FAISS Index with embeddings
d = 512  # CLIP generates 512-dimensional embeddings
index = faiss.IndexFlatL2(d)

try:
    stored_embeddings = np.load("food_embeddings.npy")
    index.add(stored_embeddings)
    with open("recipe_names.txt", "r") as f:
        recipe_names = f.read().splitlines()
except FileNotFoundError:
    print("No stored embeddings found, please generate them in Colab first.")

# Function to generate image embeddings
def get_image_embedding(image_bytes):
    image = Image.open(io.BytesIO(image_bytes))
    image = preprocess(image).unsqueeze(0).to(device)

    with torch.no_grad():
        embedding = model.encode_image(image)

    return embedding.cpu().numpy()


@app.post("/upload-image/")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Read and process the uploaded image
        image_bytes = await file.read()
        print(f"Received file: {file.filename}")  # Debug log
        query_embedding = get_image_embedding(image_bytes)

        # Search for the closest match in FAISS
        D, I = index.search(query_embedding, k=1)
        best_match = recipe_names[I[0][0]]  # Best-matching dish name

        # ✅ Use OpenAI to generate a recipe
        messages = [
            {"role": "system", "content": "You are an expert chef AI that generates detailed food recipes."},
            {"role": "user", "content": f"Generate a detailed recipe for {best_match}."}
        ]

        response = openai.chat.completions.create(
            model="gpt-4",
            messages=messages,
            max_tokens=150,
            temperature=0.7
        )
        generated_recipe = response.choices[0].message.content.strip()
        print(f"Generated Recipe: {generated_recipe}")  # Debug log

        return {
            "dish": best_match,
            "recipe": generated_recipe
        }

    except Exception as e:
        print(f"Error: {e}")  # Debug log
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-recipe-from-ingredients/")
async def generate_recipe_from_ingredients(ingredients: RecipePrompt):
    try:
        messages = [
            {"role": "system", "content": "You are an AI chef that suggests recipes based on available ingredients."},
            {"role": "user", "content": f"Suggest a recipe using these ingredients: {ingredients.prompt}"}
        ]
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=messages,
            max_tokens=150,
            temperature=0.7
        )
        recipe = response.choices[0].message.content.strip()
        return {"recipe": recipe}
    except openai.OpenAIError as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")
    
    
NUTRITIONIX_API_KEY = os.getenv("NUTRITIONIX_API_KEY")
NUTRITIONIX_APP_ID = os.getenv("NUTRITIONIX_APP_ID")
if not NUTRITIONIX_API_KEY or not NUTRITIONIX_APP_ID:
    raise ValueError("Nutritionix API keys not found. Set them in your .env file.")
print(NUTRITIONIX_API_KEY)
print(NUTRITIONIX_APP_ID)
# Model for user input
class FoodRequest(BaseModel):
    food_item: str

# Generate Recipe and Nutrition PDFimport traceback  # Add this to log errors

@app.post("/generate-food-pdf/")
async def generate_food_pdf(food_request: FoodRequest):
    try:
        food_item = food_request.food_item
        print(f"Received food item: {food_item}")  # Debug input

        # Step 1: Fetch Nutrition Details Using Nutritionix API
        headers = {
            "x-app-id": NUTRITIONIX_APP_ID,
            "x-app-key": NUTRITIONIX_API_KEY,
        }
        params = {"query": food_item}
        nutrition_response = requests.post(
            "https://trackapi.nutritionix.com/v2/natural/nutrients", headers=headers, json=params
        )
        if nutrition_response.status_code != 200:
            print(f"Nutritionix error: {nutrition_response.text}")  # Debug nutrition API response
            raise HTTPException(status_code=400, detail="Error fetching nutrition data.")
        nutrition_data = nutrition_response.json()
        print(f"Nutrition data: {nutrition_data}")  # Debug nutrition data

        # Step 2: Generate a PDF with the Nutrition Data
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)

        # Add PDF Title
        pdf.set_font("Arial", style="B", size=16)
        pdf.cell(200, 10, txt=f"Nutrition Details for {food_item.title()}", ln=True, align="C")
        pdf.ln(10)

        # Add Nutrition Details
        pdf.set_font("Arial", size=12)
        for food in nutrition_data.get("foods", []):
            pdf.cell(200, 10, txt=f"Food: {food['food_name'].title()}", ln=True)
            pdf.cell(200, 10, txt=f"Calories: {food.get('nf_calories', 'N/A')} kcal", ln=True)
            pdf.cell(200, 10, txt=f"Total Fat: {food.get('nf_total_fat', 'N/A')} g", ln=True)
            pdf.cell(200, 10, txt=f"Protein: {food.get('nf_protein', 'N/A')} g", ln=True)
            pdf.cell(200, 10, txt=f"Carbohydrates: {food.get('nf_total_carbohydrate', 'N/A')} g", ln=True)
            pdf.ln(5)

        # Save PDF to a file
        pdf_file_path = f"{food_item.replace(' ', '_')}_nutrition_details.pdf"
        pdf.output(pdf_file_path)
        print(f"PDF successfully created: {pdf_file_path}")  # Debug PDF generation

        # Return the PDF as a downloadable file
        return FileResponse(
            pdf_file_path,
            media_type="application/pdf",
            filename=pdf_file_path
        )

    except Exception as e:
        print(f"Error: {e}")  # Log the error
        traceback.print_exc()  # Print full stack trace
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")
    
class ShoppingListRequest(BaseModel):
    recipes: List[str] 

@app.post("/generate-shopping-list/")
async def generate_shopping_list(request: ShoppingListRequest):
    try:
        selected_recipes = request.recipes
        shopping_list = {}

        # Generate ingredients for each recipe using OpenAI
        for recipe in selected_recipes:
            messages = [
                {"role": "system", "content": "You are an AI chef that provides ingredients lists for recipes."},
                {"role": "user", "content": f"Provide a list of ingredients needed for {recipe}."}
            ]
            response = openai.chat.completions.create(
                model="gpt-4",
                messages=messages,
                max_tokens=200,
                temperature=0.7,
            )
            ingredients = response.choices[0].message.content.strip().split("\n")

            # Add ingredients to the shopping list
            for ingredient in ingredients:
                item = ingredient.strip()
                if item:
                    shopping_list[item] = shopping_list.get(item, 0) + 1  # Count occurrences

        # Generate PDF
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)

        pdf.set_font("Arial", style="B", size=16)
        pdf.cell(200, 10, txt="Grocery Shopping List", ln=True, align="C")
        pdf.ln(10)

        pdf.set_font("Arial", size=12)
        for item, quantity in shopping_list.items():
            pdf.cell(200, 10, txt=f"- {item} (x{quantity})", ln=True)

        # Save PDF
        pdf_path = "shopping_list.pdf"
        pdf.output(pdf_path)

        return FileResponse(pdf_path, media_type="application/pdf", filename="shopping_list.pdf")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating shopping list: {str(e)}")