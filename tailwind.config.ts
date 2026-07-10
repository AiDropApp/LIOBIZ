import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        lg: "2rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1440px",
      },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--primary, #FF6A00)",
          dark: "var(--primary-dark, #E85D00)",
          light: "#FF8533",
          soft: "#FFB366",
        },
        background: {
          DEFAULT: "#FFFFFF",
          soft: "#F7F7F8",
          warm: "#F3F4F6",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F5F5F5",
        },
        foreground: {
          DEFAULT: "#111111",
          soft: "#1F1F1F",
        },
        dark: {
          DEFAULT: "#0A0A0A",
          100: "#111111",
          200: "#171717",
          300: "#222222",
          400: "#2E2E2E",
        },
        muted: {
          DEFAULT: "#6B7280",
        },
        warm: {
          DEFAULT: "#FF6A00",
          soft: "#FF8533",
        },
      },
      fontFamily: {
        vazir: ["var(--font-vazirmatn)", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-glow":
          "radial-gradient(ellipse at center, rgba(255,106,0,0.18) 0%, transparent 70%)",
      },
      boxShadow: {
        soft: "0 12px 40px rgba(0, 0, 0, 0.06)",
        card: "0 14px 36px rgba(0, 0, 0, 0.06)",
        header: "0 10px 30px rgba(0, 0, 0, 0.12)",
      },
      borderRadius: {
        "2.5xl": "1.25rem",
        "3xl": "1.5rem",
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
