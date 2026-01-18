import axios from "axios";

// Función para obtener la URL base correcta
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const currentUrl = window.location.origin;

  // Si accedemos desde ngrok, usar ngrok como origen
  if (
    currentUrl.includes("ngrok-free.dev") ||
    currentUrl.includes("ngrok.io")
  ) {
    // ngrok redirige automáticamente al mismo dominio
    // Solo necesitamos agregar /api al final
    return `${currentUrl}/api`;
  }

  // Si viene del .env, validar que no sea una IP privada
  if (envUrl) {
    // Si el .env contiene localhost o 127.0.0.1, usarlo
    if (envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) {
      return envUrl;
    }
    // Si contiene ngrok, usarlo
    if (envUrl.includes("ngrok-free.dev") || envUrl.includes("ngrok.io")) {
      return envUrl;
    }
    // Si contiene una IP privada (192.168.x.x), redirigir a localhost
    if (envUrl.includes("192.168")) {
      return "http://localhost:3000/api";
    }
  }

  // Si accedemos desde una IP privada, siempre usar localhost
  if (currentUrl.includes("192.168")) {
    return "http://localhost:3000/api";
  }

  return envUrl || "http://localhost:3000/api";
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Interceptor para agregar token si existe en localStorage
axiosInstance.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // ignore
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
