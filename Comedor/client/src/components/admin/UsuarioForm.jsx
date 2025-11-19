import { useState } from 'react';
import usuarioService from '../../services/usuarioService';

const UsuarioForm = ({ usuario, mode, onCancel }) => {
    const [formData, setFormData] = useState({
        nombreUsuario: usuario ? usuario.nombreUsuario : '',
        mail: usuario ? usuario.mail : '',
        telefono: usuario ? usuario.telefono : '',
        password: '',
        confirmPassword: '',
        estado: usuario ? usuario.estado : 'Activo',
        rol: usuario ? usuario.rol : 'usuario',
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Manejar cambios en los campos del formulario
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Validación simple
        setErrors(prev => ({
            ...prev,
            [name]: value ? '' : 'Este campo es obligatorio'
        }));

        // Validación para email
        if (name === 'mail') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            setErrors(prev => ({
                ...prev,
                mail: emailRegex.test(value) ? '' : 'Email inválido'
            }));
        }

        // Validación para password y confirmPassword
        if (name === 'password' || name === 'confirmPassword') {
            setErrors(prev => ({
                ...prev,
                confirmPassword: formData.password === (name === 'confirmPassword' ? value : formData.confirmPassword)
                    ? ''
                    : 'Las contraseñas no coinciden'
            }));
        }
    }

    // Genera un nombre de usuario basado en nombre y apellido (seguro si faltan valores)
    const generateUsername = (nombre, apellido) => {
        const n = (nombre || '').trim().toLowerCase().replace(/\s+/g, '.');
        const a = (apellido || '').trim().toLowerCase().replace(/\s+/g, '.');
        if (!n && !a) return '';
        return a ? `${n}.${a}` : n;
    };

    // Validar formulario
    const validateForm = () => {
        const newErrors = {};
        if (!formData.nombreUsuario) newErrors.nombreUsuario = 'Este campo es obligatorio';
        if (!formData.mail) newErrors.mail = 'Este campo es obligatorio';

        // Solo validar confirmación si hay contraseña
        if (formData.password && formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };    // Manejar el envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            // Preparar datos para enviar
            const dataToSend = {
                nombreUsuario: formData.nombreUsuario,
                mail: formData.mail,
                telefono: formData.telefono,
                estado: formData.estado
            };

            // Solo incluir contraseña si se proporcionó
            if (formData.password) {
                dataToSend.contrasena = formData.password;
            }

            if (mode === 'edit' && usuario) {
                await usuarioService.update(usuario.idUsuario, dataToSend);
                alert('Usuario actualizado exitosamente');
            }

            onCancel(); // Cerrar el modal y recargar
        } catch (error) {
            console.error('Error al guardar el usuario:', error);
            alert('Error al guardar el usuario: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const isViewMode = mode === 'view';

    return (
        <div className="persona-form">
            <form onSubmit={handleSubmit}>
                <div className="form-sections">
                    {/* Información de la Cuenta de usuario */}
                    <div>
                        <h5>Información de la Cuenta de Usuario</h5>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="nombreUsuario" className="form-label required mt-3">
                                Nombre de Usuario
                            </label>
                            <input
                                type="text"
                                id="nombreUsuario"
                                name="nombreUsuario"
                                className={`form-control ${errors.nombreUsuario ? 'is-invalid' : ''}`}
                                value={formData.nombreUsuario || ''}
                                onChange={handleChange}
                                placeholder="Nombre de usuario único"
                                disabled={isViewMode}
                            />
                            {errors.nombreUsuario && (
                                <div className="invalid-feedback">{errors.nombreUsuario}</div>
                            )}
                            {!formData.nombreUsuario && formData.nombre && formData.apellido && (
                                <small className="form-text text-muted">
                                    <i className="fas fa-info-circle me-1"></i>
                                    El nombre de usuario se generará como: {generateUsername(formData.nombre, formData.apellido)}
                                </small>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="userEmail" className="form-label required mt-3">
                                Email de Usuario
                            </label>
                            <input
                                type="email"
                                id="userEmail"
                                name="mail"
                                className={`form-control ${errors.mail ? 'is-invalid' : ''}`}
                                value={formData.mail}
                                onChange={handleChange}
                                placeholder="Email para la cuenta de usuario"
                                disabled={isViewMode}
                            />
                            {errors.mail && (
                                <div className="invalid-feedback">{errors.mail}</div>
                            )}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="userTelefono" className="form-label required mt-3">
                                Teléfono de Usuario
                            </label>
                            <input
                                type="text"
                                id="userTelefono"
                                name="telefono"
                                className={`form-control ${errors.telefono ? 'is-invalid' : ''}`}
                                value={formData.telefono || ''}
                                onChange={handleChange}
                                placeholder="Teléfono para la cuenta de usuario"
                                disabled={isViewMode}
                            />
                            {errors.telefono && (
                                <div className="invalid-feedback">{errors.telefono}</div>
                            )}
                            <small className="form-text text-muted">
                                <i className="fas fa-info-circle me-1"></i>
                                La fecha de alta se establecerá automáticamente
                            </small>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="estadoUsuario" className="form-label mt-3">
                                Estado de Usuario
                            </label>
                            <select
                                id="estadoUsuario"
                                name="estado"
                                className="form-control"
                                value={formData.estado}
                                onChange={handleChange}
                                disabled={isViewMode}
                            >
                                <option value="Activo">Activo</option>
                                <option value="Inactivo">Inactivo</option>
                            </select>
                            <small className="form-text text-muted">
                                La fecha de última actividad se actualizará automáticamente
                            </small>
                        </div>
                    </div>

                    {!isViewMode && (
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="password" className="form-label mt-3">
                                    Nueva Contraseña (opcional)
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Dejar vacío para mantener actual"
                                />
                                {errors.password && (
                                    <div className="invalid-feedback">{errors.password}</div>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword" className="form-label mt-3">
                                    Confirmar Contraseña
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirme la contraseña"
                                />
                                {errors.confirmPassword && (
                                    <div className="invalid-feedback">{errors.confirmPassword}</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="form-actions mt-4">
                    <button
                        type="button"
                        className="btn btn-secondary me-2"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        <i className="fas fa-times"></i>
                        {isViewMode ? 'Cerrar' : 'Cancelar'}
                    </button>

                    {!isViewMode && (
                        <button
                            type="submit"
                            className="btn btn-primary me-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save"></i>
                                    Actualizar Usuario
                                </>
                            )}
                        </button>
                    )}
                </div>
            </form>
        </div >
    );
}

export default UsuarioForm;