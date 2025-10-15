import { useState } from 'react';

const GradoForm = ({ grado, mode, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        nombreGrado: grado?.nombreGrado || '',
        estado: grado?.estado || 'Activo'
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

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

            const gradoToSave = {
                ...formData,
                id: grado?.id || Date.now(), // En producción vendría del backend
                fechaRegistro: grado?.fechaRegistro || new Date().toISOString().split('T')[0]
            };

            onSave(gradoToSave);
        } catch (error) {
            console.error('Error al guardar grado:', error);
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
                    <div className="form-section">
                        <h4 className="section-title">
                            <i className="fas fa-graduation-cap"></i>
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
                        className="btn btn-danger me-2"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        <i className="fas fa-ban"></i>
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
                                    <i className="fas fa-save me-2"></i>
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