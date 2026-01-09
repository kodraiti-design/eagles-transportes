/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        eagles: {
          dark: '#1a1f2c',
          gold: '#d4af37',
          light: '#f7fafc',
          accent: '#c0a02e'
        }
      }
    },
  },
  plugins: [],
}
