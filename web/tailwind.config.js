/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        appBg:    "#080d1a",
        surface:  "#0e1628",
        elevated: "#131d32",
        appBgOld: "#0f172a",
        card:     "#1e293b",
        textMuted:"#94a3b8",
        indigo:   "#6366f1",
        violet:   "#8b5cf6",
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        sans:    ["DM Sans", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "monospace"],
      },
      animation: {
        "fade-in":    "fadeIn 300ms ease forwards",
        "slide-up":   "slideUp 400ms ease forwards",
        "pulse-ring": "pulseRing 2s infinite",
      },
      backdropBlur: { xs: "2px" },
      boxShadow: {
        "indigo-glow": "0 8px 32px rgba(99,102,241,0.25)",
        "amber-glow":  "0 8px 32px rgba(245,158,11,0.20)",
        "card-lift":   "0 4px 24px rgba(0,0,0,0.35)",
      },
    }
  },
  plugins: []
};
