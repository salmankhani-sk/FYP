"use client";

import { useState,useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";

const RecipeFromIngredients = () => {
  const [ingredients, setIngredients] = useState<string>(""); // Input for ingredients
  const [recipe, setRecipe] = useState<string | null>(null); // Fetched recipe
  const [loading, setLoading] = useState(false); // Loading state
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
  // Function to fetch recipe based on ingredients
  const fetchRecipe = async () => {
    if (!ingredients.trim()) {
      setError("Please enter some ingredients.");
      return;
    }

    setLoading(true);
    setError(null);
    setRecipe(null);

    try {
      const response = await axios.post("http://127.0.0.1:8000/generate-recipe-from-ingredients/", {
        prompt: ingredients,
      });
      setRecipe(response.data.recipe); // Set fetched recipe
    } catch (err) {
      console.error("Error fetching recipe:", err);
      setError("Failed to generate a recipe. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  if (status === "authenticated"){

  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-semibold text-gray-900 text-center mb-6">Generate Recipe from Ingredients</h1>

        {/* Ingredients Input */}
        <div className="mb-4">
          <label htmlFor="ingredients" className="block text-gray-600 font-medium mb-2">
            Enter ingredients (comma-separated):
          </label>
          <textarea
            id="ingredients"
            rows={3}
            className="w-full p-3 border text-gray-900 border-gray-300 rounded-lg"
            placeholder="e.g., chicken, garlic, onion, spices"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
          />
        </div>

        {/* Generate Recipe Button */}
        <button
          onClick={fetchRecipe}
          disabled={loading}
          className="w-full py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Generating Recipe..." : "Generate Recipe"}
        </button>

        {/* Error Message */}
        {error && <div className="mt-4 p-3 bg-red-100 text-red-600 rounded">{error}</div>}

        {/* Display Generated Recipe */}
        {recipe && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Generated Recipe:</h2>
            <pre className="text-gray-700 whitespace-pre-wrap">{recipe}</pre>
          </div>
        )}
      </div>
    </div>
  );}
};

export default RecipeFromIngredients;
