import React, { useState, useEffect } from 'react';

const RolForm = ({ rol, onSave, onCancel, mode = 'create' }) => {
    const [formData, setFormData] = useState({
        nombreRol: '',
        descripcionRol: '',
        habilitaCuentaUsuario: 'No',
        estado: 'Activo'
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (rol && mode !== 'create') {
            setFormData({
                nombreRol: rol.nombreRol || '',
                descripcionRol: rol.descripcionRol || '',
                habilitaCuentaUsuario: rol.habilitaCuentaUsuario || 'No',
                estado: rol.estado || 'Activo'
            });
        }
    }, [rol, mode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Limpiar error del campo si existía
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.nombreRol.trim()) {
            newErrors.nombreRol = 'El nombre del rol es requerido';
        } else if (formData.nombreRol.length > 100) {
            newErrors.nombreRol = 'El nombre del rol no puede tener más de 100 caracteres';
        }

        if (!formData.descripcionRol.trim()) {
            newErrors.descripcionRol = 'La descripción del rol es requerida';
        } else if (formData.descripcionRol.length > 100) {
            newErrors.descripcionRol = 'La descripción del rol no puede tener más de 100 caracteres';
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }

        try {
            const dataToSend = {
                ...formData,
                idRol: rol?.idRol // Incluir ID solo si estamos editando
            };

            await onSave(dataToSend);
        } catch (error) {
            console.error('Error al guardar rol:', error);
        }
    };

    const isReadOnly = mode === 'view';

    return (
        <form onSubmit={handleSubmit} className="rol-form">
            <div className="form-grid">
                <div className="form-group">
                    <label htmlFor="nombreRol" className="form-label">
                        Nombre del Rol *
                    </label>
                    <input
                        type="text"
                        id="nombreRol"
                        name="nombreRol"
                        value={formData.nombreRol}
                        onChange={handleChange}
                        className={`form-input ${errors.nombreRol ? 'error' : ''}`}
                        placeholder="Ej: Administrador, Cocinero, Nutricionista"
                        maxLength={100}
                        readOnly={isReadOnly}
                        required
                    />
                    {errors.nombreRol && (
                        <span className="error-message">{errors.nombreRol}</span>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="descripcionRol" className="form-label">
                        Descripción del Rol *
                    </label>
                    <textarea
                        id="descripcionRol"
                        name="descripcionRol"
                        value={formData.descripcionRol}
                        onChange={handleChange}
                        className={`form-textarea ${errors.descripcionRol ? 'error' : ''}`}
                        placeholder="Descripción detallada del rol y sus responsabilidades..."
                        rows={3}
                        maxLength={100}
                        readOnly={isReadOnly}
                        required
                    />
                    {errors.descripcionRol && (
                        <span className="error-message">{errors.descripcionRol}</span>
                    )}
                    <small className="form-help">
                        {formData.descripcionRol.length}/100 caracteres
                    </small>
                </div>

                <div className="form-group">
                    <label htmlFor="habilitaCuentaUsuario" className="form-label">
                        ¿Habilita Cuenta de Usuario?
                    </label>
                    <select
                        id="habilitaCuentaUsuario"
                        name="habilitaCuentaUsuario"
                        value={formData.habilitaCuentaUsuario}
                        onChange={handleChange}
                        className="form-select"
                        disabled={isReadOnly}
                    >
                        <option value="No">No</option>
                        <option value="Si">Sí</option>
                    </select>
                    <small className="form-help">
                        Determina si las personas con este rol pueden tener cuenta de usuario en el sistema
                    </small>
                </div>

                {mode !== 'create' && (
                    <div className="form-group">
                        <label htmlFor="estado" className="form-label">
                            Estado
                        </label>
                        <select
                            id="estado"
                            name="estado"
                            value={formData.estado}
                            onChange={handleChange}
                            className="form-select"
                            disabled={isReadOnly}
                        >
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Información adicional para modo vista */}
            {isReadOnly && rol && (
                <div className="info-section">
                    <h4>Información del Rol</h4>
                    <div className="info-grid">
                        <div className="info-item">
                            <label>ID del Rol:</label>
                            <span>{rol.idRol}</span>
                        </div>
                        <div className="info-item">
                            <label>Estado:</label>
                            <span className={`status-badge ${rol.estado?.toLowerCase()}`}>
                                {rol.estado}
                            </span>
                        </div>
                        <div className="info-item">
                            <label>Habilita Cuenta:</label>
                            <span className={`badge ${rol.habilitaCuentaUsuario === 'Si' ? 'badge-success' : 'badge-secondary'}`}>
                                {rol.habilitaCuentaUsuario}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {!isReadOnly && (
                <div className="form-actions">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="btn btn-secondary"
                    >
                        <i className="fas fa-times mr-1"></i>
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                    >
                        <i className="fas fa-save mr-1"></i>
                        {mode === 'create' ? 'Crear Rol' : 'Actualizar Rol'}
                    </button>
                </div>
            )}

            {isReadOnly && (
                <div className="form-actions">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="btn btn-secondary"
                    >
                        <i className="fas fa-times mr-1"></i>
                        Cerrar
                    </button>
                </div>
            )}
        </form>
    );
};

export default RolForm;