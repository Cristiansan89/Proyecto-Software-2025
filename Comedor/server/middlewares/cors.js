import cors from "cors";

export const corsMiddleware = () =>
  cors({
    origin: (origin, callback) => {
      // Normalizar la variable de entorno en tiempo de ejecución
      const frontendUrl = process.env.FRONTEND_URL?.trim().replace(/\/$/, "");

      const ACCEPTED_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://localhost:5178",
        "http://localhost:5179",
        "http://192.168.100.10:3000",
        "http://192.168.100.10:5173",
        "https://frontend-production-72dd.up.railway.app", // 👈 Tu frontend en Railway
        frontendUrl,
      ].filter(Boolean);

      // 1. Peticiones servidor-a-servidor, cURL, Postman o Cron Jobs
      if (!origin) return callback(null, true);

      // 2. Lista blanca exacta
      if (ACCEPTED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      // 3. Entornos de desarrollo locales / Túneles
      if (
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin.match(/^http:\/\/192\.168\.\d+\.\d+:\d+$/) ||
        origin.endsWith(".loca.lt") ||
        origin.includes(".ngrok-free.dev")
      ) {
        return callback(null, true);
      }

      // Si no coincide con nada, rechazar limpiamente
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Accept",
      "Accept-Language",
      "Content-Type",
      "Authorization",
      "x-access-token",
      "Cache-Control",
      "Pragma",
    ],
    optionsSuccessStatus: 204, // 204 No Content es el estándar moderno para OPTIONS
  });
