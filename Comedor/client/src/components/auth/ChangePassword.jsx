import { useState } from 'react';
import '../../styles/ChangePassword.css';

export function ChangePassword({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
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

    const validateForm = () => {
        if (!formData.currentPassword) {
            setMessage('Por favor ingrese su contraseña actual');
            setIsError(true);
            return false;
        }

        if (!formData.newPassword) {
            setMessage('Por favor ingrese una nueva contraseña');
            setIsError(true);
            return false;
        }

        if (formData.newPassword.length < 6) {
            setMessage('La nueva contraseña debe tener al menos 6 caracteres');
            setIsError(true);
            return false;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setMessage('Las contraseñas no coinciden');
            setIsError(true);
            return false;
        }

        if (formData.currentPassword === formData.newPassword) {
            setMessage('La nueva contraseña debe ser diferente a la actual');
            setIsError(true);
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setMessage('');
        setIsError(false);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Contraseña cambiada exitosamente');
                setIsError(false);
                setTimeout(() => {
                    onSuccess();
                }, 1500);
            } else {
                setMessage(data.message || 'Error al cambiar la contraseña');
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
        <div className="change-password-overlay">
            <div className="change-password-modal">
                <div className="change-password-header">
                    <h2>Cambiar Contraseña</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="change-password-form">
                    <div className="input-group">
                        <label htmlFor="currentPassword">Contraseña Actual</label>
                        <input
                            type="password"
                            id="currentPassword"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleInputChange}
                            placeholder="Ingrese su contraseña actual"
                            disabled={loading}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="newPassword">Nueva Contraseña</label>
                        <input
                            type="password"
                            id="newPassword"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            placeholder="Ingrese su nueva contraseña"
                            disabled={loading}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirmar Nueva Contraseña</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="Confirme su nueva contraseña"
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
                            {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="btn-custom btn-secondary"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}