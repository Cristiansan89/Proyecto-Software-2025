import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permite acceso desde la red local
    port: 5173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.loca.lt',  // Permite todos los subdominios de localtunnel
      'comedor-frontend-2025.loca.lt', // Específico para nuestro túnel
      'comedor-backend-2025.loca.lt'
    ]
  }
})
