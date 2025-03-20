/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion"; // Import Framer Motion

const NutritionPage = () => {
    const [foodItem, setFoodItem] = useState("");
    const [pdfURL, setPdfURL] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState([]); // User's PDF history
    const [historyError, setHistoryError] = useState<string | null>(null); // Error for history fetching
    const router = useRouter();

    // Fetch history on component mount
    useEffect(() => {
        fetchHistory();
    }, []);

    // Fetch user history from the backend
    const fetchHistory = async () => {
        try {
            const token = Cookies.get("token");
            if (!token) {
                setHistoryError("Please log in to view history.");
                return;
            }

            const response = await axios.get("http://127.0.0.1:8000/nutrition-history/", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            setHistory(response.data.history);
        } catch (err) {
            if (axios.isAxiosError(err) && (err.response?.status === 403 || err.response?.status === 401)) {
                Cookies.remove("token");
                router.push("/login");
            } else {
                setHistoryError("Error fetching history. Please try again.");
            }
        }
    };

    // Handle Form Submission
    const handleGeneratePDF = async (item?: string) => {
        const foodToGenerate = item || foodItem; // Use provided item or input field
        if (!foodToGenerate) {
            setError("Please enter a food item.");
            return;
        }
        setLoading(true);
        setError(null);
        setPdfURL(null);

        const token = Cookies.get("token");
        try {
            const response = await axios.post(
                "http://127.0.0.1:8000/generate-food-pdf/",
                { food_item: foodToGenerate },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    responseType: "blob",
                }
            );

            // Create a downloadable blob URL
            const blob = new Blob([response.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            setPdfURL(url);
            setFoodItem(foodToGenerate); // Update input field to reflect the generated food item

            // Refresh history after generating a PDF
            await fetchHistory();
        } catch (error) {
            console.error("Error generating PDF:", error);
            if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401)) {
                Cookies.remove("token");
                router.push("/login");
            } else {
                setError("Failed to generate PDF. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle clicking a history item
    const handleHistoryClick = (entry: any) => {
        // Extract food item from file path (e.g., "chicken_breast_nutrition_details.pdf" → "chicken breast")
        const fileName = entry.file_path.replace("_nutrition_details.pdf", "");
        const foodItemName = fileName.replace(/_/g, " ");
        handleGeneratePDF(foodItemName);
    };

    // Animation variants for Framer Motion
    const containerVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    };

    const sectionVariants = {
        hidden: { opacity: 0, x: -50 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
    };

    const historyItemVariants = {
        hidden: { opacity: 0, height: 0 },
        visible: { opacity: 1, height: "auto", transition: { duration: 0.3, ease: "easeOut" } },
    };

    const buttonVariants = {
        hover: { scale: 1.05, transition: { duration: 0.3 } },
        tap: { scale: 0.95, transition: { duration: 0.2 } },
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-6">
            <motion.div
                className="bg-white p-10 rounded-2xl shadow-2xl max-w-md w-full space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <h1 className="text-4xl font-bold text-center text-indigo-800 tracking-tight">
                    Nutrition Details 🥗
                </h1>

                {/* Input Field */}
                <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.input
                        type="text"
                        value={foodItem}
                        onChange={(e) => setFoodItem(e.target.value)}
                        placeholder="Enter food item (e.g., Chicken Breast)"
                        className="w-full p-4 border border-gray-300 text-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-300"
                        whileFocus={{ scale: 1.02 }}
                    />
                </motion.div>

                {/* Generate Button */}
                <motion.button
                    onClick={() => handleGeneratePDF()}
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl hover:bg-indigo-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                >
                    {loading ? "Generating PDF..." : "Generate PDF"}
                </motion.button>

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* History Section */}
                <motion.div
                    className="mt-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Generated PDFs</h2>
                    {historyError && (
                        <motion.div
                            className="text-red-500 mb-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            {historyError}
                        </motion.div>
                    )}
                    {history.length === 0 ? (
                        <p className="text-gray-500">No PDFs generated yet.</p>
                    ) : (
                        <ul className="space-y-3 max-h-60 overflow-y-auto">
                            <AnimatePresence>
                                {history.map((entry: any, index: number) => (
                                    <motion.li
                                        key={index}
                                        onClick={() => handleHistoryClick(entry)}
                                        className="border-b py-3 cursor-pointer hover:bg-gray-50 transition-all duration-200 rounded-lg"
                                        variants={historyItemVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="hidden"
                                    >
                                        <p className="text-gray-700 font-medium">PDF: {entry.file_path}</p>
                                        <p className="text-gray-500 text-sm">
                                            {new Date(entry.created_at).toLocaleString()}
                                        </p>
                                    </motion.li>
                                ))}
                            </AnimatePresence>
                        </ul>
                    )}
                </motion.div>

                {/* PDF Viewer and Download Link */}
                <AnimatePresence>
                    {pdfURL && (
                        <motion.div
                            className="mt-6 text-center"
                            variants={sectionVariants}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, x: 50 }}
                        >
                            <motion.iframe
                                src={pdfURL}
                                title="Nutrition Details PDF"
                                className="w-full h-64 border rounded-xl shadow-md"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                            />
                            <motion.a
                                href={pdfURL}
                                download={`${foodItem.replace(" ", "_")}_nutrition_details.pdf`}
                                className="mt-4 inline-block text-indigo-600 underline hover:text-indigo-800 transition-colors duration-300"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                            >
                                Download a PDF
                            </motion.a>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default NutritionPage;