import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated, loading: authLoading } = useAuth();

    const [formData, setFormData] = useState({
        nombreUsuario: '',
        contrasena: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Redirigir si ya está autenticado
    useEffect(() => {
        if (isAuthenticated && !authLoading) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, authLoading, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Limpiar error cuando el usuario empiece a escribir
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validaciones básicas
        if (!formData.nombreUsuario.trim()) {
            setError('El nombre de usuario es requerido');
            setLoading(false);
            return;
        }

        if (!formData.contrasena.trim()) {
            setError('La contraseña es requerida');
            setLoading(false);
            return;
        }

        try {
            const user = await login(formData.nombreUsuario, formData.contrasena);

            // Redirigir según el rol del usuario
            const userRole = user.rol || user.nombre_rol;
            if (userRole === 'Administrador') {
                navigate('/admin/dashboard', { replace: true });
            } else if (userRole === 'Docente' || userRole === 'Docente Titular' || userRole === 'Docente Suplente') {
                navigate('/docente/dashboard', { replace: true });
            } else if (userRole === 'Cocinera') {
                // Por ahora redirigir al admin, después crearemos la interfaz de cocinera
                alert('Interfaz de cocinera en desarrollo. Redirigiendo a administración...');
                navigate('/admin/dashboard', { replace: true });
            } else {
                // Usar el redireccionador automático
                navigate('/dashboard', { replace: true });
            }

        } catch (error) {
            console.error('Error en login:', error);
            setError(error.message || 'Usuario o contraseña incorrectos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="card login-card">
                <div className="card-header login-header text-center py-4">
                    <div className="login-logo">
                        <i className="fas fa-utensils"></i>
                    </div>
                    <h3 className="mb-0">Sistema de Comedor</h3>
                    <p className="mb-0 opacity-75">Inicia sesión para continuar</p>
                </div>

                <div className="card-body p-3">
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                {error}
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setError('')}
                                    aria-label="Close"
                                ></button>
                            </div>
                        )}

                        <div className="mb-2">
                            <label htmlFor="nombreUsuario" className="form-label fw-semibold">
                                <i className="fas fa-user me-2 text-primary"></i>
                                Nombre de Usuario
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                id="nombreUsuario"
                                name="nombreUsuario"
                                value={formData.nombreUsuario}
                                onChange={handleChange}
                                placeholder="Ingresa tu nombre de usuario"
                                disabled={loading}
                                autoComplete="username"
                                autoFocus
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="contrasena" className="form-label fw-semibold">
                                <i className="fas fa-lock me-2 text-primary"></i>
                                Contraseña
                            </label>
                            <input
                                type="password"
                                className="form-control"
                                id="contrasena"
                                name="contrasena"
                                value={formData.contrasena}
                                onChange={handleChange}
                                placeholder="Ingresa tu contraseña"
                                disabled={loading}
                                autoComplete="current-password"
                            />
                        </div>

                        <div className="d-grid">
                            <button
                                type="submit"
                                className="btn btn-primary btn-login"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Iniciando sesión...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-sign-in-alt me-2"></i>
                                        Iniciar Sesión
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="card-footer text-center py-2 bg-light">
                    <small className="text-muted">
                        <i className="fas fa-shield-alt me-1"></i>
                        Acceso seguro al sistema
                    </small>
                </div>
            </div>
        </div>
    );
};

export default Login;
