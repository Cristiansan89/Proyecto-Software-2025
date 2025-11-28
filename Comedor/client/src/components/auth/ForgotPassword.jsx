import { useState } from 'react';
import '../../styles/ForgotPassword.css';

export function ForgotPassword({ onBack }) {
    const [formData, setFormData] = useState({
        nombreUsuario: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Limpiar mensaje cuando el usuario empiece a escribir
        if (message) {
            setMessage('');
            setIsError(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.nombreUsuario.trim()) {
            setMessage('Por favor ingrese su nombre de usuario');
            setIsError(true);
            return;
        }

        setLoading(true);
        setMessage('');
        setIsError(false);

        try {
            const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nombreUsuario: formData.nombreUsuario.trim()
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Se ha enviado una nueva contraseña a su correo electrónico. Por favor revise su bandeja de entrada.');
                setIsError(false);
                setFormData({ nombreUsuario: '' });
            } else {
                setMessage(data.message || 'Error al procesar la solicitud');
                setIsError(true);
            }
        } catch (error) {
            setMessage('Error de conexión. Por favor intente nuevamente.');
            setIsError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-password">
            <div className="forgot-password-container">
                <div className="forgot-password-header">
                    <h2>Recuperar Contraseña</h2>
                    <p>Ingrese su nombre de usuario y le enviaremos una nueva contraseña a su correo electrónico</p>
                </div>

                <form onSubmit={handleSubmit} className="forgot-password-form">
                    <div className="input-group">
                        <label htmlFor="nombreUsuario">Nombre de Usuario</label>
                        <input
                            type="text"
                            id="nombreUsuario"
                            name="nombreUsuario"
                            value={formData.nombreUsuario}
                            onChange={handleInputChange}
                            placeholder="Ingrese su nombre de usuario"
                            disabled={loading}
                        />
                    </div>

                    {message && (
                        <div className={`message ${isError ? 'error' : 'success'}`}>
                            {message}
                        </div>
                    )}

                    <div className="form-actions">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-custom btn-primary"
                        >
                            {loading ? 'Enviando...' : 'Enviar Nueva Contraseña'}
                        </button>

                        <button
                            type="button"
                            onClick={onBack}
                            disabled={loading}
                            className="btn-custom btn-secondary"
                        >
                            Volver al Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}