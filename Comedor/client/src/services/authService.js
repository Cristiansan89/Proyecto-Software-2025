import axios from 'axios';

// Función para obtener la URL base de la API (FORZADO A LOCALHOST)
const getApiBaseUrl = () => {
    // FORZAR SIEMPRE LOCALHOST CON PREFIJO /api
    const forceLocalhost = 'http://localhost:3000/api';
    console.log('🔐 Auth - FORZANDO localhost (sin detección):', forceLocalhost);
    return forceLocalhost;
};

const API_URL = getApiBaseUrl();

// Crear instancia de axios
const axiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 15000, // FORZAR 15 segundos
});

console.log('🔐 Auth Service API URL:', API_URL);
console.log('🔍 VITE_API_TIMEOUT raw:', import.meta.env.VITE_API_TIMEOUT);
console.log('🔍 VITE_API_TIMEOUT converted:', Number(import.meta.env.VITE_API_TIMEOUT));
console.log('⏱️ Auth Service Timeout:', axiosInstance.defaults.timeout + 'ms');
console.log('🔗 Auth Service Base URL Final:', axiosInstance.defaults.baseURL);

// Configurar axios para incluir el token en todas las peticiones
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
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
        if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
            console.error('⏱️ Timeout en autenticación:', error.message);
            console.log('💡 El servidor de autenticación puede estar sobrecargado');
        } else if (error.response?.status === 401) {
            // Token expirado o inválido
            console.log('🔐 Token expirado o inválido, redirigiendo al login');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        } else if (error.response?.status >= 500) {
            console.error('🔥 Error interno del servidor de autenticación:', error.response.data?.message);
        }
        return Promise.reject(error);
    }
);

class AuthService {
    async login(credentials) {
        try {
            const response = await axiosInstance.post('/auth/login', credentials);
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            // Configurar el token para futuras peticiones
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error en login:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Error al iniciar sesión'
            };
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axiosInstance.defaults.headers.common['Authorization'];
    }

    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    getToken() {
        return localStorage.getItem('token');
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
        return this.hasRole('Administrador');
    }

    isDocente() {
        return this.hasRole('Docente') || this.hasRole('Docente Titular') || this.hasRole('Docente Suplente');
    }

    isCocinera() {
        return this.hasRole('Cocinera');
    }
}

export default new AuthService();
