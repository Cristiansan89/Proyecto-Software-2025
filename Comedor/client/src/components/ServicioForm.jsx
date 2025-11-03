import { useState, useEffect } from 'react';
import servicioService from '../services/servicioService.js';

const ServicioForm = ({ servicio, mode, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        nombre: servicio?.nombre || '',
        descripcion: servicio?.descripcion || '',
        estado: servicio?.estado || 'Activo'
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Limpiar error del campo cuando el usuario empiece a escribir
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Validaciones requeridas
        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        } else if (formData.nombre.length > 100) {
            newErrors.nombre = 'El nombre no puede tener más de 100 caracteres';
        }

        if (!formData.descripcion.trim()) {
            newErrors.descripcion = 'La descripción es requerida';
        } else if (formData.descripcion.length > 100) {
            newErrors.descripcion = 'La descripción no puede tener más de 100 caracteres';
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
            const servicioData = {
                nombre: formData.nombre.trim(),
                descripcion: formData.descripcion.trim(),
                estado: formData.estado
            };

            let savedServicio;

            // Crear o actualizar servicio
            if (mode === 'create') {
                savedServicio = await servicioService.create(servicioData);
            } else {
                savedServicio = await servicioService.update(servicio.idServicio, servicioData);
            }

            onSave(savedServicio);
        } catch (error) {
            console.error('Error al guardar servicio:', error);

            // Mostrar error al usuario
            if (error.response?.data?.message) {
                alert(`Error: ${error.response.data.message}`);
            } else if (error.response?.data?.errors) {
                const errorMessages = error.response.data.errors.map(err => `${err.field}: ${err.message}`).join('\\n');
                alert(`Errores de validación:\\n${errorMessages}`);
            } else {
                alert('Error al guardar el servicio. Por favor, inténtelo de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    const isViewMode = mode === 'view';
    const isCreateMode = mode === 'create';

    useEffect(() => {
        if (servicio) {
            setFormData({
                nombre: servicio.nombre || '',
                descripcion: servicio.descripcion || '',
                estado: servicio.estado || 'Activo'
            });
        }
    }, [servicio]);

    return (
        <div className="servicio-form">
            <form onSubmit={handleSubmit}>
                <div className="form-sections">
                    {/* Información del Servicio */}
                    <div>
                        <h5 className="section-title">
                            <i className="fas fa-utensils me-2"></i>
                            Información del Servicio
                        </h5>

                        <div className="form-group">
                            <label htmlFor="nombre" className="form-label required mt-3">
                                Nombre del Servicio
                            </label>
                            <input
                                type="text"
                                id="nombre"
                                name="nombre"
                                className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                                value={formData.nombre}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                placeholder="Ej: Desayuno, Almuerzo, Merienda"
                                maxLength="100"
                            />
                            {errors.nombre && (
                                <div className="invalid-feedback">{errors.nombre}</div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="descripcion" className="form-label required mt-3">
                                Descripción
                            </label>
                            <textarea
                                id="descripcion"
                                name="descripcion"
                                className={`form-control ${errors.descripcion ? 'is-invalid' : ''}`}
                                value={formData.descripcion}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                placeholder="Describe brevemente el servicio"
                                rows="3"
                                maxLength="100"
                            />
                            {errors.descripcion && (
                                <div className="invalid-feedback">{errors.descripcion}</div>
                            )}
                            <small className="form-text text-muted">
                                {formData.descripcion.length}/100 caracteres
                            </small>
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
                                    {isCreateMode ? 'Crear Servicio' : 'Actualizar Servicio'}
                                </>
                            )}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default ServicioForm;