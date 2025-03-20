"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion"; // Import Framer Motion

const RegisterPage = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const router = useRouter();

    const handleRegister = useCallback(async () => {
        setError("");
        setSuccess("");

        if (!username || !email || !password) {
            setError("All fields are required!");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        try {
            const response = await axios.post("http://localhost:8000/register", {
                username,
                email,
                password,
            });

            // Save the token to cookies to auto-login the user
            Cookies.set("token", response.data.access_token, { expires: 7 });

            setSuccess("Registration successful! Redirecting...");
            setUsername("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");

            setTimeout(() => {
                router.push("/recipe-generator");
            }, 1500);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.detail || "Registration failed! Please try again.");
            } else {
                setError("Something went wrong. Please try again.");
            }
        }
    }, [username, email, password, confirmPassword, router]);

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
                className="w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <h2 className="text-4xl font-bold text-center text-indigo-800 tracking-tight">
                    Register
                </h2>

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
                    <label className="block text-gray-700 font-medium">Username</label>
                    <motion.input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 text-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-300"
                        placeholder="Enter your username"
                        variants={inputVariants}
                        whileFocus="focus"
                    />
                </motion.div>

                {/* Email Input */}
                <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <label className="block text-gray-700 font-medium">Email</label>
                    <motion.input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 text-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-300"
                        placeholder="Enter your email"
                        variants={inputVariants}
                        whileFocus="focus"
                    />
                </motion.div>

                {/* Password Input */}
                <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <label className="block text-gray-700 font-medium">Password</label>
                    <motion.input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 text-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-300"
                        placeholder="Enter your password"
                        variants={inputVariants}
                        whileFocus="focus"
                    />
                </motion.div>

                {/* Confirm Password Input */}
                <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <label className="block text-gray-700 font-medium">Confirm Password</label>
                    <motion.input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 text-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-300"
                        placeholder="Confirm your password"
                        variants={inputVariants}
                        whileFocus="focus"
                    />
                </motion.div>

                {/* Register Button */}
                <motion.button
                    onClick={handleRegister}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-colors duration-300"
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                >
                    Register
                </motion.button>

                {/* Login Link */}
                <motion.p
                    className="text-center text-gray-700 mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    Already have an account?{" "}
                    <motion.span
                        className="text-indigo-500 hover:underline cursor-pointer"
                        onClick={() => router.push("/login")}
                        variants={linkVariants}
                        whileHover="hover"
                    >
                        Login
                    </motion.span>
                </motion.p>
            </motion.div>
        </div>
    );
};

export default RegisterPage;