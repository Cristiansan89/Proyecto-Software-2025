import axios from "axios";
import CacheService from "./cacheService";

// Función para obtener la URL base de la API (FORZADO A LOCALHOST)
const getApiBaseUrl = () => {
  // FORZAR SIEMPRE LOCALHOST CON PREFIJO /api
  const forceLocalhost = "http://localhost:3000/api";
  return forceLocalhost;
};

const API_URL = getApiBaseUrl();

// Crear instancia de axios
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000, // FORZAR 15 segundos
});

// Configurar axios para incluir el token en todas las peticiones
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejar errores de timeout y conexión específicamente para auth
    if (error.code === "ECONNABORTED" && error.message.includes("timeout")) {
    } else if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    } else if (error.response?.status >= 500) {
    }
    return Promise.reject(error);
  }
);

class AuthService {
  async login(credentials) {
    try {
      const response = await axiosInstance.post("/auth/login", credentials);
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Configurar el token para futuras peticiones
      axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Error al iniciar sesión",
      };
    }
  }

  logout() {
    // Limpiar localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Remover el header de autorización
    delete axiosInstance.defaults.headers.common["Authorization"];

    // Limpiar todo el cache del navegador
    CacheService.clearAllCache();
  }

  getCurrentUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken() {
    return localStorage.getItem("token");
  }

  isAuthenticated() {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  hasRole(requiredRole) {
    const user = this.getCurrentUser();
    return user?.rol === requiredRole;
  }

  isAdmin() {
    return this.hasRole("Administrador");
  }

  isDocente() {
    return (
      this.hasRole("Docente") ||
      this.hasRole("Docente Titular") ||
      this.hasRole("Docente Suplente")
    );
  }

  isCocinera() {
    return this.hasRole("Cocinera");
  }
}

export default new AuthService();
