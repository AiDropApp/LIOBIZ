import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3B82F6",
          dark: "#2563EB",
          light: "#60A5FA",
          soft: "#93C5FD",
        },
        dark: {
          DEFAULT: "#07090D",
          100: "#0C1017",
          200: "#121821",
          300: "#1A2230",
          400: "#243044",
        },
        muted: {
          DEFAULT: "#B4BCC9",
        },
        warm: {
          DEFAULT: "#F59E0B",
          soft: "#FBBF24",
        },
      },
      fontFamily: {
        vazir: ["var(--font-vazirmatn)", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-glow":
          "radial-gradient(ellipse at center, rgba(59,130,246,0.12) 0%, transparent 70%)",
      },
      animation: {
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
