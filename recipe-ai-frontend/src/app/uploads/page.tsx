/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState } from "react";
import axios from "axios";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
const RecipeGenerator = () => {
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Selected file
  const [recipe, setRecipe] = useState<string | null>(null); // Fetched recipe
  const [videos, setVideos] = useState([]); // Related YouTube videos
  const [loading, setLoading] = useState(false); // Loading state for recipe
  const [loadingVideos, setLoadingVideos] = useState(false); // Loading state for videos
  const [error, setError] = useState<string | null>(null); // Error message
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <p>Loading...</p>;
  }
  // Handle File Selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setError(null); // Clear errors
    }
  };

  // Upload File and Fetch Recipe
  const uploadFile = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }

    setLoading(true);
    setError(null);
    setRecipe(null); // Clear previous recipe
    setVideos([]); // Clear previous videos

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/upload-image/",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setRecipe(response.data.recipe); // Set fetched recipe
      fetchVideos(response.data.dish); // Fetch related videos based on the dish name
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("Error fetching the recipe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Related Videos
  const fetchVideos = async (dish: string) => {
    setLoadingVideos(true); // Start loading videos
    try {
      const response = await axios.get(`http://127.0.0.1:8000/get-videos/${dish}`);
      setVideos(response.data.videos); // Set fetched videos
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError("Error fetching related videos. Please try again.");
    } finally {
      setLoadingVideos(false); // Stop loading videos
    }
  };
  if (status === "authenticated") {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-semibold text-center text-gray-700 mb-6">
          Upload a Dish Image
        </h1>

        {/* File Input */}
        <div className="mb-6">
          <label htmlFor="file" className="block text-sm font-medium text-gray-600 mb-2">
            Select an image
          </label>
          <input
            id="file"
            name="file"
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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

        {/* Recipe Display */}
        {recipe && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Recipe:</h2>
            <pre className="whitespace-pre-wrap text-gray-600">{recipe}</pre>
          </div>
        )}

        {/* Loading Indicator for Videos */}
        {loadingVideos && (
          <div className="mt-6 p-3 bg-green-50 text-green-600 text-center rounded-lg text-sm">
            Fetching related videos... Please wait.
          </div>
        )}

        {/* Videos Section */}
        {!loadingVideos && videos.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Related Videos:</h2>
            <div className="grid grid-cols-1 gap-4">
              {videos.map((video: { videoId: string; title: string; thumbnail: string }) => (
                <div key={video.videoId} className="flex items-center space-x-4">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-32 h-20 object-cover rounded-lg"
                  />
                  <div>
                    <p className="text-sm font-medium">{video.title}</p>
                    <iframe
                      className="mt-2"
                      width="300"
                      height="200"
                      src={`https://www.youtube.com/embed/${video.videoId}`}
                      title={video.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );}
};

export default RecipeGenerator;
