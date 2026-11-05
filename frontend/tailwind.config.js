/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 50: '#f0f3f9', 100: '#d9e0ef', 200: '#b3c1df', 300: '#8da2cf', 400: '#6683bf', 500: '#4064af', 600: '#33508c', 700: '#263c69', 800: '#1a2846', 900: '#0f172a' },
        teal: { 50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a' },
      }
    },
  },
  plugins: [],
}
