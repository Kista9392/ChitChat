import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Don't fail the build on ESLint warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don't fail the build on TypeScript errors
    ignoreBuildErrors: true,
  },
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
