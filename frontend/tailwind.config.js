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
        // Base
        background: '#F8FAFC',
        surface: '#FFFFFF',
        
        // Paleta Celeste
        celeste: {
          light: '#E0F2FE',
          DEFAULT: '#0EA5E9',
          dark: '#0284C7',
        },
        
        // Paleta Plomo
        plomo: {
          50: '#F1F5F9',
          100: '#E2E8F0',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          darkCanvas: '#141414',
          darkSurface: '#1E1E1E',
        },

        // Mapeo para evitar errores de compilación
        text: {
          main: '#0F172A',
          mainDark: '#F1F5F9',
        },
        
        // --- ESTO SOLUCIONA EL ERROR 'text-secondary' ---
        secondary: {
          DEFAULT: '#64748B', // Un tono gris/plomo estándar
        },
        primary: {
          DEFAULT: '#0EA5E9',
        }
      }
    },
  },
  plugins: [],
}