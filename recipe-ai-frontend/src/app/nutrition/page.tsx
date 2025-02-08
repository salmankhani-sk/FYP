"use client";

import { useState } from "react";
import axios from "axios";

const NutritionPage = () => {
  const [foodItem, setFoodItem] = useState("");
  const [pdfURL, setPdfURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Form Submission
  const handleGeneratePDF = async () => {
    if (!foodItem) {
      setError("Please enter a food item.");
      return;
    }
    setLoading(true);
    setError(null);
    setPdfURL(null);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/generate-food-pdf/",
        { food_item: foodItem },
        { responseType: "blob" } // To handle file response
      );

      // Create a downloadable blob URL
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      setPdfURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-600 text-center mb-6">Nutrition Details</h1>

        {/* Input Field */}
        <input
          type="text"
          value={foodItem}
          onChange={(e) => setFoodItem(e.target.value)}
          placeholder="Enter food item (e.g., Chicken Breast)"
          className="w-full p-3 mb-4 border text-gray-800 border-gray-300 rounded-lg"
        />

        {/* Generate Button */}
        <button
          onClick={handleGeneratePDF}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Generating PDF..." : "Generate PDF"}
        </button>

        {/* Error Message */}
        {error && <div className="text-red-500 text-sm mt-4">{error}</div>}

        {/* PDF Viewer and Download Link */}
        {pdfURL && (
          <div className="mt-6 text-center">
            <iframe
              src={pdfURL}
              title="Nutrition Details PDF"
              className="w-full h-64 border rounded-lg mb-4"
            />
            <a
              href={pdfURL}
              download={`${foodItem.replace(" ", "_")}_nutrition_details.pdf`}
              className="text-blue-600 underline"
            >
              Download PDF
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default NutritionPage;
