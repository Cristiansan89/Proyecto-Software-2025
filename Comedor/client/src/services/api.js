import axios from "axios";

// Función para obtener la URL base de la API
const getApiBaseUrl = () => {
  const currentUrl = window.location.origin;
  console.log("🔍 Current window origin:", currentUrl);

  // Si estamos en ngrok HTTPS, usar la URL completa de ngrok
  if (currentUrl.includes("ngrok-free.dev")) {
    const apiUrl = currentUrl + "/api";
    console.log("🌐 Using ngrok API URL:", apiUrl);
    return apiUrl;
  }

  // Si estamos en localhost HTTP, usar localhost:3000
  if (currentUrl.includes("localhost") || currentUrl.includes("127.0.0.1")) {
    const apiUrl = "http://localhost:3000/api";
    console.log("🏠 Using Localhost API URL:", apiUrl);
    return apiUrl;
  }

  // En desarrollo (192.168.x.x), usar localhost:3000
  if (currentUrl.includes("192.168") || currentUrl.includes("192.168.100.10")) {
    const apiUrl = "http://localhost:3000/api";
    console.log("🖥️ Using Localhost API URL (from IP access):", apiUrl);
    return apiUrl;
  }

  // Por defecto, usar localhost:3000/api
  const apiUrl = "http://localhost:3000/api";
  console.log("📡 Using default Localhost API URL:", apiUrl);
  return apiUrl;
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
    config.headers.Authorization = `Bearer ${token}`;
  }
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
        error.response?.data?.message
      );
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      console.error("📭 Sin respuesta del servidor");
    } else {
      console.error("❌ Error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
