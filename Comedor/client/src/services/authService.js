import axios from 'axios';

// Función para detectar la URL base correcta (igual que en api.js)
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

const API_URL = `${getApiBaseUrl()}/api`;

// Crear instancia de axios
const axiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 10000,
});

console.log('🔐 Auth Service API URL:', API_URL);

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
        if (error.response?.status === 401) {
            // Token expirado o inválido
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
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
