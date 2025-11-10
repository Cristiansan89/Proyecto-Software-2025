import axios from "axios"

// Función para detectar la URL base correcta
const getApiBaseUrl = () => {
    // Si estamos en desarrollo y tenemos VITE_API_URL definida
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    // Detectar automáticamente la URL base según el host actual
    const currentHost = window.location.hostname;
    const currentProtocol = window.location.protocol;

    // Si estamos en localhost, usar localhost para el API
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        return `${currentProtocol}//localhost:3000`;
    }

    // Si estamos en una IP de red local, usar la misma IP para el API
    return `${currentProtocol}//${currentHost}:3000`;
};

// Usa la URL del backend detectada automáticamente con prefijo /api
const API = axios.create({
    baseURL: `${getApiBaseUrl()}/api`,
    timeout: import.meta.env.VITE_API_TIMEOUT || 5000,
    headers: {
        "Content-Type": "application/json",
    },
})

// Log de la URL para debugging
console.log('🔗 API Base URL:', API.defaults.baseURL);

// Interceptor para agregar el token JWT si existe (opcional)
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token")
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Interceptor para manejar errores de red
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
            console.error('❌ Error de conexión con el servidor:', API.defaults.baseURL);
            console.log('💡 Verifica que el servidor backend esté corriendo');
        }
        return Promise.reject(error);
    }
);

export default API
