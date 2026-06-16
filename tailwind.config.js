/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        ice: {
          50: "#F0F9FF",
          100: "#E0F2FE",
          200: "#BAE6FD",
          300: "#7DD3FC",
          400: "#38BDF8",
          500: "#0EA5E9",
          600: "#0284C7",
          700: "#0369A1",
          800: "#075985",
          900: "#0C4A6E",
          950: "#082F49",
        },
        frost: {
          bg: "#0B1120",
          card: "#111827",
          border: "#1E3A5F",
          surface: "#162032",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      animation: {
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "snow-fall": "snow-fall 3s linear infinite",
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 5px rgba(14,165,233,0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(14,165,233,0.6)" },
        },
        "snow-fall": {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "50%": { opacity: "1" },
          "100%": { transform: "translateY(10px)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
