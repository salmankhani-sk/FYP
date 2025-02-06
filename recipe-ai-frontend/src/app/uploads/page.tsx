"use client"; // Ensure client-side rendering

import { useState } from "react";
import axios from "axios";

const ImageUpload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Selected file
  const [recipe, setRecipe] = useState<string | null>(null); // Recipe result
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState<string | null>(null); // Error message

  // Handle File Selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setError(null); // Clear any errors
    }
  };

  // Upload File to FastAPI
  const uploadFile = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }

    setLoading(true);
    setError(null);
    setRecipe(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/upload-image/", // FastAPI endpoint
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setRecipe(response.data.recipe); // Save recipe result
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("Failed to process the image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-6">
          Upload a Dish Image
        </h1>

        {/* File Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose an image
          </label>
          <input
          title="image"
          name="image"
          id="image"
          required
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            accept="image/*"
          />
        </div>

        {/* Upload Button */}
        <button
          onClick={uploadFile}
          disabled={loading || !selectedFile}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Processing..." : "Generate Recipe"}
        </button>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Display Recipe */}
        {recipe && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Generated Recipe
            </h2>
            <p className="text-gray-600 whitespace-pre-line">{recipe}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
