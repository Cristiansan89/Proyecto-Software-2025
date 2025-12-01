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

  // Por defecto, usar el mismo origen + /api
  const apiUrl = currentUrl.replace(/\/$/, "") + "/api";
  console.log("📡 Using default API URL:", apiUrl);
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

// Interceptor para manejar errores de red
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejar diferentes tipos de errores
    if (error.code === "ECONNABORTED" && error.message.includes("timeout")) {
    } else if (
      error.code === "NETWORK_ERROR" ||
      error.message === "Network Error"
    ) {
    } else if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
    } else {
    }

    return Promise.reject(error);
  }
);

export default api;
