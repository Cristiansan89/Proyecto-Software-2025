import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Escuchar en todas las interfaces
    port: 5175,
    strictPort: false,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      // "spleeny-slouchily-brenda.ngrok-free.dev",
      //"vincent-intercalary-unhealthily.ngrok-free.dev",
      //"gift-emission-hurled.ngrok-free.dev",
      //"lushly-tabby-craftwork.ngrok-free.dev",
    ],
    // Headers para evitar caché a través de ngrok
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
    // Proxy para las solicitudes de API
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
    },
  },
  // Build optimizations para evitar problemas de caché en producción
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "index-[hash].js",
        chunkFileNames: "chunk-[hash].js",
        assetFileNames: "asset-[hash][extname]",
      },
    },
  },
});
