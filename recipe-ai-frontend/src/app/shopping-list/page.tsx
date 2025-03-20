/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { FaHistory } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion"; // Import Framer Motion

const ShoppingList = () => {
    const [recipes, setRecipes] = useState<string[]>([]);
    const [input, setInput] = useState("");
    const [pdfURL, setPdfURL] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState([]); // User's shopping list history
    const [historyError, setHistoryError] = useState<string | null>(null); // Error for history fetching
    const [showHistory, setShowHistory] = useState(false); // Toggle history visibility
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

            const response = await axios.get("http://127.0.0.1:8000/shopping-list-history/", {
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

    const addRecipe = () => {
        if (input.trim() !== "") {
            setRecipes([...recipes, input.trim()]);
            setInput("");
        }
    };

    const removeRecipe = (index: number) => {
        setRecipes(recipes.filter((_, i) => i !== index));
    };

    const generatePDF = async (recipeList?: string[]) => {
        const recipesToGenerate = recipeList || recipes;
        if (recipesToGenerate.length === 0) {
            setError("Please add at least one recipe.");
            return;
        }

        setLoading(true);
        setError(null);
        setPdfURL(null);

        const token = Cookies.get("token");
        try {
            const response = await axios.post(
                "http://127.0.0.1:8000/generate-shopping-list/",
                { recipes: recipesToGenerate },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    responseType: "blob",
                }
            );

            const blob = new Blob([response.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            setPdfURL(url);
            setRecipes(recipesToGenerate); // Update the recipe list to reflect the generated PDF

            // Refresh history after generating a PDF
            await fetchHistory();
        } catch (error) {
            console.error("Error generating shopping list:", error);
            if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401)) {
                Cookies.remove("token");
                router.push("/login");
            } else {
                setError("Failed to generate shopping list. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = () => {
        if (pdfURL) {
            const link = document.createElement("a");
            link.href = pdfURL;
            link.setAttribute("download", "shopping_list.pdf");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    // Handle clicking a history item
    const handleHistoryClick = (entry: any) => {
        if (entry.type === "search") {
            // Extract recipe from "Shopping list recipe: Fries"
            const recipe = entry.query.split("Shopping list recipe: ")[1];
            if (recipe) {
                generatePDF([recipe]);
            }
        } else if (entry.type === "pdf") {
            // For PDFs, we re-generate the PDF with the current recipes
            generatePDF(recipes);
        }
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

    const recipeItemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
        exit: { opacity: 0, x: 20, transition: { duration: 0.3, ease: "easeOut" } },
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
                    Grocery Shopping List 🛒
                </h1>

                {/* Input and Add Recipe Button */}
                <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.input
                        type="text"
                        placeholder="Enter recipe name..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="w-full p-4 border border-gray-300 text-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-300"
                        whileFocus={{ scale: 1.02 }}
                    />
                    <motion.button
                        onClick={addRecipe}
                        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl hover:bg-indigo-700 transition-colors duration-300"
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                    >
                        Add Recipe
                    </motion.button>
                </motion.div>

                {/* Recipe List */}
                <motion.ul
                    className="space-y-3"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        visible: {
                            transition: { staggerChildren: 0.1 },
                        },
                    }}
                >
                    <AnimatePresence>
                        {recipes.map((recipe, index) => (
                            <motion.li
                                key={index}
                                className="flex justify-between text-gray-700 items-center bg-gray-50 p-3 rounded-lg"
                                variants={recipeItemVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                {recipe}
                                <motion.button
                                    onClick={() => removeRecipe(index)}
                                    className="text-red-500 hover:text-red-700"
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    ✖
                                </motion.button>
                            </motion.li>
                        ))}
                    </AnimatePresence>
                </motion.ul>

                {/* Generate PDF and Toggle History Buttons */}
                <motion.div
                    className="flex space-x-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <motion.button
                        onClick={() => generatePDF()}
                        disabled={loading}
                        className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-xl hover:bg-indigo-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                    >
                        {loading ? "Generating..." : "Generate Shopping List PDF"}
                    </motion.button>
                    <motion.button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-xl hover:bg-gray-500 transition-colors duration-300 flex items-center justify-center"
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                    >
                        <FaHistory className="mr-2" />
                        {showHistory ? "Hide History" : "Show History"}
                    </motion.button>
                </motion.div>

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.p
                            className="mt-4 text-red-600 text-sm"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {error}
                        </motion.p>
                    )}
                </AnimatePresence>

                {/* History Section */}
                <AnimatePresence>
                    {showHistory && (
                        <motion.div
                            className="mt-6"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                        >
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Shopping List History</h2>
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
                                <p className="text-gray-500">No history available.</p>
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
                                                {entry.type === "search" && (
                                                    <>
                                                        <p className="text-gray-700 font-medium">Searched: {entry.query}</p>
                                                        <p className="text-gray-500 text-sm">
                                                            {new Date(entry.timestamp).toLocaleString()}
                                                        </p>
                                                    </>
                                                )}
                                                {entry.type === "pdf" && (
                                                    <>
                                                        <p className="text-gray-700 font-medium">PDF: {entry.file_path}</p>
                                                        <p className="text-gray-500 text-sm">
                                                            {new Date(entry.created_at).toLocaleString()}
                                                        </p>
                                                    </>
                                                )}
                                            </motion.li>
                                        ))}
                                    </AnimatePresence>
                                </ul>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* PDF Preview and Download */}
                <AnimatePresence>
                    {pdfURL && (
                        <motion.div
                            className="mt-6 text-center"
                            variants={sectionVariants}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, x: 50 }}
                        >
                            <motion.h2
                                className="text-2xl font-semibold text-gray-800 mb-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                Preview:
                            </motion.h2>
                            <motion.iframe
                                src={pdfURL}
                                title="Shopping List PDF"
                                className="w-full h-64 border rounded-xl shadow-md"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                            />
                            <motion.button
                                onClick={downloadPDF}
                                className="mt-4 bg-indigo-600 text-white py-2 px-6 rounded-xl hover:bg-indigo-700 transition-colors duration-300"
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                            >
                                Download PDF
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default ShoppingList;