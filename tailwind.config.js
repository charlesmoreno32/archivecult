/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        surface: "#0a0a0a",
        border: "#1a1a1a",
        skaterGreen: "#4A7C59",
      },
      fontFamily: {
        mono: ["Courier New", "Courier", "monospace"],
      },
    },
  },
  plugins: [],
};
