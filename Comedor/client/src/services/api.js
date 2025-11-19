import axios from "axios"

// Función para obtener la URL base de la API (FORZADO A LOCALHOST)
const getApiBaseUrl = () => {
    // FORZAR SIEMPRE LOCALHOST CON PREFIJO /api
    const forceLocalhost = 'http://localhost:3000/api';
    console.log('🌐 FORZANDO localhost (sin detección):', forceLocalhost);
    return forceLocalhost;
};

// Usa la URL del backend detectada automáticamente con prefijo /api
const API_BASE_URL = getApiBaseUrl();
console.log('🔗 API_BASE_URL configurada:', API_BASE_URL);

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000, // 15 segundos
    headers: {
        'Content-Type': 'application/json',
    }
});

// Log de la URL para debugging
console.log('🔗 API Base URL:', api.defaults.baseURL);
console.log('⏱️ API Timeout:', api.defaults.timeout + 'ms');

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
            console.error('⏱️ Timeout de conexión:', error.message);
            console.log('💡 El servidor puede estar sobrecargado o no disponible');
            console.log('🔄 Verifica que el servidor backend esté corriendo en:', api.defaults.baseURL.replace('/api', ''));
        } else if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
            console.error('❌ Error de red:', api.defaults.baseURL);
            console.log('💡 Verifica que el servidor backend esté corriendo');
            console.log('🌐 Asegúrate de que no haya problemas de firewall');
        } else if (error.response) {
            // El servidor respondió con un código de estado fuera del rango 2xx
            console.error(`❌ Error del servidor (${error.response.status}):`, error.response.data?.message || 'Error desconocido');
        } else if (error.request) {
            // La petición fue hecha pero no se recibió respuesta
            console.error('📡 No se recibió respuesta del servidor:', error.request);
            console.log('🔄 Verifica que el servidor esté accesible en:', api.defaults.baseURL);
        } else {
            console.error('⚠️ Error configurando la petición:', error.message);
        }

        return Promise.reject(error);
    }
);

export default api
