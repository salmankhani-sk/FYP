# Import PyTorch for tensor operations and model inference
import torch
# Import the OpenAI CLIP model for image processing and embedding generation
# CLIP (Contrastive Language-Image Pretraining) is a model that learns to associate images and text


# Import the OpenAI CLIP model for image embeddings
import clip

# Import FAISS for similarity search and indexing
import faiss

# NumPy for array operations
import numpy as np

# PIL (Python Imaging Library) for image loading and manipulation
from PIL import Image
# Import the time module for performance measurement
# OS module for interacting with the file system
import os

# ---------------------- Load CLIP Model ----------------------

# Choose GPU if available, otherwise fallback to CPU
device = "cuda" if torch.cuda.is_available() else "cpu"

# Load the pre-trained CLIP model (Vision Transformer - ViT-B/32) and preprocessing function
model, preprocess = clip.load("ViT-B/32", device=device)

# ---------------------- Set Up FAISS Index ----------------------

# CLIP embeddings are 512-dimensional vectors
embedding_size = 512

# Create a FAISS index using L2 (Euclidean) distance for similarity search
index = faiss.IndexFlatL2(embedding_size)

# Initialize a list to store food/recipe names (associated with images)
recipe_names = []

# ---------------------- Process Images ----------------------

# Define the folder containing the food images
image_folder = "food_images/"

# Iterate through all files in the image folder
for filename in os.listdir(image_folder):
    # Only process files that are image types (.jpg, .png, .jfif)
    if filename.endswith(".jpg") or filename.endswith(".png") or filename.endswith(".jfif"):
        
        # Construct full path to the image file
        image_path = os.path.join(image_folder, filename)

        # Open the image using PIL
        image = Image.open(image_path)

        # Preprocess the image using CLIP's preprocessing pipeline
        # Then add a batch dimension and move it to the selected device (CPU/GPU)
        image = preprocess(image).unsqueeze(0).to(device)

        # Disable gradient computation (inference mode)
        with torch.no_grad():
            # Generate image embedding using CLIP's vision model
            embedding = model.encode_image(image).cpu().numpy()

        # Add the embedding to the FAISS index
        index.add(embedding)

        # Store the filename (without extension) as a recipe/food name
        recipe_names.append(filename.split(".")[0])

# ---------------------- Save the Data ----------------------

# Save all image embeddings to a .npy file using FAISS reconstruct_n
# reconstruct_n recreates the entire array of indexed embeddings
np.save("food_embeddings.npy", index.reconstruct_n(0, index.ntotal))

# Save the recipe names into a text file (one name per line)
with open("recipe_names.txt", "w") as f:
    f.write("\n".join(recipe_names))

# Print success message
print("✅ Embeddings stored successfully!")
