import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  images: {
    domains: ["images.pexels.com"], // Add Unsplash as an allowed domain
  },
};

export default nextConfig;

