import { useState } from 'react';

const ProveedorForm = ({ proveedor, mode, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        razonSocial: proveedor?.razonSocial || '',
        direccion: proveedor?.direccion || '',
        telefono: proveedor?.telefono || '',
        estado: proveedor?.estado || 'Activo'
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
        if (!formData.razonSocial.trim()) {
            newErrors.razonSocial = 'La razón social es requerida';
        } else if (formData.razonSocial.length > 100) {
            newErrors.razonSocial = 'La razón social no puede exceder 100 caracteres';
        }

        if (!formData.direccion.trim()) {
            newErrors.direccion = 'La dirección es requerida';
        } else if (formData.direccion.length > 200) {
            newErrors.direccion = 'La dirección no puede exceder 200 caracteres';
        }

        if (!formData.telefono.trim()) {
            newErrors.telefono = 'El teléfono es requerido';
        } else if (!/^\d{3}-\d{4}$|^\d{7,15}$/.test(formData.telefono.replace(/[\s\-()]/g, ''))) {
            newErrors.telefono = 'El formato del teléfono no es válido (ej: 555-1234 o 5551234567)';
        }

        if (!formData.estado) {
            newErrors.estado = 'El estado es requerido';
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

            const proveedorToSave = {
                ...formData,
                idProveedor: proveedor?.idProveedor || Date.now(),
                fechaRegistro: proveedor?.fechaRegistro || new Date().toISOString().split('T')[0]
            };

            onSave(proveedorToSave);
        } catch (error) {
            console.error('Error al guardar proveedor:', error);
        } finally {
            setLoading(false);
        }
    };

    const isViewMode = mode === 'view';
    const isCreateMode = mode === 'create';

    return (
        <div className="proveedor-form">
            <form onSubmit={handleSubmit}>
                <div className="form-sections">
                    {/* Información Básica */}
                    <div>
                        <h5 className="section-title">
                            <i className="fas fa-building me-1"></i>
                            Información del Proveedor
                        </h5>

                        <div className="form-group">
                            <label htmlFor="razonSocial" className="form-label required mt-2">
                                Razón Social
                            </label>
                            <input
                                type="text"
                                id="razonSocial"
                                name="razonSocial"
                                className={`form-control ${errors.razonSocial ? 'is-invalid' : ''}`}
                                value={formData.razonSocial}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                placeholder="Ingrese la razón social del proveedor"
                                maxLength="100"
                            />
                            {errors.razonSocial && (
                                <div className="invalid-feedback">{errors.razonSocial}</div>
                            )}
                            <small className="form-text text-muted">
                                {formData.razonSocial.length}/100 caracteres
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="direccion" className="form-label required mt-2">
                                Dirección
                            </label>
                            <textarea
                                id="direccion"
                                name="direccion"
                                className={`form-control ${errors.direccion ? 'is-invalid' : ''}`}
                                value={formData.direccion}
                                onChange={handleInputChange}
                                disabled={isViewMode}
                                placeholder="Ingrese la dirección completa del proveedor"
                                rows="3"
                                maxLength="200"
                            />
                            {errors.direccion && (
                                <div className="invalid-feedback">{errors.direccion}</div>
                            )}
                            <small className="form-text text-muted">
                                {formData.direccion.length}/200 caracteres
                            </small>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="telefono" className="form-label required mt-2">
                                    Teléfono
                                </label>
                                <input
                                    type="tel"
                                    id="telefono"
                                    name="telefono"
                                    className={`form-control ${errors.telefono ? 'is-invalid' : ''}`}
                                    value={formData.telefono}
                                    onChange={handleInputChange}
                                    disabled={isViewMode}
                                    placeholder="Ej: 555-1234 o 5551234567"
                                />
                                {errors.telefono && (
                                    <div className="invalid-feedback">{errors.telefono}</div>
                                )}
                                <small className="form-text text-muted">
                                    Formato aceptado: 555-1234 o números de 7-15 dígitos
                                </small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="estado" className="form-label required mt-2">
                                    Estado
                                </label>
                                <select
                                    id="estado"
                                    name="estado"
                                    className={`form-control ${errors.estado ? 'is-invalid' : ''}`}
                                    value={formData.estado}
                                    onChange={handleInputChange}
                                    disabled={isViewMode}
                                >
                                    <option value="Activo">Activo</option>
                                    <option value="Inactivo">Inactivo</option>
                                </select>
                                {errors.estado && (
                                    <div className="invalid-feedback">{errors.estado}</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Información adicional en modo vista */}
                    {isViewMode && proveedor && (
                        <div className="mt-4">
                            <div className="separar-secciones-info"></div>
                            <h5 className="section-title">
                                <i className="fas fa-info-circle me-2"></i>
                                Información Adicional
                            </h5>

                            <div className="info-card">
                                <div className="info-row">
                                    <span className="info-label">ID del Proveedor:</span>
                                    <span className="info-value">{proveedor.idProveedor}</span>
                                </div>
                                {proveedor.fechaRegistro && (
                                    <div className="info-row">
                                        <span className="info-label">Fecha de Registro:</span>
                                        <span className="info-value">{proveedor.fechaRegistro}</span>
                                    </div>
                                )}
                                <div className="info-row">
                                    <span className="info-label">Total de Insumos:</span>
                                    <span className="info-value">
                                        {proveedor.insumos?.length || 0} insumos asignados
                                    </span>
                                </div>
                            </div>

                            {/* Lista de insumos asignados */}
                            {proveedor.insumos && proveedor.insumos.length > 0 && (
                                <div className="mt-2">
                                    <h6 className="info-title">Insumos Asignados:</h6>
                                    <div className="insumos-assigned-list">
                                        {proveedor.insumos.map((insumo, index) => (
                                            <div key={index} className="insumo-assigned-item">
                                                <div className="insumo-info">
                                                    <i className="fas fa-box me-2"></i>
                                                    <span className="insumo-name">{insumo.nombreInsumo}</span>
                                                </div>
                                                <div className="calificacion-info">
                                                    <span className={`badge ${insumo.calificacion === 'Excelente' ? 'bg-success' :
                                                        insumo.calificacion === 'Aceptable' ? 'bg-warning' : 'bg-danger'
                                                        }`}>
                                                        {insumo.calificacion}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
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
                                    {isCreateMode ? 'Crear Proveedor' : 'Actualizar Proveedor'}
                                </>
                            )}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default ProveedorForm;