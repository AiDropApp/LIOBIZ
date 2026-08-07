import type { NextConfig } from "next";
import fs from "fs";
import path from "path";
import { securityHeaderEntries } from "./lib/security-headers";

function cmsRedirects() {
  try {
    const file = path.join(process.cwd(), "data", "site-content.json");
    const raw = fs.readFileSync(file, "utf8");
    const parsed = JSON.parse(raw) as { redirects?: Array<{ from: string; to: string; permanent?: boolean }> };
    return (parsed.redirects || []).map((r) => ({
      source: r.from,
      destination: r.to,
      permanent: r.permanent !== false,
    }));
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "gsap"],
  },
  async headers() {
    const security = securityHeaderEntries().map(({ key, value }) => ({
      key,
      value,
    }));
    return [
      {
        source: "/:path*",
        headers: security,
      },
    ];
  },
  async redirects() {
    return cmsRedirects();
  },
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
      { pathname: "/video/**" },
      { pathname: "/api/media/**" },
      { pathname: "/media/**" },
    ],
  },
};

export default nextConfig;
