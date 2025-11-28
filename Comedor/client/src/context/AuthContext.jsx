import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Verificar autenticación al cargar la aplicación
    useEffect(() => {
        const checkAuth = () => {
            try {
                const currentUser = authService.getCurrentUser();
                const token = authService.getToken();

                if (currentUser && token) {
                    setUser(currentUser);
                    setIsAuthenticated(true);
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } catch (error) {
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (nombreUsuario, contrasena) => {
        const result = await authService.login({ nombreUsuario, contrasena });
        if (result.success) {
            const userData = authService.getCurrentUser();
            setUser(userData);
            setIsAuthenticated(true);
            return userData;
        } else {
            throw new Error(result.error);
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    const hasRole = (role) => {
        return user?.rol === role || user?.nombre_rol === role;
    };

    const isAdmin = () => {
        return hasRole('Administrador');
    };

    const isDocente = () => {
        return hasRole('Docente') || hasRole('Docente Titular') || hasRole('Docente Suplente');
    };

    const isCocinera = () => {
        return hasRole('Cocinera');
    };

    const value = {
        user,
        login,
        logout,
        loading,
        isAuthenticated,
        hasRole,
        isAdmin,
        isDocente,
        isCocinera
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
