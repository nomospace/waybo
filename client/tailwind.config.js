/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  darkMode: 'media',
  theme: {
    extend: {
      colors: { primary: '#E53935' }
    },
  },
  plugins: [],
}