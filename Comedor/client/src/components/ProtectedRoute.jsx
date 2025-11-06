import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({
    children,
    requiredRole = null,
    allowedRoles = null,
    requireAuth = true
}) => {
    const { isAuthenticated, user, loading } = useAuth();

    // Si no requiere autenticación, devolver los children directamente
    if (!requireAuth) {
        return children;
    }

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

    // Verificar rol específico si es requerido
    const userRole = user?.rol || user?.nombre_rol;
    if (requiredRole && userRole !== requiredRole) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger text-center">
                    <i className="fas fa-exclamation-triangle fa-2x mb-3"></i>
                    <h4>Acceso Denegado</h4>
                    <p>No tienes permisos para acceder a esta sección.</p>
                    <p>Tu rol actual: <strong>{userRole}</strong></p>
                    <p>Rol requerido: <strong>{requiredRole}</strong></p>
                </div>
            </div>
        );
    }

    // Verificar roles permitidos si se especifican
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger text-center">
                    <i className="fas fa-exclamation-triangle fa-2x mb-3"></i>
                    <h4>Acceso Denegado</h4>
                    <p>No tienes permisos para acceder a esta sección.</p>
                    <p>Tu rol actual: <strong>{userRole}</strong></p>
                    <p>Roles permitidos: <strong>{allowedRoles.join(', ')}</strong></p>
                </div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;