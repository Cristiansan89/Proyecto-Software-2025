import { useState } from 'react';

const PersonaForm = ({ persona, mode, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        nombre: persona?.nombre || '',
        apellido: persona?.apellido || '',
        numeroDocumento: persona?.numeroDocumento || '',
        tipoPersona: persona?.tipoPersona || 'Alumno',
        grado: persona?.grado || '',
        telefono: persona?.telefono || '',
        email: persona?.email || '',
        direccion: persona?.direccion || '',
        estado: persona?.estado || 'Activo'
    });

    // Datos para el formulario de usuario (solo para docentes)
    const [userFormData, setUserFormData] = useState({
        nombreUsuario: '',
        email: '',
        password: '',
        confirmPassword: '',
        rol: 'Docente'
    });

    const [errors, setErrors] = useState({});
    const [userErrors, setUserErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const grados = [
        'Preescolar',
        'Primero',
        'Segundo',
        'Tercero',
        'Cuarto',
        'Quinto',
        'Sexto'
    ];

    const tiposPersona = [
        { value: 'Alumno', label: 'Alumno' },
        { value: 'Docente', label: 'Docente' }
    ];

    const generateUsername = (nombre, apellido) => {
        if (!nombre || !apellido) return '';
        return `${nombre.toLowerCase().trim()}.${apellido.toLowerCase().trim()}`.replace(/\s+/g, '');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Si cambia a docente, limpiar el grado y sincronizar email
            if (name === 'tipoPersona' && value === 'Docente') {
                newData.grado = '';
                // Solo generar nombre de usuario si tenemos nombre y apellido
                const nombreUsuario = generateUsername(newData.nombre, newData.apellido);
                setUserFormData(prevUser => ({
                    ...prevUser,
                    email: newData.email,
                    nombreUsuario: nombreUsuario
                }));
            }

            // Si cambia a alumno, limpiar información de contacto
            if (name === 'tipoPersona' && value === 'Alumno') {
                newData.telefono = '';
                newData.email = '';
                newData.direccion = '';
                // Limpiar formulario de usuario
                setUserFormData({
                    nombreUsuario: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    rol: 'Docente'
                });
            }

            return newData;
        });

        // Actualizar nombre de usuario si cambia nombre o apellido y es docente
        if ((name === 'nombre' || name === 'apellido') && formData.tipoPersona === 'Docente') {
            const nombre = name === 'nombre' ? value : formData.nombre;
            const apellido = name === 'apellido' ? value : formData.apellido;
            const nombreUsuario = generateUsername(nombre, apellido);

            setUserFormData(prevUser => ({
                ...prevUser,
                nombreUsuario: nombreUsuario
            }));
        }

        // Si cambia el email y es docente, sincronizar con usuario
        if (name === 'email' && formData.tipoPersona === 'Docente') {
            setUserFormData(prevUser => ({
                ...prevUser,
                email: value
            }));
        }

        // Limpiar error del campo cuando el usuario empiece a escribir
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleUserInputChange = (e) => {
        const { name, value } = e.target;
        setUserFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Limpiar error del campo cuando el usuario empiece a escribir
        if (userErrors[name]) {
            setUserErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Validaciones requeridas
        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        }

        if (!formData.apellido.trim()) {
            newErrors.apellido = 'El apellido es requerido';
        }

        if (!formData.numeroDocumento.trim()) {
            newErrors.numeroDocumento = 'El número de documento es requerido';
        } else if (formData.numeroDocumento.length < 6) {
            newErrors.numeroDocumento = 'El documento debe tener al menos 6 caracteres';
        }

        if (!formData.tipoPersona) {
            newErrors.tipoPersona = 'El tipo de persona es requerido';
        }

        // Solo validar grado si es alumno
        if (formData.tipoPersona === 'Alumno' && !formData.grado) {
            newErrors.grado = 'El grado es requerido para alumnos';
        }

        // Validar información de contacto solo para docentes
        if (formData.tipoPersona === 'Docente') {
            if (!formData.email || !formData.email.trim()) {
                newErrors.email = 'El email es requerido para docentes';
            } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                newErrors.email = 'El formato del email no es válido';
            }

            if (formData.telefono && !/^\d{8,15}$/.test(formData.telefono.replace(/\s/g, ''))) {
                newErrors.telefono = 'El teléfono debe tener entre 8 y 15 dígitos';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateUserForm = () => {
        const newUserErrors = {};

        if (!userFormData.nombreUsuario.trim()) {
            newUserErrors.nombreUsuario = 'El nombre de usuario es requerido';
        } else if (userFormData.nombreUsuario.length < 3) {
            newUserErrors.nombreUsuario = 'El nombre de usuario debe tener al menos 3 caracteres';
        }

        if (!userFormData.email.trim()) {
            newUserErrors.email = 'El email es requerido';
        } else if (!/\S+@\S+\.\S+/.test(userFormData.email)) {
            newUserErrors.email = 'El formato del email no es válido';
        }

        if (!userFormData.password) {
            newUserErrors.password = 'La contraseña es requerida';
        } else if (userFormData.password.length < 6) {
            newUserErrors.password = 'La contraseña debe tener al menos 6 caracteres';
        }

        if (!userFormData.confirmPassword) {
            newUserErrors.confirmPassword = 'Confirme la contraseña';
        } else if (userFormData.password !== userFormData.confirmPassword) {
            newUserErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        setUserErrors(newUserErrors);
        return Object.keys(newUserErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Si es docente, también validar formulario de usuario
        if (formData.tipoPersona === 'Docente' && !isViewMode) {
            if (!validateUserForm()) {
                return;
            }
        }

        setLoading(true);

        try {
            // Simular llamada a API
            await new Promise(resolve => setTimeout(resolve, 1000));

            const personaToSave = {
                ...formData,
                id: persona?.id || Date.now(), // En producción vendría del backend
                fechaRegistro: persona?.fechaRegistro || new Date().toISOString().split('T')[0]
            };

            // Si es docente, también crear usuario
            let usuarioCreado = null;
            if (formData.tipoPersona === 'Docente' && !isViewMode) {
                usuarioCreado = {
                    id: Date.now() + 1,
                    nombreUsuario: userFormData.nombreUsuario,
                    email: userFormData.email,
                    rol: userFormData.rol,
                    personaId: personaToSave.id,
                    fechaCreacion: new Date().toISOString().split('T')[0],
                    estado: 'Activo'
                };
            }

            // Pasar ambos objetos al callback
            onSave(personaToSave, usuarioCreado);
        } catch (error) {
            console.error('Error al guardar persona:', error);
        } finally {
            setLoading(false);
        }
    };

    const isViewMode = mode === 'view';
    const isCreateMode = mode === 'create';

    return (
        <div className="persona-form">
            <form onSubmit={handleSubmit}>
                <div className="form-sections">
                    {/* Información Personal */}
                    <div>
                        <h5 className="section-title">
                            <i className="fas fa-user me-2"></i>
                            Información Personal
                        </h5>

                        <div className="form-group">
                            <label htmlFor="tipoPersona" className="form-label required mt-3">
                                Tipo de Persona
                            </label>
                            <select
                                id="tipoPersona"
                                name="tipoPersona"
                                className={`form-control ${errors.tipoPersona ? 'is-invalid' : ''}`}
                                value={formData.tipoPersona}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                            >
                                {tiposPersona.map(tipo => (
                                    <option key={tipo.value} value={tipo.value}>
                                        {tipo.label}
                                    </option>
                                ))}
                            </select>
                            {errors.tipoPersona && (
                                <div className="invalid-feedback">{errors.tipoPersona}</div>
                            )}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="nombre" className="form-label required mt-3">
                                    Nombre
                                </label>
                                <input
                                    type="text"
                                    id="nombre"
                                    name="nombre"
                                    className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                                    value={formData.nombre}
                                    onChange={handleInputChange}
                                    disabled={isViewMode}
                                    placeholder="Ingrese el nombre"
                                />
                                {errors.nombre && (
                                    <div className="invalid-feedback">{errors.nombre}</div>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="apellido" className="form-label required mt-3">
                                    Apellido
                                </label>
                                <input
                                    type="text"
                                    id="apellido"
                                    name="apellido"
                                    className={`form-control ${errors.apellido ? 'is-invalid' : ''}`}
                                    value={formData.apellido}
                                    onChange={handleInputChange}
                                    disabled={isViewMode}
                                    placeholder="Ingrese el apellido"
                                />
                                {errors.apellido && (
                                    <div className="invalid-feedback">{errors.apellido}</div>
                                )}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="numeroDocumento" className="form-label required mt-3">
                                    Número de Documento
                                </label>
                                <input
                                    type="text"
                                    id="numeroDocumento"
                                    name="numeroDocumento"
                                    className={`form-control ${errors.numeroDocumento ? 'is-invalid' : ''}`}
                                    value={formData.numeroDocumento}
                                    onChange={handleInputChange}
                                    disabled={isViewMode}
                                    placeholder="Ingrese el número de documento"
                                />
                                {errors.numeroDocumento && (
                                    <div className="invalid-feedback">{errors.numeroDocumento}</div>
                                )}
                            </div>


                        </div>

                        {/* Grado solo para alumnos */}
                        {formData.tipoPersona === 'Alumno' && (
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="grado" className="form-label required mt-3">
                                        Grado
                                    </label>
                                    <select
                                        id="grado"
                                        name="grado"
                                        className={`form-control ${errors.grado ? 'is-invalid' : ''}`}
                                        value={formData.grado}
                                        onChange={handleInputChange}
                                        disabled={isViewMode}
                                    >
                                        <option value="">Seleccionar grado</option>
                                        {grados.map(grado => (
                                            <option key={grado} value={grado}>
                                                {grado}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.grado && (
                                        <div className="invalid-feedback">{errors.grado}</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Campos adicionales para docentes */}
                        {formData.tipoPersona === 'Docente' && (
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="email" className="form-label required mt-3">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        disabled={isViewMode}
                                        placeholder="Ingrese el email"
                                    />
                                    {errors.email && (
                                        <div className="invalid-feedback">{errors.email}</div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="telefono" className="form-label mt-3">
                                        Teléfono
                                    </label>
                                    <input
                                        type="text"
                                        id="telefono"
                                        name="telefono"
                                        className={`form-control ${errors.telefono ? 'is-invalid' : ''}`}
                                        value={formData.telefono}
                                        onChange={handleInputChange}
                                        disabled={isViewMode}
                                        placeholder="Ingrese el teléfono"
                                    />
                                    {errors.telefono && (
                                        <div className="invalid-feedback">{errors.telefono}</div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Formulario de Usuario - Solo para Docentes */}
                    {formData.tipoPersona === 'Docente' && !isViewMode && (

                        <div className="mt-4">
                            <div className="separar-secciones-cuenta"></div>
                            <h5 className="section-title">
                                <i className="fas fa-user-shield me-2"></i>
                                Cuenta de Usuario
                            </h5>
                            <div className="alert alert-info">
                                <i className="fas fa-info-circle me-2"></i>
                                Se creará automáticamente una cuenta de usuario para este docente.
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
                                        className={`form-control ${userErrors.nombreUsuario ? 'is-invalid' : ''}`}
                                        value={userFormData.nombreUsuario || ''}
                                        onChange={handleUserInputChange}
                                        placeholder={formData.nombre && formData.apellido ?
                                            "Se genera automáticamente: nombre.apellido" :
                                            "Complete nombre y apellido primero"
                                        }
                                    />
                                    {userErrors.nombreUsuario && (
                                        <div className="invalid-feedback">{userErrors.nombreUsuario}</div>
                                    )}
                                    {!userFormData.nombreUsuario && formData.nombre && formData.apellido && (
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
                                        name="email"
                                        className={`form-control ${userErrors.email ? 'is-invalid' : ''}`}
                                        value={userFormData.email}
                                        onChange={handleUserInputChange}
                                        placeholder="Email para la cuenta de usuario"
                                    />
                                    {userErrors.email && (
                                        <div className="invalid-feedback">{userErrors.email}</div>
                                    )}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="password" className="form-label required mt-3">
                                        Contraseña
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        className={`form-control ${userErrors.password ? 'is-invalid' : ''}`}
                                        value={userFormData.password}
                                        onChange={handleUserInputChange}
                                        placeholder="Contraseña (mínimo 6 caracteres)"
                                    />
                                    {userErrors.password && (
                                        <div className="invalid-feedback">{userErrors.password}</div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmPassword" className="form-label required mt-3">
                                        Confirmar Contraseña
                                    </label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        className={`form-control ${userErrors.confirmPassword ? 'is-invalid' : ''}`}
                                        value={userFormData.confirmPassword}
                                        onChange={handleUserInputChange}
                                        placeholder="Confirme la contraseña"
                                    />
                                    {userErrors.confirmPassword && (
                                        <div className="invalid-feedback">{userErrors.confirmPassword}</div>
                                    )}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="rol" className="form-label mt-3">
                                        Rol
                                    </label>
                                    <select
                                        id="rol"
                                        name="rol"
                                        className="form-control"
                                        value={userFormData.rol}
                                        onChange={handleUserInputChange}
                                        disabled
                                    >
                                        <option value="Docente">Docente</option>
                                    </select>
                                    <small className="form-text text-muted">
                                        El rol se asigna automáticamente como Docente.
                                    </small>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Estado */}
                    <div>
                        <div className="form-group">
                            <label htmlFor="estado" className="form-label mt-3">
                                Estado
                            </label>
                            <select
                                id="estado"
                                name="estado"
                                className="form-control"
                                value={formData.estado}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                            >
                                <option value="Activo">Activo</option>
                                <option value="Inactivo">Inactivo</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Botones */}
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
                                    {isCreateMode ?
                                        (formData.tipoPersona === 'Docente' ? 'Crear Persona y Usuario' : 'Crear Persona')
                                        : 'Actualizar Persona'
                                    }
                                </>
                            )}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default PersonaForm;