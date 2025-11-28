import axios from "axios"

// Función para obtener la URL base de la API (FORZADO A LOCALHOST)
const getApiBaseUrl = () => {
    // FORZAR SIEMPRE LOCALHOST CON PREFIJO /api
    const forceLocalhost = 'http://localhost:3000/api';
    return forceLocalhost;
};

// Usa la URL del backend detectada automáticamente con prefijo /api
const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000, // 15 segundos
    headers: {
        'Content-Type': 'application/json',
    }
});

// Log de la URL para debugging

// Interceptor para agregar el token JWT si existe (opcional)
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token")
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Interceptor para manejar errores de red
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Manejar diferentes tipos de errores
        if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
        } else if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        } else if (error.response) {
            // El servidor respondió con un código de estado fuera del rango 2xx
        } else if (error.request) {
            // La petición fue hecha pero no se recibió respuesta
        } else {
        }

        return Promise.reject(error);
    }
);

export default api
