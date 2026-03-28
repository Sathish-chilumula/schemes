/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './lib/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50:'#eef2ff', 100:'#e0e7ff', 500:'#1B4FFF', 600:'#1640d6', 700:'#1232b0' },
      },
      fontFamily: { sans: ['Outfit', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
