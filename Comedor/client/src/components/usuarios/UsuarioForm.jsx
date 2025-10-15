import React, { useState, useEffect } from 'react';

const UsuarioForm = ({ usuario, onSave, onCancel, mode = 'create' }) => {
    const [formData, setFormData] = useState({
        nombreUsuario: '',
        email: '',
        contrasena: '',
        confirmarContrasena: '',
        telefono: '',
        rol: '',
        estado: 'Activo'
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Lista de roles disponibles (esto vendría de una API en producción)
    const roles = [
        { id: 1, nombre: 'Administrador' },
        { id: 2, nombre: 'Cocinero' },
        { id: 3, nombre: 'Nutricionista' },
        { id: 4, nombre: 'Supervisor' }
    ];

    useEffect(() => {
        if (usuario && mode === 'edit') {
            setFormData({
                ...usuario,
                contrasena: '',
                confirmarContrasena: ''
            });
        }
    }, [usuario, mode]);

    const validateForm = () => {
        const newErrors = {};

        // Validar nombre de usuario
        if (!formData.nombreUsuario.trim()) {
            newErrors.nombreUsuario = 'El nombre de usuario es requerido';
        } else if (formData.nombreUsuario.length < 3) {
            newErrors.nombreUsuario = 'El nombre de usuario debe tener al menos 3 caracteres';
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = 'El email es requerido';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Formato de email inválido';
        }

        // Validar contraseña (solo en crear o si se está cambiando)
        if (mode === 'create' || formData.contrasena) {
            if (!formData.contrasena) {
                newErrors.contrasena = 'La contraseña es requerida';
            } else if (formData.contrasena.length < 6) {
                newErrors.contrasena = 'La contraseña debe tener al menos 6 caracteres';
            }

            if (formData.contrasena !== formData.confirmarContrasena) {
                newErrors.confirmarContrasena = 'Las contraseñas no coinciden';
            }
        }

        // Validar teléfono
        if (!formData.telefono.trim()) {
            newErrors.telefono = 'El teléfono es requerido';
        } else if (!/^\d{8,15}$/.test(formData.telefono.replace(/\s/g, ''))) {
            newErrors.telefono = 'El teléfono debe tener entre 8 y 15 dígitos';
        }

        // Validar rol
        if (!formData.rol) {
            newErrors.rol = 'El rol es requerido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Limpiar error del campo cuando el usuario comience a escribir
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            const usuarioData = {
                ...formData,
                id: usuario?.id || Date.now(),
                fechaRegistro: usuario?.fechaRegistro || new Date().toISOString().split('T')[0]
            };

            // No enviar contraseña vacía en modo edición
            if (mode === 'edit' && !usuarioData.contrasena) {
                delete usuarioData.contrasena;
                delete usuarioData.confirmarContrasena;
            }

            onSave(usuarioData);
        }
    };

    const getRolNombre = (rolId) => {
        const rol = roles.find(r => r.id === parseInt(rolId));
        return rol ? rol.nombre : '';
    };

    return (
        <div className="usuario-form">
            <form onSubmit={handleSubmit}>
                <div className="row">
                    {/* Nombre de Usuario */}
                    <div className="col-md-6 mb-3">
                        <label htmlFor="nombreUsuario" className="form-label">
                            <i className="fas fa-user me-2"></i>
                            Nombre de Usuario *
                        </label>
                        <input
                            type="text"
                            className={`form-control ${errors.nombreUsuario ? 'is-invalid' : ''}`}
                            id="nombreUsuario"
                            name="nombreUsuario"
                            value={formData.nombreUsuario}
                            onChange={handleInputChange}
                            placeholder="Ingrese el nombre de usuario"
                        />
                        {errors.nombreUsuario && (
                            <div className="invalid-feedback">{errors.nombreUsuario}</div>
                        )}
                    </div>

                    {/* Email */}
                    <div className="col-md-6 mb-3">
                        <label htmlFor="email" className="form-label">
                            <i className="fas fa-envelope me-2"></i>
                            Email *
                        </label>
                        <input
                            type="email"
                            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="ejemplo@correo.com"
                        />
                        {errors.email && (
                            <div className="invalid-feedback">{errors.email}</div>
                        )}
                    </div>
                </div>

                <div className="row">
                    {/* Contraseña */}
                    <div className="col-md-6 mb-3">
                        <label htmlFor="contrasena" className="form-label">
                            <i className="fas fa-lock me-2"></i>
                            {mode === 'create' ? 'Contraseña *' : 'Nueva Contraseña (opcional)'}
                        </label>
                        <div className="input-group">
                            <input
                                type={showPassword ? "text" : "password"}
                                className={`form-control ${errors.contrasena ? 'is-invalid' : ''}`}
                                id="contrasena"
                                name="contrasena"
                                value={formData.contrasena}
                                onChange={handleInputChange}
                                placeholder={mode === 'create' ? 'Ingrese la contraseña' : 'Dejar vacío para mantener actual'}
                            />
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                        {errors.contrasena && (
                            <div className="invalid-feedback d-block">{errors.contrasena}</div>
                        )}
                    </div>

                    {/* Confirmar Contraseña */}
                    <div className="col-md-6 mb-3">
                        <label htmlFor="confirmarContrasena" className="form-label">
                            <i className="fas fa-lock me-2"></i>
                            {mode === 'create' ? 'Confirmar Contraseña *' : 'Confirmar Nueva Contraseña'}
                        </label>
                        <div className="input-group">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                className={`form-control ${errors.confirmarContrasena ? 'is-invalid' : ''}`}
                                id="confirmarContrasena"
                                name="confirmarContrasena"
                                value={formData.confirmarContrasena}
                                onChange={handleInputChange}
                                placeholder="Confirme la contraseña"
                            />
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                        {errors.confirmarContrasena && (
                            <div className="invalid-feedback d-block">{errors.confirmarContrasena}</div>
                        )}
                    </div>
                </div>

                <div className="row">
                    {/* Teléfono */}
                    <div className="col-md-6 mb-3">
                        <label htmlFor="telefono" className="form-label">
                            <i className="fas fa-phone me-2"></i>
                            Teléfono *
                        </label>
                        <input
                            type="tel"
                            className={`form-control ${errors.telefono ? 'is-invalid' : ''}`}
                            id="telefono"
                            name="telefono"
                            value={formData.telefono}
                            onChange={handleInputChange}
                            placeholder="Ingrese el número de teléfono"
                        />
                        {errors.telefono && (
                            <div className="invalid-feedback">{errors.telefono}</div>
                        )}
                    </div>

                    {/* Rol */}
                    <div className="col-md-6 mb-3">
                        <label htmlFor="rol" className="form-label">
                            <i className="fas fa-user-tag me-2"></i>
                            Rol *
                        </label>
                        <select
                            className={`form-select ${errors.rol ? 'is-invalid' : ''}`}
                            id="rol"
                            name="rol"
                            value={formData.rol}
                            onChange={handleInputChange}
                        >
                            <option value="">Seleccione un rol</option>
                            {roles.map(rol => (
                                <option key={rol.id} value={rol.id}>
                                    {rol.nombre}
                                </option>
                            ))}
                        </select>
                        {errors.rol && (
                            <div className="invalid-feedback">{errors.rol}</div>
                        )}
                    </div>
                </div>

                <div className="row">
                    {/* Estado */}
                    <div className="col-md-6 mb-3">
                        <label htmlFor="estado" className="form-label">
                            <i className="fas fa-toggle-on me-2"></i>
                            Estado
                        </label>
                        <select
                            className="form-select"
                            id="estado"
                            name="estado"
                            value={formData.estado}
                            onChange={handleInputChange}
                        >
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                        </select>
                    </div>

                    {/* Mostrar rol seleccionado */}
                    {formData.rol && (
                        <div className="col-md-6 mb-3">
                            <label className="form-label">Rol Seleccionado</label>
                            <div className="alert alert-info mb-0">
                                <i className="fas fa-info-circle me-2"></i>
                                {getRolNombre(formData.rol)}
                            </div>
                        </div>
                    )}
                </div>

                {/* Botones */}
                <div className="form-actions">
                    <button
                        type="button"
                        className="btn btn-secondary me-2"
                        onClick={onCancel}
                    >
                        <i className="fas fa-times me-2"></i>
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                    >
                        <i className={`fas ${mode === 'create' ? 'fa-plus' : 'fa-save'} me-2`}></i>
                        {mode === 'create' ? 'Crear Usuario' : 'Actualizar Usuario'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UsuarioForm;