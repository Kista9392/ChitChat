import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from Cloudinary and other external sources
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "www.gstatic.com" },
    ],
  },
};

export default nextConfig;
