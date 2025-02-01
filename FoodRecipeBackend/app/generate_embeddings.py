import torch
import clip
import faiss
import numpy as np
from PIL import Image
import os

# Load CLIP model
device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

# FAISS Index
embedding_size = 512
index = faiss.IndexFlatL2(embedding_size)
recipe_names = []

# Folder containing food images
image_folder = "food_images/"

for filename in os.listdir(image_folder):
    if filename.endswith(".jpg") or filename.endswith(".png") or filename.endswith(".jfif"):
        image_path = os.path.join(image_folder, filename)
        image = Image.open(image_path)
        image = preprocess(image).unsqueeze(0).to(device)

        with torch.no_grad():
            embedding = model.encode_image(image).cpu().numpy()

        index.add(embedding)
        recipe_names.append(filename.split(".")[0])  # Store food name

# Save embeddings & recipe names
np.save("food_embeddings.npy", index.reconstruct_n(0, index.ntotal))
with open("recipe_names.txt", "w") as f:
    f.write("\n".join(recipe_names))

print("✅ Embeddings stored successfully!")
