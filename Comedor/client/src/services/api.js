import axios from "axios";

// Función para obtener la URL base de la API
const getApiBaseUrl = () => {
  const currentUrl = window.location.origin;
  console.log("🔍 Current window origin:", currentUrl);

  // 1. Si está definida explícitamente en variables de entorno de Vite
  if (import.meta.env.VITE_API_URL) {
    console.log("🚀 Using Environment API URL:", import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }

  // 2. Respaldo directo si el frontend se ejecuta en Railway
  if (currentUrl.includes("railway.app")) {
    const railwayBackend = "https://backend-production-ee0c.up.railway.app/api";
    console.log("🚂 Using Railway Fallback Backend URL:", railwayBackend);
    return railwayBackend;
  }

  // 3. Si estamos en ngrok
  if (currentUrl.includes("ngrok-free.dev")) {
    const apiUrl = currentUrl + "/api";
    console.log("🌐 Using ngrok API URL:", apiUrl);
    return apiUrl;
  }

  // 4. Si estamos en localhost HTTP o 127.0.0.1
  if (currentUrl.includes("localhost") || currentUrl.includes("127.0.0.1")) {
    const apiUrl = `${window.location.protocol}//${window.location.hostname}:3000/api`;
    console.log("🏠 Using Localhost API URL:", apiUrl);
    return apiUrl;
  }

  // 5. En desarrollo red local (192.168.x.x)
  if (currentUrl.includes("192.168")) {
    const hostname = window.location.hostname;
    const apiUrl = `http://${hostname}:3000/api`;
    console.log("🖥️ Using Network IP API URL:", apiUrl);
    return apiUrl;
  }

  // Respaldo final de seguridad
  return "https://backend-production-ee0c.up.railway.app/api";
};

// Usa la URL del backend detectada automáticamente con prefijo /api
const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos para operaciones de lote más grandes
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar el token JWT si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    console.log("🔐 Token encontrado, enviando con solicitud");
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.log("⚠️ No hay token en localStorage, enviando sin autenticación");
  }

  return config;
});

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejar error 401 (Unauthorized - Token expirado)
    if (error.response?.status === 401) {
      const isPublicTokenRoute =
        window.location.pathname.includes("/confirmacion") ||
        window.location.pathname.includes("/asistencia") ||
        window.location.pathname.includes("/registro");

      if (!isPublicTokenRoute) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userRole");
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 403) {
      console.error("❌ Acceso denegado (403):", error.response?.data?.message);
      return Promise.reject(error);
    }

    if (error.code === "ECONNABORTED" && error.message.includes("timeout")) {
      console.error("⏱️ Timeout de conexión (superó los 30s)");
    } else if (
      error.code === "ERR_NETWORK" ||
      error.message === "Network Error"
    ) {
      console.error("🌐 Error de red o bloqueo de CORS");
    } else if (error.response) {
      console.error(
        `📡 Error del servidor (${error.response.status}):`,
        error.response?.data?.message,
      );
    } else if (error.request) {
      console.error("📭 Sin respuesta del servidor");
    } else {
      console.error("❌ Error:", error.message);
    }

    return Promise.reject(error);
  },
);

export default api;
