import { useState } from 'react';

const InsumoForm = ({ insumo, mode, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        nombreInsumo: insumo?.nombreInsumo || '',
        descripcion: insumo?.descripcion || '',
        unidadDeMedida: insumo?.unidadDeMedida || '',
        stockMinimo: insumo?.stockMinimo || 0,
        stockActual: insumo?.stockActual || 0
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Unidades de medida comunes
    const unidadesMedida = [
        { value: 'kg', label: 'Kilogramos (kg)' },
        { value: 'g', label: 'Gramos (g)' },
        { value: 'litros', label: 'Litros (L)' },
        { value: 'ml', label: 'Mililitros (ml)' },
        { value: 'unidades', label: 'Unidades' },
        { value: 'paquetes', label: 'Paquetes' },
        { value: 'cajas', label: 'Cajas' },
        { value: 'bolsas', label: 'Bolsas' },
        { value: 'latas', label: 'Latas' },
        { value: 'botellas', label: 'Botellas' }
    ];

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value
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
        if (!formData.nombreInsumo.trim()) {
            newErrors.nombreInsumo = 'El nombre del insumo es requerido';
        } else if (formData.nombreInsumo.length > 100) {
            newErrors.nombreInsumo = 'El nombre no puede exceder 100 caracteres';
        }

        if (!formData.unidadDeMedida.trim()) {
            newErrors.unidadDeMedida = 'La unidad de medida es requerida';
        }

        if (formData.descripcion && formData.descripcion.length > 255) {
            newErrors.descripcion = 'La descripción no puede exceder 255 caracteres';
        }

        // Validaciones numéricas
        if (formData.stockMinimo < 0) {
            newErrors.stockMinimo = 'El stock mínimo no puede ser negativo';
        }

        if (formData.stockActual < 0) {
            newErrors.stockActual = 'El stock actual no puede ser negativo';
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

            const insumoToSave = {
                ...formData,
                idInsumo: insumo?.idInsumo || Date.now(),
                fechaRegistro: insumo?.fechaRegistro || new Date().toISOString().split('T')[0]
            };

            onSave(insumoToSave);
        } catch (error) {
            console.error('Error al guardar insumo:', error);
        } finally {
            setLoading(false);
        }
    };

    const isViewMode = mode === 'view';
    const isCreateMode = mode === 'create';

    return (
        <div className="insumo-form">
            <form onSubmit={handleSubmit}>
                <div className="form-sections">
                    {/* Información Básica */}
                    <div>
                        <h5 className="section-title">
                            <i className="fas fa-info-circle me-2"></i>
                            Información Básica
                        </h5>

                        <div className="form-group">
                            <label htmlFor="nombreInsumo" className="form-label required mt-3">
                                Nombre del Insumo
                            </label>
                            <input
                                type="text"
                                id="nombreInsumo"
                                name="nombreInsumo"
                                className={`form-control ${errors.nombreInsumo ? 'is-invalid' : ''}`}
                                value={formData.nombreInsumo}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                placeholder="Ingrese el nombre del insumo"
                                maxLength="100"
                            />
                            {errors.nombreInsumo && (
                                <div className="invalid-feedback">{errors.nombreInsumo}</div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="descripcion" className="form-label mt-3">
                                Descripción
                            </label>
                            <textarea
                                id="descripcion"
                                name="descripcion"
                                className={`form-control ${errors.descripcion ? 'is-invalid' : ''}`}
                                value={formData.descripcion}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                placeholder="Ingrese una descripción del insumo (opcional)"
                                rows="3"
                                maxLength="255"
                            />
                            {errors.descripcion && (
                                <div className="invalid-feedback">{errors.descripcion}</div>
                            )}
                            <small className="form-text text-muted">
                                {formData.descripcion.length}/255 caracteres
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="unidadDeMedida" className="form-label required mt-3">
                                Unidad de Medida
                            </label>
                            <select
                                id="unidadDeMedida"
                                name="unidadDeMedida"
                                className={`form-control ${errors.unidadDeMedida ? 'is-invalid' : ''}`}
                                value={formData.unidadDeMedida}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                            >
                                <option value="">Seleccionar unidad de medida</option>
                                {unidadesMedida.map(unidad => (
                                    <option key={unidad.value} value={unidad.value}>
                                        {unidad.label}
                                    </option>
                                ))}
                            </select>
                            {errors.unidadDeMedida && (
                                <div className="invalid-feedback">{errors.unidadDeMedida}</div>
                            )}
                        </div>
                    </div>

                    {/* Información de Stock */}
                    <div className="mt-4">
                        <div className="separar-secciones-stock"></div>
                        <h5 className="section-title">
                            <i className="fas fa-warehouse me-2"></i>
                            Control de Stock
                        </h5>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="stockMinimo" className="form-label mt-3">
                                    Stock Mínimo
                                </label>
                                <input
                                    type="number"
                                    id="stockMinimo"
                                    name="stockMinimo"
                                    className={`form-control ${errors.stockMinimo ? 'is-invalid' : ''}`}
                                    value={formData.stockMinimo}
                                    onChange={handleInputChange}
                                    disabled={isViewMode}
                                    placeholder="0"
                                    min="0"
                                />
                                {errors.stockMinimo && (
                                    <div className="invalid-feedback">{errors.stockMinimo}</div>
                                )}
                                <small className="form-text text-muted">
                                    Cantidad mínima antes de requerir reposición
                                </small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="stockActual" className="form-label mt-3">
                                    Stock Actual
                                </label>
                                <input
                                    type="number"
                                    id="stockActual"
                                    name="stockActual"
                                    className={`form-control ${errors.stockActual ? 'is-invalid' : ''}`}
                                    value={formData.stockActual}
                                    onChange={handleInputChange}
                                    disabled={isViewMode}
                                    placeholder="0"
                                    min="0"
                                />
                                {errors.stockActual && (
                                    <div className="invalid-feedback">{errors.stockActual}</div>
                                )}
                                <small className="form-text text-muted">
                                    Cantidad disponible actualmente
                                </small>
                            </div>
                        </div>

                        {/* Alerta de stock bajo */}
                        {formData.stockActual > 0 && formData.stockMinimo > 0 &&
                            formData.stockActual <= formData.stockMinimo && (
                                <div className="alert alert-warning mt-3">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    <strong>Atención:</strong> El stock actual está por debajo o igual al mínimo establecido.
                                </div>
                            )}

                        {/* Información adicional en modo vista */}
                        {isViewMode && insumo && (
                            <div className="mt-4">
                                <div className="info-card">
                                    <h6 className="info-title">Información Adicional</h6>
                                    <div className="info-row">
                                        <span className="info-label">ID del Insumo:</span>
                                        <span className="info-value">{insumo.idInsumo}</span>
                                    </div>
                                    {insumo.fechaRegistro && (
                                        <div className="info-row">
                                            <span className="info-label">Fecha de Registro:</span>
                                            <span className="info-value">{insumo.fechaRegistro}</span>
                                        </div>
                                    )}
                                    <div className="info-row">
                                        <span className="info-label">Estado del Stock:</span>
                                        <span className={`info-value ${insumo.stockActual <= insumo.stockMinimo ? 'text-danger' :
                                                insumo.stockActual <= insumo.stockMinimo * 1.5 ? 'text-warning' : 'text-success'
                                            }`}>
                                            {insumo.stockActual <= insumo.stockMinimo ? 'Stock Bajo' :
                                                insumo.stockActual <= insumo.stockMinimo * 1.5 ? 'Stock Medio' : 'Stock Bueno'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
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
                                    {isCreateMode ? 'Crear Insumo' : 'Actualizar Insumo'}
                                </>
                            )}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default InsumoForm;