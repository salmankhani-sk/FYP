"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie"; // Import js-cookie

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

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md bg-white p-6 rounded shadow-lg">
                <h2 className="text-2xl text-blue-600 font-bold mb-4">Register</h2>

                {error && <p className="text-red-500 mb-4">{error}</p>}
                {success && <p className="text-green-500 mb-4">{success}</p>}

                <div className="mb-4">
                    <label className="block text-gray-700">Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-2 border rounded text-gray-900"
                        placeholder="Enter your username"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border rounded text-gray-900"
                        placeholder="Enter your email"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-900">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border rounded text-gray-900"
                        placeholder="Enter your password"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-900">Confirm Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 border rounded text-gray-900"
                        placeholder="Confirm your password"
                    />
                </div>

                <button
                    onClick={handleRegister}
                    className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
                >
                    Register
                </button>

                <p className="text-center text-gray-700 mt-4">
                    Already have an account?{" "}
                    <span
                        className="text-blue-500 hover:underline cursor-pointer"
                        onClick={() => router.push("/login")}
                    >
                        Login
                    </span>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;