import axios from 'axios';

const API_URL = 'http://localhost:3000';

// Crear instancia de axios
const axiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 10000,
});

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
