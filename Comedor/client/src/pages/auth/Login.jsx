import { useState } from 'react';

const Login = () => {
    const [formData, setFormData] = useState({
        nombreUsuario: '',
        contrasena: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
            // Aquí irá la lógica de autenticación con el backend
            console.log('Datos de login:', formData);

            // Simulación de petición (reemplazar con llamada real a la API)
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Por ahora solo mostramos en consola
            alert('Login exitoso (simulado)');

        } catch (error) {
            console.error('Error en login:', error);
            setError('Usuario o contraseña incorrectos');
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
