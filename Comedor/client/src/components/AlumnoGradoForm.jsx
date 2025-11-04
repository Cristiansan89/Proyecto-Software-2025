import { useState, useEffect } from 'react';
import alumnoGradoService from '../services/alumnoGradoService.js';
import { gradoService } from '../services/gradoService.js';

const AlumnoGradoForm = ({ alumnoGrado, mode, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        idPersona: alumnoGrado?.idPersona || '',
        nombreGrado: alumnoGrado?.nombreGrado || '',
        cicloLectivo: alumnoGrado?.cicloLectivo || new Date().getFullYear()
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const [alumnos, setAlumnos] = useState([]);
    const [grados, setGrados] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(true);

    // Cargar opciones al montar el componente
    useEffect(() => {
        const loadOptions = async () => {
            try {
                setLoadingOptions(true);
                const [alumnosData, gradosData] = await Promise.all([
                    alumnoGradoService.getAlumnosDisponibles(formData.cicloLectivo),
                    gradoService.getActivos()
                ]);

                setAlumnos(alumnosData);
                setGrados(gradosData.filter(g => g.estado === 'Activo'));
            } catch (error) {
                console.error('Error al cargar opciones:', error);
            } finally {
                setLoadingOptions(false);
            }
        };

        loadOptions();
    }, [formData.cicloLectivo, mode]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

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

        if (!formData.idPersona) {
            newErrors.idPersona = 'Debe seleccionar un alumno';
        }

        if (!formData.nombreGrado) {
            newErrors.nombreGrado = 'Debe seleccionar un grado';
        }

        if (!formData.cicloLectivo) {
            newErrors.cicloLectivo = 'El ciclo lectivo es requerido';
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
            let result;
            if (mode === 'create') {
                result = await alumnoGradoService.create({
                    idPersona: parseInt(formData.idPersona),
                    nombreGrado: formData.nombreGrado,
                    cicloLectivo: formData.cicloLectivo
                });
            } else {
                result = await alumnoGradoService.update(alumnoGrado.idAlumnoGrado, {
                    idPersona: parseInt(formData.idPersona),
                    nombreGrado: formData.nombreGrado,
                    cicloLectivo: formData.cicloLectivo
                });
            }

            onSave(result);
        } catch (error) {
            console.error('Error al guardar asignación:', error);

            if (error.response?.data?.message) {
                alert(`Error: ${error.response.data.message}`);
            } else if (error.response?.data?.errors) {
                const errorMessages = error.response.data.errors.map(err => `${err.field}: ${err.message}`).join('\n');
                alert(`Errores de validación:\n${errorMessages}`);
            } else {
                alert('Error al guardar la asignación. Por favor, inténtelo de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    const isViewMode = mode === 'view';
    const isCreateMode = mode === 'create';

    if (loadingOptions) {
        return (
            <div className="loading-spinner">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Cargando datos...</p>
            </div>
        );
    }

    return (
        <div className="alumno-grado-form">
            <form onSubmit={handleSubmit}>
                <div className="form-sections">
                    <div>
                        <h5 className="section-title">
                            <i className="fas fa-user-graduate me-2"></i>
                            Asignación de Alumno a Grado
                        </h5>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="idPersona" className="form-label required mt-3">
                                    Alumno
                                </label>
                                <select
                                    id="idPersona"
                                    name="idPersona"
                                    className={`form-control ${errors.idPersona ? 'is-invalid' : ''}`}
                                    value={formData.idPersona}
                                    onChange={handleInputChange}
                                    disabled={isViewMode}
                                >
                                    <option value="">Seleccionar alumno</option>
                                    {alumnos.map(alumno => (
                                        <option key={alumno.idPersona} value={alumno.idPersona}>
                                            {alumno.nombre} {alumno.apellido} - DNI: {alumno.dni}
                                        </option>
                                    ))}
                                </select>
                                {errors.idPersona && (
                                    <div className="invalid-feedback">{errors.idPersona}</div>
                                )}
                                {formData.idPersona && (
                                    <small className="form-text text-muted">
                                        <i className="fas fa-info-circle me-1"></i>
                                        Solo se muestran alumnos disponibles para el ciclo lectivo actual
                                    </small>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="nombreGrado" className="form-label required mt-3">
                                    Grado
                                </label>
                                <select
                                    id="nombreGrado"
                                    name="nombreGrado"
                                    className={`form-control ${errors.nombreGrado ? 'is-invalid' : ''}`}
                                    value={formData.nombreGrado}
                                    onChange={handleInputChange}
                                    disabled={isViewMode}
                                >
                                    <option value="">Seleccionar grado</option>
                                    {grados.map(grado => (
                                        <option key={grado.idGrado} value={grado.nombreGrado}>
                                            {grado.nombreGrado}
                                        </option>
                                    ))}
                                </select>
                                {errors.nombreGrado && (
                                    <div className="invalid-feedback">{errors.nombreGrado}</div>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="cicloLectivo" className="form-label required mt-3">
                                Ciclo Lectivo
                            </label>
                            <input
                                type="number"
                                id="cicloLectivo"
                                name="cicloLectivo"
                                className={`form-control ${errors.cicloLectivo ? 'is-invalid' : ''}`}
                                value={formData.cicloLectivo}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                min="2020"
                                max="2030"
                            />
                            {errors.cicloLectivo && (
                                <div className="invalid-feedback">{errors.cicloLectivo}</div>
                            )}
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
                                    {isCreateMode ? 'Asignar Alumno' : 'Actualizar Asignación'}
                                </>
                            )}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default AlumnoGradoForm;