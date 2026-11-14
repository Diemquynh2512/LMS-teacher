/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FAF7F2',
        beige: '#F2EBE1',
        sand: '#E4D8C8',
        terracotta: '#B85D3B',
        terracottaDark: '#9A4A2D',
        espresso: '#3B2F2F',
        cocoa: '#6E5D55',
      }
    },
  },
  plugins: [],
}
