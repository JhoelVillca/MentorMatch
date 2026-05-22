/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        surface: '#FFFFFF',
        primary: {
          DEFAULT: '#2563EB',
          corporate: '#0058be',
        },
        secondary: {
          DEFAULT: '#0F172A',
          slate: '#64748B',
          slateDark: '#475569',
        }
      }
    },
  },
  plugins: [],
}