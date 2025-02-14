"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left - Project Name */}
        <div className="text-white font-bold text-xl">
          <Link href="/">Food Recipe AI</Link>
        </div>

        {/* Center - Routes */}
        <div className="hidden md:flex space-x-6">
          <Link
            href="/"
            className={`${
              pathname === "/" ? "text-yellow-300" : "text-white"
            } hover:text-yellow-300 transition`}
          >
            Home
          </Link>
          <Link
            href="/recipe-generator"
            className={`${
              pathname === "/recipe-generator" ? "text-yellow-300" : "text-white"
            } hover:text-yellow-300 transition`}
          >
            Recipe Generator
          </Link>
          <Link
            href="/uploads"
            className={`${
              pathname === "/uploads" ? "text-yellow-300" : "text-white"
            } hover:text-yellow-300 transition`}
          >
            Upload Images
          </Link>
          <Link
            href="/nutrition"
            className={`${
              pathname === "/nutrition" ? "text-yellow-300" : "text-white"
            } hover:text-yellow-300 transition`}
          >
            Nutrition Info
          </Link>
          <Link
            href="/shopping-list"
            className={`${
              pathname === "/shopping-list" ? "text-yellow-300" : "text-white"
            } hover:text-yellow-300 transition`}
          >
            Shopping List
          </Link>
        </div>

        {/* Right - Login and Register */}
        <div className="space-x-4">
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
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
