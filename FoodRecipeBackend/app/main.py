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
def get_image_path(filename):
    base_dir = os.path.abspath(os.path.join(__file__, ".."))
    image_dir = os.path.join(base_dir, "static", "images")
    return os.path.join(image_dir, filename)
category_images = {
    "Calories": get_image_path("running_person.png"),
    "Total Fat": get_image_path("bacon.png"),
    "Protein": get_image_path("chicken_leg.png"),
    "Carbohydrates": get_image_path("bread.png"),
}
categories = [
    ("Calories", "nf_calories", "kcal"),
    ("Total Fat", "nf_total_fat", "g"),
    ("Protein", "nf_protein", "g"),
    ("Carbohydrates", "nf_total_carbohydrate", "g"),
]
image_width = 10
image_height = 10
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


async def save_chat_message(db: AsyncSession, user_id: int, message: str):
    chat_entry = ChatLog(user_id=user_id, message=message)
    db.add(chat_entry)
    await db.commit()
    await db.refresh(chat_entry)

# Helper function to save recipe searches
async def save_recipe_search(db: AsyncSession, user_id: int, query: str):
    search_entry = RecipeSearch(user_id=user_id, query=query)
    db.add(search_entry)
    await db.commit()
    await db.refresh(search_entry)


# Helper function to save PDF records
async def save_pdf_record(db: AsyncSession, user_id: int, file_path: str):
    pdf_entry = PDFRecord(user_id=user_id, file_path=file_path)
    db.add(pdf_entry)
    await db.commit()
    await db.refresh(pdf_entry)
    
    
@app.post("/generate-recipe/")
async def generate_recipe(recipe_prompt: RecipePrompt, user: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        # Fetch user ID
        result = await db.execute(select(User).filter(User.username == user))
        db_user = result.scalars().first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Save recipe search
        await save_recipe_search(db, db_user.id, recipe_prompt.prompt)

        messages = [
            {"role": "system", "content": "You are an AI that generates detailed recipes with ingredients, preparation steps, and cook times"},
            {"role": "user", "content": f"Generate a recipe for {recipe_prompt.prompt}"}
        ]
        response = openai.chat.completions.create(
            model="gpt-4", messages=messages, max_tokens=100, temperature=0.7
        )
        recipe = response.choices[0].message.content.strip()

        # Save AI response to chat history
        await save_chat_message(db, db_user.id, f"Recipe for {recipe_prompt.prompt}: {recipe}")

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


# Update /upload-image/ to save history
@app.post("/upload-image/")
async def upload_image(file: UploadFile = File(...), user: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    import time
    from openai import AsyncOpenAI
    import aiohttp

    client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    try:
        print(f"Received file: {file.filename}")
        start_time = time.time()

        # Fetch user ID
        result = await db.execute(select(User).filter(User.username == user))
        db_user = result.scalars().first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Save upload action to chat history
        await save_chat_message(db, db_user.id, f"Uploaded image: {file.filename}")

        # Step 1: Read image bytes
        image_bytes = await file.read()
        print(f"Time to read file: {time.time() - start_time:.2f} seconds")
        step_time = time.time()

        # Step 2: Generate embedding with CLIP
        query_embedding = get_image_embedding(image_bytes)
        print(f"Time for CLIP embedding: {time.time() - step_time:.2f} seconds")
        step_time = time.time()

        # Step 3: FAISS search
        D, I = index.search(query_embedding, k=1)
        best_match = recipe_names[I[0][0]]
        print(f"Time for FAISS search: {time.time() - step_time:.2f} seconds")
        step_time = time.time()

        # Step 4: Generate recipe with OpenAI
        messages = [
            {"role": "system", "content": "You are an expert chef AI that generates detailed food recipes."},
            {"role": "user", "content": f"Generate a detailed recipe for {best_match}."}
        ]
        async with aiohttp.ClientSession() as session:
            try:
                response = await asyncio.wait_for(
                    client.chat.completions.create(
                        model="gpt-4", messages=messages, max_tokens=150, temperature=0.7
                    ),
                    timeout=30.0
                )
                generated_recipe = response.choices[0].message.content.strip()
                print(f"Time for OpenAI recipe generation: {time.time() - step_time:.2f} seconds")
                print(f"Generated Recipe: {generated_recipe}")

                # Save AI response to chat history
                await save_chat_message(db, db_user.id, f"Generated recipe for {best_match}: {generated_recipe}")
            except asyncio.TimeoutError:
                print("OpenAI request timed out after 30 seconds")
                raise HTTPException(status_code=504, detail="Recipe generation timed out. Please try again.")
            except Exception as api_error:
                print(f"OpenAI API error: {str(api_error)}")
                raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(api_error)}")

        return {"dish": best_match, "recipe": generated_recipe}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await client.close()


    
@app.get("/chat-history/")
async def get_chat_history(user: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        # Fetch user ID
        result = await db.execute(select(User).filter(User.username == user))
        db_user = result.scalars().first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Fetch chat history for the user
        result = await db.execute(select(ChatLog).filter(ChatLog.user_id == db_user.id).order_by(ChatLog.timestamp.asc()))
        chat_history = result.scalars().all()

        # Format the response
        history = [{"message": entry.message, "timestamp": entry.timestamp} for entry in chat_history]
        return {"chat_history": history}
    except Exception as e:
        print(f"Error fetching chat history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching chat history: {str(e)}")
NUTRITIONIX_API_KEY = os.getenv("NUTRITIONIX_API_KEY")
NUTRITIONIX_APP_ID = os.getenv("NUTRITIONIX_APP_ID")
if not NUTRITIONIX_API_KEY or not NUTRITIONIX_APP_ID:
    raise ValueError("Nutritionix API keys not found. Set them in your .env file.")
print(NUTRITIONIX_API_KEY)
print(NUTRITIONIX_APP_ID)

class FoodRequest(BaseModel):
    food_item: str
class ShoppingListRequest(BaseModel):
    recipes: List[str]



# Helper function to get image path
def get_image_path(filename):
    base_dir = os.path.abspath(os.path.join(__file__, ".."))
    image_dir = os.path.join(base_dir, "static", "images")
    return os.path.join(image_dir, filename)

# Shopping cart image path
shopping_cart_image = get_image_path("shopping_cart.png")

@app.post("/generate-food-pdf/")
async def generate_food_pdf(food_request: FoodRequest, user: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
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
        foods = nutrition_data.get("foods", [])
        if not foods:
            raise HTTPException(status_code=400, detail="No food item found.")
        food = foods[0]

        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)

        # Title
        pdf.set_font("Arial", size=16, style="B")
        pdf.cell(0, 10, f"Nutrition Details for {food_item.title()}", ln=True, align="C")
        pdf.ln(10)

        # Food name
        pdf.set_font("Arial", size=12, style="B")
        pdf.cell(0, 10, f"Food: {food['food_name'].title()}", ln=True)
        pdf.set_font("Arial", size=12)
        pdf.ln(5)

        # Nutritional values table
        for category, key, unit in categories:
            value = food.get(key, "N/A")
            image_path = category_images.get(category, "")

            x = pdf.get_x()
            y = pdf.get_y()

            # Image cell with border
            pdf.cell(image_width, 10, '', border=1)
            if image_path and os.path.exists(image_path):
                pdf.image(image_path, x, y, image_width, image_height)
            pdf.set_x(x + image_width)

            # Category name cell
            pdf.cell(80, 10, category, border=1)

            # Value cell, right-aligned
            pdf.cell(50, 10, f"{value} {unit}", border=1, align="R")

            # Move to next line
            pdf.ln(10)

        pdf_file_path = f"{food_item.replace(' ', '_')}_nutrition_details.pdf"
        pdf.output(pdf_file_path)
        print(f"PDF successfully created: {pdf_file_path}")

        # Fetch user ID
        result = await db.execute(select(User).filter(User.username == user))
        db_user = result.scalars().first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Save PDF record
        await save_pdf_record(db, db_user.id, pdf_file_path)

        return FileResponse(pdf_file_path, media_type="application/pdf", filename=pdf_file_path)
    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

# Update /generate-shopping-list/ to save PDF record
@app.post("/generate-shopping-list/")
async def generate_shopping_list(request: ShoppingListRequest, user: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        selected_recipes = request.recipes
        recipe_ingredients = {}

        # Fetch user ID
        result = await db.execute(select(User).filter(User.username == user))
        db_user = result.scalars().first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Save recipe search for shopping list
        for recipe in selected_recipes:
            await save_recipe_search(db, db_user.id, f"Shopping list recipe: {recipe}")

        # Fetch ingredients for each recipe
        for recipe in selected_recipes:
            messages = [
                {"role": "system", "content": "You are an AI chef that provides ingredients lists for recipes."},
                {"role": "user", "content": f"Provide a list of ingredients needed for {recipe}."}
            ]
            response = openai.chat.completions.create(
                model="gpt-4", messages=messages, max_tokens=200, temperature=0.7
            )
            ingredients = response.choices[0].message.content.strip().split("\n")
            recipe_ingredients[recipe] = [item.strip() for item in ingredients if item.strip()]

        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)

        # Title
        pdf.set_font("Arial", style="B", size=16)
        pdf.cell(0, 10, txt="Grocery Shopping List", ln=True, align="C")
        pdf.ln(5)

        # Add shopping cart image below title
        if os.path.exists(shopping_cart_image):
            pdf.image(shopping_cart_image, x=95, y=20, w=10, h=10)
        pdf.ln(15)

        pdf.set_font("Arial", size=12)

        # Generate sections for each recipe
        for recipe, ingredients in recipe_ingredients.items():
            pdf.set_font("Arial", style="B", size=14)
            pdf.cell(0, 10, txt=f"{recipe.title()}", ln=True, border=1)
            pdf.set_font("Arial", size=12)
            pdf.ln(2)

            for ingredient in ingredients:
                if ingredient.startswith("- "):
                    ingredient = ingredient[2:].strip()
                parts = ingredient.split(" ", 1)
                if len(parts) > 1 and parts[0].isdigit():
                    quantity = parts[0]
                    item = parts[1]
                    pdf.cell(0, 8, txt=f"- {item} (x{quantity})", ln=True)
                else:
                    pdf.cell(0, 8, txt=f"- {ingredient}", ln=True)
            pdf.ln(5)

        pdf_path = "shopping_list.pdf"
        pdf.output(pdf_path)
        print(f"PDF successfully created: {pdf_path}")

        # Save PDF record
        await save_pdf_record(db, db_user.id, pdf_path)

        return FileResponse(pdf_path, media_type="application/pdf", filename="shopping_list.pdf")
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating shopping list: {str(e)}")
# New endpoints to fetch history for each route
@app.get("/recipe-generator-history/")
async def get_recipe_generator_history(user: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(User).filter(User.username == user))
        db_user = result.scalars().first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Fetch recipe searches
        result = await db.execute(select(RecipeSearch).filter(RecipeSearch.user_id == db_user.id).order_by(RecipeSearch.timestamp.asc()))
        searches = result.scalars().all()

        # Fetch related chat logs
        result = await db.execute(select(ChatLog).filter(ChatLog.user_id == db_user.id).order_by(ChatLog.timestamp.asc()))
        chats = result.scalars().all()

        history = [
            {"type": "search", "query": entry.query, "timestamp": entry.timestamp} for entry in searches
        ] + [
            {"type": "chat", "message": entry.message, "timestamp": entry.timestamp} for entry in chats if "Recipe for" in entry.message
        ]
        history.sort(key=lambda x: x["timestamp"])  # Sort by timestamp
        return {"history": history}
    except Exception as e:
        print(f"Error fetching recipe generator history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching history: {str(e)}")

@app.get("/uploads-history/")
async def get_uploads_history(user: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(User).filter(User.username == user))
        db_user = result.scalars().first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        result = await db.execute(select(ChatLog).filter(ChatLog.user_id == db_user.id).order_by(ChatLog.timestamp.asc()))
        chats = result.scalars().all()

        history = [
            {"type": "chat", "message": entry.message, "timestamp": entry.timestamp} for entry in chats if "Uploaded image" in entry.message or "Generated recipe" in entry.message
        ]
        history.sort(key=lambda x: x["timestamp"])
        return {"history": history}
    except Exception as e:
        print(f"Error fetching uploads history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching history: {str(e)}")

@app.get("/nutrition-history/")
async def get_nutrition_history(user: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(User).filter(User.username == user))
        db_user = result.scalars().first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        result = await db.execute(select(PDFRecord).filter(PDFRecord.user_id == db_user.id).order_by(PDFRecord.created_at.asc()))
        pdfs = result.scalars().all()

        history = [
            {"type": "pdf", "file_path": entry.file_path, "created_at": entry.created_at} for entry in pdfs if "nutrition_details" in entry.file_path
        ]
        history.sort(key=lambda x: x["created_at"])
        return {"history": history}
    except Exception as e:
        print(f"Error fetching nutrition history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching history: {str(e)}")

@app.get("/shopping-list-history/")
async def get_shopping_list_history(user: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(User).filter(User.username == user))
        db_user = result.scalars().first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Fetch recipe searches related to shopping list
        result = await db.execute(select(RecipeSearch).filter(RecipeSearch.user_id == db_user.id).order_by(RecipeSearch.timestamp.asc()))
        searches = result.scalars().all()

        # Fetch PDF records for shopping lists
        result = await db.execute(select(PDFRecord).filter(PDFRecord.user_id == db_user.id).order_by(PDFRecord.created_at.asc()))
        pdfs = result.scalars().all()

        history = [
            {"type": "search", "query": entry.query, "timestamp": entry.timestamp} for entry in searches if "Shopping list recipe" in entry.query
        ] + [
            {"type": "pdf", "file_path": entry.file_path, "created_at": entry.created_at} for entry in pdfs if "shopping_list" in entry.file_path
        ]
        history.sort(key=lambda x: x["timestamp"] if "timestamp" in x else x["created_at"])
        return {"history": history}
    except Exception as e:
        print(f"Error fetching shopping list history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching history: {str(e)}")