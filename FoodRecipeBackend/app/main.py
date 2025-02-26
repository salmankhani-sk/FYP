# app/main.py
import os
import asyncio
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, status
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import openai
from pydantic import BaseModel
from dotenv import load_dotenv
import requests
import torch
import clip
import faiss
import numpy as np
from PIL import Image
import io
from google.cloud import vision
from google.oauth2 import service_account
from openai import OpenAI
from fpdf import FPDF
import traceback
from typing import List
import jwt
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext

import bcrypt
import types
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
# Patch bcrypt: Ensure bcrypt.__about__ is an object with a __version__ attribute
if not hasattr(bcrypt, "__about__") or not hasattr(bcrypt.__about__, "__version__"):
    bcrypt.__about__ = types.SimpleNamespace(__version__=bcrypt.__version__)
# -----------------------------

# Import async database components and ORM models
from .database import Base, engine, get_db
from .models import User, RecipeSearch, ChatLog, PDFRecord

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# Load environment variables
load_dotenv()

app = FastAPI()
oauth2_scheme = HTTPBearer()
# Startup event: create tables asynchronously
@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set API keys and secret
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
SECRET_KEY = os.getenv("SECRET_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OpenAI API key not found. Make sure it's set in your .env file.")
openai.api_key = OPENAI_API_KEY

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# Pydantic models for user operations
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")



def create_access_token(data: dict, expires_delta: int = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_delta) if expires_delta else datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Registration endpoint returns token with "sub"
@app.post("/register")
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.username == user.username))
    db_user = result.scalars().first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user.password)
    new_user = User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    access_token = create_access_token(data={"sub": new_user.username}, expires_delta=ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": new_user.username,
        "message": "User registered successfully"
    }

@app.post("/login")
async def login(user: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.username == user.username))
    db_user = result.scalars().first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": db_user.username}, expires_delta=ACCESS_TOKEN_EXPIRE_MINUTES)
    return {"access_token": access_token, "token_type": "bearer"}

# Pydantic model for recipe prompt
class RecipePrompt(BaseModel):
    prompt: str

def sanitize_description(description: str) -> str:
    exclude_terms = ["closeup", "picture", "view", "photography"]
    return " ".join(word for word in description.split() if word.lower() not in exclude_terms)

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
                {"id": photo["id"], "url": photo["src"]["medium"], "alt": query.capitalize()}
                for photo in data["photos"]
            ]
            return {"images": images}
        return {"images": []}
    except Exception as e:
        print(f"Error fetching images: {str(e)}")
        return {"images": []}

@app.get("/get-videos/{query}")
async def get_videos(query: str):
    try:
        messages = [
            {"role": "system", "content": "You are an AI that improves search queries for finding the best cooking videos."},
            {"role": "user", "content": f"Generate an accurate YouTube search query for cooking a {query} recipe."}
        ]
        openai_response = openai.chat.completions.create(
            model="gpt-4", messages=messages, max_tokens=50, temperature=0.7
        )
        refined_query = openai_response.choices[0].message.content.strip()
        print(f"Refined Search Query: {refined_query}")
        youtube_api_url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            "part": "snippet",
            "q": refined_query,
            "type": "video",
            "maxResults": 3,
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
        print("YouTube API Error:", response.status_code, response.text)
        return {"videos": []}
    except Exception as e:
        print(f"Error fetching YouTube videos: {str(e)}")
        return {"videos": []}

@app.post("/generate-recipe/")
async def generate_recipe(recipe_prompt: RecipePrompt, user: str = Depends(get_current_user)):
    try:
        messages = [
            {"role": "system", "content": "You are an AI that generates detailed recipes with ingredients, preparation steps, and cook times"},
            {"role": "user", "content": f"Generate a recipe for {recipe_prompt.prompt}"}
        ]
        response = openai.chat.completions.create(
            model="gpt-4", messages=messages, max_tokens=100, temperature=0.7
        )
        recipe = response.choices[0].message.content.strip()
        return {"recipe": recipe}
    except openai.OpenAIError as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

# Google Vision API setup
GOOGLE_VISION_CREDENTIALS_PATH = os.getenv("GOOGLE_VISION_CREDENTIALS_PATH")
if not GOOGLE_VISION_CREDENTIALS_PATH:
    raise ValueError("Google Vision credentials path not found. Set GOOGLE_VISION_CREDENTIALS_PATH in .env.")
credentials = service_account.Credentials.from_service_account_file(GOOGLE_VISION_CREDENTIALS_PATH)
vision_client = vision.ImageAnnotatorClient(credentials=credentials)

# OpenAI client initialization
client = OpenAI(api_key=OPENAI_API_KEY)

# Load CLIP model
device = "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

# Load FAISS index with embeddings
d = 512
index = faiss.IndexFlatL2(d)
try:
    stored_embeddings = np.load("food_embeddings.npy")
    index.add(stored_embeddings)
    with open("recipe_names.txt", "r") as f:
        recipe_names = f.read().splitlines()
except FileNotFoundError:
    print("No stored embeddings found, please generate them in Colab first.")

def get_image_embedding(image_bytes):
    image = Image.open(io.BytesIO(image_bytes))
    image = preprocess(image).unsqueeze(0).to(device)
    with torch.no_grad():
        embedding = model.encode_image(image)
    return embedding.cpu().numpy()

@app.post("/upload-image/")
async def upload_image(file: UploadFile = File(...),user: str = Depends(get_current_user)):
    try:
        image_bytes = await file.read()
        print(f"Received file: {file.filename}")
        query_embedding = get_image_embedding(image_bytes)
        D, I = index.search(query_embedding, k=1)
        best_match = recipe_names[I[0][0]]
        messages = [
            {"role": "system", "content": "You are an expert chef AI that generates detailed food recipes."},
            {"role": "user", "content": f"Generate a detailed recipe for {best_match}."}
        ]
        response = openai.chat.completions.create(
            model="gpt-4", messages=messages, max_tokens=150, temperature=0.7
        )
        generated_recipe = response.choices[0].message.content.strip()
        print(f"Generated Recipe: {generated_recipe}")
        return {"dish": best_match, "recipe": generated_recipe}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-recipe-from-ingredients/")
async def generate_recipe_from_ingredients(ingredients: RecipePrompt):
    try:
        messages = [
            {"role": "system", "content": "You are an AI chef that suggests recipes based on available ingredients."},
            {"role": "user", "content": f"Suggest a recipe using these ingredients: {ingredients.prompt}"}
        ]
        response = openai.chat.completions.create(
            model="gpt-4", messages=messages, max_tokens=150, temperature=0.7
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

class FoodRequest(BaseModel):
    food_item: str

@app.post("/generate-food-pdf/")
async def generate_food_pdf(food_request: FoodRequest,user: str = Depends(get_current_user)):
    try:
        food_item = food_request.food_item
        print(f"Received food item: {food_item}")
        headers = {
            "x-app-id": NUTRITIONIX_APP_ID,
            "x-app-key": NUTRITIONIX_API_KEY,
        }
        params = {"query": food_item}
        nutrition_response = requests.post("https://trackapi.nutritionix.com/v2/natural/nutrients", headers=headers, json=params)
        if nutrition_response.status_code != 200:
            print(f"Nutritionix error: {nutrition_response.text}")
            raise HTTPException(status_code=400, detail="Error fetching nutrition data.")
        nutrition_data = nutrition_response.json()
        print(f"Nutrition data: {nutrition_data}")
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
        pdf.set_font("Arial", style="B", size=16)
        pdf.cell(200, 10, txt=f"Nutrition Details for {food_item.title()}", ln=True, align="C")
        pdf.ln(10)
        pdf.set_font("Arial", size=12)
        for food in nutrition_data.get("foods", []):
            pdf.cell(200, 10, txt=f"Food: {food['food_name'].title()}", ln=True)
            pdf.cell(200, 10, txt=f"Calories: {food.get('nf_calories', 'N/A')} kcal", ln=True)
            pdf.cell(200, 10, txt=f"Total Fat: {food.get('nf_total_fat', 'N/A')} g", ln=True)
            pdf.cell(200, 10, txt=f"Protein: {food.get('nf_protein', 'N/A')} g", ln=True)
            pdf.cell(200, 10, txt=f"Carbohydrates: {food.get('nf_total_carbohydrate', 'N/A')} g", ln=True)
            pdf.ln(5)
        pdf_file_path = f"{food_item.replace(' ', '_')}_nutrition_details.pdf"
        pdf.output(pdf_file_path)
        print(f"PDF successfully created: {pdf_file_path}")
        return FileResponse(pdf_file_path, media_type="application/pdf", filename=pdf_file_path)
    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

class ShoppingListRequest(BaseModel):
    recipes: List[str]

@app.post("/generate-shopping-list/")
async def generate_shopping_list(request: ShoppingListRequest,user: str = Depends(get_current_user)):
    try:
        selected_recipes = request.recipes
        shopping_list = {}
        for recipe in selected_recipes:
            messages = [
                {"role": "system", "content": "You are an AI chef that provides ingredients lists for recipes."},
                {"role": "user", "content": f"Provide a list of ingredients needed for {recipe}."}
            ]
            response = openai.chat.completions.create(
                model="gpt-4", messages=messages, max_tokens=200, temperature=0.7
            )
            ingredients = response.choices[0].message.content.strip().split("\n")
            for ingredient in ingredients:
                item = ingredient.strip()
                if item:
                    shopping_list[item] = shopping_list.get(item, 0) + 1
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
        pdf.set_font("Arial", style="B", size=16)
        pdf.cell(200, 10, txt="Grocery Shopping List", ln=True, align="C")
        pdf.ln(10)
        pdf.set_font("Arial", size=12)
        for item, quantity in shopping_list.items():
            pdf.cell(200, 10, txt=f"- {item} (x{quantity})", ln=True)
        pdf_path = "shopping_list.pdf"
        pdf.output(pdf_path)
        return FileResponse(pdf_path, media_type="application/pdf", filename="shopping_list.pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating shopping list: {str(e)}")
