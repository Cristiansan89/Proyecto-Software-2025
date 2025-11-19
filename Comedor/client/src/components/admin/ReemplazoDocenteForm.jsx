import { useState, useEffect } from 'react';
import reemplazoDocenteService from '../../services/reemplazoDocenteService.js';

const ReemplazoDocenteForm = ({ reemplazo, mode, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        idPersona: reemplazo?.idPersona || '',
        idDocenteTitular: reemplazo?.idDocenteTitular || '',
        nombreGrado: reemplazo?.nombreGrado || '',
        cicloLectivo: reemplazo?.cicloLectivo || new Date().getFullYear(),
        fechaInicio: reemplazo?.fechaInicio || new Date().toISOString().split('T')[0],
        fechaFin: reemplazo?.fechaFin || '',
        motivo: reemplazo?.motivo || '',
        estado: reemplazo?.estado || 'Activo'
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const [suplentes, setSuplentes] = useState([]);
    const [titulares, setTitulares] = useState([]);
    const [options, setOptions] = useState({ motivos: [], estados: [] });
    const [loadingOptions, setLoadingOptions] = useState(true);

    // Cargar opciones al montar el componente
    useEffect(() => {
        const loadOptions = async () => {
            try {
                setLoadingOptions(true);
                const [suplentesData, titularesData, optionsData] = await Promise.all([
                    reemplazoDocenteService.getDocentesSupletesDisponibles(),
                    reemplazoDocenteService.getDocentesTitulares(formData.cicloLectivo),
                    reemplazoDocenteService.getOptions()
                ]);

                setSuplentes(suplentesData);
                setTitulares(titularesData);
                setOptions(optionsData);
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
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Si se cambia el docente titular, actualizar el grado
            if (name === 'idDocenteTitular' && value) {
                const titular = titulares.find(t => t.idDocenteTitular == value);
                if (titular) {
                    newData.nombreGrado = titular.nombreGrado;
                }
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

        if (!formData.idPersona) {
            newErrors.idPersona = 'Debe seleccionar un docente suplente';
        }

        if (!formData.idDocenteTitular) {
            newErrors.idDocenteTitular = 'Debe seleccionar un docente titular';
        }

        if (!formData.fechaInicio) {
            newErrors.fechaInicio = 'La fecha de inicio es requerida';
        }

        if (formData.fechaFin && formData.fechaInicio && formData.fechaFin < formData.fechaInicio) {
            newErrors.fechaFin = 'La fecha de fin debe ser posterior a la fecha de inicio';
        }

        if (!formData.motivo) {
            newErrors.motivo = 'Debe seleccionar un motivo';
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
            const submitData = {
                idPersona: parseInt(formData.idPersona),
                idDocenteTitular: parseInt(formData.idDocenteTitular),
                nombreGrado: formData.nombreGrado,
                cicloLectivo: formData.cicloLectivo,
                fechaInicio: formData.fechaInicio,
                fechaFin: formData.fechaFin || null,
                motivo: formData.motivo,
                estado: formData.estado
            };

            let result;
            if (mode === 'create') {
                result = await reemplazoDocenteService.create(submitData);
            } else {
                result = await reemplazoDocenteService.update(reemplazo.idReemplazoDocente, {
                    idPersona: parseInt(formData.idPersona),
                    fechaInicio: formData.fechaInicio,
                    fechaFin: formData.fechaFin || null,
                    motivo: formData.motivo,
                    estado: formData.estado
                });
            }

            onSave(result);
        } catch (error) {
            console.error('Error al guardar reemplazo:', error);

            if (error.response?.data?.message) {
                alert(`Error: ${error.response.data.message}`);
            } else if (error.response?.data?.errors) {
                const errorMessages = error.response.data.errors.map(err => `${err.field}: ${err.message}`).join('\n');
                alert(`Errores de validación:\n${errorMessages}`);
            } else {
                alert('Error al guardar el reemplazo. Por favor, inténtelo de nuevo.');
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
        <div className="reemplazo-docente-form">
            <form onSubmit={handleSubmit}>
                <div className="form-sections">
                    <div>
                        <h5 className="section-title">
                            <i className="fas fa-user-clock me-2"></i>
                            Reemplazo de Docente
                        </h5>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="idPersona" className="form-label required mt-3">
                                    Docente Suplente
                                </label>
                                <select
                                    id="idPersona"
                                    name="idPersona"
                                    className={`form-control ${errors.idPersona ? 'is-invalid' : ''}`}
                                    value={formData.idPersona}
                                    onChange={handleInputChange}
                                    disabled={isViewMode}
                                >
                                    <option value="">Seleccionar docente suplente</option>
                                    {suplentes.map(suplente => (
                                        <option key={suplente.idPersona} value={suplente.idPersona}>
                                            {suplente.nombre} {suplente.apellido} - DNI: {suplente.dni}
                                        </option>
                                    ))}
                                </select>
                                {errors.idPersona && (
                                    <div className="invalid-feedback">{errors.idPersona}</div>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="idDocenteTitular" className="form-label required mt-3">
                                    Docente Titular a Reemplazar
                                </label>
                                <select
                                    id="idDocenteTitular"
                                    name="idDocenteTitular"
                                    className={`form-control ${errors.idDocenteTitular ? 'is-invalid' : ''}`}
                                    value={formData.idDocenteTitular}
                                    onChange={handleInputChange}
                                    disabled={isViewMode}
                                >
                                    <option value="">Seleccionar docente titular</option>
                                    {titulares.map(titular => (
                                        <option key={titular.idDocenteTitular} value={titular.idDocenteTitular}>
                                            {titular.nombre} {titular.apellido} - {titular.nombreGrado}
                                        </option>
                                    ))}
                                </select>
                                {errors.idDocenteTitular && (
                                    <div className="invalid-feedback">{errors.idDocenteTitular}</div>
                                )}
                            </div>
                        </div>

                        {formData.nombreGrado && (
                            <div className="form-group">
                                <label className="form-label mt-3">Grado</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.nombreGrado}
                                    disabled
                                />
                                <small className="form-text text-muted">
                                    <i className="fas fa-info-circle me-1"></i>
                                    El grado se asigna automáticamente según el docente titular seleccionado
                                </small>
                            </div>
                        )}

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="fechaInicio" className="form-label required mt-3">
                                    Fecha de Inicio
                                </label>
                                <input
                                    type="date"
                                    id="fechaInicio"
                                    name="fechaInicio"
                                    className={`form-control ${errors.fechaInicio ? 'is-invalid' : ''}`}
                                    value={formData.fechaInicio}
                                    onChange={handleInputChange}
                                    disabled={isViewMode}
                                />
                                {errors.fechaInicio && (
                                    <div className="invalid-feedback">{errors.fechaInicio}</div>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="fechaFin" className="form-label mt-3">
                                    Fecha de Fin (opcional)
                                </label>
                                <input
                                    type="date"
                                    id="fechaFin"
                                    name="fechaFin"
                                    className={`form-control ${errors.fechaFin ? 'is-invalid' : ''}`}
                                    value={formData.fechaFin}
                                    onChange={handleInputChange}
                                    disabled={isViewMode}
                                    min={formData.fechaInicio}
                                />
                                {errors.fechaFin && (
                                    <div className="invalid-feedback">{errors.fechaFin}</div>
                                )}
                                <small className="form-text text-muted">
                                    Si no se especifica, el reemplazo queda abierto
                                </small>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="motivo" className="form-label required mt-3">
                                    Motivo del Reemplazo
                                </label>
                                <select
                                    id="motivo"
                                    name="motivo"
                                    className={`form-control ${errors.motivo ? 'is-invalid' : ''}`}
                                    value={formData.motivo}
                                    onChange={handleInputChange}
                                    disabled={isViewMode}
                                >
                                    <option value="">Seleccionar motivo</option>
                                    {options.motivos.map(motivo => (
                                        <option key={motivo} value={motivo}>
                                            {motivo}
                                        </option>
                                    ))}
                                </select>
                                {errors.motivo && (
                                    <div className="invalid-feedback">{errors.motivo}</div>
                                )}
                            </div>

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
                                    {options.estados.map(estado => (
                                        <option key={estado} value={estado}>
                                            {estado}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="cicloLectivo" className="form-label mt-3">
                                Ciclo Lectivo
                            </label>
                            <input
                                type="number"
                                id="cicloLectivo"
                                name="cicloLectivo"
                                className="form-control"
                                value={formData.cicloLectivo}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                min="2020"
                                max="2030"
                            />
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
                                    {isCreateMode ? 'Crear Reemplazo' : 'Actualizar Reemplazo'}
                                </>
                            )}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default ReemplazoDocenteForm;