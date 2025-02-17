"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface DecodedToken {
  sub?: string; // our token payload uses "sub" to store the username
}

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState("");

  useEffect(() => {
    async function decodeToken() {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          // Dynamically import jwt-decode
          const jwtModule = await import("jwt-decode");
          // Determine a callable decode function from the imported module.
          let decodeFn: (token: string) => any;
          if (typeof jwtModule === "function") {
            decodeFn = jwtModule;
          } else if (typeof jwtModule.default === "function") {
            decodeFn = jwtModule.default;
          } else if (typeof jwtModule.decode === "function") {
            decodeFn = jwtModule.decode;
          } else {
            // Fallback: assume the module itself is callable.
            decodeFn = jwtModule as unknown as (token: string) => any;
          }
          const decodedToken: DecodedToken = decodeFn(token);
          setUsername(decodedToken.sub || "");
        } catch (error) {
          console.error("Invalid token:", error);
          setUsername("");
        }
      } else {
        setUsername("");
      }
    }
    decodeToken();
  }, [pathname]); // re-run effect when the URL changes

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUsername("");
    router.push("/");
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="text-white font-bold text-xl">
          <Link href="/">Food Recipe AI</Link>
        </div>
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
