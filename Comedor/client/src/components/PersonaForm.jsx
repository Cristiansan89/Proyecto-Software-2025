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

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showCreateUser, setShowCreateUser] = useState(false);

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

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Si cambia a docente, limpiar el grado
            if (name === 'tipoPersona' && value === 'Docente') {
                newData.grado = '';
            }

            // Si cambia a alumno, limpiar información de contacto
            if (name === 'tipoPersona' && value === 'Alumno') {
                newData.telefono = '';
                newData.email = '';
                newData.direccion = '';
            }

            return newData;
        });

        // Limpiar error del campo cuando el usuario empiece a escribir
        if (errors[name]) {
            setErrors(prev => ({
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
            if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
                newErrors.email = 'El formato del email no es válido';
            }

            if (formData.telefono && !/^\d{8,15}$/.test(formData.telefono.replace(/\s/g, ''))) {
                newErrors.telefono = 'El teléfono debe tener entre 8 y 15 dígitos';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
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

            onSave(personaToSave);
        } catch (error) {
            console.error('Error al guardar persona:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = () => {
        setShowCreateUser(true);
        // Aquí implementarás la lógica para crear usuario con rol docente
        alert(`Crear usuario para: ${formData.nombre} ${formData.apellido}\nEmail: ${formData.email}`);
    };

    const isViewMode = mode === 'view';
    const isCreateMode = mode === 'create';

    return (
        <div className="persona-form">
            <form onSubmit={handleSubmit}>
                <div className="form-sections">
                    {/* Información Personal */}
                    <div className="form-section">
                        <h4 className="section-title">
                            <i className="fas fa-user"></i>
                            Información Personal
                        </h4>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="nombre" className="form-label required" class="mt-3">
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
                                <label htmlFor="apellido" className="form-label required" class="mt-3">
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
                                <label htmlFor="numeroDocumento" className="form-label required" class="mt-3">
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

                            <div className="form-group">
                                <label htmlFor="tipoPersona" className="form-label required" class="mt-3">
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
                        </div>

                        {/* Grado solo para alumnos */}
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="grado" className="form-label required" class="mt-3">
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

                    </div>

                    {/* Estado */}
                    <div className="form-section">
                        <div className="form-group">
                            <label htmlFor="estado" className="form-label" class="mt-3">
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
                        className="btn btn-danger me-2"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        <i className="fas fa-ban"></i>
                        {isViewMode ? 'Cerrar' : 'Cancelar'}
                    </button>

                    {/* Botón para crear usuario - Solo para docentes */}
                    {formData.tipoPersona === 'Docente' && !isViewMode && (
                        <button
                            type="button"
                            className="btn btn-success me-2"
                            onClick={handleCreateUser}
                            disabled={loading || !formData.email}
                            title={!formData.email ? 'Debe ingresar un email para crear el usuario' : 'Crear usuario con rol docente'}
                        >
                            <i className="fas fa-user-plus me-2"></i>
                            Crear Usuario
                        </button>
                    )}

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
                                    {isCreateMode ? 'Crear Persona' : 'Actualizar Persona'}
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