"use client";
import { useState } from "react";
import axios from "axios";

const ImageUpload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recipe, setRecipe] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Handle File Selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  // Upload File to FastAPI
  const uploadFile = async () => {
    if (!selectedFile) {
      alert("Please select a file to upload.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/upload-image/", 
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setRecipe(response.data.recipe); // Save the recipe name
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error processing image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Upload a Dish Image</h1>

        {/* File Input */}
        <input title="salman" type="file" onChange={handleFileChange} className="mb-4" />

        {/* Upload Button */}
        <button
          onClick={uploadFile}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Uploading..." : "Upload Image"}
        </button>

        {/* Display Recipe */}
        {recipe && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <h2 className="text-lg font-semibold">Generated Recipe:</h2>
            <p>{recipe}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
