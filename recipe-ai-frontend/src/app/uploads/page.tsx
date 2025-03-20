/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion"; // Import Framer Motion

const UploadPage = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null); // Selected file
    const [recipe, setRecipe] = useState<string | null>(null); // Fetched recipe
    const [dish, setDish] = useState<string | null>(null); // Fetched dish name
    const [videos, setVideos] = useState([]); // Related YouTube videos
    const [loading, setLoading] = useState(false); // Loading state for recipe
    const [loadingVideos, setLoadingVideos] = useState(false); // Loading state for videos
    const [error, setError] = useState<string | null>(null); // Error message
    const [history, setHistory] = useState([]); // User's upload history
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

            const response = await axios.get("http://127.0.0.1:8000/uploads-history/", {
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

    // Handle File Selection
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
            setError(null);
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
        setRecipe(null);
        setVideos([]);
        setDish(null);

        const formData = new FormData();
        formData.append("file", selectedFile);
        const token = Cookies.get("token");

        try {
            const response = await axios.post("http://127.0.0.1:8000/upload-image/", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    "Authorization": `Bearer ${token}`,
                },
            });

            setDish(response.data.dish);
            setRecipe(response.data.recipe);
            fetchVideos(response.data.dish);

            // Refresh history after uploading
            await fetchHistory();
        } catch (err) {
            console.error("Error uploading file:", err);
            if (axios.isAxiosError(err) && (err.response?.status === 403 || err.response?.status === 401)) {
                Cookies.remove("token");
                router.push("/login");
            } else {
                setError("Error fetching the recipe. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Fetch Related Videos
    const fetchVideos = async (dish: string) => {
        setLoadingVideos(true);
        try {
            const response = await axios.get(`http://127.0.0.1:8000/get-videos/${dish}`);
            setVideos(response.data.videos);
        } catch (err) {
            console.error("Error fetching videos:", err);
            setError("Error fetching related videos. Please try again.");
        } finally {
            setLoadingVideos(false);
        }
    };

    // Handle clicking a history item
    const handleHistoryClick = async (entry: any) => {
        let dish = "";
        if (entry.message.includes("Generated recipe for")) {
            const match = entry.message.match(/Generated recipe for (.+?):/);
            if (match) {
                dish = match[1];
            }
        }

        if (dish) {
            setLoading(true);
            setLoadingVideos(true);
            setError(null);
            setRecipe(null);
            setVideos([]);
            setDish(null);

            try {
                const token = Cookies.get("token");
                const response = await axios.post(
                    "http://127.0.0.1:8000/generate-recipe/",
                    { prompt: dish },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`,
                        },
                    }
                );

                setDish(dish);
                setRecipe(response.data.recipe);
                fetchVideos(dish);
            } catch (err) {
                console.error("Error re-fetching recipe:", err);
                if (axios.isAxiosError(err) && (err.response?.status === 403 || err.response?.status === 401)) {
                    Cookies.remove("token");
                    router.push("/login");
                } else {
                    setError("Error re-fetching the recipe. Please try again.");
                }
            } finally {
                setLoading(false);
            }
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
                    Upload a Dish Image 📸
                </h1>

                {/* File Input */}
                <motion.div
                    className="mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <label htmlFor="file" className="block text-lg font-medium text-gray-700 mb-2">
                        Select an image
                    </label>
                    <motion.input
                        id="file"
                        name="file"
                        type="file"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all duration-300"
                        accept="image/*"
                        whileFocus={{ scale: 1.02 }}
                    />
                    <motion.p
                        className="mt-2 text-sm text-gray-500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                    >
                        {selectedFile ? selectedFile.name : "No file chosen"}
                    </motion.p>
                </motion.div>

                {/* Upload Button */}
                <motion.button
                    onClick={uploadFile}
                    disabled={loading || !selectedFile}
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl hover:bg-indigo-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                >
                    {loading ? "Processing..." : "Generate Recipe"}
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

                {/* Upload History Section */}
                <motion.div
                    className="mt-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">History</h2>
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
                                        <p className="text-gray-700 font-medium">{entry.message}</p>
                                        <p className="text-gray-500 text-sm">
                                            {new Date(entry.timestamp).toLocaleString()}
                                        </p>
                                    </motion.li>
                                ))}
                            </AnimatePresence>
                        </ul>
                    )}
                </motion.div>

                {/* Recipe Display */}
                <AnimatePresence>
                    {recipe && (
                        <motion.div
                            className="mt-6 p-6 bg-gray-50 rounded-xl shadow-md"
                            variants={sectionVariants}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, x: 50 }}
                        >
                            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                                Recipe for {dish}
                            </h2>
                            <pre className="whitespace-pre-wrap text-gray-600">{recipe}</pre>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Loading Indicator for Videos */}
                <AnimatePresence>
                    {loadingVideos && (
                        <motion.div
                            className="mt-6 p-3 bg-green-50 text-green-600 text-center rounded-lg text-sm"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            Fetching related videos... Please wait.
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Videos Section */}
                <AnimatePresence>
                    {!loadingVideos && videos.length > 0 && (
                        <motion.div
                            className="mt-6"
                            variants={sectionVariants}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, x: 50 }}
                        >
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Related Videos:</h2>
                            <div className="grid grid-cols-1 gap-6">
                                {videos.map((video: { videoId: string; title: string; thumbnail: string }) => (
                                    <motion.div
                                        key={video.videoId}
                                        className="flex items-center space-x-4"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <img
                                            src={video.thumbnail}
                                            alt={video.title}
                                            className="w-32 h-20 object-cover rounded-lg shadow-sm"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-700">{video.title}</p>
                                            <iframe
                                                className="mt-2 w-full rounded-lg"
                                                height="200"
                                                src={`https://www.youtube.com/embed/${video.videoId}`}
                                                title={video.title}
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            ></iframe>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default UploadPage;