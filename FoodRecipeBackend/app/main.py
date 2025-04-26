# Import OS library for interacting with the operating system (e.g., file paths)
import os  
# Import asyncio for asynchronous programming support
import asyncio  
# Import datetime and timedelta to work with dates and time intervals
from datetime import datetime, timedelta  
# Import various FastAPI modules to create API endpoints and handle HTTP exceptions
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, status  
# Import FileResponse to send files as responses to API calls
from fastapi.responses import FileResponse  
# Import CORS middleware to handle Cross-Origin Resource Sharing issues (allows external domains to access your API)
from fastapi.middleware.cors import CORSMiddleware  
# Import OpenAI to use OpenAI's API services (like GPT-4)
import openai  
# Import BaseModel from Pydantic to define request and response data schemas
from pydantic import BaseModel  
# Import load_dotenv to load environment variables from a .env file
from dotenv import load_dotenv  
# Import requests to make HTTP requests to external APIs
import requests  
# Import torch from PyTorch for tensor operations and model inference
import torch  
# Import clip to work with OpenAI's CLIP model for image-text tasks
import clip  
# Import faiss for efficient similarity search on embeddings
import faiss  
# Import numpy for numerical operations on arrays
import numpy as np  
# Import Image from PIL to handle image processing tasks
from PIL import Image  
# Import io for handling byte streams (useful for in-memory file operations)
import io  
# Import the vision module from google.cloud to use Google Vision API features
from google.cloud import vision  
# Import service_account for Google credentials handling
from google.oauth2 import service_account  
# Import OpenAI client from openai (a different client initializer)
from openai import OpenAI  
# Import FPDF to generate PDF documents
from fpdf import FPDF  
# Import traceback for printing detailed error traces when exceptions occur
import traceback  
# Import List type for type annotations of lists
from typing import List  
# Import jwt for JSON Web Token operations (encoding/decoding)
import jwt  
# Import select from SQLAlchemy's future module to build SQL queries
from sqlalchemy.future import select  
# Import AsyncSession for asynchronous database session management in SQLAlchemy
from sqlalchemy.ext.asyncio import AsyncSession  
# Import CryptContext from passlib to manage password hashing schemes
from passlib.context import CryptContext  
# Import bcrypt library for secure password hashing
import bcrypt  
# Import types for working with dynamic Python types (used later for patching)
import types  
# Import HTTPBearer and HTTPAuthorizationCredentials from FastAPI to handle HTTP Bearer token authentication
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials  
# Import jwt and JWTError from jose for handling JWT operations with error management
from jose import jwt, JWTError  

# Patch bcrypt to ensure it has a __version__ attribute (some versions might be missing this info)
if not hasattr(bcrypt, "__about__") or not hasattr(bcrypt.__about__, "__version__"):
    bcrypt.__about__ = types.SimpleNamespace(__version__=bcrypt.__version__)

# -----------------------------
# Import async database components and ORM models from local modules
from .database import Base, engine, get_db  # Import the Base class, the engine for database connections, and a function to get a database session
from .models import User, RecipeSearch, ChatLog, PDFRecord  # Import ORM models for users, recipe searches, chat logs, and PDF records

# Set an environment variable to prevent duplicate library loading issues (specific to MKL libraries)
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# Load environment variables from the .env file so that API keys and secrets become available
load_dotenv()

# Create the FastAPI app instance
app = FastAPI()
# Create an instance of HTTPBearer for token-based authentication
oauth2_scheme = HTTPBearer()

# Startup event: When the app starts, create database tables asynchronously if they don't exist
@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:  # Begin an async database connection
        await conn.run_sync(Base.metadata.create_all)  # Create tables based on ORM models

# Add CORS middleware to allow requests from any origin (adjust allowed origins as necessary)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow requests from any domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Function to generate the full file path for a given image filename
def get_image_path(filename):
    base_dir = os.path.abspath(os.path.join(__file__, ".."))  # Get the parent directory of this file
    image_dir = os.path.join(base_dir, "static", "images")      # Construct the path to the static/images directory
    return os.path.join(image_dir, filename)                  # Return the complete path to the image

# Define a mapping between nutritional categories and their corresponding image file paths
category_images = {
    "Calories": get_image_path("running_person.png"),
    "Total Fat": get_image_path("bacon.png"),
    "Protein": get_image_path("chicken_leg.png"),
    "Carbohydrates": get_image_path("bread.png"),
}
# Define nutritional categories as tuples: (Display Name, API Response Key, Unit)
categories = [
    ("Calories", "nf_calories", "kcal"),
    ("Total Fat", "nf_total_fat", "g"),
    ("Protein", "nf_protein", "g"),
    ("Carbohydrates", "nf_total_carbohydrate", "g"),
]
# Set dimensions for images used in the PDF (width and height)
image_width = 12
image_height = 12

# Retrieve API keys and secrets from environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
SECRET_KEY = os.getenv("SECRET_KEY")
# If the OpenAI API key isn't set, raise an error so you don't run without proper credentials
if not OPENAI_API_KEY:
    raise ValueError("OpenAI API key not found. Make sure it's set in your .env file.")
# Set the API key in the OpenAI library for subsequent API calls
openai.api_key = OPENAI_API_KEY

# Configure password hashing by initializing a CryptContext that uses bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Function to hash a plain text password using the configured password hashing scheme
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# Function to verify a plain text password against its hashed version
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# Pydantic model for user registration data
class UserCreate(BaseModel):
    username: str  # User's username
    email: str     # User's email address
    password: str  # User's password

# Pydantic model for user login data
class UserLogin(BaseModel):
    username: str  # Username for login
    password: str  # Password for login

# Define the JWT algorithm and token expiration duration in minutes
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Function to get the current user from the JWT token provided in the HTTP Authorization header
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)):
    try:
        token = credentials.credentials  # Extract token from the credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])  # Decode the JWT token
        username = payload.get("sub")  # Retrieve the 'sub' (subject) field, which stores the username
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username  # Return the authenticated username
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Function to create an access token (JWT) that includes an expiration time
def create_access_token(data: dict, expires_delta: int = None):
    to_encode = data.copy()  # Copy the data to encode into the token
    # Set the token's expiration time based on the provided delta or default to 15 minutes
    expire = datetime.utcnow() + timedelta(minutes=expires_delta) if expires_delta else datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})  # Add the expiration time to the token payload
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)  # Encode the token using the secret key
    return encoded_jwt

# Registration endpoint to create a new user
@app.post("/register")
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if the username already exists in the database
    result = await db.execute(select(User).filter(User.username == user.username))
    db_user = result.scalars().first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    # Hash the user's password before storing it
    hashed_password = get_password_hash(user.password)
    # Create a new User object with the provided details
    new_user = User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(new_user)  # Add the new user to the database session
    await db.commit()  # Commit the session to persist changes
    await db.refresh(new_user)  # Refresh the object with the latest data from the database
    # Create a JWT token for the new user
    access_token = create_access_token(data={"sub": new_user.username}, expires_delta=ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": access_token,  # Return the generated token
        "token_type": "bearer",          # Specify the token type
        "username": new_user.username,   # Return the username
        "message": "User registered successfully"  # Success message
    }

# Login endpoint to authenticate an existing user and return a JWT token
@app.post("/login")
async def login(user: UserLogin, db: AsyncSession = Depends(get_db)):
    # Retrieve the user from the database based on the username provided
    result = await db.execute(select(User).filter(User.username == user.username))
    db_user = result.scalars().first()
    # If the user doesn't exist or the password is incorrect, return an error
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    # Generate a JWT token for the authenticated user
    access_token = create_access_token(data={"sub": db_user.username}, expires_delta=ACCESS_TOKEN_EXPIRE_MINUTES)
    return {"access_token": access_token, "token_type": "bearer"}

# Pydantic model for a recipe prompt request (for generating a recipe)
class RecipePrompt(BaseModel):
    prompt: str  # The text prompt that describes what recipe to generate

# Function to sanitize image descriptions by removing common unwanted terms
def sanitize_description(description: str) -> str:
    exclude_terms = ["closeup", "picture", "view", "photography"]
    return " ".join(word for word in description.split() if word.lower() not in exclude_terms)

# Endpoint to fetch images related to a query using the Pexels API
@app.get("/get-images/{query}")
async def get_images(query: str):
    api_url = "https://api.pexels.com/v1/search"  # URL for the Pexels search API
    headers = {"Authorization": PEXELS_API_KEY}  # Authorization header using the Pexels API key
    params = {"query": f"{query} cooked dish", "per_page": 8}  # Query parameters for the search
    try:
        response = requests.get(api_url, headers=headers, params=params)  # Make the API request
        if response.status_code == 200:
            data = response.json()  # Parse the JSON response
            images = [
                {"id": photo["id"], "url": photo["src"]["medium"], "alt": query.capitalize()}
                for photo in data["photos"]
            ]
            return {"images": images}  # Return the list of images
        return {"images": []}  # Return an empty list if the request fails
    except Exception as e:
        print(f"Error fetching images: {str(e)}")  # Log the error
        return {"images": []}

# Endpoint to fetch videos related to a query using the YouTube API and refined search query from OpenAI
@app.get("/get-videos/{query}")
async def get_videos(query: str):
    try:
        messages = [
            {"role": "system", "content": "You are an AI that improves search queries for finding the best cooking videos."},
            {"role": "user", "content": f"Generate an accurate YouTube search query for cooking a {query} recipe."}
        ]
        # Use OpenAI's API to refine the search query
        openai_response = openai.chat.completions.create(
            model="gpt-4", messages=messages, max_tokens=50, temperature=0.7
        )
        refined_query = openai_response.choices[0].message.content.strip()  # Extract the refined query
        print(f"Refined Search Query: {refined_query}")
        youtube_api_url = "https://www.googleapis.com/youtube/v3/search"  # YouTube search API URL
        params = {
            "part": "snippet",
            "q": refined_query,  # Use the refined query for search
            "type": "video",
            "maxResults": 3,
            "key": YOUTUBE_API_KEY,
        }
        response = requests.get(youtube_api_url, params=params)  # Make the API request
        if response.status_code == 200:
            data = response.json()  # Parse JSON response
            videos = [
                {
                    "videoId": item["id"]["videoId"],
                    "title": item["snippet"]["title"],
                    "thumbnail": item["snippet"]["thumbnails"]["medium"]["url"],
                }
                for item in data["items"]
            ]
            return {"videos": videos}  # Return the list of videos
        print("YouTube API Error:", response.status_code, response.text)
        return {"videos": []}
    except Exception as e:
        print(f"Error fetching YouTube videos: {str(e)}")
        return {"videos": []}

# Asynchronous helper function to save a chat message (for logging purposes) into the database
async def save_chat_message(db: AsyncSession, user_id: int, message: str):
    chat_entry = ChatLog(user_id=user_id, message=message)  # Create a new chat log entry
    db.add(chat_entry)  # Add the entry to the current database session
    await db.commit()  # Commit the transaction to save the entry
    await db.refresh(chat_entry)  # Refresh the object from the database

# Helper function to save a recipe search query into the database for history tracking
async def save_recipe_search(db: AsyncSession, user_id: int, query: str):
    search_entry = RecipeSearch(user_id=user_id, query=query)  # Create a new recipe search entry
    db.add(search_entry)
    await db.commit()  # Commit to save
    await db.refresh(search_entry)  # Refresh the entry

# Helper function to save the generated PDF file record into the database
async def save_pdf_record(db: AsyncSession, user_id: int, file_path: str):
    pdf_entry = PDFRecord(user_id=user_id, file_path=file_path)  # Create a new PDF record
    db.add(pdf_entry)
    await db.commit()  # Commit to save the record
    await db.refresh(pdf_entry)  # Refresh the record

# Endpoint to generate a recipe using OpenAI based on a provided prompt
@app.post("/generate-recipe/")
async def generate_recipe(recipe_prompt: RecipePrompt, user: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        # Retrieve the user from the database using the username from the JWT token
        result = await db.execute(select(User).filter(User.username == user))
        db_user = result.scalars().first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Save the recipe search query to the database for history
        await save_recipe_search(db, db_user.id, recipe_prompt.prompt)

        messages = [
            {"role": "system", "content": "You are an AI that generates detailed recipes with ingredients, preparation steps, and cook times"},
            {"role": "user", "content": f"Generate a recipe for {recipe_prompt.prompt}"}
        ]
        # Generate a recipe using OpenAI's chat completion API
        response = openai.chat.completions.create(
            model="gpt-4", messages=messages, max_tokens=100, temperature=0.7
        )
        recipe = response.choices[0].message.content.strip()  # Extract the generated recipe text

        # Log the generated recipe in the chat history
        await save_chat_message(db, db_user.id, f"Recipe for {recipe_prompt.prompt}: {recipe}")

        return {"recipe": recipe}  # Return the recipe to the client
    except openai.OpenAIError as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

# Google Vision API setup:
# Retrieve the path to Google Vision credentials from the environment variables
GOOGLE_VISION_CREDENTIALS_PATH = os.getenv("GOOGLE_VISION_CREDENTIALS_PATH")
if not GOOGLE_VISION_CREDENTIALS_PATH:
    raise ValueError("Google Vision credentials path not found. Set GOOGLE_VISION_CREDENTIALS_PATH in .env.")
# Load credentials for Google Vision from the specified file
credentials = service_account.Credentials.from_service_account_file(GOOGLE_VISION_CREDENTIALS_PATH)
# Create a client for Google Vision API using the loaded credentials
vision_client = vision.ImageAnnotatorClient(credentials=credentials)

# Initialize an OpenAI client instance (for later asynchronous calls)
client = OpenAI(api_key=OPENAI_API_KEY)

# Load the CLIP model and its preprocessing function; use CPU device for inference
device = "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

# Initialize a FAISS index for similarity search with a vector dimension of 512
d = 512
index = faiss.IndexFlatL2(d)
try:
    # Load precomputed image embeddings from a .npy file
    stored_embeddings = np.load("food_embeddings.npy")
    index.add(stored_embeddings)  # Add these embeddings to the FAISS index
    # Read the associated recipe names from a text file
    with open("recipe_names.txt", "r") as f:
        recipe_names = f.read().splitlines()
except FileNotFoundError:
    print("No stored embeddings found, please generate them in Colab first.")

# Function to generate an image embedding from raw image bytes using the CLIP model
def get_image_embedding(image_bytes):
    image = Image.open(io.BytesIO(image_bytes))  # Open the image from bytes
    image = preprocess(image).unsqueeze(0).to(device)  # Preprocess and add a batch dimension, then move to CPU
    with torch.no_grad():
        embedding = model.encode_image(image)  # Compute the image embedding using CLIP
    return embedding.cpu().numpy()  # Return the embedding as a numpy array

# Endpoint to upload an image and generate a recipe based on the image content
@app.post("/upload-image/")
async def upload_image(file: UploadFile = File(...), user: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    import time
    from openai import AsyncOpenAI
    import aiohttp

    # Initialize an asynchronous OpenAI client for non-blocking API calls
    client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    try:
        print(f"Received file: {file.filename}")  # Log the received file name
        start_time = time.time()  # Start a timer for performance logging

        # Retrieve the user from the database using the provided token
        result = await db.execute(select(User).filter(User.username == user))
        db_user = result.scalars().first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Log the upload action in the user's chat history
        await save_chat_message(db, db_user.id, f"Uploaded image: {file.filename}")

        # Step 1: Read the uploaded image file into bytes
        image_bytes = await file.read()
        print(f"Time to read file: {time.time() - start_time:.2f} seconds")
        step_time = time.time()

        # Step 2: Generate an embedding for the image using the CLIP model
        query_embedding = get_image_embedding(image_bytes)
        print(f"Time for CLIP embedding: {time.time() - step_time:.2f} seconds")
        step_time = time.time()

        # Step 3: Use FAISS to find the most similar stored image embedding (i.e., the best matching recipe)
        D, I = index.search(query_embedding, k=1)
        best_match = recipe_names[I[0][0]]
        print(f"Time for FAISS search: {time.time() - step_time:.2f} seconds")
        step_time = time.time()

        # Step 4: Use OpenAI to generate a detailed recipe for the best matching dish
        messages = [
            {"role": "system", "content": "You are an expert chef AI that generates detailed food recipes."},
            {"role": "user", "content": f"Generate a detailed recipe for {best_match}."}
        ]
        # Use an asynchronous HTTP session to make the API call with a timeout
        async with aiohttp.ClientSession() as session:
            try:
                response = await asyncio.wait_for(
                    client.chat.completions.create(
                        model="gpt-4", messages=messages, max_tokens=150, temperature=0.7
                    ),
                    timeout=30.0
                )
                generated_recipe = response.choices[0].message.content.strip()  # Extract the recipe text
                print(f"Time for OpenAI recipe generation: {time.time() - step_time:.2f} seconds")
                print(f"Generated Recipe: {generated_recipe}")

                # Save the generated recipe in the chat history
                await save_chat_message(db, db_user.id, f"Generated recipe for {best_match}: {generated_recipe}")
            except asyncio.TimeoutError:
                print("OpenAI request timed out after 30 seconds")
                raise HTTPException(status_code=504, detail="Recipe generation timed out. Please try again.")
            except Exception as api_error:
                print(f"OpenAI API error: {str(api_error)}")
                raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(api_error)}")

        # Return the best matching dish and its generated recipe to the client
        return {"dish": best_match, "recipe": generated_recipe}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await client.close()  # Ensure the asynchronous client is properly closed

# Endpoint to retrieve the chat history for the authenticated user
@app.get("/chat-history/")
async def get_chat_history(user: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        # Retrieve the user from the database using the JWT token
        result = await db.execute(select(User).filter(User.username == user))
        db_user = result.scalars().first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Fetch all chat log entries for the user, ordered chronologically
        result = await db.execute(select(ChatLog).filter(ChatLog.user_id == db_user.id).order_by(ChatLog.timestamp.asc()))
        chat_history = result.scalars().all()

        # Format the chat history as a list of dictionaries containing the message and timestamp
        history = [{"message": entry.message, "timestamp": entry.timestamp} for entry in chat_history]
        return {"chat_history": history}
    except Exception as e:
        print(f"Error fetching chat history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching chat history: {str(e)}")

# Retrieve Nutritionix API keys and app ID from environment variables
NUTRITIONIX_API_KEY = os.getenv("NUTRITIONIX_API_KEY")
NUTRITIONIX_APP_ID = os.getenv("NUTRITIONIX_APP_ID")
if not NUTRITIONIX_API_KEY or not NUTRITIONIX_APP_ID:
    raise ValueError("Nutritionix API keys not found. Set them in your .env file.")


# Pydantic model for a food request (used to generate a nutrition details PDF)
class FoodRequest(BaseModel):
    food_item: str  # The food item to look up nutritional information for

# Pydantic model for a shopping list request containing a list of recipes
class ShoppingListRequest(BaseModel):
    recipes: List[str]

# Helper function (again) to get the full path of an image file (used for shopping list images)
def get_image_path(filename):
    base_dir = os.path.abspath(os.path.join(__file__, ".."))
    image_dir = os.path.join(base_dir, "static", "images")
    return os.path.join(image_dir, filename)

# Define the path to the shopping cart image used in the shopping list PDF
shopping_cart_image = get_image_path("shopping_cart.png")

# ---------------------------
# Define a FancyPDF class that extends FPDF to create modern, styled PDFs with custom headers and footers
class FancyPDF(FPDF):
    def header(self):
        # Draw a header background rectangle with a rich blue color
        self.set_fill_color(0, 102, 204)
        self.rect(0, 0, self.w, 30, 'F')
        # Set font and color for the header text and display it centered
        self.set_font("Arial", "B", 20)
        self.set_text_color(255, 255, 255)
        self.cell(0, 15, "Nutrition Details", align="C", ln=True)
        self.ln(5)
        # Reset text color to black for subsequent text
        self.set_text_color(0, 0, 0)

    def footer(self):
        # Set the position of the footer 20 units from the bottom of the page
        self.set_y(-20)
        # Draw a footer background rectangle with the same blue color
        self.set_fill_color(0, 102, 204)
        self.rect(0, self.h - 20, self.w, 20, 'F')
        # Set font and color for the footer text and display the current page number centered
        self.set_font("Arial", "I", 10)
        self.set_text_color(255, 255, 255)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")
        # Reset text color to black
        self.set_text_color(0, 0, 0)

# ---------------------------
# Endpoint to generate a nutrition details PDF using FancyPDF with an enhanced design
@app.post("/generate-food-pdf/")
async def generate_food_pdf(food_request: FoodRequest, user: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        food_item = food_request.food_item  # Get the food item from the request
        print(f"Received food item: {food_item}")
        headers = {
            "x-app-id": NUTRITIONIX_APP_ID,
            "x-app-key": NUTRITIONIX_API_KEY,
        }
        params = {"query": food_item}  # Set the query parameter for the Nutritionix API
        # Make a POST request to Nutritionix API to fetch nutritional information for the food item
        nutrition_response = requests.post("https://trackapi.nutritionix.com/v2/natural/nutrients", headers=headers, json=params)
        if nutrition_response.status_code != 200:
            print(f"Nutritionix error: {nutrition_response.text}")
            raise HTTPException(status_code=400, detail="Error fetching nutrition data.")
        nutrition_data = nutrition_response.json()  # Parse the JSON response
        foods = nutrition_data.get("foods", [])
        if not foods:
            raise HTTPException(status_code=400, detail="No food item found.")
        food = foods[0]  # Use the first food item returned

        # Create an instance of FancyPDF to build the PDF document
        pdf = FancyPDF()
        pdf.add_page()  # Add a new page to the PDF
        pdf.set_auto_page_break(auto=True, margin=15)  # Enable automatic page breaks with a margin

        # Create a title section with a background fill
        pdf.set_fill_color(230, 230, 230)
        pdf.set_font("Arial", "B", 16)
        pdf.cell(0, 12, f"{food_item.title()} Nutrition Details", ln=True, align="C", fill=True)
        pdf.ln(8)

        # Display the food image (if available) and the food name
        food_image_path = os.path.join(os.path.abspath(os.path.join(__file__, "..")), "static", "food.png")
        if os.path.exists(food_image_path):
            pdf.image(food_image_path, x=10, y=pdf.get_y(), w=30)
            pdf.set_xy(45, pdf.get_y() + 5)
        pdf.set_font("Arial", "B", 12)
        pdf.cell(0, 10, f"Food: {food['food_name'].title()}", ln=True)
        pdf.ln(5)

        # Generate a table of nutritional values with alternating row colors for better readability
        row_color = False
        for category, key, unit in categories:
            value = food.get(key, "N/A")  # Get the nutritional value or use "N/A" if not available
            image_path = category_images.get(category, "")  # Get the corresponding image for the category
            x = pdf.get_x()
            y = pdf.get_y()
            fill_color = (245, 245, 245) if row_color else (255, 255, 255)  # Alternate row colors
            pdf.set_fill_color(*fill_color)
            # Create a cell for the category icon
            pdf.cell(image_width, 12, "", border=1, fill=True)
            if image_path and os.path.exists(image_path):
                pdf.image(image_path, x + 1, y + 1, image_width - 2, image_height - 2)
            pdf.set_x(x + image_width)
            # Create a cell for the category name
            pdf.cell(80, 12, category, border=1, fill=True)
            # Create a cell for the nutritional value, right-aligned
            pdf.cell(50, 12, f"{value} {unit}", border=1, align="R", fill=True)
            pdf.ln(12)
            row_color = not row_color  # Toggle row color for next row

        pdf_file_path = f"{food_item.replace(' ', '_')}_nutrition_details.pdf"  # Define the output PDF file name
        pdf.output(pdf_file_path)  # Save the PDF to a file
        print(f"PDF successfully created: {pdf_file_path}")

        # Retrieve the user from the database to save the PDF record
        result = await db.execute(select(User).filter(User.username == user))
        db_user = result.scalars().first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
        await save_pdf_record(db, db_user.id, pdf_file_path)  # Save the PDF record in the database

        # Return the generated PDF as a file response
        return FileResponse(pdf_file_path, media_type="application/pdf", filename=pdf_file_path)
    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

# ---------------------------
# Endpoint to generate a grocery shopping list PDF based on selected recipes
@app.post("/generate-shopping-list/")
async def generate_shopping_list(request: ShoppingListRequest, user: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        selected_recipes = request.recipes  # Get the list of selected recipes from the request
        recipe_ingredients = {}  # Dictionary to store ingredients for each recipe

        # Retrieve the user from the database
        result = await db.execute(select(User).filter(User.username == user))
        db_user = result.scalars().first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Save each recipe search query in the database for history tracking
        for recipe in selected_recipes:
            await save_recipe_search(db, db_user.id, f"Shopping list recipe: {recipe}")

        # For each selected recipe, generate a list of ingredients using OpenAI
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

        # Create a new PDF document for the shopping list
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)

        # Add a title for the shopping list
        pdf.set_font("Arial", style="B", size=16)
        pdf.cell(0, 10, txt="Grocery Shopping List", ln=True, align="C")
        pdf.ln(5)

        # Add a shopping cart image if it exists
        if os.path.exists(shopping_cart_image):
            pdf.image(shopping_cart_image, x=95, y=20, w=10, h=10)
        pdf.ln(15)

        pdf.set_font("Arial", size=12)

        # For each recipe, add a section in the PDF with its ingredients
        for recipe, ingredients in recipe_ingredients.items():
            pdf.set_font("Arial", style="B", size=14)
            pdf.cell(0, 10, txt=f"{recipe.title()}", ln=True, border=1)
            pdf.set_font("Arial", size=12)
            pdf.ln(2)
            for ingredient in ingredients:
                if ingredient.startswith("- "):
                    ingredient = ingredient[2:].strip()  # Remove the leading hyphen if present
                parts = ingredient.split(" ", 1)
                if len(parts) > 1 and parts[0].isdigit():
                    quantity = parts[0]
                    item = parts[1]
                    pdf.cell(0, 8, txt=f"- {item} (x{quantity})", ln=True)
                else:
                    pdf.cell(0, 8, txt=f"- {ingredient}", ln=True)
            pdf.ln(5)

        pdf_path = "shopping_list.pdf"  # Define the PDF file name for the shopping list
        pdf.output(pdf_path)  # Save the PDF to a file
        print(f"PDF successfully created: {pdf_path}")

        # Save the shopping list PDF record in the database
        await save_pdf_record(db, db_user.id, pdf_path)

        # Return the shopping list PDF as a file response
        return FileResponse(pdf_path, media_type="application/pdf", filename="shopping_list.pdf")
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating shopping list: {str(e)}")

# Endpoint to get the history of recipe generator usage (search queries and related chat logs)
@app.get("/recipe-generator-history/")
async def get_recipe_generator_history(user: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        # Retrieve the user from the database
        result = await db.execute(select(User).filter(User.username == user))
        db_user = result.scalars().first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Retrieve all recipe search queries for the user
        result = await db.execute(select(RecipeSearch).filter(RecipeSearch.user_id == db_user.id).order_by(RecipeSearch.timestamp.asc()))
        searches = result.scalars().all()

        # Retrieve chat logs for the user
        result = await db.execute(select(ChatLog).filter(ChatLog.user_id == db_user.id).order_by(ChatLog.timestamp.asc()))
        chats = result.scalars().all()

        # Combine and sort both searches and chat messages by timestamp
        history = [
            {"type": "search", "query": entry.query, "timestamp": entry.timestamp} for entry in searches
        ] + [
            {"type": "chat", "message": entry.message, "timestamp": entry.timestamp} for entry in chats if "Recipe for" in entry.message
        ]
        history.sort(key=lambda x: x["timestamp"])
        return {"history": history}
    except Exception as e:
        print(f"Error fetching recipe generator history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching history: {str(e)}")

# Endpoint to retrieve the history of uploads from the user's chat logs (image uploads and recipe generations)
@app.get("/uploads-history/")
async def get_uploads_history(user: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        # Retrieve the user from the database
        result = await db.execute(select(User).filter(User.username == user))
        db_user = result.scalars().first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Retrieve all chat logs for the user
        result = await db.execute(select(ChatLog).filter(ChatLog.user_id == db_user.id).order_by(ChatLog.timestamp.asc()))
        chats = result.scalars().all()

        # Filter chat logs to only include messages about image uploads or recipe generation
        history = [
            {"type": "chat", "message": entry.message, "timestamp": entry.timestamp} 
            for entry in chats if "Uploaded image" in entry.message or "Generated recipe" in entry.message
        ]
        history.sort(key=lambda x: x["timestamp"])
        return {"history": history}
    except Exception as e:
        print(f"Error fetching uploads history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching history: {str(e)}")

# Endpoint to retrieve the history of generated nutrition PDFs for the user
@app.get("/nutrition-history/")
async def get_nutrition_history(user: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        # Retrieve the user from the database
        result = await db.execute(select(User).filter(User.username == user))
        db_user = result.scalars().first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Retrieve PDF records for nutrition details associated with the user
        result = await db.execute(select(PDFRecord).filter(PDFRecord.user_id == db_user.id).order_by(PDFRecord.created_at.asc()))
        pdfs = result.scalars().all()

        # Format the PDF records into a history list
        history = [
            {"type": "pdf", "file_path": entry.file_path, "created_at": entry.created_at} 
            for entry in pdfs if "nutrition_details" in entry.file_path
        ]
        history.sort(key=lambda x: x["created_at"])
        return {"history": history}
    except Exception as e:
        print(f"Error fetching nutrition history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching history: {str(e)}")

# Endpoint to retrieve the history of generated shopping list PDFs from both searches and PDF records
@app.get("/shopping-list-history/")
async def get_shopping_list_history(user: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        # Retrieve the user from the database
        result = await db.execute(select(User).filter(User.username == user))
        db_user = result.scalars().first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Retrieve recipe search records related to shopping list generation
        result = await db.execute(select(RecipeSearch).filter(RecipeSearch.user_id == db_user.id).order_by(RecipeSearch.timestamp.asc()))
        searches = result.scalars().all()

        # Retrieve PDF records related to shopping list generation
        result = await db.execute(select(PDFRecord).filter(PDFRecord.user_id == db_user.id).order_by(PDFRecord.created_at.asc()))
        pdfs = result.scalars().all()

        # Combine and sort the search and PDF records into a unified history
        history = [
            {"type": "search", "query": entry.query, "timestamp": entry.timestamp} 
            for entry in searches if "Shopping list recipe" in entry.query
        ] + [
            {"type": "pdf", "file_path": entry.file_path, "created_at": entry.created_at} 
            for entry in pdfs if "shopping_list" in entry.file_path
        ]
        history.sort(key=lambda x: x["timestamp"] if "timestamp" in x else x["created_at"])
        return {"history": history}
    except Exception as e:
        print(f"Error fetching shopping list history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching history: {str(e)}")
