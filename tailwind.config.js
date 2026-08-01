/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        earth: {
          50: '#faf8f5',
          100: '#f5f1e8',
          200: '#e8dcc8',
          300: '#d4c3a3',
          400: '#bca57e',
          500: '#a38b61',
          600: '#8a7451',
          700: '#6f5d43',
          800: '#5a4b37',
          900: '#4a3d2e',
        }
      }
    },
  },
  plugins: [],
}

