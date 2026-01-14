
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}" // Catch App.tsx, index.tsx, main.tsx in root
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#F7F8F6",
          navy: "#0D3355",
          deepBlue: "#18516C",
          teal: "#3091A4",
          lightTeal: "#56B3C8",
          purple: "#493A73",
        },
        ui: {
          bg: "#F8FAFC",
          card: "#FFFFFF",
          text: "#0F172A",
          slate: "#64748B",
          border: "#E2E8F0"
        },
        neural: {
          DEFAULT: "#6366F1", // Indigo 500
          dark: "#4338CA",    // Indigo 700
          light: "#818CF8"    // Indigo 400
        },
        deepTech: {
          DEFAULT: "#0F172A", // Slate 900
        },
        midnight: {
          DEFAULT: "#1E293B", // Slate 800
        },
        cyan: {
          electric: "#06B6D4", // Cyan 500
          bio: "#0EA5E9",      // Sky 500
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(to right, #4F46E5, #06B6D4)', // Indigo to Cyan
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
