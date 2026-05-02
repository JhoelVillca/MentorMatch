import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Intercepta todo lo que empiece con /api
      '/api': {
        target: 'http://127.0.0.1:8000', // El puerto de tu FastAPI
        changeOrigin: true,
        // FastAPI no tiene el prefijo /api en sus rutas
        rewrite: (path) => path.replace(/^\/api/, '') 
      }
    }
  }
})