"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode"; // Make sure you have installed jwt-decode

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        // Decode the token; FastAPI stores the username in "sub"
        const decodedToken = jwtDecode<{ sub?: string }>(token);
        if (decodedToken.sub) {
          setUsername(decodedToken.sub);
        }
      } catch (error) {
        console.error("Invalid token:", error);
      }
    } else {
      setUsername("");
    }
  }, [pathname]); // Re-run on route change so that Navbar updates if token changes

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUsername("");
    router.push("/"); // Redirect to homepage
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left - Project Name */}
        <div className="text-white font-bold text-xl">
          <Link href="/">Food Recipe AI</Link>
        </div>
        {/* Center - Routes */}
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
        {/* Right - Authentication Buttons */}
        <div className="space-x-4">
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
      </div>
    </nav>
  );
};

export default Navbar;
