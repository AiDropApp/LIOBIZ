import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "my.files.ir",
      },
      {
        protocol: "https",
        hostname: "files.ir",
      },
    ],
    localPatterns: [
      { pathname: "/images/**" },
      { pathname: "/uploads/**" },
      { pathname: "/icons/**" },
      { pathname: "/api/media/**" },
    ],
  },
};

export default nextConfig;
