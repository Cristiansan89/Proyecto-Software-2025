import { useState, useEffect } from 'react';
import gradoService from '../services/gradoService';
import turnoService from '../services/turnoService';

const GradoForm = ({ grado, mode, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        nombreGrado: grado?.nombreGrado || '',
        idTurno: grado?.idTurno || '',
        estado: grado?.estado || 'Activo'
    });

    const [turnos, setTurnos] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [loadingTurnos, setLoadingTurnos] = useState(true);

    // Cargar turnos al montar el componente
    useEffect(() => {
        const loadTurnos = async () => {
            try {
                const turnosData = await turnoService.getActivos();
                setTurnos(turnosData);
            } catch (error) {
                console.error('Error al cargar turnos:', error);
            } finally {
                setLoadingTurnos(false);
            }
        };

        loadTurnos();
    }, []);

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

        // Validaciones requeridas
        if (!formData.nombreGrado.trim()) {
            newErrors.nombreGrado = 'El nombre del grado es requerido';
        } else if (formData.nombreGrado.length < 2) {
            newErrors.nombreGrado = 'El nombre debe tener al menos 2 caracteres';
        }

        if (!formData.idTurno) {
            newErrors.idTurno = 'Debe seleccionar un turno';
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
            let savedGrado;

            if (mode === 'create') {
                savedGrado = await gradoService.create(formData);
            } else {
                savedGrado = await gradoService.update(grado.idGrado, formData);
            }

            onSave(savedGrado);
        } catch (error) {
            console.error('Error al guardar grado:', error);

            // Mostrar errores específicos
            if (error.response?.data?.errors) {
                const apiErrors = {};
                error.response.data.errors.forEach(err => {
                    apiErrors[err.field] = err.message;
                });
                setErrors(apiErrors);
            } else if (error.response?.data?.message) {
                alert(`Error: ${error.response.data.message}`);
            } else {
                alert('Error al guardar el grado. Por favor, intente nuevamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    const isViewMode = mode === 'view';
    const isCreateMode = mode === 'create';

    return (
        <div className="grado-form">
            <form onSubmit={handleSubmit}>
                <div className="form-sections">
                    {/* Información del Grado */}
                    <div >
                        <h4 className="section-title">
                            <i className="fas fa-graduation-cap me-2"></i>
                            Información del Grado
                        </h4>

                        <div className="form-group">
                            <label htmlFor="nombreGrado" className="form-label required mt-2">
                                Nombre del Grado
                            </label>
                            <input
                                type="text"
                                id="nombreGrado"
                                name="nombreGrado"
                                className={`form-control ${errors.nombreGrado ? 'is-invalid' : ''}`}
                                value={formData.nombreGrado}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                placeholder="Ej: 1° A, 1° B, 2° A, 3° A..."
                            />
                            {errors.nombreGrado && (
                                <div className="invalid-feedback">{errors.nombreGrado}</div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="idTurno" className="form-label required mt-3">
                                Turno
                            </label>
                            {loadingTurnos ? (
                                <div className="form-control">
                                    <i className="fas fa-spinner fa-spin me-2"></i>
                                    Cargando turnos...
                                </div>
                            ) : (
                                <select
                                    id="idTurno"
                                    name="idTurno"
                                    className={`form-control ${errors.idTurno ? 'is-invalid' : ''}`}
                                    value={formData.idTurno}
                                    onChange={handleInputChange}
                                    disabled={isViewMode}
                                >
                                    <option value="">Seleccionar turno...</option>
                                    {turnos.map(turno => (
                                        <option key={turno.idTurno} value={turno.idTurno}>
                                            {turno.nombre} ({turno.horaInicio} - {turno.horaFin})
                                        </option>
                                    ))}
                                </select>
                            )}
                            {errors.idTurno && (
                                <div className="invalid-feedback">{errors.idTurno}</div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="estado" className="form-label mt-3">
                                Estado del Grado
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
                            <small className="form-text text-muted mt-3">
                                Los grados inactivos no aparecerán disponibles para nuevos registros
                            </small>
                        </div>
                    </div>
                </div>

                {/* Botones */}
                <div className="form-actions mt-3">
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
                            className="btn btn-primary"
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
                                    {isCreateMode ? 'Crear Grado' : 'Actualizar Grado'}
                                </>
                            )}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default GradoForm;