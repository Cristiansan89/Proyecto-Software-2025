import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
    const { isAuthenticated, user, loading } = useAuth();

    // Mostrar loading mientras se verifica la autenticación
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-2">Verificando autenticación...</p>
                </div>
            </div>
        );
    }

    // Redirigir al login si no está autenticado
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Verificar rol si es requerido
    if (requiredRole && user?.rol !== requiredRole) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger text-center">
                    <i className="fas fa-exclamation-triangle fa-2x mb-3"></i>
                    <h4>Acceso Denegado</h4>
                    <p>No tienes permisos para acceder a esta sección.</p>
                    <p>Tu rol actual: <strong>{user?.rol}</strong></p>
                    <p>Rol requerido: <strong>{requiredRole}</strong></p>
                </div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;