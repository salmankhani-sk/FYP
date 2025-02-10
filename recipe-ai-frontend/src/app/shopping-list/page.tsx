"use client";
import { useState } from "react";
import axios from "axios";

const ShoppingList = () => {
  const [recipes, setRecipes] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addRecipe = () => {
    if (input.trim() !== "") {
      setRecipes([...recipes, input.trim()]);
      setInput("");
    }
  };

  const removeRecipe = (index: number) => {
    setRecipes(recipes.filter((_, i) => i !== index));
  };

  const generatePDF = async () => {
    if (recipes.length === 0) {
      setError("Please add at least one recipe.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/generate-shopping-list/",
        { recipes },
        { responseType: "blob" } // Handle binary file response
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "shopping_list.pdf");
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      setError("Failed to generate shopping list. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-6">
          Grocery Shopping List 🛒
        </h1>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Enter recipe name..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full px-4 py-2 border text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-300"
          />
          <button
            onClick={addRecipe}
            className="mt-2 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            Add Recipe
          </button>
        </div>

        <ul className="mb-4">
          {recipes.map((recipe, index) => (
            <li key={index} className="flex justify-between text-gray-700 items-center bg-gray-100 p-2 rounded-lg mt-2">
              {recipe}
              <button
                onClick={() => removeRecipe(index)}
                className="text-red-500 hover:text-red-700"
              >
                ✖
              </button>
            </li>
          ))}
        </ul>

        <button
          onClick={generatePDF}
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Download Shopping List PDF"}
        </button>

        {error && <p className="mt-4 text-red-600">{error}</p>}
      </div>
    </div>
  );
};

export default ShoppingList;
