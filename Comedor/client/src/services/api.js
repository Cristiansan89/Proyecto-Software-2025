import axios from "axios";

// Función para obtener la URL base de la API
const getApiBaseUrl = () => {
  const currentUrl = window.location.origin;
  console.log("🔍 Current window origin:", currentUrl);

  // 1. Si estamos en producción (Railway), usar la variable de entorno de Vite
  if (import.meta.env.VITE_API_URL) {
    console.log("🚀 Using Environment API URL:", import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }

  // 2. Si estamos en ngrok HTTPS, usar la URL completa de ngrok
  if (currentUrl.includes("ngrok-free.dev")) {
    const apiUrl = currentUrl + "/api";
    console.log("🌐 Using ngrok API URL:", apiUrl);
    return apiUrl;
  }

  // 3. Si estamos en localhost HTTP, usar localhost:3000
  if (currentUrl.includes("localhost") || currentUrl.includes("127.0.0.1")) {
    const apiUrl = "http://localhost:3000/api";
    console.log("🏠 Using Localhost API URL:", apiUrl);
    return apiUrl;
  }

  // 4. En desarrollo (192.168.x.x), usar localhost:3000
  if (currentUrl.includes("192.168")) {
    const apiUrl = "http://localhost:3000/api";
    console.log("🖥️ Using Localhost API URL (from IP access):", apiUrl);
    return apiUrl;
  }

  // Por defecto de respaldo
  return "http://localhost:3000/api";
};

// Usa la URL del backend detectada automáticamente con prefijo /api
const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 segundos
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar el token JWT si existe (opcional)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    console.log("🔐 Token encontrado, enviando con solicitud");
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.log("⚠️ No hay token en localStorage, enviando sin autenticación");
  }
  console.log("📤 Headers de solicitud:", config.headers);
  return config;
});

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejar error 401 (Unauthorized - Token expirado)
    if (error.response?.status === 401) {
      // Limpiar localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userRole");

      // Redirigir a login
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // Manejar error 403 (Forbidden)
    if (error.response?.status === 403) {
      console.error("❌ Acceso denegado (403):", error.response?.data?.message);
      return Promise.reject(error);
    }

    // Manejar diferentes tipos de errores de conexión
    if (error.code === "ECONNABORTED" && error.message.includes("timeout")) {
      console.error("⏱️ Timeout de conexión");
    } else if (
      error.code === "NETWORK_ERROR" ||
      error.message === "Network Error"
    ) {
      console.error("🌐 Error de red");
    } else if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error(
        `📡 Error del servidor (${error.response.status}):`,
        error.response?.data?.message,
      );
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      console.error("📭 Sin respuesta del servidor");
    } else {
      console.error("❌ Error:", error.message);
    }

    return Promise.reject(error);
  },
);

export default api;
