"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

const Navbar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [isMenuOpen, setIsMenuOpen] = useState(false); // State for mobile menu

    useEffect(() => {
        const token = Cookies.get("token");
        if (token) {
            try {
                const decodedToken = jwtDecode<{ sub?: string }>(token);
                if (decodedToken.sub) {
                    setUsername(decodedToken.sub);
                }
            } catch (error) {
                console.error("Invalid token:", error);
                setUsername("");
            }
        } else {
            setUsername("");
        }
    }, [pathname]);

    const handleLogout = () => {
        Cookies.remove("token");
        setUsername("");
        setIsMenuOpen(false); // Close menu on logout
        router.push("/");
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Left - Project Name */}
                <div className="text-white font-bold text-xl">
                    <Link href="/">Food Recipe AI</Link>
                </div>

                {/* Hamburger Menu Button (Mobile Only) */}
                <button
                    className="md:hidden text-white focus:outline-none"
                    onClick={toggleMenu}
                >
                    {/* Hamburger Icon */}
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                        />
                    </svg>
                </button>

                {/* Center - Routes (Desktop) */}
                {username ? (
                    <div className="hidden md:flex space-x-6">
                        <Link
                            href="/"
                            className={`${pathname === "/" ? "text-yellow-300" : "text-white"} hover:text-yellow-300 transition`}
                        >
                            Home
                        </Link>
                        <Link
                            href="/recipe-generator"
                            className={`${pathname === "/recipe-generator" ? "text-yellow-300" : "text-white"} hover:text-yellow-300 transition`}
                        >
                            Recipe Generator
                        </Link>
                        <Link
                            href="/uploads"
                            className={`${pathname === "/uploads" ? "text-yellow-300" : "text-white"} hover:text-yellow-300 transition`}
                        >
                            Upload Images
                        </Link>
                        <Link
                            href="/nutrition"
                            className={`${pathname === "/nutrition" ? "text-yellow-300" : "text-white"} hover:text-yellow-300 transition`}
                        >
                            Nutrition Info
                        </Link>
                        <Link
                            href="/shopping-list"
                            className={`${pathname === "/shopping-list" ? "text-yellow-300" : "text-white"} hover:text-yellow-300 transition`}
                        >
                            Shopping List
                        </Link>
                    </div>
                ) : (
                    <div className="hidden md:flex space-x-6">
                        <Link
                            href="/"
                            className={`${pathname === "/" ? "text-yellow-300" : "text-white"} hover:text-yellow-300 transition`}
                        >
                            Home
                        </Link>
                    </div>
                )}

                {/* Right - Authentication Buttons (Desktop) */}
                <div className="hidden md:flex space-x-4">
                    {username ? (
                        <>
                            <span className="bg-white text-gray-900 py-1 px-3 rounded transition">
                                {username}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="bg-red-400 text-white py-1 px-3 rounded hover:bg-red-500 transition"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="bg-white text-gray-900 py-1 px-3 rounded hover:bg-yellow-300 transition"
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="bg-yellow-400 text-gray-900 py-1 px-3 rounded hover:bg-yellow-300 transition"
                            >
                                Register
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu (Dropdown) */}
                {isMenuOpen && (
                    <div className="absolute top-16 left-0 w-full bg-gradient-to-r from-blue-600 to-purple-600 flex flex-col items-center space-y-4 py-4 md:hidden">
                        {username ? (
                            <>
                                <Link
                                    href="/"
                                    className={`${pathname === "/" ? "text-yellow-300" : "text-white"} hover:text-yellow-300 transition`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Home
                                </Link>
                                <Link
                                    href="/recipe-generator"
                                    className={`${pathname === "/recipe-generator" ? "text-yellow-300" : "text-white"} hover:text-yellow-300 transition`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Recipe Generator
                                </Link>
                                <Link
                                    href="/uploads"
                                    className={`${pathname === "/uploads" ? "text-yellow-300" : "text-white"} hover:text-yellow-300 transition`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Upload Images
                                </Link>
                                <Link
                                    href="/nutrition"
                                    className={`${pathname === "/nutrition" ? "text-yellow-300" : "text-white"} hover:text-yellow-300 transition`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Nutrition Info
                                </Link>
                                <Link
                                    href="/shopping-list"
                                    className={`${pathname === "/shopping-list" ? "text-yellow-300" : "text-white"} hover:text-yellow-300 transition`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Shopping List
                                </Link>
                                <span className="bg-white text-gray-900 py-1 px-3 rounded transition">
                                    {username}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="bg-red-400 text-white py-1 px-3 rounded hover:bg-red-500 transition"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/"
                                    className={`${pathname === "/" ? "text-yellow-300" : "text-white"} hover:text-yellow-300 transition`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Home
                                </Link>
                                <Link
                                    href="/login"
                                    className="bg-white text-gray-900 py-1 px-3 rounded hover:bg-yellow-300 transition"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    className="bg-yellow-400 text-gray-900 py-1 px-3 rounded hover:bg-yellow-300 transition"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;