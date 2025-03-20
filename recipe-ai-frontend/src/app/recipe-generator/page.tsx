/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const RecipeGenerator = () => {
    const [images, setImages] = useState([]); // Array of fetched images
    const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null); // Selected image
    const [recipe, setRecipe] = useState<string | null>(null); // Fetched recipe
    const [videos, setVideos] = useState([]); // Array of fetched videos
    const [loading, setLoading] = useState(false); // Loading state for recipe
    const [loadingVideos, setLoadingVideos] = useState(false); // Loading state for videos
    const [query, setQuery] = useState(""); // User's search input
    const [history, setHistory] = useState([]); // User's chat history
    const [historyError, setHistoryError] = useState<string | null>(null); // Error for history fetching
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== "undefined") {
            console.log("This runs only on the client!");
            fetchHistory(); // Fetch history on component mount
        }
    }, []);

    // Fetch user history from the backend
    const fetchHistory = async () => {
        try {
            const token = Cookies.get("token");
            if (!token) {
                setHistoryError("Please log in to view history.");
                return;
            }

            const response = await fetch("http://127.0.0.1:8000/recipe-generator-history/", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                if (response.status === 403 || response.status === 401) {
                    Cookies.remove("token");
                    router.push("/login");
                    return;
                }
                throw new Error("Failed to fetch history");
            }

            const data = await response.json();
            setHistory(data.history);
        } catch (err: any) {
            setHistoryError(err.message);
        }
    };

    // Fetch images from the backend
    const fetchImages = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://127.0.0.1:8000/get-images/${query}`);
            if (!response.ok) {
                throw new Error("Failed to fetch images");
            }
            const data = await response.json();
            setImages(data.images);
        } catch (error) {
            console.error("Error fetching images:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch recipe from the backend with JWT token
    const fetchRecipe = async (dish: string) => {
        setLoading(true);
        setLoadingVideos(true);
        const token = Cookies.get("token");
        try {
            const response = await fetch("http://127.0.0.1:8000/generate-recipe/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ prompt: dish }),
            });

            if (!response.ok) {
                if (response.status === 403 || response.status === 401) {
                    Cookies.remove("token");
                    router.push("/login");
                    return;
                }
                throw new Error("Failed to generate recipe");
            }

            const data = await response.json();
            setRecipe(data.recipe);
            fetchVideos(dish);

            // Refresh history after generating a recipe
            await fetchHistory();
        } catch (error: any) {
            console.error("Error fetching recipe:", error);
            setRecipe(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Fetch videos from the backend
    const fetchVideos = async (dish: string) => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/get-videos/${dish}`);
            if (!response.ok) {
                throw new Error("Failed to fetch videos");
            }
            const data = await response.json();
            setVideos(data.videos);
        } catch (error) {
            console.error("Error fetching videos:", error);
        } finally {
            setLoadingVideos(false);
        }
    };

    // Handle clicking a history item
    const handleHistoryClick = (entry: any) => {
        let dish = "";
        if (entry.type === "search") {
            dish = entry.query.split("Searched: ")[1];
        } else if (entry.type === "chat") {
            const match = entry.message.match(/Recipe for (.+?):/);
            if (match) {
                dish = match[1];
            }
        }

        if (dish) {
            const image = images.find((img: any) => img.alt.toLowerCase() === dish.toLowerCase());
            if (image) {
                setSelectedImage(image);
            } else {
                setSelectedImage({ url: "", alt: dish });
            }
            fetchRecipe(dish);
        }
    };

    // Animation variants for Framer Motion
    const containerVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    };

    const imageVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
        hover: { scale: 1.05, transition: { duration: 0.3 } },
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
                className="w-full max-w-2xl bg-white p-10 rounded-2xl shadow-2xl space-y-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <h1 className="text-4xl font-bold text-center text-indigo-800 tracking-tight">
                    Food Recipe Generator 🍳
                </h1>

                {/* Search and Image Grid */}
                <AnimatePresence>
                    {!selectedImage && (
                        <motion.div
                            key="search-section"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Input for search query */}
                            <div className="space-y-4">
                                <label htmlFor="query" className="block text-lg font-medium text-gray-700">
                                    Enter a dish name:
                                </label>
                                <motion.input
                                    id="query"
                                    type="text"
                                    className="w-full p-4 border border-gray-300 text-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-300"
                                    placeholder="e.g., Chicken"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    whileFocus={{ scale: 1.02 }}
                                />
                            </div>

                            {/* Button to fetch images */}
                            <motion.button
                                onClick={fetchImages}
                                disabled={loading}
                                className="w-full py-3 mt-4 bg-indigo-600 text-white text-lg font-semibold rounded-xl disabled:opacity-50 hover:bg-indigo-700 transition-colors duration-300"
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                            >
                                {loading ? "Loading Images..." : "Search Images"}
                            </motion.button>

                            {/* Display fetched images */}
                            <motion.div
                                className="grid grid-cols-2 gap-6 mt-8"
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    visible: {
                                        transition: { staggerChildren: 0.1 },
                                    },
                                }}
                            >
                                {images.map((image: { id: number; url: string; alt: string }) => (
                                    <motion.div
                                        key={image.id}
                                        onClick={() => {
                                            setSelectedImage(image);
                                            fetchRecipe(image.alt);
                                        }}
                                        className="cursor-pointer"
                                        variants={imageVariants}
                                        initial="hidden"
                                        animate="visible"
                                        whileHover="hover"
                                    >
                                        <img
                                            src={image.url}
                                            alt={image.alt}
                                            className="w-full h-40 object-cover rounded-xl shadow-md"
                                        />
                                        <p className="text-center text-sm font-medium text-gray-600 mt-3">{image.alt}</p>
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* Chat History Section */}
                            <motion.div
                                className="mt-10"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Chat History</h2>
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
                                                    {entry.type === "chat" && (
                                                        <>
                                                            <p className="text-gray-700 font-medium">{entry.message}</p>
                                                            <p className="text-gray-500 text-sm">
                                                                {new Date(entry.timestamp).toLocaleString()}
                                                            </p>
                                                        </>
                                                    )}
                                                </motion.li>
                                            ))}
                                        </AnimatePresence>
                                    </ul>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Recipe and Video Section */}
                <AnimatePresence>
                    {selectedImage && (
                        <motion.div
                            key="recipe-section"
                            className="mt-8"
                            variants={sectionVariants}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, x: 50 }}
                        >
                            {/* Show selected image */}
                            {selectedImage.url ? (
                                <motion.img
                                    src={selectedImage.url}
                                    alt={selectedImage.alt}
                                    className="w-full h-72 object-cover rounded-2xl shadow-lg"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5 }}
                                />
                            ) : (
                                <motion.div
                                    className="w-full h-72 bg-gray-200 flex items-center justify-center rounded-2xl shadow-lg"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <p className="text-gray-500">No image available</p>
                                </motion.div>
                            )}
                            <motion.p
                                className="text-center text-xl font-semibold text-gray-800 mt-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                            >
                                {selectedImage.alt} {/* Fixed syntax error here */}
                            </motion.p>

                            {/* Loading Indicator for Recipe */}
                            {loading && (
                                <motion.div
                                    className="mt-6 p-4 bg-blue-50 text-blue-700 text-center rounded-xl"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    Generating Recipe... Please wait.
                                </motion.div>
                            )}

                            {/* Show recipe after loading */}
                            {!loading && recipe && (
                                <motion.div
                                    className="mt-6 p-6 bg-gray-50 rounded-xl shadow-md"
                                    variants={sectionVariants}
                                >
                                    <h2 className="text-2xl font-semibold text-gray-800">Recipe for {selectedImage.alt}</h2>
                                    <pre className="whitespace-pre-wrap break-words text-gray-600 mt-2">{recipe}</pre>
                                </motion.div>
                            )}

                            {/* Loading Indicator for Videos */}
                            {loadingVideos && (
                                <motion.div
                                    className="mt-6 p-4 bg-green-50 text-green-700 text-center rounded-xl"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    Fetching Recipe Videos... Please wait.
                                </motion.div>
                            )}

                            {/* Show related videos after they are fetched */}
                            {!loadingVideos && videos.length > 0 && (
                                <motion.div
                                    className="mt-8"
                                    variants={sectionVariants}
                                >
                                    <h2 className="text-2xl font-semibold text-gray-800">Related Videos</h2>
                                    <div className="grid grid-cols-1 gap-6 mt-4">
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
                                                    <p className="text-lg font-medium text-gray-700">{video.title}</p>
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

                            {/* Back to Image Grid */}
                            <motion.button
                                onClick={() => {
                                    setSelectedImage(null);
                                    setRecipe(null);
                                    setVideos([]);
                                }}
                                className="mt-8 py-2 px-6 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors duration-300"
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                            >
                                Back to Image Grid
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default RecipeGenerator;