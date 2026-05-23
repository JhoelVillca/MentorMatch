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
        // Fondos principales adaptados al diseño Celeste Plomo
        background: '#F8FAFC',
        surface: '#FFFFFF',
        
        // Paleta Celeste (Acentos principales)
        celeste: {
          light: '#E0F2FE',  // Celeste claro para fondos suaves o estados hover claro
          DEFAULT: '#0EA5E9', // Celeste corporativo brillante
          dark: '#0284C7',    // Celeste oscuro para estados activos/botones hover
        },
        
        // Paleta Plomo / Asfalto (Especialmente para superficies y textos en modo oscuro)
        plomo: {
          50: '#F1F5F9',
          100: '#E2E8F0',
          700: '#334155',     // Plomo corporativo oscuro para texto secundario
          800: '#1E293B',     // Plomo oscuro profundo
          900: '#0F172A',     // Plomo casi negro para textos principales claros
          darkCanvas: '#141414', // Fondo base inmutable para el modo oscuro solicitado
          darkSurface: '#1E1E1E', // Tarjetas y superficies en modo oscuro
        },

        // Mantenemos tus alias anteriores por retrocompatibilidad para que no se rompa nada existente
        primary: {
          DEFAULT: '#0EA5E9', // Ahora apunta a tu celeste estrella
          corporate: '#0284C7',
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