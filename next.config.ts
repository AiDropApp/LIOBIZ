import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    localPatterns: [
      { pathname: "/images/**" },
      { pathname: "/uploads/**" },
      { pathname: "/icons/**" },
    ],
  },
};

export default nextConfig;
