/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f0ff',
          100: '#e0e0ff',
          500: '#5D5CDE',
          600: '#4c4bc7',
          700: '#3d3ca8',
        }
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}