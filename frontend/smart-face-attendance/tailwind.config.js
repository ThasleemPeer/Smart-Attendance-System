/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"], // Ensure your paths are correct
  theme: {
    extend: {},
  },
  plugins: [],
};
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      animation: {
        "glow": "glow 1.5s infinite alternate",
        "slide-up": "slideUp 0.5s ease-out",
        "float": "float 3s infinite ease-in-out",
        "spin-slow": "spin 10s linear infinite",
        "fade-in": "fadeIn 0.5s ease-in",
        "shake": "shake 0.5s ease-in-out",
      },
      keyframes: {
        glow: {
          "0%": { textShadow: "0 0 5px rgba(129, 140, 248, 0.5)" },
          "100%": { textShadow: "0 0 20px rgba(129, 140, 248, 1)" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        spin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-5px)" },
          "75%": { transform: "translateX(5px)" },
        },
      },
    },
  },
  plugins: [],
};