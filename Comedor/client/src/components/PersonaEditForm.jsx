import { useState } from 'react';
import personaService from '../services/personaService.js';

const PersonaForm = ({ persona, mode, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        nombre: persona?.nombre || '',
        apellido: persona?.apellido || '',
        dni: persona?.dni || '',
        fechaNacimiento: persona?.fechaNacimiento ? persona.fechaNacimiento.split('T')[0] : '',
        genero: persona?.genero || '',
        estado: persona?.estado || 'Activo'
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);



    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear any validation error for this field while the user types
        setErrors(prev => {
            if (!prev || !prev[name]) return prev;
            return { ...prev, [name]: undefined };
        });
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

        if (!formData.dni.trim()) {
            newErrors.dni = 'El número de documento es requerido';
        } else if (formData.dni.length < 6) {
            newErrors.dni = 'El documento debe tener al menos 6 caracteres';
        }

        if (!formData.fechaNacimiento) {
            newErrors.fechaNacimiento = 'La fecha de nacimiento es requerida';
        } else {
            const fechaNac = new Date(formData.fechaNacimiento);
            const hoy = new Date();
            const edad = hoy.getFullYear() - fechaNac.getFullYear();
            if (edad < 3 || edad > 100) {
                newErrors.fechaNacimiento = 'La edad debe estar entre 3 y 100 años';
            }
        }

        if (!formData.genero) {
            newErrors.genero = 'El género es requerido';
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
            // Preparar datos para enviar al backend
            const personaData = {
                nombre: formData.nombre.trim(),
                apellido: formData.apellido.trim(),
                dni: formData.dni.trim(),
                fechaNacimiento: formData.fechaNacimiento,
                genero: formData.genero,
                estado: formData.estado
            };

            let savedPersona;

            // Actualizar persona
            savedPersona = await personaService.update(persona.idPersona, personaData);

            // Pasar datos al callback del componente padre
            if (onSave) {
                onSave(savedPersona);
                // No llamar onCancel aquí, el componente padre se encargará de cerrar
            }
        } catch (error) {
            console.error('Error al guardar persona:', error);

            // Mostrar error al usuario
            if (error.response?.data?.message) {
                alert(`Error: ${error.response.data.message}`);
            } else if (error.response?.data?.errors) {
                const errorMessages = error.response.data.errors.map(err => `${err.field}: ${err.message}`).join('\n');
                alert(`Errores de validación:\n${errorMessages}`);
            } else {
                alert('Error al guardar la persona. Por favor, inténtelo de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    const isViewMode = mode === 'view';

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
                                <label htmlFor="dni" className="form-label required mt-3">
                                    Número de Documento
                                </label>
                                <input
                                    type="text"
                                    id="dni"
                                    name="dni"
                                    className={`form-control ${errors.dni ? 'is-invalid' : ''}`}
                                    value={formData.dni}
                                    onChange={handleInputChange}
                                    disabled={isViewMode}
                                    placeholder="Ingrese el número de documento"
                                />
                                {errors.dni && (
                                    <div className="invalid-feedback">{errors.dni}</div>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="fechaNacimiento" className="form-label required mt-3">
                                    Fecha de Nacimiento
                                </label>
                                <input
                                    type="date"
                                    id="fechaNacimiento"
                                    name="fechaNacimiento"
                                    className={`form-control ${errors.fechaNacimiento ? 'is-invalid' : ''}`}
                                    value={formData.fechaNacimiento}
                                    onChange={handleInputChange}
                                    disabled={isViewMode}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                                {errors.fechaNacimiento && (
                                    <div className="invalid-feedback">{errors.fechaNacimiento}</div>
                                )}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="genero" className="form-label required mt-3">
                                    Género
                                </label>
                                <select
                                    id="genero"
                                    name="genero"
                                    className={`form-control ${errors.genero ? 'is-invalid' : ''}`}
                                    value={formData.genero}
                                    onChange={handleInputChange}
                                    disabled={isViewMode}
                                >
                                    <option value="">Seleccionar género</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Femenina">Femenina</option>
                                    <option value="Otros">Otros</option>
                                </select>
                                {errors.genero && (
                                    <div className="invalid-feedback">{errors.genero}</div>
                                )}
                            </div>
                            {/* Estado */}

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
                                    Actualizar Persona
                                </>
                            )}
                        </button>
                    )}
                </div>
            </form >
        </div >
    );
};

export default PersonaForm;