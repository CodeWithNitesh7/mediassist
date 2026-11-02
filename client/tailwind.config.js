/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
      colors: {
        ink: '#12302F',
        paper: '#F4F8F7',
        brand: { 50: '#E3F2F0', 100: '#C9E7E3', 500: '#0E7C7B', 600: '#0B6665', 700: '#095250' },
        alert: '#B8420F',
      },
    },
  },
  plugins: [],
};
