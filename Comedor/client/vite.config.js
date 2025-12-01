import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Escuchar en todas las interfaces
    port: 5175,
    strictPort: false,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "spleeny-slouchily-brenda.ngrok-free.dev",
    ],
    // Proxy para las solicitudes de API
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
});
