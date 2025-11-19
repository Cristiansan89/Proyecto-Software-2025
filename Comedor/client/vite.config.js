import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost', // Solo localhost
    port: 5175, // Cambiar puerto para evitar conflictos
    strictPort: false, // Permitir puerto alternativo si es necesario
  }
})
