"use client";
import { useState } from "react";
import axios from "axios";

const UploadImage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipe, setRecipe] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  // Upload file to backend
  const uploadFile = async () => {
    if (!selectedFile) return alert("Please select an image!");
    setLoading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post("http://127.0.0.1:8000/upload-image/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.error) {
        alert(response.data.error);
      } else {
        setIngredients(response.data.ingredients);
        setRecipe(response.data.recipe);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-semibold mb-4">Upload Dish Image</h1>

        {/* File Input */}
        <label htmlFor="file-upload" className="mb-4">Upload Image</label>
        <input id="file-upload" type="file" onChange={handleFileChange} className="mb-4" />

        {/* Upload Button */}
        <button
          onClick={uploadFile}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? "Generating Recipe..." : "Upload & Generate Recipe"}
        </button>

        {/* Display Ingredients */}
        {ingredients.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold">Detected Ingredients</h2>
            <p>{ingredients.join(", ")}</p>
          </div>
        )}

        {/* Display Recipe */}
        {recipe && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h2 className="text-xl font-semibold">Generated Recipe</h2>
            <p className="text-gray-600">{recipe}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadImage;
