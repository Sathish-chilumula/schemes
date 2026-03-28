/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './lib/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}', './hooks/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50:'#eef2ff', 100:'#e0e7ff', 200:'#c7d2fe', 300:'#a5b4fc', 400:'#818cf8', 500:'#1B4FFF', 600:'#1640d6', 700:'#1232b0', 800:'#3730a3', 900:'#312e81' },
      },
      fontFamily: { sans: ['Outfit', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
