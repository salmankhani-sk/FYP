"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion"; // Import Framer Motion

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const router = useRouter();

    const handleLogin = async () => {
        setError("");
        setSuccess("");
        try {
            const response = await axios.post("http://localhost:8000/login", {
                username,
                password,
            });
            const token = response.data.access_token;
            Cookies.set("token", token, { expires: 7 }); // Set token in cookies
            setSuccess("Login successful! Redirecting...");
            setTimeout(() => {
                router.push("/recipe-generator");
            }, 1500);
        } catch (error) {
            console.error("Login failed:", error);
            setError("Login failed! Please check your credentials.");
        }
    };

    const handleSignUp = () => {
        router.push("/register");
    };

    // Animation variants for Framer Motion
    const containerVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    };

    const inputVariants = {
        focus: { scale: 1.02, transition: { duration: 0.3 } },
    };

    const buttonVariants = {
        hover: { scale: 1.05, transition: { duration: 0.3 } },
        tap: { scale: 0.95, transition: { duration: 0.2 } },
    };

    const linkVariants = {
        hover: { scale: 1.05, color: "#4F46E5", transition: { duration: 0.3 } },
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <motion.div
                className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <h1 className="text-4xl font-bold text-center text-indigo-800 tracking-tight">
                    Login
                </h1>

                {/* Error and Success Messages */}
                <AnimatePresence>
                    {error && (
                        <motion.p
                            className="text-red-500 text-sm text-center"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {error}
                        </motion.p>
                    )}
                    {success && (
                        <motion.p
                            className="text-green-500 text-sm text-center"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {success}
                        </motion.p>
                    )}
                </AnimatePresence>

                {/* Username Input */}
                <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <motion.input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 text-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-300"
                        variants={inputVariants}
                        whileFocus="focus"
                    />
                </motion.div>

                {/* Password Input */}
                <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <motion.input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 text-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-300"
                        variants={inputVariants}
                        whileFocus="focus"
                    />
                </motion.div>

                {/* Login Button */}
                <motion.button
                    onClick={handleLogin}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-colors duration-300"
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                >
                    Login
                </motion.button>

                {/* Sign Up Link */}
                <motion.p
                    className="text-center text-gray-700 mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    Don&apos;t have an account?{" "}
                    <motion.span
                        className="text-indigo-500 hover:underline cursor-pointer"
                        onClick={handleSignUp}
                        variants={linkVariants}
                        whileHover="hover"
                    >
                        Sign up
                    </motion.span>
                </motion.p>
            </motion.div>
        </div>
    );
};

export default Login;