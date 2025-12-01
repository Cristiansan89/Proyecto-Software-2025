import cors from "cors";

export const corsMiddleware = () =>
  cors({
    origin: (origin, callback) => {
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
        "http://192.168.100.10:5174",
        "http://192.168.100.10:5175",
        "http://192.168.100.10:5176",
        "http://192.168.100.10:5177",
        "http://192.168.100.10:5178",
        "http://192.168.100.10:5179",
      ];

      // Permitir requests sin origin (como desde Postman o curl)
      if (!origin) return callback(null, true);

      // Permitir dominios específicos
      if (ACCEPTED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      // Permitir cualquier localhost en desarrollo
      if (
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:")
      ) {
        return callback(null, true);
      }

      // Permitir cualquier IP local en desarrollo
      if (origin.match(/^http:\/\/192\.168\.\d+\.\d+:\d+$/)) {
        return callback(null, true);
      }

      // Permitir túneles localtunnel (.loca.lt)
      if (origin.endsWith(".loca.lt")) {
        return callback(null, true);
      }

      // Permitir túneles ngrok (.ngrok-free.dev)
      if (origin.includes(".ngrok-free.dev")) {
        return callback(null, true);
      }

      callback(new Error("No permitido por CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-access-token"],
  });
