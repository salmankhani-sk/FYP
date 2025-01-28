"use client";
import { useState } from "react";
import axios from "axios";

const RecipeGenerator = () => {
  const [images, setImages] = useState([]); // Array of fetched images
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null); // Selected image
  const [recipe, setRecipe] = useState<string | null>(null); // Fetched recipe
  const [videos, setVideos] = useState([]); // Array of fetched videos
  const [loading, setLoading] = useState(false); // Loading state
  const [query, setQuery] = useState(""); // User's search input

  // Fetch images from the backend
  const fetchImages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://127.0.0.1:8000/get-images/${query}`);
      setImages(response.data.images); // Set the fetched images
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch recipe from the backend
  const fetchRecipe = async (dish: string) => {
    setLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:8000/generate-recipe/", {
        prompt: dish,
      });
      setRecipe(response.data.recipe); // Set the fetched recipe
      fetchVideos(dish); // Fetch videos after recipe is successfully generated
    } catch (error) {
      console.error("Error fetching recipe:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch videos from the backend
  const fetchVideos = async (dish: string) => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/get-videos/${dish}`);
      setVideos(response.data.videos); // Set the fetched videos
    } catch (error) {
      console.error("Error fetching videos:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl bg-white p-8 rounded-lg shadow-lg space-y-6">
        <h1 className="text-3xl font-semibold text-center text-gray-700">Food Recipe Generator</h1>

        {/* Search and Image Grid */}
        {!selectedImage && (
          <>
            {/* Input for search query */}
            <div className="space-y-4">
              <label htmlFor="query" className="block text-lg font-medium text-gray-600">
                Enter a dish name:
              </label>
              <input
                id="query"
                type="text"
                className="w-full p-3 border text-black rounded-lg"
                placeholder="e.g., Chicken"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {/* Button to fetch images */}
            <button
              onClick={fetchImages}
              disabled={loading}
              className="w-full py-3 bg-blue-500 text-white text-lg font-medium rounded-lg disabled:opacity-50 hover:bg-blue-600"
            >
              {loading ? "Loading Images..." : "Search Images"}
            </button>

            {/* Display fetched images */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              {images.map((image: { id: number; url: string; alt: string }) => (
                <div
                  key={image.id}
                  onClick={() => {
                    setSelectedImage(image); // Store the clicked image
                    fetchRecipe(image.alt); // Fetch recipe for the selected dish
                  }}
                  className="cursor-pointer"
                >
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <p className="text-center text-sm font-medium text-gray-600 mt-2">{image.alt}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Recipe and Video Section */}
        {selectedImage && (
          <div className="mt-6">
            {/* Show selected image */}
            <img
              src={selectedImage.url}
              alt={selectedImage.alt}
              className="w-full h-64 object-cover rounded-lg"
            />
            <p className="text-center text-lg font-medium text-gray-700 mt-4">{selectedImage.alt}</p>

            {/* Loading Indicator */}
            {loading && (
              <div className="mt-6 p-4 bg-blue-100 text-blue-700 text-center rounded-lg">
                Generating Recipe... Please wait.
              </div>
            )}

            {/* Show recipe after loading */}
            {!loading && recipe && (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-gray-700">Recipe for {selectedImage.alt}</h2>
                <pre className="whitespace-pre-wrap break-words text-gray-600">{recipe}</pre>
              </div>
            )}

            {/* Show related videos */}
            {!loading && videos.length > 0 && (
              <div className="mt-6">
                <h2 className="text-2xl font-semibold text-gray-700">Related Videos</h2>
                <div className="grid grid-cols-1 gap-4 mt-4">
                  {videos.map((video: { videoId: string; title: string; thumbnail: string }) => (
                    <div key={video.videoId} className="flex items-center space-x-4">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-32 h-20 object-cover rounded-lg"
                      />
                      <div>
                        <p className="text-lg font-medium">{video.title}</p>
                        <iframe
                          className="mt-2"
                          width="560"
                          height="315"
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

            {/* Back to Image Grid */}
            <button
              onClick={() => {
                setSelectedImage(null);
                setRecipe(null);
                setVideos([]);
              }}
              className="mt-6 py-2 px-4 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Back to Image Grid
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeGenerator;
